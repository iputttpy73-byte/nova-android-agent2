import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/use-colors";

type IconName = keyof typeof MaterialIcons.glyphMap;

export function AppHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <View className="gap-1 px-6 pb-5 pt-2">
      <Text className="text-xs font-semibold uppercase tracking-[2px] text-primary">{eyebrow}</Text>
      <Text className="text-3xl font-bold leading-9 text-foreground">{title}</Text>
      {subtitle ? <Text className="text-sm leading-5 text-muted">{subtitle}</Text> : null}
    </View>
  );
}

export function SurfaceCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: StyleProp<ViewStyle> }) {
  return <View style={style} className={`rounded-3xl border border-border bg-surface p-5 ${className}`}>{children}</View>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-muted">{children}</Text>;
}

export function IconButton({ icon, label, onPress, disabled = false }: { icon: IconName; label: string; onPress?: PressableProps["onPress"]; disabled?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : pressed ? 0.65 : 1 }]}
      className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface"
    >
      <MaterialIcons name={icon} size={20} color={colors.foreground} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  const colors = useColors();
  return (
    <SurfaceCard className="items-center px-6 py-8">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <MaterialIcons name={icon} size={28} color={colors.primary} />
      </View>
      <Text className="text-center text-base font-bold text-foreground">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-muted">{description}</Text>
    </SurfaceCard>
  );
}

export function StatusPill({ label, tone = "muted" }: { label: string; tone?: "muted" | "warning" | "success" }) {
  const colors = useColors();
  const color = tone === "warning" ? colors.warning : tone === "success" ? colors.success : colors.muted;
  return (
    <View className="flex-row items-center gap-2 rounded-full border border-border px-3 py-1.5">
      <View style={{ backgroundColor: color }} className="h-1.5 w-1.5 rounded-full" />
      <Text style={{ color }} className="text-xs font-semibold">{label}</Text>
    </View>
  );
}
