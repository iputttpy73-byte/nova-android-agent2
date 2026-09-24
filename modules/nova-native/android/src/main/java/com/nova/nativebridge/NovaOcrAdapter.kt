package com.nova.nativebridge

import android.graphics.BitmapFactory
import android.util.Base64
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class NovaOcrAdapter {
  private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

  suspend fun recognizePngBase64(encoded: String): Map<String, Any?> = suspendCancellableCoroutine { continuation ->
    val bytes = try {
      Base64.decode(encoded, Base64.DEFAULT)
    } catch (error: IllegalArgumentException) {
      continuation.resumeWithException(error)
      return@suspendCancellableCoroutine
    }
    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    if (bitmap == null) {
      continuation.resumeWithException(IllegalArgumentException("INVALID_IMAGE"))
      return@suspendCancellableCoroutine
    }
    recognizer.process(InputImage.fromBitmap(bitmap, 0))
      .addOnSuccessListener { result ->
        continuation.resume(mapOf("text" to result.text, "blocks" to result.textBlocks.map { it.text }))
        bitmap.recycle()
      }
      .addOnFailureListener { error ->
        continuation.resumeWithException(error)
        bitmap.recycle()
      }
  }

  fun close() {
    recognizer.close()
  }
}
