import { describe, expect, it } from "vitest";
import { InMemoryInterventionRepositories } from "../server/intervention/repositories";
import { transitionAfterIntervention } from "../server/intervention/state-integration";
import { INTERVENTION_OUTCOMES, INTERVENTION_TYPES } from "../shared/intervention/policy";
import type { InterventionPolicy, InterventionRequest, InterventionResponse } from "../shared/intervention/domain";

const policy: InterventionPolicy = { id: "policy-1", version: "v1", allowedTypes: [...INTERVENTION_TYPES], approvalRequiredFor: ["APPROVAL_REQUIRED", "SECURITY_DECISION"], allowedOutcomes: [...INTERVENTION_OUTCOMES], defaultExpiryMs: 60_000, createdAt: new Date().toISOString() };
const request = (overrides: Partial<InterventionRequest> = {}): InterventionRequest => ({ id: "request-1", ownerId: "owner-1", runId: "run-1", type: "APPROVAL_REQUIRED", title: "Approve plan", reason: "A plan needs approval", requestedAction: "Approve the next step", risk: "HIGH", status: "OPEN", policyId: "policy-1", expiresAt: "2030-01-01T00:00:00.000Z", createdAt: "2029-01-01T00:00:00.000Z", ...overrides });
const response = (overrides: Partial<InterventionResponse> = {}): InterventionResponse => ({ id: "response-1", requestId: "request-1", responderId: "owner-1", outcome: "APPROVED", message: "Approved by user", submittedAt: "2029-01-01T01:00:00.000Z", ...overrides });

describe("Human intervention contracts", () => {
  it("supports all required intervention types and outcomes", () => {
    expect(INTERVENTION_TYPES).toHaveLength(7);
    expect(INTERVENTION_OUTCOMES).toEqual(["APPROVED", "REJECTED", "CANCELLED", "EXPIRED", "RESOLVED"]);
  });

  it("maps outcomes to valid Agent Run state transitions", () => {
    expect(transitionAfterIntervention("APPROVED", "User approved", "USER", new Date().toISOString())).toMatchObject({ from: "HUMAN_INTERVENTION", to: "READY" });
    expect(transitionAfterIntervention("REJECTED", "User rejected", "USER", new Date().toISOString())).toMatchObject({ to: "BLOCKED" });
    expect(transitionAfterIntervention("CANCELLED", "User cancelled", "USER", new Date().toISOString())).toMatchObject({ to: "CANCELLED" });
    expect(transitionAfterIntervention("EXPIRED", "Request expired", "SYSTEM", new Date().toISOString())).toMatchObject({ to: "EXPIRED" });
  });

  it("rejects an invalid resume state after approval", () => {
    expect(() => transitionAfterIntervention("APPROVED", "Invalid resume", "SYSTEM", new Date().toISOString(), "COMPLETED")).toThrow("not allowed");
  });
});

describe("Human intervention repository", () => {
  it("persists request, response, resolution, and audit events", async () => {
    const repositories = new InMemoryInterventionRepositories();
    await repositories.policies.create(policy);
    await repositories.requests.create(request());
    const resolution = await repositories.respond("request-1", response());
    expect(resolution.outcome).toBe("APPROVED");
    expect(resolution.resultingRunState).toBe("READY");
    expect(await repositories.resolutions.getByRequest("request-1")).toMatchObject({ outcome: "APPROVED" });
    expect((await repositories.audit.listByRun("run-1")).map((event) => event.action)).toEqual(["REQUESTED", "RESPONDED", "RESOLVED"]);
  });

  it("maps rejection to BLOCKED and prevents duplicate resolution", async () => {
    const repositories = new InMemoryInterventionRepositories();
    await repositories.policies.create(policy);
    await repositories.requests.create(request({ id: "request-2" }));
    const resolution = await repositories.respond("request-2", response({ id: "response-2", requestId: "request-2", outcome: "REJECTED", message: "Not approved" }));
    expect(resolution.resultingRunState).toBe("BLOCKED");
    await expect(repositories.respond("request-2", response({ id: "response-3", requestId: "request-2" }))).rejects.toThrow("already resolved");
  });

  it("denies requests whose policy excludes the type", async () => {
    const repositories = new InMemoryInterventionRepositories();
    await repositories.policies.create({ ...policy, id: "restricted", allowedTypes: ["USER_CONFIRMATION"] });
    await expect(repositories.requests.create(request({ policyId: "restricted" }))).rejects.toThrow("denied by policy");
  });
});
