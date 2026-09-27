# Android Runtime Validation Plan

## 1. Purpose and scope

This plan defines how to compile, install, and validate the existing NOVA Android native layer. It does not add features or change the current implementation. The plan treats the Expo application as the control plane and the local `nova-native` module as the native integration boundary.

The current repository is structurally ready for the process, but execution is blocked in the present environment because no Android SDK, Android command-line tools, ADB, emulator, or physical Android device is available. The first objective is therefore to establish a reproducible Android build workstation before interpreting any runtime result.

## 2. Required workstation

### Android Studio

Install the latest stable Android Studio release supported by the workstation operating system. Use the bundled SDK Manager and Device Manager rather than manually copying SDK directories. Android Studio must be able to open the generated `android/` project and resolve the Gradle wrapper without changing generated source files.

The workstation should have sufficient memory and disk space for Android Studio, the SDK, and at least one emulator image. Android’s current emulator guidance lists 16 GB RAM and 16 GB disk space as emulator requirements [1]. Hardware virtualization must be enabled when using an accelerated emulator.

### Android SDK components

Install the versions reported by the generated Expo project:

| Component | Required version or minimum | Purpose |
|---|---:|---|
| Android SDK Platform | API 36 | Compile and target platform reported by the project |
| Android SDK Build-Tools | 36.0.0 | APK packaging and resource processing |
| Android SDK Platform-Tools | Latest compatible | `adb`, installation, logcat, and device communication |
| Android NDK | 27.1.12297006 | Native React Native/Expo build tasks |
| CMake | Installed through SDK Manager | Native build configuration where required |
| Android Emulator | Latest compatible | Emulator runtime testing |
| Java | OpenJDK 21 | Current environment already provides Java 21.0.11 |

The SDK root must be exposed through `ANDROID_HOME` or `ANDROID_SDK_ROOT`. The shell must also be able to resolve `adb`, `sdkmanager`, and `emulator` from the SDK `platform-tools`, `cmdline-tools`, and `emulator` directories. Android requires at least one SDK platform to compile an application [2].

After installation, accept licenses and verify the toolchain before opening the project:

```bash
sdkmanager --licenses
sdkmanager --list
adb version
emulator -version
java -version
```

The exact SDK directory is machine-specific and must not be committed into the repository’s source files.

## 3. APK build procedure

The build should be performed in this order so that failures identify the correct layer.

### Step 1: Prepare the JavaScript workspace

