# Native Android Validation Phase 1 Report

## 1. Executive Summary

**Validation outcome:** The Native Android execution path is **not ready for implementation or device testing**.

The repository contains a useful architectural foundation: Kotlin contracts, planned module names, an IPC boundary, security contracts, and a Manifest plan. However, it does not contain a buildable Android project, an active Android manifest, an Expo native module, an Android service implementation, or a device-testable development build.

No subsystem is classified as `READY`. `BLOCKED` means that the capability cannot be exercised from the current Expo workflow until the required native migration is performed. `NOT_READY` means that the platform path is viable in principle, but the project is missing implementation or build artifacts. This report does not implement any functionality.

## 2. Scope and Rules Applied

This validation covers the project at `/home/ubuntu/ai-task-orchestrator`, the `native-android` foundation, the Expo configuration, and the official Android and Expo requirements relevant to the requested native services.

The following were explicitly not created or changed:

- `AccessibilityService` implementation.
- `NotificationListenerService` implementation.
- `MediaProjection` implementation.
- Android device-control implementation.
- OCR or screenshot pipeline.
- WorkManager worker implementation.
- Foreground service implementation.
- Active Android manifest.
- Native bridge registration or IPC transport.

## 3. Evidence Inventory

### 3.1 Present artifacts

The `native-android` directory contains:

| Artifact | Finding |
|---|---|
| `settings.gradle.kts` | A module-name map only; it intentionally defers Android Gradle wiring. |
| `nova-contracts` | Kotlin data types for requests, results, capabilities, and errors. |
| `nova-bridge` | Kotlin bridge interfaces only. |
| `nova-ipc` | IPC contract interfaces only. |
| `nova-security` | Security contract interfaces only. |
| `nova-environment` | Environment Adapter contracts only. |
| `nova-accessibility` | Accessibility contracts only. |
| `nova-notifications` | Notification listener contracts only. |
| `nova-projection` | MediaProjection contracts only. |
| `nova-foreground` | Foreground-session contracts only. |
| `nova-work` | Deferred-work contracts only. |
| `nova-observability` | Audit and health contracts only. |
| Documentation | README, Manifest plan, IPC architecture, and the previous foundation report. |

### 3.2 Missing artifacts

No active Android project files were found under the application or `native-android` tree. In particular, the following are missing:

- Root `build.gradle` or `build.gradle.kts`.
- Root `gradle.properties`.
- Gradle wrapper: `gradlew`, `gradlew.bat`, and `gradle/wrapper/*`.
- Android settings wired to actual module directories.
- `build.gradle(.kts)` for every declared native module.
- Android application module containing the Expo host activity.
- `AndroidManifest.xml`.
- Accessibility service metadata XML under `res/xml`.
- Android string, notification-channel, and service resources.
- Concrete Kotlin service classes.
- Expo Modules API registration and JavaScript-facing module definition.
- Serialization adapters for bridge envelopes.
- Binder/service connection implementations.
- WorkManager dependency and `Worker`/`CoroutineWorker` classes.
- Foreground service class and notification-channel implementation.
- MediaProjection consent/activity-result flow.
- Physical-device test project and instrumentation tests.
- Debug/release signing and native build profiles.

## 4. Status Definitions

| Status | Meaning in this report |
|---|---|
| `READY` | The subsystem has the required source, build wiring, manifest/configuration, and a testable path. |
| `NOT_READY` | The platform path is viable, but required project artifacts or implementation are missing. |
| `BLOCKED` | The current Expo workflow cannot exercise the subsystem; native migration and a custom development/native build are prerequisites. This is a workflow blocker, not a claim that Android cannot support the capability. |

## 5. Readiness Matrix

