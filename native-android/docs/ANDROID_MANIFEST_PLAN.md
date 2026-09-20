# Android Manifest Plan

**Status:** Planning only — no active `AndroidManifest.xml` exists in this phase.

The final native Android application will declare only the permissions and services required by implemented capabilities. This plan is not a manifest and does not grant any access.

## Planned declarations

| Area | Planned declaration | Activation condition |
|---|---|---|
| Accessibility | A private service protected by `android.permission.BIND_ACCESSIBILITY_SERVICE` with the accessibility-service metadata | Only after AccessibilityService behavior and policy review are implemented |
| Notifications | A private service protected by `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE` | Only after notification filtering and consent flow are implemented |
| Projection | MediaProjection consent flow and, where required by target API, the matching foreground-service type | Only after bounded capture and teardown are implemented |
| Foreground work | `FOREGROUND_SERVICE` and the specific service-type permission required by the target Android API | Only for a visible, user-understood session |
| Camera | `android.permission.CAMERA` | Only when camera capture is implemented |
| Microphone | `android.permission.RECORD_AUDIO` | Only when voice capture is implemented |
| Calls | `android.permission.CALL_PHONE` only if direct calling is implemented | Only after explicit user approval and device tests |
| Notifications from NOVA | `android.permission.POST_NOTIFICATIONS` | Only for user-visible NOVA notifications |
| Network | `android.permission.INTERNET` | Required for authenticated server communication |
| Exact alarms | `SCHEDULE_EXACT_ALARM` only if a product requirement justifies exact timing | Requires a separate special-access review |

## Manifest safety rules

The final manifest must not request broad package visibility, call-log access, contacts, media-library access, or notification access without a feature-specific justification. A manifest declaration is not evidence that the capability works. Runtime state, user settings, OS version, OEM behavior, and physical-device tests determine actual availability.

No service will be exported unless Android requires it and the exported surface has a documented permission and threat model. No public Binder endpoint, local HTTP server, shell bridge, or unrestricted intent receiver is part of the design.

## Phase 1 decision

No `AndroidManifest.xml` is created or activated in Native Android Phase 1. The current Expo application remains unchanged and continues to run without native Android service access.
