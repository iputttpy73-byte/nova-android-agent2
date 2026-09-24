import { describe, expect, it } from "vitest";

import {
  deserializeProtocolValue,
  deserializeStatus,
  serializeProtocolValue,
} from "../modules/nova-native/src/serialization";
import { mapNativeError } from "../modules/nova-native/src/errors";

const validStatus = {
  moduleName: "NovaNative",
  moduleVersion: "1.0.0",
  protocolVersion: { major: 1, minor: 0 },
  platform: "android",
  nativeModuleInstalled: true,
  bridgeConnected: true,
  lifecycle: "ACTIVE",
  capabilities: [
    {
      name: "ACCESSIBILITY_OBSERVATION",
      available: false,
      installed: false,
      permissionGranted: false,
      serviceEnabled: false,
      reason: "NOT_IMPLEMENTED",
    },
  ],
};

describe("NovaNative protocol", () => {
  it("round-trips JSON-compatible protocol values", () => {
    const encoded = serializeProtocolValue({ protocol: 1, state: "ACTIVE" });
    expect(deserializeProtocolValue(encoded)).toEqual({ protocol: 1, state: "ACTIVE" });
  });

  it("accepts the truthful status contract", () => {
    expect(deserializeStatus(validStatus)).toMatchObject({
      moduleName: "NovaNative",
      nativeModuleInstalled: true,
      bridgeConnected: true,
      lifecycle: "ACTIVE",
    });
  });

  it("rejects incompatible protocol versions", () => {
    expect(() => deserializeStatus({ ...validStatus, protocolVersion: { major: 2, minor: 0 } })).toThrow(
      "PROTOCOL_UNSUPPORTED",
    );
  });

  it("rejects malformed capability responses", () => {
    expect(() =>
      deserializeStatus({
        ...validStatus,
        capabilities: [{ ...validStatus.capabilities[0], available: "yes" }],
      }),
    ).toThrow("INVALID_NATIVE_RESPONSE");
  });
});

describe("NovaNative error mapping", () => {
  it("maps missing modules to a stable error code", () => {
    expect(mapNativeError(new Error("Cannot find native module 'NovaNative'"))).toEqual({
      code: "MODULE_NOT_REGISTERED",
      message: "Cannot find native module 'NovaNative'",
    });
  });
});
