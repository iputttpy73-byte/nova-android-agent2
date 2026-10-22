import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { AppHeader, EmptyState, SectionLabel, StatusPill, SurfaceCard } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAgentState } from "@/lib/agent-state";
import { useI18n } from "@/lib/i18n";

export default function HomeScreen() {
  const colors = useColors();
  const { connection } = useAgentState();
  const { t } = useI18n();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow={t("personalAgent")} title={t("goodEvening")} subtitle={t("homeSubtitle")} />
        <View className="gap-5 px-6">
          <SurfaceCard className="overflow-hidden" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-2 pr-4">
                <Text className="text-xs font-bold text-white/70">{t("agentFoundation")}</Text>
                <Text className="text-2xl font-bold leading-8 text-white">{t("homeCardTitle")}</Text>
                <Text className="text-sm leading-5 text-white/75">{t("homeCardBody")}</Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <MaterialIcons name="auto-awesome" size={22} color="#FFFFFF" />
              </View>
            </View>
          </SurfaceCard>

          <View className="flex-row items-center justify-between">
            <SectionLabel>{t("systemStatus")}</SectionLabel>
            <StatusPill label={connection === "not_configured" ? t("notConnected") : t("ready")} tone="warning" />
          </View>

          <SurfaceCard>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <MaterialIcons name="phone-android" size={21} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{t("androidEnvironment")}</Text>
                <Text className="mt-1 text-sm text-muted">{t("androidEnvironmentBody")}</Text>
              </View>
            </View>
          </SurfaceCard>

          <View>
            <SectionLabel>{t("recentActivity")}</SectionLabel>
            <EmptyState icon="inbox" title={t("noRuns")} description={t("noRunsBody")} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
