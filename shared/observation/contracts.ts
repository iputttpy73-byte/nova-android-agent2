import type { ObservationAuditEvent, ObservationRecord, ObservationSource } from "./domain";

export type ObservationRecordInput = Omit<ObservationRecord, "id" | "createdAt">;
export type ObservationEngine = { record(input: ObservationRecordInput, ownerId: string): Promise<ObservationRecord>; get(recordId: string, ownerId: string): Promise<ObservationRecord | undefined>; listByRun(runId: string, ownerId: string): Promise<ObservationRecord[]> };
export type ObservationRepositories = { records: { create(value: ObservationRecord): Promise<ObservationRecord>; getById(id: string): Promise<ObservationRecord | undefined>; listByRun(runId: string): Promise<ObservationRecord[]>; listBySource(runId: string, source: ObservationSource): Promise<ObservationRecord[]>; delete(ownerId: string, runId: string, recordId: string): Promise<void> } };
export type ObservationAuditRepository = { append(value: ObservationAuditEvent): Promise<ObservationAuditEvent>; listByRun(runId: string): Promise<ObservationAuditEvent[]> };
