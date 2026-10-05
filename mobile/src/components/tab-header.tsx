import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/theme";

/* Die feste Tab-Überschrift (Antons Befund 05.10.: „Profil" und „Schlaf"
 * wanderten beim Scrollen mit und hüpften oben in die Leiste — so klappt
 * die große iOS-Überschrift ein, und die durchsichtige Leiste ließ es wie
 * Springen aussehen). Hier steht sie fest oben; der Inhalt läuft darunter
 * durch und blendet unter einem Verlauf in der Farbe des Himmels aus.
 * Rechts ist Platz für Knöpfe (Profil: Guthaben, Zahnrad).
 *
 * Der Bildschirm blendet dafür den Systemkopf aus (`headerShown: false`)
 * und rückt seinen Inhalt um `useTabHeaderTop()` nach unten. */
const ROW = 60;

export function useTabHeaderTop() {
  return useSafeAreaInsets().top + ROW;
}

export function TabHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const top = useSafeAreaInsets().top;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingTop: top, height: top + ROW + 22 }]}>
      <LinearGradient pointerEvents="none" colors={["rgba(11,24,52,0.97)", "rgba(10,21,46,0.9)", "rgba(9,18,40,0)"]} locations={[0, 0.72, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.row} pointerEvents="box-none">
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 10 },
  row: { height: ROW, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 36, color: colors.text },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});
