import { describe, expect, it } from "vitest";
import { InMemoryExecutionRepositories } from "../server/execution/repositories";
import { validateExecutionCapability, validateExecutionRequest, validateExecutionResult, validateExecutionStatus } from "../server/execution/validation";
import { EXECUTION_CAPABILITIES, EXECUTION_CAPABILITY_DEFAULTS } from "../shared/execution/policy";
import type { ExecutionPolicy, ExecutionRequest, ExecutionResult, ExecutionStatusRecord } from "../shared/execution/domain";

const now = new Date().toISOString();
const policy: ExecutionPolicy = { id: "exec-policy-1", version: "v1", allowedCapabilities: [...EXECUTION_CAPABILITIES], requiresApproval: true, maxDurationMs: 30_000, enabled: true, createdAt: now };

describe("Execution Engine contracts", () => {
  it("supports all required statuses and capabilities in the model", () => {
    const statuses = ["PENDING", "ACCEPTED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED", "INTERRUPTED", "NOT_IMPLEMENTED"];
    expect(statuses).toHaveLength(8);
    expect(EXECUTION_CAPABILITIES).toEqual(["TAP", "LONG_PRESS", "SWIPE", "SCROLL", "INPUT_TEXT", "LAUNCH_APP", "BACK", "HOME", "APP_SWITCH"]);
  });

  it("rejects executable request, result, and status records in Phase 1", () => {
    const request: ExecutionRequest = { id: "request-1", ownerId: "owner-1", runId: "run-1", capability: "TAP", policyId: policy.id, status: "RUNNING", reason: "not allowed", requestedAt: now, createdAt: now };
    expect(() => validateExecutionRequest(request)).toThrow("NOT_IMPLEMENTED");
    const result: ExecutionResult = { id: "result-1", requestId: "request-1", ownerId: "owner-1", runId: "run-1", status: "COMPLETED", error: "not allowed", completedAt: now };
    expect(() => validateExecutionResult(result)).toThrow("NOT_IMPLEMENTED");
    const status: ExecutionStatusRecord = { id: "status-1", requestId: "request-1", status: "RUNNING", reason: "not allowed", changedAt: now };
    expect(() => validateExecutionStatus(status)).toThrow("NOT_IMPLEMENTED");
  });
});

describe("Execution repository and audit integration", () => {
  it("stores an allowed request and result as NOT_IMPLEMENTED without executing", async () => {
    const repository = new InMemoryExecutionRepositories();
    await repository.policies.create(policy);
    const submission = await repository.submit({ ownerId: "owner-1", runId: "run-1", stepId: "step-1", capability: "TAP", targetReference: "future-node", parameters: { x: 10 }, policyId: policy.id, reason: "architecture-only request" });
    expect(submission.request.status).toBe("NOT_IMPLEMENTED");
    expect(submission.result.status).toBe("NOT_IMPLEMENTED");
    expect(submission.result.error).toContain("no device action");
    expect(await repository.requests.listByRun("run-1")).toHaveLength(1);
    expect(await repository.results.getByRequestId(submission.request.id)).toMatchObject({ status: "NOT_IMPLEMENTED" });
    expect(await repository.statuses.listByRequest(submission.request.id)).toMatchObject([{ status: "NOT_IMPLEMENTED" }]);
    expect((await repository.listByRun("run-1")).map((event) => event.action)).toEqual(["REQUESTED", "RESULT_RECORDED"]);
  });

  it("persists a denied policy request as NOT_IMPLEMENTED and audits rejection", async () => {
    const repository = new InMemoryExecutionRepositories();
    await repository.policies.create({ ...policy, id: "disabled-policy", enabled: false });
    const submission = await repository.submit({ ownerId: "owner-1", runId: "run-1", capability: "HOME", policyId: "disabled-policy", reason: "disabled policy test" });
    expect(submission.request.status).toBe("NOT_IMPLEMENTED");
    expect(submission.result.error).toContain("disabled");
    expect((await repository.listByRun("run-1")).at(-1)).toMatchObject({ action: "REJECTED", outcome: "DENIED" });
  });

  it("records all execution capabilities as NOT_IMPLEMENTED", async () => {
    const repository = new InMemoryExecutionRepositories();
    for (const capability of EXECUTION_CAPABILITIES) {
      const result = await repository.setCapability({ id: `cap-${capability}`, ownerId: "owner-1", capability, ...EXECUTION_CAPABILITY_DEFAULTS[capability], checkedAt: now });
      expect(result.status).toBe("NOT_IMPLEMENTED");
    }
    expect(await repository.capabilities.listByOwner("owner-1")).toHaveLength(EXECUTION_CAPABILITIES.length);
  });

  it("rejects an AVAILABLE execution capability claim", () => {
    expect(() => validateExecutionCapability({ id: "cap", ownerId: "owner-1", capability: "LAUNCH_APP", status: "AVAILABLE", reason: "claimed", checkedAt: now })).toThrow("cannot be claimed");
  });
});
