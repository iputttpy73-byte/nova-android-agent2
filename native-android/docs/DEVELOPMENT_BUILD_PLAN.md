# Expo Development Build Plan

**Phase:** Native Android Migration Phase 1  
**Status:** Planning only — **NOT IMPLEMENTED**

## Purpose

The existing Expo application remains the user interface and control center. Future native Android capabilities must run in a custom development build, not in Expo Go.

## Planned sequence

1. Add `expo-dev-client` with the project's existing `pnpm` package manager.
2. Create a local Expo module under `modules/nova-native` using the Expo Modules API.
3. Use config plugins for future manifest, resource, and Gradle changes.
4. Generate the Android project with Expo prebuild only after the build strategy is approved.
5. Build locally with `npx expo run:android` or through an approved EAS development build.
6. Install on an emulator and a physical Android device.
7. Rebuild after native dependency, app-config, config-plugin, or SDK changes.

## Current state

`expo-dev-client` is not installed. `expo prebuild` has not been run. No `android/` directory, local Expo module, or custom native build exists. The current `POST_NOTIFICATIONS` setting does not enable any Android service.

## Readiness gate

The build path is ready for implementation when the project has a selected local-module or bare/prebuild strategy, a compatible development-client version, a generated Android project that builds, a debug signing strategy, and a physical-device test target.

## Explicit non-goals

This plan does not implement AccessibilityService, NotificationListenerService, MediaProjection, device control, OCR, screenshot capture, foreground execution, WorkManager execution, or any permission flow.

## References

[1]: https://docs.expo.dev/workflow/customizing/ "Expo: Add custom native code"
[2]: https://docs.expo.dev/develop/development-builds/introduction/ "Expo: Introduction to development builds"
