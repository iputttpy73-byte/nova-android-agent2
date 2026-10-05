# NOVA Practical Implementation Roadmap

## 1. Purpose

هذه الوثيقة ليست إعادة تصميم معماري. هي خطة تنفيذ عملية مبنية على الحالة الحالية الفعلية لمشروع NOVA، وتحدد الفجوة بين الوضع الحالي وبين أربع نقاط تسليم:

1. **Current State** — الحالة الحالية.
2. **Minimum Viable Product (MVP)** — أول مساعد Android قابل للاستخدام.
3. **Public Beta** — إصدار عام محدود مع مستخدمين حقيقيين.
4. **Production Release** — إصدار إنتاجي قابل للتوسع والدعم وتحقيق الدخل.

الخطة تفترض الحفاظ على المعمارية الحالية: تطبيق Expo كـ control plane، طبقات Agent Core الحالية، وlocal Expo Native Module كجسر إلى Native Android.

## 2. Executive decision

أقصر طريق عملي ليس تنفيذ كل قدرات Android المذكورة في الرؤية الأصلية. أقصر طريق هو بناء حالة استخدام واحدة supervised ومحدودة:

> **المستخدم يكتب هدفًا بسيطًا، يوافق على خطة قصيرة، يفتح NOVA تطبيق Android واحدًا مسموحًا، يقرأ UI hierarchy، ينفذ tap أو input محدودًا، ثم يتحقق من النتيجة ويعرض سجلًا واضحًا.**

لذلك يجب تأجيل WhatsApp automation، المكالمات، MediaProjection، autonomous background execution، camera workflows، وfull notification intelligence إلى ما بعد إثبات هذا المسار الأساسي.

الحالة الحالية قوية في العقود والطبقات الأساسية، لكنها ليست MVP بعد. السبب الحاسم هو أن APK لم يُبنَ بعد، ولم يتم تشغيل Kotlin أو bridge أو Android services على جهاز فعلي.

## 3. Current state baseline

### 3.1 Implemented and validated at source or JavaScript level

المشروع يحتوي على:

- Expo SDK 54 وReact Native 0.81 وReact 19.
- Mobile shell وشاشات Home وChat وTasks وLogs وSettings.
- Theme support وshared UI components وstate foundation.
- Agent Core contracts وAgent Run state machine.
- Goal وIntent وPlan وObservation وVerification وRecovery models.
- Drizzle schema وrepositories وmigrations.
- Events وAudit Trail وHuman Intervention foundations.
- AI Provider abstraction وprovider registry وstructured response validation.
- Deterministic Intent Parser.
- Deterministic Planner وplan versioning وrisk/recovery policies.
- Memory models وpolicies وrepositories وconsent/deletion foundations.
- Verifier foundation.
- Recovery Engine foundation.
- Native Android local Expo Module.
- TypeScript native client وserialization/deserialization وerror mapping.
- Kotlin `NovaNativeModule`.
- AccessibilityService source and configuration.
- NotificationListenerService source.
- OCR adapter using ML Kit source dependency.
- Text-to-Speech adapter.
- Environment Adapter for user-mediated intents.
- WorkManager foundation.
- Foreground/MediaProjection service shell.
- Android capability reporting.
- Expo autolinking and module discovery.

### 3.2 Current verification status

| Area | Current status |
|---|---|
| TypeScript check | PASS |
| Lint | PASS with existing non-blocking Node module warning |
| Unit and integration tests | PASS: 88 tests, 1 skipped |
| Server build | PASS |
| Expo prebuild | PASS |
| Expo native-module autolinking | PASS |
| `nova-native` discovery | PASS |
| Android SDK | Not available in current execution environment |
| Kotlin compilation | Not verified |
| APK | Not produced |
| Native bridge runtime | Not tested |
| Accessibility runtime | Not tested |
| Notification runtime | Not tested |
| OCR runtime | Not tested |
| TTS runtime | Not tested |
| Physical device | Not tested |
| MediaProjection runtime | Not implemented |
| Autonomous background execution | Not implemented |

### 3.3 Current high-level gap

The current project is at **pre-MVP native integration readiness**, not at a user-ready Android product. The JavaScript and contract layers are sufficiently advanced to begin MVP execution, but Android build and runtime evidence are still missing.

## 4. Stage comparison

