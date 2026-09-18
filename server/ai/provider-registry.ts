import type { AIProvider, AIProviderCapabilities, AIProviderId, ProviderSelectionPolicy, ProviderSelectionRequirements } from "../../shared/ai/contracts";

export class DefaultProviderSelectionPolicy implements ProviderSelectionPolicy {
  select(requirements: ProviderSelectionRequirements, providers: readonly AIProviderCapabilities[]): AIProviderCapabilities | undefined {
    const eligible = providers.filter((provider) => provider.available && provider.tasks.includes(requirements.task) && (!requirements.requireStructuredOutput || provider.supportsStructuredOutput) && (!requirements.requireVision || provider.supportsVision) && (!requirements.requireTools || provider.supportsTools));
    if (requirements.preferredProviderId) return eligible.find((provider) => provider.providerId === requirements.preferredProviderId);
    return eligible[0];
  }
}

export class AIProviderRegistry {
  private readonly providers = new Map<AIProviderId, AIProvider>();
  constructor(private readonly policy: ProviderSelectionPolicy = new DefaultProviderSelectionPolicy()) {}
  register(provider: AIProvider): void { this.providers.set(provider.id, provider); }
  unregister(providerId: AIProviderId): void { this.providers.delete(providerId); }
  get(providerId: AIProviderId): AIProvider | undefined { return this.providers.get(providerId); }
  listCapabilities(): AIProviderCapabilities[] { return [...this.providers.values()].map((provider) => provider.getCapabilities()); }
  select(requirements: ProviderSelectionRequirements): AIProvider | undefined {
    const selected = this.policy.select(requirements, this.listCapabilities());
    return selected ? this.providers.get(selected.providerId) : undefined;
  }
}
