import { describe, expect, it } from "vitest";
import { InMemoryAgentCore } from "../server/agent/agent-core";
import { AgentCoreIntegrationService } from "../server/agent/core-integration";
import { DeterministicIntentParser } from "../server/ai/deterministic-intent-parser";
import { DeterministicPlannerService } from "../server/planner/planner-service";
import { InMemoryRepositories } from "../server/persistence/repositories";
import { InMemoryMemoryRepositories } from "../server/memory/repositories";
import { InMemoryVerificationRepositories } from "../server/verifier/repositories";
import { InMemoryRecoveryRepositories } from "../server/recovery/repositories";
import { InMemoryInterventionRepositories } from "../server/intervention/repositories";
import { InMemoryEventRepositories } from "../server/persistence/event-repositories";
import { DEFAULT_RECOVERY_POLICY } from "../shared/recovery/policy";
import { INTERVENTION_OUTCOMES, INTERVENTION_TYPES } from "../shared/intervention/policy";
import type { InterventionPolicy } from "../shared/intervention/domain";
import type { RecoveryPolicy } from "../shared/recovery/domain";

function setup() {
  const events = new InMemoryEventRepositories();
  const persistence = new InMemoryRepositories();
  const memory = new InMemoryMemoryRepositories();
  const verifier = new InMemoryVerificationRepositories();
  const recovery = new InMemoryRecoveryRepositories();
  const interventions = new InMemoryInterventionRepositories();
  const recoveryPolicy: RecoveryPolicy = { id: "recovery-policy", createdAt: new Date().toISOString(), ...DEFAULT_RECOVERY_POLICY };
  const interventionPolicy: InterventionPolicy = { id: "intervention-policy", version: "v1", allowedTypes: [...INTERVENTION_TYPES], approvalRequiredFor: ["APPROVAL_REQUIRED", "SECURITY_DECISION"], allowedOutcomes: [...INTERVENTION_OUTCOMES], defaultExpiryMs: 60_000, createdAt: new Date().toISOString() };
  return (async () => {
    await recovery.policies.create(recoveryPolicy);
    await interventions.policies.create(interventionPolicy);
    const core = new InMemoryAgentCore(events);
    const service = new AgentCoreIntegrationService({ core, parser: new DeterministicIntentParser(), planner: new DeterministicPlannerService(persistence.plans), memory, verifier, recovery, interventions, audits: events.audits }, { recoveryPolicyId: recoveryPolicy.id, interventionPolicyId: interventionPolicy.id, memoryPurpose: "prepare-agent-run", memoryMaxEntries: 20 });
    return { service, events, verifier, interventions };
  })();
}

describe("Agent Core Integration Phase 1", () => {
  it("runs goal through parsing, planning, memory, verification, recovery, provider status, and READY", async () => {
    const { service, events, verifier } = await setup();
    const result = await service.run({ ownerId: "owner-1", goalText: "Open YouTube and search programming", constraints: { targetApplication: "YouTube" } });
    expect(result.stage).toBe("READY");
    expect(result.run.state).toBe("READY");
    expect(result.intent.requiredCapabilities).toContain("APP_LAUNCH");
    expect(result.plan.steps.length).toBe(2);
    expect(result.memoryEntries).toEqual([]);
    expect(result.verificationPostconditions).toHaveLength(2);
    expect(result.recoveryPreparation).toHaveLength(2);
    expect(result.providerStatus).toBe("NOT_CONFIGURED");
    expect((await verifier.postconditions.getById(result.verificationPostconditions[0].id))?.runId).toBe(result.run.id);
    const auditActions = (await events.audits.listByRun(result.run.id)).map((event) => event.action);
    expect(auditActions).toContain("INTEGRATION_MEMORY_RETRIEVED");
    expect(auditActions).toContain("INTEGRATION_VERIFICATION_PREPARED");
    expect(auditActions).toContain("INTEGRATION_RECOVERY_PREPARED");
    expect(auditActions.at(-1)).toBe("INTEGRATION_READY");
  });

  it("detects ambiguity and moves the run to HUMAN_INTERVENTION", async () => {
    const { service, interventions } = await setup();
    const result = await service.run({ ownerId: "owner-1", goalText: "Open YouTube and search something", constraints: { targetApplication: "YouTube" } });
    expect(result.stage).toBe("HUMAN_INTERVENTION");
    expect(result.run.state).toBe("HUMAN_INTERVENTION");
    expect(result.interventionRequest).toMatchObject({ type: "CLARIFICATION_REQUIRED", status: "OPEN" });
    expect(await interventions.requests.listByRun(result.run.id)).toHaveLength(1);
  });
});