| Stage | User-visible outcome | Complexity | Main exit condition | Main blocker today |
|---|---|---:|---|---|
| Current State | Expo control plane and native source foundation | High work already completed | Source contracts and static checks pass | Android build/runtime unavailable |
| MVP | One supervised Android workflow works end-to-end | High | APK installed and one goal completes with evidence | Kotlin build, device testing, one real AI provider |
| Public Beta | A small group can use the agent safely with observability and bounded capabilities | High | Repeated successful runs across supported devices and users | Reliability, privacy, onboarding, recovery, support |
| Production Release | Secure, supportable, monetizable Android product | Very High | Release-signed app, operational controls, billing, monitoring, policy readiness | Runtime reliability, security, scale, release operations |

## 5. MVP definition

### 5.1 Recommended MVP scope

The MVP should support exactly one narrow workflow first. The recommended workflow is:

```text
User goal:
"Open YouTube and search for programming"

Flow:
Goal entry
→ deterministic or provider-assisted intent parsing
→ plan preview
→ user approval
→ launch allow-listed app
→ accessibility observation
→ tap/search input
→ post-action observation
→ verification
→ completed or human intervention
```

The MVP should support only a small action vocabulary:

- Launch an allow-listed app.
- Read the current Accessibility UI hierarchy.
- Tap a verified target or coordinate.
- Set text in a verified input target.
- Navigate back.
- Stop or cancel the run.
- Record evidence and audit events.

The MVP should not promise generic Android automation. Unsupported operations must return an explicit unsupported or blocked result.

### 5.2 MVP required features

| Feature | Current state | MVP gap | Complexity | Dependencies |
|---|---|---|---:|---|
| Android development build | Prebuild and module source exist | Build and install a debug APK | High | SDK, NDK, CMake, Gradle, device/emulator |
| Native bridge smoke flow | TypeScript contracts tested | Execute `getStatus()` and `getCapabilities()` on Android | Medium | Successful APK build |
| Accessibility enablement | Service source and Manifest exist | User onboarding and runtime state transitions | High | APK, Android Settings, device testing |
| UI hierarchy snapshot | Source exists | Verify real nodes from supported apps | High | Bound AccessibilityService |
| Tap and input | Source exists | Verify safe target resolution and result handling | High | Accessibility runtime and test fixtures |
| App launch | Intent path exists | Allowlist and verify launch result | Medium | Android runtime |
| Agent workflow | Domain orchestration exists | Connect one real run to native observation/action/verification | High | Agent Core, bridge, persistence, device |
| Plan approval | Intervention foundations exist | Minimal approval UI connected to execution gate | Medium | Mobile UI and Agent Run lifecycle |
| Verification | Models and repository exist | Implement evidence check for the selected workflow | High | Observation, postconditions, persistence |
| Stop/cancel | State model exists | Stop an active run and block subsequent actions | Medium | Agent Run lifecycle and bridge cancellation |
| Audit trail | Persistence foundation exists | Show a usable run timeline in Logs | Medium | Existing events and UI integration |
| AI provider | Abstraction exists | Connect one provider through server-side secret configuration | Medium | Provider account, server secret, schema validation |
| Fallback behavior | Policy exists | Handle provider unavailable and deterministic fallback | Medium | Provider health and parser/planner contracts |
| Privacy controls | Architecture and memory policies exist | Basic retention, redaction, and delete controls | High | Data model, UI, audit policy |

### 5.3 MVP Android requirements

The MVP requires:

- Android development build, not Expo Go.
- Android SDK Platform 36 and the project’s resolved Build Tools/NDK requirements.
- One emulator or physical Android device for repeatable testing.
- User-enabled AccessibilityService.
- A supported Android API level, preferably API 30+ for screenshot-related paths even though screenshot capture is not required for the first MVP workflow.
- A tested list of allow-listed applications.
- Explicit stop and permission-revocation behavior.
- No background automation claim.

### 5.4 MVP AI provider requirements

The shortest implementation path is one provider only:

- OpenAI-compatible provider through the existing provider abstraction, or another single provider already supported by the server adapter.
- One server-side secret, never embedded in the Android APK or client bundle.
- Structured output for Intent and Plan.
- Timeout and retry policy.
- Usage and cost tracking.
- Deterministic fallback for the narrow supported workflow.