| Subsystem | Status | Primary reason |
|---|---|---|
| Native Android project structure | `NOT_READY` | Module directories and a settings map exist, but there is no buildable Android application or Gradle module configuration. |
| Kotlin module architecture | `NOT_READY` | Contracts exist, but modules have no Android/Kotlin Gradle plugins, dependencies, source-set wiring, or compiled artifacts. |
| AndroidManifest requirements | `NOT_READY` | Only a planning document exists; no active manifest or service declarations exist. |
| AccessibilityService | `BLOCKED` | The current Expo workflow has no custom native service, manifest declaration, metadata XML, or user-enabled device service. |
| NotificationListenerService | `BLOCKED` | The current Expo workflow has no native listener, manifest declaration, filtering policy implementation, or user-approved listener on a physical device. |
| MediaProjection | `BLOCKED` | The current Expo workflow has no consent activity flow, projection service, foreground-service type, or capture implementation. |
| WorkManager | `NOT_READY` | A contract exists, but no AndroidX WorkManager dependency, worker class, scheduler, or instrumentation test exists. |
| Foreground Service | `BLOCKED` | There is no native service or manifest, and Android 14+ requires type-specific declarations and permissions for applicable service types. |
| Native Bridge | `NOT_READY` | Kotlin bridge interfaces exist, but no Expo Module, serialization, registration, lifecycle binding, or event transport exists. |

**Overall readiness:** `NOT_READY` for the native migration; no subsystem is `READY`.

## 6. Subsystem Assessments

### 6.1 Native Android project structure — `NOT_READY`

The directory structure is a design-time module map, not an Android project. `settings.gradle.kts` includes the planned modules but does not provide a root build configuration, plugin management, repositories, Android application module, or module build files.

The next implementation must choose one coherent layout:

1. A local Expo module under the Expo project, backed by the Expo Modules API and included in the generated Android application; or
2. A deliberate bare/prebuilt Android application with the native modules wired into the generated Android project; or
3. A separately buildable native Android application with a defined bridge to the Expo UI.

The existing files do not yet make that choice executable.

### 6.2 Kotlin module architecture — `NOT_READY`

The module boundaries are reasonable at the contract level. The Kotlin files define typed envelopes, capability states, service ports, security contracts, and lifecycle shapes. They are not compilable as a multi-module Android build because the modules lack `build.gradle(.kts)` files, dependencies, source-set configuration, package visibility, and test source sets.

The generic `NativeRequestEnvelope<Any>` shape in the bridge also needs a concrete serialization strategy before it can cross the JavaScript/native boundary. A production bridge must define a stable JSON/JS value schema, protocol version negotiation, request expiry, idempotency, error mapping, and event subscription behavior.

### 6.3 AndroidManifest — `NOT_READY`

`native-android/docs/ANDROID_MANIFEST_PLAN.md` is explicitly planning-only. No manifest declaration is active.

The eventual manifest must be generated through Expo config plugins or maintained in the chosen native project. The plan must be converted into versioned, feature-specific declarations only when the corresponding implementation exists. Declaring a service or permission is not evidence that the capability works.

Expected declarations include:

| Capability | Required declaration or configuration | Current state |
|---|---|---|
| Accessibility | Service with `android.permission.BIND_ACCESSIBILITY_SERVICE`, accessibility-service intent, and accessibility metadata XML | Missing; not implemented. |
| Notifications | Service with `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`, notification listener intent, and filtering configuration | Missing; not implemented. |
| MediaProjection | Foreground service declaration with `mediaProjection` type for applicable target APIs, plus required permissions and consent flow | Missing; not implemented. |
| Foreground work | `FOREGROUND_SERVICE` and type-specific permission/declaration where applicable | Missing; not implemented. |
| WorkManager | No broad runtime permission by itself; requires AndroidX dependency, worker classes, constraints, and scheduling | Missing; not implemented. |
| NOVA notifications | `POST_NOTIFICATIONS` where user-visible app notifications are required | Present in Expo config, but this does not enable any native service. |

### 6.4 AccessibilityService — `BLOCKED`

Android requires an AccessibilityService to be declared as a service that handles the `android.accessibilityservice.AccessibilityService` intent and requests `android.permission.BIND_ACCESSIBILITY_SERVICE`. Android manages its lifecycle, and the user must explicitly enable the service in device settings. A configuration may also be supplied through accessibility-service metadata.

