package com.nova.work

import com.nova.contracts.RunId

interface DeferredWorkPort {
  suspend fun enqueue(request: DeferredWorkRequest): DeferredWorkResult
  suspend fun cancel(runId: RunId, workId: String): DeferredWorkResult
  suspend fun getStatus(workId: String): DeferredWorkStatus
}

data class DeferredWorkRequest(val runId: RunId, val workType: String, val constraints: WorkConstraints, val maxRetries: Int)
data class WorkConstraints(val networkRequired: Boolean, val chargingRequired: Boolean, val idleRequired: Boolean)
data class DeferredWorkResult(val workId: String?, val accepted: Boolean, val reason: String)
enum class DeferredWorkStatus { UNKNOWN, ENQUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED, NOT_IMPLEMENTED }
