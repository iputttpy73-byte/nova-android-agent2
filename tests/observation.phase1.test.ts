import { describe, expect, it } from "vitest";
import { InMemoryObservationEngine, InMemoryObservationRepositories } from "../server/observation/repositories";
import { validateObservationConfidence, validateObservationRecord } from "../server/observation/validation";
import { OBSERVATION_SOURCES } from "../shared/observation/policy";
import type { ObservationRecord } from "../shared/observation/domain";

const now = new Date().toISOString();
const input = (source: ObservationRecord["source"] = "APPLICATION_METADATA") => ({ ownerId: "ignored-by-engine", runId: "run-1", stepId: "step-1", source, status: "AVAILABLE" as const, payloadReference: `future://${source.toLowerCase()}/record`, signals: ["application visible"], confidence: { score: 0.9, band: "HIGH" as const, rationale: ["Typed observation contract supplied."] }, redactionState: "MINIMIZED" as const, capturedAt: now });

describe("Android Observation contracts", () => {
  it("supports every required observation source", () => {
    expect(OBSERVATION_SOURCES).toEqual(["ACCESSIBILITY_TREE", "UI_HIERARCHY", "OCR", "SCREENSHOT", "APPLICATION_METADATA"]);
  });

  it("validates confidence band and score together", () => {
    expect(() => validateObservationConfidence({ score: 0.9, band: "LOW", rationale: ["wrong band"] })).toThrow("does not match");
    expect(() => validateObservationConfidence({ score: 0.9, band: "HIGH", rationale: [] })).toThrow("rationale");
  });

  it("accepts unavailable observations without pretending to have evidence", () => {
    const record: ObservationRecord = { id: "record-unavailable", ownerId: "owner-1", runId: "run-1", source: "SCREENSHOT", status: "UNAVAILABLE", signals: [], confidence: { score: 0, band: "LOW", rationale: ["Capture source is not implemented."] }, redactionState: "REDACTED", capturedAt: now, createdAt: now };
    expect(() => validateObservationRecord(record)).not.toThrow();
  });
});

describe("Observation repository and engine", () => {
  it("persists a typed record and writes request/accept/retrieve audit events", async () => {
    const repositories = new InMemoryObservationRepositories();
    const engine = new InMemoryObservationEngine(repositories, repositories);
    const record = await engine.record(input("UI_HIERARCHY"), "owner-1");
    expect(record.ownerId).toBe("owner-1");
    expect(record.source).toBe("UI_HIERARCHY");
    expect(await engine.get(record.id, "owner-1")).toMatchObject({ id: record.id });
    expect(await engine.get(record.id, "owner-2")).toBeUndefined();
    expect((await repositories.listByRun("run-1")).map((event) => event.action)).toEqual(["RECORD_REQUESTED", "RECORD_ACCEPTED", "RECORD_RETRIEVED"]);
  });

  it("lists records by owner and source without cross-owner leakage", async () => {
    const repositories = new InMemoryObservationRepositories();
    const engine = new InMemoryObservationEngine(repositories, repositories);
    await engine.record(input("OCR"), "owner-1");
    await engine.record(input("SCREENSHOT"), "owner-2");
    expect(await engine.listByRun("run-1", "owner-1")).toHaveLength(1);
    expect(await repositories.records.listBySource("run-1", "OCR")).toHaveLength(1);
  });

  it("deletes only an owned record and audits deletion", async () => {
    const repositories = new InMemoryObservationRepositories();
    const engine = new InMemoryObservationEngine(repositories, repositories);
    const record = await engine.record(input("ACCESSIBILITY_TREE"), "owner-1");
    await expect(repositories.records.delete("owner-2", "run-1", record.id)).rejects.toThrow("not found");
    await repositories.records.delete("owner-1", "run-1", record.id);
    expect(await engine.get(record.id, "owner-1")).toBeUndefined();
    expect((await repositories.listByRun("run-1")).at(-1)?.action).toBe("RECORD_DELETED");
  });

  it("rejects invalid records and records a denied audit event", async () => {
    const repositories = new InMemoryObservationRepositories();
    const engine = new InMemoryObservationEngine(repositories, repositories);
    await expect(engine.record({ ...input("APPLICATION_METADATA"), confidence: { score: 0.9, band: "LOW", rationale: ["invalid"] } }, "owner-1")).rejects.toThrow("does not match");
    expect((await repositories.listByRun("run-1")).at(-1)).toMatchObject({ action: "RECORD_REJECTED", outcome: "DENIED" });
  });
});
