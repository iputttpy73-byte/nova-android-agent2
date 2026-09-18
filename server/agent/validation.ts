import type { AgentRun, Goal, Intent, Plan } from "../../shared/agent/domain";
import { AgentDomainError } from "../../shared/agent/contracts";

function assertText(value: string, field: string, max: number): void {
  if (!value || !value.trim() || value.length > max) {
    throw new AgentDomainError("INVALID_GOAL", `${field} must be non-empty and at most ${max} characters.`);
  }
}

function assertConfidence(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new AgentDomainError("INVALID_INTENT", `${field} must be between 0 and 1.`);
  }
}

export function validateGoal(goal: Goal): void {
  assertText(goal.id, "Goal id", 128);
  assertText(goal.ownerId, "Goal ownerId", 128);
  assertText(goal.text, "Goal text", 4000);
  if (!goal.createdAt || Number.isNaN(Date.parse(goal.createdAt))) {
    throw new AgentDomainError("INVALID_GOAL", "Goal createdAt must be a valid timestamp.");
  }
}

export function validateIntent(intent: Intent): void {
  assertText(intent.id, "Intent id", 128);
  assertText(intent.goalId, "Intent goalId", 128);
  assertText(intent.desiredOutcome, "Intent desiredOutcome", 4000);
  assertConfidence(intent.confidence, "Intent confidence");
  intent.entities.forEach((entity) => {
    assertText(entity.name, "Intent entity name", 128);
    assertText(entity.value, "Intent entity value", 2000);
    assertConfidence(entity.confidence, "Intent entity confidence");
  });
  if (intent.ambiguities.length > 0 && intent.confidence >= 0.95) {
    throw new AgentDomainError("INVALID_INTENT", "An intent with ambiguities cannot have very high confidence.");
  }
}

export function validatePlan(plan: Plan): void {
  assertText(plan.id, "Plan id", 128);
  assertText(plan.runId, "Plan runId", 128);
  if (!Number.isInteger(plan.version) || plan.version < 1) {
    throw new AgentDomainError("INVALID_PLAN", "Plan version must be a positive integer.");
  }
  if (plan.steps.length === 0) throw new AgentDomainError("INVALID_PLAN", "A plan must contain at least one step.");
  plan.steps.forEach((step) => {
    assertText(step.id, "Plan step id", 128);
    assertText(step.title, "Plan step title", 200);
    assertText(step.abstractAction, "Plan step action", 2000);
    assertText(step.expectedPostcondition, "Plan step postcondition", 2000);
    assertText(step.verificationStrategy, "Plan step verification strategy", 2000);
    if (!Number.isInteger(step.retryBudget) || step.retryBudget < 0) {
      throw new AgentDomainError("INVALID_PLAN", "Plan step retryBudget must be a non-negative integer.");
    }
  });
}

export function validateAgentRun(run: AgentRun): void {
  assertText(run.id, "Run id", 128);
  assertText(run.ownerId, "Run ownerId", 128);
  validateGoal(run.goal);
  if (!Number.isInteger(run.stateVersion) || run.stateVersion < 0) {
    throw new AgentDomainError("INVALID_STATE_TRANSITION", "Run stateVersion must be a non-negative integer.");
  }
  if (!run.createdAt || Number.isNaN(Date.parse(run.createdAt))) {
    throw new AgentDomainError("INVALID_STATE_TRANSITION", "Run createdAt must be a valid timestamp.");
  }
  if (!run.updatedAt || Number.isNaN(Date.parse(run.updatedAt))) {
    throw new AgentDomainError("INVALID_STATE_TRANSITION", "Run updatedAt must be a valid timestamp.");
  }
  if (run.intent) validateIntent(run.intent);
  if (run.plan) validatePlan(run.plan);
}
