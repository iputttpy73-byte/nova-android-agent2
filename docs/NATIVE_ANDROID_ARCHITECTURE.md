# Native Android Architecture Document

## NOVA Personal Android Assistant

**Document status:** Architecture only  
**Revision:** Native Android Migration Architecture v1.0  
**Project:** `ai-task-orchestrator`  
**Author:** Manus AI  
**Primary UI:** Existing Expo mobile application  
**Native target:** Dedicated Android native layer integrated with the Expo application through a controlled bridge

> This document defines the architecture for adding a native Android capability layer to NOVA. It does not implement Kotlin modules, Android services, permissions, Expo modules, OCR, screen capture, device interaction, or background execution. All implementation items in this document are **NOT IMPLEMENTED**.

## 1. Executive Decision

The existing Expo application remains the user interface and control center. It continues to own goals, plans, approvals, run history, logs, settings, and user-facing security controls.

A separate Native Android Layer will provide privileged device capabilities only after the user grants the relevant Android access and after the native build has been installed on a physical or verified Android device. The native layer will not be treated as available merely because the Expo web preview or Expo Go can render the user interface.

The native layer is a capability provider, not an autonomous policy engine. It may observe or execute only requests authorized by the Agent Core, permitted by the capability policy, and accepted by the Android operating system. The native layer must return explicit `UNSUPPORTED`, `PERMISSION_REQUIRED`, `USER_CANCELLED`, `TIMEOUT`, `FAILED`, and `COMPLETED` outcomes. It must never return success for an operation that was not verified.

The first implementation target should be a custom Android development build or a bare/prebuilt Android project. Expo Go is not an acceptable runtime for AccessibilityService, NotificationListenerService, MediaProjection, or custom foreground-service behavior.

## 2. Scope and Non-Goals

### 2.1 In scope

This architecture defines:

- The relationship between the existing Expo UI and native Android services.
- Kotlin module boundaries and ownership.
- The native capability and permission model.
- IPC and bridge contracts.
- Service lifecycle and process-death behavior.
- Accessibility observation and interaction boundaries.
- Notification observation boundaries.
- MediaProjection and OCR boundaries.
- App launching and controlled interaction.
- Foreground service and WorkManager responsibilities.
- Security, privacy, audit, and data-retention controls.
- Testing, device validation, signing, and deployment strategy.

### 2.2 Out of scope for this revision

The following are **NOT IMPLEMENTED**:

- Any Kotlin source file.
- Any Android manifest service declaration.
- Any Expo config plugin or native module.
- Any AccessibilityService integration.
- Any NotificationListenerService integration.
- Any MediaProjection capture.
- Any OCR engine integration.
- Any gesture, text-entry, or UI automation execution.
- Any WhatsApp automation.
- Any automatic phone-call control.
- Any exact-alarm implementation.
- Any foreground service or WorkManager implementation.
- Any native speech, camera, gallery, or background worker implementation.
- Any APK or AAB build.
- Any claim that Android virtualization or real-device control works.

## 3. Product and Safety Requirements

NOVA is a supervised personal Android assistant. The user can express a goal, inspect the proposed plan, approve sensitive operations, observe progress, stop execution, revoke capabilities, and inspect the audit trail.

The system must satisfy the following invariants:

1. **No capability without explicit grant.** A model response cannot grant Android permission to itself.
2. **No action without a capability check.** Every native operation is mapped to a named capability and evaluated against the current grant and policy.
3. **No hidden observation.** The UI must show which observation sources are active and what retention policy applies.
4. **No blind repetition.** A failed action may be retried only under a bounded recovery policy.
5. **No sensitive automation by default.** Messaging, calls, payments, authentication, account changes, and destructive actions require explicit approval or remain blocked.
6. **No success without evidence.** An operation is completed only when the native result and the verifier provide sufficient evidence.
7. **No secret leakage to logs or models.** Tokens, passwords, one-time codes, and unredacted notification content must be minimized or redacted.
8. **Immediate stop must be available.** The user can cancel the current run and disable the native capability layer.
9. **Unsupported is a first-class result.** Platform, permission, policy, and device limitations are reported as blocked rather than simulated.

