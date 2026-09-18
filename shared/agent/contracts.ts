import type { AgentRun, AgentRunId, Goal, Intent, Plan, StateTransition } from "./domain";
import type { AgentRunEvent, AuditEvent, HumanInterventionRequest, InterventionStatus } from "./events";

export type ActorContext = { actorId: string; role: "USER" | "SYSTEM" };
export type CreateAgentRunInput = { ownerId: string; goalText: string; priority?: Goal["priority"]; constraints?: Goal["constraints"] };
export type IntentParseRequest = { goal: Goal; previousIntent?: Intent };
export type IntentParser = { parse(request: IntentParseRequest): Promise<Intent> };
export type PlannerRequest = { run: AgentRun; intent: Intent; previousPlan?: Plan };
export type Planner = { createPlan(request: PlannerRequest): Promise<Plan>; revisePlan(request: PlannerRequest & { reason: string }): Promise<Plan> };

export type AgentCore = {
  createRun(input: CreateAgentRunInput, actor: ActorContext): Promise<AgentRun>;
  submit(runId: AgentRunId, actor: ActorContext): Promise<AgentRun>;
  beginIntentParsing(runId: AgentRunId): Promise<AgentRun>;
  attachIntent(runId: AgentRunId, intent: Intent): Promise<AgentRun>;
  attachPlan(runId: AgentRunId, plan: Plan): Promise<AgentRun>;
  transition(runId: AgentRunId, to: AgentRun["state"], reason: string, actor: StateTransition["actor"]): Promise<AgentRun>;
  requestIntervention(request: Omit<HumanInterventionRequest, "id" | "status" | "createdAt">): Promise<HumanInterventionRequest>;
  getRun(runId: AgentRunId, actor: ActorContext): Promise<AgentRun>;
  listEvents(runId: AgentRunId, actor: ActorContext): Promise<AgentRunEvent[]>;
  listAudit(runId: AgentRunId, actor: ActorContext): Promise<AuditEvent[]>;
  listInterventions(runId: AgentRunId, actor: ActorContext, status?: InterventionStatus): Promise<HumanInterventionRequest[]>;
};

export type AgentDomainErrorCode = "INVALID_GOAL" | "INVALID_INTENT" | "INVALID_PLAN" | "INVALID_STATE_TRANSITION" | "UNAUTHORIZED" | "RUN_NOT_FOUND";
export class AgentDomainError extends Error {
  constructor(public readonly code: AgentDomainErrorCode, message: string) { super(message); this.name = "AgentDomainError"; }
}
