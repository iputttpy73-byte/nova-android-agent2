import { describe, expect, it } from "vitest";
import { InMemoryVerificationRepositories } from "../server/verifier/repositories";
import { DEFAULT_VERIFICATION_POLICY, evaluateEvidence } from "../shared/verifier/policy";
import type { ExpectedPostcondition, VerificationEvidence } from "../shared/verifier/domain";

const now = new Date().toISOString();
const expected: ExpectedPostcondition = { id: "post-1", runId: "run-1", stepId: "step-1", description: "The requested state is visible", requiredSignals: ["state-visible"], strategy: "STATE_MATCH", minimumConfidence: 0.7, allowedSources: ["APP_STATE", "USER_CONFIRMATION"], createdAt: now };
const evidence = (overrides: Partial<VerificationEvidence> = {}): VerificationEvidence => ({ id: `evidence-${Math.random()}`, runId: "run-1", stepId: "step-1", source: "APP_STATE", observedSignals: ["state-visible"], confidence: 0.9, redactionState: "MINIMIZED", capturedAt: now, ...overrides });

describe("Verification policy", () => {
  it("supports PASSED when required signals meet confidence", () => {
    const result = evaluateEvidence(DEFAULT_VERIFICATION_POLICY, expected, [evidence()]);
    expect(result.status).toBe("PASSED");
    expect(result.confidence.band).toBe("HIGH");
  });

  it("supports FAILED when evidence contradicts a required signal", () => {
    const result = evaluateEvidence(DEFAULT_VERIFICATION_POLICY, expected, [evidence({ observedSignals: [], contradictedSignals: ["state-visible"] })]);
    expect(result.status).toBe("FAILED");
  });

  it("supports UNCERTAIN when evidence is present but incomplete", () => {
    const result = evaluateEvidence(DEFAULT_VERIFICATION_POLICY, { ...expected, requiredSignals: ["state-visible", "content-visible"] }, [evidence()]);
    expect(result.status).toBe("UNCERTAIN");
    expect(result.missingSignals).toContain("content-visible");
  });

  it("supports UNAVAILABLE when no acceptable evidence exists", () => {
    const result = evaluateEvidence(DEFAULT_VERIFICATION_POLICY, expected, []);
    expect(result.status).toBe("UNAVAILABLE");
  });
});

describe("Verification repositories", () => {
  it("persists records, results, evidence, and audit events", async () => {
    const repositories = new InMemoryVerificationRepositories();
    await repositories.postconditions.create(expected);
    const result = await repositories.verify({ ownerId: "owner-1", runId: "run-1", stepId: "step-1", expectedPostconditionId: "post-1", evidence: [evidence({ id: "evidence-persisted" })], policy: DEFAULT_VERIFICATION_POLICY });
    expect(result.status).toBe("PASSED");
    expect(await repositories.results.getByRecordId(result.recordId)).toMatchObject({ status: "PASSED" });
    expect((await repositories.evidence.listByRecord("run-1", "step-1"))).toHaveLength(1);
    expect((await repositories.audit.listByRun("run-1")).map((event) => event.action)).toEqual(["VERIFICATION_REQUESTED", "RESULT_RECORDED"]);
  });

  it("rejects evidence from a source not allowed by the expected postcondition", async () => {
    const repositories = new InMemoryVerificationRepositories();
    await repositories.postconditions.create(expected);
    const result = await repositories.verify({ ownerId: "owner-1", runId: "run-1", stepId: "step-1", expectedPostconditionId: "post-1", evidence: [evidence({ source: "OCR" })], policy: DEFAULT_VERIFICATION_POLICY });
    expect(result.status).toBe("UNAVAILABLE");
  });
});
