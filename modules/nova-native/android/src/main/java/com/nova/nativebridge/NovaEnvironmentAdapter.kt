package com.nova.nativebridge

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.AlarmClock
import android.provider.Settings

class NovaEnvironmentAdapter(private val context: Context) {
  fun launchApp(packageName: String): Boolean {
    require(packageName.matches(Regex("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)+"))) { "Invalid package name" }
    val intent = context.packageManager.getLaunchIntentForPackage(packageName) ?: return false
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
    return true
  }

  fun openAccessibilitySettings() {
    context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  fun openNotificationListenerSettings() {
    context.startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  fun composeWhatsApp(phone: String, message: String): Boolean {
    val uri = Uri.parse("https://wa.me/${phone.filter(Char::isDigit)}?text=${Uri.encode(message)}")
    val intent = Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
    return true
  }

  fun dial(phone: String): Boolean {
    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${Uri.encode(phone)}"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
    return true
  }

  fun setAlarm(hour: Int, minutes: Int, message: String): Boolean {
    require(hour in 0..23 && minutes in 0..59) { "Invalid alarm time" }
    val intent = Intent(AlarmClock.ACTION_SET_ALARM)
      .putExtra(AlarmClock.EXTRA_HOUR, hour)
      .putExtra(AlarmClock.EXTRA_MINUTES, minutes)
      .putExtra(AlarmClock.EXTRA_MESSAGE, message)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
    return true
  }

  fun openCamera(): Boolean = startActivity(Intent("android.media.action.IMAGE_CAPTURE"))

  fun openGallery(): Boolean = startActivity(Intent(Intent.ACTION_PICK).apply {
    type = "image/*"
  })

  private fun startActivity(intent: Intent): Boolean {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
    return true
  }
}
