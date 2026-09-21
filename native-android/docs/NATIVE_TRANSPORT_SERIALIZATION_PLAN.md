# Native Transport and Serialization Plan

## Status

**Planning only — NOT IMPLEMENTED.**

## Transport boundary

```text
Expo UI
  -> TypeScript NovaNativeClient
  -> Expo Modules API
  -> Capability Gateway
  -> NativeServiceConnection
  -> approved native service
```

The transport is capability-gated and does not expose raw Android service objects to JavaScript.

## Versioned envelope

Every request and result uses a JSON-compatible envelope containing protocol version, request ID, run ID, operation ID, capability, issue/expiry timestamps, idempotency key, status, error code, payload, and redacted evidence references.

Kotlin data classes must not cross the JavaScript boundary directly. A future adapter will serialize and validate the envelope, reject expired or duplicated requests, map unknown enum values to unsupported states, and enforce capability-specific payload limits.

## Event rules

Events are sequence-numbered and redacted. They may carry status changes, progress, and error states. Raw screenshots, complete accessibility trees, notification bodies, and audio are excluded from bridge payloads.

## Lifecycle rules

The bridge queries status after reconnect, handles service disablement, and never resumes sensitive work automatically after process death. Every request has a correlation ID and explicit terminal result.

## Missing implementation

No JavaScript client, Kotlin serializer, schema registry, Binder transport, Expo module event publisher, or compatibility test exists.

**Next phase:** not started.
