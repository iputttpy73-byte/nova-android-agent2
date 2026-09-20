export type ObservationSource = "ACCESSIBILITY_TREE" | "UI_HIERARCHY" | "OCR" | "SCREENSHOT" | "APPLICATION_METADATA";
export type ObservationConfidenceBand = "LOW" | "MEDIUM" | "HIGH";
export type ObservationRedactionState = "REDACTED" | "MINIMIZED" | "RESTRICTED";
export type ObservationStatus = "AVAILABLE" | "UNAVAILABLE";
export type ObservationConfidence = { score: number; band: ObservationConfidenceBand; rationale: string[] };
export type ObservationRecord = { id: string; ownerId: string; runId: string; stepId?: string; source: ObservationSource; status: ObservationStatus; payloadReference?: string; payload?: Record<string, unknown>; signals: string[]; confidence: ObservationConfidence; redactionState: ObservationRedactionState; capturedAt: string; expiresAt?: string; createdAt: string };
export type ObservationAuditEvent = { id: string; ownerId: string; runId: string; recordId?: string; action: "RECORD_REQUESTED" | "RECORD_ACCEPTED" | "RECORD_REJECTED" | "RECORD_RETRIEVED" | "RECORD_DELETED"; outcome: "SUCCESS" | "DENIED" | "FAILED"; metadata?: Record<string, unknown>; createdAt: string };
