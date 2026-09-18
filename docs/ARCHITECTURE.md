# Architecture Revision 1

## AI Personal Android Agent

**Status:** Architecture Phase only  
**Version:** 1.0.0-revision-1  
**Author:** Manus AI  
**Project:** `ai-task-orchestrator`  
**Target platform:** Expo mobile application with server-side orchestration where required

> This document defines the architecture for an AI Personal Android Agent. It does not implement agent behavior, Android automation, AI providers, AccessibilityService integration, OCR, screenshot analysis, environment adapters, or Phase 2 features.

## 1. Product Definition

The primary product is a personal AI agent that helps a user accomplish goals on an Android device through controlled observation, planning, interaction, verification, and recovery.

The product is not a generic task orchestrator. Task orchestration is an internal mechanism used to manage an agent run. The user-facing concept is an agent that receives a goal, develops an explicit plan, performs approved Android interactions, verifies each meaningful action, recovers from failures when safe, and requests human intervention when it cannot proceed safely.

The agent must be treated as a supervised system. It may propose or perform only actions allowed by policy, granted capabilities, the selected Android environment, and the user's approval settings. An AI model must never grant permissions to itself.

## 2. Scope and Phase Boundary

### 2.1 This revision defines

This revision defines:

- The product requirements for an AI Personal Android Agent.
- The first-class agent modules and their responsibilities.
- The AI Agent Workflow.
- The Android Interaction Architecture.
- Server-side orchestration boundaries.
- Capability-based permissions.
- Data, persistence, memory, security, and logging architecture.
- Platform limitations and technical risks.
- Future interfaces as contracts, without implementation code.

### 2.2 Explicitly not implemented

The following are architecture targets only:

- Agent Core behavior.
- Intent Parser behavior.
- Planner behavior.
- Executor behavior.
- Verifier behavior.
- Recovery Engine behavior.
- Human Intervention Manager behavior.
- Screen Observation Layer behavior.
- Android Accessibility Layer integration.
- OCR integration.
- Screenshot analysis.
- Gesture execution.
- App launching.
- AI provider integration.
- Remote Android environment integration.
- Durable agent workers.
- Production memory retrieval and retention workflows.
- Automated action approval UI.
- Phase 2 implementation.

These items are **NOT IMPLEMENTED**. No placeholder functionality or simulated success is permitted.

## 3. Requirements Analysis

### 3.1 Primary user goal

A user should be able to express a natural-language goal such as completing a bounded workflow in an Android application. The agent should convert that goal into a transparent plan, perform only permitted actions, inspect the resulting screen state, and report whether the goal was completed, partially completed, blocked, or requires the user's help.

### 3.2 Functional requirements

The future system must:

1. Accept a user goal and relevant constraints.
2. Parse the goal into an explicit intent representation.
3. Identify required Android capabilities and risk levels.
4. Produce a plan composed of observable and verifiable steps.
5. Ask for approval when a step is sensitive, irreversible, ambiguous, or outside standing permissions.
6. Observe the Android screen through supported observation mechanisms.
7. Read available UI hierarchy information when permitted.
8. Use OCR or screenshot analysis when structured UI information is unavailable and the capability is approved.
9. Execute approved gestures, text entry, navigation, or app-launch operations through a controlled Android interaction layer.
10. Verify the expected post-action state before continuing.
11. Retry or recover from bounded failures without repeating dangerous actions blindly.
12. Escalate to a human when confidence is insufficient or policy requires intervention.
13. Store an auditable history of goals, plans, observations, actions, verification outcomes, interventions, and final results.
14. Allow the user to stop, cancel, or revoke permissions.

### 3.3 Non-functional requirements

The system must be safe by default, explicit about uncertainty, auditable, privacy-preserving, capability-based, resilient to network loss, bounded in cost and execution time, and replaceable at provider and environment boundaries.

The mobile experience must remain responsive. Long-running planning or execution must not depend on the mobile process remaining alive indefinitely. The system must distinguish an unsupported capability from a failed operation and must never claim that an Android capability works without a verified implementation and target environment.

## 4. System Context and Boundaries

The system has four conceptual zones:

1. **User and mobile control plane:** receives goals, displays plans, requests approvals, shows progress, and presents results.
2. **Agent orchestration plane:** parses intent, plans, coordinates execution, verifies results, manages recovery, and records state.
3. **Android interaction plane:** observes and interacts with a real Android device or an approved remote Android environment.
4. **AI and persistence plane:** provides model inference, memory, durable task data, artifacts, logs, and audit records.

