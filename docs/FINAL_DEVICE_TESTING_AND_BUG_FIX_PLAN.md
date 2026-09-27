# Final Device Testing and Bug Fix Plan

## 1. Purpose and scope

This plan defines the final device-testing and stabilization process for the existing NOVA Android integration. It covers APK construction, installation, Native Module validation, AccessibilityService, NotificationListenerService, OCR, Text-to-Speech, and the existing Environment Adapter. It also defines defect recording, triage, correction, regression testing, and release gates.

This is a testing plan only. It does not add capabilities, change Android permissions, expand the bridge, or alter the current service architecture. MediaProjection and background execution remain outside the acceptance scope of this plan because their existing implementations are not complete runtime flows.

## 2. Test environments

Testing must use two environments because emulator results do not cover all device-specific Android behavior.

| Environment | Purpose | Required baseline |
|---|---|---|
| Android Emulator | Repeatable smoke, bridge, Accessibility, OCR, TTS, and intent tests | Android API 30+; hardware acceleration enabled |
| Physical Android device | OEM behavior, permissions, service lifecycle, notification access, audio, camera, and dialer behavior | Android 11 or later; USB debugging enabled |

The emulator and device must use a debug/development build produced from the same Git revision. Record the Android API level, manufacturer, model, ABI, screen density, build variant, APK checksum, and test date for every run.

## 3. Entry criteria

Testing may begin only after all of the following conditions are met:

1. Android SDK Platform 36, Build Tools 36.0.0, Platform Tools, NDK 27.1.12297006, and CMake are installed.
2. `ANDROID_HOME` or `ANDROID_SDK_ROOT` points to the valid SDK directory.
3. Java 21, Gradle Wrapper 8.14.3, and the locked pnpm dependencies are available.
4. `adb devices` shows the target emulator or device as `device`.
5. `pnpm check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass.
6. Expo prebuild and native-module autolinking resolve `nova-native` and `com.nova.nativebridge.NovaNativeModule`.
7. No unreviewed source change exists after the tested Git revision is recorded.

If an entry criterion fails, classify the run as **TEST BLOCKED**, not as a product defect.

## 4. APK build procedure

### 4.1 Prepare the JavaScript workspace

From the project root:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm test
pnpm build
```

Save the command output as build evidence. The test run must include both the Phase 1 native-module contract tests and the later native-module protocol tests.

### 4.2 Generate the Android project

Run the existing Expo configuration without introducing source changes:

```bash
npx expo prebuild --platform android --no-install
npx expo-modules-autolinking resolve --platform android
```

Confirm that the resolver reports:

```text
package: nova-native
module: com.nova.nativebridge.NovaNativeModule
source: modules/nova-native/android
```

### 4.3 Assemble the APK

```bash
cd android
./gradlew :app:assembleDebug --no-daemon --stacktrace
```

The build is successful only when Gradle completes and produces a debug APK. Record:

- Git commit or checkpoint identifier;
- Gradle and Java versions;
- SDK, Build Tools, NDK, and CMake versions;
- APK path and SHA-256 checksum;
- complete Gradle output or a link to the retained CI artifact.

Do not begin device testing from an APK produced by a failed or partially completed build.

## 5. APK installation and launch

### 5.1 Install

```bash
adb devices
adb install -r <apk-path>
```

If the package is already installed from a different signing key, uninstall only the test installation and reinstall the new debug APK. Do not remove production data during this plan.

### 5.2 Launch smoke check

1. Launch NOVA from the Android launcher.
2. Confirm the Expo control plane renders without a red screen.
3. Confirm no `ClassNotFoundException`, module-registration error, or JNI/native-load error appears in logcat.
4. Kill and relaunch the application.
5. Confirm the app starts again without requiring a clean install.

Capture logcat for the complete sequence:

```bash
adb logcat -c
adb logcat -v threadtime > nova-device-test.log
```

## 6. Native Module validation

### 6.1 Status contract

