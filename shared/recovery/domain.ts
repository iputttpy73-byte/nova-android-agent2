export type RecoveryClassification = "TRANSIENT_FAILURE" | "VERIFICATION_FAILURE" | "TIMEOUT" | "INTERRUPTED" | "UNKNOWN_FAILURE" | "UNSUPPORTED_OPERATION";
export type RecoveryStrategyType = "RETRY" | "REOBSERVE" | "REPLAN" | "WAIT" | "HUMAN_INTERVENTION" | "ABORT";
export type RecoveryAttemptStatus = "PENDING" | "STARTED" | "COMPLETED" | "FAILED" | "CANCELLED";

export type RetryBudget = { maxAttempts: number; attemptsUsed: number; backoffMs: number; maxBackoffMs: number };
export type RecoveryPolicy = { id: string; version: string; allowedStrategies: RecoveryStrategyType[]; classificationStrategies: Record<RecoveryClassification, RecoveryStrategyType[]>; defaultStrategy: RecoveryStrategyType; maxAttempts: number; requiresHumanFor: RecoveryClassification[]; createdAt: string };
export type RecoveryStrategy = { id: string; classification: RecoveryClassification; strategy: RecoveryStrategyType; rationale: string; delayMs?: number; createdAt: string };
export type RecoveryAttempt = { id: string; runId: string; stepId: string; classification: RecoveryClassification; strategy: RecoveryStrategyType; attemptNumber: number; budgetBefore: RetryBudget; status: RecoveryAttemptStatus; reason: string; createdAt: string; completedAt?: string };
export type RecoveryAuditEvent = { id: string; ownerId: string; runId: string; stepId: string; attemptId?: string; action: "RECOVERY_REQUESTED" | "STRATEGY_SELECTED" | "RETRY_BUDGET_CONSUMED" | "RECOVERY_COMPLETED" | "RECOVERY_ABORTED"; outcome: "SUCCESS" | "DENIED" | "FAILED"; metadata?: Record<string, unknown>; createdAt: string };
