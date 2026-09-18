import type { AgentCore, ActorContext, CreateAgentRunInput } from "../../shared/agent/contracts";
import { AgentDomainError } from "../../shared/agent/contracts";
import type { AgentRun, AgentRunId, Goal, Intent, Plan, StateTransition } from "../../shared/agent/domain";
import { assertTransition, transitionState } from "./state-machine";
import { validateAgentRun, validateGoal, validateIntent, validatePlan } from "./validation";

export class InMemoryAgentCore implements AgentCore {
  private readonly runs = new Map<AgentRunId, AgentRun>();

  async createRun(input: CreateAgentRunInput, actor: ActorContext): Promise<AgentRun> {
    if (actor.role !== "USER" || actor.actorId !== input.ownerId) {
      throw new AgentDomainError("UNAUTHORIZED", "Only the owning user can create an agent run.");
    }
    const now = new Date().toISOString();
    const runId = `run_${crypto.randomUUID()}` as AgentRunId;
    const goal: Goal = {
      id: `goal_${crypto.randomUUID()}` as Goal["id"],
      ownerId: input.ownerId,
      text: input.goalText.trim(),
      priority: input.priority ?? "NORMAL",
      constraints: input.constraints ?? {},
      createdAt: now,
    };
    validateGoal(goal);
    const run: AgentRun = { id: runId, ownerId: input.ownerId, goal, state: "DRAFT", stateVersion: 0, createdAt: now, updatedAt: now };
    validateAgentRun(run);
    this.runs.set(runId, run);
    return run;
  }

  async submit(runId: AgentRunId, actor: ActorContext): Promise<AgentRun> {
    return this.transitionForOwner(runId, actor, "SUBMITTED", "User submitted the goal.", "USER");
  }

  async beginIntentParsing(runId: AgentRunId): Promise<AgentRun> {
    return this.transitionInternal(runId, "INTENT_PARSING", "Intent parsing started.", "AGENT_CORE");
  }

  async attachIntent(runId: AgentRunId, intent: Intent): Promise<AgentRun> {
    const run = this.requireRun(runId);
    if (run.state !== "INTENT_PARSING") throw new AgentDomainError("INVALID_STATE_TRANSITION", "Intent can only be attached during INTENT_PARSING.");
    validateIntent(intent);
    if (intent.goalId !== run.goal.id) throw new AgentDomainError("INVALID_INTENT", "Intent must reference the run goal.");
    return this.replaceRun({ ...run, intent, state: "PLAN_PENDING", stateVersion: run.stateVersion + 1, updatedAt: new Date().toISOString() });
  }

  async attachPlan(runId: AgentRunId, plan: Plan): Promise<AgentRun> {
    const run = this.requireRun(runId);
    if (run.state !== "PLAN_PENDING") throw new AgentDomainError("INVALID_STATE_TRANSITION", "A plan can only be attached during PLAN_PENDING.");
    if (!run.intent) throw new AgentDomainError("INVALID_PLAN", "A plan requires an attached intent.");
    validatePlan(plan);
    if (plan.runId !== run.id) throw new AgentDomainError("INVALID_PLAN", "Plan must reference the run.");
    return this.replaceRun({ ...run, plan, state: "READY", stateVersion: run.stateVersion + 1, updatedAt: new Date().toISOString() });
  }

  async transition(runId: AgentRunId, to: AgentRun["state"], reason: string, actor: StateTransition["actor"]): Promise<AgentRun> {
    return this.transitionInternal(runId, to, reason, actor);
  }

  async getRun(runId: AgentRunId, actor: ActorContext): Promise<AgentRun> {
    const run = this.requireRun(runId);
    if (actor.role !== "SYSTEM" && actor.actorId !== run.ownerId) throw new AgentDomainError("UNAUTHORIZED", "Actor cannot access this run.");
    return run;
  }

  private async transitionForOwner(runId: AgentRunId, actor: ActorContext, to: AgentRun["state"], reason: string, transitionActor: StateTransition["actor"]): Promise<AgentRun> {
    const run = await this.getRun(runId, actor);
    return this.transitionInternal(run.id, to, reason, transitionActor);
  }

  private async transitionInternal(runId: AgentRunId, to: AgentRun["state"], reason: string, actor: StateTransition["actor"]): Promise<AgentRun> {
    const run = this.requireRun(runId);
    transitionState(run.state, to, reason, actor, new Date().toISOString());
    return this.replaceRun({ ...run, state: to, stateVersion: run.stateVersion + 1, updatedAt: new Date().toISOString() });
  }

  private requireRun(runId: AgentRunId): AgentRun {
    const run = this.runs.get(runId);
    if (!run) throw new AgentDomainError("RUN_NOT_FOUND", `Run ${runId} was not found.`);
    return run;
  }

  private replaceRun(run: AgentRun): AgentRun {
    validateAgentRun(run);
    this.runs.set(run.id, run);
    return run;
  }
}