| Test | Procedure | Expected result |
|---|---|---|
| Module discovery | Launch the development build | `NovaNative` loads without an import or registration error |
| `getStatus()` | Call from the existing client | Valid module name, version, protocol, platform, lifecycle, and capability list |
| `getCapabilities()` | Call independently | Valid capability records with truthful reasons |
| Missing privileged access | Run before enabling services | Capability is not reported as active |
| Process recreation | Force-stop and relaunch | Bridge initializes again without stale state |
| Unsupported environment | Run on a non-Android target if applicable | Safe unavailable-module mapping; no false success |

### 6.2 Bridge error handling

Exercise only existing methods with safe inputs and verify controlled results:

- malformed or unavailable native response;
- Accessibility action requested while the service is disabled;
- invalid application package for `launchApp()`;
- unavailable intent target for camera, gallery, alarm, dialer, or WhatsApp composition;
- invalid OCR base64 input;
- empty TTS text.

The bridge must return a mapped error or a safe failure result. It must never report success when the native operation was not executed.

## 7. AccessibilityService validation

### 7.1 Enablement

1. Record the initial status while Accessibility is disabled.
2. Open Accessibility settings through the existing bridge method.
3. Enable NOVA manually and accept Android’s warning dialog.
4. Return to NOVA and refresh capability status.
5. Confirm status changes only after Android binds the service.

### 7.2 Observation

1. Display a controlled screen containing known labels, buttons, and an input field.
2. Request `getAccessibilitySnapshot()`.
3. Confirm the response contains expected package, class, text, content-description, enabled, clickable, editable, and child information where available.
4. Confirm the bounded traversal terminates on a deep or cyclic-looking hierarchy and does not crash.
5. Confirm screen content is not persisted or transmitted outside the existing explicit bridge call.

### 7.3 Interaction

1. Tap one known test control through the existing `tap()` method.
2. Confirm exactly one visible UI result.
3. Select one known input node and call `inputText()`.
4. Confirm the expected text appears.
5. Disable Accessibility and repeat the calls.
6. Confirm privileged actions fail safely rather than reporting success.

### 7.4 Screenshot

On API 30 or later:

1. Display a controlled test screen.
2. Call `captureScreenshot()`.
3. Confirm a non-empty PNG base64 payload.
4. Decode the payload in the test harness.
5. Confirm image dimensions and basic visual content.
6. Compare the screenshot timestamp and screen state with the visible test screen.

On Android versions below API 30, confirm the capability reports unavailable rather than attempting unsupported capture.

### 7.5 Disablement and lifecycle

1. Disable NOVA in Accessibility settings.
2. Confirm the service disconnects.
3. Confirm `getStatus()` reports disabled/unavailable.
4. Force-stop and relaunch the app.
5. Confirm no privileged action succeeds while the service remains disabled.

## 8. NotificationListenerService validation

### 8.1 Permission and binding

1. Record the initial disabled state.
2. Open notification access settings through the existing bridge method.
3. Enable NOVA manually.
4. Return to NOVA and refresh capabilities.
5. Confirm the service becomes connected only after user enablement.

### 8.2 Test notification

Use a dedicated test application or a controlled test notification. Do not use personal messages or private notifications.

1. Post one test notification.
2. Observe service connection and disconnection logs.
3. Confirm the current implementation does not automatically forward or persist notification content.
4. Disable notification access.
5. Confirm status returns to disabled/unavailable.
6. Restart the app and verify no stale connection is reported.

The expected result is lifecycle correctness and data-boundary correctness. Notification payload transport is not an acceptance criterion because it is not implemented.

## 9. OCR validation

### 9.1 Controlled fixture

Prepare a test screen or image with known text in at least these forms:

- large high-contrast Latin text;
- mixed-case text and numbers;
- light text on a dark background;
- a blank image;
- an invalid image payload.

Do not use personal documents or private screenshots.

### 9.2 OCR sequence

1. Supply a valid PNG base64 payload to `recognizeText()`.
2. Confirm the recognized text and text-block structure are returned.
3. Compare the result with the known fixture using a documented tolerance for whitespace and OCR variation.
4. Send a blank image and confirm a controlled empty result.
5. Send invalid base64 and confirm a controlled mapped error.
6. Capture a screenshot through Accessibility and pass that payload to OCR.
7. Confirm the screenshot-to-OCR chain produces expected text.
8. Repeat on emulator and physical device.
9. Inspect logcat and memory behavior for recognizer or bitmap leaks.