The Expo mobile application is not assumed to be a privileged Android automation host. If the product requires native Android `AccessibilityService` access, the deployment must provide a verified native Android integration path. A standard Expo application alone does not prove that this capability is available.

## 5. Modular Architecture

The architecture uses explicit module boundaries. Domain policies depend on contracts, not on Expo components, model SDKs, database drivers, or Android vendor implementations.

```text
User Goal and Approval UI
          |
Mobile Agent Client and Session State
          |
Typed API / Authentication Boundary
          |
Agent Orchestration Services
          |
+-----------------------------------------------------------+
| Agent Core                                                |
| Intent Parser | Planner | Executor | Verifier             |
| Recovery Engine | Human Intervention Manager              |
+-----------------------------------------------------------+
          |                         |
Screen Observation Layer       Memory System
Android Accessibility Layer    AI Provider Abstraction
          |                         |
          +---------- Environment Adapter ----------------+
                             |
       Real Android Device / Verified Remote Android Lab
                             |
           Persistence, Queue, Audit, Security, Logs
```

## 6. First-Class Components

### 6.1 Agent Core

The Agent Core owns the agent-run state machine and coordinates the other modules. It maintains the current goal, plan version, step, observation context, capability grants, budgets, confidence, and escalation status.

The Agent Core is not an unconstrained autonomous loop. It must invoke each module through a bounded operation, persist the resulting event, and evaluate policy before moving to the next action.

**Status: NOT IMPLEMENTED.**

### 6.2 Intent Parser

The Intent Parser converts the user's natural-language goal into a normalized intent. The intent should identify the desired outcome, target applications or entities, constraints, forbidden actions, ambiguity, sensitivity, and required capabilities.

The parser must preserve uncertainty. It must not invent missing user preferences or interpret an ambiguous goal as permission for a sensitive action. Ambiguous intent should lead to clarification or human intervention.

**Status: NOT IMPLEMENTED.**

### 6.3 Planner

The Planner converts a normalized intent into a sequence or graph of bounded steps. Each step must define an expected precondition, an action proposal, an expected postcondition, a verification strategy, an estimated risk, and a recovery policy.

Plans are proposals until approved by policy. A plan must be invalidated or replanned when the observed Android state differs materially from its assumptions.

**Status: NOT IMPLEMENTED.**

### 6.4 Executor

The Executor submits one approved action at a time to the Android Interaction Architecture. It must not directly call arbitrary device APIs. It must enforce action budgets, idempotency expectations, timeout limits, and capability checks.

The Executor must return an operation result that distinguishes accepted, completed, rejected, timed out, interrupted, and unsupported outcomes.

**Status: NOT IMPLEMENTED.**

### 6.5 Verifier

The Verifier compares the observed post-action state with the step's expected postcondition. Verification may use UI hierarchy evidence, OCR evidence, screenshot evidence, application state evidence, or a combination of approved signals.

Verification must record evidence provenance and confidence. A model's statement that an action succeeded is not sufficient by itself when the Android environment can be observed directly.

**Status: NOT IMPLEMENTED.**

### 6.6 Recovery Engine

The Recovery Engine handles bounded failures such as a changed screen, a missing element, a transient timeout, or an interrupted interaction. It may retry an action only when the action is safe to repeat or when idempotency is established.

Recovery strategies include re-observation, plan repair, alternate locator selection, returning to a known state, waiting for a bounded interval, and requesting human intervention. The engine must stop rather than loop indefinitely.

**Status: NOT IMPLEMENTED.**

### 6.7 Human Intervention Manager

The Human Intervention Manager pauses an agent run when the system needs clarification, approval, a device action, authentication, a security decision, or a judgment that cannot be safely automated.

An intervention request must state the reason, the exact requested user action, the affected capability, the expiry time, and the consequence of ignoring it. It must not conceal a sensitive action behind a generic confirmation message.

**Status: NOT IMPLEMENTED.**

### 6.8 Screen Observation Layer

The Screen Observation Layer produces a normalized representation of the current Android UI. It may combine UI hierarchy data, accessibility nodes, OCR regions, screenshots, application metadata, and interaction feedback.

