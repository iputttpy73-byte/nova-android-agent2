import type { ExpectedPostcondition, VerificationConfidence, VerificationEvidence, VerificationResultStatus } from "./domain";

export type VerificationPolicy = { version: string; minimumEvidence: number; permitUserConfirmation: boolean; maxEvidenceAgeMs: number; allowRestrictedEvidence: boolean };
export const DEFAULT_VERIFICATION_POLICY: VerificationPolicy = { version: "v1", minimumEvidence: 1, permitUserConfirmation: true, maxEvidenceAgeMs: 5 * 60 * 1000, allowRestrictedEvidence: false };
export type VerificationDecision = { status: VerificationResultStatus; confidence: VerificationConfidence; matchedSignals: string[]; missingSignals: string[]; reason: string };

export function evaluateEvidence(policy: VerificationPolicy, expected: ExpectedPostcondition, evidence: VerificationEvidence[], now = Date.now()): VerificationDecision {
  const accepted = evidence.filter((item) => expected.allowedSources.includes(item.source) && (policy.allowRestrictedEvidence || item.redactionState !== "RESTRICTED") && now - Date.parse(item.capturedAt) <= policy.maxEvidenceAgeMs && (item.source !== "USER_CONFIRMATION" || policy.permitUserConfirmation));
  if (accepted.length < policy.minimumEvidence) return decision("UNAVAILABLE", 0, [], expected.requiredSignals, "Required verification evidence is unavailable.");
  const observed = new Set(accepted.flatMap((item) => item.observedSignals));
  const contradicted = new Set(accepted.flatMap((item) => item.contradictedSignals ?? []));
  const matchedSignals = expected.requiredSignals.filter((signal) => observed.has(signal));
  const missingSignals = expected.requiredSignals.filter((signal) => !observed.has(signal));
  const score = accepted.reduce((sum, item) => sum + item.confidence, 0) / accepted.length;
  const confidence: VerificationConfidence = { score: Math.max(0, Math.min(1, score)), band: score >= 0.8 ? "HIGH" : score >= 0.5 ? "MEDIUM" : "LOW", rationale: [`${accepted.length} evidence item(s) accepted.`, `${matchedSignals.length}/${expected.requiredSignals.length} required signal(s) matched.`] };
  if (expected.requiredSignals.some((signal) => contradicted.has(signal))) return { status: "FAILED", confidence, matchedSignals, missingSignals, reason: "Accepted evidence contradicts a required postcondition signal." };
  if (missingSignals.length > 0) return { status: "UNCERTAIN", confidence, matchedSignals, missingSignals, reason: "Evidence is available but does not establish every required signal." };
  if (score < expected.minimumConfidence) return { status: "UNCERTAIN", confidence, matchedSignals, missingSignals, reason: "Matched signals do not meet the confidence threshold." };
  return { status: "PASSED", confidence, matchedSignals, missingSignals, reason: "All required signals matched within policy." };
}
function decision(status: VerificationResultStatus, score: number, matchedSignals: string[], missingSignals: string[], reason: string): VerificationDecision { return { status, confidence: { score, band: score >= 0.8 ? "HIGH" : score >= 0.5 ? "MEDIUM" : "LOW", rationale: [reason] }, matchedSignals, missingSignals, reason }; }
