# NOVA Execution Task Backlog

## 1. Baseline and rules

هذه القائمة مبنية على الحالة الحالية الفعلية للمشروع. تم استبعاد كل الأعمال المكتملة، بما في ذلك عقود Agent Core، Planner، Persistence، Memory foundation، Verifier foundation، Recovery foundation، Human Intervention foundation، AI abstraction، Expo shell، local Expo Module source، وExpo autolinking.

الحالة الحالية ليست MVP بعد لأن APK لم يُبنَ، وKotlin لم يُcompile، وNative Module لم يُشغّل على Android، ولم يُنفّذ workflow كامل على جهاز حقيقي.

حالات المهام المستخدمة:

- **UNBLOCKED:** يمكن بدء المهمة الآن.
- **BLOCKED:** لا يمكن إكمالها قبل dependency أو عائق خارجي.
- **BLOCKED-ENV:** محجوبة ببيئة Android أو جهاز، وليست عيبًا في المنتج.
- **BLOCKED-DECISION:** تحتاج قرارًا أو اعتمادًا خارجيًا، مثل اختيار AI provider.

## 2. Separate Android build blockers

هذه المهام ليست product features، لكنها تمنع الوصول إلى أول APK.

| ID | المهمة | Priority | Complexity | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| ENV-001 | Provision Android SDK Platform 36، Build Tools 36.0.0، Platform Tools، NDK 27.1.12297006، وCMake | P0 | High | — | كل الأدوات موجودة، و`adb` و`sdkmanager` و`cmake` تعمل من PATH | BLOCKED-ENV |
| ENV-002 | Configure Android build environment أو CI runner | P0 | Medium | ENV-001 | `ANDROID_HOME` أو `ANDROID_SDK_ROOT` مضبوط، ولا يوجد machine-specific path committed | BLOCKED-ENV |
| ENV-003 | Run `./gradlew :app:assembleDebug --no-daemon --stacktrace` | P0 | Medium | ENV-001, ENV-002 | Kotlin وJava compilation وmanifest merge وresources وML Kit وWorkManager تمر، وينتج APK | BLOCKED-ENV |
| ENV-004 | Provision one emulator and one physical Android test device | P0 | High | ENV-001 | `adb devices` يعرض جهازًا بحالة `device`، ويمكن تثبيت APK | BLOCKED-ENV |

## 3. MVP Task List

### MVP outcome

MVP يعني أن المستخدم يستطيع كتابة هدف واحد مدعوم، مراجعة خطة قصيرة، الموافقة عليها، فتح تطبيق Android واحد، تنفيذ tap أو input محدود عبر Accessibility، التحقق من النتيجة، وإيقاف العملية أو رؤية تدخل مطلوب عند الفشل.

لا يشمل MVP: WhatsApp automation، المكالمات التلقائية، MediaProjection runtime، autonomous background execution، أو التحكم العام في كل تطبيقات Android.

### 3.1 MVP implementation tasks

