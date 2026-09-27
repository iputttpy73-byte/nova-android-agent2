# Android Static Remediation Report

## 1. Scope

This remediation implements only the four approved findings from the Software Architecture and Android Readiness Review:

- AND-STATIC-001 — missing Accessibility window-content capability;
- AND-STATIC-002 — missing Accessibility gesture capability;
- AND-STATIC-003 — hidden `sourceNodeId` API usage;
- AND-STATIC-009 — misleading capability status values.

No architecture was redesigned. No public bridge method, TypeScript protocol field, Android permission, service registration, or Expo module registration was added or removed. MediaProjection runtime flow and autonomous background execution remain unchanged and unimplemented.

## 2. Result summary

| Finding | Before | After | Status |
|---|---|---|---|
| AND-STATIC-001 | UI hierarchy access was not declared in the Accessibility XML | `canRetrieveWindowContent="true"` is declared | Remediated |
| AND-STATIC-002 | Gesture dispatch was not declared in the Accessibility XML | `canPerformGestures="true"` is declared | Remediated |
| AND-STATIC-003 | Service compared and serialized hidden `sourceNodeId` | Service uses opaque process-local handles backed by public child paths | Remediated |
| AND-STATIC-009 | OCR, foreground session, and deferred work were hard-coded as available; user-mediated paths were hard-coded as not implemented | Status values are derived from the current implementation boundary and installed handlers | Remediated |

## 3. Detailed changes

### 3.1 AND-STATIC-001 and AND-STATIC-002

**Affected file:**

`modules/nova-native/android/src/main/res/xml/nova_accessibility_service.xml`

**Before:**

The configuration declared event types, feedback type, notification timeout, and description, but did not declare the capabilities required by the existing service methods.

**After:**

```xml
android:canRetrieveWindowContent="true"
android:canPerformGestures="true"
```

These attributes are the smallest possible change. They enable the capabilities already required by `rootInActiveWindow` traversal and `dispatchGesture()`. They do not add a new Android permission, do not change the service binding model, and remain inside the user-enabled AccessibilityService consent boundary.

**Regression risk:** Low. The service may receive more UI content and may dispatch gestures after the user enables it, which is the behavior already implied by the existing implementation. No behavior changes when the service is disabled.

### 3.2 AND-STATIC-003

**Affected file:**

`modules/nova-native/android/src/main/java/com/nova/nativebridge/NovaAccessibilityService.kt`

**Before:**

The service used `AccessibilityNodeInfo.sourceNodeId` for both serialized node IDs and node lookup. This is a hidden/test-only framework API and is not a stable public application API.

**After:**

The service now:

1. clears the previous node-handle map when creating a new snapshot;
2. assigns a monotonically increasing opaque `Long` handle to each serialized node;
3. stores the node’s public child-index path in a process-local `ConcurrentHashMap`;
4. resolves an input target by walking the current root using that path;
5. clears the map when the service is destroyed.

The existing numeric `id` field and `inputText(nodeId, text)` bridge method remain unchanged. The ID is now explicitly an opaque service-local handle rather than an Android framework identifier.

**Why this is safe:** The bridge does not need to know how the native service identifies a node. It only needs a numeric handle that can be returned in a snapshot and supplied to the subsequent input request. The implementation uses public `getChild(index)` traversal and does not depend on hidden APIs.

**Regression risk:** Medium. Handles are intentionally valid only against the most recent snapshot and the current service process. A UI tree change between snapshot and input can make a handle stale, in which case the method returns `false`. This is safer than acting on a mismatched hidden framework ID. No bridge shape change is introduced.

### 3.3 AND-STATIC-009

**Affected files:**

- `modules/nova-native/android/src/main/java/com/nova/nativebridge/NovaCapability.kt`
- `modules/nova-native/android/src/main/java/com/nova/nativebridge/NovaOcrAdapter.kt`

**Before:**

