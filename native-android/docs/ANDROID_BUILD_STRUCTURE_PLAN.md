# Android Build Structure Plan

**Status:** Planning only — no Android project or Gradle build has been generated.

## Target structure

```text
android/
  build.gradle.kts
  settings.gradle.kts
  gradle.properties
  gradlew
  gradle/wrapper/
  app/
    build.gradle.kts
    src/main/AndroidManifest.xml
    src/main/java/com/nova/app/
    src/main/res/
  modules/
    nova-contracts/
    nova-bridge/
    nova-ipc/
    nova-security/
    nova-environment/
    nova-observability/
    nova-accessibility/
    nova-notifications/
    nova-projection/
    nova-foreground/
    nova-work/
```

## Gradle ownership

The root build will own plugin versions, repositories, Kotlin/Android compatibility, and shared compiler settings. The `app` module will host the Expo application. Native modules will own contract or capability-specific dependencies and must not depend on UI modules.

The intended dependency direction is:

```text
app -> nova-bridge -> nova-ipc -> capability modules
capability modules -> nova-contracts + nova-security + nova-observability
nova-contracts -> no service implementation
```

## Current state

`native-android/settings.gradle.kts` is only a module-name map. There are no root or module Gradle files, Gradle wrapper, Android application module, manifest, resources, or compiled artifacts.

## Required future checks

The first build implementation must verify Gradle dependency resolution, Kotlin compilation, Expo host integration, debug installation, and a status-only native module smoke test. It must not add a device-control service in the same change.

**Status:** **NOT READY** for build execution; **READY FOR IMPLEMENTATION** as an architecture plan.
