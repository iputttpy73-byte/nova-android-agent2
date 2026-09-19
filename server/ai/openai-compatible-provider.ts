import type { AIProviderCapabilities, AIRequest, AIResponse } from "../../shared/ai/contracts";
import type { OpenAICompatibleChatResponse, OpenAICompatibleProvider, ProviderConfiguration } from "../../shared/ai/integration";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class OpenAICompatibleProviderAdapter implements OpenAICompatibleProvider {
  readonly id: ProviderConfiguration["id"];
  constructor(public readonly configuration: ProviderConfiguration, private readonly fetcher: FetchLike = fetch) { this.id = configuration.id; }
  getCapabilities(): AIProviderCapabilities { return { providerId: this.id, models: [this.configuration.defaultModel], tasks: ["INTENT_PARSING", "PLANNING", "VERIFICATION", "RECOVERY"], supportsStructuredOutput: true, supportsStreaming: false, supportsVision: false, supportsTools: false, available: this.configuration.enabled }; }
  async complete(request: AIRequest): Promise<AIResponse> {
    if (!this.configuration.enabled) throw new Error(`Provider ${this.id} is disabled.`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.configuration.timeoutMs);
    try {
      const response = await this.fetcher(`${this.configuration.baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.configuration.apiKey}` }, body: JSON.stringify({ model: request.model ?? this.configuration.defaultModel, messages: request.messages.map((message) => ({ role: message.role.toLowerCase(), content: message.text })), temperature: request.temperature, max_completion_tokens: request.maxOutputTokens, response_format: request.responseSchema ? { type: "json_schema", json_schema: { name: `${request.task.toLowerCase()}_response`, strict: true, schema: request.responseSchema } } : undefined }), signal: controller.signal });
      if (!response.ok) throw new Error(`Provider responded with HTTP ${response.status}.`);
      const payload = await response.json() as OpenAICompatibleChatResponse;
      const choice = payload.choices?.[0];
      if (!choice?.message?.content) throw new Error("Provider returned an empty response.");
      let structuredOutput: Record<string, unknown> | undefined;
      try { structuredOutput = JSON.parse(choice.message.content) as Record<string, unknown>; } catch { /* plain text response is valid when no schema was requested */ }
      return { requestId: request.requestId, providerId: this.id, model: request.model ?? this.configuration.defaultModel, outputText: choice.message.content, structuredOutput, inputTokens: payload.usage?.prompt_tokens, outputTokens: payload.usage?.completion_tokens, finishReason: choice.finish_reason === "length" ? "LENGTH" : "STOP", createdAt: new Date().toISOString() };
    } finally { clearTimeout(timer); }
  }
}
