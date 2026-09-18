import { describe, expect, it } from "vitest";

import { AGENT_SHELL_TABS, PHASE_ONE_BOUNDARIES } from "../shared/agent-shell";

describe("Phase 1 agent shell contract", () => {
  it("exposes the five required navigation destinations", () => {
    expect(AGENT_SHELL_TABS).toEqual(["Home", "Chat", "Tasks", "Logs", "Settings"]);
  });

  it("keeps advanced agent capabilities outside the shell phase", () => {
    expect(PHASE_ONE_BOUNDARIES).toEqual({
      ai: false,
      androidAutomation: false,
      memory: false,
      environmentAdapter: false,
    });
  });
});
