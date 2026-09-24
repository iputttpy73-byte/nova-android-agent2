import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

import { callNative, deserializeStatus } from "./serialization";
import { mapNativeError } from "./errors";
import type { NativeCapabilityStatus, NativeLayerStatus, NativeModuleApi } from "./types";

const MODULE_NAME = "NovaNative";

function unavailableStatus(): NativeLayerStatus {
  return {
    moduleName: "NovaNative",
    moduleVersion: "unavailable",
    protocolVersion: { major: 1, minor: 0 },
    platform: "unavailable",
    nativeModuleInstalled: false,
    bridgeConnected: false,
    capabilities: [],
    lifecycle: "UNAVAILABLE",
  };
}

function getApi(): NativeModuleApi | null {
  if (Platform.OS !== "android") return null;
  return requireOptionalNativeModule<NativeModuleApi>(MODULE_NAME);
}

async function callAction<T>(action: (api: NativeModuleApi) => Promise<T> | T, fallback: T): Promise<T> {
  const api = getApi();
  if (!api) return fallback;
  try {
    return await action(api);
  } catch {
    return fallback;
  }
}

export async function getStatus(): Promise<NativeLayerStatus> {
  const api = getApi();
  if (!api) return unavailableStatus();
  try {
    const raw = await callNative<unknown>(api, "getStatus");
    return deserializeStatus(raw);
  } catch (error) {
    const mapped = mapNativeError(error);
    return { ...unavailableStatus(), lifecycle: mapped.code === "MODULE_NOT_REGISTERED" ? "UNAVAILABLE" : "DISCONNECTED" };
  }
}

export async function getCapabilities(): Promise<NativeCapabilityStatus[]> {
  return (await getStatus()).capabilities;
}

export const openAccessibilitySettings = () => callAction((api) => api.openAccessibilitySettings(), undefined);
export const openNotificationListenerSettings = () => callAction((api) => api.openNotificationListenerSettings(), undefined);
export const getAccessibilitySnapshot = () => callAction((api) => api.getAccessibilitySnapshot(), null);
export const tap = (x: number, y: number) => callAction((api) => api.tap(x, y), false);
export const inputText = (nodeId: number, text: string) => callAction((api) => api.inputText(nodeId, text), false);
export const launchApp = (packageName: string) => callAction((api) => api.launchApp(packageName), false);
export const composeWhatsApp = (phone: string, message: string) => callAction((api) => api.composeWhatsApp(phone, message), false);
export const dial = (phone: string) => callAction((api) => api.dial(phone), false);
export const setAlarm = (hour: number, minutes: number, message: string) => callAction((api) => api.setAlarm(hour, minutes, message), false);
export const openCamera = () => callAction((api) => api.openCamera(), false);
export const openGallery = () => callAction((api) => api.openGallery(), false);
export const speak = (text: string) => callAction((api) => api.speak(text), false);
export const recognizeText = (pngBase64: string) => callAction((api) => api.recognizeText(pngBase64), null);
export const captureScreenshot = () => callAction((api) => api.captureScreenshot(), null);

export const nativeClientErrors = { mapNativeError };
export const nativeClient = {
  getStatus,
  getCapabilities,
  openAccessibilitySettings,
  openNotificationListenerSettings,
  getAccessibilitySnapshot,
  tap,
  inputText,
  launchApp,
  composeWhatsApp,
  dial,
  setAlarm,
  openCamera,
  openGallery,
  speak,
  recognizeText,
  captureScreenshot,
};
