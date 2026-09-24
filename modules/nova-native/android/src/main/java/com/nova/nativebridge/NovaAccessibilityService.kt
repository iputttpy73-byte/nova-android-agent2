package com.nova.nativebridge

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Bitmap
import android.graphics.Path
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.view.Display
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * User-enabled service. It observes only after Android explicitly binds it.
 * Actions are limited to explicit bridge requests and are not triggered by
 * notifications or arbitrary background heuristics.
 */
class NovaAccessibilityService : AccessibilityService() {
  companion object {
    @Volatile var instance: NovaAccessibilityService? = null
      private set
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    // Observation transport is added through the bridge; no data is persisted here yet.
  }

  override fun onInterrupt() {
    instance = null
  }

  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }

  fun snapshotRoot(): Map<String, Any?>? = rootInActiveWindow?.let { serializeNode(it, 0) }

  fun performTap(x: Float, y: Float): Boolean {
    val path = Path().apply { moveTo(x, y) }
    return dispatchGesture(
      GestureDescription.Builder()
        .addStroke(GestureDescription.StrokeDescription(path, 0, 80))
        .build(),
      null,
      null,
    )
  }

  fun inputText(nodeId: Long, text: String): Boolean {
    val node = findNodeById(rootInActiveWindow, nodeId) ?: return false
    val args = Bundle().apply {
      putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
    }
    return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
  }

  suspend fun captureScreenshotBase64(): String? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null
    return suspendCancellableCoroutine { continuation ->
      takeScreenshot(Display.DEFAULT_DISPLAY, Executors.newSingleThreadExecutor(), object : TakeScreenshotCallback {
        override fun onSuccess(result: ScreenshotResult) {
          val buffer = result.hardwareBuffer
          val bitmap = Bitmap.wrapHardwareBuffer(buffer, result.colorSpace)
          val output = ByteArrayOutputStream()
          val encoded = bitmap?.let {
            it.compress(Bitmap.CompressFormat.PNG, 100, output)
            Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
          }
          bitmap?.recycle()
          buffer.close()
          continuation.resume(encoded)
        }

        override fun onFailure(errorCode: Int) {
          continuation.resumeWithException(IllegalStateException("SCREENSHOT_FAILED:$errorCode"))
        }
      })
    }
  }

  private fun findNodeById(node: AccessibilityNodeInfo?, id: Long): AccessibilityNodeInfo? {
    if (node == null) return null
    if (node.sourceNodeId == id) return node
    for (index in 0 until node.childCount) {
      findNodeById(node.getChild(index), id)?.let { return it }
    }
    return null
  }

  private fun serializeNode(node: AccessibilityNodeInfo, depth: Int): Map<String, Any?> {
    val children = if (depth >= 20) emptyList() else (0 until node.childCount).mapNotNull {
      node.getChild(it)?.let { child -> serializeNode(child, depth + 1) }
    }
    return mapOf(
      "id" to node.sourceNodeId,
      "className" to node.className?.toString(),
      "packageName" to node.packageName?.toString(),
      "text" to node.text?.toString(),
      "contentDescription" to node.contentDescription?.toString(),
      "clickable" to node.isClickable,
      "enabled" to node.isEnabled,
      "editable" to node.isEditable,
      "children" to children,
    )
  }
}