From the project root, install the locked dependencies without changing feature code:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm test
pnpm build
```

The existing checkpoint recorded passing TypeScript, lint, test, and server-build checks. Rerun them on the Android workstation to ensure the native environment did not alter dependency resolution.

### Step 2: Regenerate the native project

Run Expo prebuild using the existing configuration:

```bash
npx expo prebuild --platform android --no-install
```

Do not use `--clean` unless the generated `android/` directory is known to contain no intentional local changes. Review the resulting diff and confirm that the local module remains discoverable.

### Step 3: Verify Expo autolinking

Resolve Android modules and confirm that the output contains:

- package `nova-native`;
- source directory `modules/nova-native/android`;
- module class `com.nova.nativebridge.NovaNativeModule`.

The autolinking check validates registration only. It does not compile or execute Kotlin.

### Step 4: Assemble the debug APK

Run the Gradle wrapper from the generated Android directory:

```bash
cd android
./gradlew :app:assembleDebug --no-daemon
```

A successful result must include a generated debug APK under the app build outputs. Record the exact APK path, Gradle version, SDK versions, and Git revision used for the build.

The first failure should be fixed before any device testing begins. In particular, do not classify a Kotlin source file as compiled if Gradle stops at SDK discovery, dependency resolution, manifest merging, or resource processing.

### Step 5: Install the development build

With an emulator or physical device visible to ADB:

```bash
adb devices
adb install -r <debug-apk-path>
```

For Expo development-build testing, use the existing project command after the toolchain is ready:

```bash
npx expo run:android
```

The app must open into the existing Expo control plane. The first runtime check is that the app starts without a native module registration error.

## 4. Emulator requirements

Create at least one Android Virtual Device with:

- API 30 or later, because the current Accessibility screenshot path depends on Android API 30+;
- Google APIs or Google Play image appropriate to the test scenario;
- hardware acceleration enabled;
- portrait orientation for the initial smoke test;
- enough storage for the debug build and logs.

The emulator must be cold-booted once and then tested after a normal restart. Record the AVD name, API level, ABI, image type, and whether hardware acceleration is enabled.

The emulator is suitable for bridge, manifest, Accessibility, notification-listener, intent, screenshot, OCR, and TTS checks. It is not sufficient to represent every OEM-specific behavior, battery policy, or telephony behavior.

## 5. Physical-device requirements

Use a non-production Android device with a screen lock and a test account. The device should run Android 11 or later for the API 30 screenshot validation. Android’s device guidance requires Developer options and USB debugging for ADB-based testing [3].

Before installation:

1. Enable Developer options.
2. Enable USB debugging.
3. Connect the device and accept the RSA debugging prompt.
4. Confirm the device appears as `device`, not `unauthorized`, in `adb devices`.
5. Record Android version, API level, manufacturer, model, ABI, screen density, and battery-optimization state.
6. Do not use a device containing private notifications, personal messages, or sensitive accounts during unredacted observation tests.

OEM-specific validation is required for Accessibility binding, notification access, background execution, power management, and MediaProjection. A passing emulator test is not a substitute for a physical-device test.

## 6. First smoke-test sequence

The smoke test must be performed before testing individual services. Stop at the first failure and retain logcat output.

| Step | Action | Pass condition |
|---:|---|---|
| 1 | Install the debug/development APK | Installation succeeds without signature or ABI errors |
| 2 | Launch NOVA | Expo control plane opens without a red screen or native module exception |
| 3 | Call `getStatus()` | Status returns a valid `NovaNative` protocol response |
| 4 | Call `getCapabilities()` | Capability reasons are truthful; disabled services are not reported as active |
| 5 | Open native settings actions | Android opens the corresponding Accessibility or notification settings page |
| 6 | Return to NOVA | App resumes without losing bridge state |
| 7 | Inspect logcat | No uncaught exception, ANR, or service-registration failure appears |
| 8 | Relaunch the app | Status remains valid after process recreation |

Capture the following for each run:

```bash
adb logcat -c
adb logcat -v threadtime > nova-smoke-logcat.txt
```

Stop log capture after the final step and archive the build ID, device ID, APK checksum, and logcat file with the test result.

## 7. AccessibilityService validation plan

### Preconditions

The debug APK must be installed. The device must be API 30 or later for the screenshot subtest. The test operator must be able to enable NOVA manually in Android Accessibility settings.

### Validation sequence

1. Launch NOVA and record the initial capability status. Accessibility must report that it is installed but disabled or user-disabled.
2. Invoke `openAccessibilitySettings()` from the control plane.
3. Enable NOVA’s Accessibility service manually and accept Android’s warning dialog.
4. Return to NOVA and refresh `getStatus()`.
5. Confirm the service reports enabled state only after Android binds it.
6. Call `getAccessibilitySnapshot()` while NOVA’s own test screen is visible.
7. Confirm the snapshot is bounded, contains expected test text, and does not crash on nodes with null text or children.
8. Perform one explicit tap against a known test target and verify the visible result.
9. Perform one explicit `inputText()` action against a known test field and verify the field value.
10. On API 30+, call `captureScreenshot()` and confirm a non-empty PNG payload is returned.
11. Disable NOVA from Accessibility settings and confirm the capability returns to a disabled/unavailable state.
12. Review logcat for service disconnects, leaked callbacks, or repeated event loops.

### Pass criteria

The service must bind only after user enablement. Snapshot, tap, text input, and screenshot calls must return deterministic success or failure values. Disabling the service must prevent further privileged actions. No screen content should be persisted or forwarded without an explicit policy.

### Failure classification

- Service absent from settings: manifest merge or packaging failure.
- Service visible but cannot enable: manifest permission or service configuration failure.
- Service enabled but bridge reports inactive: lifecycle/status integration failure.
- Snapshot works but screenshot fails: API level, screenshot callback, or hardware-buffer conversion failure.
- Action affects the wrong node: node-selection or task-authorization failure.

## 8. NotificationListenerService validation plan

### Preconditions

The debug APK must be installed on an emulator or test device with a visible notification panel. Use a dedicated test notification source and do not use personal notifications.

### Validation sequence

1. Confirm initial status reports the listener as not enabled.
2. Invoke `openNotificationListenerSettings()`.
3. Enable NOVA manually and accept the system confirmation.
4. Return to NOVA and refresh capability status.
5. Generate a dedicated test notification from a known test source.
6. Confirm that Android invokes the listener lifecycle and that the service remains connected.
7. Verify the current implementation’s expected boundary: notification content is not automatically forwarded or persisted.
8. Disable notification access and confirm the status changes accordingly.
9. Force-stop and relaunch NOVA, then verify no stale connected state is reported.

### Pass criteria

The service appears in Android notification access settings, connects after user enablement, disconnects cleanly when disabled, and does not leak notification content into the bridge or persistence layer. Since payload forwarding is not implemented, the test must not expect a notification-event API.

## 9. MediaProjection validation plan

### Current readiness boundary

The existing implementation contains `NovaProjectionService` and the required foreground-service manifest declarations. It does not yet expose a complete consent-token request/result flow or a virtual-display capture lifecycle. Therefore, full MediaProjection runtime validation is **blocked by the current implementation boundary**, independent of the SDK setup.

### Validation sequence when the consent flow is available

1. Start from a clean app process.
2. Request screen-capture consent from the foreground Activity.
3. Confirm Android displays the system consent dialog.
4. Reject consent and verify the app reports a non-active state without starting a projection session.
5. Repeat and accept consent.
6. Start the projection foreground service with the mediaProjection service type.
7. Confirm the ongoing notification is visible.
8. Capture one frame into a controlled test surface.
9. Stop the session and confirm the foreground notification is removed.
10. Revoke or invalidate the token and verify the session fails safely.

Android requires user consent before each MediaProjection session and requires the appropriate foreground-service type on newer Android versions [4]. A service declaration alone is not sufficient evidence of working screen projection.

## 10. OCR validation plan

### Preconditions

The Android APK must compile with the ML Kit dependency resolved. Use a controlled image containing known text, such as a local test screen or a generated fixture. Do not use personal documents.

### Validation sequence

1. Supply a valid PNG base64 payload to `recognizeText()`.
2. Confirm the result contains the expected full text and text blocks.
3. Test a blank image and confirm an empty result rather than an exception.
4. Test an invalid base64 payload and confirm a controlled error path.
5. Capture a screenshot through the Accessibility path on API 30+.
6. Pass the captured PNG to OCR and compare recognized text with the known test screen.
7. Repeat with light and dark themes and with different text sizes.
8. Monitor memory and logcat for bitmap or recognizer leaks.

### Pass criteria

Valid images produce structured results. Invalid images fail predictably. The recognizer does not retain bitmaps after processing. Screenshot-to-OCR is considered passed only when both screenshot capture and ML Kit recognition pass on the same device.

## 11. Expo Native Module validation plan

### Registration checks

1. Run Expo autolinking resolution and confirm `nova-native` resolves to `modules/nova-native/android`.
2. Confirm the registered Kotlin module is `com.nova.nativebridge.NovaNativeModule`.
3. Build and install a development build rather than using Expo Go, because the local native module is not available in the generic Expo Go runtime.

### Bridge checks

1. Call `getStatus()` on Android and validate the protocol version and module name.
2. Call `getCapabilities()` and verify all state reasons match Android’s actual settings state.
3. Call each settings and user-mediated intent method once with safe test data.
4. Call Accessibility methods only when the service is enabled.
5. Confirm unavailable methods return controlled failure values rather than claiming success.
6. Kill and relaunch the app to verify module re-registration.
7. Capture logcat during every bridge call.

### Pass criteria

The module is discoverable, the APK starts, the bridge returns schema-valid responses, and native failures map to safe TypeScript results. Bridge validation is complete only after the Kotlin module has compiled and at least one Android runtime has executed the calls.

## 12. Deployment readiness gates

The project must pass all gates in order:

| Gate | Requirement | Current state |
|---|---|---|
| A | SDK, Build Tools, NDK, CMake, ADB, and Java installed | BLOCKED in current environment |
| B | Expo prebuild and autolinking resolve successfully | Passed previously |
| C | `./gradlew :app:assembleDebug` succeeds | Not yet verified |
| D | APK installs on emulator | Not yet verified |
| E | First smoke test passes | Not yet verified |
| F | Accessibility validation passes | Not yet verified |
| G | Notification listener validation passes | Not yet verified |
| H | OCR validation passes | Not yet verified |
| I | Expo bridge survives process recreation | Not yet verified |
| J | Physical-device checks pass on at least one Android 11+ device | Not yet verified |
| K | Release signing and Play policy review complete | Out of scope for this runtime plan |

No production deployment should proceed before Gates C through J are complete. The current MediaProjection implementation must also remain classified as incomplete until its consent/result lifecycle exists and passes the dedicated validation sequence.

## References

[1]: https://developer.android.com/studio/run/emulator "Run apps on the Android Emulator"

[2]: https://developer.android.com/studio/intro/update "Update the IDE and SDK tools"

[3]: https://developer.android.com/tools/adb "Android Debug Bridge"

[4]: https://developer.android.com/media/grow/media-projection "Android Media projection"

[5]: https://developer.android.com/reference/android/accessibilityservice/AccessibilityService "Android AccessibilityService API reference"

[6]: https://developer.android.com/reference/android/service/notification/NotificationListenerService "Android NotificationListenerService API reference"

[7]: https://developers.google.com/ml-kit/vision/text-recognition/android "ML Kit text recognition for Android"
