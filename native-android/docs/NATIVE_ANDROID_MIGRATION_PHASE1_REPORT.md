# Native Android Migration Phase 1 Report

## 1. Executive summary

The project migration path is prepared, but the native migration itself has not been implemented. The existing Expo application remains unchanged as the user interface and control center. The Native Android foundation now documents how to move to a custom Expo Development Build with a local Expo Native Module, explicit Android/Gradle boundaries, versioned serialization, capability-gated bridge transport, and physical-device testing.

No package was installed. No prebuild was run. No Android project was generated. No native module was registered. No Android service or device-control behavior was created.

## 2. Scope completed

This phase defines:

- Expo Development Build planning.
- `expo-dev-client` integration planning.
- Local Expo Native Module architecture.
- Native Module registration sequence.
- Android project and Gradle target structure.
- Native serialization boundaries.
- Native Bridge transport and lifecycle rules.
- Android test-build and physical-device requirements.
- Migration readiness and implementation gates.

## 3. Artifacts

| Artifact | Purpose | Status |
|---|---|---|
| `DEVELOPMENT_BUILD_PLAN.md` | Expo Development Build and `expo-dev-client` path | Planning complete |
| `LOCAL_EXPO_MODULE_PLAN.md` | Local module ownership and registration | Planning complete |
| `ANDROID_BUILD_STRUCTURE_PLAN.md` | Target Android and Gradle structure | Planning complete |
| `NATIVE_TRANSPORT_SERIALIZATION_PLAN.md` | Envelope, versioning, and transport rules | Planning complete |
| `ANDROID_TEST_BUILD_REQUIREMENTS.md` | Build, emulator, and physical-device checks | Planning complete |
| `README.md` | Foundation scope and explicit limitations | Updated |

## 4. Readiness matrix

| Area | Status | Explanation |
|---|---|---|
| Development Build plan | READY FOR IMPLEMENTATION | The install, prebuild, build, and device-test sequence is defined. |
| `expo-dev-client` integration | READY FOR IMPLEMENTATION | The integration point is defined; the package is not installed. |
| Local Expo Native Module architecture | READY FOR IMPLEMENTATION | Boundary, target paths, registration order, and security limits are defined. |
| Native Module registration | NOT READY | No module scaffold, Kotlin module class, JS API, or config plugin exists. |
| Android build structure | NOT READY | The target structure is documented, but no Android project or Gradle build exists. |
| Gradle architecture | NOT READY | Dependency direction is defined, but root/module build files are absent. |
| Native serialization | READY FOR IMPLEMENTATION | Envelope and validation responsibilities are defined; no adapter exists. |
| Native Bridge transport | READY FOR IMPLEMENTATION | Logical flow and lifecycle rules are defined; no transport exists. |
| Android test build | NOT READY | No custom build, emulator test, physical-device test, or instrumentation test exists. |

`READY FOR IMPLEMENTATION` describes design readiness only. It does not mean that any Android capability works.

## 5. Local Expo Module design

The proposed local module is `modules/nova-native`. It will be integrated using the Expo Modules API and exposed to TypeScript through a narrow status/request/event interface. It will not expose raw Binder objects, service instances, accessibility nodes, notification bodies, screenshots, or unrestricted Android intents.

The first implementation of the module must be a status-only smoke test. It must return truthful unavailable or disconnected states until a real native service has been compiled, installed, granted by the user where required, and verified on a device.

## 6. Registration plan

The future registration sequence is:

1. Scaffold the local Expo module.
2. Add the module's JS/TypeScript contract.
3. Add the Kotlin module definition.
4. Add serialization and error mapping.
5. Add config-plugin-owned native configuration only for the approved capability.
6. Generate and inspect the Android project.
7. Build a custom development client.
8. Verify module discovery and status reporting.

No step in this phase performs that sequence.

## 7. Build and Gradle design

The target Android project has an application module, a root Gradle build, a wrapper, and separate native modules for contracts, bridge, IPC, security, environment, observability, and future capabilities. The application depends on the bridge. Capability modules depend on contracts, security, and observability. Contract modules contain no service implementation.

The current `native-android/settings.gradle.kts` is only a module map. It is not a build and must not be treated as proof of Kotlin or Android compilation.

## 8. Serialization architecture

The bridge will use a versioned JSON-compatible envelope. It will contain protocol version, request identity, run and operation identity, capability, issue/expiry timestamps, idempotency key, optional approval token, payload, result status, error code, and redacted evidence references.

Kotlin data classes will not cross the JavaScript boundary directly. A future serializer will validate ownership, expiry, capability, required fields, protocol compatibility, enum values, payload size, and duplicate idempotency keys. Binary material will be represented by an expiring reference rather than an unbounded inline payload.

## 9. Bridge transport architecture

The logical path is:

```text
Expo UI
  -> TypeScript NovaNativeClient
  -> Expo Modules API
  -> Capability Gateway
  -> NativeServiceConnection
  -> approved native service
```

The bridge will provide status queries, request correlation, cancellation, event subscription, reconnect, and emergency-stop transport. It will reject expired requests, unknown capabilities, missing grants, invalid approvals, duplicate keys, unsupported protocol versions, and invalid payloads.

The bridge will reconnect after activity recreation and query status explicitly. Sensitive operations will not resume automatically after process death. Raw screenshots, full accessibility trees, notification bodies, and audio will not be bridge event payloads.

## 10. Build-test requirements

A future custom development build must be tested first with no device capability enabled. The smoke test must prove that the Expo UI can discover the native module and truthfully display unavailable states. It must cover missing module, disconnected layer, unsupported capability, expiry, duplicate request, protocol mismatch, activity recreation, and emergency-stop status.

After that foundation is proven, physical-device testing must record API level, OEM/model, build variant, app version, permissions, special-access state, battery policy, network state, and exact observed results.

## 11. Explicit limitations

The following remain **NOT IMPLEMENTED**:

- AccessibilityService.
- NotificationListenerService.
- MediaProjection.
- Device control.
- OCR.
- Screenshot capture.
- Foreground service execution.
- WorkManager execution.
- Native Module registration.
- Native serialization adapter.
- Native Bridge transport.
- Android permission or consent flows.

No capability is claimed to work.

## 12. Verification result

The migration documents and foundation README were checked for the required sections and explicit boundaries. The project still contains no active Android manifest, Gradle build, Gradle wrapper, Android application module, native service class, Expo Native Module registration, or device-control implementation.

**Migration readiness:** architecture ready for the next implementation phase.  
**Build readiness:** not ready for execution because the native build scaffold does not exist.  
**Native capability readiness:** not ready; all device-facing capabilities remain unimplemented.

## 13. Next-phase gate

The next phase must be approved separately. Its first scope should be limited to generating the custom development-build scaffold and registering a status-only local Expo Module. It must not implement AccessibilityService, NotificationListenerService, MediaProjection, or device control in the same phase.

**Next phase:** not started.

## References

[1]: https://docs.expo.dev/workflow/customizing/ "Expo: Add custom native code"
[2]: https://docs.expo.dev/develop/development-builds/introduction/ "Expo: Introduction to development builds"
[3]: https://developer.android.com/about/versions/14/changes/fgs-types-required "Android foreground service types"

**Final status:** Native Android Migration Phase 1 complete; native implementation **NOT IMPLEMENTED**.
