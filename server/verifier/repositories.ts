import type { ExpectedPostcondition, VerificationAuditEvent, VerificationEvidence, VerificationRecord, VerificationResult } from "../../shared/verifier/domain";
import type { VerificationPolicy } from "../../shared/verifier/policy";
import { evaluateEvidence } from "../../shared/verifier/policy";
import { validateExpectedPostcondition, validateVerificationEvidence, validateVerificationRecord, validateVerificationResult } from "./validation";

export type VerificationRepositories = {
  postconditions: { create(value: ExpectedPostcondition): Promise<ExpectedPostcondition>; getById(id: string): Promise<ExpectedPostcondition | undefined> };
  evidence: { create(value: VerificationEvidence): Promise<VerificationEvidence>; listByRecord(runId: string, stepId: string): Promise<VerificationEvidence[]> };
  records: { create(value: VerificationRecord): Promise<VerificationRecord>; getById(id: string): Promise<VerificationRecord | undefined>; update(value: VerificationRecord): Promise<VerificationRecord> };
  results: { create(value: VerificationResult): Promise<VerificationResult>; getByRecordId(recordId: string): Promise<VerificationResult | undefined> };
  audit: { append(value: VerificationAuditEvent): Promise<VerificationAuditEvent>; listByRun(runId: string): Promise<VerificationAuditEvent[]> };
  verify(input: VerificationRequest): Promise<VerificationResult>;
};
export type VerificationRequest = { ownerId: string; runId: string; stepId: string; expectedPostconditionId: string; evidence: VerificationEvidence[]; policy: VerificationPolicy };
const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryVerificationRepositories implements VerificationRepositories {
  readonly postconditions: VerificationRepositories["postconditions"];
  readonly evidence: VerificationRepositories["evidence"];
  readonly records: VerificationRepositories["records"];
  readonly results: VerificationRepositories["results"];
  readonly audit: VerificationRepositories["audit"];
  readonly verify: VerificationRepositories["verify"];
  constructor() {
    const postconditions = new Map<string, ExpectedPostcondition>(); const evidence = new Map<string, VerificationEvidence>(); const records = new Map<string, VerificationRecord>(); const results = new Map<string, VerificationResult>(); const audits: VerificationAuditEvent[] = [];
    this.postconditions = { create: async (value) => { validateExpectedPostcondition(value); if (postconditions.has(value.id)) throw new Error("Postcondition already exists."); postconditions.set(value.id, clone(value)); return clone(value); }, getById: async (id) => clone(postconditions.get(id)) };
    this.evidence = { create: async (value) => { validateVerificationEvidence(value); if (evidence.has(value.id)) throw new Error("Evidence already exists."); evidence.set(value.id, clone(value)); return clone(value); }, listByRecord: async (runId, stepId) => [...evidence.values()].filter((item) => item.runId === runId && item.stepId === stepId).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).map(clone) };
    this.records = { create: async (value) => { validateVerificationRecord(value); if (records.has(value.id)) throw new Error("Verification record already exists."); records.set(value.id, clone(value)); return clone(value); }, getById: async (id) => clone(records.get(id)), update: async (value) => { validateVerificationRecord(value); if (!records.has(value.id)) throw new Error("Verification record not found."); records.set(value.id, clone(value)); return clone(value); } };
    this.results = { create: async (value) => { validateVerificationResult(value); if (results.has(value.id)) throw new Error("Verification result already exists."); results.set(value.id, clone(value)); return clone(value); }, getByRecordId: async (recordId) => clone([...results.values()].find((item) => item.recordId === recordId)) };
    this.audit = { append: async (value) => { audits.push(clone(value)); return clone(value); }, listByRun: async (runId) => audits.filter((item) => item.runId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone) };
    this.verify = async (input) => {
      const expected = await this.postconditions.getById(input.expectedPostconditionId);
      if (!expected || expected.runId !== input.runId || expected.stepId !== input.stepId) throw new Error("Expected postcondition was not found for this step.");
      await this.audit.append({ id: `verification_audit_${crypto.randomUUID()}`, ownerId: input.ownerId, runId: input.runId, stepId: input.stepId, action: "VERIFICATION_REQUESTED", outcome: "SUCCESS", metadata: { policyVersion: input.policy.version }, createdAt: new Date().toISOString() });
      for (const item of input.evidence) await this.evidence.create(item);
      const decision = evaluateEvidence(input.policy, expected, input.evidence);
      const record: VerificationRecord = { id: `verification_record_${crypto.randomUUID()}`, runId: input.runId, stepId: input.stepId, expectedPostconditionId: expected.id, status: decision.status, evidenceIds: input.evidence.map((item) => item.id), policyVersion: input.policy.version, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() };
      await this.records.create(record);
      const result: VerificationResult = { id: `verification_result_${crypto.randomUUID()}`, recordId: record.id, status: decision.status, confidence: decision.confidence, matchedSignals: decision.matchedSignals, missingSignals: decision.missingSignals, reason: decision.reason, createdAt: new Date().toISOString() };
      await this.results.create(result);
      await this.audit.append({ id: `verification_audit_${crypto.randomUUID()}`, ownerId: input.ownerId, runId: input.runId, stepId: input.stepId, recordId: record.id, action: "RESULT_RECORDED", outcome: "SUCCESS", metadata: { status: result.status, confidence: result.confidence.score }, createdAt: new Date().toISOString() });
      return clone(result);
    };
  }
}