OCR passes only when valid input, invalid input, blank input, and the screenshot-to-OCR chain all behave safely.

## 10. Text-to-Speech validation

1. Confirm the test device has an installed TTS engine and a supported language.
2. Call `speak()` with a short known phrase.
3. Confirm speech begins and completes without an exception.
4. Call `speak()` twice rapidly and verify the documented queue/flush behavior.
5. Test empty and whitespace-only input.
6. Background and foreground the app during speech.
7. Destroy and recreate the app process.
8. Confirm the adapter releases its TTS resource during cleanup.
9. Repeat on the emulator and at least one physical device.

The test must record the selected TTS engine, language, audio route, and whether the result was audible. Automated logs alone cannot prove audible output, so physical observation is required.

## 11. Environment Adapter validation

All Environment Adapter tests must use safe, user-visible flows. They must not send messages, place calls, modify personal data, or silently control another application.

| Adapter action | Test procedure | Expected result |
|---|---|---|
| `launchApp()` | Use a known installed test package | The correct app launch intent opens; invalid package returns safe failure |
| Accessibility settings | Call existing settings method | Android opens Accessibility settings |
| Notification settings | Call existing settings method | Android opens notification access settings |
| WhatsApp composition | Use a test number and non-sensitive message | WhatsApp composition UI opens; no silent send occurs |
| Dialer | Use a test number | Dialer opens with the number; no call is placed automatically |
| Alarm | Use a near-future test time | System alarm UI opens; user remains responsible for final confirmation |
| Camera | Open camera intent | Camera UI opens or safe failure is returned if unavailable |
| Gallery | Open image picker | Picker opens or safe failure is returned if unavailable |

For each action, record the intent result, visible application, returned bridge value, and logcat output. A test fails if the adapter claims success while the target activity did not open.

## 12. Defect recording

Every defect must be recorded immediately in a single issue or defect log. A defect entry must contain:

| Field | Required content |
|---|---|
| Defect ID | Stable identifier such as `NOVA-ANDROID-001` |
| Date and tester | UTC timestamp and tester identity |
| Git revision | Exact source revision and APK checksum |
| Environment | Emulator/device model, API level, ABI, and OS build |
| Test case | Exact plan section and step number |
| Preconditions | Permissions, enabled services, account, and app state |
| Reproduction steps | Minimal deterministic sequence |
| Expected result | Observable requirement |
| Actual result | Exact behavior and user-visible error |
| Logs | Relevant logcat excerpt and attached full log path |
| Severity | Blocker, Critical, Major, Minor, or Cosmetic |
| Frequency | Always, intermittent, or once |
| Privacy impact | Whether screen, notification, audio, or contact data was exposed |
| Owner and status | Assigned person and workflow state |

Do not include real message content, personal notifications, phone numbers, contacts, or private screenshots in the defect log. Replace them with controlled test fixtures.

## 13. Severity and triage rules

| Severity | Definition | Release effect |
|---|---|---|
| Blocker | APK cannot build/install, bridge cannot load, or app cannot launch | Stops all testing and release |
| Critical | Privileged action occurs without user authorization, wrong app is controlled, data leaks, or service state is falsely reported | Stops release and requires immediate fix |
| Major | A required capability fails consistently or causes crash/ANR | Blocks capability sign-off and likely release |
| Minor | Recoverable error, inconsistent status, or limited device-specific failure | Requires fix or explicit acceptance before release |
| Cosmetic | Visual or wording issue without functional or privacy impact | May be deferred with approval |

Privacy and authorization defects are at least **Critical**, even if they occur intermittently.

## 14. Bug-fix workflow

### Step 1: Reproduce

The tester reproduces the defect on the same APK and environment. If reproduction fails, the issue remains open as intermittent and receives additional logging rather than being closed.

### Step 2: Classify

The defect is classified as one of:

