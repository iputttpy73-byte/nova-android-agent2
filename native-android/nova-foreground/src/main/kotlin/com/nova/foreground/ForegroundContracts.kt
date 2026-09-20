package com.nova.foreground

import com.nova.contracts.NativeResultEnvelope
import com.nova.contracts.RunId

interface ForegroundSessionPort {
  suspend fun getStatus(): ForegroundSessionStatus
  suspend fun start(request: ForegroundSessionRequest): NativeResultEnvelope<Unit>
  suspend fun stop(runId: RunId, reason: String): NativeResultEnvelope<Unit>
  suspend fun emergencyStop(runId: RunId): NativeResultEnvelope<Unit>
}

data class ForegroundSessionRequest(val runId: RunId, val title: String, val maximumDurationMs: Long)
data class ForegroundSessionStatus(val activeRunId: RunId?, val notificationVisible: Boolean, val behaviorImplemented: Boolean = false)
