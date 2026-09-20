export type InterventionType = "APPROVAL_REQUIRED" | "USER_CONFIRMATION" | "CLARIFICATION_REQUIRED" | "AUTHENTICATION_REQUIRED" | "SECURITY_DECISION" | "DEVICE_ACTION_REQUIRED" | "RECOVERY_ASSISTANCE";
export type InterventionOutcome = "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED" | "RESOLVED";
export type InterventionStatus = "OPEN" | "RESPONDED" | "RESOLVED" | "EXPIRED" | "CANCELLED";
export type InterventionRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InterventionRequest = { id: string; ownerId: string; runId: string; type: InterventionType; title: string; reason: string; requestedAction: string; risk: InterventionRisk; status: InterventionStatus; policyId: string; expiresAt: string; createdAt: string; resolvedAt?: string };
export type InterventionResponse = { id: string; requestId: string; responderId: string; outcome: InterventionOutcome; message?: string; submittedAt: string };
export type InterventionResolution = { id: string; requestId: string; responseId: string; outcome: InterventionOutcome; resultingRunState: string; resolutionNote: string; resolvedBy: string; resolvedAt: string };
export type InterventionPolicy = { id: string; version: string; allowedTypes: InterventionType[]; approvalRequiredFor: InterventionType[]; allowedOutcomes: InterventionOutcome[]; defaultExpiryMs: number; createdAt: string };
export type InterventionAuditEvent = { id: string; ownerId: string; runId: string; requestId?: string; responseId?: string; action: "REQUESTED" | "RESPONDED" | "RESOLVED" | "EXPIRED" | "CANCELLED" | "STATE_TRANSITION"; outcome: "SUCCESS" | "DENIED" | "FAILED"; metadata?: Record<string, unknown>; createdAt: string };
