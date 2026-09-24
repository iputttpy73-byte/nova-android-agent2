# Native Android Phase 8 Report

## Executive summary

Phase 8 has begun with a real Android implementation layer behind the existing Expo control plane. The local `nova-native` module is now autolinked into the generated Android project, and the native bridge exposes capability status, user-mediated device actions, Accessibility observation, screenshot capture through the Accessibility API on Android 11 and later, OCR through ML Kit, notification-listener registration, foreground-service scaffolding, deferred-work scaffolding, camera and gallery launch, alarm creation, phone dialing, WhatsApp message composition, and text-to-speech.

The implementation does **not** claim that privileged services are active on a device. Accessibility and notification access remain controlled by Android Settings and by the user. Screen projection requires a fresh user consent flow for each session. The current environment has no Android SDK configured, so the native APK build could not be completed here. JavaScript checks and tests are passing.

## Implemented components

### Accessibility layer

`NovaAccessibilityService` is a real `AccessibilityService` implementation. It registers the required system action and `BIND_ACCESSIBILITY_SERVICE` permission through the local module manifest. It records its bound state in process memory, exposes a bounded UI-tree snapshot, supports explicit tap gestures, supports explicit text input into a selected node, and can capture a screenshot on Android API 30 or later through `takeScreenshot`. No action is triggered by an arbitrary notification or background heuristic.

Android controls the service lifecycle. The service becomes active only after the user enables it in system Accessibility settings. This lifecycle is required by the platform and cannot be bypassed by the Expo bridge [1].

### Notification listener

`NovaNotificationListenerService` is registered with `BIND_NOTIFICATION_LISTENER_SERVICE` and tracks the connected/disconnected lifecycle. Notification callbacks are present but intentionally do not forward or persist notification content yet. This preserves the security boundary while the notification consent and redaction policy are finalized.

### Screenshot analysis and OCR

The bridge provides `captureScreenshot()` through the bound Accessibility service. The captured hardware buffer is converted to PNG and returned as base64. `recognizeText()` sends a PNG base64 payload to an ML Kit text recognizer and returns the recognized text plus text blocks.

This path is available only when an enabled Accessibility service can capture the screen. The separate MediaProjection service is registered but is not reported as active because its user-consent token flow has not yet been completed. Android requires user consent before each MediaProjection session and requires the `mediaProjection` foreground-service type for Android 14 and later [2].

### Environment Adapter

`NovaEnvironmentAdapter` contains explicit, user-visible actions:

- application launch by validated package name;
- opening Accessibility settings;
- opening notification-listener settings;
- opening WhatsApp message composition through a `wa.me` URL;
- opening the dialer rather than silently placing a call;
- opening the system alarm UI;
- opening the camera intent;
- opening the gallery picker.

WhatsApp sending and phone calls are therefore **user-mediated**. The implementation does not silently send a message or place a call. This is intentional and preserves a confirmation boundary for consequential communication.

### Speech

Text-to-speech is implemented with Android `TextToSpeech`, including initialization, default-locale selection, queue flushing, and shutdown support. Speech-to-text remains **NOT IMPLEMENTED** in this checkpoint because it requires an Activity-result or a dedicated recognition session with lifecycle and cancellation handling.

### Background execution

A foreground service is registered for MediaProjection sessions and displays an ongoing notification when started. A WorkManager-based worker contract is present for durable deferred work, but its work body is currently a safe no-op. Background task execution is therefore **NOT IMPLEMENTED** beyond the registration foundation.

## Bridge contract changes

The TypeScript bridge now exposes:

- `getStatus()` and `getCapabilities()`;
- `openAccessibilitySettings()`;
- `openNotificationListenerSettings()`;
- `getAccessibilitySnapshot()`;
- `captureScreenshot()`;
- `tap()` and `inputText()`;
- `recognizeText()`;
- `launchApp()`;
- `composeWhatsApp()`;
- `dial()`;
- `setAlarm()`;
- `openCamera()` and `openGallery()`;
- `speak()`.

