import { describe, expect, it } from "vitest";
import type { AgentRun, Intent, Plan } from "../shared/agent/domain";
import { InMemoryRepositories } from "../server/persistence/repositories";
import { DeterministicPlanBuilder } from "../server/planner/plan-builder";
import { DeterministicPlannerService } from "../server/planner/planner-service";
import { validatePlan } from "../server/agent/validation";

const run: AgentRun = { id: "run-planner" as AgentRun["id"], ownerId: "user-1", goal: { id: "goal-planner" as AgentRun["goal"]["id"], ownerId: "user-1", text: "Open YouTube and search for programming", priority: "NORMAL", constraints: { targetApplication: "YouTube" }, createdAt: new Date().toISOString() }, state: "PLAN_PENDING", stateVersion: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
const intent: Intent = { id: "intent-planner" as Intent["id"], goalId: run.goal.id, desiredOutcome: run.goal.text, entities: [{ name: "targetApplication", value: "YouTube", confidence: 0.98 }], constraints: run.goal.constraints, requiredCapabilities: ["APP_LAUNCH", "UI_INTERACTION", "CONTENT_READ"], ambiguities: [], sensitivity: "LOW", confidence: 0.95, source: "USER_GOAL", createdAt: new Date().toISOString() };

describe("Deterministic Planner", () => {
  it("builds a structured YouTube search plan", () => {
    const plan = new DeterministicPlanBuilder().build({ runId: run.id, goalText: run.goal.text, requiredCapabilities: intent.requiredCapabilities, targetApplication: "YouTube", sensitivity: "LOW" });
    expect(plan.version).toBe(1);
    expect(plan.steps.map((step) => step.title)).toEqual(["Open YouTube", "Search for programming"]);
    expect(plan.steps[0]?.preconditions?.requiredCapabilities).toContain("APP_LAUNCH");
    expect(plan.steps[1]?.verification?.strategy).toBe("CONTENT_MATCH");
    expect(plan.requiresApproval).toBe(false);
  });

  it("builds a discovery plan for a video editing application", () => {
    const plan = new DeterministicPlanBuilder().build({ runId: run.id, goalText: "Find a video editing application", requiredCapabilities: ["CONTENT_READ"], sensitivity: "LOW" });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.title).toBe("Find a video editing application");
    expect(plan.steps[0]?.postconditions?.observableSignals).toContain("candidate list visible");
  });

  it("creates and revises persisted plan versions", async () => {
    const repos = new InMemoryRepositories();
    const planner = new DeterministicPlannerService(repos.plans);
    const first = await planner.createPlan({ run, intent });
    const revised = await planner.revisePlan({ run, intent, previousPlan: first, reason: "Add stronger result verification." });
    expect(first.version).toBe(1);
    expect(revised.version).toBe(2);
    expect(revised.parentPlanId).toBe(first.id);
    expect(revised.revisionReason).toBe("Add stronger result verification.");
    expect((await repos.plans.listByRun(run.id)).map((plan) => plan.version)).toEqual([1, 2]);
  });

  it("rejects invalid verification requirements", () => {
    const invalid: Plan = { id: "bad-plan" as Plan["id"], runId: run.id, version: 1, requiresApproval: false, createdAt: new Date().toISOString(), steps: [{ id: "bad-step", title: "Bad", precondition: "state", abstractAction: "action", expectedPostcondition: "outcome", verificationStrategy: "STATE_MATCH", risk: "LOW", retryBudget: 0, verification: { strategy: "STATE_MATCH", requiredSignals: [], minimumConfidence: 1.2, allowPartial: false } }] };
    expect(() => validatePlan(invalid)).toThrow("Verification requirements are invalid");
  });
});
