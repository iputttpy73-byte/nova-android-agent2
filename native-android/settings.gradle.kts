rootProject.name = "nova-native-android"

// Foundation module map only. Gradle Android plugins and native implementations are intentionally deferred.
include(
  ":nova-contracts",
  ":nova-bridge",
  ":nova-ipc",
  ":nova-security",
  ":nova-environment",
  ":nova-accessibility",
  ":nova-notifications",
  ":nova-projection",
  ":nova-foreground",
  ":nova-work",
  ":nova-observability"
)