| ID | Description | Priority | Complexity | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| MVP-001 | Build and install the first NOVA Android development APK | P0 | High | ENV-001, ENV-002, ENV-003, ENV-004 | APK installs without native loader error and opens the existing Expo UI | BLOCKED-ENV |
| MVP-002 | Execute Native Module smoke test on Android | P0 | Medium | MVP-001 | `getStatus()` and `getCapabilities()` return valid responses from compiled Kotlin | BLOCKED by MVP-001 |
| MVP-003 | Add minimal Android capability status presentation to the existing UI | P1 | Medium | MVP-002 | UI shows connected/disconnected state and does not claim unavailable capabilities work | BLOCKED by MVP-002 |
| MVP-004 | Implement first-run Accessibility onboarding flow | P0 | High | MVP-001, MVP-002 | User can open settings, enable NOVA, return to app, and see updated status | BLOCKED by MVP-001 |
| MVP-005 | Verify Accessibility lifecycle transitions | P0 | High | MVP-004 | Disabled, enabled, revoked, process-recreated, and service-disconnected states are represented truthfully | BLOCKED by MVP-004 |
| MVP-006 | Define and enforce the first supported-app allowlist | P0 | Medium | MVP-002 | Only the selected supported application can be targeted by MVP execution | UNBLOCKED |
| MVP-007 | Complete real Accessibility snapshot flow for one supported app | P0 | High | MVP-005, MVP-006 | A real screen produces a bounded UI snapshot with node metadata and no raw uncontrolled stream | BLOCKED by MVP-005 |
| MVP-008 | Add safe target selection using the opaque node handles | P0 | High | MVP-007 | Snapshot node handle can be supplied to input/action flow; stale handles return failure without acting on another node | BLOCKED by MVP-007 |
| MVP-009 | Connect tap and text-input execution to Agent Run authorization | P0 | High | MVP-008 | Only an approved run can invoke tap/input; every action returns accepted, completed, failed, or unsupported | BLOCKED by MVP-008 |
| MVP-010 | Implement the first concrete postcondition verifier | P0 | High | MVP-007, MVP-009 | Selected workflow produces evidence-based PASSED or FAILED result; no evidence means not completed | BLOCKED by MVP-009 |
| MVP-011 | Connect Agent Core to native execution for one vertical slice | P0 | High | MVP-005, MVP-006, MVP-009, MVP-010 | Goal → Intent → Plan → native action → observation → verification completes through one Agent Run | BLOCKED by MVP-010 |
| MVP-012 | Connect approval gate to the first sensitive/action step | P0 | Medium | MVP-011 | Run cannot execute the approved action until the user explicitly approves it | BLOCKED by MVP-011 |
| MVP-013 | Implement stop and cancel behavior for the active run | P0 | Medium | MVP-009, MVP-011 | User stop prevents subsequent native actions and persists CANCELLED state and audit event | BLOCKED by MVP-011 |
| MVP-014 | Implement bounded failure handling for the first workflow | P0 | High | MVP-010, MVP-011, MVP-013 | Missing node, service disconnect, timeout, and failed verification produce bounded recovery or human intervention; no infinite retry | BLOCKED by MVP-011 |
| MVP-015 | Deliver one deterministic end-to-end supported workflow | P0 | High | MVP-012, MVP-013, MVP-014 | A known goal such as “open YouTube and search for programming” succeeds on the supported test setup and produces evidence | BLOCKED by MVP-014 |
| MVP-016 | Add run timeline and native evidence to Logs screen | P1 | Medium | MVP-011, MVP-015 | User can see goal, approval, actions, verification, failure/recovery, and final result without secrets or raw sensitive content | BLOCKED by MVP-015 |
| MVP-017 | Add MVP privacy and retention controls | P0 | High | MVP-016 | User sees what is retained, can delete the run evidence, and sensitive values are redacted from logs | BLOCKED by MVP-016 |
| MVP-018 | Add provider secret configuration for one external AI provider | P0 | Medium | — | Provider secret is stored server-side, absent from client/Android bundle, and configuration can be disabled safely | BLOCKED-DECISION |
| MVP-019 | Run the first live external AI provider integration | P0 | Medium | MVP-018 | One provider returns schema-valid Intent or Plan output through the existing provider abstraction with timeout/error mapping | BLOCKED by MVP-018 |
| MVP-020 | Add provider usage limit and deterministic fallback | P1 | Medium | MVP-019, MVP-015 | Provider timeout, invalid output, or quota exhaustion falls back to deterministic supported workflow or asks for intervention | BLOCKED by MVP-019 |
| MVP-021 | Add MVP regression and release gate | P0 | High | ENV-003, ENV-004, MVP-002 through MVP-020 | All source checks pass, APK installs, first workflow passes repeatedly, negative cases do not execute, and a go/no-go checklist is signed | BLOCKED by MVP-015, MVP-017, MVP-020 |

### 3.2 MVP task notes

`MVP-006` is the only MVP implementation task that can start without Android tooling because it is a policy/configuration task. `MVP-018` can be prepared without a provider decision, but it cannot be completed until a provider and credential method are selected.

The first provider integration should not be used as a prerequisite for the first deterministic device demo. This keeps Android debugging separate from model-provider debugging. It remains a P0 MVP task if natural-language flexibility is part of the first user promise.

## 4. Public Beta Task List

Public Beta starts only after MVP-021 is complete. These tasks are not required for the first private device demonstration.