## 4. System Context

```text
+--------------------------------------------------------------+
| Existing Expo Application                                    |
| Home | Chat | Tasks | Logs | Settings                       |
| Goal entry | Plan review | Approvals | Capability settings  |
+---------------------------+----------------------------------+
                            |
                Expo Native Bridge / Typed API
                            |
+---------------------------v----------------------------------+
| Native Android Layer                                        |
|                                                              |
| Capability Gateway | Security Policy | Run Coordinator       |
| Accessibility | Notifications | Projection | OCR            |
| Interaction | App Control | Voice | Media | Background       |
+---------------------------+----------------------------------+
                            |
             Android OS, user grants, and device apps
                            |
+--------------------------------------------------------------+
| Server-side control plane                                    |
| Agent Core | Planner | AI providers | Persistence | Audit   |
+--------------------------------------------------------------+
```

The Expo application and server-side Agent Core remain the control plane. The Native Android Layer is the device execution and observation plane. The server must not assume that a native capability is installed, enabled, connected, or healthy.

## 5. Responsibility Allocation

| Concern | Existing Expo UI | Server / Agent Core | Native Android Layer |
|---|---|---|---|
| Goal entry | Owns | Stores and validates | Does not own |
| Plan display and approval | Owns | Generates and enforces policy | Reports capability constraints |
| Agent-run state | Displays | Owns durable state machine | Reports operation events |
| AI calls | Displays status | Owns provider integration | Does not call models directly by default |
| Permission explanation | Displays user controls | Records policy state | Reports OS grant state and opens settings screens |
| Screen observation | Displays redacted result | Verifies and stores metadata | Captures through approved sources |
| Android action execution | Displays progress and stop controls | Authorizes action | Executes one bounded operation |
| Audit trail | Displays | Owns durable audit | Emits tamper-evident event inputs |
| Secrets | Never stores raw provider/device secrets | Server secret store | Android Keystore and private storage |

## 6. Kotlin Module Architecture

The implementation should be a multi-module Android layer. Modules may initially live in one Android project, but their interfaces must remain separated so that service code cannot bypass security or policy boundaries.

### 6.1 `nova-contracts`

Defines stable Kotlin data contracts shared by the native modules and the Expo bridge. It contains capability identifiers, request envelopes, result envelopes, permission states, observation metadata, action types, correlation IDs, and error codes.

It must contain data only. It must not access Android services, network clients, databases, or UI components.

**Status: NOT IMPLEMENTED.**

### 6.2 `nova-security`

Owns capability grants, consent records, redaction policy, request authentication, replay protection, approval requirements, and emergency stop state.

It must reject requests that lack a valid run ID, capability grant, policy decision, expiry, or user approval where required. It must not infer permission from an AI-generated plan.

**Status: NOT IMPLEMENTED.**

### 6.3 `nova-core`

Owns the native capability registry, request routing, operation budgets, idempotency keys, correlation IDs, service health, and lifecycle coordination. It is the only module allowed to route an Expo request to a native capability provider.

**Status: NOT IMPLEMENTED.**

### 6.4 `nova-bridge`

Provides the Expo-facing native module. It exposes a small typed API rather than exposing Android service objects or arbitrary intents to JavaScript.

The bridge must support:

- Querying native layer version and capability availability.
- Reading current permission and service states.
- Requesting a capability grant flow.
- Submitting a bounded observation request.
- Submitting a bounded interaction request.
- Starting and stopping an approved run session.
- Subscribing to redacted progress and result events.
- Triggering an emergency stop.

It must not expose raw Binder objects, unrestricted package-manager access, raw notification streams, or unrestricted screen pixels to the Expo layer.

**Status: NOT IMPLEMENTED.**

### 6.5 `nova-accessibility`

Implements the future `AccessibilityService` adapter. It will read permitted accessibility nodes, package names, window changes, text metadata, bounds, content descriptions, and supported actions.

The module must filter data before it leaves the service boundary. It must not automatically capture every screen, store full node trees indefinitely, or execute arbitrary actions supplied by a model.

