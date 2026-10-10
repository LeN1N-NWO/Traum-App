import { Pressable, StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { Galaxy } from "@/components/galaxy";
import { swing, useAmbient } from "@/lib/ambient-clock";
import { useScreenActive } from "@/lib/use-screen-active";
import { colors } from "@/theme";

/* Das Traumportal (Antons Wahl 04.10., ersetzt den Mond als Aufnahmeknopf):
 * in der Mitte der goldene Knopf (Play = erzählen, Quadrat = fertig).
 *
 * Dahinter seit 09.10. die Galaxie der Website (components/galaxy.tsx,
 * Antons Wahl — vorher eine Spirale mit hineinfliegenden Sternen). Beim
 * Sprechen dreht sie schneller und leuchtet heller — `level` (0…1) kommt
 * aus dem Rekorder.
 *
 * Leistung (Lehren vom 27.09.): alles STILLE SVGs; bewegt werden nur
 * native Ebenen (Drehung, Skalierung, Deckkraft), nur solange der Tab zu
 * sehen ist. */

export function PortalButton({ size = 150, stageSize, recording, level, onPress, disabled, label }: {
  size?: number; stageSize?: number; recording: boolean; level: SharedValue<number>; onPress: () => void; disabled?: boolean; label: string;
}) {
  // Die Bühne darf größer sein als der Knopf in ihrer Mitte (Antons Wunsch 04.10.: den Platz nutzen).
  const stage = stageSize ?? size * 2.3;

  // der Atem im gemeinsamen 30er-Takt (lib/ambient-clock.tsx, 10.10.), nur solange sichtbar
  const t = useAmbient(useScreenActive());
  const core = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.03 * swing(t.value, 4800) + 0.1 * level.value }] }));
  const btn = size * 0.62;

  return (
    <View style={{ width: stage, height: stage, alignItems: "center", justifyContent: "center" }}>
      <Galaxy size={stage} level={level} infall />
      {/* Der Knopf in der Mitte */}
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
        style={({ pressed }) => [{ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
        <Animated.View style={[{ width: btn * 1.9, height: btn * 1.9, alignItems: "center", justifyContent: "center" }, core]}>
          <Svg width={btn * 1.9} height={btn * 1.9} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="pc" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={colors.gold} stopOpacity={0.55} />
                <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={btn * 0.95} cy={btn * 0.95} r={btn * 0.95} fill="url(#pc)" />
          </Svg>
          <View style={[styles.disc, { width: btn, height: btn, borderRadius: btn / 2 }]}>
            <Svg width={btn * 0.46} height={btn * 0.46} viewBox="0 0 24 24">
              {recording
                ? <Path d="M6 6 H18 V18 H6 Z" fill={colors.gold} />
                : <Path d="M8 4.5 L19.5 12 L8 19.5 Z" fill={colors.gold} strokeLinejoin="round" stroke={colors.gold} strokeWidth={1.5} />}
            </Svg>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: "center", justifyContent: "center", backgroundColor: "#0b1220", borderWidth: 2.5, borderColor: colors.gold },
});