Current state:

- The project has only `AccessibilityContracts.kt`.
- No class extends `AccessibilityService`.
- No manifest declaration exists.
- No accessibility-service metadata XML exists.
- No user enablement/settings flow exists.
- No physical-device verification exists.
- No hierarchy reading or action execution exists.

Therefore this is `BLOCKED` in the current Expo workflow and `NOT_READY` as an implementation. It must not be represented as connected or available in the UI.

### 6.5 NotificationListenerService — `BLOCKED`

Android requires a concrete `NotificationListenerService` declaration with `BIND_NOTIFICATION_LISTENER_SERVICE` and the `android.service.notification.NotificationListenerService` intent. The implementation must wait for `onListenerConnected()` before operating and handle disconnection safely.

Current state:

- The project has only `NotificationContracts.kt`.
- No listener class exists.
- No manifest declaration exists.
- No notification filter implementation exists.
- No user approval/status flow exists.
- No redaction or retention implementation exists.
- No physical-device test exists.

The capability is therefore blocked until a custom native build, manifest configuration, user approval flow, and device validation exist.

### 6.6 MediaProjection — `BLOCKED`

MediaProjection requires explicit user consent for each projection session. For apps targeting Android 14 or higher, the manifest must include `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PROJECTION`, and the service must declare `android:foregroundServiceType="mediaProjection"`. The projection token/session lifecycle must also be handled correctly; Android 14 restricts reusing the consent intent or the same projection instance for multiple virtual-display creation calls.

Current state:

- `ProjectionContracts.kt` exists only as an interface/data-model boundary.
- No consent activity/result flow exists.
- No MediaProjection manager exists.
- No foreground projection service exists.
- No manifest or service type is declared.
- No capture surface, frame lifecycle, teardown, or redaction exists.
- No Android 14+ physical-device test exists.

This is blocked under the current Expo workflow and not ready for capture implementation.

### 6.7 WorkManager — `NOT_READY`

WorkManager is a viable Android background-work path, but it is not present in the project. Android’s model requires a WorkRequest, a concrete Worker/CoroutineWorker, enqueueing through WorkManager, and explicit constraints/retry behavior. The existing `DeferredWorkPort` is a contract only.

Missing items:

- AndroidX WorkManager dependency.
- Worker or CoroutineWorker implementation.
- Input/output serialization.
- Network, charging, idle, battery, and retry policy mapping.
- Unique work/idempotency policy.
- Cancellation and process-restart behavior.
- WorkManager instrumentation tests on an Android device/emulator.

No background work is currently scheduled or executed.

### 6.8 Foreground Service — `BLOCKED`

Foreground services are intended for user-noticeable work and must show a status-bar notification. For apps targeting Android 14 or higher, the service must declare the appropriate `android:foregroundServiceType` and matching type-specific permission, and runtime prerequisites must be satisfied before starting the service. Android may raise a security or missing-type exception when these requirements are absent.

Current state:

- `ForegroundContracts.kt` exists only as a port.
- No `Service` subclass exists.
- No notification channel or persistent notification exists.
- No manifest service declaration exists.
- No type-specific permission decision exists.
- No start/stop/background-start policy exists.
- No user-visible lifecycle or emergency-stop implementation exists.

The service is blocked until the native project and an approved, feature-specific foreground-service use case are available.

### 6.9 Native Bridge — `NOT_READY`

The bridge contracts define a good conceptual boundary between Expo UI and future native services. However, the project has no Expo Modules API module, no JavaScript-facing registration, no native module package, no event publisher, and no serialization adapter.

Missing bridge work includes:

- Local Expo module scaffold or equivalent native module package.
- Kotlin module definition and registration.
- JavaScript/TypeScript API with stable request/result schemas.
- Mapping between JS values and Kotlin envelopes.
- Lifecycle-aware service connection and reconnection.
- Event subscription and cleanup.
- Protocol and capability negotiation.
- Error mapping for permission, consent, disabled service, timeout, and unsupported states.
- Native build integration and device tests.

