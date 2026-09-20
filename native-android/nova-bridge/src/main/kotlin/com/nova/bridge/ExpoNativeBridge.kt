package com.nova.bridge

import com.nova.contracts.CapabilityStatus
import com.nova.contracts.NativeLayerStatus
import com.nova.contracts.NativeRequestEnvelope
import com.nova.contracts.NativeResultEnvelope
import com.nova.contracts.NativeCapability
import com.nova.contracts.RunId

interface ExpoNativeBridge {
  suspend fun getLayerStatus(): NativeLayerStatus
  suspend fun getCapabilityStatus(capability: NativeCapability): CapabilityStatus
  suspend fun requestCapabilityAccess(capability: NativeCapability): NativeResultEnvelope<Unit>
  suspend fun startSession(runId: RunId): NativeResultEnvelope<Unit>
  suspend fun stopSession(runId: RunId): NativeResultEnvelope<Unit>
  suspend fun submit(request: NativeRequestEnvelope<Any>): NativeResultEnvelope<Any>
  suspend fun emergencyStop(runId: RunId): NativeResultEnvelope<Unit>
  fun observeEvents(listener: NativeBridgeEventListener): CloseableSubscription
}

interface NativeBridgeEventListener {
  fun onEvent(event: NativeBridgeEvent)
}

sealed interface NativeBridgeEvent {
  data class StatusChanged(val status: NativeLayerStatus) : NativeBridgeEvent
  data class OperationProgress(val result: NativeResultEnvelope<Any>) : NativeBridgeEvent
  data class CapabilityChanged(val status: CapabilityStatus) : NativeBridgeEvent
  data class EmergencyStopCompleted(val runId: RunId) : NativeBridgeEvent
}

fun interface CloseableSubscription { fun close() }
