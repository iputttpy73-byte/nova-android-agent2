# Android Test-Build Requirements

**Status:** Planning only — no custom development build or device test exists.

## Build prerequisites

The migration requires Android Studio and SDK tooling for local builds, or an approved EAS development-build workflow. It also requires `expo-dev-client`, a generated Android project, compatible Android Gradle/Kotlin versions, debug signing, and a reproducible build command.

## Test layers

| Layer | Required evidence |
|---|---|
| TypeScript contracts | JS request/result schemas remain valid without native services. |
| Kotlin unit tests | Serialization, validation, capability policy, and error mapping compile and pass. |
| Module integration | A custom development build discovers the local Expo module. |
| Instrumentation | Lifecycle and status mapping work on an emulator/device. |
| Physical-device smoke test | The build installs and reports truthful unavailable states. |
| Regression | Expo web and UI checks remain unaffected when the native layer is absent. |

## Required smoke cases

The future status-only build must cover an absent native module, a disconnected native layer, unsupported capability, expired request, duplicate idempotency key, protocol mismatch, activity recreation, and explicit emergency-stop transport status. No case may report successful device control without device evidence.

## Device record

Every future test must record Android API level, OEM/model, build variant, app version, granted permissions, enabled special-access services, battery-optimization state, network state, and the exact observed result.

**Status:** **NOT READY** for execution; requirements are documented.