## 7. Permission and Manifest Gap Analysis

The current Expo configuration declares `POST_NOTIFICATIONS` only. That permission concerns app notifications and does not grant access to AccessibilityService, NotificationListenerService, MediaProjection, or foreground services.

The following declarations are absent from the active project and must remain absent until feature implementation and policy review:

| Declaration | Reason needed | Current state |
|---|---|---|
| `android.permission.BIND_ACCESSIBILITY_SERVICE` | Allows only the system to bind the declared accessibility service | Missing; service not implemented. |
| `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE` | Protects the notification listener service binding | Missing; listener not implemented. |
| `android.permission.FOREGROUND_SERVICE` | Base foreground service permission | Missing from active native project. |
| `android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION` | Required for mediaProjection foreground service type on current Android requirements | Missing; projection not implemented. |
| Type-specific foreground permissions | Required according to each declared foreground service type, such as camera/microphone/phone call where applicable | Not selected; no feature has been implemented. |
| `POST_NOTIFICATIONS` | User-visible NOVA notifications on supported Android versions | Declared by Expo config, but no native service uses it. |
| `INTERNET` | Authenticated network communication | Expo/native build may supply baseline networking behavior, but it is not evidence of native service readiness. |

Special access, user settings, consent tokens, and runtime state are not equivalent to manifest permissions. Accessibility enablement, notification-listener approval, and MediaProjection consent require user/device workflows and must be tested on physical devices.

## 8. Build and Toolchain Gaps

The current project is an Expo SDK 54 application using Metro/web development scripts. It does not include `expo-dev-client`, an `android/` project, or a local Expo module. The `android` package script currently starts Expo’s Android workflow; it is not evidence that this project can compile or install the planned native services.

Required build migration:

1. Install and configure `expo-dev-client`.
2. Create a local Expo native module, or intentionally adopt a prebuilt/bare Android project.
3. Run Expo prebuild for the chosen workflow and inspect the generated Android project.
4. Add native Kotlin sources through the selected module/project boundary.
5. Add config plugins for manifest, permissions, service metadata, resources, and Gradle configuration. Direct edits to generated native directories must not be the only source of truth when Continuous Native Generation is used.
6. Add Android Gradle Plugin, Kotlin, AndroidX, WorkManager, and required Expo Modules dependencies with compatible versions.
7. Add an Android application module and module dependencies for the planned `nova-*` packages.
8. Add debug/release build configuration, signing strategy, min/target SDK decisions, and shrinker rules where required.
9. Build and install a custom development build, not Expo Go.
10. Run the build on a physical Android device and record OS/API level, OEM, battery restrictions, granted permissions, enabled services, and observed lifecycle behavior.

Expo’s documented path is a development build with native code support. Expo Go is limited to native libraries included in the Expo SDK or libraries without custom native code. A custom native module requires a development/native build and a rebuild after native dependency or app-config changes.

## 9. Device-Testing Requirements

No device validation has been performed in this phase. Before any real execution feature is considered, testing must cover at least:

| Test area | Required evidence |
|---|---|
| Build/install | Custom development build installs on a physical Android device. |
| Accessibility | Service appears in system settings, requires explicit user enablement, receives lifecycle callbacks, and is disabled cleanly. |
| Notifications | Listener appears in system settings, requires user approval, receives connected/disconnected callbacks, and redacts content. |
| MediaProjection | Consent is shown for each session, projection starts/stops, and Android 14+ service type checks pass. |
| Foreground service | Notification is visible, type/permission requirements pass, background-start restrictions are handled, and stop/emergency-stop works. |
| WorkManager | Constraints, retry, cancellation, process restart, and unique-work behavior are verified. |
| Bridge | JS/native correlation IDs, expiry, idempotency, errors, reconnect, and event cleanup are tested. |
| Security | Unauthorized requests, missing grants, expired requests, duplicate requests, and user-disabled services are rejected. |
| OEM behavior | At least one stock Android device and one OEM with aggressive background restrictions are tested. |

