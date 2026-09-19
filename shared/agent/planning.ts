import type { AgentRunId, PlanId, Sensitivity } from "./domain";

export type Preconditions = {
  requiredState: string;
  requiredCapabilities: string[];
  requiredEntities: string[];
  notes?: string[];
};

export type Postconditions = {
  outcome: string;
  observableSignals: string[];
  failureSignals: string[];
};

export type VerificationRequirements = {
  strategy: "STATE_MATCH" | "CONTENT_MATCH" | "APP_OPEN" | "USER_CONFIRMATION";
  requiredSignals: string[];
  minimumConfidence: number;
  allowPartial: boolean;
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskClassification = {
  level: RiskLevel;
  factors: string[];
  requiresApproval: boolean;
};

export type RecoveryPolicy = {
  maxRetries: number;
  onFailure: "RETRY" | "REPLAN" | "INTERVENTION" | "FAIL";
  fallbackStepIds: string[];
};

export type PlanStepDefinition = {
  id: string;
  title: string;
  abstractAction: string;
  preconditions: Preconditions;
  postconditions: Postconditions;
  verification: VerificationRequirements;
  risk: RiskClassification;
  recovery: RecoveryPolicy;
};

export type PlanRevision = {
  parentPlanId: PlanId;
  parentVersion: number;
  reason: string;
  createdAt: string;
};

export type PlannerInput = {
  runId: AgentRunId;
  goalText: string;
  requiredCapabilities: string[];
  targetApplication?: string;
  sensitivity: Sensitivity;
  version?: number;
  revision?: PlanRevision;
};