Observation records must include timestamp, source, screen or window identity when available, confidence, redaction status, and correlation to the agent step. Sensitive screen content must be minimized and protected.

**Status: NOT IMPLEMENTED.**

### 6.9 Android Accessibility Layer

The Android Accessibility Layer is the platform-specific boundary for Android UI observation and interaction. It is responsible for translating approved observations and actions into Android-native operations while enforcing the capabilities granted to the agent.

The layer must be isolated from planning logic. The Planner may request an abstract action such as selecting a visible control, but only the Accessibility Layer or a verified environment adapter may resolve that request into a platform operation.

**Status: NOT IMPLEMENTED.**

### 6.10 Memory System

The Memory System stores short-lived run context, prior observations, user preferences, successful interaction patterns, and explicitly retained facts. It must distinguish facts supplied by the user from inferences produced by an AI model.

Memory retrieval must be scoped by user, task, application, sensitivity, and purpose. Memory must not silently become an unrestricted source of permissions.

**Status: NOT IMPLEMENTED.**

### 6.11 Environment Adapter

The Environment Adapter represents the target Android environment. It may eventually connect to a verified physical device, a native Android integration, or an independently managed remote Android device lab.

It declares capabilities and limits. It must refuse unsupported operations explicitly and must expose environment identity, connection state, authorization state, and safety constraints.

**Status: NOT IMPLEMENTED.**

## 7. AI Agent Workflow

The canonical workflow is:

```text
User Goal
    → Intent Parsing
    → Planning
    → Execution
    → Verification
    → Retry / Recovery
    → Human Intervention
    → Completion
```

Human intervention is not necessarily a single final step. It may occur after intent parsing, before a sensitive plan, during execution, after a failed verification, or before completion when evidence is insufficient.

### 7.1 User Goal

The user submits a goal, optional constraints, target application information, and approval preferences. The system creates a run with an idempotency key and records the original goal without modifying its meaning.

### 7.2 Intent Parsing

The Intent Parser produces a normalized intent and identifies ambiguity, entities, constraints, forbidden actions, sensitivity, and required capabilities. If the intent is not sufficiently clear, the run moves to human intervention rather than executing a guess.

### 7.3 Planning

The Planner creates a versioned plan. Each step includes preconditions, action type, target description, expected result, verification method, risk classification, and recovery options. Policy evaluates the plan before execution.

### 7.4 Execution

The Executor selects the next approved step, requests a fresh observation if needed, verifies capability grants, and submits the abstract action to the Android Interaction Architecture. Every action produces an event before the next step begins.

### 7.5 Verification

The Verifier obtains post-action evidence and evaluates whether the expected state was reached. A failed or uncertain verification does not automatically mean the action failed; it means the system must follow the step's evidence and recovery policy.

### 7.6 Retry / Recovery

The Recovery Engine classifies the failure, checks whether repetition is safe, and chooses a bounded strategy. It may re-observe, re-plan, retry, return to a known state, or escalate. Every retry increments an attempt counter and consumes a defined budget.

### 7.7 Human Intervention

The Human Intervention Manager creates a clear intervention request when approval, clarification, authentication, device access, or judgment is required. The agent remains paused until the request is resolved, expires, or is cancelled.

### 7.8 Completion

Completion requires a terminal verification result. The run becomes `SUCCEEDED`, `PARTIALLY_SUCCEEDED`, `FAILED`, `CANCELLED`, or `BLOCKED`. The final record includes the plan version, executed actions, evidence summary, unresolved issues, and any user intervention.

## 8. Android Interaction Architecture

### 8.1 Architecture overview

```text
Agent Executor
      |
Capability and Policy Gate
      |
Android Interaction Contract
      |
Android Accessibility Layer
      |-------------|
UI Hierarchy   Screenshot/OCR
      |-------------|
Normalized Screen Observation
      |
Verifier and Agent Core
```

The Android Interaction Architecture is an adapter boundary. The agent cannot assume that all Android devices expose the same nodes, permissions, window behavior, navigation semantics, or application security controls.

### 8.2 AccessibilityService integration

A native Android `AccessibilityService` may provide access to accessibility events, visible window information, accessibility nodes, and certain interaction actions when the user explicitly enables the service and the operating system permits the requested operation.

The service must be treated as a high-privilege component. It requires explicit disclosure, clear enablement, a capability allowlist, secure communication with the agent control plane, event filtering, redaction, and a revocation path.

