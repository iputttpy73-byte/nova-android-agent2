import { ScrollView, View } from "react-native";

import { AppHeader, EmptyState } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";

export default function TasksScreen() {
  const { t } = useI18n();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow={t("workspace")} title={t("tasksTitle")} subtitle={t("tasksSubtitle")} />
        <View className="px-6">
          <EmptyState icon="checklist" title={t("noTasks")} description={t("tasksBody")} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
