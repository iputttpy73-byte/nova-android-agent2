package com.nova.accessibility

import com.nova.contracts.NativeRequestEnvelope
import com.nova.contracts.NativeResultEnvelope
import com.nova.environment.InteractionRequest
import com.nova.environment.InteractionResult
import com.nova.environment.ObservationRequest
import com.nova.environment.ObservationResult

interface AccessibilityServicePort {
  suspend fun getStatus(): AccessibilityStatus
  suspend fun observe(request: NativeRequestEnvelope<ObservationRequest>): NativeResultEnvelope<ObservationResult>
  suspend fun performAction(request: NativeRequestEnvelope<InteractionRequest>): NativeResultEnvelope<InteractionResult>
}

data class AccessibilityStatus(
  val installed: Boolean,
  val enabledByUser: Boolean,
  val bound: Boolean,
  val behaviorImplemented: Boolean = false
)

interface AccessibilityNodeSource {
  suspend fun snapshot(): AccessibilitySnapshot
}

data class AccessibilitySnapshot(
  val packageName: String?,
  val nodeReference: String?,
  val capturedAtEpochMs: Long,
  val redactionState: String
)
