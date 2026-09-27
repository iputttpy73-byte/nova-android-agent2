package com.nova.nativebridge

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import android.speech.tts.TextToSpeech

internal enum class CapabilityReason {
  NONE,
  NEEDS_USER_PERMISSION,
  USER_DISABLED,
  NOT_IMPLEMENTED,
  BLOCKED_BY_PLATFORM,
}

internal data class CapabilityStatus(
  val name: String,
  val available: Boolean,
  val installed: Boolean,
  val permissionGranted: Boolean,
  val serviceEnabled: Boolean,
  val reason: CapabilityReason,
) {
  fun asMap(): Map<String, Any?> = mapOf(
    "name" to name,
    "available" to available,
    "installed" to installed,
    "permissionGranted" to permissionGranted,
    "serviceEnabled" to serviceEnabled,
    "reason" to reason.name,
  )
}

internal object NovaCapabilityInspector {
  fun inspect(context: Context): List<CapabilityStatus> = listOf(
    accessibility(context),
    notificationListener(context),
    mediaProjection(context),
    ocr(),
    appLaunch(context),
    capability("FOREGROUND_SESSION", false, false, false, false, CapabilityReason.NOT_IMPLEMENTED),
    capability("DEFERRED_WORK", false, false, false, false, CapabilityReason.NOT_IMPLEMENTED),
    capability("SPEECH_TO_TEXT", false, false, false, false, CapabilityReason.NOT_IMPLEMENTED),
    textToSpeech(context),
    intentCapability(context, "CAMERA", Intent("android.media.action.IMAGE_CAPTURE")),
    intentCapability(context, "GALLERY", Intent(Intent.ACTION_PICK).apply { type = "image/*" }),
    intentCapability(context, "PHONE_CALL", Intent(Intent.ACTION_DIAL)),
  )

  private fun accessibility(context: Context): CapabilityStatus {
    val installed = context.packageManager.resolveService(
      Intent("android.accessibilityservice.AccessibilityService"),
      PackageManager.GET_SERVICES,
    ) != null
    val enabled = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    )?.contains(context.packageName) == true
    return capability(
      "ACCESSIBILITY_OBSERVATION",
      enabled,
      installed,
      enabled,
      enabled,
      if (!installed) CapabilityReason.NOT_IMPLEMENTED
      else if (!enabled) CapabilityReason.USER_DISABLED else CapabilityReason.NONE,
    )
  }

  private fun notificationListener(context: Context): CapabilityStatus {
    val installed = context.packageManager.resolveService(
      Intent("android.service.notification.NotificationListenerService"),
      PackageManager.GET_SERVICES,
    ) != null
    val enabled = Settings.Secure.getString(
      context.contentResolver,
      "enabled_notification_listeners",
    )?.contains(context.packageName) == true
    return capability(
      "NOTIFICATION_OBSERVATION",
      enabled,
      installed,
      enabled,
      enabled,
      if (!installed) CapabilityReason.NOT_IMPLEMENTED
      else if (!enabled) CapabilityReason.USER_DISABLED else CapabilityReason.NONE,
    )
  }

  private fun mediaProjection(context: Context): CapabilityStatus = capability(
    "MEDIA_PROJECTION",
    false,
    true,
    false,
    false,
    CapabilityReason.NEEDS_USER_PERMISSION,
  )

  private fun ocr(): CapabilityStatus {
    val installed = NovaOcrAdapter.isAvailable()
    return capability(
      "OCR",
      installed,
      installed,
      true,
      installed,
      if (installed) CapabilityReason.NONE else CapabilityReason.BLOCKED_BY_PLATFORM,
    )
  }

  private fun textToSpeech(context: Context): CapabilityStatus {
    val installed = context.packageManager.queryIntentServices(
      Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE),
      0,
    ).isNotEmpty()
    return capability(
      "TEXT_TO_SPEECH",
      installed,
      installed,
      true,
      installed,
      if (installed) CapabilityReason.NONE else CapabilityReason.NOT_IMPLEMENTED,
    )
  }

  private fun intentCapability(context: Context, name: String, intent: Intent): CapabilityStatus {
    val installed = intent.resolveActivity(context.packageManager) != null
    return capability(
      name,
      installed,
      installed,
      true,
      installed,
      if (installed) CapabilityReason.NONE else CapabilityReason.NOT_IMPLEMENTED,
    )
  }

  private fun appLaunch(context: Context): CapabilityStatus = capability(
    "APP_LAUNCH",
    true,
    true,
    true,
    true,
    CapabilityReason.NONE,
  )

  private fun capability(
    name: String,
    available: Boolean,
    installed: Boolean,
    permissionGranted: Boolean,
    serviceEnabled: Boolean,
    reason: CapabilityReason,
  ) = CapabilityStatus(name, available, installed, permissionGranted, serviceEnabled, reason)
}
