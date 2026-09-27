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
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicLong
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

  private val nextNodeHandle = AtomicLong(1)
  private val nodePaths = ConcurrentHashMap<Long, List<Int>>()

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
    nodePaths.clear()
    instance = null
    super.onDestroy()
  }

  fun snapshotRoot(): Map<String, Any?>? {
    nodePaths.clear()
    return rootInActiveWindow?.let { serializeNode(it, 0, emptyList()) }
  }

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

  /**
   * Returns a process-local opaque handle while retaining only a public child
   * path. The existing numeric bridge field remains unchanged.
   */
  private fun registerNode(path: List<Int>): Long {
    val handle = nextNodeHandle.getAndIncrement()
    nodePaths[handle] = path
    return handle
  }

  private fun findNodeById(root: AccessibilityNodeInfo?, id: Long): AccessibilityNodeInfo? {
    val path = nodePaths[id] ?: return null
    var node = root ?: return null
    for (childIndex in path) {
      node = node.getChild(childIndex) ?: return null
    }
    return node
  }

  private fun serializeNode(node: AccessibilityNodeInfo, depth: Int, path: List<Int>): Map<String, Any?> {
    val handle = registerNode(path)
    val children = if (depth >= 20) emptyList() else (0 until node.childCount).mapNotNull { index ->
      node.getChild(index)?.let { child -> serializeNode(child, depth + 1, path + index) }
    }
    return mapOf(
      "id" to handle,
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
