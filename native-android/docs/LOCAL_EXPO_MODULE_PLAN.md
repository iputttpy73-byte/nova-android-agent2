# Local Expo Native Module Plan

## Status

**Planning only — NOT IMPLEMENTED.**

The future local module will be named `nova-native` and will live under `modules/nova-native`. It will be integrated with the existing Expo UI through the Expo Modules API and a custom development build.

## Target ownership

The module will own the JavaScript/native boundary, protocol version negotiation, capability status, request correlation, cancellation, redacted event delivery, and emergency-stop transport. It will not own Agent planning, memory policy, or server-side orchestration.

## Target files

```text
modules/nova-native/
  README.md
  package.json
  expo-module.config.json
  src/index.ts
  src/NovaNativeModule.ts
  android/src/main/java/com/nova/nativebridge/NovaNativeModule.kt
  plugin/withNovaNative.ts
```

These files are target paths only. They have not been created in this phase.

## Registration plan

The first future implementation should register a status-only module. It must report `NATIVE_LAYER_UNAVAILABLE` or an equivalent truthful state until a real native service is installed and verified. It must not expose device actions or claim service availability.

## Required checks

- Module discovered in a custom development build.
- TypeScript method and event schemas match Kotlin serialization.
- Missing native module produces a safe unavailable state.
- Activity recreation reconnects without resuming sensitive operations.
- No unrestricted Binder, shell, HTTP, or intent bridge is exposed.

**Next phase:** not started.