A standard Expo mobile scaffold does not by itself establish that a custom native `AccessibilityService` is present, enabled, or distributable under the intended product configuration.

**Status: BLOCKED BY PLATFORM LIMITATION** for the current Expo-only baseline.  
**Status: NOT IMPLEMENTED** for a verified custom native Android integration.

### 8.3 UI hierarchy reading

When available, the Accessibility Layer reads the visible UI hierarchy and normalizes nodes into safe observation records. A node may contain role, text, content description, bounds, enabled state, selected state, focus state, and actionable operations.

The system must minimize captured text, redact sensitive fields where possible, avoid retaining the complete hierarchy by default, and attach source and timestamp metadata. Missing hierarchy data must be represented as unavailable rather than fabricated.

**Status: NOT IMPLEMENTED.**

### 8.4 OCR support

OCR may identify text in a screenshot when the UI hierarchy does not expose usable text. OCR output must include bounding regions, confidence, language or model metadata, and a link to the source image or observation record.

OCR is evidence, not authorization. Low-confidence OCR must not be used alone for high-risk actions. OCR processing must follow the data retention and redaction policy.

**Status: NOT IMPLEMENTED.**

### 8.5 Screenshot analysis

Screenshot analysis may provide visual state information such as layout, icons, dialogs, loading indicators, and visual confirmation of a result. Screenshots may contain passwords, private messages, financial information, or health data, so capture and retention require strict controls.

The Verifier must record whether the screenshot is direct device evidence, transformed evidence, or model interpretation. Model interpretation cannot be treated as direct evidence.

**Status: NOT IMPLEMENTED.**

### 8.6 Gesture execution

The interaction layer may eventually expose bounded gestures such as tap, long press, swipe, scroll, back navigation, and text input. Each gesture must have a target, coordinate or node reference, timeout, capability requirement, and expected postcondition.

Raw coordinate execution is fragile and risky. It should be used only when node-based interaction is unavailable and policy allows it. Coordinates must be tied to the observation that produced them and must expire when the screen changes.

**Status: NOT IMPLEMENTED.**

### 8.7 App launching

App launching requires an explicit package or deep-link target, a capability decision, and a verification step confirming that the intended application became visible. The system must not infer a package from an ambiguous application name when multiple applications match.

Launching an app does not grant access to its data or controls. Subsequent actions require their own observation and capability checks.

**Status: NOT IMPLEMENTED.**

### 8.8 Verification after action

Every meaningful action must define a verification strategy before execution. Verification may check a changed node, a new screen identity, a visible confirmation, a changed value, a navigation event, or a bounded timeout result.

If verification fails, the agent must not automatically repeat an action that could create duplicates or irreversible effects. The Recovery Engine must classify the action and either re-observe, repair the plan, or request human intervention.

**Status: NOT IMPLEMENTED.**

### 8.9 Android virtualization

The current mobile application does not provide an Android emulator or nested Android operating system. In-app Android virtualization is not proven by this architecture.

**Status: BLOCKED BY PLATFORM LIMITATION.**

A future remote Android environment adapter may target an independently managed and verified device lab. That adapter is not part of this revision's implementation.

## 9. Capability-Based Permissions

Capabilities are explicit grants, not model suggestions. Examples include:

- `observe_accessibility_tree`
- `capture_screenshot`
- `run_ocr`
- `analyze_screenshot`
- `launch_declared_app`
- `tap_visible_target`
- `gesture_scroll`
- `enter_text`
- `navigate_back`
- `read_declared_value`
- `write_declared_value`
- `use_network`
- `persist_memory`

Each capability has an owner, scope, risk level, expiry, approval source, and optional application or screen restriction. Capabilities are evaluated before an action and must be revalidated after a material state change.

High-risk capabilities must require explicit human approval unless the user has configured a narrowly scoped standing permission. A capability grant cannot be inferred from a previous successful action.

## 10. Task and Agent Run Lifecycle

The agent run is server-owned when durable orchestration is required. The mobile client requests transitions but cannot set arbitrary states.

```text
DRAFT
  → SUBMITTED
  → INTENT_PARSING
  → CLARIFICATION_REQUIRED | PLAN_PENDING
  → POLICY_REVIEW
  → APPROVAL_REQUIRED | READY
  → EXECUTING
  → VERIFYING
  → RECOVERING
  → HUMAN_INTERVENTION
  → COMPLETED | PARTIALLY_COMPLETED | FAILED | CANCELLED | BLOCKED | EXPIRED
```

