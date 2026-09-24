import { describe, expect, it } from "vitest";

import { deserializeStatus } from "../modules/nova-native/src/serialization";

const base = {
  moduleName: "NovaNative",
  moduleVersion: "1.0.0",
  protocolVersion: { major: 1, minor: 0 },
  platform: "android",
  nativeModuleInstalled: true,
  bridgeConnected: true,
  lifecycle: "ACTIVE",
};

function capability(reason: string) {
  return {
    name: "MEDIA_PROJECTION",
    available: false,
    installed: true,
    permissionGranted: false,
    serviceEnabled: false,
    reason,
  };
}

describe("Phase 8 native capability protocol", () => {
  it("accepts permission-gated capabilities without claiming availability", () => {
    const status = deserializeStatus({ ...base, capabilities: [capability("NEEDS_USER_PERMISSION")] });
    expect(status.capabilities[0]).toMatchObject({ available: false, reason: "NEEDS_USER_PERMISSION" });
  });

  it("accepts user-disabled service state", () => {
    const status = deserializeStatus({ ...base, capabilities: [capability("USER_DISABLED")] });
    expect(status.capabilities[0].reason).toBe("USER_DISABLED");
  });

  it("rejects unknown capability reasons", () => {
    expect(() => deserializeStatus({ ...base, capabilities: [capability("READY")] })).toThrow("INVALID_NATIVE_RESPONSE");
  });

  it("preserves the OCR capability as an installed native feature", () => {
    const status = deserializeStatus({
      ...base,
      capabilities: [{ name: "OCR", available: true, installed: true, permissionGranted: true, serviceEnabled: true, reason: "NONE" }],
    });
    expect(status.capabilities[0]).toMatchObject({ available: true, installed: true });
  });
});
