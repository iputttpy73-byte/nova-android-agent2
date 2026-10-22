import { ScrollView, View } from "react-native";

import { AppHeader, EmptyState } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";

export default function LogsScreen() {
  const { t } = useI18n();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow={t("observability")} title={t("logsTitle")} subtitle={t("logsSubtitle")} />
        <View className="px-6">
          <EmptyState icon="receipt-long" title={t("noEvents")} description={t("logsBody")} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
