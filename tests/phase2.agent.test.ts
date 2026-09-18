import { describe, expect, it } from "vitest";

import { AgentDomainError } from "../shared/agent/contracts";
import type { AgentRunId, Intent, Plan } from "../shared/agent/domain";
import { InMemoryAgentCore } from "../server/agent/agent-core";
import { allowedNextStates, assertTransition, isTerminalState } from "../server/agent/state-machine";
import { validateIntent, validatePlan } from "../server/agent/validation";

const owner = { actorId: "user-1", role: "USER" as const };

async function createReadyCore() {
  const core = new InMemoryAgentCore();
  const draft = await core.createRun({ ownerId: owner.actorId, goalText: "Review my daily agenda" }, owner);
  const submitted = await core.submit(draft.id, owner);
  const parsing = await core.beginIntentParsing(submitted.id);
  const intent: Intent = {
    id: "intent-1" as Intent["id"],
    goalId: parsing.goal.id,
    desiredOutcome: "Agenda reviewed",
    entities: [],
    constraints: parsing.goal.constraints,
    requiredCapabilities: [],
    ambiguities: [],
    sensitivity: "LOW",
    confidence: 0.98,
    source: "USER_GOAL",
    createdAt: new Date().toISOString(),
  };
  const pending = await core.attachIntent(parsing.id, intent);
  const plan: Plan = {
    id: "plan-1" as Plan["id"],
    runId: pending.id,
    version: 1,
    requiresApproval: false,
    createdAt: new Date().toISOString(),
    steps: [{ id: "step-1", title: "Review goal", precondition: "Goal exists", abstractAction: "Review the goal", expectedPostcondition: "Goal is understood", verificationStrategy: "Explicit review", risk: "LOW", retryBudget: 0 }],
  };
  return { core, ready: await core.attachPlan(pending.id, plan) };
}

describe("Agent Run state machine", () => {
  it("allows the canonical foundation path to READY", async () => {
    const { ready } = await createReadyCore();
    expect(ready.state).toBe("READY");
    expect(ready.stateVersion).toBe(4);
  });

  it("rejects skipping required lifecycle states", () => {
    expect(() => assertTransition("DRAFT", "EXECUTING")).toThrow(AgentDomainError);
    expect(allowedNextStates("READY")).toContain("EXECUTING");
  });

  it("identifies terminal states", () => {
    expect(isTerminalState("COMPLETED")).toBe(true);
    expect(isTerminalState("EXECUTING")).toBe(false);
  });

  it("rejects access by another user", async () => {
    const core = new InMemoryAgentCore();
    const run = await core.createRun({ ownerId: owner.actorId, goalText: "Review my agenda" }, owner);
    await expect(core.getRun(run.id, { actorId: "user-2", role: "USER" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("Phase 2 validation", () => {
  it("rejects ambiguous intents with overconfident scores", () => {
    expect(() => validateIntent({ id: "i" as Intent["id"], goalId: "g" as Intent["goalId"], desiredOutcome: "Outcome", entities: [], constraints: {}, requiredCapabilities: [], ambiguities: ["Which account?"], sensitivity: "HIGH", confidence: 0.99, source: "USER_GOAL", createdAt: new Date().toISOString() })).toThrow("ambiguities");
  });

  it("rejects plans with no steps", () => {
    expect(() => validatePlan({ id: "p" as Plan["id"], runId: "r" as AgentRunId, version: 1, steps: [], requiresApproval: false, createdAt: new Date().toISOString() })).toThrow("at least one step");
  });
});