| ID | Description | Priority | Complexity | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| BETA-001 | Define supported Android versions, device matrix, and supported apps | P0 | Medium | MVP-021 | Published internal matrix covers emulator and physical devices and identifies unsupported combinations | BLOCKED by MVP-021 |
| BETA-002 | Add two to four additional deterministic workflows | P0 | High | MVP-015, BETA-001 | Each workflow has plan, action allowlist, verifier, recovery policy, and negative tests | BLOCKED by MVP-015 |
| BETA-003 | Add OCR fallback for screens where Accessibility data is insufficient | P1 | High | MVP-021, BETA-001 | OCR fixture tests pass, confidence is preserved, and low-confidence text cannot trigger an unverified action | BLOCKED by MVP-021 |
| BETA-004 | Harden Accessibility recovery and stale-screen handling | P0 | High | MVP-014, BETA-001 | UI changes, stale handles, service disconnects, and timeouts produce bounded recovery or intervention | BLOCKED by MVP-014 |
| BETA-005 | Complete Human Intervention UX for clarification and recovery assistance | P0 | High | MVP-012, MVP-014 | User can approve, reject, clarify, cancel, or resolve an intervention with expiry and audit trail | BLOCKED by MVP-014 |
| BETA-006 | Add optional NotificationListener workflow with package filtering | P1 | High | MVP-021, BETA-001 | User opt-in is explicit, packages are filtered, content is minimized, and disconnect status is visible | BLOCKED by MVP-021 |
| BETA-007 | Create guided onboarding and permission recovery UX | P0 | Medium | MVP-004, BETA-001 | New tester can enable required access, understand limitations, and recover after revocation without support intervention | BLOCKED by MVP-004 |
| BETA-008 | Add native and JavaScript crash/error diagnostics with redaction | P0 | Medium | MVP-016, BETA-001 | Every failed run has a correlation ID and safe diagnostic code; raw secrets/screens are excluded | BLOCKED by MVP-016 |
| BETA-009 | Add user-facing consent, retention, export, and deletion controls | P0 | High | MVP-017, BETA-001 | Tester can inspect, delete, and export permitted run data; deletion is audited | BLOCKED by MVP-017 |
| BETA-010 | Add provider health, fallback, quota, and cost dashboards | P0 | Medium | MVP-020, BETA-008 | Provider failures and per-user/per-run costs are visible and bounded | BLOCKED by MVP-020 |
| BETA-011 | Add per-user usage quotas and abuse limits | P0 | Medium | MVP-020, BETA-010 | Requests beyond quota are rejected clearly without native execution or uncontrolled provider spend | BLOCKED by BETA-010 |
| BETA-012 | Run repeated multi-device beta testing | P0 | High | BETA-001 through BETA-011 | Defined tester cohort completes supported workflows repeatedly and all P0 defects have owners | BLOCKED by BETA-011 |
| BETA-013 | Add feature flags for supported workflows and native capabilities | P1 | Medium | BETA-001, BETA-010 | A workflow can be disabled server-side without shipping a new APK | BLOCKED by BETA-010 |
| BETA-014 | Establish beta feedback and defect triage loop | P0 | Low | BETA-008, BETA-012 | Each tester issue includes run ID, capability, device, expected result, actual result, and severity | BLOCKED by BETA-008 |
| BETA-015 | Complete Accessibility, data-use, and user-disclosure review for beta distribution | P0 | High | BETA-009, BETA-012 | Required disclosures are present and the beta scope is approved for the selected distribution channel | BLOCKED by BETA-012 |
| BETA-016 | Public Beta go/no-go gate | P0 | High | BETA-012 through BETA-015 | No open P0 defects, known P1 risks documented, crash/error thresholds met, and rollback plan tested | BLOCKED by BETA-015 |

## 5. Production Release Task List

Production scope must contain only workflows that passed the beta gate. It must not imply generic Android control.