`RECOVERING` may return to `EXECUTING` or `VERIFYING` within a bounded budget. `HUMAN_INTERVENTION` may return to `PLAN_PENDING`, `EXECUTING`, or a terminal state depending on the intervention result.

Every transition records actor or service identity, reason, correlation ID, plan version, capability snapshot, and timestamp. Terminal states are immutable except for append-only correction records.

## 11. AI Provider Abstraction

The AI Provider abstraction isolates model selection, credentials, multimodal input, structured output, tool proposals, usage, timeouts, and provider-specific errors from the Agent Core.

The provider may support intent parsing, plan generation, visual interpretation, recovery suggestions, or summarization. These are separate logical roles even when one model serves more than one role. The provider must return normalized output with confidence and evidence references where applicable.

AI output is always an untrusted proposal until validated by schemas, policy, capability checks, and the relevant observation or environment evidence. The provider cannot directly execute Android actions.

Provider selection must consider capabilities, privacy, latency, cost, region, and data handling policy. Provider credentials remain server-side.

**Status: NOT IMPLEMENTED.**

## 12. Environment Adapter Abstraction

The Environment Adapter represents the Android execution target and exposes only approved operations.

A valid adapter must declare:

- Environment identity and version.
- Connection and authorization status.
- Supported observation sources.
- Supported interaction operations.
- Application and package restrictions.
- Screenshot and OCR limits.
- Gesture and text-entry limits.
- Timeout and cancellation behavior.
- Data retention and artifact policy.
- Security and isolation boundary.

The adapter must return `SUPPORTED`, `UNSUPPORTED`, `DENIED`, `FAILED`, `TIMEOUT`, or `INTERRUPTED` outcomes distinctly. It must not convert `UNSUPPORTED` into a simulated success.

**Status: NOT IMPLEMENTED.**

## 13. Memory System

The Memory System contains the following layers:

1. **Current goal context:** the user's current request and explicit constraints.
2. **Run working memory:** the active plan, observations, action results, verification evidence, and recovery attempts.
3. **Session memory:** bounded context for the current authenticated session.
4. **Application interaction memory:** explicitly retained patterns such as a user's preferred navigation or naming convention, scoped to an application and purpose.
5. **Durable personal memory:** user-approved facts and preferences with provenance, sensitivity, and retention rules.

Memory retrieval must never become an implicit permission system. A stored preference such as a preferred application may inform a plan, but it cannot authorize a sensitive action.

Memory writes generated by the agent require provenance and policy. Sensitive observations should not be promoted to durable memory automatically. Users must be able to inspect, delete, and revoke retained memory.

**Status: NOT IMPLEMENTED.**

## 14. Security Architecture

### 14.1 Identity and authorization

The system uses the scaffold-compatible authentication boundary for authenticated user sessions. Server-side authorization must evaluate user identity, task ownership, agent-run ownership, role, capability scope, target application scope, and approval state.

### 14.2 Accessibility security

Accessibility access is a privileged boundary. The product must explain what data may be observed, which actions may be performed, how data is retained, and how the user can disable access. The agent must not operate while the service is unauthorized, revoked, or outside its declared scope.

### 14.3 Secret management

Provider credentials, database credentials, signing keys, and environment credentials remain server-side. They must not enter the Expo bundle, local general-purpose storage, task prompts, screenshots, observations, or logs.

### 14.4 Prompt and observation security

User goals, screen text, OCR output, screenshots, and accessibility nodes are untrusted content. They may contain instructions designed to manipulate the agent. The Agent Core must treat observed screen text as data, not as policy or authorization.

### 14.5 Action security

Every action requires a capability check, target binding, risk decision, and verification strategy. Sensitive actions require approval. The action executor must not accept arbitrary coordinates, package names, deep links, or text values without validation and scope checks.

### 14.6 Privacy and retention

Screen observations and screenshots are potentially sensitive. Collection must be minimized, access-controlled, encrypted in transit and at rest where supported, redacted when possible, and deleted according to retention rules.

### 14.7 Isolation

High-risk Android interaction should be isolated from general API handling when the deployment model permits. Remote environments require independent authentication, resource limits, network restrictions, artifact controls, and auditability.

