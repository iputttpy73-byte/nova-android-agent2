import type { AgentRunId, AgentRunState, Sensitivity } from "./domain";

export type AgentRunEventType = "RUN_CREATED" | "STATE_TRANSITION" | "INTENT_ATTACHED" | "PLAN_ATTACHED" | "INTERVENTION_REQUESTED" | "INTERVENTION_RESOLVED";
export type AuditOutcome = "SUCCESS" | "DENIED" | "FAILED";
export type InterventionStatus = "OPEN" | "RESOLVED" | "EXPIRED" | "CANCELLED";

export type AgentRunEvent = {
  id: string;
  runId: AgentRunId;
  sequence: number;
  type: AgentRunEventType;
  fromState?: AgentRunState;
  toState?: AgentRunState;
  actor: "USER" | "AGENT_CORE" | "SYSTEM";
  reason?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  runId?: AgentRunId;
  actorId: string;
  action: string;
  outcome: AuditOutcome;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type HumanInterventionRequest = {
  id: string;
  runId: AgentRunId;
  reason: string;
  requestedAction: string;
  risk: Sensitivity;
  status: InterventionStatus;
  expiresAt: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
};