Interaction operations must use allow-listed action types such as focus, click, scroll, set text, and back navigation. Each operation must identify its intended target and include a verification requirement.

**Status: NOT IMPLEMENTED.**

### 6.6 `nova-notifications`

Implements the future `NotificationListenerService` adapter. It will receive notification lifecycle events only after the user enables notification access in Android settings.

The module must apply package allowlists, content minimization, sender redaction, and retention policy before forwarding an event. It must not expose all notification contents to the model by default.

**Status: NOT IMPLEMENTED.**

### 6.7 `nova-projection`

Owns future MediaProjection consent, virtual-display lifecycle, frame capture, frame-rate limits, memory limits, and secure teardown.

Screen capture requires explicit user consent and must be scoped to a run or bounded observation request. Captures must be discarded by default after OCR or verification unless the user has enabled retention for a defined purpose.

**Status: NOT IMPLEMENTED.**

### 6.8 `nova-ocr`

Consumes a bounded image frame and returns structured text regions with confidence and source metadata. The OCR module must be replaceable and must not decide whether a goal is complete.

OCR output must carry a redaction state and provenance. Low-confidence text must remain uncertain and must not be converted into an action without additional verification.

**Status: NOT IMPLEMENTED.**

### 6.9 `nova-observation`

Normalizes accessibility nodes, notification events, OCR regions, screenshot metadata, app metadata, and permission state into a common observation contract.

It must preserve source provenance, capture time, package name where permitted, confidence, redaction state, and expiry. It must provide observation snapshots rather than an uncontrolled stream to the Planner or AI layer.

**Status: NOT IMPLEMENTED.**

### 6.10 `nova-interaction`

Provides bounded Android interaction primitives. It must not accept arbitrary Kotlin reflection, shell commands, unrestricted intents, or raw model-generated code.

The initial action vocabulary should be limited to:

- Launch an allow-listed application.
- Navigate back.
- Tap a verified accessibility target.
- Scroll within a verified target.
- Set text in a verified input target.
- Submit a user-approved intent.
- Open a system settings screen.

Each action must include a target identity, precondition, expiry, idempotency key, expected postcondition, and verification strategy.

**Status: NOT IMPLEMENTED.**

### 6.11 `nova-app-control`

Owns package visibility, allowlisted app launching, deep links, share intents, and app availability checks. It must distinguish launching an app from controlling its internal UI.

WhatsApp, banking apps, password managers, and other sensitive applications must be separately classified. A deep link or share intent is not equivalent to message automation.

**Status: NOT IMPLEMENTED.**

### 6.12 `nova-foreground`

Owns the future foreground service for user-visible, long-running native sessions. It must show an ongoing notification, expose a stop action, maintain a bounded session, and tear down all capture and accessibility resources when the session ends.

The foreground service must not become a hidden permanent agent. Its notification must clearly state that NOVA is observing or interacting with the device.

**Status: NOT IMPLEMENTED.**

### 6.13 `nova-work`

Owns future WorkManager jobs for deferrable, retryable, non-interactive tasks such as cleanup, upload of approved audit metadata, and reminder scheduling within platform limits.

WorkManager must not be used as proof that continuous UI automation is possible. Interactive screen control requires an active and permitted native session.

**Status: NOT IMPLEMENTED.**

### 6.14 `nova-voice`

Owns future speech-to-text and text-to-speech adapters. Microphone use must be explicit, visible, bounded, and stoppable. Speech transcripts must follow the same redaction and retention policy as typed goals.

**Status: NOT IMPLEMENTED.**

### 6.15 `nova-media`

Owns future camera and gallery access. It must request only the relevant media permission, use the Android system picker where possible, and avoid broad library access when a user-selected asset is sufficient.

**Status: NOT IMPLEMENTED.**

### 6.16 `nova-observability`

Owns structured native logs, metrics, health events, correlation IDs, crash-safe event buffering, and redaction. It must never log raw screen images, passwords, notification bodies, access tokens, or full accessibility trees.

**Status: NOT IMPLEMENTED.**

## 7. Expo UI to Native Bridge

