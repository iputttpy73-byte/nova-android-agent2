package com.nova.nativebridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder

class NovaProjectionService : Service() {
  override fun onCreate() {
    super.onCreate()
    val manager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel("nova_projection", "NOVA screen observation", NotificationManager.IMPORTANCE_LOW),
      )
    }
    val notification = Notification.Builder(this, "nova_projection")
      .setContentTitle("NOVA screen observation")
      .setContentText("Screen capture is active by user request")
      .setSmallIcon(android.R.drawable.ic_menu_view)
      .setOngoing(true)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(1001, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
    } else {
      startForeground(1001, notification)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_NOT_STICKY

  override fun onBind(intent: Intent?): IBinder? = null
}