An emulator may support initial build and lifecycle smoke tests, but it is not sufficient evidence for accessibility, notification access, OEM battery policy, or production-like user-consent behavior.

## 10. Required Migration Plan from Expo Workflow

### Stage A — Native build choice

Choose between a local Expo module integrated into the existing app and a deliberate bare/prebuilt Android application. The recommended initial path is a local Expo module plus config plugins so the current Expo UI remains the control center while native code is added incrementally.

### Stage B — Development build

Add `expo-dev-client`, create the native Android project using the selected Expo workflow, and build with Android Studio/Gradle locally or EAS. Expo Go must not be used to validate custom services.

### Stage C — Contract compilation

Convert the contract-only modules into compiled Kotlin modules or package them behind the local Expo module. Add serialization, version negotiation, error mapping, and test fixtures before connecting any service.

### Stage D — Manifest/configuration

Implement config-plugin-owned manifest changes only for the first approved capability. Add the minimum permissions and metadata for that capability, with an explicit privacy and threat-model review. Do not declare all future services in advance.

### Stage E — One-service validation

Validate one native service at a time on a physical device. Record installation, user enablement/consent, lifecycle callbacks, status reporting, teardown, and failure behavior before adding another service.

### Stage F — Bridge and control-plane integration

Expose only capability/status requests through the Expo bridge. Keep server-side orchestration separate from device-side execution. Enforce grants, expiry, idempotency, emergency stop, redaction, and audit correlation at the native boundary.

## 11. Security and Privacy Readiness Findings

The contracts anticipate capability-based access, approval tokens, request expiry, idempotency, emergency stop, redaction, and audit events. These are design strengths but are not active security controls until implemented and tested in native code.

The following security controls are missing from the executable path:

- No native authorization gateway.
- No verification of approval tokens.
- No expiry or duplicate-request enforcement in a service implementation.
- No secure serialization boundary.
- No service binding authentication policy.
- No notification/accessibility content minimization implementation.
- No screenshot retention/deletion policy enforcement.
- No audit event publisher.
- No native emergency-stop implementation.

## 12. Final Readiness Decision

**Decision: NOT READY — do not start native device-control implementation.**

The repository is ready to serve as a contract and architecture reference, not as a native Android execution target. The immediate prerequisite is the Expo-to-native build migration and a compiled, device-testable development build. Until that prerequisite is complete, AccessibilityService, NotificationListenerService, MediaProjection, Foreground Service, WorkManager execution, and the Native Bridge must remain unimplemented and must not be represented as available.

## 13. References

1. [Android AccessibilityService reference](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService) — service declaration, `BIND_ACCESSIBILITY_SERVICE`, user-controlled lifecycle, and metadata configuration.
2. [Android NotificationListenerService reference](https://developer.android.com/reference/android/service/notification/NotificationListenerService) — service declaration, `BIND_NOTIFICATION_LISTENER_SERVICE`, and connected/disconnected lifecycle.
3. [Android MediaProjection guide](https://developer.android.com/media/grow/media-projection) — user consent, projection session lifecycle, and Android 14 foreground-service requirements.
4. [Android WorkManager: Define work requests](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work) — WorkRequest, Worker, enqueueing, constraints, retry, and cancellation concepts.
5. [Android Foreground Services overview](https://developer.android.com/develop/background-work/services/fgs) — user-visible work, notifications, and service selection.
6. [Android 14 foreground-service types](https://developer.android.com/about/versions/14/changes/fgs-types-required) — service types, matching permissions, runtime checks, and enforcement.
7. [Expo: Add custom native code](https://docs.expo.dev/workflow/customizing/) — development builds, local native modules, config plugins, and Continuous Native Generation.
8. [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/) — Expo Go limitations, native builds, local/EAS build paths, and physical-device installation.
