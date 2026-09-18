import type { AgentCore, ActorContext, CreateAgentRunInput } from "../../shared/agent/contracts";
import { AgentDomainError } from "../../shared/agent/contracts";
import type { AgentRun, AgentRunId, Goal, Intent, Plan, StateTransition } from "../../shared/agent/domain";
import type { AgentRunEvent, AuditEvent, HumanInterventionRequest, InterventionStatus } from "../../shared/agent/events";
import { InMemoryEventRepositories, type EventRepositories } from "../persistence/event-repositories";
import { transitionState } from "./state-machine";
import { validateAgentRun, validateGoal, validateIntent, validatePlan } from "./validation";

export class InMemoryAgentCore implements AgentCore {
  private readonly runs = new Map<AgentRunId, AgentRun>();
  private readonly eventRepositories: EventRepositories;

  constructor(eventRepositories: EventRepositories = new InMemoryEventRepositories()) { this.eventRepositories = eventRepositories; }

  async createRun(input: CreateAgentRunInput, actor: ActorContext): Promise<AgentRun> {
    if (actor.role !== "USER" || actor.actorId !== input.ownerId) throw new AgentDomainError("UNAUTHORIZED", "Only the owning user can create an agent run.");
    const now = new Date().toISOString();
    const runId = `run_${crypto.randomUUID()}` as AgentRunId;
    const goal: Goal = { id: `goal_${crypto.randomUUID()}` as Goal["id"], ownerId: input.ownerId, text: input.goalText.trim(), priority: input.priority ?? "NORMAL", constraints: input.constraints ?? {}, createdAt: now };
    validateGoal(goal);
    const run: AgentRun = { id: runId, ownerId: input.ownerId, goal, state: "DRAFT", stateVersion: 0, createdAt: now, updatedAt: now };
    validateAgentRun(run);
    this.runs.set(runId, run);
    await this.recordEvent(run, { type: "RUN_CREATED", actor: "USER", reason: "Agent run created." }, actor.actorId);
    return run;
  }

  async submit(runId: AgentRunId, actor: ActorContext): Promise<AgentRun> { return this.transitionForOwner(runId, actor, "SUBMITTED", "User submitted the goal.", "USER"); }
  async beginIntentParsing(runId: AgentRunId): Promise<AgentRun> { return this.transitionInternal(runId, "INTENT_PARSING", "Intent parsing started.", "AGENT_CORE", "system"); }

  async attachIntent(runId: AgentRunId, intent: Intent): Promise<AgentRun> {
    const run = this.requireRun(runId);
    if (run.state !== "INTENT_PARSING") throw new AgentDomainError("INVALID_STATE_TRANSITION", "Intent can only be attached during INTENT_PARSING.");
    validateIntent(intent);
    if (intent.goalId !== run.goal.id) throw new AgentDomainError("INVALID_INTENT", "Intent must reference the run goal.");
    const updated = this.replaceRun({ ...run, intent, state: "PLAN_PENDING", stateVersion: run.stateVersion + 1, updatedAt: new Date().toISOString() });
    await this.recordEvent(updated, { type: "INTENT_ATTACHED", actor: "AGENT_CORE", reason: "Intent attached and run moved to plan pending." }, "system");
    return updated;
  }

  async attachPlan(runId: AgentRunId, plan: Plan): Promise<AgentRun> {
    const run = this.requireRun(runId);
    if (run.state !== "PLAN_PENDING") throw new AgentDomainError("INVALID_STATE_TRANSITION", "A plan can only be attached during PLAN_PENDING.");
    if (!run.intent) throw new AgentDomainError("INVALID_PLAN", "A plan requires an attached intent.");
    validatePlan(plan);
    if (plan.runId !== run.id) throw new AgentDomainError("INVALID_PLAN", "Plan must reference the run.");
    const updated = this.replaceRun({ ...run, plan, state: "READY", stateVersion: run.stateVersion + 1, updatedAt: new Date().toISOString() });
    await this.recordEvent(updated, { type: "PLAN_ATTACHED", actor: "AGENT_CORE", reason: "Plan attached and run is ready." }, "system");
    return updated;
  }

