import { describe, expect, it } from "vitest";
import { InMemoryAgentCore } from "../server/agent/agent-core";
import type { AgentRunId } from "../shared/agent/domain";
import { InMemoryEventRepositories } from "../server/persistence/event-repositories";

const user = { actorId: "user-1", role: "USER" as const };

describe("Phase 4 event and audit flows", () => {
  it("persists a run-created event and audit record", async () => {
    const events = new InMemoryEventRepositories();
    const core = new InMemoryAgentCore(events);
    const run = await core.createRun({ ownerId: user.actorId, goalText: "Review agenda" }, user);
    expect((await core.listEvents(run.id, user)).map((event) => event.type)).toEqual(["RUN_CREATED"]);
    expect((await core.listAudit(run.id, user))[0]).toMatchObject({ action: "RUN_CREATED", outcome: "SUCCESS", actorId: "user-1" });
  });

  it("persists every valid state transition in sequence", async () => {
    const events = new InMemoryEventRepositories();
    const core = new InMemoryAgentCore(events);
    const run = await core.createRun({ ownerId: user.actorId, goalText: "Review agenda" }, user);
    await core.submit(run.id, user);
    await core.beginIntentParsing(run.id);
    const runEvents = await core.listEvents(run.id, user);
    expect(runEvents.map((event) => event.type)).toEqual(["RUN_CREATED", "STATE_TRANSITION", "STATE_TRANSITION"]);
    expect(runEvents.map((event) => event.sequence)).toEqual([1, 2, 3]);
    expect(runEvents[2]).toMatchObject({ fromState: "SUBMITTED", toState: "INTENT_PARSING" });
    expect((await core.listAudit(run.id, user))).toHaveLength(3);
  });

  it("creates and retrieves an intervention request", async () => {
    const events = new InMemoryEventRepositories();
    const core = new InMemoryAgentCore(events);
    const run = await core.createRun({ ownerId: user.actorId, goalText: "Review agenda" }, user);
    const request = await core.requestIntervention({ runId: run.id, reason: "Approval required", requestedAction: "Confirm the plan", risk: "HIGH", expiresAt: "2030-01-01T00:00:00.000Z" });
    expect(request.status).toBe("OPEN");
    expect(await core.listInterventions(run.id, user, "OPEN")).toEqual([request]);
    expect((await core.listEvents(run.id, user)).at(-1)).toMatchObject({ type: "INTERVENTION_REQUESTED" });
  });

  it("protects event and audit retrieval by owner", async () => {
    const core = new InMemoryAgentCore();
    const run = await core.createRun({ ownerId: user.actorId, goalText: "Review agenda" }, user);
    await expect(core.listEvents(run.id, { actorId: "user-2", role: "USER" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(core.listAudit(run.id, { actorId: "user-2", role: "USER" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects duplicate events and invalid intervention requests", async () => {
    const events = new InMemoryEventRepositories();
    const runId = "run-1" as AgentRunId;
    const event = { id: "event-1", runId, sequence: 1, type: "RUN_CREATED" as const, actor: "SYSTEM" as const, createdAt: new Date().toISOString() };
    await events.events.append(event);
    await expect(events.events.append(event)).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
    await expect(events.interventions.create({ id: "intervention-1", runId, reason: "", requestedAction: "", risk: "LOW", status: "OPEN", expiresAt: new Date().toISOString(), createdAt: new Date().toISOString() })).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
  });
});
