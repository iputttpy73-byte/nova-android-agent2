import type { RecoveryClassification, RecoveryPolicy, RecoveryStrategyType, RetryBudget } from "./domain";

export const RECOVERY_CLASSIFICATIONS: RecoveryClassification[] = ["TRANSIENT_FAILURE", "VERIFICATION_FAILURE", "TIMEOUT", "INTERRUPTED", "UNKNOWN_FAILURE", "UNSUPPORTED_OPERATION"];
export const RECOVERY_STRATEGIES: RecoveryStrategyType[] = ["RETRY", "REOBSERVE", "REPLAN", "WAIT", "HUMAN_INTERVENTION", "ABORT"];
export const DEFAULT_RECOVERY_POLICY: Omit<RecoveryPolicy, "id" | "createdAt"> = { version: "v1", allowedStrategies: RECOVERY_STRATEGIES, classificationStrategies: { TRANSIENT_FAILURE: ["RETRY", "WAIT", "ABORT"], VERIFICATION_FAILURE: ["REOBSERVE", "REPLAN", "HUMAN_INTERVENTION", "ABORT"], TIMEOUT: ["WAIT", "RETRY", "ABORT"], INTERRUPTED: ["RETRY", "HUMAN_INTERVENTION", "ABORT"], UNKNOWN_FAILURE: ["REPLAN", "HUMAN_INTERVENTION", "ABORT"], UNSUPPORTED_OPERATION: ["HUMAN_INTERVENTION", "ABORT"] }, defaultStrategy: "ABORT", maxAttempts: 3, requiresHumanFor: ["UNSUPPORTED_OPERATION" ] };
export type RecoveryDecision = { strategy: RecoveryStrategyType; allowed: boolean; reason: string; budget: RetryBudget };

export function selectRecoveryStrategy(policy: RecoveryPolicy, classification: RecoveryClassification, budget: RetryBudget): RecoveryDecision {
  if (budget.attemptsUsed >= Math.min(budget.maxAttempts, policy.maxAttempts)) return { strategy: "ABORT", allowed: true, reason: "Retry budget is exhausted.", budget };
  if (policy.requiresHumanFor.includes(classification)) return { strategy: "HUMAN_INTERVENTION", allowed: policy.allowedStrategies.includes("HUMAN_INTERVENTION"), reason: "This classification requires human intervention.", budget };
  const candidates = policy.classificationStrategies[classification] ?? [policy.defaultStrategy];
  const strategy = candidates.find((item) => policy.allowedStrategies.includes(item)) ?? policy.defaultStrategy;
  return { strategy, allowed: policy.allowedStrategies.includes(strategy), reason: `Selected ${strategy} for ${classification}.`, budget };
}

export function consumeRetryBudget(budget: RetryBudget, strategy: RecoveryStrategyType): RetryBudget {
  return strategy === "RETRY" || strategy === "REOBSERVE" || strategy === "REPLAN" ? { ...budget, attemptsUsed: budget.attemptsUsed + 1, backoffMs: Math.min(Math.max(budget.backoffMs, 0) * 2 || 1, Math.max(budget.maxBackoffMs, 1)) } : { ...budget };
}
