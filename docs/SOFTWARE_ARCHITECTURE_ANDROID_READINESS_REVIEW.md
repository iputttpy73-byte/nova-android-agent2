# Software Architecture and Android Readiness Review

## 1. Review scope

This review inspects the current Android source tree and Expo native-module integration without relying on a device or Android runtime. It covers:

- Android project wiring;
- Gradle and Kotlin configuration;
- Expo module registration;
- AndroidManifest declarations;
- AccessibilityService;
- NotificationListenerService;
- OCR and ML Kit;
- Text-to-Speech;
- Environment Adapter;
- capability reporting;
- Android 11+ and Android 14+ compatibility risks.

This review does not redesign the architecture, add capabilities, expand permissions, change the bridge protocol, implement MediaProjection consent flow, or implement autonomous background execution.

## 2. Overall conclusion

The project has a coherent Expo Modules architecture and the source tree is organized around the intended boundary:

```text
Expo application
    -> TypeScript nova-native client
    -> Expo Modules API
    -> NovaNativeModule
    -> Android services and adapters
```

The Expo registration path is structurally correct. The module class name, Kotlin package, local module configuration, generated Android project, and TypeScript client agree with one another. The Gradle files also use the expected Expo SDK 54 and React Native 0.81 project wiring.

The static review found **three high-priority source issues** that should be corrected before the first successful Android compile/runtime cycle:

1. The Accessibility service configuration does not declare `canRetrieveWindowContent`, even though the service reads `rootInActiveWindow` and serializes the UI tree.
2. The Accessibility service configuration does not declare `canPerformGestures`, even though the service calls `dispatchGesture()`.
3. The Accessibility implementation uses the hidden/test-only `AccessibilityNodeInfo.getSourceNodeId()` API through `sourceNodeId`, creating a compile/API-compatibility risk.

The review also found several medium and low risks involving lifecycle cleanup, truthful capability reporting, intent result handling, and generated app permissions. None of these require an architecture change.

## 3. Component inventory

| Component | Location | Static assessment |
|---|---|---|
| Expo native module registration | `modules/nova-native/expo-module.config.json` | Correctly points to `com.nova.nativebridge.NovaNativeModule` |
| Kotlin module entry point | `NovaNativeModule.kt` | Correct class/package and Expo ModuleDefinition structure |
| Local Android library | `modules/nova-native/android/build.gradle` | Correct Expo module plugin and pinned direct dependencies |
| TypeScript bridge | `modules/nova-native/src/*` | Protocol and client types align with current Kotlin methods |
| Accessibility service | `NovaAccessibilityService.kt` | Source exists, but XML capabilities are incomplete |
| Notification listener | `NovaNotificationListenerService.kt` | Correct lifecycle shell; content transport intentionally absent |
| OCR | `NovaOcrAdapter.kt` | ML Kit adapter exists; lifecycle/cancellation hardening is needed |
| Text-to-Speech | `NovaSpeechAdapter.kt` | Adapter exists; initialization and module cleanup are incomplete |
| Environment Adapter | `NovaEnvironmentAdapter.kt` | User-mediated intents exist; result/error handling is optimistic |
| WorkManager | `NovaDeferredWork.kt` | Foundation only; execution intentionally not implemented |
| MediaProjection | `NovaProjectionService.kt` | Foreground-service shell only; consent flow intentionally absent |

## 4. Android project and Expo wiring

### 4.1 `settings.gradle`

The generated settings file uses React Native Gradle plugin resolution, Expo Modules autolinking, Expo’s version catalog, and the Expo Gradle plugin. The project includes only `:app`; Expo modules are incorporated through `expoAutolinking.useExpoModules()` rather than manual application-module inclusion.

This is the correct model for a local Expo module. `MainApplication.kt` does not need a manually added package for `NovaNativeModule` because it is an Expo Module and is registered through Expo autolinking.

**Assessment: No issue found.**

### 4.2 `android/app/build.gradle`

The application module:

- applies the Android application, Kotlin Android, and React Native plugins;
- uses Expo’s `export:embed` bundle command;
- delegates SDK and NDK versions to the Expo root project;
- enables the New Architecture;
- uses Hermes;
- declares application ID `com.app.aitaskorchestrator`;
- retains the generated debug signing configuration.

The Kotlin package `com.nova.nativebridge` is intentionally different from the application ID. This is valid because the native module is a library namespace and is registered by its fully qualified module class name.

**Assessment: No package-name mismatch found.**

### 4.3 Local module Gradle file

