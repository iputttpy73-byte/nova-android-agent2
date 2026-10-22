import { MaterialIcons } from "@expo/vector-icons";
import { I18nManager, Pressable, ScrollView, Text, View } from "react-native";

import { AppHeader, SectionLabel, StatusPill, SurfaceCard } from "@/components/ui/foundation";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { useThemeContext } from "@/lib/theme-provider";

export default function SettingsScreen() {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { locale, setLocale, t } = useI18n();

  const changeLocale = (nextLocale: "ar-YE" | "en-US") => {
    setLocale(nextLocale);
    I18nManager.forceRTL(nextLocale === "ar-YE");
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow={t("controlCenter")} title={t("settingsTitle")} subtitle={t("settingsSubtitle")} />
        <View className="gap-5 px-6">
          <View>
            <SectionLabel>{t("appearance")}</SectionLabel>
            <SurfaceCard className="gap-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MaterialIcons name="contrast" size={21} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{t("colorTheme")}</Text>
                  <Text className="mt-1 text-sm text-muted">{t("colorThemeBody")}</Text>
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
                    <Text className="font-semibold text-foreground">{t(scheme)}</Text>
                  </Pressable>
                ))}
              </View>
            </SurfaceCard>
          </View>

          <View>
            <SectionLabel>{t("language")}</SectionLabel>
            <SurfaceCard className="gap-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MaterialIcons name="translate" size={21} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{t("language")}</Text>
                  <Text className="mt-1 text-sm text-muted">{t("languageBody")}</Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                {(["ar-YE", "en-US"] as const).map((nextLocale) => (
                  <Pressable
                    key={nextLocale}
                    accessibilityRole="button"
                    accessibilityState={{ selected: locale === nextLocale }}
                    onPress={() => changeLocale(nextLocale)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className={`flex-1 items-center rounded-2xl border px-3 py-3 ${locale === nextLocale ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                  >
                    <Text className="text-center font-semibold text-foreground">
                      {nextLocale === "ar-YE" ? t("yemeniArabic") : t("english")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SurfaceCard>
          </View>

          <View>
            <SectionLabel>{t("foundationStatus")}</SectionLabel>
            <SurfaceCard className="gap-4">
              <View className="flex-row items-center justify-between"><Text className="text-foreground">{t("aiProvider")}</Text><StatusPill label={t("notConfigured")} tone="warning" /></View>
              <View className="flex-row items-center justify-between"><Text className="text-foreground">{t("androidAccess")}</Text><StatusPill label={t("notConfigured")} tone="warning" /></View>
              <View className="flex-row items-center justify-between"><Text className="text-foreground">{t("memory")}</Text><StatusPill label={t("notImplemented")} /></View>
            </SurfaceCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
