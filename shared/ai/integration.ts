import type { AIModelId, AIProviderCapabilities, AIProviderId, AIRequest, AIResponse, AIProvider } from "./contracts";

export type ProviderConfiguration = { id: AIProviderId; baseUrl: string; apiKey: string; defaultModel: AIModelId; timeoutMs: number; enabled: boolean; inputPricePerMillion?: number; outputPricePerMillion?: number };
export type ProviderHealth = { providerId: AIProviderId; healthy: boolean; checkedAt: string; latencyMs?: number; error?: string };
export type UsageRecord = { id: string; requestId: string; providerId: AIProviderId; model: AIModelId; task: AIRequest["task"]; inputTokens: number; outputTokens: number; estimatedCostUsd: number; createdAt: string };
export type ProviderFailure = { providerId: AIProviderId; error: string; at: string };
export type ProviderManagerOptions = { healthTtlMs?: number };
export type OpenAICompatibleChatResponse = { choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };

export function estimateCost(inputTokens: number, outputTokens: number, config: ProviderConfiguration): number {
  return (inputTokens / 1_000_000) * (config.inputPricePerMillion ?? 0) + (outputTokens / 1_000_000) * (config.outputPricePerMillion ?? 0);
}

export interface UsageTracker { record(record: UsageRecord): Promise<void>; listByProvider(providerId: AIProviderId): Promise<UsageRecord[]>; }

export type OpenAICompatibleProvider = AIProvider & { configuration: ProviderConfiguration };
