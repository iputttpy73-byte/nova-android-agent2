import { describe, expect, it } from "vitest";
import { InMemoryRecoveryRepositories } from "../server/recovery/repositories";
import { validateRetryBudget } from "../server/recovery/validation";
import { DEFAULT_RECOVERY_POLICY, RECOVERY_CLASSIFICATIONS, RECOVERY_STRATEGIES, consumeRetryBudget, selectRecoveryStrategy } from "../shared/recovery/policy";
import type { RecoveryPolicy, RetryBudget } from "../shared/recovery/domain";

const policy: RecoveryPolicy = { id: "policy-1", createdAt: new Date().toISOString(), ...DEFAULT_RECOVERY_POLICY };
const budget: RetryBudget = { maxAttempts: 3, attemptsUsed: 0, backoffMs: 100, maxBackoffMs: 1000 };

describe("Recovery policy", () => {
  it("supports all required classifications and strategies", () => {
    expect(RECOVERY_CLASSIFICATIONS).toEqual(["TRANSIENT_FAILURE", "VERIFICATION_FAILURE", "TIMEOUT", "INTERRUPTED", "UNKNOWN_FAILURE", "UNSUPPORTED_OPERATION"]);
    expect(RECOVERY_STRATEGIES).toEqual(["RETRY", "REOBSERVE", "REPLAN", "WAIT", "HUMAN_INTERVENTION", "ABORT"]);
  });

  it("selects retry and consumes budget for transient failures", () => {
    const decision = selectRecoveryStrategy(policy, "TRANSIENT_FAILURE", budget);
    expect(decision.strategy).toBe("RETRY");
    expect(consumeRetryBudget(budget, decision.strategy).attemptsUsed).toBe(1);
  });

  it("requires human intervention for unsupported operations", () => {
    const decision = selectRecoveryStrategy(policy, "UNSUPPORTED_OPERATION", budget);
    expect(decision.strategy).toBe("HUMAN_INTERVENTION");
    expect(decision.allowed).toBe(true);
  });

  it("aborts when the retry budget is exhausted", () => {
    const decision = selectRecoveryStrategy(policy, "TIMEOUT", { ...budget, attemptsUsed: 3 });
    expect(decision.strategy).toBe("ABORT");
    expect(decision.reason).toContain("exhausted");
  });
});

describe("Recovery repositories", () => {
  it("persists a decision, attempt, budget audit, and strategy selection audit", async () => {
    const repositories = new InMemoryRecoveryRepositories();
    await repositories.policies.create(policy);
    const result = await repositories.decide({ ownerId: "owner-1", runId: "run-1", stepId: "step-1", policyId: "policy-1", classification: "TRANSIENT_FAILURE", budget });
    expect(result.attempt.strategy).toBe("RETRY");
    expect(result.budgetAfter.attemptsUsed).toBe(1);
    expect(await repositories.attempts.listByRun("run-1")).toHaveLength(1);
    expect((await repositories.audit.listByRun("run-1")).map((event) => event.action)).toEqual(["RECOVERY_REQUESTED", "STRATEGY_SELECTED", "RETRY_BUDGET_CONSUMED"]);
  });

  it("records human intervention without consuming retry budget", async () => {
    const repositories = new InMemoryRecoveryRepositories();
    await repositories.policies.create(policy);
    const result = await repositories.decide({ ownerId: "owner-1", runId: "run-2", stepId: "step-2", policyId: "policy-1", classification: "UNSUPPORTED_OPERATION", budget });
    expect(result.attempt.strategy).toBe("HUMAN_INTERVENTION");
    expect(result.budgetAfter.attemptsUsed).toBe(0);
  });

  it("rejects invalid retry budgets", () => {
    expect(() => validateRetryBudget({ ...budget, attemptsUsed: 4 })).toThrow("cannot exceed");
  });
});
