import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
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

/* Der eine Hauptknopf: wächst mit seinem Text, bricht Zeilen um.
   Seit 13.09. (Antons Referenz: der „Continue"-Knopf mit Lichtschein):
   DUNKLES Glas, durch das links ein warmer und rechts ein kühler Schein
   fällt — nicht mehr die volle orange Fläche. Weißer Text. Auf iOS 26
   echtes Liquid Glass, davor eine dunkle Fläche mit demselben Schein. */
const SHEEN = ["rgba(242,167,101,0.62)", "rgba(242,167,101,0.16)", "rgba(96,150,255,0.14)", "rgba(96,150,255,0.55)"] as const;
/* Der Schein ist IMMER in Bewegung (Antons Wunsch 13.09.: „in Bewegung
   immer"): der Verlauf ist doppelt so breit wie die Fläche und wandert
   langsam hin und her — das Licht zieht, der Knopf steht. Breite aus
   onLayout, weil Reanimated keine Prozente verschiebt. */
export function Sheen() {
  const [w, setW] = useState(0);
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const drift = useAnimatedStyle(() => ({ transform: [{ translateX: (k.value - 0.5) * w * 0.5 }] }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: -w / 2, width: w * 2 }, drift]}>
        <LinearGradient colors={[...SHEEN]} locations={[0, 0.42, 0.6, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {/* Unten ein Hauch heller, oben nichts — Glas, kein Sticker. */}
      <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.10)"]} style={StyleSheet.absoluteFill} />
    </View>
  );
}
/* Dieselbe Fläche für alles, was kein runder Knopf ist (die Rekorder-Kachel
   im Wizard): dunkles Glas, wandernder Schein, Inhalt darüber. */
export function SheenSurface({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  if (glass) {
    return (
      <GlassView style={[styles.primaryGlass, style]} glassEffectStyle="regular" tintColor="rgba(8,14,26,0.55)" isInteractive colorScheme="dark">
        <Sheen />
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.primary, { overflow: "hidden" }, style]}><Sheen />{children}</View>;
}
export function PrimaryButton({ label, onPress, style, disabled, heavy }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean; heavy?: boolean }) {
  const press = () => { Haptics.impactAsync(heavy ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light); onPress(); };
  if (glass) {
    return (
      <Pressable onPress={press} disabled={disabled} style={({ pressed }) => [{ flex: 1, opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
        <GlassView style={[styles.button, styles.primaryGlass]} glassEffectStyle="regular" tintColor="rgba(8,14,26,0.55)" isInteractive colorScheme="dark">
          <Sheen />
          <Text style={styles.primaryGlassText}>{label}</Text>
        </GlassView>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={press} disabled={disabled} style={({ pressed }) => [styles.button, styles.primary, { flex: 1, overflow: "hidden", opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <Sheen />
      <Text style={styles.primaryGlassText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  button: { minHeight: 50, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: "600", textAlign: "center" },
  primary: { backgroundColor: "rgba(16,24,40,0.92)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.14)" },
  primaryGlass: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.16)" },
  primaryGlassText: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "center" },
});
