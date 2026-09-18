import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import { AppHeader, SectionLabel, StatusPill, SurfaceCard } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";

export default function SettingsScreen() {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Control center" title="Settings" subtitle="Shape the shell now. Permissions and integrations come later." />
        <View className="gap-5 px-6">
          <View>
            <SectionLabel>Appearance</SectionLabel>
            <SurfaceCard className="gap-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MaterialIcons name="contrast" size={21} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Color theme</Text>
                  <Text className="mt-1 text-sm text-muted">Choose a comfortable workspace appearance.</Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                {(["light", "dark"] as const).map((scheme) => (
                  <Pressable
                    key={scheme}
                    accessibilityRole="button"
                    accessibilityState={{ selected: colorScheme === scheme }}
                    onPress={() => setColorScheme(scheme)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className={`flex-1 items-center rounded-2xl border px-4 py-3 ${colorScheme === scheme ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                  >
                    <Text className="font-semibold capitalize text-foreground">{scheme}</Text>
                  </Pressable>
                ))}
              </View>
            </SurfaceCard>
          </View>

          <View>
            <SectionLabel>Foundation status</SectionLabel>
            <SurfaceCard className="gap-4">
              <View className="flex-row items-center justify-between"><Text className="text-foreground">AI provider</Text><StatusPill label="Not configured" tone="warning" /></View>
              <View className="flex-row items-center justify-between"><Text className="text-foreground">Android access</Text><StatusPill label="Not configured" tone="warning" /></View>
              <View className="flex-row items-center justify-between"><Text className="text-foreground">Memory</Text><StatusPill label="Not implemented" /></View>
            </SurfaceCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