| ID | Description | Priority | Complexity | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| PROD-001 | Create reproducible Android release build pipeline | P0 | High | BETA-016 | CI or controlled release runner produces the same versioned artifact from a clean checkout | BLOCKED by BETA-016 |
| PROD-002 | Configure secure release signing | P0 | Medium | PROD-001 | Release keystore is managed outside source control and signed artifact verification passes | BLOCKED by PROD-001 |
| PROD-003 | Complete release upgrade, rollback, and data-migration tests | P0 | High | PROD-001, PROD-002 | Existing users upgrade without data loss and rollback behavior is documented and tested | BLOCKED by PROD-002 |
| PROD-004 | Complete security threat model and abuse-case testing | P0 | High | BETA-016 | Threats involving prompt injection, malicious UI, replay, privilege misuse, and data leakage have mitigations and tests | BLOCKED by BETA-016 |
| PROD-005 | Harden authentication, authorization, and capability grants | P0 | High | PROD-004 | Every sensitive run is authenticated, authorized, expiring, auditable, and revocable | BLOCKED by PROD-004 |
| PROD-006 | Finalize privacy policy, retention policy, deletion guarantees, and disclosures | P0 | High | PROD-004, BETA-015 | Product behavior matches published data practices and deletion tests pass | BLOCKED by PROD-004 |
| PROD-007 | Implement production provider operations | P0 | High | BETA-010, PROD-004 | Provider secrets, quotas, fallbacks, alerts, model/schema versions, and incident procedures are operational | BLOCKED by BETA-010 |
| PROD-008 | Implement billing entitlement model server-side | P0 | High | BETA-011, PROD-005 | Subscription or quota entitlement is enforced by the server and cannot be granted by the client | BLOCKED by BETA-011, PROD-005 |
| PROD-009 | Integrate selected billing channel and purchase-state recovery | P0 | High | PROD-008, PROD-006 | Purchase, restore, cancellation, expiration, and entitlement-loss paths work without granting unauthorized usage | BLOCKED by PROD-008 |
| PROD-010 | Add production quota, cost, and monetization analytics | P1 | Medium | PROD-007, PROD-008 | Team can measure provider cost, revenue eligibility, quota consumption, and failed payments | BLOCKED by PROD-008 |
| PROD-011 | Establish production reliability targets and release gates | P0 | High | BETA-016, PROD-001 | Crash rate, run completion, verification failure, provider error, and native disconnect thresholds are defined and enforced | BLOCKED by PROD-001 |
| PROD-012 | Complete final supported-device and Android-version matrix | P0 | High | BETA-012, PROD-011 | Every supported configuration has smoke evidence and unsupported configurations are blocked or documented | BLOCKED by PROD-011 |
| PROD-013 | Add user support and safe diagnostic export | P1 | Medium | BETA-014, PROD-006 | Support can diagnose a run using redacted data without requesting secrets or raw sensitive screens | BLOCKED by PROD-006 |
| PROD-014 | Establish incident response and emergency capability disablement | P0 | Medium | PROD-005, PROD-011 | A problematic workflow or provider can be disabled quickly and users receive a clear status | BLOCKED by PROD-011 |
| PROD-015 | Complete store/distribution policy readiness | P0 | High | PROD-002, PROD-006, PROD-009 | Distribution metadata, Accessibility disclosures, data declarations, signing, and policy checks are approved | BLOCKED by PROD-009 |
| PROD-016 | Run production release candidate test matrix | P0 | High | PROD-003 through PROD-015 | Release candidate passes functional, security, upgrade, billing, device, and negative tests | BLOCKED by PROD-015 |
| PROD-017 | Execute staged production rollout | P0 | Medium | PROD-016 | Release is deployed to a controlled percentage/cohort with rollback monitoring | BLOCKED by PROD-016 |
| PROD-018 | Operate post-release monitoring and support | P0 | High | PROD-017 | Alerts, dashboards, support ownership, incident response, and weekly defect review are active | BLOCKED by PROD-017 |

## 6. Critical paths

### 6.1 First APK artifact

```text
ENV-001
→ ENV-002
→ ENV-003
```

The first APK artifact exists when `assembleDebug` completes and the generated debug APK is present with a recorded version, path, and checksum. `ENV-004` is not required to produce the artifact, but it is required for installation and runtime validation.

### 6.2 First installed APK and native smoke test

```text
ENV-001
→ ENV-002
→ ENV-003
→ ENV-004
→ MVP-001
→ MVP-002
```

The installed APK path is complete when the APK installs on a test device and the compiled Kotlin module returns valid `getStatus()` and `getCapabilities()` responses.

### 6.3 First end-to-end Android agent workflow

```text
ENV-001
→ ENV-002
→ ENV-003
→ ENV-004
→ MVP-001
→ MVP-002
→ MVP-004
→ MVP-005
→ MVP-007
→ MVP-008
→ MVP-009
→ MVP-010
→ MVP-011
→ MVP-012
→ MVP-013
→ MVP-014
→ MVP-015
```

This is the most important path. It produces one supervised, verifiable Android workflow. OCR, NotificationListenerService, MediaProjection, TTS, and background work are not on this path.

### 6.4 First external AI provider integration

```text
MVP-018
→ MVP-019
→ MVP-020
```

The first provider integration is complete when a real provider returns validated structured output through the current abstraction, failures are mapped, and deterministic fallback prevents provider failure from producing false execution.

The provider path can be developed in parallel with Android build work, but it must not be allowed to hide an unverified Android execution path.

