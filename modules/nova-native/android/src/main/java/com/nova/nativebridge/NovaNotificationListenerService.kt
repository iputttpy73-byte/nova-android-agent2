package com.nova.nativebridge

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class NovaNotificationListenerService : NotificationListenerService() {
  companion object {
    @Volatile var connected: Boolean = false
      private set
  }

  override fun onListenerConnected() {
    connected = true
  }

  override fun onListenerDisconnected() {
    connected = false
    super.onListenerDisconnected()
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    // Content is not forwarded or persisted until an explicit user-approved policy exists.
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    // Intentionally no-op in the foundation implementation.
  }
}
