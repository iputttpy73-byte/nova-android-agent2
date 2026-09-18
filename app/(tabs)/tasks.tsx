import { ScrollView, View } from "react-native";

import { AppHeader, EmptyState } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";

export default function TasksScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Workspace" title="Tasks" subtitle="Track goals, plans, and verified outcomes in one place." />
        <View className="px-6">
          <EmptyState icon="checklist" title="No tasks to show" description="Task lifecycle and execution are reserved for a future implementation phase." />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
