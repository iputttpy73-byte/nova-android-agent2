import type { AgentCore, ActorContext, IntentParser, Planner } from "../../shared/agent/contracts";
import type { AgentRun, Plan, PlanStep } from "../../shared/agent/domain";
import type { AgentIntegrationConfig, AgentIntegrationResult, RecoveryPreparation } from "../../shared/agent/integration";
import type { MemoryRepositories } from "../memory/repositories";
import type { VerificationRepositories } from "../verifier/repositories";
import type { RecoveryRepositories } from "../recovery/repositories";
import type { InterventionRepositories } from "../intervention/repositories";
import type { ProviderManager } from "../ai/provider-manager";
import type { AuditEventRepository } from "../persistence/event-repositories";
import type { ExpectedPostcondition, VerificationEvidenceSource } from "../../shared/verifier/domain";
import { DEFAULT_VERIFICATION_POLICY } from "../../shared/verifier/policy";
import type { RetryBudget } from "../../shared/recovery/domain";
import type { InterventionRequest } from "../../shared/intervention/domain";

export type AgentCoreIntegrationDependencies = { core: AgentCore; parser: IntentParser; planner: Planner; memory: MemoryRepositories; verifier: VerificationRepositories; recovery: RecoveryRepositories; interventions: InterventionRepositories; audits: AuditEventRepository; providerManager?: ProviderManager };

export class AgentCoreIntegrationService {
  constructor(private readonly dependencies: AgentCoreIntegrationDependencies, private readonly config: AgentIntegrationConfig) {}

  async run(input: { ownerId: string; goalText: string; actor?: ActorContext; priority?: AgentRun["goal"]["priority"]; constraints?: AgentRun["goal"]["constraints"] }): Promise<AgentIntegrationResult> {
    const actor: ActorContext = input.actor ?? { actorId: input.ownerId, role: "USER" };
    let run = await this.dependencies.core.createRun({ ownerId: input.ownerId, goalText: input.goalText, priority: input.priority, constraints: input.constraints }, actor);
    await this.audit(run, input.ownerId, "INTEGRATION_RUN_CREATED", { state: run.state });
    run = await this.dependencies.core.submit(run.id, actor); await this.audit(run, input.ownerId, "INTEGRATION_SUBMITTED", { state: run.state });
    run = await this.dependencies.core.beginIntentParsing(run.id); await this.audit(run, input.ownerId, "INTEGRATION_INTENT_PARSING", { state: run.state });
    const intent = await this.dependencies.parser.parse({ goal: run.goal, previousIntent: run.intent });
    run = await this.dependencies.core.attachIntent(run.id, intent); await this.audit(run, input.ownerId, "INTEGRATION_INTENT_ATTACHED", { confidence: intent.confidence, ambiguities: intent.ambiguities });
    const plan = await this.dependencies.planner.createPlan({ run, intent, previousPlan: run.plan });
    run = await this.dependencies.core.attachPlan(run.id, plan); await this.audit(run, input.ownerId, "INTEGRATION_PLAN_ATTACHED", { version: plan.version, steps: plan.steps.length });

    const memoryEntries = await this.dependencies.memory.entries.read({ ownerId: input.ownerId, maxEntries: this.config.memoryMaxEntries, sensitivityCeiling: intent.sensitivity, purpose: this.config.memoryPurpose });
    await this.audit(run, input.ownerId, "INTEGRATION_MEMORY_RETRIEVED", { count: memoryEntries.length, purpose: this.config.memoryPurpose });
    const verificationPostconditions = await this.prepareVerification(run, plan, input.ownerId);
    const recoveryPreparation = await this.prepareRecovery(run, plan, input.ownerId);
    const providerCapabilities = this.dependencies.providerManager?.listCapabilities() ?? [];
    const providerStatus = providerCapabilities.some((item) => item.available) ? "AVAILABLE" : "NOT_CONFIGURED";
    await this.audit(run, input.ownerId, "INTEGRATION_PROVIDER_STATUS", { providerStatus, providers: providerCapabilities.map((item) => item.providerId) });

    const requiresHuman = intent.ambiguities.length > 0 || plan.requiresApproval || plan.steps.some((step) => step.riskClassification?.requiresApproval);
    if (requiresHuman) {
      const policy = await this.dependencies.interventions.policies.getById(this.config.interventionPolicyId); if (!policy) throw new Error("Configured intervention policy was not found.");
      const now = new Date(); const type: InterventionRequest["type"] = intent.ambiguities.length > 0 ? "CLARIFICATION_REQUIRED" : "APPROVAL_REQUIRED";
      const interventionRequest = { id: `integration_intervention_${crypto.randomUUID()}`, ownerId: input.ownerId, runId: run.id, type, title: type === "CLARIFICATION_REQUIRED" ? "Clarification required" : "Approval required", reason: intent.ambiguities.join(" ") || "The plan contains an approval-required step.", requestedAction: type === "CLARIFICATION_REQUIRED" ? "Provide the missing information." : "Review and approve the proposed plan.", risk: intent.sensitivity, status: "OPEN" as const, policyId: policy.id, expiresAt: new Date(now.getTime() + policy.defaultExpiryMs).toISOString(), createdAt: now.toISOString() };
      const created = await this.dependencies.interventions.requests.create(interventionRequest);
      run = await this.dependencies.core.transition(run.id, "HUMAN_INTERVENTION", created.reason, "AGENT_CORE"); await this.audit(run, input.ownerId, "INTEGRATION_HUMAN_INTERVENTION", { requestId: created.id, type: created.type });
      return { run, intent, plan, memoryEntries, verificationPostconditions, recoveryPreparation, providerCapabilities, providerStatus, interventionRequest: created, stage: "HUMAN_INTERVENTION" };
    }
    await this.audit(run, input.ownerId, "INTEGRATION_READY", { state: run.state });
    return { run, intent, plan, memoryEntries, verificationPostconditions, recoveryPreparation, providerCapabilities, providerStatus, stage: "READY" };
  }

