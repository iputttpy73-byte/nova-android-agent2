import type { ActorContext, AgentCore } from "../../shared/agent/contracts";
import type { AgentRunId } from "../../shared/agent/domain";
import type { InterventionStatus } from "../../shared/agent/events";

export function createAgentRetrievalApi(core: AgentCore) {
  return {
    async events(runId: AgentRunId, actor: ActorContext) {
      return core.listEvents(runId, actor);
    },
    async audit(runId: AgentRunId, actor: ActorContext) {
      return core.listAudit(runId, actor);
    },
    async interventions(runId: AgentRunId, actor: ActorContext, status?: InterventionStatus) {
      return core.listInterventions(runId, actor, status);
    },
  };
}
