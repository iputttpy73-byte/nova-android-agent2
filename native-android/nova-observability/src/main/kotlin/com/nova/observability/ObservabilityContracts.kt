package com.nova.observability

import com.nova.contracts.RunId

interface NativeAuditPort {
  suspend fun append(event: NativeAuditEvent)
}

data class NativeAuditEvent(
  val runId: RunId,
  val operationId: String,
  val capability: String,
  val status: String,
  val errorCode: String?,
  val redactionState: String,
  val createdAtEpochMs: Long
)

interface NativeHealthPort {
  suspend fun snapshot(): NativeHealthSnapshot
}

data class NativeHealthSnapshot(val protocolVersion: String, val serviceStates: Map<String, String>, val lastErrorCode: String?)
