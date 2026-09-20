import type { RecoveryAttempt, RecoveryAuditEvent, RecoveryPolicy, RecoveryStrategy, RetryBudget } from "../../shared/recovery/domain";
import { consumeRetryBudget, selectRecoveryStrategy } from "../../shared/recovery/policy";
import { validateRecoveryAttempt, validateRecoveryPolicy, validateRecoveryStrategy, validateRetryBudget } from "./validation";

export type RecoveryRepositories = {
  policies: { create(value: RecoveryPolicy): Promise<RecoveryPolicy>; getById(id: string): Promise<RecoveryPolicy | undefined> };
  strategies: { create(value: RecoveryStrategy): Promise<RecoveryStrategy>; listByClassification(classification: RecoveryStrategy["classification"]): Promise<RecoveryStrategy[]> };
  attempts: { create(value: RecoveryAttempt): Promise<RecoveryAttempt>; getById(id: string): Promise<RecoveryAttempt | undefined>; listByRun(runId: string): Promise<RecoveryAttempt[]>; listByStep(runId: string, stepId: string): Promise<RecoveryAttempt[]>; update(value: RecoveryAttempt): Promise<RecoveryAttempt> };
  audit: { append(value: RecoveryAuditEvent): Promise<RecoveryAuditEvent>; listByRun(runId: string): Promise<RecoveryAuditEvent[]> };
  decide(input: RecoveryDecisionRequest): Promise<RecoveryDecisionResult>;
};
export type RecoveryDecisionRequest = { ownerId: string; runId: string; stepId: string; policyId: string; classification: RecoveryAttempt["classification"]; budget: RetryBudget };
export type RecoveryDecisionResult = { attempt: RecoveryAttempt; budgetAfter: RetryBudget };
const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryRecoveryRepositories implements RecoveryRepositories {
  readonly policies: RecoveryRepositories["policies"];
  readonly strategies: RecoveryRepositories["strategies"];
  readonly attempts: RecoveryRepositories["attempts"];
  readonly audit: RecoveryRepositories["audit"];
  readonly decide: RecoveryRepositories["decide"];
  constructor() {
    const policies = new Map<string, RecoveryPolicy>(); const strategies = new Map<string, RecoveryStrategy>(); const attempts = new Map<string, RecoveryAttempt>(); const audits: RecoveryAuditEvent[] = [];
    this.policies = { create: async (value) => { validateRecoveryPolicy(value); if (policies.has(value.id)) throw new Error("Recovery policy already exists."); policies.set(value.id, clone(value)); return clone(value); }, getById: async (id) => clone(policies.get(id)) };
    this.strategies = { create: async (value) => { validateRecoveryStrategy(value); if (strategies.has(value.id)) throw new Error("Recovery strategy already exists."); strategies.set(value.id, clone(value)); return clone(value); }, listByClassification: async (classification) => [...strategies.values()].filter((item) => item.classification === classification).map(clone) };
    this.attempts = { create: async (value) => { validateRecoveryAttempt(value); if (attempts.has(value.id)) throw new Error("Recovery attempt already exists."); attempts.set(value.id, clone(value)); return clone(value); }, getById: async (id) => clone(attempts.get(id)), listByRun: async (runId) => [...attempts.values()].filter((item) => item.runId === runId).sort((a, b) => a.attemptNumber - b.attemptNumber).map(clone), listByStep: async (runId, stepId) => [...attempts.values()].filter((item) => item.runId === runId && item.stepId === stepId).sort((a, b) => a.attemptNumber - b.attemptNumber).map(clone), update: async (value) => { validateRecoveryAttempt(value); if (!attempts.has(value.id)) throw new Error("Recovery attempt not found."); attempts.set(value.id, clone(value)); return clone(value); } };
    this.audit = { append: async (value) => { audits.push(clone(value)); return clone(value); }, listByRun: async (runId) => audits.filter((item) => item.runId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone) };
    this.decide = async (input) => {
      const policy = await this.policies.getById(input.policyId); if (!policy) throw new Error("Recovery policy not found."); validateRetryBudget(input.budget);
      await this.audit.append({ id: `recovery_audit_${crypto.randomUUID()}`, ownerId: input.ownerId, runId: input.runId, stepId: input.stepId, action: "RECOVERY_REQUESTED", outcome: "SUCCESS", metadata: { classification: input.classification, policyVersion: policy.version }, createdAt: new Date().toISOString() });
      const decision = selectRecoveryStrategy(policy, input.classification, input.budget); const budgetAfter = consumeRetryBudget(input.budget, decision.strategy); const priorAttempts = await this.attempts.listByStep(input.runId, input.stepId);
      const attempt: RecoveryAttempt = { id: `recovery_attempt_${crypto.randomUUID()}`, runId: input.runId, stepId: input.stepId, classification: input.classification, strategy: decision.strategy, attemptNumber: priorAttempts.length + 1, budgetBefore: input.budget, status: decision.allowed ? "PENDING" : "FAILED", reason: decision.reason, createdAt: new Date().toISOString() };
      await this.attempts.create(attempt); await this.audit.append({ id: `recovery_audit_${crypto.randomUUID()}`, ownerId: input.ownerId, runId: input.runId, stepId: input.stepId, attemptId: attempt.id, action: "STRATEGY_SELECTED", outcome: decision.allowed ? "SUCCESS" : "DENIED", metadata: { strategy: decision.strategy, budgetAfter }, createdAt: new Date().toISOString() });
      if (budgetAfter.attemptsUsed !== input.budget.attemptsUsed) await this.audit.append({ id: `recovery_audit_${crypto.randomUUID()}`, ownerId: input.ownerId, runId: input.runId, stepId: input.stepId, attemptId: attempt.id, action: "RETRY_BUDGET_CONSUMED", outcome: "SUCCESS", metadata: { attemptsUsed: budgetAfter.attemptsUsed }, createdAt: new Date().toISOString() });
      return { attempt: clone(attempt), budgetAfter };
    };
  }
}
