import type { NativeCapabilityStatus, NativeLayerStatus, NativeModuleApi, ProtocolVersion } from "./types";

export const SUPPORTED_PROTOCOL: ProtocolVersion = { major: 1, minor: 0 };
const CAPABILITY_NAMES = new Set<NativeCapabilityStatus["name"]>([
  "ACCESSIBILITY_OBSERVATION", "ACCESSIBILITY_INTERACTION", "NOTIFICATION_OBSERVATION", "MEDIA_PROJECTION", "OCR",
  "APP_LAUNCH", "FOREGROUND_SESSION", "DEFERRED_WORK", "SPEECH_TO_TEXT", "TEXT_TO_SPEECH", "CAMERA", "GALLERY", "PHONE_CALL",
]);
const CAPABILITY_REASONS = new Set<NativeCapabilityStatus["reason"]>([
  "NONE", "NEEDS_USER_PERMISSION", "USER_DISABLED", "NOT_IMPLEMENTED", "BLOCKED_BY_PLATFORM",
]);

export function serializeProtocolValue(value: unknown): string { return JSON.stringify(value); }
export function deserializeProtocolValue<T>(value: string): T { return JSON.parse(value) as T; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isProtocolVersion(value: unknown): value is ProtocolVersion {
  return isRecord(value) && typeof value.major === "number" && typeof value.minor === "number" && value.major === SUPPORTED_PROTOCOL.major;
}
function parseCapability(value: unknown): NativeCapabilityStatus | null {
  if (!isRecord(value) || typeof value.name !== "string" || !CAPABILITY_NAMES.has(value.name as NativeCapabilityStatus["name"])) return null;
  const reason = value.reason;
  if (typeof value.available !== "boolean" || typeof value.installed !== "boolean" || typeof value.permissionGranted !== "boolean" || typeof value.serviceEnabled !== "boolean" || typeof reason !== "string" || !CAPABILITY_REASONS.has(reason as NativeCapabilityStatus["reason"])) return null;
  return { name: value.name as NativeCapabilityStatus["name"], available: value.available, installed: value.installed, permissionGranted: value.permissionGranted, serviceEnabled: value.serviceEnabled, reason: reason as NativeCapabilityStatus["reason"] };
}
export function deserializeStatus(value: unknown): NativeLayerStatus {
  if (!isRecord(value) || value.moduleName !== "NovaNative" || typeof value.moduleVersion !== "string") throw new Error("INVALID_NATIVE_RESPONSE");
  if (!isProtocolVersion(value.protocolVersion)) throw new Error("PROTOCOL_UNSUPPORTED");
  if (typeof value.nativeModuleInstalled !== "boolean" || typeof value.bridgeConnected !== "boolean" || !Array.isArray(value.capabilities) || (value.lifecycle !== "ACTIVE" && value.lifecycle !== "UNAVAILABLE" && value.lifecycle !== "DISCONNECTED")) throw new Error("INVALID_NATIVE_RESPONSE");
  const capabilities = value.capabilities.map(parseCapability);
  if (capabilities.some((capability) => capability === null)) throw new Error("INVALID_NATIVE_RESPONSE");
  return { moduleName: "NovaNative", moduleVersion: value.moduleVersion, protocolVersion: value.protocolVersion, platform: value.platform === "android" ? "android" : "unavailable", nativeModuleInstalled: value.nativeModuleInstalled, bridgeConnected: value.bridgeConnected, capabilities: capabilities as NativeCapabilityStatus[], lifecycle: value.lifecycle };
}
export async function callNative<T>(api: NativeModuleApi, method: keyof NativeModuleApi, ...args: unknown[]): Promise<T> {
  const response = await (api[method] as (...values: unknown[]) => Promise<unknown> | unknown)(...args);
  return response as T;
}
