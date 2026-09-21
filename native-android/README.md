# NOVA Native Android Foundation

**Phase:** Native Android Migration Phase 1  
**Status:** Migration architecture and build planning only  
**Capability status:** Not verified; no Android service is implemented or connected.

This directory defines the future native Android migration path while preserving the existing Expo application as the user interface and control center.

## Current foundation modules

- `nova-contracts`: shared protocol, capability, request, result, and status types.
- `nova-bridge`: Expo-facing typed bridge contracts.
- `nova-ipc`: service binding, event replay, and request-validation contracts.
- `nova-security`: capability policy, redaction, and emergency-stop contracts.
- `nova-environment`: Environment Adapter contracts.
- `nova-accessibility`: AccessibilityService interfaces only.
- `nova-notifications`: NotificationListenerService interfaces only.
- `nova-projection`: MediaProjection interfaces only.
- `nova-foreground`: foreground-session contracts only.
- `nova-work`: WorkManager contracts only.
- `nova-observability`: audit and health contracts only.

## Migration documents

- `docs/DEVELOPMENT_BUILD_PLAN.md` — Expo development build and `expo-dev-client` integration path.
- `docs/IPC_ARCHITECTURE.md` — bridge boundary and request/result rules.
- `docs/ANDROID_MANIFEST_PLAN.md` — future feature-specific manifest declarations.
- `docs/NATIVE_ANDROID_MIGRATION_PHASE1_REPORT.md` — complete migration implementation report.

## Explicit limitations

- No Kotlin class binds to an Android service.
- No Android manifest is active.
- No Android project or Gradle build is generated.
- No Expo Native Module is registered.
- No native serialization adapter exists.
- No bridge transport exists.
- No device control is implemented.
- No accessibility tree is read.
- No notifications are received.
- No screenshots are captured.
- No OCR runs.
- No background task runs.
- No capability is claimed to work.

The existing `settings.gradle.kts` file remains a module map for the planned project structure. Android Gradle plugin wiring and native implementations remain deferred.

**Next phase:** not started.

---

**Migration Phase 1 status:** planning complete; implementation not started.

---

[End of foundation README]
