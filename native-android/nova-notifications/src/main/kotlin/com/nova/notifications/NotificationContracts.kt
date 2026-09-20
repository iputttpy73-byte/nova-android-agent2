package com.nova.notifications

import com.nova.contracts.NativeRequestEnvelope
import com.nova.contracts.NativeResultEnvelope

interface NotificationListenerPort {
  suspend fun getStatus(): NotificationListenerStatus
  suspend fun query(request: NativeRequestEnvelope<NotificationQuery>): NativeResultEnvelope<NotificationQueryResult>
}

data class NotificationListenerStatus(
  val installed: Boolean,
  val accessEnabledByUser: Boolean,
  val bound: Boolean,
  val behaviorImplemented: Boolean = false
)

data class NotificationQuery(val packageAllowlist: List<String>, val maxAgeMs: Long)
data class NotificationQueryResult(val eventReferences: List<String>, val redactionState: String)
