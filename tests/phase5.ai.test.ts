import { describe, expect, it } from "vitest";
import type { AIProvider, AIProviderId, AIModelId } from "../shared/ai/contracts";
import { assessIntentConfidence } from "../shared/ai/confidence";
import { DefaultProviderSelectionPolicy, AIProviderRegistry } from "../server/ai/provider-registry";
import { DeterministicIntentParser } from "../server/ai/deterministic-intent-parser";
import type { Goal } from "../shared/agent/domain";

const goal: Goal = { id: "goal-parser" as Goal["id"], ownerId: "user-1", text: "Open Calendar and review my agenda", priority: "NORMAL", constraints: { targetApplication: "Calendar" }, createdAt: new Date().toISOString() };

function provider(id: string, tasks: AIProvider["getCapabilities"] extends () => infer C ? C : never): AIProvider {
  return { id: id as AIProviderId, getCapabilities: () => tasks, complete: async () => ({ requestId: "r", providerId: id as AIProviderId, model: "model" as AIModelId, outputText: "", finishReason: "STOP", createdAt: new Date().toISOString() }) };
}

describe("Deterministic Intent Parser", () => {
  it("converts a goal into a validated intent without an AI call", async () => {
    const intent = await new DeterministicIntentParser().parse({ goal });
    expect(intent.goalId).toBe(goal.id);
    expect(intent.desiredOutcome).toBe(goal.text);
    expect(intent.requiredCapabilities).toEqual(["APP_LAUNCH", "CONTENT_READ"]);
    expect(intent.entities).toEqual([{ name: "targetApplication", value: "Calendar", confidence: 0.98 }]);
    expect(intent.confidence).toBeGreaterThan(0.8);
    expect(intent.ambiguities).toEqual([]);
  });

  it("marks underspecified message goals for clarification", async () => {
    const intent = await new DeterministicIntentParser().parse({ goal: { ...goal, text: "Send a message", constraints: {} } });
    expect(intent.requiredCapabilities).toContain("MESSAGE_COMPOSE");
    expect(intent.ambiguities).toContain("Message recipient is not specified.");
    expect(intent.confidence).toBeLessThan(0.95);
  });

  it("detects higher sensitivity keywords", async () => {
    const intent = await new DeterministicIntentParser().parse({ goal: { ...goal, text: "Open my bank account" } });
    expect(intent.sensitivity).toBe("HIGH");
  });
});

describe("Intent confidence model", () => {
  it("assigns bands and clarification requirements deterministically", () => {
    expect(assessIntentConfidence(0.91, 0, 0)).toMatchObject({ band: "HIGH", requiresClarification: false });
    expect(assessIntentConfidence(0.7, 1, 0)).toMatchObject({ band: "MEDIUM", requiresClarification: true });
    expect(assessIntentConfidence(-1, 0, 0).score).toBe(0);
  });
});

describe("AI provider registry and selection policy", () => {
  const capabilities = { providerId: "deterministic" as AIProviderId, models: ["none" as AIModelId], tasks: ["INTENT_PARSING" as const], supportsStructuredOutput: true, supportsStreaming: false, supportsVision: false, supportsTools: false, available: true };

  it("selects only available providers matching requirements", () => {
    const policy = new DefaultProviderSelectionPolicy();
    expect(policy.select({ task: "INTENT_PARSING", requireStructuredOutput: true }, [capabilities])).toEqual(capabilities);
    expect(policy.select({ task: "PLANNING" }, [capabilities])).toBeUndefined();
  });

  it("supports registration and explicit provider preference", () => {
    const registry = new AIProviderRegistry();
    registry.register(provider("deterministic", capabilities));
    expect(registry.select({ task: "INTENT_PARSING", preferredProviderId: "deterministic" as AIProviderId })).toBeDefined();
    registry.unregister("deterministic" as AIProviderId);
    expect(registry.listCapabilities()).toHaveLength(0);
  });
});
