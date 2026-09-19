import type { Intent, Plan, PlanStep } from "../../shared/agent/domain";
import type { PlannerInput, Preconditions, Postconditions, RecoveryPolicy, RiskClassification, VerificationRequirements } from "../../shared/agent/planning";
import { validatePlan } from "../agent/validation";

const commonRecovery: RecoveryPolicy = { maxRetries: 1, onFailure: "REPLAN", fallbackStepIds: [] };
function step(id: string, title: string, action: string, pre: Preconditions, post: Postconditions, verification: VerificationRequirements, risk: RiskClassification, recovery: RecoveryPolicy = commonRecovery): PlanStep {
  return { id, title, precondition: pre.requiredState, abstractAction: action, expectedPostcondition: post.outcome, verificationStrategy: verification.strategy, risk: risk.level, retryBudget: recovery.maxRetries, preconditions: pre, postconditions: post, verification, riskClassification: risk, recoveryPolicy: recovery };
}

export class DeterministicPlanBuilder {
  build(input: PlannerInput): Plan {
    const lower = input.goalText.toLowerCase();
    const target = input.targetApplication;
    const steps: PlanStep[] = [];
    if (lower.includes("youtube") && (lower.includes("search") || lower.includes("programming"))) {
      steps.push(step("launch-app", `Open ${target ?? "YouTube"}`, "Launch the target application.", { requiredState: "device available", requiredCapabilities: ["APP_LAUNCH"], requiredEntities: [target ?? "YouTube"] }, { outcome: `${target ?? "YouTube"} is open`, observableSignals: ["target app foreground"], failureSignals: ["app unavailable"] }, { strategy: "APP_OPEN", requiredSignals: ["target app foreground"], minimumConfidence: 0.9, allowPartial: false }, { level: "LOW", factors: ["app launch only"], requiresApproval: false }));
      steps.push(step("search-query", "Search for programming", "Submit the programming search query.", { requiredState: `${target ?? "YouTube"} is open`, requiredCapabilities: ["UI_INTERACTION", "CONTENT_READ"], requiredEntities: ["programming"] }, { outcome: "Search results for programming are visible", observableSignals: ["results visible", "query reflected"], failureSignals: ["empty results", "search unavailable"] }, { strategy: "CONTENT_MATCH", requiredSignals: ["programming query", "results visible"], minimumConfidence: 0.85, allowPartial: false }, { level: "LOW", factors: ["non-destructive search"], requiresApproval: false }));
    } else if (lower.includes("find") && (lower.includes("video editing") || lower.includes("application") || lower.includes("app"))) {
      steps.push(step("discover-app", "Find a video editing application", "Search available applications for a video editing option.", { requiredState: "device available", requiredCapabilities: ["CONTENT_READ"], requiredEntities: ["video editing"] }, { outcome: "At least one candidate application is identified", observableSignals: ["candidate list visible"], failureSignals: ["no candidate found"] }, { strategy: "CONTENT_MATCH", requiredSignals: ["video editing candidate"], minimumConfidence: 0.8, allowPartial: true }, { level: "LOW", factors: ["discovery only"], requiresApproval: false }));
    } else {
      steps.push(step("clarify-goal", "Clarify the goal", "Request missing information before producing an executable plan.", { requiredState: "intent contains ambiguity", requiredCapabilities: [], requiredEntities: [] }, { outcome: "Required clarification is collected", observableSignals: ["user response"], failureSignals: ["no response"] }, { strategy: "USER_CONFIRMATION", requiredSignals: ["user response"], minimumConfidence: 1, allowPartial: false }, { level: input.sensitivity, factors: ["goal pattern not recognized"], requiresApproval: true }, { maxRetries: 0, onFailure: "INTERVENTION", fallbackStepIds: [] }));
    }
    const plan: Plan = { id: `plan_${crypto.randomUUID()}` as Plan["id"], runId: input.runId, version: input.version ?? 1, steps, requiresApproval: steps.some((item) => item.riskClassification?.requiresApproval), createdAt: new Date().toISOString(), parentPlanId: input.revision?.parentPlanId, revisionReason: input.revision?.reason };
    validatePlan(plan);
    return plan;
  }
}

export function buildPlanFromIntent(runId: Plan["runId"], intent: Intent, version = 1, revision?: PlannerInput["revision"]): Plan {
  return new DeterministicPlanBuilder().build({ runId, goalText: intent.desiredOutcome, requiredCapabilities: intent.requiredCapabilities, targetApplication: intent.constraints.targetApplication, sensitivity: intent.sensitivity, version, revision });
}
