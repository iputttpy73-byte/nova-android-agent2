package com.nova.nativebridge

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class NovaDeferredWork(appContext: Context, workerParams: WorkerParameters) : CoroutineWorker(appContext, workerParams) {
  override suspend fun doWork(): Result {
    // Work is intentionally limited to durable, user-visible tasks. No device action is inferred here.
    return Result.success()
  }
}