  async transition(runId: AgentRunId, to: AgentRun["state"], reason: string, actor: StateTransition["actor"]): Promise<AgentRun> { return this.transitionInternal(runId, to, reason, actor, actor === "USER" ? this.requireRun(runId).ownerId : "system"); }

  async requestIntervention(input: Omit<HumanInterventionRequest, "id" | "status" | "createdAt">): Promise<HumanInterventionRequest> {
    const request: HumanInterventionRequest = { ...input, id: `intervention_${crypto.randomUUID()}`, status: "OPEN", createdAt: new Date().toISOString() };
    const created = await this.eventRepositories.interventions.create(request);
    const run = this.requireRun(input.runId);
    await this.recordEvent(run, { type: "INTERVENTION_REQUESTED", actor: "AGENT_CORE", reason: input.reason, payload: { interventionId: created.id } }, "system");
    return created;
  }

  async getRun(runId: AgentRunId, actor: ActorContext): Promise<AgentRun> { const run = this.requireRun(runId); this.assertOwner(run, actor); return run; }
  async listEvents(runId: AgentRunId, actor: ActorContext): Promise<AgentRunEvent[]> { const run = await this.getRun(runId, actor); return this.eventRepositories.events.listByRun(run.id); }
  async listAudit(runId: AgentRunId, actor: ActorContext): Promise<AuditEvent[]> { const run = await this.getRun(runId, actor); return this.eventRepositories.audits.listByRun(run.id); }
  async listInterventions(runId: AgentRunId, actor: ActorContext, status?: InterventionStatus): Promise<HumanInterventionRequest[]> { const run = await this.getRun(runId, actor); const requests = status ? await this.eventRepositories.interventions.listByStatus(status) : await this.eventRepositories.interventions.listByRun(run.id); return requests.filter((request) => request.runId === run.id); }

  private async transitionForOwner(runId: AgentRunId, actor: ActorContext, to: AgentRun["state"], reason: string, transitionActor: StateTransition["actor"]): Promise<AgentRun> { const run = await this.getRun(runId, actor); return this.transitionInternal(run.id, to, reason, transitionActor, actor.actorId); }
  private async transitionInternal(runId: AgentRunId, to: AgentRun["state"], reason: string, actor: StateTransition["actor"], actorId: string): Promise<AgentRun> {
    const run = this.requireRun(runId);
    const transition = transitionState(run.state, to, reason, actor, new Date().toISOString());
    const updated = this.replaceRun({ ...run, state: to, stateVersion: run.stateVersion + 1, updatedAt: new Date().toISOString() });
    await this.recordEvent(updated, { type: "STATE_TRANSITION", actor: transition.actor, fromState: transition.from, toState: transition.to, reason: transition.reason }, actorId);
    return updated;
  }
  private async recordEvent(run: AgentRun, input: Omit<AgentRunEvent, "id" | "runId" | "sequence" | "createdAt">, actorId: string): Promise<void> {
    const createdAt = new Date().toISOString();
    const sequence = await this.eventRepositories.events.getNextSequence(run.id);
    await this.eventRepositories.events.append({ ...input, id: `event_${crypto.randomUUID()}`, runId: run.id, sequence, createdAt });
    await this.eventRepositories.audits.append({ id: `audit_${crypto.randomUUID()}`, runId: run.id, actorId, action: input.type, outcome: "SUCCESS", metadata: input.payload, createdAt });
  }
  private requireRun(runId: AgentRunId): AgentRun { const run = this.runs.get(runId); if (!run) throw new AgentDomainError("RUN_NOT_FOUND", `Run ${runId} was not found.`); return run; }
  private assertOwner(run: AgentRun, actor: ActorContext): void { if (actor.role !== "SYSTEM" && actor.actorId !== run.ownerId) throw new AgentDomainError("UNAUTHORIZED", "Actor cannot access this run."); }
  private replaceRun(run: AgentRun): AgentRun { validateAgentRun(run); this.runs.set(run.id, run); return run; }
}
