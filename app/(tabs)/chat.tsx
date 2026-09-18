import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { AppHeader, EmptyState, SurfaceCard } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";

export default function ChatScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Conversation" title="Chat with your agent" subtitle="Describe a goal and review the plan before anything runs." />
        <View className="gap-5 px-6">
          <SurfaceCard className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MaterialIcons name="lock-outline" size={21} color="#0A7EA4" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Supervised by design</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">Plans, permissions, and verification will be visible before execution.</Text>
            </View>
          </SurfaceCard>
          <EmptyState icon="chat-bubble-outline" title="AI is not connected yet" description="The chat surface is ready. AI provider integration is intentionally not implemented in Phase 1." />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