### 7.1 Bridge principle

The bridge is a capability gateway, not a general-purpose Android API wrapper. Every method is asynchronous, typed, cancellable, correlated to an Agent Run, and validated on the native side.

The bridge must be implemented as a custom Expo native module or equivalent React Native native module in a custom development/native build. The current Expo web preview remains useful for UI work but cannot validate the Android service layer.

### 7.2 Bridge request envelope

Every request must contain:

- `protocolVersion`.
- `requestId`.
- `runId`.
- `operationId`.
- `capability`.
- `issuedAt` and `expiresAt`.
- `idempotencyKey`.
- `approvalToken` when policy requires approval.
- A typed operation payload.

The native side must reject expired requests, duplicate idempotency keys, unknown capabilities, unsupported protocol versions, and requests that do not match the current run session.

### 7.3 Bridge result envelope

Every result must contain:

- `requestId` and `runId`.
- `status`: `ACCEPTED`, `COMPLETED`, `PARTIAL`, `FAILED`, `TIMEOUT`, `CANCELLED`, `PERMISSION_REQUIRED`, `USER_CANCELLED`, or `UNSUPPORTED`.
- `capability` and `operationType`.
- `startedAt`, `finishedAt`, and optional latency.
- A redacted result payload.
- Evidence references and confidence where relevant.
- A typed error code when the operation did not complete.

### 7.4 Event channel

The native layer may emit progress events for service state, permission changes, operation progress, observations, verification evidence, and stop events. Events must be resumable or replay-safe because the Expo process can be recreated.

The event channel must not stream raw screen frames or unrestricted notification data to JavaScript. Large artifacts must use a private, access-controlled reference with an explicit expiry.

### 7.5 Server coordination

The Expo app sends user intent and approval decisions to the server-side Agent Core. The Agent Core creates a native operation request and returns it to the Expo app or native bridge through the authenticated session.

The native layer should not independently contact an AI provider. If offline behavior is later required, it must use a separately approved local policy and must still enforce the same capability and audit rules.

## 8. IPC and Process Boundaries

### 8.1 In-process bridge

The Expo native module and the primary Android application may communicate through the React Native/Expo module boundary. This boundary is suitable for short request submission and event delivery, but it is not a reliable long-running worker boundary.

### 8.2 Service IPC

Long-running Android components communicate through explicit service contracts. The preferred order is:

1. A typed bound-service interface for active sessions.
2. Explicit intents for starting or stopping a service.
3. A private local persistence queue for events that must survive process death.
4. Binder or Messenger communication where the service needs a live client connection.

Parcelable or serialized messages must be versioned. A service must not assume that the Expo activity is alive.

### 8.3 Process death and restart

The native layer must persist only the minimum session metadata needed to recover safely. After process death, it must return to a `DISCONNECTED` or `RECOVERY_REQUIRED` state and must not resume a sensitive interaction automatically.

A recovered run must re-check permission state, foreground-session validity, target package state, action expiry, and user approval. Unverified actions must be cancelled rather than replayed.

### 8.4 No remote arbitrary IPC

The services must be private to the application package. Exported components require a documented Android permission and an explicit reason. No public Binder endpoint, local network server, WebSocket control port, or shell bridge may be added for device control.

## 9. Android Permissions and Special Access

Permissions are grouped by capability. The final manifest must include only permissions required by implemented features. Adding a permission to the manifest does not mean the capability is available.

