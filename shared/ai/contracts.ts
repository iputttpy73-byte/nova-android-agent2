export type AIProviderId = string & { readonly __brand: "AIProviderId" };
export type AIModelId = string & { readonly __brand: "AIModelId" };
export type AITask = "INTENT_PARSING" | "PLANNING" | "VERIFICATION" | "RECOVERY";
export type AIContent = { role: "SYSTEM" | "USER" | "ASSISTANT"; text: string };

export type AIProviderCapabilities = {
  providerId: AIProviderId;
  models: AIModelId[];
  tasks: AITask[];
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  maxContextTokens?: number;
  available: boolean;
};

export type AIRequest = {
  requestId: string;
  task: AITask;
  model?: AIModelId;
  messages: AIContent[];
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
  metadata?: Record<string, string>;
};

export type AIResponse = {
  requestId: string;
  providerId: AIProviderId;
  model: AIModelId;
  outputText: string;
  structuredOutput?: Record<string, unknown>;
  inputTokens?: number;
  outputTokens?: number;
  finishReason: "STOP" | "LENGTH" | "ERROR";
  createdAt: string;
};

export interface AIProvider {
  readonly id: AIProviderId;
  getCapabilities(): AIProviderCapabilities;
  complete(request: AIRequest): Promise<AIResponse>;
}

export type ProviderSelectionRequirements = {
  task: AITask;
  requireStructuredOutput?: boolean;
  requireVision?: boolean;
  requireTools?: boolean;
  preferredProviderId?: AIProviderId;
};

export type ProviderSelectionPolicy = {
  select(requirements: ProviderSelectionRequirements, providers: readonly AIProviderCapabilities[]): AIProviderCapabilities | undefined;
};