**Status: NOT IMPLEMENTED beyond scaffold-level authentication support.**

## 15. Logging and Audit Architecture

Structured logs and audit events are separate concerns. Logs support operations and debugging. Audit events support accountability and must be append-only and access-controlled.

Agent events should include:

- Goal accepted or rejected.
- Intent parsed and ambiguity detected.
- Plan created, revised, approved, or denied.
- Capability requested, granted, denied, expired, or revoked.
- Observation acquired and its source.
- Action proposed, approved, submitted, completed, or rejected.
- Verification result and evidence class.
- Recovery attempt and reason.
- Human intervention requested and resolved.
- Memory read, written, promoted, or deleted.
- Terminal completion or blocking reason.

Logs must include correlation ID, run ID, step ID, plan version, actor or service reference, duration, severity, and stable error code. They must exclude secrets, raw tokens, unrestricted screenshots, and sensitive screen text by default.

**Status: NOT IMPLEMENTED.**

## 16. Persistence Architecture

### 16.1 Relational records

The durable data model should include users, agent runs, goals, intent versions, plan versions, plan steps, capability grants, observations, action attempts, verification records, recovery attempts, intervention requests, results, memory metadata, idempotency records, and audit events.

### 16.2 Object storage

Large screenshots, redacted observation artifacts, and user-approved output files may use object storage. Objects must be referenced by controlled IDs and access policies rather than exposed as unrestricted URLs.

### 16.3 Local device storage

Local storage may hold non-sensitive drafts, UI settings, bounded cache metadata, and secure session material through the platform's secure storage mechanism. It must not be treated as durable execution state.

### 16.4 Consistency

A state transition and its audit event should be committed atomically. An action attempt, observation reference, and verification result should be linked by run ID and step ID. Repeated submissions use an idempotency key tied to the authenticated user and request fingerprint.

### 16.5 Recovery and reconciliation

Durable agent runs require queue leases, timeout handling, cancellation reconciliation, and recovery after worker or network failure. The mobile application must treat cached run state as stale until refreshed.

**Status: NOT IMPLEMENTED.**

## 17. Logical Data Models

The following are logical models only. Physical schema, migrations, indexes, and encryption implementation are **NOT IMPLEMENTED**.

### 17.1 Agent Run

| Field | Description |
|---|---|
| `runId` | Stable identifier for one agent execution |
| `ownerId` | Authenticated user owner |
| `goal` | Original user goal |
| `status` | Agent lifecycle state |
| `targetEnvironmentId` | Selected environment adapter |
| `targetApplication` | Declared package or application scope, if known |
| `capabilitySnapshot` | Capabilities granted for this run |
| `planVersion` | Current plan version |
| `budget` | Time, action, model, and cost limits |
| `createdAt` / `finishedAt` | Lifecycle timestamps |
| `terminalReason` | Safe completion or blocking reason |

### 17.2 Intent

| Field | Description |
|---|---|
| `intentId` | Intent version identifier |
| `runId` | Parent run |
| `desiredOutcome` | Normalized desired result |
| `entities` | Extracted targets and values |
| `constraints` | User constraints and forbidden actions |
| `ambiguities` | Unresolved questions |
| `requiredCapabilities` | Capabilities implied by the intent |
| `confidence` | Parser confidence with explanation |
| `source` | User input and referenced memory |

### 17.3 Plan and Plan Step

| Field | Description |
|---|---|
| `planId` | Versioned plan identifier |
| `runId` | Parent run |
| `version` | Monotonic plan version |
| `steps` | Ordered or conditional step references |
| `approvalState` | Pending, approved, denied, or expired |
| `createdAt` | Plan creation time |

A plan step contains a precondition, abstract action, target binding, expected postcondition, verification method, risk class, retry budget, and recovery options.

### 17.4 Observation

| Field | Description |
|---|---|
| `observationId` | Observation identifier |
| `runId` / `stepId` | Execution context |
| `source` | Accessibility tree, OCR, screenshot, app metadata, or combined |
| `payloadReference` | Protected structured data or object reference |
| `confidence` | Evidence confidence |
| `redactionState` | Redacted, minimized, or restricted |
| `capturedAt` | Capture time |

### 17.5 Action Attempt

