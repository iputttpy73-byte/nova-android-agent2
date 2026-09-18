import { describe, expect, it } from "vitest";

import type { AgentRun, Goal, Intent, Observation, Plan } from "../shared/agent/domain";
import { InMemoryRepositories } from "../server/persistence/repositories";

const now = new Date().toISOString();
const goal: Goal = { id: "goal-1" as Goal["id"], ownerId: "user-1", text: "Review agenda", priority: "NORMAL", constraints: {}, createdAt: now };
const intent: Intent = { id: "intent-1" as Intent["id"], goalId: goal.id, desiredOutcome: "Agenda reviewed", entities: [], constraints: {}, requiredCapabilities: [], ambiguities: [], sensitivity: "LOW", confidence: 0.98, source: "USER_GOAL", createdAt: now };
const run: AgentRun = { id: "run-1" as AgentRun["id"], ownerId: goal.ownerId, goal, state: "PLAN_PENDING", stateVersion: 2, intent, createdAt: now, updatedAt: now };
const plan: Plan = { id: "plan-1" as Plan["id"], runId: run.id, version: 1, requiresApproval: false, createdAt: now, steps: [{ id: "step-1", title: "Review", precondition: "Goal exists", abstractAction: "Review goal", expectedPostcondition: "Goal understood", verificationStrategy: "Explicit review", risk: "LOW", retryBudget: 0 }] };

function observation(id: string, capturedAt: string): Observation { return { id: id as Observation["id"], runId: run.id, source: "APP_METADATA", payload: { screen: "agenda" }, confidence: 1, redactionState: "MINIMIZED", capturedAt }; }

describe("Phase 3 persistence repositories", () => {
  it("creates and reads all core records", async () => {
    const repos = new InMemoryRepositories();
    await repos.goals.create(goal);
    await repos.intents.create(intent);
    await repos.agentRuns.create(run);
    await repos.plans.create(plan);
    await repos.observations.create(observation("obs-1", "2026-01-01T00:00:00.000Z"));

    expect(await repos.goals.getById(goal.id)).toEqual(goal);
    expect(await repos.intents.getLatestForGoal(goal.id)).toEqual(intent);
    expect(await repos.agentRuns.getById(run.id)).toEqual(run);
    expect(await repos.plans.listByRun(run.id)).toHaveLength(1);
    expect(await repos.observations.listByRun(run.id)).toHaveLength(1);
  });

  it("scopes goal and run lists by owner", async () => {
    const repos = new InMemoryRepositories();
    await repos.goals.create(goal);
    await repos.goals.create({ ...goal, id: "goal-2" as Goal["id"], ownerId: "user-2" });
    await repos.agentRuns.create(run);
    await repos.agentRuns.create({ ...run, id: "run-2" as AgentRun["id"], ownerId: "user-2", goal: { ...goal, id: "goal-2" as Goal["id"], ownerId: "user-2" } });

    expect(await repos.goals.listByOwner("user-1")).toHaveLength(1);
    expect(await repos.agentRuns.listByOwner("user-2")).toHaveLength(1);
  });

  it("returns observations in capture order", async () => {
    const repos = new InMemoryRepositories();
    await repos.observations.create(observation("obs-2", "2026-01-01T00:00:02.000Z"));
    await repos.observations.create(observation("obs-1", "2026-01-01T00:00:01.000Z"));
    expect((await repos.observations.listByRun(run.id)).map((item) => item.id)).toEqual(["obs-1", "obs-2"]);
  });

  it("rejects duplicate records and invalid observations", async () => {
    const repos = new InMemoryRepositories();
    await repos.goals.create(goal);
    await expect(repos.goals.create(goal)).rejects.toMatchObject({ code: "INVALID_GOAL" });
    await expect(repos.observations.create({ ...observation("bad", now), confidence: 2 })).rejects.toMatchObject({ code: "INVALID_GOAL" });
  });
});
