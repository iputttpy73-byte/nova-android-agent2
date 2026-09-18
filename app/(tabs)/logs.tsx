import { ScrollView, View } from "react-native";

import { AppHeader, EmptyState } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";

export default function LogsScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Observability" title="Logs" subtitle="A transparent record of agent decisions and environment events." />
        <View className="px-6">
          <EmptyState icon="receipt-long" title="No events recorded" description="Structured logging and audit events will be added with the agent runtime, not mocked here." />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