| Field | Description |
|---|---|
| `attemptId` | Action attempt identifier |
| `stepId` | Plan step |
| `operation` | Abstract interaction operation |
| `capability` | Required capability |
| `targetReference` | Observation-bound target |
| `status` | Accepted, completed, rejected, failed, timeout, or interrupted |
| `startedAt` / `finishedAt` | Timing |
| `environmentReference` | Adapter execution reference |

### 17.6 Verification Record

| Field | Description |
|---|---|
| `verificationId` | Verification identifier |
| `stepId` | Plan step |
| `expectedPostcondition` | Expected state |
| `evidenceReferences` | Observation evidence |
| `result` | Passed, failed, uncertain, or unavailable |
| `confidence` | Verification confidence |
| `reason` | Safe explanation |

### 17.7 Intervention Request

| Field | Description |
|---|---|
| `interventionId` | Request identifier |
| `runId` | Parent run |
| `reason` | Clarification, approval, authentication, or recovery |
| `requestedAction` | Exact user action or decision |
| `risk` | Risk classification |
| `expiresAt` | Expiry time |
| `resolution` | User response or expiry outcome |

## 18. Future Contract Boundaries

The future implementation should expose contracts for:

- `AgentCore`: start, pause, resume, cancel, and inspect a run.
- `IntentParser`: parse a goal into a versioned intent.
- `Planner`: create or revise a plan from intent and observations.
- `Executor`: submit one approved abstract action.
- `Verifier`: evaluate a postcondition against evidence.
- `RecoveryEngine`: classify failure and select a bounded recovery.
- `HumanInterventionManager`: create, resolve, expire, and audit intervention requests.
- `ScreenObservationLayer`: acquire and normalize screen evidence.
- `AndroidAccessibilityLayer`: expose bounded hierarchy and interaction operations.
- `MemorySystem`: assemble context, retrieve, write, promote, and delete memory.
- `EnvironmentAdapter`: describe capabilities, observe, execute, cancel, and report limits.
- `AIProvider`: parse, plan, analyze, summarize, and return validated normalized responses.

These are architectural boundaries, not implementation code. **NOT IMPLEMENTED.**

## 19. Technical Risks

| Risk | Impact | Mitigation | Status |
|---|---|---|---|
| Accessibility access is unavailable or revoked | Agent cannot observe or interact | Capability negotiation, clear blocked state, human fallback | NOT IMPLEMENTED |
| Accessibility data contains sensitive content | Privacy breach | Minimize, redact, encrypt, scope, and retain briefly | NOT IMPLEMENTED |
| UI hierarchy differs across applications and devices | Incorrect target selection | Observation confidence, target binding, post-action verification | NOT IMPLEMENTED |
| OCR or screenshot interpretation is wrong | Dangerous or ineffective action | Confidence thresholds, multi-signal verification, approval gates | NOT IMPLEMENTED |
| Repeating a successful but unverified action causes duplication | Data corruption or repeated side effects | Idempotency classification and human escalation | NOT IMPLEMENTED |
| Screen text contains prompt injection | Agent follows malicious on-screen instructions | Treat observations as untrusted data; policy remains outside model output | NOT IMPLEMENTED |
| Native Android integration conflicts with Expo delivery | Feature cannot ship in current form | Decide native build boundary before implementation; prove on target devices | NOT IMPLEMENTED |
| Android virtualization is assumed without proof | False product claim | Mark unsupported and require verified external adapter | BLOCKED BY PLATFORM LIMITATION |
| Mobile process is killed during a run | Incomplete execution | Server-side durable orchestration and reconciliation | NOT IMPLEMENTED |
| AI plan is unsafe or over-broad | Unauthorized device action | Capability-based permissions, plan review, bounded steps, approvals | NOT IMPLEMENTED |
| Remote environment is compromised | Device or account compromise | Isolation, scoped credentials, network policy, audit, revocation | NOT IMPLEMENTED |
| Provider cost or latency is uncontrolled | Unpredictable user impact | Budgets, quotas, model routing, cancellation | NOT IMPLEMENTED |

## 20. Platform Limitations

### 20.1 Expo and React Native boundary

The initialized project uses Expo SDK 54 and React Native. This provides the mobile application shell and client control plane. It does not automatically provide privileged Android automation APIs.

### 20.2 AccessibilityService

A custom Android `AccessibilityService` requires a native Android integration, operating-system enablement, user consent, and platform-specific validation. It is not proven by the current Expo-only scaffold.

