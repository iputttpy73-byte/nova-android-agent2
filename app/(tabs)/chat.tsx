import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { AppHeader, EmptyState, SurfaceCard } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";

export default function ChatScreen() {
  const { t } = useI18n();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow={t("conversation")} title={t("chatTitle")} subtitle={t("chatSubtitle")} />
        <View className="gap-5 px-6">
          <SurfaceCard className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MaterialIcons name="lock-outline" size={21} color="#0A7EA4" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{t("supervised")}</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">{t("supervisedBody")}</Text>
            </View>
          </SurfaceCard>
          <EmptyState icon="chat-bubble-outline" title={t("aiNotConnected")} description={t("chatReadyBody")} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