The MVP can launch with deterministic parsing and planning for the first workflow, while the provider integration is enabled behind a controlled configuration flag. This reduces the risk that the first device test is blocked by both Android and model-provider failures at the same time.

### 5.5 MVP testing requirements

The MVP is not complete until the following are tested:

1. Fresh APK installation.
2. Module loading and status response.
3. Accessibility permission disabled, enabled, and revoked.
4. App launch for the allow-listed application.
5. Snapshot of a known screen.
6. Tap on a known target.
7. Text input into a known field.
8. Verification success.
9. Verification failure and bounded recovery.
10. User cancellation.
11. Process recreation.
12. Provider unavailable fallback.
13. Redacted audit log.
14. No false success when a target is missing.

### 5.6 MVP release blockers

The MVP cannot be called complete while any of the following remain open:

- No compiled APK.
- No successful Kotlin compilation.
- No Android runtime bridge test.
- No Accessibility enablement test.
- No end-to-end successful workflow.
- No demonstrated failed-verification path.
- No cancel/stop behavior.
- No truthful unsupported capability behavior.
- No server-side provider secret handling.
- No privacy disclosure for screen/UI data.

## 6. Public Beta definition

### 6.1 Public Beta objective

The Public Beta should validate whether multiple real users can complete a narrow set of useful tasks without the team manually repairing every run. It should not attempt to support every Android application.

### 6.2 Public Beta required features

| Feature | MVP state | Public Beta gap | Complexity | Dependencies |
|---|---|---|---:|---|
| More than one supported workflow | One workflow | Add 2–4 workflows with explicit support matrix | Medium | Stable executor and verifier |
| Supported-app matrix | One allow-listed app | Document supported Android versions and apps | Medium | Device testing |
| Human intervention | Minimal approval | Clarification, authentication, recovery assistance, expiry | High | Existing intervention system and UI |
| Recovery | One bounded recovery path | Re-observe, replan, retry budget, escalation | High | Verifier and Recovery Engine |
| OCR fallback | Not runtime-proven | Add OCR only where Accessibility is insufficient | High | ML Kit build and fixtures |
| Notification observation | Source exists | User opt-in, package filtering, redaction, lifecycle | High | Android runtime and privacy policy |
| Run history | Foundation and logs | Searchable, understandable history and evidence | Medium | Persistence and UI |
| Privacy controls | Foundation | Consent, retention, delete, export, redaction UX | High | Memory and audit policies |
| Crash/error reporting | Not established | Native and JS crash capture with redaction | Medium | Observability service |
| Usage quotas | Not established | Per-user limits and provider-cost controls | Medium | Server and billing policy |
| Onboarding | Shell exists | Guided Android permissions and first successful task | Medium | Device runtime |
| Remote support data | Not established | Safe diagnostic bundle without secrets or raw screens | Medium | Observability and privacy |
| Provider resilience | One provider | Health checks, fallback, usage ceilings | Medium | AI provider layer |

### 6.3 Public Beta Android requirements

- Debug or internal distribution build with stable signing for testers.
- Tested Android version range and device matrix.
- Reliable Accessibility service enablement instructions.
- Notification access only if the beta explicitly includes notification workflows.
- No MediaProjection requirement unless a specific beta workflow needs it.
- Clear indication that background execution is bounded and not continuous.
- Recovery from service disconnect and process death.
- Collection of native logs that excludes screen content, passwords, tokens, and notification bodies by default.

### 6.4 Public Beta AI provider requirements

- One production-capable provider configuration.
- Secret storage outside the client.
- Provider health and timeout handling.
- Structured output validation on every response.
- Cost ceiling per run and per user.
- Deterministic fallback for supported simple tasks.
- Prompt and schema versioning.
- Logging of usage metadata without storing unnecessary user content.

### 6.5 Public Beta testing requirements

The beta must add:

- Device matrix testing.
- Repeated-run testing, not only one successful demo.
- Network loss during parsing and planning.
- Provider timeout and malformed output.
- App updates and process recreation.
- Accessibility service disablement during a run.
- UI changes in supported applications.
- Stale node handles.
- Low-confidence verification.
- User rejection of approval requests.
- Expired intervention requests.
- Memory deletion and audit checks.
- Cost and quota enforcement.

### 6.6 Public Beta release blockers

