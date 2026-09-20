export type MemoryScope = "SESSION" | "WORKING" | "LONG_TERM";
export type MemoryKind = "FACT" | "PREFERENCE" | "CONTEXT" | "SUMMARY" | "INSTRUCTION";
export type MemorySensitivity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MemorySource = "USER_EXPLICIT" | "USER_PROFILE" | "SYSTEM_EXPLICIT" | "AI_PROPOSAL";
export type ConsentStatus = "REQUESTED" | "GRANTED" | "DENIED" | "REVOKED" | "EXPIRED";
export type MemoryAuditAction = "WRITE_REQUESTED" | "WRITE_ACCEPTED" | "WRITE_DENIED" | "READ_ALLOWED" | "READ_DENIED" | "DELETED" | "CONSENT_GRANTED" | "CONSENT_REVOKED";

export type UserProfile = { id: string; ownerId: string; displayName?: string; locale?: string; timezone?: string; createdAt: string; updatedAt: string };
export type Preferences = { id: string; ownerId: string; values: Record<string, string | number | boolean>; consentStatus: ConsentStatus; updatedAt: string };
export type SessionMemory = { id: string; ownerId: string; sessionId: string; entries: string[]; expiresAt: string; createdAt: string };
export type WorkingMemory = { id: string; ownerId: string; runId?: string; entries: string[]; expiresAt?: string; createdAt: string; updatedAt: string };
export type LongTermMemory = { id: string; ownerId: string; entryIds: string[]; consentStatus: ConsentStatus; createdAt: string; updatedAt: string };
export type MemoryEntry = { id: string; ownerId: string; scope: MemoryScope; kind: MemoryKind; key: string; value: string; source: MemorySource; sensitivity: MemorySensitivity; confidence: number; consentStatus: ConsentStatus; expiresAt?: string; createdAt: string; deletedAt?: string };
export type MemoryConsent = { id: string; ownerId: string; scope: MemoryScope; purpose: string; status: ConsentStatus; requestedAt: string; resolvedAt?: string; expiresAt?: string };
export type MemoryAuditEvent = { id: string; ownerId: string; entryId?: string; action: MemoryAuditAction; actor: "USER" | "SYSTEM" | "AI"; outcome: "SUCCESS" | "DENIED" | "FAILED"; metadata?: Record<string, unknown>; createdAt: string };
