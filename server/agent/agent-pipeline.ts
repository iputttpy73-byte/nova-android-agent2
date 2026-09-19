import type { AgentCore, ActorContext, IntentParser, Planner } from "../../shared/agent/contracts";
import type { AgentRun } from "../../shared/agent/domain";

export class AgentPipeline {
  constructor(private readonly core: AgentCore, private readonly parser: IntentParser, private readonly planner: Planner) {}

  async processSubmittedRun(runId: AgentRun["id"], actor: ActorContext): Promise<AgentRun> {
    let run = await this.core.getRun(runId, actor);
    if (run.state === "DRAFT") run = await this.core.submit(run.id, actor);
    if (run.state === "SUBMITTED") run = await this.core.beginIntentParsing(run.id);
    if (run.state === "INTENT_PARSING") {
      const intent = await this.parser.parse({ goal: run.goal, previousIntent: run.intent });
      run = await this.core.attachIntent(run.id, intent);
    }
    if (run.state === "PLAN_PENDING" && run.intent) {
      const plan = await this.planner.createPlan({ run, intent: run.intent, previousPlan: run.plan });
      run = await this.core.attachPlan(run.id, plan);
    }
    return run;
  }
}
