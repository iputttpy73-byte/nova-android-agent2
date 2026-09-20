package com.nova.ipc

import com.nova.contracts.NativeRequestEnvelope
import com.nova.contracts.NativeResultEnvelope
import com.nova.contracts.RunId

interface NativeServiceConnection<TRequest : Any, TResult : Any> {
  suspend fun bind(runId: RunId): ServiceBindingState
  suspend fun unbind(runId: RunId)
  suspend fun request(request: NativeRequestEnvelope<TRequest>): NativeResultEnvelope<TResult>
}

enum class ServiceBindingState { UNBOUND, BINDING, BOUND, DISCONNECTED, FAILED }

interface NativeEventStore {
  suspend fun append(event: NativeIpcEvent)
  suspend fun replay(runId: RunId, afterSequence: Long): List<NativeIpcEvent>
}

data class NativeIpcEvent(
  val runId: RunId,
  val sequence: Long,
  val eventType: String,
  val payloadReference: String?,
  val createdAtEpochMs: Long
)

interface IpcRequestValidator {
  fun validate(request: NativeRequestEnvelope<Any>, nowEpochMs: Long): IpcValidationResult
}

sealed interface IpcValidationResult {
  data object Accepted : IpcValidationResult
  data class Rejected(val reason: String) : IpcValidationResult
}
