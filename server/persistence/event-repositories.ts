import type { AgentRunId } from "../../shared/agent/domain";
import type { AgentRunEvent, AuditEvent, HumanInterventionRequest, InterventionStatus } from "../../shared/agent/events";
import { AgentDomainError } from "../../shared/agent/contracts";

export interface AgentRunEventRepository {
  append(event: AgentRunEvent): Promise<AgentRunEvent>;
  listByRun(runId: AgentRunId): Promise<AgentRunEvent[]>;
  getNextSequence(runId: AgentRunId): Promise<number>;
}

export interface AuditEventRepository {
  append(event: AuditEvent): Promise<AuditEvent>;
  listByRun(runId: AgentRunId): Promise<AuditEvent[]>;
  listByActor(actorId: string): Promise<AuditEvent[]>;
}

export interface HumanInterventionRepository {
  create(request: HumanInterventionRequest): Promise<HumanInterventionRequest>;
  getById(id: string): Promise<HumanInterventionRequest | undefined>;
  listByRun(runId: AgentRunId): Promise<HumanInterventionRequest[]>;
  listByStatus(status: InterventionStatus): Promise<HumanInterventionRequest[]>;
  resolve(id: string, resolution: string, status?: Extract<InterventionStatus, "RESOLVED" | "CANCELLED" | "EXPIRED">): Promise<HumanInterventionRequest>;
}

export type EventRepositories = { events: AgentRunEventRepository; audits: AuditEventRepository; interventions: HumanInterventionRepository };

const copy = <T>(value: T): T => structuredClone(value);

export class InMemoryEventRepositories implements EventRepositories {
  readonly events: AgentRunEventRepository;
  readonly audits: AuditEventRepository;
  readonly interventions: HumanInterventionRepository;

  constructor() {
    const events = new Map<string, AgentRunEvent>();
    const audits = new Map<string, AuditEvent>();
    const interventions = new Map<string, HumanInterventionRequest>();
    this.events = {
      append: async (event) => { if (events.has(event.id)) throw new AgentDomainError("INVALID_STATE_TRANSITION", "Event already exists."); events.set(event.id, copy(event)); return copy(event); },
      listByRun: async (runId) => [...events.values()].filter((event) => event.runId === runId).sort((a, b) => a.sequence - b.sequence).map(copy),
      getNextSequence: async (runId) => { const runEvents = [...events.values()].filter((event) => event.runId === runId); return runEvents.length ? Math.max(...runEvents.map((event) => event.sequence)) + 1 : 1; },
    };
    this.audits = {
      append: async (event) => { if (audits.has(event.id)) throw new AgentDomainError("INVALID_STATE_TRANSITION", "Audit event already exists."); audits.set(event.id, copy(event)); return copy(event); },
      listByRun: async (runId) => [...audits.values()].filter((event) => event.runId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(copy),
      listByActor: async (actorId) => [...audits.values()].filter((event) => event.actorId === actorId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(copy),
    };
    this.interventions = {
      create: async (request) => { if (interventions.has(request.id)) throw new AgentDomainError("INVALID_STATE_TRANSITION", "Intervention already exists."); if (!request.reason.trim() || !request.requestedAction.trim()) throw new AgentDomainError("INVALID_STATE_TRANSITION", "Intervention reason and requested action are required."); interventions.set(request.id, copy(request)); return copy(request); },
      getById: async (id) => copy(interventions.get(id)),
      listByRun: async (runId) => [...interventions.values()].filter((request) => request.runId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(copy),
      listByStatus: async (status) => [...interventions.values()].filter((request) => request.status === status).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(copy),
      resolve: async (id, resolution, status = "RESOLVED") => { const request = interventions.get(id); if (!request) throw new AgentDomainError("RUN_NOT_FOUND", "Intervention was not found."); if (!resolution.trim()) throw new AgentDomainError("INVALID_STATE_TRANSITION", "Intervention resolution is required."); const resolved = { ...request, status, resolution: resolution.trim(), resolvedAt: new Date().toISOString() }; interventions.set(id, copy(resolved)); return copy(resolved); },
    };
  }
}
