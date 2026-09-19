import type { AIProvider, AIProviderId, AIRequest, AIResponse, ProviderSelectionRequirements } from "../../shared/ai/contracts";
import type { ProviderConfiguration, ProviderFailure, ProviderHealth, UsageRecord, UsageTracker } from "../../shared/ai/integration";
import { estimateCost } from "../../shared/ai/integration";
import { AIProviderRegistry } from "./provider-registry";

export class InMemoryUsageTracker implements UsageTracker {
  private readonly records: UsageRecord[] = [];
  async record(record: UsageRecord): Promise<void> { this.records.push(structuredClone(record)); }
  async listByProvider(providerId: AIProviderId): Promise<UsageRecord[]> { return this.records.filter((record) => record.providerId === providerId).map((record) => structuredClone(record)); }
  async list(): Promise<UsageRecord[]> { return this.records.map((record) => structuredClone(record)); }
}

export class ProviderManager {
  private readonly health = new Map<AIProviderId, ProviderHealth>();
  private readonly failures: ProviderFailure[] = [];
  constructor(private readonly registry: AIProviderRegistry, private readonly configurations: Map<AIProviderId, ProviderConfiguration>, private readonly usage: UsageTracker, private readonly fetchHealth: (provider: AIProvider) => Promise<void> = async (provider) => { await provider.complete({ requestId: `health_${crypto.randomUUID()}`, task: "INTENT_PARSING", messages: [{ role: "USER", text: "health check" }], maxOutputTokens: 1 }); }) {}

  async checkHealth(providerId: AIProviderId): Promise<ProviderHealth> {
    const provider = this.registry.get(providerId); const started = Date.now();
    if (!provider) { const result = { providerId, healthy: false, checkedAt: new Date().toISOString(), error: "Provider is not registered." }; this.health.set(providerId, result); return result; }
    try { await this.fetchHealth(provider); const result = { providerId, healthy: true, checkedAt: new Date().toISOString(), latencyMs: Date.now() - started }; this.health.set(providerId, result); return result; }
    catch (error) { const result = { providerId, healthy: false, checkedAt: new Date().toISOString(), latencyMs: Date.now() - started, error: error instanceof Error ? error.message : "Health check failed." }; this.health.set(providerId, result); return result; }
  }

  getHealth(providerId: AIProviderId): ProviderHealth | undefined { return this.health.get(providerId); }
  getFailures(): ProviderFailure[] { return this.failures.map((failure) => ({ ...failure })); }

  async complete(request: AIRequest, requirements: ProviderSelectionRequirements): Promise<AIResponse> {
    const candidates = this.registry.listCapabilities().filter((capability) => capability.available && capability.tasks.includes(requirements.task) && (!requirements.requireStructuredOutput || capability.supportsStructuredOutput));
    const ordered = requirements.preferredProviderId ? [...candidates].sort((a, b) => Number(b.providerId === requirements.preferredProviderId) - Number(a.providerId === requirements.preferredProviderId)) : candidates;
    let lastError: Error | undefined;
    for (const candidate of ordered) {
      const provider = this.registry.get(candidate.providerId); if (!provider) continue;
      try {
        const response = await provider.complete(request);
        const config = this.configurations.get(provider.id);
        await this.usage.record({ id: `usage_${crypto.randomUUID()}`, requestId: request.requestId, providerId: response.providerId, model: response.model, task: request.task, inputTokens: response.inputTokens ?? 0, outputTokens: response.outputTokens ?? 0, estimatedCostUsd: config ? estimateCost(response.inputTokens ?? 0, response.outputTokens ?? 0, config) : 0, createdAt: response.createdAt });
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Provider request failed.");
        this.failures.push({ providerId: provider.id, error: lastError.message, at: new Date().toISOString() });
      }
    }
    throw lastError ?? new Error("No eligible AI provider is available.");
  }
}