| Capability | Android permission or access | Grant model | Security notes |
|---|---|---|---|
| Accessibility observation and actions | `android.permission.BIND_ACCESSIBILITY_SERVICE` on the service declaration | User enables the service in Accessibility Settings; not a normal runtime prompt | Highly sensitive; must be policy-reviewed and clearly disclosed |
| Notification listener | `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE` on the service declaration | User enables notification access in system settings | Notification contents require minimization and package allowlists |
| App notifications from NOVA | `POST_NOTIFICATIONS` | Runtime permission on supported Android versions | Needed only for visible NOVA notifications |
| Screen capture | MediaProjection consent token | Per-user consent flow; token is not a permanent permission | Must show capture disclosure and stop promptly |
| Camera | `android.permission.CAMERA` | Runtime permission | Capture only after user action or approved bounded operation |
| Microphone | `android.permission.RECORD_AUDIO` | Runtime permission | Must show recording state and stop control |
| Direct phone call | `android.permission.CALL_PHONE` | Runtime permission | Requires explicit approval; do not infer from a plan |
| Phone state | `android.permission.READ_PHONE_STATE` where required | Runtime permission or version-specific access | Avoid call-log permissions unless the product requires them |
| Contacts | `READ_CONTACTS` | Runtime permission | Prefer user-selected contacts over broad access |
| Exact alarms | `SCHEDULE_EXACT_ALARM` or the applicable platform path | Special user access and policy restrictions | Use only for user-visible, justified alarm behavior |
| Foreground service | `FOREGROUND_SERVICE` plus the applicable service-type permission | Manifest declaration and Android policy | Requires an ongoing user-visible notification |
| MediaProjection foreground service | Applicable media-projection foreground-service permission on target API | Manifest plus user consent | Must be used only while capture is active |
| Network | `INTERNET` | Normal install permission | Server calls must use TLS and authenticated sessions |
| Gallery selection | System picker preferred; media permissions only when broad access is necessary | User choice or runtime permission depending on API and picker | Do not request broad media access for a single selected asset |
| Package discovery | Package visibility declarations as needed | Manifest visibility rules | Do not request broad package visibility without a documented need |

`BIND_ACCESSIBILITY_SERVICE` and `BIND_NOTIFICATION_LISTENER_SERVICE` are service-binding protections, not substitutes for user enablement. The native layer must query actual service state before every session.

## 10. Security Architecture

### 10.1 Trust zones

The system has four trust zones:

1. **User and OS permission zone:** the user and Android decide whether a capability is enabled.
2. **Native enforcement zone:** Kotlin services enforce capability, request, and lifecycle constraints.
3. **Server policy zone:** the Agent Core owns planning, approvals, AI output validation, and audit persistence.
4. **Model zone:** AI output is untrusted data. It can propose actions but cannot grant permission or bypass validation.

### 10.2 Capability tokens

A capability grant must identify the user, capability, scope, expiry, allowed packages, allowed operation types, risk ceiling, approval requirement, and revocation version.

Capability tokens are authorization records, not Android permissions. Native code must independently verify the Android permission or service state before performing an operation.

### 10.3 Sensitive operations

The following operations require an explicit approval token for each action unless the user has configured a narrowly scoped, auditable standing rule:

- Sending or publishing a message.
- Initiating a phone call.
- Handling one-time passwords or authentication codes.
- Entering payment or banking data.
- Changing account security settings.
- Deleting data.
- Granting or changing Android permissions.
- Capturing or transmitting sensitive screen content.

WhatsApp automation is not a general capability. At most, the architecture may support a user-visible share or deep-link flow. UI automation requires separate legal, policy, safety, and device validation before it can be considered.

### 10.4 Data minimization

Raw screenshots, accessibility trees, notification bodies, audio, and OCR frames are sensitive artifacts. The default policy is:

- Capture only for a bounded operation.
- Redact before server upload.
- Store references rather than duplicate payloads.
- Apply an expiry time.
- Delete on run cancellation unless retention is explicitly required.
- Record the source and redaction state in the audit trail.

### 10.5 Secrets

Provider credentials remain server-side. Native code must not receive provider API keys. Device session keys and local encryption keys belong in Android Keystore-backed storage. Bridge payloads must not contain bearer tokens unless the authenticated bridge protocol explicitly requires a short-lived, scoped token.

### 10.6 Emergency stop

The emergency stop must cancel queued operations, signal the foreground service, stop MediaProjection, unregister transient observation callbacks, prevent new bridge requests, and record an audit event. The stop path must not wait for an AI response or a network round trip.

## 11. Service Lifecycle

### 11.1 Native layer states