Capability reasons now distinguish `NONE`, `NEEDS_USER_PERMISSION`, `USER_DISABLED`, `NOT_IMPLEMENTED`, and `BLOCKED_BY_PLATFORM`. The native status layer no longer reports every capability as `NOT_IMPLEMENTED`; it reports the observable runtime state instead.

## Capability readiness

| Capability | Status in this checkpoint | Limitation |
|---|---|---|
| Accessibility service | Implemented, user-disabled until enabled | Requires explicit user enablement in Android Settings |
| UI hierarchy observation | Implemented through bounded root snapshots | Requires active Accessibility service |
| Explicit tap and text input | Implemented | Requires active Accessibility service and explicit bridge call |
| Screenshot capture | Implemented through Accessibility API on API 30+ | Requires active Accessibility service; older Android is unavailable |
| OCR | Implemented for supplied PNG data | Requires native ML Kit dependency and an image payload |
| Notification listener | Registered and lifecycle-aware | Content forwarding and persistence are not implemented |
| MediaProjection | Foreground service and manifest foundation | Consent-token acquisition and projection session orchestration are not implemented |
| Application launch | Implemented | Package must be valid and installed |
| WhatsApp messaging | Composition flow implemented | Silent sending is not implemented; user must review and send |
| Phone calls | Dialer flow implemented | Silent calling is not implemented |
| Alarms | System alarm UI implemented | User confirmation remains in the system alarm UI |
| Text-to-speech | Implemented | Depends on an installed Android TTS engine |
| Speech-to-text | NOT IMPLEMENTED | Requires lifecycle-safe recognition result handling |
| Camera | User-mediated camera intent implemented | Result/file persistence is not implemented |
| Gallery | User-mediated image picker implemented | Result/file persistence is not implemented |
| Background execution | Registration foundation only | Worker behavior and policy-driven scheduling are not implemented |

## Security boundaries

The native layer does not silently grant Android privileges. It reports permission and service state, opens the relevant system settings screen, and waits for Android to bind the service. Communication actions open a reviewable system or application UI. The bridge catches unavailable-module and action failures and returns safe fallback values rather than claiming success.

The Accessibility service currently keeps observation in memory and does not persist screen content. Notification callbacks likewise do not persist content. A future implementation must add user-scoped redaction, retention, audit events, and explicit task authorization before forwarding either data source to the Agent Core.

## Validation results

The following checks passed:

| Check | Result |
|---|---|
| TypeScript `pnpm check` | PASS |
| ESLint `pnpm lint` | PASS, with the existing Node module-type warning |
| Vitest `pnpm test` | PASS: 17 files, 88 tests passed, 1 skipped |
| Server build `pnpm build` | PASS |
| Expo autolinking resolution | PASS: `nova-native` resolves to `modules/nova-native/android` and `com.nova.nativebridge.NovaNativeModule` |
| Expo Android prebuild | PASS |
| Android APK build | BLOCKED BY ENVIRONMENT: no Android SDK path is configured |

The failed Gradle attempt stopped during project configuration with `SDK location not found`. It did not reach Kotlin compilation. This is an environment limitation, not evidence that the native code compiled successfully. A device or CI runner with Android SDK 36, Build Tools 36, NDK 27.1.12297006, and the configured CMake toolchain is required for the next native verification step.

## Next implementation steps

The next native checkpoint should implement the MediaProjection consent/result lifecycle, persist redacted notification events through the existing audit system, implement speech-to-text with cancellation, implement WorkManager input/output contracts, and add Android instrumentation tests on a real API 30+ device. The application should not advertise full autonomous messaging, calling, or background execution until those device tests and policy checks pass.

## References

[1]: https://developer.android.com/reference/android/accessibilityservice/AccessibilityService "Android AccessibilityService API reference"

[2]: https://developer.android.com/media/grow/media-projection "Android Media projection guide"

[3]: https://developer.android.com/reference/android/service/notification/NotificationListenerService "Android NotificationListenerService API reference"

[4]: https://developer.android.com/about/versions/14/changes/fgs-types-required "Android foreground service type requirements"