- Any silent action after permission revocation.
- Any false completion without verification evidence.
- Unbounded retry loops.
- Raw secrets or sensitive screen data in logs.
- Provider costs without limits.
- No recovery when the native service disconnects.
- No documented supported-device matrix.
- No user-visible explanation of active capabilities.
- No crash triage process.
- No way to delete retained user data.

## 7. Production Release definition

### 7.1 Production objective

Production means that NOVA can be distributed and operated as a real product. It does not mean that every Android capability is supported. Production scope must remain explicit and should initially cover only the workflows that passed the beta gate.

### 7.2 Production required features

| Feature | Public Beta state | Production gap | Complexity | Dependencies |
|---|---|---|---:|---|
| Release signing | Not complete | Managed release keystore and signed artifacts | Medium | Secure CI/CD or release workstation |
| Distribution | Limited beta | Store/internal distribution process | High | Store policy, metadata, signing |
| Security review | Partial architecture | Threat model, secret review, abuse cases, penetration review | High | Security process |
| Privacy compliance | Beta controls | Final privacy policy, consent, retention, deletion, export | High | Legal/product decisions |
| Reliability | Repeated beta testing | SLOs, crash thresholds, regression gates | High | Observability and CI |
| Native service lifecycle | Beta validation | Process death, OS restrictions, upgrade behavior | High | Device matrix |
| Provider operations | Cost and health controls | Production quotas, failover, incident handling | High | Provider account and billing |
| Monetization | Not implemented | Subscription/entitlement and quota enforcement | High | Billing provider and policy review |
| Support | Manual debugging | User diagnostics and support workflow | Medium | Redacted logs and issue system |
| Data operations | Persistence foundations | Backups, migration, retention enforcement, recovery | High | Database operations |
| Accessibility policy | Runtime implementation | Store-policy review and prominent disclosure | High | Product/legal review |
| Feature flags | Limited | Safe rollout and rollback controls | Medium | Server configuration |
| Upgrade safety | Not proven | Migration and rollback testing | High | Release pipeline |

### 7.3 Production Android requirements

- Stable native build pipeline.
- Reproducible SDK and dependency versions.
- Release signing outside the repository.
- APK/AAB artifact verification.
- Tested supported Android version range.
- Tested service enablement after app upgrade.
- Process death and device reboot behavior documented.
- Battery and notification behavior reviewed.
- No claim of continuous automation unless separately implemented and verified.
- MediaProjection only if it is explicitly included in the production feature set and its consent lifecycle is complete.

### 7.4 Production AI provider requirements

- Production provider account and terms approved.
- Server-side secret management.
- Usage metering and hard quotas.
- Per-user and per-run cost controls.
- Provider fallback policy.
- Model/schema versioning.
- Prompt injection and untrusted-content handling.
- Data retention decision for prompts and outputs.
- Operational alerting for provider failures.
- A deterministic degraded mode for simple supported workflows.

### 7.5 Production testing requirements

- Unit tests for all policy and state transitions.
- Contract tests for provider outputs.
- Native compilation in CI.
- APK/AAB build verification.
- Device smoke tests on every release candidate.
- Accessibility and notification lifecycle tests.
- OCR fixture regression tests.
- Security and privacy tests.
- Data migration tests.
- Load tests for Agent Core and provider calls.
- Cost and quota tests.
- Upgrade and rollback tests.
- User cancellation and emergency-stop tests.
- Negative tests proving unsupported operations do not execute.

### 7.6 Production release blockers

Production must not ship while any of these are unresolved:

- Release APK/AAB is not reproducible and signed securely.
- Native services are not verified on supported Android versions.
- Sensitive data handling is undocumented or untested.
- Provider credentials can reach the client bundle.
- Billing entitlements are not enforced server-side.
- App can report success without evidence.
- Unsupported capabilities are presented as available.
- No emergency stop or capability revocation exists.
- No crash and incident response path exists.
- Store/policy requirements for Accessibility and user data are unresolved.

## 8. Gap analysis by workstream

### 8.1 Android build and device

**Current:** Expo project, Android project, local module, Manifest, Gradle, Kotlin source, and autolinking exist.

**MVP gap:** A configured Android build environment, successful compilation, an installed APK, and one tested Android device.

**Beta gap:** Device matrix, process-death tests, service reconnect behavior, and upgrade testing.

