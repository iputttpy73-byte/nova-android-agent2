export {
  captureScreenshot,
  composeWhatsApp,
  dial,
  getAccessibilitySnapshot,
  getCapabilities,
  getStatus,
  inputText,
  launchApp,
  nativeClient,
  nativeClientErrors,
  openAccessibilitySettings,
  openCamera,
  openGallery,
  openNotificationListenerSettings,
  recognizeText,
  setAlarm,
  speak,
  tap,
} from "./src/client";
export { mapNativeError } from "./src/errors";
export { deserializeStatus, serializeProtocolValue, deserializeProtocolValue, SUPPORTED_PROTOCOL } from "./src/serialization";
export type {
  NativeCapabilityName,
  NativeCapabilityStatus,
  NativeClientError,
  NativeErrorCode,
  NativeLayerStatus,
  NativeLifecycle,
  NativeModuleApi,
  ProtocolVersion,
} from "./src/types";
