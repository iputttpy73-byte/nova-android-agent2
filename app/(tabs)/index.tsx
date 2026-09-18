import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { AppHeader, EmptyState, SectionLabel, StatusPill, SurfaceCard } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";
import { useAgentState } from "@/lib/agent-state";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const colors = useColors();
  const { connection } = useAgentState();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Personal Android Agent" title="Good evening" subtitle="Your agent workspace, ready when you are." />
        <View className="gap-5 px-6">
          <SurfaceCard className="overflow-hidden" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-2 pr-4">
                <Text className="text-xs font-bold uppercase tracking-[1.5px] text-white/70">Agent foundation</Text>
                <Text className="text-2xl font-bold leading-8 text-white">A calm control center for your goals.</Text>
                <Text className="text-sm leading-5 text-white/75">Phase 1 establishes the shell. Agent intelligence and Android actions remain off.</Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <MaterialIcons name="auto-awesome" size={22} color="#FFFFFF" />
              </View>
            </View>
          </SurfaceCard>

          <View className="flex-row items-center justify-between">
            <SectionLabel>System status</SectionLabel>
            <StatusPill label={connection === "not_configured" ? "Not connected" : "Ready"} tone="warning" />
          </View>

          <SurfaceCard>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <MaterialIcons name="phone-android" size={21} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Android environment</Text>
                <Text className="mt-1 text-sm text-muted">Connect an approved environment in a future phase.</Text>
              </View>
            </View>
          </SurfaceCard>

          <View>
            <SectionLabel>Recent activity</SectionLabel>
            <EmptyState icon="inbox" title="No agent runs yet" description="When the agent foundation is implemented, your verified runs will appear here." />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