  private async prepareVerification(run: AgentRun, plan: Plan, ownerId: string): Promise<ExpectedPostcondition[]> {
    const prepared: ExpectedPostcondition[] = [];
    for (const step of plan.steps) {
      const verification = step.verification ?? { strategy: "STATE_MATCH" as const, requiredSignals: [step.expectedPostcondition], minimumConfidence: 0.5, allowPartial: false };
      const postcondition: ExpectedPostcondition = { id: `postcondition_${run.id}_${step.id}`, runId: run.id, stepId: step.id, description: step.postconditions?.outcome ?? step.expectedPostcondition, requiredSignals: verification.requiredSignals, strategy: verification.strategy, minimumConfidence: verification.minimumConfidence, allowedSources: this.allowedSources(verification.strategy), createdAt: new Date().toISOString() };
      await this.dependencies.verifier.postconditions.create(postcondition); prepared.push(postcondition); await this.audit(run, ownerId, "INTEGRATION_VERIFICATION_PREPARED", { stepId: step.id, postconditionId: postcondition.id, strategy: postcondition.strategy });
    }
    return prepared;
  }

  private async prepareRecovery(run: AgentRun, plan: Plan, ownerId: string): Promise<RecoveryPreparation[]> {
    const policy = await this.dependencies.recovery.policies.getById(this.config.recoveryPolicyId); if (!policy) throw new Error("Configured recovery policy was not found."); const prepared: RecoveryPreparation[] = [];
    for (const step of plan.steps) {
      const recoveryPolicy = step.recoveryPolicy; const budget: RetryBudget = { maxAttempts: Math.min(recoveryPolicy?.maxRetries ?? 0, policy.maxAttempts), attemptsUsed: 0, backoffMs: 100, maxBackoffMs: 5000 }; const selected = recoveryPolicy?.onFailure === "INTERVENTION" ? { strategy: "HUMAN_INTERVENTION" as const, reason: "Plan step explicitly requires intervention." } : this.selectPreparedStrategy(policy, budget); const item: RecoveryPreparation = { stepId: step.id, classification: "VERIFICATION_FAILURE", strategy: selected.strategy, reason: selected.reason, budget, policyVersion: policy.version }; prepared.push(item); await this.audit(run, ownerId, "INTEGRATION_RECOVERY_PREPARED", { stepId: step.id, strategy: item.strategy, maxAttempts: budget.maxAttempts });
    }
    return prepared;
  }

  private selectPreparedStrategy(policy: Awaited<ReturnType<RecoveryRepositories["policies"]["getById"]>> & {}, budget: RetryBudget): { strategy: RecoveryPreparation["strategy"]; reason: string } {
    const candidates = policy?.classificationStrategies.VERIFICATION_FAILURE ?? [policy?.defaultStrategy ?? "ABORT"]; const strategy = candidates.find((item) => policy?.allowedStrategies.includes(item)) ?? "ABORT"; return { strategy, reason: `Prepared ${strategy} for verification failure with ${budget.maxAttempts} permitted attempt(s).` };
  }

  private allowedSources(strategy: ExpectedPostcondition["strategy"]): VerificationEvidenceSource[] { if (strategy === "USER_CONFIRMATION") return ["USER_CONFIRMATION"]; if (strategy === "APP_OPEN") return ["APP_STATE", "ACCESSIBILITY"]; if (strategy === "CONTENT_MATCH") return ["APP_STATE", "OCR", "SCREENSHOT", "USER_CONFIRMATION"]; return ["APP_STATE", "ACCESSIBILITY", "USER_CONFIRMATION"]; }
  private async audit(run: AgentRun, actorId: string, action: string, metadata: Record<string, unknown>): Promise<void> { const event: import("../../shared/agent/events").AuditEvent = { id: `integration_audit_${crypto.randomUUID()}`, runId: run.id, actorId, action, outcome: "SUCCESS", metadata, createdAt: new Date().toISOString() }; await this.dependencies.audits.append(event); }
}
