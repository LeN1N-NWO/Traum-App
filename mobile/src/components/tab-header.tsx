import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurInText } from "@/components/blur-in-text";
import { colors, fonts } from "@/theme";

/* Der Kopf der Tabs Journal, Schlaf, Profil (Antons Befunde 05.10.):
 *   · Die große iOS-Überschrift wanderte beim Scrollen mit und hüpfte in
 *     die Leiste; die durchsichtige Leiste ließ es springen.
 *   · Danach: Die Überschrift muss nicht stehen bleiben — „der Text kann
 *     getrost hochgefahren werden", nur Knöpfe wie Guthaben und Zahnrad
 *     bleiben oben.
 * Also zwei Teile:
 *   TabTitle — die Überschrift als erstes Stück des Inhalts; sie scrollt
 *              mit weg, nichts klappt ein.
 *   TabBar   — fest oben: ein Verlauf in Himmelsfarbe unter der Status-
 *              leiste (damit nichts unter der Uhr durchläuft) und rechts
 *              die Knöpfe, auf Höhe der Überschrift.
 * Der Bildschirm blendet den Systemkopf aus (`headerShown: false`) und
 * rückt seinen Inhalt um `useTabTop()` nach unten (nur die Statusleiste). */
const ROW = 60;

export function useTabTop() {
  return useSafeAreaInsets().top;
}

export function TabTitle({ title, room = 0 }: { title: string; room?: number }) {
  return (
    <View style={[styles.titleRow, { paddingRight: room }]}>
      {/* taucht aus der Unschärfe auf, von links nach rechts (Antons Wunsch 10.10.) */}
      <BlurInText text={title} style={styles.title} accessibilityRole="header" />
    </View>
  );
}

export function TabBar({ children }: { children?: React.ReactNode }) {
  const top = useSafeAreaInsets().top;
  return (
    /* so hoch wie Statusleiste + Knopfzeile, damit die Knöpfe Tipps bekommen;
       durchlässig überall sonst (box-none), der Verlauf nur unter der Uhr */
    <View pointerEvents="box-none" style={[styles.bar, { height: top + ROW }]}>
      <LinearGradient pointerEvents="none" colors={["rgba(11,24,52,0.96)", "rgba(11,24,52,0.75)", "rgba(9,18,40,0)"]} locations={[0, 0.65, 1]} style={[styles.fade, { height: top + 14 }]} />
      {children ? <View style={[styles.buttons, { top: top + (ROW - 36) / 2 }]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { height: ROW, justifyContent: "center" },
  title: { fontFamily: fonts.serif, fontSize: 36, color: colors.text },
  bar: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 10 },
  fade: { position: "absolute", left: 0, right: 0, top: 0 },
  buttons: { position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 8 },
});
