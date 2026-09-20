import { describe, expect, it } from "vitest";
import { InMemoryAccessibilityRepositories } from "../server/accessibility/repositories";
import { validateAccessibilityAction, validateAccessibilityCapability, validateAccessibilityNode } from "../server/accessibility/validation";
import { ACCESSIBILITY_ACTIONS, ACCESSIBILITY_CAPABILITIES, ACCESSIBILITY_CAPABILITY_DEFAULTS } from "../shared/accessibility/policy";
import type { AccessibilityAction, AccessibilityNode } from "../shared/accessibility/domain";

const now = new Date().toISOString();

describe("Accessibility Architecture contracts", () => {
  it("supports all required actions and capabilities", () => {
    expect(ACCESSIBILITY_ACTIONS).toEqual(["TAP", "LONG_PRESS", "SCROLL", "SWIPE", "INPUT_TEXT", "BACK", "HOME", "APP_SWITCH"]);
    expect(ACCESSIBILITY_CAPABILITIES).toEqual(["OBSERVE_UI", "READ_HIERARCHY", "FIND_NODE", "PERFORM_ACTION"]);
  });

  it("requires every action to remain explicitly non-executable in Phase 1", () => {
    const action: AccessibilityAction = { id: "action-1", ownerId: "owner-1", runId: "run-1", action: "TAP", status: "REQUESTED", reason: "requested for architecture test", createdAt: now };
    expect(() => validateAccessibilityAction(action)).toThrow("not executable");
  });

  it("validates node bounds and rejects invalid geometry", () => {
    const node: AccessibilityNode = { id: "node-1", ownerId: "owner-1", runId: "run-1", nodeId: "native-node-1", bounds: { left: 100, top: 20, right: 10, bottom: 30 }, clickable: true, enabled: true, childNodeIds: [], redactionState: "MINIMIZED", createdAt: now };
    expect(() => validateAccessibilityNode(node)).toThrow("bounds");
  });
});

describe("Accessibility repository and audit integration", () => {
  it("records an event and linked node with audit entries", async () => {
    const repository = new InMemoryAccessibilityRepositories();
    const event = await repository.recordEvent({ ownerId: "owner-1", runId: "run-1", eventType: "WINDOW_STATE_CHANGED", packageName: "future.package", redactionState: "MINIMIZED", capturedAt: now });
    const node = await repository.recordNode({ ownerId: "owner-1", runId: "run-1", eventId: event.id, nodeId: "native-node-1", className: "Button", text: "Future", clickable: true, enabled: true, childNodeIds: [], redactionState: "MINIMIZED" });
    expect((await repository.events.listByRun("run-1"))).toHaveLength(1);
    expect((await repository.nodes.listByNodeId("run-1", "native-node-1"))).toMatchObject([{ id: node.id, eventId: event.id }]);
    expect((await repository.listByRun("run-1")).map((entry) => entry.action)).toEqual(["EVENT_RECORDED", "NODE_RECORDED"]);
  });

  it("stores every supported action as NOT_IMPLEMENTED and denies execution", async () => {
    const repository = new InMemoryAccessibilityRepositories();
    for (const action of ACCESSIBILITY_ACTIONS) {
      const result = await repository.requestAction({ ownerId: "owner-1", runId: "run-1", nodeId: "native-node-1", action, reason: "architecture-only request" });
      expect(result.action).toBe(action);
      expect(result.status).toBe("NOT_IMPLEMENTED");
    }
    expect(await repository.actions.listByRun("run-1")).toHaveLength(ACCESSIBILITY_ACTIONS.length);
    expect((await repository.listByRun("run-1")).filter((entry) => entry.action === "ACTION_DENIED")).toHaveLength(ACCESSIBILITY_ACTIONS.length);
  });

  it("records all capabilities as NOT_IMPLEMENTED without claiming availability", async () => {
    const repository = new InMemoryAccessibilityRepositories();
    for (const capability of ACCESSIBILITY_CAPABILITIES) {
      const result = await repository.setCapability({ id: `cap-${capability}`, ownerId: "owner-1", capability, ...ACCESSIBILITY_CAPABILITY_DEFAULTS[capability], checkedAt: now });
      expect(result.status).toBe("NOT_IMPLEMENTED");
    }
    expect(await repository.capabilities.listByOwner("owner-1")).toHaveLength(ACCESSIBILITY_CAPABILITIES.length);
    expect((await repository.listByRun("run-1"))).toHaveLength(0);
  });

  it("rejects an AVAILABLE capability claim", () => {
    expect(() => validateAccessibilityCapability({ id: "cap", ownerId: "owner-1", capability: "OBSERVE_UI", status: "AVAILABLE", reason: "claimed", checkedAt: now })).toThrow("cannot be claimed");
  });
});
