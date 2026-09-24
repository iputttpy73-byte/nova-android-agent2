import type { NativeClientError } from "./types";

export function mapNativeError(error: unknown): NativeClientError {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("PROTOCOL_UNSUPPORTED")) {
    return { code: "PROTOCOL_UNSUPPORTED", message };
  }
  if (message.includes("INVALID_NATIVE_RESPONSE")) {
    return { code: "INVALID_NATIVE_RESPONSE", message };
  }
  if (message.includes("Cannot find native module")) {
    return { code: "MODULE_NOT_REGISTERED", message };
  }
  return { code: "NATIVE_LAYER_UNAVAILABLE", message };
}
