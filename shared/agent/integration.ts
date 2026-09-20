import type { AgentRun, Intent, Plan } from "./domain";
import type { MemoryEntry } from "../memory/domain";
import type { ExpectedPostcondition } from "../verifier/domain";
import type { RecoveryClassification, RecoveryPolicy, RecoveryStrategyType, RetryBudget } from "../recovery/domain";
import type { InterventionRequest } from "../intervention/domain";
import type { AIProviderCapabilities } from "../ai/contracts";

export type RecoveryPreparation = { stepId: string; classification: RecoveryClassification; strategy: RecoveryStrategyType; reason: string; budget: RetryBudget; policyVersion: string };
export type AgentIntegrationStage = "READY" | "HUMAN_INTERVENTION";
export type AgentIntegrationResult = { run: AgentRun; intent: Intent; plan: Plan; memoryEntries: MemoryEntry[]; verificationPostconditions: ExpectedPostcondition[]; recoveryPreparation: RecoveryPreparation[]; providerCapabilities: AIProviderCapabilities[]; providerStatus: "AVAILABLE" | "NOT_CONFIGURED"; interventionRequest?: InterventionRequest; stage: AgentIntegrationStage };
export type AgentIntegrationConfig = { recoveryPolicyId: string; interventionPolicyId: string; memoryPurpose: string; memoryMaxEntries: number };
export type { RecoveryPolicy };