`modules/nova-native/android/build.gradle` applies:

```groovy
com.android.library
kotlin-android
expo-module-gradle-plugin
```

It declares:

```groovy
androidx.work:work-runtime-ktx:2.9.1
com.google.mlkit:text-recognition:16.0.1
```

The Expo module plugin supplies the host project’s Android configuration. The module’s explicit `google()` and `mavenCentral()` repositories are sufficient for the two direct dependencies.

**Assessment: No static Gradle wiring blocker found.**

### 4.4 Expo module configuration

`expo-module.config.json` registers:

```json
{
  "platforms": ["android"],
  "android": {
    "modules": ["com.nova.nativebridge.NovaNativeModule"]
  }
}
```

The registration agrees with the Kotlin package and class declaration. The generated autolinking output and prior prebuild check also identify the local package and module class.

**Assessment: No registration mismatch found.**

## 5. AndroidManifest review

### 5.1 Native module manifest

The local module manifest declares:

- `android.permission.FOREGROUND_SERVICE`;
- `android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION`;
- `NovaAccessibilityService` with `BIND_ACCESSIBILITY_SERVICE`;
- `NovaNotificationListenerService` with `BIND_NOTIFICATION_LISTENER_SERVICE`;
- non-exported `NovaProjectionService` with `foregroundServiceType="mediaProjection"`.

The service names use the local module namespace `com.nova.nativebridge`, which matches the Gradle namespace and Kotlin package.

**Assessment: Service names and binding permissions are structurally consistent.**

### 5.2 Application manifest

The generated app manifest contains the expected Expo and application declarations. It also includes `POST_NOTIFICATIONS`, which is relevant to app-level notifications and does not replace the special user-enabled notification-listener access.

The generated manifest includes `FOREGROUND_SERVICE_MEDIA_PLAYBACK` for Expo video playback. This is separate from the native module’s MediaProjection service declaration and does not indicate that MediaProjection is implemented.

