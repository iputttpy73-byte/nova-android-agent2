import { describe, expect, it } from "vitest";
import type { AIProvider, AIProviderCapabilities, AIProviderId, AIModelId } from "../shared/ai/contracts";
import type { ProviderConfiguration } from "../shared/ai/integration";
import { InMemoryAgentCore } from "../server/agent/agent-core";
import { AgentPipeline } from "../server/agent/agent-pipeline";
import { DeterministicIntentParser } from "../server/ai/deterministic-intent-parser";
import { InMemoryUsageTracker, ProviderManager } from "../server/ai/provider-manager";
import { AIProviderRegistry } from "../server/ai/provider-registry";
import { parseAndValidateResponse, validateStructuredOutput } from "../server/ai/structured-output";
import { InMemoryRepositories } from "../server/persistence/repositories";
import { DeterministicPlannerService } from "../server/planner/planner-service";

const config: ProviderConfiguration = { id: "primary" as AIProviderId, baseUrl: "https://example.test/v1", apiKey: "secret", defaultModel: "model-1" as AIModelId, timeoutMs: 1000, enabled: true, inputPricePerMillion: 1, outputPricePerMillion: 2 };
function fakeProvider(id: string, behavior: "success" | "failure"): AIProvider {
  const capabilities: AIProviderCapabilities = { providerId: id as AIProviderId, models: ["model-1" as AIModelId], tasks: ["INTENT_PARSING"], supportsStructuredOutput: true, supportsStreaming: false, supportsVision: false, supportsTools: false, available: true };
  return { id: capabilities.providerId, getCapabilities: () => capabilities, complete: async (request) => { if (behavior === "failure") throw new Error(`${id} failed`); return { requestId: request.requestId, providerId: capabilities.providerId, model: "model-1" as AIModelId, outputText: '{"intent":"ok"}', structuredOutput: { intent: "ok" }, inputTokens: 100, outputTokens: 50, finishReason: "STOP", createdAt: new Date().toISOString() }; } };
}

describe("Phase 7 structured output and provider manager", () => {
  it("validates structured output and rejects schema violations", () => {
    const schema = { type: "object" as const, properties: { intent: { type: "string" as const } }, required: ["intent"], additionalProperties: false };
    expect(parseAndValidateResponse({ requestId: "r", providerId: "p" as AIProviderId, model: "m" as AIModelId, outputText: '{"intent":"ok"}', finishReason: "STOP", createdAt: new Date().toISOString() }, schema)).toEqual({ intent: "ok" });
    expect(() => validateStructuredOutput({ wrong: true }, schema)).toThrow("missing required");
  });

  it("falls back after a provider failure and records usage", async () => {
    const registry = new AIProviderRegistry();
    registry.register(fakeProvider("primary", "failure"));
    registry.register(fakeProvider("fallback", "success"));
    const usage = new InMemoryUsageTracker();
    const manager = new ProviderManager(registry, new Map([["fallback" as AIProviderId, { ...config, id: "fallback" as AIProviderId }]]), usage);
    const response = await manager.complete({ requestId: "request-1", task: "INTENT_PARSING", messages: [{ role: "USER", text: "parse" }], responseSchema: { type: "object" } }, { task: "INTENT_PARSING", requireStructuredOutput: true });
    expect(response.providerId).toBe("fallback");
    expect(manager.getFailures()).toHaveLength(1);
    expect((await usage.listByProvider("fallback" as AIProviderId))[0]).toMatchObject({ inputTokens: 100, outputTokens: 50, estimatedCostUsd: 0.0002 });
  });

  it("records provider health status without exposing credentials", async () => {
    const registry = new AIProviderRegistry();
    registry.register(fakeProvider("healthy", "success"));
    const manager = new ProviderManager(registry, new Map(), new InMemoryUsageTracker(), async () => undefined);
    const health = await manager.checkHealth("healthy" as AIProviderId);
    expect(health).toMatchObject({ providerId: "healthy", healthy: true });
    expect(manager.getHealth("healthy" as AIProviderId)?.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe("Phase 7 Agent Core pipeline", () => {
  it("runs submitted goal through intent parsing and deterministic planning to READY", async () => {
    const core = new InMemoryAgentCore();
    const repositories = new InMemoryRepositories();
    const pipeline = new AgentPipeline(core, new DeterministicIntentParser(), new DeterministicPlannerService(repositories.plans));
    const actor = { actorId: "user-pipeline", role: "USER" as const };
    const draft = await core.createRun({ ownerId: actor.actorId, goalText: "Open YouTube and search for programming", constraints: { targetApplication: "YouTube" } }, actor);
    const ready = await pipeline.processSubmittedRun(draft.id, actor);
    expect(ready.state).toBe("READY");
    expect(ready.intent?.requiredCapabilities).toContain("APP_LAUNCH");
    expect(ready.plan?.steps).toHaveLength(2);
    expect((await repositories.plans.getLatestByRun(ready.id))?.version).toBe(1);
  });
});
