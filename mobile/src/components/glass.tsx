import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme";

/* Liquid Glass für Flächen und Knöpfe (Antons Wunsch 12.09.). Auf iOS 26
   das echte Material (UIGlassEffect), davor und auf Android eine ruhige
   Fläche in Panelfarbe — gleiche Maße, gleicher Text. */
const glass = isLiquidGlassAvailable();

export function Glass({ style, tint, interactive, children }: { style?: StyleProp<ViewStyle>; tint?: string; interactive?: boolean; children?: React.ReactNode }) {
  if (glass) {
    return <GlassView style={style} glassEffectStyle="regular" tintColor={tint} isInteractive={interactive} colorScheme="dark">{children}</GlassView>;
  }
  return <View style={[styles.fallback, style]}>{children}</View>;
}

/* Der leise Knopf: Glas, wächst mit seinem Text, bricht Zeilen um. */
export function GlassButton({ label, onPress, style, disabled }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} disabled={disabled} style={({ pressed }) => [{ flex: 1, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <Glass style={styles.button} interactive>
        <Text style={styles.buttonText}>{label}</Text>
      </Glass>
    </Pressable>
  );
}

/* Der eine warme Knopf: wächst mit seinem Text, bricht Zeilen um. Auf
   iOS 26 getöntes Liquid Glass in der warmen Farbe (Antons Frage 12.09.:
   „gibt es die nicht auch in Glas?"), davor die warme Fläche. */
export function PrimaryButton({ label, onPress, style, disabled, heavy }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean; heavy?: boolean }) {
  const press = () => { Haptics.impactAsync(heavy ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light); onPress(); };
  if (glass) {
    return (
      <Pressable onPress={press} disabled={disabled} style={({ pressed }) => [{ flex: 1, opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
        <GlassView style={[styles.button, { overflow: "hidden" }]} glassEffectStyle="regular" tintColor={colors.warm} isInteractive colorScheme="dark">
          {/* Der Verlauf von links warm nach rechts golden, unten heller —
              Antons Referenz (Opal) in unserer Farbe. */}
          <LinearGradient colors={["rgba(242,167,101,0.55)", "rgba(246,198,91,0.25)", "rgba(255,255,255,0.10)"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <Text style={styles.primaryGlassText}>{label}</Text>
        </GlassView>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={press} disabled={disabled} style={({ pressed }) => [styles.button, styles.primary, { flex: 1, overflow: "hidden", opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <LinearGradient colors={[colors.warm, colors.gold]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  button: { minHeight: 50, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: "600", textAlign: "center" },
  primary: { backgroundColor: colors.warm },
  primaryText: { color: colors.bg, fontSize: 15, fontWeight: "700", textAlign: "center" },
  primaryGlassText: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "center" },
});