The application manifest also contains legacy or broad permissions such as `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `RECORD_AUDIO`, and `SYSTEM_ALERT_WINDOW`. These are not required by the reviewed native module paths as currently written. They should be reviewed as an application-permission hygiene item, but this review does not remove them because they may be generated or required by other existing Expo configuration.

**Assessment: No missing registration was found for the reviewed services. Permission minimization is a separate low-priority cleanup.**

## 6. Findings and prioritized fixes

### AND-STATIC-001 — Missing `canRetrieveWindowContent`

- **Severity:** High
- **Category:** Runtime correctness / Accessibility configuration
- **Location:** `modules/nova-native/android/src/main/res/xml/nova_accessibility_service.xml:2-6`
- **Evidence:** `NovaAccessibilityService.snapshotRoot()` reads `rootInActiveWindow` and recursively serializes child nodes, but the XML does not set `android:canRetrieveWindowContent="true"`.
- **Impact:** Android may bind the service without granting the window-content capability. `rootInActiveWindow` can remain unavailable, making UI hierarchy observation return null or incomplete data.
- **Smallest fix:** Add this attribute to the existing XML configuration:

```xml
android:canRetrieveWindowContent="true"
```

- **Architecture impact:** None.
- **Permission expansion:** None beyond the already declared Accessibility service capability.
- **Reference:** Android’s AccessibilityService guide states that this attribute is required when a service needs to inspect the UI hierarchy [1].

### AND-STATIC-002 — Missing `canPerformGestures`

- **Severity:** High
- **Category:** Runtime correctness / Accessibility configuration
- **Location:** `modules/nova-native/android/src/main/res/xml/nova_accessibility_service.xml:2-6`
- **Evidence:** `NovaAccessibilityService.performTap()` calls `dispatchGesture()`, but the XML does not set `android:canPerformGestures="true"`.
- **Impact:** Tap dispatch can be rejected or unavailable even when the service is enabled.
- **Smallest fix:** Add this attribute to the existing XML configuration:

```xml
android:canPerformGestures="true"
```

- **Architecture impact:** None.
- **Permission expansion:** None beyond the existing user-enabled Accessibility service.
- **Reference:** Android’s AccessibilityService guide requires this attribute for programmatic gestures [1].

### AND-STATIC-003 — Use of hidden/test-only `sourceNodeId`

- **Severity:** High
- **Category:** Compile-time and API-compatibility risk
- **Location:** `NovaAccessibilityService.kt:94` and `NovaAccessibilityService.kt:107`
- **Evidence:** The implementation compares and serializes `node.sourceNodeId`. Android’s AOSP source marks `getSourceNodeId()` as `@hide`, `@UnsupportedAppUsage`, and `@TestApi`, rather than as a normal public SDK API [2].
- **Impact:** The Android SDK stubs may reject compilation, or the implementation may depend on a non-public API that is not stable across SDK versions. This also creates a risk of hidden-API enforcement on device.
- **Smallest fix:** Replace the hidden source-node identifier with a public, stable node identity strategy. The minimal option is to serialize a public identifier such as `viewIdResourceName` when present and perform text/class/package-based lookup for the explicit input action. If a stable node handle is required, introduce a bounded in-memory public-node mapping owned by the service rather than reading hidden framework state.
- **Architecture impact:** None if the replacement remains internal to the service.
- **Protocol impact:** Do not change the existing bridge protocol; keep the existing numeric field only if it is treated as an opaque service-generated handle rather than an Android `sourceNodeId`.

### AND-STATIC-004 — TTS adapter is never shut down by module lifecycle

- **Severity:** Medium
- **Category:** Resource lifecycle
- **Location:** `NovaNativeModule.kt:15` and `NovaSpeechAdapter.kt:22`
- **Evidence:** `NovaSpeechAdapter` exposes `shutdown()`, but `NovaNativeModule` does not call it. The Expo Modules API provides an `OnDestroy` module-definition hook [3].
- **Impact:** The TTS engine may retain native resources across module teardown or development reloads. Repeated reloads can create stale audio engine instances.
- **Smallest fix:** Register an `OnDestroy` callback in the existing `ModuleDefinition` and call `speech.shutdown()` only if the lazy adapter was initialized.
- **Architecture impact:** None.
- **Permission impact:** None.

### AND-STATIC-005 — TTS readiness ignores language availability

- **Severity:** Medium
- **Category:** Truthful status and runtime reliability
- **Location:** `NovaSpeechAdapter.kt:11-14`
- **Evidence:** The adapter marks `ready` solely from `TextToSpeech.SUCCESS`, then assigns `Locale.getDefault()` without checking the return value of `tts.language`.
- **Impact:** `speak()` can return `true` when the engine initialized but the selected locale is missing or unsupported. This violates the project requirement that capability and action results remain truthful.
- **Smallest fix:** Set `ready` only when initialization succeeds and the selected locale is not `LANG_MISSING_DATA` or `LANG_NOT_SUPPORTED`. Keep `speak()` returning `false` when the language is unavailable.
- **Architecture impact:** None.

### AND-STATIC-006 — OCR coroutine cancellation and bitmap cleanup are incomplete

- **Severity:** Medium
- **Category:** Resource lifecycle and asynchronous error handling
- **Location:** `NovaOcrAdapter.kt:15-36`
- **Evidence:** `suspendCancellableCoroutine` is used without cancellation handling. The ML Kit listeners can run after cancellation, and the recognizer task is not cancelled. Bitmap cleanup occurs only in success/failure callbacks.
- **Impact:** A cancelled bridge call can leave work running, retain a bitmap longer than necessary, or attempt to resume an already-cancelled continuation. Repeated OCR requests can increase memory pressure.
- **Smallest fix:** Register cancellation cleanup on the returned ML Kit task, guard continuation completion, and move bitmap recycling into a single completion path that runs for success, failure, and cancellation.
- **Architecture impact:** None.
- **Dependency change:** None.

### AND-STATIC-007 — Screenshot executor is created per request and never shut down

- **Severity:** Medium
- **Category:** Resource lifecycle
- **Location:** `NovaAccessibilityService.kt:71-89`
- **Evidence:** `Executors.newSingleThreadExecutor()` is allocated on every screenshot request and no shutdown is performed.
- **Impact:** Repeated screenshot requests can leak executor threads and prevent clean service teardown.
- **Smallest fix:** Store one service-scoped executor and shut it down in `onDestroy()`, or create a one-shot executor and shut it down in every callback and cancellation path.
- **Architecture impact:** None.

### AND-STATIC-008 — Accessibility node objects are not consistently recycled

- **Severity:** Medium
- **Category:** Android resource management
- **Location:** `NovaAccessibilityService.kt:48-116`
- **Evidence:** Recursive calls to `getChild()` create node objects. `findNodeById()` and `serializeNode()` do not recycle obtained child nodes after use.
- **Impact:** On older Android versions and large hierarchies, repeated snapshots can increase native object retention and memory pressure.
- **Smallest fix:** Recycle child nodes in `finally` blocks after each recursive operation, while preserving the root node ownership rules documented by Android. Avoid recycling a node that is returned for the immediate action path until the action completes.
- **Architecture impact:** None.
- **Reference:** Android’s AccessibilityService guide recommends recycling obtained node objects [1].

### AND-STATIC-009 — Capability inspector reports unavailable features as available

- **Severity:** High
- **Category:** Truthful capability reporting
- **Location:** `NovaCapability.kt:39-47`
- **Evidence:** The inspector reports `OCR`, `FOREGROUND_SESSION`, and `DEFERRED_WORK` with `available=true` and `reason=NONE` regardless of dependency initialization, service state, or actual task implementation. It reports `TEXT_TO_SPEECH`, `CAMERA`, `GALLERY`, and `PHONE_CALL` as not implemented even though source-level adapters or user-mediated intents exist.
- **Impact:** The status API can mislead the Agent Core and UI. In particular, `DEFERRED_WORK` is marked available although `NovaDeferredWork.doWork()` is intentionally a no-op, and OCR is marked available even if ML Kit cannot initialize.
- **Smallest fix:** Align each status with the existing implementation boundary:
  - report OCR as available only after the adapter/dependency path is usable, otherwise use a truthful unavailable reason;
  - report deferred work as `NOT_IMPLEMENTED` until it executes a real durable task;
  - classify TTS, camera, gallery, and dialer consistently with the existing user-mediated source paths, or explicitly document that the capability means “bridge intent exists” rather than “action completed.”
- **Architecture impact:** None.
- **Protocol impact:** None; only status values change.

### AND-STATIC-010 — Accessibility and notification status use package substring matching

- **Severity:** Medium
- **Category:** State correctness and package identity
- **Location:** `NovaCapability.kt:55-58` and `NovaCapability.kt:75-78`
- **Evidence:** Enabled-service settings are checked using `.contains(context.packageName)`.
- **Impact:** Substring matching can produce false positives if another package name contains the application package string. It also does not distinguish the exact component that is enabled.
- **Smallest fix:** Parse the colon-delimited enabled-service component names and compare the exact `ComponentName` for `NovaAccessibilityService` and `NovaNotificationListenerService`.
- **Architecture impact:** None.

### AND-STATIC-011 — Notification capability does not use actual listener connection state

- **Severity:** Medium
- **Category:** Lifecycle truthfulness
- **Location:** `NovaNotificationListenerService.kt:8-18` and `NovaCapability.kt:70-87`
- **Evidence:** The service tracks `connected`, but `NovaCapabilityInspector` reports `serviceEnabled` solely from secure settings.
- **Impact:** Status can report enabled while the system has not connected the service or after a transient disconnect.
- **Smallest fix:** Keep the settings state as permission/access state, but use `NovaNotificationListenerService.connected` for `serviceEnabled` when the process is present. Preserve a distinct reason for user-enabled but currently disconnected state.
- **Architecture impact:** None.

### AND-STATIC-012 — Environment Adapter assumes `startActivity()` succeeded

- **Severity:** Medium
- **Category:** Intent execution truthfulness
- **Location:** `NovaEnvironmentAdapter.kt:10-60`
- **Evidence:** Several methods call `context.startActivity()` and immediately return `true`. An `ActivityNotFoundException` or missing handler becomes an exception that the TypeScript layer converts to a generic fallback.
- **Impact:** The native method does not provide a precise false result for unavailable handlers. This weakens defect diagnosis and can make a caller believe the intent was accepted when it was not.
- **Smallest fix:** Resolve each intent before starting it and return `false` when no handler exists. Catch only the expected `ActivityNotFoundException` at the adapter boundary.
- **Architecture impact:** None.

### AND-STATIC-013 — WhatsApp composition is not constrained to WhatsApp

- **Severity:** Low
- **Category:** Intent target correctness
- **Location:** `NovaEnvironmentAdapter.kt:26-30`
- **Evidence:** The method uses a generic `ACTION_VIEW` HTTPS `wa.me` URI without setting or verifying a WhatsApp package.
- **Impact:** The browser or another capable application may open, while the method returns `true`. The method is therefore “open a WhatsApp-compatible URL” rather than “open WhatsApp.”
- **Smallest fix:** Resolve the intent against an explicitly selected WhatsApp package or rename/document the behavior as a generic user-mediated web composition flow. Preserve the existing no-silent-send boundary.
- **Architecture impact:** None.

### AND-STATIC-014 — Release build uses the debug signing key

- **Severity:** High for release deployment; Low for debug validation
- **Category:** Deployment security
- **Location:** `android/app/build.gradle:100-115`
- **Evidence:** The `release` build type uses `signingConfigs.debug`.
- **Impact:** A release APK would be signed with the debug key and must not be treated as production-ready. It can also prevent normal upgrade/signing ownership workflows.
- **Smallest fix:** Keep the debug signing configuration for local debug builds, but require a separately managed release keystore before any release build or distribution. Do not commit credentials or keystore files.
- **Architecture impact:** None.

## 7. Compatibility review

### Android 11 and later

The following source paths are guarded or compatible in principle:

- `takeScreenshot()` is guarded with `Build.VERSION.SDK_INT >= Build.VERSION_CODES.R`.
- `startForeground(..., FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)` is guarded for Android Q and later.
- The app minimum SDK is 24, so the guarded API calls do not create an obvious direct class-loading issue.
- Accessibility hierarchy access still depends on the missing `canRetrieveWindowContent` declaration.

The hidden `sourceNodeId` access is the main unresolved API-stability risk for the Accessibility path.

### Android 14 and later

The native module declares the MediaProjection foreground-service permission and service type. However, the existing projection implementation is intentionally only a service shell. It does not request the user consent token or create a virtual display. It must remain reported as incomplete.

The application manifest includes notification permission at the app level, but the NotificationListenerService still requires the user to enable notification access separately. These are different permission mechanisms.

Foreground services that display notifications may be affected by notification permission behavior. The service must not be considered validated until the user-mediated lifecycle is tested on Android 14 or later.

### Kotlin and Expo Modules API

The local Expo Modules Core source contains the `AsyncFunctionBuilder.Coroutine` extension used by `NovaNativeModule.kt`, so the current `AsyncFunction("...") Coroutine { ... }` form is consistent with the installed Expo Modules API.

`OnDestroy` is also available in the installed Expo Modules API and is the appropriate minimal hook for closing TTS resources.

**Assessment: No Kotlin syntax mismatch was found by source comparison, but actual compilation remains the final authority.**

## 8. Issues not classified as blockers

The following were reviewed and do not currently justify a blocker classification:

- The difference between application ID `com.app.aitaskorchestrator` and native module namespace `com.nova.nativebridge` is valid.
- Manual registration in `MainApplication.kt` is not required for an Expo Module registered through `expo-module.config.json`.
- The WorkManager worker returning `Result.success()` is an intentional foundation boundary, not a hidden autonomous execution feature.
- The MediaProjection foreground-service shell is intentionally incomplete and does not claim active capture.
- The TypeScript client’s safe fallback behavior is conservative, although it reduces diagnostic detail for action failures.
- The direct ML Kit dependency declaration is structurally valid; artifact resolution and compilation still require the actual Android build.

## 9. Recommended fix order

The smallest safe stabilization order is:

1. Add `canRetrieveWindowContent` and `canPerformGestures` to the existing Accessibility XML.
2. Replace `sourceNodeId` usage with a public or service-generated node handle strategy.
3. Correct capability status values so they reflect actual implementation boundaries.
4. Add exact component matching for enabled Accessibility and notification services.
5. Add TTS `OnDestroy` cleanup and language-availability validation.
6. Add OCR cancellation and bitmap cleanup.
7. Reuse or close screenshot executors and recycle obtained Accessibility nodes.
8. Make Environment Adapter intent results truthful.
9. Review obsolete or broad app-level permissions separately.
10. Keep release signing changes outside debug validation and configure them before distribution.

No architecture change is required for this order.

## 10. Final readiness assessment

The source tree is **architecturally coherent but not yet static-ready for a low-risk Android compile/runtime pass** because findings AND-STATIC-001, AND-STATIC-002, AND-STATIC-003, and AND-STATIC-009 can directly affect Accessibility operation, compilation/API compatibility, and truthful capability reporting.

The project does not need a redesign. The smallest safe path is to apply the targeted fixes above, rerun static checks, then perform the first real Android compilation and runtime validation.

## References

[1]: https://developer.android.com/guide/topics/ui/accessibility/service "Create an accessibility service"

[2]: https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/master/core/java/android/view/accessibility/AccessibilityNodeInfo.java "Android Open Source Project AccessibilityNodeInfo source"

[3]: https://docs.expo.dev/modules/module-api/ "Expo Modules API"

[4]: https://developers.google.com/ml-kit/vision/text-recognition/android "ML Kit text recognition for Android"

[5]: https://developer.android.com/media/grow/media-projection "Android Media projection"
