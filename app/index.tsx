import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function SafeModeHome() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.title}>نوفا</Text>
        <Text style={styles.subtitle}>وكيل أندرويد الشخصي</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>التطبيق يعمل</Text>
          <Text style={styles.cardBody}>
            هذه نسخة التشغيل الآمنة. تم فتح التطبيق بدون خادم محلي أو إعدادات إضافية.
          </Text>
        </View>
        <Text style={styles.footer}>NOVA • Safe Mode</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A7EA4",
    marginBottom: 20,
  },
  logoText: { color: "#FFFFFF", fontSize: 46, fontWeight: "800" },
  title: { color: "#111827", fontSize: 38, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#64748B", fontSize: 18, marginTop: 6, textAlign: "center" },
  card: {
    width: "100%",
    maxWidth: 420,
    marginTop: 34,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: { color: "#0A7EA4", fontSize: 20, fontWeight: "700", textAlign: "center" },
  cardBody: { color: "#475569", fontSize: 15, lineHeight: 24, marginTop: 10, textAlign: "center" },
  footer: { color: "#94A3B8", fontSize: 12, marginTop: 42, letterSpacing: 1 },
});
