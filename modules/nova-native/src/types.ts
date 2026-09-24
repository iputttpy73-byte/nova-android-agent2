export type NativeLifecycle = "ACTIVE" | "UNAVAILABLE" | "DISCONNECTED";

export type NativeCapabilityName =
  | "ACCESSIBILITY_OBSERVATION"
  | "ACCESSIBILITY_INTERACTION"
  | "NOTIFICATION_OBSERVATION"
  | "MEDIA_PROJECTION"
  | "OCR"
  | "APP_LAUNCH"
  | "FOREGROUND_SESSION"
  | "DEFERRED_WORK"
  | "SPEECH_TO_TEXT"
  | "TEXT_TO_SPEECH"
  | "CAMERA"
  | "GALLERY"
  | "PHONE_CALL";

export type NativeErrorCode =
  | "NONE"
  | "NATIVE_LAYER_UNAVAILABLE"
  | "MODULE_NOT_REGISTERED"
  | "INVALID_NATIVE_RESPONSE"
  | "PROTOCOL_UNSUPPORTED"
  | "NOT_IMPLEMENTED";

export type ProtocolVersion = { major: number; minor: number };

export type NativeCapabilityStatus = {
  name: NativeCapabilityName;
  available: boolean;
  installed: boolean;
  permissionGranted: boolean;
  serviceEnabled: boolean;
  reason: "NONE" | "NEEDS_USER_PERMISSION" | "USER_DISABLED" | "NOT_IMPLEMENTED" | "BLOCKED_BY_PLATFORM";
};

export type NativeLayerStatus = {
  moduleName: "NovaNative";
  moduleVersion: string;
  protocolVersion: ProtocolVersion;
  platform: "android" | "unavailable";
  nativeModuleInstalled: boolean;
  bridgeConnected: boolean;
  capabilities: NativeCapabilityStatus[];
  lifecycle: NativeLifecycle;
};

export type NativeClientError = {
  code: NativeErrorCode;
  message: string;
};

export type NativeModuleApi = {
  getStatus(): Promise<unknown> | unknown;
  getCapabilities(): Promise<unknown> | unknown;
  openAccessibilitySettings(): Promise<void> | void;
  openNotificationListenerSettings(): Promise<void> | void;
  getAccessibilitySnapshot(): Promise<unknown> | unknown;
  tap(x: number, y: number): Promise<boolean> | boolean;
  inputText(nodeId: number, text: string): Promise<boolean> | boolean;
  launchApp(packageName: string): Promise<boolean> | boolean;
  composeWhatsApp(phone: string, message: string): Promise<boolean> | boolean;
  dial(phone: string): Promise<boolean> | boolean;
  setAlarm(hour: number, minutes: number, message: string): Promise<boolean> | boolean;
  openCamera(): Promise<boolean> | boolean;
  openGallery(): Promise<boolean> | boolean;
  speak(text: string): Promise<boolean> | boolean;
  recognizeText(pngBase64: string): Promise<unknown> | unknown;
  captureScreenshot(): Promise<string | null> | string | null;
};
