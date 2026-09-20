package com.nova.projection

import com.nova.contracts.NativeRequestEnvelope
import com.nova.contracts.NativeResultEnvelope

interface MediaProjectionPort {
  suspend fun getStatus(): MediaProjectionStatus
  suspend fun requestConsent(): NativeResultEnvelope<ProjectionConsentRequest>
  suspend fun start(request: NativeRequestEnvelope<StartProjectionRequest>): NativeResultEnvelope<ProjectionSession>
  suspend fun capture(request: NativeRequestEnvelope<CaptureFrameRequest>): NativeResultEnvelope<FrameReference>
  suspend fun stop(request: NativeRequestEnvelope<StopProjectionRequest>): NativeResultEnvelope<Unit>
}

data class MediaProjectionStatus(
  val installed: Boolean,
  val consentAvailable: Boolean,
  val active: Boolean,
  val behaviorImplemented: Boolean = false
)

data class ProjectionConsentRequest(val requiresUserAction: Boolean)
data class StartProjectionRequest(val width: Int, val height: Int, val maxFrames: Int)
data class ProjectionSession(val sessionReference: String?, val startedAtEpochMs: Long)
data class CaptureFrameRequest(val sessionReference: String, val frameIndex: Int)
data class FrameReference(val reference: String?, val expiresAtEpochMs: Long, val redactionState: String)
data class StopProjectionRequest(val sessionReference: String)
