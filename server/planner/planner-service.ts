import type { Intent, Plan } from "../../shared/agent/domain";
import type { Planner, PlannerRequest } from "../../shared/agent/contracts";
import type { PlanRevision } from "../../shared/agent/planning";
import type { PlanRepository } from "../persistence/repositories";
import { DeterministicPlanBuilder, buildPlanFromIntent } from "./plan-builder";

export class DeterministicPlannerService implements Planner {
  constructor(private readonly plans: PlanRepository, private readonly builder = new DeterministicPlanBuilder()) {}

  async createPlan(request: PlannerRequest): Promise<Plan> {
    const latest = await this.plans.getLatestByRun(request.run.id);
    const plan = this.builder.build({ runId: request.run.id, goalText: request.intent.desiredOutcome, requiredCapabilities: request.intent.requiredCapabilities, targetApplication: request.intent.constraints.targetApplication, sensitivity: request.intent.sensitivity, version: (latest?.version ?? 0) + 1 });
    return this.plans.create(plan);
  }

  async revisePlan(request: PlannerRequest & { reason: string }): Promise<Plan> {
    const previous = request.previousPlan ?? await this.plans.getLatestByRun(request.run.id);
    const nextVersion = (previous?.version ?? 0) + 1;
    const revision: PlanRevision | undefined = previous ? { parentPlanId: previous.id, parentVersion: previous.version, reason: request.reason, createdAt: new Date().toISOString() } : undefined;
    const plan = this.builder.build({ runId: request.run.id, goalText: request.intent.desiredOutcome, requiredCapabilities: request.intent.requiredCapabilities, targetApplication: request.intent.constraints.targetApplication, sensitivity: request.intent.sensitivity, version: nextVersion, revision });
    return this.plans.create(plan);
  }

  async createFromIntent(runId: Plan["runId"], intent: Intent): Promise<Plan> {
    const latest = await this.plans.getLatestByRun(runId);
    return this.plans.create(buildPlanFromIntent(runId, intent, (latest?.version ?? 0) + 1));
  }
}