**Status: BLOCKED BY PLATFORM LIMITATION** for the current baseline.  
**Status: NOT IMPLEMENTED** for custom native integration.

### 20.3 Android virtualization

The application does not contain an Android emulator or nested Android operating system. Any remote Android device lab would be a separate environment adapter and infrastructure product.

**Status: BLOCKED BY PLATFORM LIMITATION.**

### 20.4 Background execution

Mobile operating systems do not guarantee that a JavaScript process will remain alive for arbitrary long-running agent execution. Durable work must run behind a server-side queue or worker design.

**Status: NOT IMPLEMENTED.**

### 20.5 Arbitrary shell or code execution

The mobile client must not provide arbitrary shell or code execution. Any future remote execution environment requires isolation and separate security review.

**Status: NOT IMPLEMENTED.**

### 20.6 Direct MCP access

The mobile application cannot directly access a user's MCP tools. Any future connector must be a server-side, explicitly authorized integration.

**Status: BLOCKED BY PLATFORM LIMITATION** for direct client access.

## 21. Project Structure Target

This structure is a future organization target. It does not authorize implementation in this phase.

```text
ai-task-orchestrator/
├── app/                                  # Expo routes and agent UI
├── components/                           # Presentation components
├── hooks/                                # Mobile hooks
├── lib/
│   ├── agent-client/                     # Typed agent API client
│   ├── auth/                             # Session coordination
│   ├── observation/                      # Client observation display models
│   └── _core/                            # Scaffold-managed infrastructure
├── shared/
│   ├── agent-contracts/                  # Shared DTOs and schemas
│   ├── capabilities/                     # Capability names and policy types
│   └── _core/                            # Scaffold-managed shared code
├── server/
│   ├── agent/
│   │   ├── agent-core/                   # Run state machine
│   │   ├── intent-parser/                # Intent boundary
│   │   ├── planner/                      # Plan boundary
│   │   ├── executor/                     # Action coordinator
│   │   ├── verifier/                     # Evidence evaluation
│   │   ├── recovery/                     # Recovery policies
│   │   └── intervention/                 # Human intervention manager
│   ├── observation/                      # Screen observation normalization
│   ├── android/                          # Accessibility contract boundary
│   ├── ai/                               # AI Provider abstraction
│   ├── environments/                     # Environment Adapter abstraction
│   ├── memory/                           # Memory System
│   ├── security/                         # Authorization and capability policy
│   ├── persistence/                      # Repositories and transactions
│   ├── observability/                    # Logs and audit
│   └── _core/                            # Scaffold-managed infrastructure
├── drizzle/                              # Future durable schema
├── tests/                                # Contract, policy, and conformance tests
└── docs/ARCHITECTURE.md                  # This document
```

## 22. Logging, Security, and Persistence Status

The architecture retains the following baseline principles:

- Server-side orchestration is used for durable or privileged work.
- Secrets remain server-side.
- Capability-based permissions are required before observation or action.
- User approval is required for sensitive or ambiguous operations.
- Observations are treated as untrusted data.
- AI output cannot directly authorize or execute an action.
- Logs are structured and redacted.
- Audit events are append-only and access-controlled.
- Memory is scoped, provenance-aware, and deletable.
- Persistence uses idempotency, transaction boundaries, and reconciliation.

All advanced behavior described in these principles is **NOT IMPLEMENTED**.

## 23. Phase Boundary

This document is the complete Architecture Revision 1 deliverable. It changes the product center from a generic task orchestrator to an AI Personal Android Agent and defines the required first-class modules and Android interaction boundary.

No implementation code is included. No agent loop has been started. No AccessibilityService has been integrated. No Android interaction, OCR, screenshot analysis, AI provider, memory system, or environment adapter has been implemented.

## 24. References

[1]: https://developer.android.com/reference/android/accessibilityservice/AccessibilityService "Android AccessibilityService Reference"

[2]: https://developer.android.com/guide/topics/ui/accessibility/services "Android Accessibility Services Guide"

[3]: https://docs.expo.dev/versions/latest/ "Expo Documentation"

[4]: https://docs.expo.dev/workflow/overview/ "Expo Workflows Overview"

[5]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"

[6]: https://owasp.org/www-project-top-ten/ "OWASP Top 10 Web Application Security Risks"