- JavaScript or protocol defect;
- Expo autolinking or module-registration defect;
- Gradle or dependency defect;
- Kotlin compile defect;
- Android manifest or permission defect;
- service lifecycle defect;
- device/OEM-specific defect;
- privacy or authorization defect;
- test-environment defect.

A missing SDK, unavailable emulator, or missing physical device is not a product bug. It is a test-environment blocker.

### Step 3: Isolate

Use the smallest affected layer. For example, first validate `getStatus()` before investigating Accessibility callbacks, and validate a direct PNG OCR fixture before investigating screenshot capture. Do not change multiple subsystems in a single bug-fix patch unless the defect requires it.

### Step 4: Fix without scope expansion

The fix must address the reported behavior without adding a new capability or silently weakening a permission boundary. Each fix must preserve truthful status reporting and user-mediated Android settings.

### Step 5: Run targeted checks

Run the smallest relevant check first:

```bash
pnpm check
pnpm test -- tests/native-module.phase1.test.ts tests/native-module.phase8.test.ts
```

For native changes, then run:

```bash
cd android
./gradlew :app:assembleDebug --no-daemon
```

Install the newly generated APK and repeat the failing test case.

### Step 6: Run the full regression suite

After the targeted test passes, run:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
cd android
./gradlew :app:assembleDebug --no-daemon
```

Then repeat the smoke sequence and the complete capability regression matrix on the affected emulator and physical device.

### Step 7: Review and close

A defect may be closed only when:

1. the original reproduction no longer fails;
2. the targeted automated checks pass;
3. the full JavaScript and Android build checks pass;
4. the affected device test passes;
5. no privacy, authorization, lifecycle, or logging regression is observed;
6. the defect record contains evidence and the tested revision.

## 15. Regression matrix

| Area | Emulator | Physical device | Required before sign-off |
|---|---:|---:|---:|
| APK install and launch | Yes | Yes | Both pass |
| `getStatus()` / `getCapabilities()` | Yes | Yes | Both pass |
| Expo bridge process recreation | Yes | Yes | Both pass |
| Accessibility enablement and disablement | Yes | Yes | Both pass |
| UI hierarchy snapshot | Yes | Yes | Both pass |
| Tap and text input | Yes | Yes | Both pass |
| API 30+ screenshot | Yes | Yes | Both pass |
| Notification listener binding | Yes | Yes | Both pass |
| Notification content boundary | Yes | Yes | Both pass |
| OCR fixture | Yes | Yes | Both pass |
| Screenshot-to-OCR | Yes | Yes | Both pass |
| Text-to-Speech | Yes | Yes | Audible physical-device pass required |
| App launch and safe intent flows | Yes | Yes | Both pass |
| WhatsApp composition without silent send | Optional | Required if feature is enabled for release | No unauthorized send |
| Dialer without automatic call | Optional | Required if feature is enabled for release | No unauthorized call |
| Camera and gallery intents | Yes | Yes | Both pass |
| Logcat and error mapping | Yes | Yes | No uncaught native errors |

## 16. Final stabilization gate

NOVA is ready for the next controlled release only when the APK builds from a clean revision, installs on the target emulator and physical device, the Native Module returns truthful status, the required service and bridge tests pass, no Blocker or Critical defects remain open, and all Major defects have been fixed or explicitly accepted.

No capability may be described as device-tested based only on TypeScript tests, Expo autolinking, or source inspection. The final report must include the tested APK checksum, device matrix, defect summary, unresolved risks, and exact Git revision.

## References

[1]: https://developer.android.com/tools/adb "Android Debug Bridge"

[2]: https://developer.android.com/studio/run/emulator "Run apps on the Android Emulator"

[3]: https://developer.android.com/reference/android/accessibilityservice/AccessibilityService "Android AccessibilityService API reference"

[4]: https://developer.android.com/reference/android/service/notification/NotificationListenerService "Android NotificationListenerService API reference"

[5]: https://developers.google.com/ml-kit/vision/text-recognition/android "ML Kit text recognition for Android"

[6]: https://developer.android.com/media/grow/media-projection "Android Media projection"