```text
UNAVAILABLE
   |
INSTALLED -> PERMISSION_REQUIRED -> READY
                              |
                         SESSION_STARTING
                              |
                         OBSERVING
                              |
                         EXECUTING
                              |
                         VERIFYING
                              |
                    STOPPING / DISCONNECTED
                              |
                         RECOVERY_REQUIRED
```

`UNAVAILABLE` means the native build or module is not present. `PERMISSION_REQUIRED` means the build is present but one or more user grants are missing. `READY` means required capabilities were verified at runtime. `RECOVERY_REQUIRED` means the system stopped safely and requires a new explicit session.

### 11.2 AccessibilityService lifecycle

The service may be enabled by the user while the app is not open. Its callbacks must not start agent work automatically. It should publish service health and bounded observation availability, then wait for an authorized session request.

On disablement, package update, permission loss, or service crash, all active interaction requests must fail safely and the server must receive a capability-revoked event.

### 11.3 NotificationListenerService lifecycle

Notification access may be revoked independently of the app. The service must report enablement and disablement, apply package and content filters, and avoid treating a notification as proof that an action succeeded without corroborating evidence.

### 11.4 MediaProjection lifecycle

A capture session begins only after user consent. The projection token is scoped to the session. On stop, app backgrounding where policy requires it, user cancellation, service failure, or emergency stop, the virtual display and frame resources must be released.

### 11.5 Foreground service lifecycle

The foreground service starts only for a user-visible operation that qualifies for foreground execution. It posts its notification before performing long-running work, exposes a stop action, enforces a maximum session duration, and records its termination reason.

### 11.6 WorkManager lifecycle

WorkManager handles deferred jobs with constraints and bounded retries. It must not resume an interactive UI action after a reboot or process death without revalidation and, where required, fresh user approval.

## 12. Environment Adapter Bridge

The Environment Adapter presents a stable interface to the Agent Executor and hides Android-specific implementations.

Conceptual operations include:

- `getEnvironmentStatus`.
- `getCapabilityStatus`.
- `observe(request)`.
- `launchApp(request)`.
- `performAction(request)`.
- `verify(request)`.
- `requestUserPermission(request)`.
- `stopSession(request)`.

Each operation returns a typed result with evidence, provenance, confidence, and a platform-specific error mapped to a stable domain code.

The adapter must not expose Android `AccessibilityNodeInfo`, `Intent`, `Bitmap`, `Notification`, `Call`, or `MediaProjection` objects to the server or JavaScript layer. It must convert them into bounded contracts.

**Status: NOT IMPLEMENTED.**

## 13. Android Interaction Architecture

### 13.1 Observation priority

The future Verifier should prefer evidence in this order:

1. Structured accessibility state.
2. App metadata or explicit app state.
3. Notification evidence where appropriate.
4. OCR evidence from a bounded capture.
5. Screenshot analysis as a last resort.
6. Human confirmation when evidence remains insufficient.

The ordering is a policy preference, not a guarantee. Some applications expose incomplete or misleading accessibility data.

### 13.2 Action execution

The Executor must submit one action at a time. Before execution, the native layer verifies the target package, current foreground app, capability grant, action expiry, risk classification, and precondition.

After execution, the native layer returns immediate operation status. The Verifier then requests a fresh observation. A successful call to an Android API is not sufficient evidence that the user-visible outcome occurred.

### 13.3 App launching

App launch is separate from app control. The App Control module may launch an allowlisted package or a user-approved deep link. Internal UI interaction remains unavailable unless the relevant observation and interaction capability is enabled.

### 13.4 WhatsApp

The architecture does not assume a supported API for arbitrary WhatsApp UI automation. A safe initial boundary is user-visible share or deep-link composition followed by user confirmation. Automated recipient selection, message sending, or reading private conversations remains **BLOCKED BY PLATFORM LIMITATION** until a supported, policy-compliant, device-tested path exists.

### 13.5 Phone calls

Opening the system dialer with a `tel:` URI is distinct from placing a call. Full call control would require native Telecom integration, and becoming the default phone app carries requirements for a dial pad, incoming-call UI, ongoing-call UI, and `InCallService`. NOVA must not claim full phone-assistant behavior without implementing and testing those requirements.

## 14. Persistence and Audit

