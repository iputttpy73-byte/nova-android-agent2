export type VerificationResultStatus = "PASSED" | "FAILED" | "UNCERTAIN" | "UNAVAILABLE";
export type VerificationEvidenceSource = "ACCESSIBILITY" | "APP_STATE" | "OCR" | "SCREENSHOT" | "NOTIFICATION" | "USER_CONFIRMATION" | "SYSTEM";
export type VerificationConfidenceBand = "LOW" | "MEDIUM" | "HIGH";

export type ExpectedPostcondition = { id: string; runId: string; stepId: string; description: string; requiredSignals: string[]; strategy: "STATE_MATCH" | "CONTENT_MATCH" | "APP_OPEN" | "USER_CONFIRMATION"; minimumConfidence: number; allowedSources: VerificationEvidenceSource[]; createdAt: string };
export type VerificationEvidence = { id: string; runId: string; stepId: string; source: VerificationEvidenceSource; reference?: string; observedSignals: string[]; contradictedSignals?: string[]; confidence: number; redactionState: "REDACTED" | "MINIMIZED" | "RESTRICTED"; capturedAt: string; expiresAt?: string };
export type VerificationConfidence = { score: number; band: VerificationConfidenceBand; rationale: string[] };
export type VerificationResult = { id: string; recordId: string; status: VerificationResultStatus; confidence: VerificationConfidence; matchedSignals: string[]; missingSignals: string[]; reason: string; createdAt: string };
export type VerificationRecord = { id: string; runId: string; stepId: string; expectedPostconditionId: string; status: VerificationResultStatus; evidenceIds: string[]; resultId?: string; policyVersion: string; createdAt: string; completedAt?: string };
export type VerificationAuditEvent = { id: string; ownerId: string; runId: string; stepId: string; recordId?: string; action: "VERIFICATION_REQUESTED" | "EVIDENCE_ACCEPTED" | "EVIDENCE_REJECTED" | "RESULT_RECORDED"; outcome: "SUCCESS" | "DENIED" | "FAILED"; metadata?: Record<string, unknown>; createdAt: string };