**Production gap:** Reproducible CI build, release signing, artifact verification, supported-device policy, and upgrade/rollback process.

**Priority:** P0 for MVP.

### 8.2 Agent execution

**Current:** Agent contracts, planner, verifier, recovery, intervention, and execution models exist.

**MVP gap:** A real coordinator path that connects one Agent Run to one native action and one verified postcondition.

**Beta gap:** Multiple workflows, bounded retries, human clarification, and reliable recovery.

**Production gap:** Operational reliability, policy enforcement, abuse prevention, and complete auditability.

**Priority:** P0 for MVP.

### 8.3 AI provider

**Current:** Provider abstraction and validation exist; no production provider is configured.

**MVP gap:** One provider, one secret configuration, structured output, timeout handling, and cost limit.

**Beta gap:** Provider health, fallback, quotas, prompt/schema versioning, and usage analytics.

**Production gap:** Operations, failover, privacy, cost control, abuse handling, and model change management.

**Priority:** P0 if the MVP depends on natural-language planning; P1 if deterministic planning is used for the first workflow.

### 8.4 Accessibility and Android interaction

**Current:** Source implementation and static remediation exist; runtime is unverified.

**MVP gap:** Enablement, snapshot, tap/input, stop, and verification on one supported app.

**Beta gap:** App/version compatibility matrix and recovery from UI changes.

**Production gap:** Long-term compatibility strategy, security review, policy compliance, and robust failure handling.

**Priority:** P0 for MVP.

### 8.5 Observation and verification

**Current:** Observation and verification contracts, repositories, and source adapters exist.

**MVP gap:** One concrete evidence path, preferably Accessibility hierarchy first, with a deterministic verifier for one workflow.

**Beta gap:** OCR fallback, confidence handling, evidence retention, and multiple app layouts.

**Production gap:** Provenance, redaction, retention enforcement, and adversarial/ambiguous UI testing.

**Priority:** P0 for MVP.

### 8.6 Memory

**Current:** Governed memory foundation, repositories, policies, consent, deletion, and audit exist.

**MVP gap:** Either a deliberately disabled memory UX or a very small explicit user-preference store. Automatic memory should remain off.

**Beta gap:** User-facing consent, retrieval scope, editing, deletion, and retention explanations.

**Production gap:** Migration, backup, deletion guarantees, privacy controls, and support tooling.

**Priority:** P1. Memory is not required for the shortest usable agent path.

### 8.7 Notifications, voice, media, and background

**Current:** Source foundations exist for some of these areas.

**MVP gap:** None should be required for the first workflow.

**Beta gap:** Add only one of these as a deliberate product experiment, with explicit consent and testing.

**Production gap:** Each capability requires its own Android policy, lifecycle, privacy, and support plan.

**Priority:** P2 after the core Accessibility workflow is stable.

## 9. Shortest path to a usable Android AI agent

The shortest path is a deliberately narrow supervised vertical slice:

### Step 1 — Remove the build blocker

Use an Android-capable workstation or CI runner with the project’s required SDK, NDK, Build Tools, CMake, Gradle, and ADB versions. Do not change source code before observing an actual compiler error.

### Step 2 — Compile and install

Build the debug APK, install it, and verify `NovaNativeModule` loads. Test `getStatus()` and `getCapabilities()` before enabling any privileged service.

### Step 3 — Choose one supported application

Use one application with a stable, accessible UI. Do not begin with WhatsApp, banking, authentication, or payment workflows.

### Step 4 — Implement one real Agent Run path

Connect the existing Agent Core to:

```text
Goal → Intent → Plan → Approval → Launch → Snapshot → Tap/Input → Snapshot → Verify → Complete
```

### Step 5 — Use deterministic planning first

Use the existing deterministic parser and planner for the first workflow. This isolates Android bugs from LLM variability.

### Step 6 — Add one provider after the native path works

Connect one provider for natural-language flexibility, but preserve deterministic fallback for the known workflow.

### Step 7 — Release a private MVP

Give the build to a very small number of testers using the same device/app matrix. Collect only redacted logs and structured failure data.

## 10. Shortest path to first real users

The shortest path to first users is not a broad public launch. It is a private, invitation-only Android development build with one supported workflow.

Required sequence:

