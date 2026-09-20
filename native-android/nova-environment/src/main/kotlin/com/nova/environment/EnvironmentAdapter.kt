package com.nova.environment

import com.nova.contracts.CapabilityStatus
import com.nova.contracts.NativeRequestEnvelope
import com.nova.contracts.NativeResultEnvelope
import com.nova.contracts.RunId

interface EnvironmentAdapter {
  suspend fun getStatus(): EnvironmentStatus
  suspend fun observe(request: NativeRequestEnvelope<ObservationRequest>): NativeResultEnvelope<ObservationResult>
  suspend fun launchApp(request: NativeRequestEnvelope<LaunchAppRequest>): NativeResultEnvelope<LaunchAppResult>
  suspend fun performAction(request: NativeRequestEnvelope<InteractionRequest>): NativeResultEnvelope<InteractionResult>
  suspend fun verify(request: NativeRequestEnvelope<VerificationRequest>): NativeResultEnvelope<VerificationResult>
  suspend fun stopSession(runId: RunId): NativeResultEnvelope<Unit>
}

data class EnvironmentStatus(
  val connected: Boolean,
  val capabilities: List<CapabilityStatus>,
  val packageInForeground: String?
)

data class ObservationRequest(val sources: List<String>, val maxAgeMs: Long)
data class ObservationResult(val observationReference: String?, val confidence: Double?, val redactionState: String)
data class LaunchAppRequest(val packageName: String, val deepLink: String?)
data class LaunchAppResult(val packageName: String, val launched: Boolean)
data class InteractionRequest(val actionType: String, val targetReference: String, val arguments: Map<String, String>)
data class InteractionResult(val actionAccepted: Boolean, val evidenceReference: String?)
data class VerificationRequest(val expectedSignals: List<String>, val minimumConfidence: Double)
data class VerificationResult(val verified: Boolean, val confidence: Double, val evidenceReference: String?)
