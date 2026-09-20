package com.nova.security

import com.nova.contracts.NativeCapability
import com.nova.contracts.RunId

interface CapabilityPolicy {
  fun evaluate(request: CapabilityRequest): PolicyDecision
  fun revoke(runId: RunId)
}

data class CapabilityRequest(
  val runId: RunId,
  val capability: NativeCapability,
  val packageName: String?,
  val operationType: String,
  val requiresApproval: Boolean,
  val approvalToken: String?
)

sealed interface PolicyDecision {
  data object Allowed : PolicyDecision
  data class Denied(val reason: String) : PolicyDecision
  data class ApprovalRequired(val reason: String) : PolicyDecision
}

interface NativeEmergencyStop {
  suspend fun stop(runId: RunId): StopResult
  fun isStopped(runId: RunId): Boolean
}

data class StopResult(val runId: RunId, val completed: Boolean, val reason: String)

interface NativeRedactionPolicy {
  fun redact(source: String, payload: Any): RedactedPayload
}

data class RedactedPayload(val value: Any?, val redactionState: String, val expiresAtEpochMs: Long?)