The server remains the source of truth for Agent Runs, plans, approvals, events, audits, and usage. The native layer maintains only operational state required for safe execution and recovery.

Native persistence should include:

- Native layer installation and protocol version.
- Capability and permission state.
- Active session ID and expiry.
- In-flight operation IDs and idempotency keys.
- Emergency-stop state.
- Minimal pending event queue.
- Artifact references and expiry metadata.

Every native operation must produce an audit event containing the run ID, capability, operation type, package, actor, approval reference, result status, evidence reference, and timestamps. Raw sensitive payloads must be excluded or encrypted with a short retention window.

## 15. Logging and Observability

Native logs use structured fields:

- `correlationId`.
- `runId`.
- `requestId`.
- `operationId`.
- `capability`.
- `packageName` where permitted.
- `status`.
- `errorCode`.
- `durationMs`.
- `redactionState`.

Logs must not include access tokens, provider keys, passwords, OTPs, full notification text, raw screenshots, raw OCR frames, or complete accessibility trees. Diagnostic capture must require a separate developer-only flag and must never be enabled in production builds by default.

## 16. Testing Strategy

### 16.1 Unit tests

Kotlin unit tests must cover:

- Capability matching.
- Permission-state mapping.
- Request expiry.
- Idempotency and replay rejection.
- Action allowlists.
- Risk and approval enforcement.
- Redaction rules.
- Observation normalization.
- Result and error mapping.
- Recovery and cancellation behavior.

### 16.2 Android component tests

Instrumented tests must cover service binding, manifest declarations, notification-channel behavior, Keystore access, foreground-service startup, WorkManager constraints, and process recreation.

### 16.3 Device tests

A physical Android test matrix is required. It must include supported API levels, screen densities, OEM battery-management behavior, accessibility settings, notification access, permission revocation, lock/unlock transitions, network loss, app process death, and device reboot.

### 16.4 Security tests

Security tests must attempt to:

- Submit an expired request.
- Reuse an idempotency key.
- Call a capability without a grant.
- Call a sensitive operation without approval.
- Send a request for a package outside the allowlist.
- Read raw notification content through the bridge.
- Resume a stale operation after process death.
- Bypass the emergency stop.

Each attempt must fail closed and create an appropriate audit record.

### 16.5 Expo integration tests

The Expo UI must be tested against three native states:

1. Native layer unavailable.
2. Native layer installed but permissions missing.
3. Native layer ready and connected.

The UI must display these states accurately. Web preview tests must not be treated as Android capability tests.

## 17. Deployment Strategy

### 17.1 Development

The first native milestone requires a custom Android development build or a bare/prebuilt Android project. The build must be installed on a physical Android device or verified Android emulator. Expo Go is insufficient for the privileged services in this architecture.

The development build must use a non-production application ID, debug signing, local server configuration, and explicit developer diagnostics. Accessibility and notification access must be enabled manually on the test device.

### 17.2 Staging

Staging requires a signed internal APK or AAB, a separate application ID or distribution track, staging server credentials, test-only capability policies, and an instrumented device matrix. Staging must verify fresh installation, upgrade, permission revocation, rollback, and data deletion.

### 17.3 Production

Production requires release signing, Play Console declarations, privacy disclosures, permission justifications, a review of AccessibilityService policy eligibility, notification-data handling, foreground-service declarations, and a documented stop and support path.

The product must not request all permissions during onboarding. It should request a capability only when the user invokes a feature that needs it and should explain the scope, data handling, and stop mechanism before opening Android settings.

### 17.4 Release gates

A release is blocked until all of the following are true:

- The native build installs and starts on the supported device matrix.
- The bridge reports accurate capability and permission state.
- Emergency stop works while the app UI is closed.
- Process death fails safe and does not replay sensitive actions.
- Accessibility, notification, projection, camera, microphone, and phone permissions are tested individually.
- Audit records are complete and redacted.
- No feature is described as supported unless it has a passing physical-device test.
- The APK/AAB is signed and reproducible through the approved build pipeline.

## 18. Migration Plan Without Removing Expo

### Stage A: Contract preparation

