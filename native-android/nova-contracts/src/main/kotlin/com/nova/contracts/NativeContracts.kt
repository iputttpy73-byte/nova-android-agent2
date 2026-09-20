package com.nova.contracts

@JvmInline value class RequestId(val value: String)
@JvmInline value class RunId(val value: String)
@JvmInline value class OperationId(val value: String)
@JvmInline value class CapabilityId(val value: String)

data class ProtocolVersion(val major: Int, val minor: Int)

enum class NativeCapability {
  ACCESSIBILITY_OBSERVATION,
  ACCESSIBILITY_INTERACTION,
  NOTIFICATION_OBSERVATION,
  MEDIA_PROJECTION,
  OCR,
  APP_LAUNCH,
  FOREGROUND_SESSION,
  DEFERRED_WORK,
  SPEECH_TO_TEXT,
  TEXT_TO_SPEECH,
  CAMERA,
  GALLERY,
  PHONE_CALL
}

enum class NativeOperationStatus {
  ACCEPTED,
  COMPLETED,
  PARTIAL,
  FAILED,
  TIMEOUT,
  CANCELLED,
  PERMISSION_REQUIRED,
  USER_CANCELLED,
  UNSUPPORTED
}

enum class NativeErrorCode {
  NONE,
  NATIVE_LAYER_UNAVAILABLE,
  PROTOCOL_UNSUPPORTED,
  REQUEST_EXPIRED,
  DUPLICATE_REQUEST,
  CAPABILITY_NOT_GRANTED,
  ANDROID_PERMISSION_REQUIRED,
  SERVICE_DISABLED,
  USER_CONSENT_REQUIRED,
  POLICY_BLOCKED,
  NOT_IMPLEMENTED,
  DEVICE_STATE_UNKNOWN,
  OPERATION_FAILED
}

data class CapabilityStatus(val capability: NativeCapability, val installed: Boolean, val permissionGranted: Boolean, val serviceEnabled: Boolean, val available: Boolean, val reason: NativeErrorCode = NativeErrorCode.NONE)
data class NativeRequestEnvelope<T>(val protocolVersion: ProtocolVersion, val requestId: RequestId, val runId: RunId, val operationId: OperationId, val capability: NativeCapability, val issuedAtEpochMs: Long, val expiresAtEpochMs: Long, val idempotencyKey: String, val approvalToken: String?, val payload: T)
data class EvidenceReference(val source: String, val reference: String?, val confidence: Double?, val redactionState: String)
data class NativeResultEnvelope<T>(val protocolVersion: ProtocolVersion, val requestId: RequestId, val runId: RunId, val operationId: OperationId, val capability: NativeCapability, val status: NativeOperationStatus, val errorCode: NativeErrorCode = NativeErrorCode.NONE, val startedAtEpochMs: Long, val finishedAtEpochMs: Long?, val payload: T?, val evidence: List<EvidenceReference> = emptyList())
data class NativeLayerStatus(val protocolVersion: ProtocolVersion, val installed: Boolean, val connected: Boolean, val sessionId: String?, val capabilities: List<CapabilityStatus>)
