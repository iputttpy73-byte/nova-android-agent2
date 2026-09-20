# Agent Core Integration Phase 1 Report

## Scope

Agent Core Integration Phase 1 unifies the implemented domain subsystems into one deterministic workflow. The integration starts with a user goal and ends in either `READY` or `HUMAN_INTERVENTION` after intent parsing, planning, governed memory retrieval, verification preparation, recovery preparation, provider capability inspection, intervention detection, lifecycle transition, and audit recording.

## Workflow

The implemented flow is:

`User Goal → Intent Parsing → Planning → Memory Retrieval → Verification Preparation → Recovery Preparation → Human Intervention Detection → Agent Run Ready`

A goal is created as an Agent Run, submitted, moved to `INTENT_PARSING`, parsed by the existing Intent Parser, attached to the run, planned by the existing Planner, and attached to move the run to `READY`. The integration then retrieves memory through the governed memory read policy, creates expected verification postconditions for each plan step, prepares bounded recovery budgets and strategies, and records AI provider capabilities and availability status.

If the intent contains ambiguities or the plan requires approval, the workflow creates a governed Human Intervention request and transitions the Agent Run from `READY` to `HUMAN_INTERVENTION`. Otherwise, the run remains `READY`.

## Subsystem integration

The Agent Core is the lifecycle authority. The Intent Parser and Planner are injected through their existing interfaces. Memory is read only through `MemoryRepositories.entries.read`, preserving purpose and sensitivity controls. Verification preparation persists `ExpectedPostcondition` records without producing evidence or executing verification. Recovery preparation uses the configured Recovery Policy to choose a deterministic prepared strategy and bounded retry budget without attempting recovery. Human Intervention uses its policy and repository to create clarification or approval requests. The AI Provider Layer is integrated through provider capability inspection and explicit `AVAILABLE` or `NOT_CONFIGURED` status; no provider completion is required for the deterministic foundation workflow.

Every integration stage writes an audit event through the existing Agent Run audit repository. Existing subsystem repositories continue to write their own policy and audit records.

## Validation

- TypeScript check: passed.
- Lint: passed.
- Tests: 59 passed, 1 scaffold test skipped.
- Build: passed.
- Ready workflow integration test: passed.
- Ambiguity-to-human-intervention integration test: passed.
- Next phase: not started.

## Explicit boundaries

Android, AccessibilityService, NotificationListenerService, OCR, screenshot analysis, Environment Adapter execution, and device control remain **NOT IMPLEMENTED**. The workflow prepares typed contracts and policy decisions only; it does not execute device actions, capture observations, call Android services, or claim a configured AI provider exists.
