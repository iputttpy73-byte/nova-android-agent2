import type { AgentRun, AgentRunId, Goal, GoalId, Intent, IntentId, Observation, ObservationId, Plan, PlanId } from "../../shared/agent/domain";
import { AgentDomainError } from "../../shared/agent/contracts";
import { validateAgentRun, validateGoal, validateIntent, validatePlan } from "../agent/validation";

export interface GoalRepository {
  create(goal: Goal): Promise<Goal>;
  getById(id: GoalId): Promise<Goal | undefined>;
  listByOwner(ownerId: string): Promise<Goal[]>;
  update(goal: Goal): Promise<Goal>;
}

export interface IntentRepository {
  create(intent: Intent): Promise<Intent>;
  getById(id: IntentId): Promise<Intent | undefined>;
  getLatestForGoal(goalId: GoalId): Promise<Intent | undefined>;
}

export interface PlanRepository {
  create(plan: Plan): Promise<Plan>;
  getById(id: PlanId): Promise<Plan | undefined>;
  listByRun(runId: AgentRunId): Promise<Plan[]>;
}

export interface AgentRunRepository {
  create(run: AgentRun): Promise<AgentRun>;
  getById(id: AgentRunId): Promise<AgentRun | undefined>;
  listByOwner(ownerId: string): Promise<AgentRun[]>;
  update(run: AgentRun): Promise<AgentRun>;
}

export interface ObservationRepository {
  create(observation: Observation): Promise<Observation>;
  getById(id: ObservationId): Promise<Observation | undefined>;
  listByRun(runId: AgentRunId): Promise<Observation[]>;
}

export type PersistenceRepositories = {
  goals: GoalRepository;
  intents: IntentRepository;
  plans: PlanRepository;
  agentRuns: AgentRunRepository;
  observations: ObservationRepository;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryRepositories implements PersistenceRepositories {
  readonly goals: GoalRepository;
  readonly intents: IntentRepository;
  readonly plans: PlanRepository;
  readonly agentRuns: AgentRunRepository;
  readonly observations: ObservationRepository;

  constructor() {
    const goals = new Map<GoalId, Goal>();
    const intents = new Map<IntentId, Intent>();
    const plans = new Map<PlanId, Plan>();
    const runs = new Map<AgentRunId, AgentRun>();
    const observations = new Map<ObservationId, Observation>();

    this.goals = {
      create: async (goal) => { validateGoal(goal); if (goals.has(goal.id)) throw new AgentDomainError("INVALID_GOAL", "Goal already exists."); goals.set(goal.id, clone(goal)); return clone(goal); },
      getById: async (id) => clone(goals.get(id)),
      listByOwner: async (ownerId) => [...goals.values()].filter((goal) => goal.ownerId === ownerId).map(clone),
      update: async (goal) => { validateGoal(goal); if (!goals.has(goal.id)) throw new AgentDomainError("RUN_NOT_FOUND", "Goal was not found."); goals.set(goal.id, clone(goal)); return clone(goal); },
    };
    this.intents = {
      create: async (intent) => { validateIntent(intent); if (intents.has(intent.id)) throw new AgentDomainError("INVALID_INTENT", "Intent already exists."); intents.set(intent.id, clone(intent)); return clone(intent); },
      getById: async (id) => clone(intents.get(id)),
      getLatestForGoal: async (goalId) => clone([...intents.values()].filter((intent) => intent.goalId === goalId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]),
    };
    this.plans = {
      create: async (plan) => { validatePlan(plan); if (plans.has(plan.id)) throw new AgentDomainError("INVALID_PLAN", "Plan already exists."); plans.set(plan.id, clone(plan)); return clone(plan); },
      getById: async (id) => clone(plans.get(id)),
      listByRun: async (runId) => [...plans.values()].filter((plan) => plan.runId === runId).sort((a, b) => a.version - b.version).map(clone),
    };
    this.agentRuns = {
      create: async (run) => { validateAgentRun(run); if (runs.has(run.id)) throw new AgentDomainError("INVALID_STATE_TRANSITION", "Agent run already exists."); runs.set(run.id, clone(run)); return clone(run); },
      getById: async (id) => clone(runs.get(id)),
      listByOwner: async (ownerId) => [...runs.values()].filter((run) => run.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone),
      update: async (run) => { validateAgentRun(run); if (!runs.has(run.id)) throw new AgentDomainError("RUN_NOT_FOUND", "Agent run was not found."); runs.set(run.id, clone(run)); return clone(run); },
    };
    this.observations = {
      create: async (observation) => { if (!observation.id || !observation.runId || observation.confidence < 0 || observation.confidence > 1) throw new AgentDomainError("INVALID_GOAL", "Observation fields are invalid."); if (observations.has(observation.id)) throw new AgentDomainError("INVALID_GOAL", "Observation already exists."); observations.set(observation.id, clone(observation)); return clone(observation); },
      getById: async (id) => clone(observations.get(id)),
      listByRun: async (runId) => [...observations.values()].filter((observation) => observation.runId === runId).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).map(clone),
    };
  }
}