Keep the existing Expo application and server unchanged. Define native capability identifiers, bridge envelopes, permission states, and unsupported-result handling as shared contracts.

**Status: NOT IMPLEMENTED.**

### Stage B: Custom native build shell

Add the minimum native build path required to load a custom Expo module. Verify that the Expo UI remains functional in the custom Android build before adding any privileged service.

**Status: NOT IMPLEMENTED.**

### Stage C: Read-only capability discovery

Implement only capability and permission status reporting. Do not capture screens or execute actions. Validate service state and bridge reconnect behavior.

**Status: NOT IMPLEMENTED.**

### Stage D: One bounded observation capability

Introduce one observation source, preferably a narrow accessibility status query, with explicit redaction and physical-device tests. Do not combine observation and action in the first native milestone.

**Status: NOT IMPLEMENTED.**

### Stage E: Bounded interaction

Add one allowlisted, low-risk interaction with precondition and postcondition verification. Add emergency stop and process-death tests before expanding the action vocabulary.

**Status: NOT IMPLEMENTED.**

### Stage F: Additional services

Add notification access, MediaProjection, OCR, foreground execution, WorkManager, voice, camera, and gallery one capability at a time. Each capability requires its own permission flow, policy, tests, and release gate.

**Status: NOT IMPLEMENTED.**

## 19. Risks and Explicit Limitations

| Risk or limitation | Classification | Architectural response |
|---|---|---|
| Expo web preview cannot validate privileged Android services | BLOCKED BY PLATFORM LIMITATION | Require custom native build and physical-device tests |
| Accessibility APIs differ by app and OEM | Technical risk | Use evidence confidence, allowlists, and human intervention |
| Notification contents are highly sensitive | Security risk | Package filters, redaction, minimization, and expiry |
| MediaProjection consumes memory and requires user consent | Platform and resource risk | Bounded sessions, frame limits, immediate teardown |
| Android background execution is restricted | Platform limitation | Foreground service for visible sessions; WorkManager for deferrable work |
| WhatsApp has no general supported automation API for this product | BLOCKED BY PLATFORM LIMITATION | Limit initial scope to share/deep-link flows |
| Full call control requires Telecom/default-dialer requirements | Platform limitation | Start with dialer launch; treat full assistant calling separately |
| OEMs may kill background services | Device risk | Reconnect state, safe cancellation, device-matrix testing |
| Model output may request unsafe actions | Security risk | Native capability gateway and server-side policy enforcement |
| Process death may occur mid-action | Reliability risk | Idempotency, expiry, no automatic replay of sensitive operations |

## 20. Architecture Acceptance Criteria

This architecture is accepted only if the following statements remain true during implementation:

1. The existing Expo app remains the user-facing control center.
2. The native layer is optional and its availability is shown accurately.
3. No service bypasses the capability gateway.
4. No model output can grant permission or directly execute arbitrary Android APIs.
5. Every operation is correlated, bounded, auditable, and cancellable.
6. Sensitive data is redacted before crossing the bridge or leaving the device.
7. Process death, permission revocation, and emergency stop fail closed.
8. Android support is claimed only after physical-device verification.
9. Unsupported features are labeled **BLOCKED BY PLATFORM LIMITATION**.
10. Unfinished features are labeled **NOT IMPLEMENTED**.

## 21. References

[1]: https://docs.expo.dev/modules/native-module-tutorial/ "Expo Tutorial: Create a Native Module"

[2]: https://developer.android.com/develop/background-work/services "Android Developers: Services Overview and Background Work"

[3]: https://developer.android.com/develop/connectivity/telecom/dialer-app "Android Developers: Build a Default Phone Application"

[4]: https://developer.android.com/reference/android/accessibilityservice/AccessibilityService "Android API Reference: AccessibilityService"

[5]: https://developer.android.com/reference/android/service/notification/NotificationListenerService "Android API Reference: NotificationListenerService"

[6]: https://developer.android.com/media/grow/media-projection "Android Developers: MediaProjection"

[7]: https://developer.android.com/topic/libraries/architecture/workmanager "Android Developers: WorkManager"
