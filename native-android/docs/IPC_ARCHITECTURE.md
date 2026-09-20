# Native IPC and Bridge Architecture

## Boundary

The Expo UI communicates with a future `nova-bridge` native module. The bridge communicates with a capability gateway, which routes bounded requests to service ports. Service ports are contracts only in Phase 1.

```text
Expo UI
  -> ExpoNativeBridge
  -> Capability Gateway
  -> NativeServiceConnection<TRequest, TResult>
  -> Accessibility / Notification / Projection / Foreground / Work port
```

## Request rules

Every request carries a protocol version, request ID, run ID, operation ID, capability, issue and expiry times, an idempotency key, an optional approval token, and a typed payload. Native code must reject expired requests, duplicate idempotency keys, unknown capabilities, unsupported protocol versions, and requests without the required grant.

## Result rules

Every result carries a correlation ID and a typed status. The status must distinguish completion from permission requirements, user cancellation, timeout, policy denial, unsupported capability, and failure. A result without device evidence must not be interpreted as successful device control.

## Event rules

Events are redacted and sequence-numbered. The native layer may persist minimal event references for replay after the Expo process is recreated. Raw screenshots, complete accessibility trees, notification bodies, and audio are not bridge event payloads.

## Process and lifecycle rules

The Expo activity may be destroyed while a native service remains available. Conversely, a native service may be disabled or killed while Expo remains open. Both sides therefore query status and reconnect explicitly. No sensitive action is resumed automatically after process death.

## Phase 1 status

The Kotlin interfaces define the boundary, but there is no Binder implementation, Expo module registration, Android service binding, serialization adapter, or native event publisher. All device-facing behavior remains **NOT IMPLEMENTED**.
