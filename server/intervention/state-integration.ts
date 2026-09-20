import type { AgentRunState, StateTransition } from "../../shared/agent/domain";
import type { InterventionOutcome } from "../../shared/intervention/domain";
import { transitionState } from "../agent/state-machine";

const APPROVAL_RESUME_STATES: readonly AgentRunState[] = ["PLAN_PENDING", "READY", "EXECUTING", "VERIFYING", "RECOVERING"];
export function resolveInterventionRunState(outcome: InterventionOutcome, requestedResumeState: AgentRunState = "READY"): AgentRunState {
  if (outcome === "APPROVED" || outcome === "RESOLVED") {
    if (!APPROVAL_RESUME_STATES.includes(requestedResumeState)) throw new Error("Requested resume state is not allowed after intervention.");
    return requestedResumeState;
  }
  if (outcome === "REJECTED") return "BLOCKED";
  if (outcome === "CANCELLED") return "CANCELLED";
  return "EXPIRED";
}
export function transitionAfterIntervention(outcome: InterventionOutcome, reason: string, actor: StateTransition["actor"], at: string, requestedResumeState?: AgentRunState): StateTransition {
  return transitionState("HUMAN_INTERVENTION", resolveInterventionRunState(outcome, requestedResumeState), reason, actor, at);
}
