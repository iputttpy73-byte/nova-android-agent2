package com.nova.nativebridge

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Native integration boundary for Phase 8.
 *
 * Privileged services remain user-mediated and are only active after Android
 * grants or binds them.
 */
class NovaNativeModule : Module() {
  private val environment by lazy { NovaEnvironmentAdapter(requireNotNull(appContext.reactContext)) }
  private val speech by lazy { NovaSpeechAdapter(requireNotNull(appContext.reactContext)) }
  private val ocr by lazy { NovaOcrAdapter() }

  override fun definition() = ModuleDefinition {
    Name("NovaNative")

    Function("getStatus") {
      buildStatus()
    }

    Function("getCapabilities") {
      buildCapabilities()
    }

    Function("openAccessibilitySettings") {
      environment.openAccessibilitySettings()
    }

    Function("openNotificationListenerSettings") {
      environment.openNotificationListenerSettings()
    }

    Function("getAccessibilitySnapshot") {
      NovaAccessibilityService.instance?.snapshotRoot()
    }

    Function("tap") { x: Double, y: Double ->
      NovaAccessibilityService.instance?.performTap(x.toFloat(), y.toFloat()) == true
    }

    Function("inputText") { nodeId: Double, text: String ->
      NovaAccessibilityService.instance?.inputText(nodeId.toLong(), text) == true
    }

    AsyncFunction("captureScreenshot") Coroutine { ->
      NovaAccessibilityService.instance?.captureScreenshotBase64()
    }

    Function("launchApp") { packageName: String ->
      environment.launchApp(packageName)
    }

    Function("composeWhatsApp") { phone: String, message: String ->
      environment.composeWhatsApp(phone, message)
    }

    Function("dial") { phone: String ->
      environment.dial(phone)
    }

    Function("setAlarm") { hour: Int, minutes: Int, message: String ->
      environment.setAlarm(hour, minutes, message)
    }

    Function("openCamera") {
      environment.openCamera()
    }

    Function("openGallery") {
      environment.openGallery()
    }

    Function("speak") { text: String ->
      speech.speak(text)
    }

    AsyncFunction("recognizeText") Coroutine { pngBase64: String ->
      ocr.recognizePngBase64(pngBase64)
    }
  }

  private fun buildStatus(): Map<String, Any?> = mapOf(
    "moduleName" to "NovaNative",
    "moduleVersion" to "1.0.0",
    "protocolVersion" to mapOf("major" to 1, "minor" to 0),
    "platform" to "android",
    "nativeModuleInstalled" to true,
    "bridgeConnected" to true,
    "capabilities" to buildCapabilities(),
    "lifecycle" to "ACTIVE",
  )

  private fun buildCapabilities(): List<Map<String, Any?>> =
    NovaCapabilityInspector.inspect(requireNotNull(appContext.reactContext)).map { it.asMap() }
}
