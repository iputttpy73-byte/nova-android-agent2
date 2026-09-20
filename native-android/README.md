# NOVA Native Android Foundation

**Phase:** Native Android Phase 1  
**Status:** Contracts and module boundaries only  
**Capability status:** Not verified; no Android service is implemented or connected.

This directory defines the future native Android layer while preserving the existing Expo application as the user interface and control center.

## Modules

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

## Explicit limitations

- No Kotlin class binds to an Android service.
- No Android manifest is active.
- No device control is implemented.
- No accessibility tree is read.
- No notifications are received.
- No screenshots are captured.
- No OCR runs.
- No background task runs.
- No capability is claimed to work.

The `settings.gradle.kts` file is a module map for the planned project structure. Android Gradle plugin wiring and native implementations are deferred to a later phase.
