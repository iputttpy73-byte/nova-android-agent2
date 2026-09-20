import type { ConsentStatus, MemoryEntry, MemoryScope, MemorySensitivity } from "./domain";

export type MemoryReadRequest = { ownerId: string; scope?: MemoryScope; query?: string; maxEntries: number; sensitivityCeiling: MemorySensitivity; purpose: string };
export type MemoryWriteRequest = { ownerId: string; entry: Omit<MemoryEntry, "id" | "createdAt" | "deletedAt">; actor: "USER" | "SYSTEM" | "AI"; explicitUserAction: boolean; consentStatus: ConsentStatus };
export type MemoryDeleteRequest = { ownerId: string; entryId?: string; scope?: MemoryScope; actor: "USER" | "SYSTEM"; reason: string };
export type MemoryPolicyDecision = { allowed: boolean; reason: string };

const sensitivityRank: Record<MemorySensitivity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
export function evaluateMemoryRead(request: MemoryReadRequest): MemoryPolicyDecision {
  if (!request.ownerId.trim() || !request.purpose.trim()) return { allowed: false, reason: "Owner and purpose are required." };
  if (!Number.isInteger(request.maxEntries) || request.maxEntries < 1 || request.maxEntries > 100) return { allowed: false, reason: "Read size must be between 1 and 100." };
  return { allowed: true, reason: "Read request is within policy." };
}
export function evaluateMemoryWrite(request: MemoryWriteRequest): MemoryPolicyDecision {
  if (!request.ownerId.trim() || !request.entry.key.trim() || !request.entry.value.trim()) return { allowed: false, reason: "Owner, key, and value are required." };
  if (!request.explicitUserAction) return { allowed: false, reason: "Automatic memory creation is not permitted." };
  if (request.actor === "AI") return { allowed: false, reason: "AI-generated memory cannot be stored directly." };
  if (request.entry.scope === "LONG_TERM" && request.consentStatus !== "GRANTED") return { allowed: false, reason: "Long-term memory requires granted consent." };
  if (request.entry.source === "AI_PROPOSAL") return { allowed: false, reason: "AI proposals require a user-confirmed write request." };
  return { allowed: true, reason: "Write request is within policy." };
}
export function evaluateMemoryReadSensitivity(entry: MemoryEntry, ceiling: MemorySensitivity): boolean { return sensitivityRank[entry.sensitivity] <= sensitivityRank[ceiling]; }
export function canDeleteMemory(request: MemoryDeleteRequest): MemoryPolicyDecision { return request.actor === "USER" && request.reason.trim().length > 0 ? { allowed: true, reason: "User deletion is allowed." } : { allowed: false, reason: "Only a user can request memory deletion." }; }