1. Complete APK build.
2. Test on one emulator and one physical device.
3. Select one safe workflow.
4. Add onboarding for Accessibility consent.
5. Add clear unsupported-operation messages.
6. Add an in-app feedback action that attaches a redacted run ID and error code.
7. Invite 5–10 testers who agree to the supported-device limitations.
8. Measure completion rate, verification failures, permission confusion, and provider cost.
9. Fix the top three failure categories before adding new capabilities.

This path produces user evidence without requiring the full production feature set.

## 11. Shortest path to monetization

The shortest monetization path is to monetize a narrow, reliable capability rather than promising a general autonomous assistant.

### Recommended order

1. Build a private MVP around one valuable workflow.
2. Add server-side usage quotas and cost tracking.
3. Offer a limited paid beta or invite-only paid plan only after repeated successful runs are measured.
4. Use one simple entitlement: monthly runs or monthly usage quota.
5. Keep billing and entitlement checks on the server.
6. Before broad Android distribution, complete the required store billing and policy review for digital functionality.
7. Add additional workflows only when the first paid workflow has acceptable completion rate and support cost.

### Monetization dependencies

- Stable user authentication.
- Server-side entitlement model.
- Usage metering.
- Provider cost ceiling.
- Refund/cancellation handling appropriate to the chosen billing channel.
- Privacy policy and data-retention explanation.
- Support process.
- Release signing and distribution channel.

### What not to monetize yet

Do not monetize promises that are not verified:

- Generic control of every Android application.
- Autonomous background operation.
- WhatsApp message sending.
- Automatic calls.
- MediaProjection screen monitoring.
- Reliable support for banking, authentication, or payment applications.

## 12. Recommended execution order

The implementation order below minimizes dependency risk:

| Order | Work package | Output | Complexity |
|---:|---|---|---:|
| 1 | Android build environment | Successful `assembleDebug` | High |
| 2 | Native Module smoke test | Confirmed Kotlin bridge calls | Medium |
| 3 | Accessibility onboarding and state | Permission and lifecycle evidence | High |
| 4 | Single-app launch and observation | Real UI snapshot | High |
| 5 | Single tap/input executor path | One bounded interaction | High |
| 6 | Concrete verifier | Verified completion/failure | High |
| 7 | Agent Run vertical slice | One complete supervised task | High |
| 8 | Deterministic private MVP | First usable build | Medium |
| 9 | One AI provider | Flexible goal interpretation | Medium |
| 10 | Recovery and intervention UX | Usable beta behavior | High |
| 11 | Privacy, observability, quotas | Safe public beta | High |
| 12 | Release signing, distribution, billing | Production candidate | High |

## 13. Explicitly deferred work

The following items should not block the first MVP unless the product decision specifically requires them:

- MediaProjection runtime flow.
- Continuous foreground agent.
- Autonomous background execution.
- Notification intelligence.
- OCR fallback.
- Speech-to-Text.
- Camera and Gallery workflows.
- WhatsApp automation.
- Automatic phone calls.
- Alarms and reminders.
- Multi-device support.
- Complex long-term memory.
- Multiple AI providers.

Deferring these items is not an architecture change. It is a release-scope decision that keeps the first usable path testable.

## 14. Final status

NOVA currently has a substantial foundation but is between **architecture completion** and **MVP implementation**. The next milestone is not another architecture document. It is a compiled Android debug build followed by one verified supervised workflow on a real device.

The project becomes an MVP when the following sentence is true and evidenced:

> A user can enter one supported goal, approve its plan, NOVA can perform the bounded Android interaction, verify the result, stop safely when required, and show an auditable outcome.

Until that sentence is proven on Android, the project remains a source-validated prototype rather than a usable Android agent.

## References

[1]: /home/ubuntu/ai-task-orchestrator/docs/ARCHITECTURE.md "NOVA Architecture Revision 1"

[2]: /home/ubuntu/ai-task-orchestrator/docs/NATIVE_ANDROID_ARCHITECTURE.md "NOVA Native Android Architecture"

[3]: /home/ubuntu/ai-task-orchestrator/docs/FINAL_DEVICE_TESTING_EXECUTION_REPORT.md "NOVA Final Device Testing Execution Report"

[4]: /home/ubuntu/ai-task-orchestrator/docs/ANDROID_STATIC_REMEDIATION_REPORT.md "NOVA Android Static Remediation Report"
