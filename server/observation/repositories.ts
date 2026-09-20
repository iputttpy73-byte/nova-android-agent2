import type { ObservationEngine, ObservationRepositories, ObservationRecordInput, ObservationAuditRepository } from "../../shared/observation/contracts";
import type { ObservationAuditEvent, ObservationRecord, ObservationSource } from "../../shared/observation/domain";
import { validateObservationRecord } from "./validation";

const clone = <T>(value: T): T => structuredClone(value);
export class InMemoryObservationRepositories implements ObservationRepositories, ObservationAuditRepository {
  readonly records: ObservationRepositories["records"];
  private readonly audits: ObservationAuditEvent[] = [];
  constructor() {
    const records = new Map<string, ObservationRecord>();
    this.records = {
      create: async (value) => { validateObservationRecord(value); if (records.has(value.id)) throw new Error("Observation record already exists."); records.set(value.id, clone(value)); return clone(value); },
      getById: async (id) => clone(records.get(id)),
      listByRun: async (runId) => [...records.values()].filter((item) => item.runId === runId).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).map(clone),
      listBySource: async (runId, source) => [...records.values()].filter((item) => item.runId === runId && item.source === source).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).map(clone),
      delete: async (ownerId, runId, recordId) => { const value = records.get(recordId); if (!value || value.ownerId !== ownerId || value.runId !== runId) throw new Error("Observation record not found."); records.delete(recordId); await this.append({ id: `observation_audit_${crypto.randomUUID()}`, ownerId, runId, recordId, action: "RECORD_DELETED", outcome: "SUCCESS", createdAt: new Date().toISOString() }); },
    };
  }
  async append(value: ObservationAuditEvent): Promise<ObservationAuditEvent> { this.audits.push(clone(value)); return clone(value); }
  async listByRun(runId: string): Promise<ObservationAuditEvent[]> { return this.audits.filter((item) => item.runId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone); }
}

export class InMemoryObservationEngine implements ObservationEngine {
  constructor(private readonly repositories: ObservationRepositories, private readonly audit: ObservationAuditRepository) {}
  async record(input: ObservationRecordInput, ownerId: string): Promise<ObservationRecord> { const now = new Date().toISOString(); const value: ObservationRecord = { ...input, id: `observation_record_${crypto.randomUUID()}`, ownerId, createdAt: now }; await this.audit.append({ id: `observation_audit_${crypto.randomUUID()}`, ownerId, runId: input.runId, recordId: value.id, action: "RECORD_REQUESTED", outcome: "SUCCESS", metadata: { source: input.source, status: input.status }, createdAt: now }); try { const created = await this.repositories.records.create(value); await this.audit.append({ id: `observation_audit_${crypto.randomUUID()}`, ownerId, runId: input.runId, recordId: created.id, action: "RECORD_ACCEPTED", outcome: "SUCCESS", createdAt: new Date().toISOString() }); return created; } catch (error) { await this.audit.append({ id: `observation_audit_${crypto.randomUUID()}`, ownerId, runId: input.runId, recordId: value.id, action: "RECORD_REJECTED", outcome: "DENIED", metadata: { reason: error instanceof Error ? error.message : "Observation validation failed." }, createdAt: new Date().toISOString() }); throw error; } }
  async get(recordId: string, ownerId: string): Promise<ObservationRecord | undefined> { const value = await this.repositories.records.getById(recordId); if (!value || value.ownerId !== ownerId) return undefined; await this.audit.append({ id: `observation_audit_${crypto.randomUUID()}`, ownerId, runId: value.runId, recordId, action: "RECORD_RETRIEVED", outcome: "SUCCESS", createdAt: new Date().toISOString() }); return value; }
  async listByRun(runId: string, ownerId: string): Promise<ObservationRecord[]> { const values = (await this.repositories.records.listByRun(runId)).filter((item) => item.ownerId === ownerId); for (const value of values) await this.audit.append({ id: `observation_audit_${crypto.randomUUID()}`, ownerId, runId, recordId: value.id, action: "RECORD_RETRIEVED", outcome: "SUCCESS", createdAt: new Date().toISOString() }); return values; }
}
export type ObservationRepositorySource = ObservationSource;
