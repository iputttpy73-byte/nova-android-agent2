import { describe, expect, it } from "vitest";
import { InMemoryMemoryRepositories } from "../server/memory/repositories";
import { evaluateMemoryRead, evaluateMemoryWrite } from "../shared/memory/policies";
import type { MemoryWriteRequest } from "../shared/memory/policies";

const baseWrite: MemoryWriteRequest = { ownerId: "user-memory", actor: "USER", explicitUserAction: true, consentStatus: "GRANTED", entry: { ownerId: "user-memory", scope: "LONG_TERM", kind: "PREFERENCE", key: "theme", value: "dark", source: "USER_EXPLICIT", sensitivity: "LOW", confidence: 1, consentStatus: "GRANTED" } };

describe("Memory policy", () => {
  it("rejects automatic and AI-originated memory creation", () => {
    expect(evaluateMemoryWrite({ ...baseWrite, explicitUserAction: false }).allowed).toBe(false);
    expect(evaluateMemoryWrite({ ...baseWrite, actor: "AI", entry: { ...baseWrite.entry, source: "AI_PROPOSAL" } }).allowed).toBe(false);
  });

  it("requires granted consent for long-term writes", () => {
    expect(evaluateMemoryWrite({ ...baseWrite, consentStatus: "REQUESTED", entry: { ...baseWrite.entry, consentStatus: "REQUESTED" } }).allowed).toBe(false);
    expect(evaluateMemoryWrite(baseWrite).allowed).toBe(true);
  });

  it("requires a bounded purpose and result size for retrieval", () => {
    expect(evaluateMemoryRead({ ownerId: "user-memory", maxEntries: 10, sensitivityCeiling: "MEDIUM", purpose: "personalization" }).allowed).toBe(true);
    expect(evaluateMemoryRead({ ownerId: "user-memory", maxEntries: 101, sensitivityCeiling: "MEDIUM", purpose: "personalization" }).allowed).toBe(false);
  });
});

describe("Memory repositories", () => {
  it("writes only through policy and records audit events", async () => {
    const repositories = new InMemoryMemoryRepositories();
    const entry = await repositories.entries.write(baseWrite);
    expect(entry.scope).toBe("LONG_TERM");
    expect((await repositories.audit.listByOwner("user-memory")).map((event) => event.action)).toContain("WRITE_ACCEPTED");
    await expect(repositories.entries.write({ ...baseWrite, explicitUserAction: false })).rejects.toThrow("Automatic memory creation");
    expect((await repositories.audit.listByOwner("user-memory")).map((event) => event.action)).toContain("WRITE_DENIED");
  });

  it("retrieves by owner, scope, query, and sensitivity ceiling", async () => {
    const repositories = new InMemoryMemoryRepositories();
    await repositories.entries.write(baseWrite);
    await repositories.entries.write({ ...baseWrite, entry: { ...baseWrite.entry, scope: "WORKING", key: "current_task", value: "review plan", consentStatus: "REQUESTED" }, consentStatus: "REQUESTED" });
    const results = await repositories.entries.read({ ownerId: "user-memory", scope: "LONG_TERM", query: "theme", maxEntries: 10, sensitivityCeiling: "LOW", purpose: "settings display" });
    expect(results).toHaveLength(1);
    expect(results[0]?.key).toBe("theme");
    expect(await repositories.entries.read({ ownerId: "other-user", maxEntries: 10, sensitivityCeiling: "CRITICAL", purpose: "isolation test" })).toHaveLength(0);
  });

  it("supports explicit user deletion without deleting another owner", async () => {
    const repositories = new InMemoryMemoryRepositories();
    const entry = await repositories.entries.write(baseWrite);
    await repositories.entries.delete({ ownerId: "user-memory", entryId: entry.id, actor: "USER", reason: "User requested deletion" });
    expect(await repositories.entries.getById("user-memory", entry.id)).toBeUndefined();
    expect((await repositories.audit.listByOwner("user-memory")).map((event) => event.action)).toContain("DELETED");
    expect(await repositories.entries.getById("other-user", entry.id)).toBeUndefined();
  });

  it("supports consent lifecycle and rejects invalid long-term context", async () => {
    const repositories = new InMemoryMemoryRepositories();
    const consent = await repositories.consent.create({ id: "consent-1", ownerId: "user-memory", scope: "LONG_TERM", purpose: "remember preferences", status: "REQUESTED", requestedAt: new Date().toISOString() });
    const resolved = await repositories.consent.resolve("user-memory", consent.id, "GRANTED");
    expect(resolved.status).toBe("GRANTED");
    await expect(repositories.consent.getById("other-user", consent.id)).resolves.toBeUndefined();
    await expect(repositories.longTerm.create({ id: "lt-1", ownerId: "user-memory", entryIds: [], consentStatus: "REQUESTED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })).rejects.toThrow("granted consent");
  });
});