The inspector returned `available=true` for OCR, foreground sessions, and deferred work even though availability was not checked and deferred work was intentionally a no-op. It returned `NOT_IMPLEMENTED` for TTS, camera, gallery, and phone-call paths even though user-mediated adapter methods already existed.

**After:**

- OCR now uses a local `NovaOcrAdapter.isAvailable()` probe. If the recognizer cannot be created, the status is not reported as available.
- `FOREGROUND_SESSION` remains explicitly unavailable and `NOT_IMPLEMENTED`; the service shell is not treated as a completed foreground capability.
- `DEFERRED_WORK` remains explicitly unavailable and `NOT_IMPLEMENTED`; the worker is a foundation-only no-op.
- TTS status is derived from installed TTS handlers.
- Camera, gallery, and dialer status is derived from whether the corresponding user-mediated intent resolves on the device.
- No new capability name or bridge method was added.

**Why this is safe:** The changes correct status reporting only. They do not automatically launch an app, send a message, make a call, start TTS, schedule work, or access a device service. The existing user-mediated execution paths and permission boundaries are unchanged.

**Regression risk:** Low to medium. Capability lists can differ by device image because installed intent handlers and TTS engines differ. That variation is the intended truthful behavior. OCR capability probing may report unavailable when the ML Kit dependency cannot be initialized; callers must already handle unavailable capabilities.

## 4. Protocol and permission invariants

The following invariants were checked after the changes:

- `getStatus()` and `getCapabilities()` remain present and unchanged.
- `inputText(nodeId: number, text: string)` remains unchanged.
- `recognizeText(pngBase64: string)` remains unchanged.
- `captureScreenshot()` remains unchanged.
- No TypeScript bridge export was added or removed.
- No Android permission was added, removed, or broadened.
- No Manifest service declaration was added or removed.
- `expo-module.config.json` was not modified.
- The native module class remains `com.nova.nativebridge.NovaNativeModule`.

## 5. Static verification performed

### Source assertions

All of the following passed:

- Accessibility XML contains `canRetrieveWindowContent="true"`.
- Accessibility XML contains `canPerformGestures="true"`.
- `NovaAccessibilityService.kt` contains no `sourceNodeId` usage.
- Opaque node handles and public child-path lookup are present.
- OCR status calls `NovaOcrAdapter.isAvailable()`.
- Foreground session and deferred work are explicitly `NOT_IMPLEMENTED`.
- Existing bridge fields and exports remain present.
- Existing MediaProjection permission declaration remains present.

### Project checks

| Check | Result |
|---|---|
| TypeScript (`pnpm check`) | PASS |
| Expo lint (`pnpm lint`) | PASS; existing Node module-type warning only |
| Vitest (`pnpm test`) | PASS; 17 files, 88 passed, 1 skipped |
| Server build (`pnpm build`) | PASS |
| `git diff --check` | PASS |
| Android source assertions | PASS |

The Android Kotlin compiler was not used as evidence in this report. This is a source-level remediation report; the actual Android compile and runtime validation remain separate gates.

## 6. Follow-up risks intentionally left unchanged

The remediation was intentionally limited to the four approved findings. The following previously identified items were not changed:

- TTS shutdown lifecycle;
- TTS locale availability validation;
- OCR cancellation and bitmap cleanup;
- screenshot executor cleanup;
- Accessibility node recycling;
- exact component matching for enabled services;
- notification listener connection-state reporting;
- Environment Adapter intent result handling;
- release signing configuration.

These remain separate follow-up findings and were not mixed into this remediation.

## 7. Final assessment

All four approved high-priority findings are remediated at source level. The changes preserve the Expo Modules integration, public bridge protocol, current permission boundaries, and existing architecture. Static project checks and targeted assertions pass. No new static readiness issue was introduced by these four changes.

## References

[1]: https://developer.android.com/guide/topics/ui/accessibility/service "Create an accessibility service"

[2]: https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/master/core/java/android/view/accessibility/AccessibilityNodeInfo.java "Android Open Source Project AccessibilityNodeInfo source"

[3]: https://docs.expo.dev/modules/module-api/ "Expo Modules API"
