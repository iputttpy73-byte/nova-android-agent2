package com.nova.nativebridge

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

class NovaSpeechAdapter(context: Context) : TextToSpeech.OnInitListener {
  private val tts = TextToSpeech(context.applicationContext, this)
  @Volatile private var ready = false

  override fun onInit(status: Int) {
    ready = status == TextToSpeech.SUCCESS
    if (ready) tts.language = Locale.getDefault()
  }

  fun speak(text: String): Boolean {
    if (!ready || text.isBlank()) return false
    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "nova-${System.currentTimeMillis()}")
    return true
  }

  fun shutdown() = tts.shutdown()
}
