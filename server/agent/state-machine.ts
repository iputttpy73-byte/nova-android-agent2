import type { AgentRunState, StateTransition } from "../../shared/agent/domain";
import { AgentDomainError } from "../../shared/agent/contracts";

const TRANSITIONS: Record<AgentRunState, readonly AgentRunState[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["INTENT_PARSING", "CANCELLED", "EXPIRED"],
  INTENT_PARSING: ["PLAN_PENDING", "HUMAN_INTERVENTION", "FAILED", "BLOCKED"],
  PLAN_PENDING: ["READY", "HUMAN_INTERVENTION", "FAILED", "BLOCKED"],
  READY: ["EXECUTING", "HUMAN_INTERVENTION", "CANCELLED", "EXPIRED"],
  EXECUTING: ["VERIFYING", "RECOVERING", "HUMAN_INTERVENTION", "FAILED", "CANCELLED", "BLOCKED"],
  VERIFYING: ["COMPLETED", "PARTIALLY_COMPLETED", "RECOVERING", "HUMAN_INTERVENTION", "FAILED", "BLOCKED"],
  RECOVERING: ["EXECUTING", "VERIFYING", "HUMAN_INTERVENTION", "FAILED", "BLOCKED", "EXPIRED"],
  HUMAN_INTERVENTION: ["PLAN_PENDING", "READY", "EXECUTING", "CANCELLED", "EXPIRED", "BLOCKED"],
  COMPLETED: [],
  PARTIALLY_COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
  BLOCKED: [],
  EXPIRED: [],
};

export function canTransition(from: AgentRunState, to: AgentRunState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: AgentRunState, to: AgentRunState): void {
  if (from === to || !canTransition(from, to)) {
    throw new AgentDomainError("INVALID_STATE_TRANSITION", `Transition ${from} → ${to} is not allowed.`);
  }
}

export function transitionState(
  from: AgentRunState,
  to: AgentRunState,
  reason: string,
  actor: StateTransition["actor"],
  at: string,
): StateTransition {
  if (!reason.trim()) throw new AgentDomainError("INVALID_STATE_TRANSITION", "A transition reason is required.");
  assertTransition(from, to);
  return { from, to, reason: reason.trim(), actor, at };
}

export function isTerminalState(state: AgentRunState): boolean {
  return TRANSITIONS[state].length === 0;
}

export function allowedNextStates(state: AgentRunState): readonly AgentRunState[] {
  return TRANSITIONS[state];
}