### 6.5 First real user test

```text
ENV-001
→ ENV-002
→ ENV-003
→ ENV-004
→ MVP-001
→ MVP-002
→ MVP-004
→ MVP-005
→ MVP-011
→ MVP-012
→ MVP-013
→ MVP-015
→ MVP-016
→ MVP-017
→ MVP-021
```

The first external tester should receive a private build only after the workflow has passed repeated internal tests and the app explains Accessibility consent, supported apps, data retention, and limitations.

### 6.6 Monetization readiness

```text
MVP-015
→ MVP-017
→ MVP-018
→ MVP-019
→ MVP-020
→ BETA-010
→ BETA-011
→ BETA-012
→ BETA-015
→ BETA-016
→ PROD-007
→ PROD-008
→ PROD-009
→ PROD-010
→ PROD-015
```

Monetization should follow demonstrated value and controlled provider cost. Billing must not be added before quotas, privacy, entitlement enforcement, and reliable supported workflows exist.

## 7. Completion percentages

Percentages below measure **stage delivery readiness**, not the percentage of backlog rows marked complete. Completed foundation work is reflected in the estimate, while unverified Android runtime work is not treated as complete.

| Stage | Estimated completion | Basis |
|---|---:|---|
| MVP | **35%** | Domain foundations, persistence, planning, bridge source, static checks, and Expo integration exist; APK, Android runtime, vertical slice, provider, privacy gate, and release gate remain. |
| Public Beta | **10%** | MVP foundations can support beta work, but no supported-device matrix, repeated tester runs, beta diagnostics, quotas, or beta go/no-go evidence exists. |
| Production Release | **5%** | Core source foundation exists, but release build, signing, security, billing, policy readiness, operations, and staged rollout remain. |

Strict remaining-task completion is **0% for the listed MVP, Beta, and Production tasks**, because this backlog intentionally contains only unfinished execution tasks. The percentages above are product-stage readiness estimates, not task-count ratios.

## 8. Remaining-task totals

### MVP count

- **21 MVP product-development tasks:** `MVP-001` through `MVP-021`.
- **4 separate Android environment blockers:** `ENV-001` through `ENV-004`.
- **Total MVP execution items:** **25 tasks**.

All 21 MVP product tasks are remaining. None should be marked completed based only on source-level foundations.

### Completion estimate

The estimated MVP completion is **approximately 35%** when measured against the complete MVP outcome:

- Foundation, contracts, persistence, planning, policy models, bridge source, and static checks are substantially complete.
- The remaining 65% is the difficult delivery portion: Android build, device runtime, native lifecycle, real action execution, verification, one vertical slice, privacy controls, and release gating.

On a strict task-count basis, **0 of the 21 MVP delivery tasks are complete**, because the backlog intentionally excludes already completed foundation work. The 35% estimate represents product readiness, not backlog completion.

## 9. Top 10 Highest Priority Remaining Tasks

| Rank | Task | Why next |
|---:|---|---|
| 1 | ENV-001 | Nothing Android can compile until the SDK toolchain exists. |
| 2 | ENV-002 | Gradle needs a reproducible SDK configuration. |
| 3 | ENV-003 | Establishes whether Kotlin, ML Kit, WorkManager, resources, and packaging compile. |
| 4 | ENV-004 | Required for installation and all runtime evidence. |
| 5 | MVP-001 | Produces the first installable NOVA development build. |
| 6 | MVP-002 | Confirms the Expo-to-Kotlin bridge at runtime. |
| 7 | MVP-004 | Makes Accessibility consent available to a real user. |
| 8 | MVP-005 | Prevents the Agent Core from trusting stale or false service state. |
| 9 | MVP-007 | Provides the first real Android observation evidence. |
| 10 | MVP-011 | Connects the existing domain systems to one real native execution path. |

In parallel, `MVP-018` may be prepared as soon as the provider choice and secret-management method are approved. It is not a substitute for the Android critical path.

## 10. Delivery decision

The next delivery target should be **Private MVP**, not Public Beta or Production. The team should not add more Android capabilities before the first critical path succeeds.

The immediate definition of done is:

> One real Android device runs one approved NOVA goal through the existing Agent Core, performs one bounded Accessibility action, verifies the expected state, records an auditable result, and stops safely on failure or cancellation.

Once that outcome is proven, the backlog can proceed to beta reliability, privacy, quotas, supported-device coverage, and finally monetization and production distribution.
