export type GoalId = string & { readonly __brand: "GoalId" };
export type IntentId = string & { readonly __brand: "IntentId" };
export type AgentRunId = string & { readonly __brand: "AgentRunId" };
export type PlanId = string & { readonly __brand: "PlanId" };
export type ObservationId = string & { readonly __brand: "ObservationId" };

export const AGENT_RUN_STATES = [
  "DRAFT", "SUBMITTED", "INTENT_PARSING", "PLAN_PENDING", "READY", "EXECUTING", "VERIFYING", "RECOVERING", "HUMAN_INTERVENTION", "COMPLETED", "PARTIALLY_COMPLETED", "FAILED", "CANCELLED", "BLOCKED", "EXPIRED",
] as const;
export type AgentRunState = (typeof AGENT_RUN_STATES)[number];
export type GoalPriority = "LOW" | "NORMAL" | "HIGH";
export type Sensitivity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ObservationSource = "ACCESSIBILITY_TREE" | "OCR" | "SCREENSHOT" | "APP_METADATA" | "COMBINED";
export type RedactionState = "REDACTED" | "MINIMIZED" | "RESTRICTED";

export type GoalConstraints = { targetApplication?: string; deadlineAt?: string; forbiddenActions?: string[]; notes?: string };
export type Goal = { id: GoalId; ownerId: string; text: string; priority: GoalPriority; constraints: GoalConstraints; createdAt: string };
export type IntentEntity = { name: string; value: string; confidence: number };
export type Intent = { id: IntentId; goalId: GoalId; desiredOutcome: string; entities: IntentEntity[]; constraints: GoalConstraints; requiredCapabilities: string[]; ambiguities: string[]; sensitivity: Sensitivity; confidence: number; source: "USER_GOAL" | "USER_CLARIFICATION"; createdAt: string };
export type PlanStep = { id: string; title: string; precondition: string; abstractAction: string; expectedPostcondition: string; verificationStrategy: string; risk: Sensitivity; retryBudget: number };
export type Plan = { id: PlanId; runId: AgentRunId; version: number; steps: PlanStep[]; requiresApproval: boolean; createdAt: string };
export type Observation = { id: ObservationId; runId: AgentRunId; stepId?: string; source: ObservationSource; payloadReference?: string; payload?: Record<string, unknown>; confidence: number; redactionState: RedactionState; capturedAt: string };
export type AgentRun = { id: AgentRunId; ownerId: string; goal: Goal; state: AgentRunState; intent?: Intent; plan?: Plan; stateVersion: number; createdAt: string; updatedAt: string; terminalReason?: string };
export type StateTransition = { from: AgentRunState; to: AgentRunState; reason: string; actor: "USER" | "AGENT_CORE" | "SYSTEM"; at: string };
