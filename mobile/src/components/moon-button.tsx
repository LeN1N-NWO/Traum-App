import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedProps, useAnimatedStyle, useFrameCallback, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { colors } from "@/theme";
import { moonIllumination, moonWaxing } from "../../../src/lib/moon.js";

/* Der Aufnahmeknopf ist der Mond (Antons Wahl 26.09.): der echte Mond der
 * letzten Nacht — dieselbe Rechnung wie der Mond-Streifen im Journal
 * (src/lib/moon.js) —, das Mikrofon in seiner Mitte, darum eine glühende
 * Aura, die langsam atmet. Beim Sprechen kommen Glühwürmchen: Sie treiben
 * sonst weit draußen und blass, und je lauter man erzählt, desto enger und
 * heller kreisen sie um den Mond. `level` (0…1) kommt aus dem Rekorder.
 * Alles bewegt sich auf dem UI-Thread; getippt wird nur die Mondscheibe. */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const FLIES = 14;

/* Der beleuchtete Teil als Pfad: Rand-Halbkreis auf der hellen Seite, zurück
   über die Schattengrenze (Ellipse mit rx = r·|1 − 2k|). Zunehmend ist die
   RECHTE Seite hell (Nordhalbkugel). */
function litPath(r: number, illum: number, waxing: boolean) {
  const k = Math.max(0, Math.min(1, illum));
  const rx = Math.abs(1 - 2 * k) * r;
  const gibbous = k > 0.5;
  const limb = waxing ? 1 : 0;
  const back = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
  return `M ${r} 0 A ${r} ${r} 0 0 ${limb} ${r} ${2 * r} A ${rx} ${r} 0 0 ${back} ${r} 0 Z`;
}

/* „Letzte Nacht": wer morgens erzählt, sah den Mond vom Abend davor. */
function lastNightMoon() {
  const night = new Date(Date.now() - 12 * 3600 * 1000);
  return { illum: moonIllumination(night) as number, waxing: moonWaxing(night) as boolean };
}

export function MoonButton({ size = 150, recording, level, onPress, disabled, label }: {
  size?: number; recording: boolean; level: SharedValue<number>; onPress: () => void; disabled?: boolean; label: string;
}) {
  const r = size / 2;
  const stage = size * 2.3;                     // Platz für Aura und Glühwürmchen
  const [moon] = useState(lastNightMoon);
  const darkIcon = moon.illum > 0.4;

  // Die Aura atmet (6 s), beim Aufnehmen heller und mit der Stimme größer.
  const breath = useSharedValue(0);
  useEffect(() => { breath.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true); }, [breath]);
  const rec = useSharedValue(0);
  useEffect(() => { rec.value = withTiming(recording ? 1 : 0, { duration: 500 }); }, [recording, rec]);
  const aura = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.25 * breath.value + 0.3 * rec.value,
    transform: [{ scale: 1 + 0.06 * breath.value + 0.18 * level.value }],
  }));
  const aura2 = useAnimatedStyle(() => ({
    opacity: (0.18 + 0.12 * breath.value) * (0.6 + 0.8 * rec.value),
    transform: [{ scale: 1.25 + 0.1 * breath.value + 0.3 * level.value }],
  }));
  const disc = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.035 * level.value }] }));

  const t = useSharedValue(0);
  useFrameCallback((f) => { t.value = f.timeSinceFirstFrame; });

  return (
    <View style={{ width: stage, height: stage, alignItems: "center", justifyContent: "center" }}>
      <Animated.View pointerEvents="none" style={[styles.glow, { width: size * 1.35, height: size * 1.35, borderRadius: size }, aura2]} />
      <Animated.View pointerEvents="none" style={[styles.glow, { width: size * 1.08, height: size * 1.08, borderRadius: size }, aura]} />
      <Svg width={stage} height={stage} style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: FLIES }, (_, i) => <Fly key={i} i={i} t={t} level={level} rec={rec} c={stage / 2} r={r} />)}
      </Svg>
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
        style={({ pressed }) => [{ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
        <Animated.View style={[{ width: size, height: size }, disc]}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="moonLit" cx="40%" cy="38%" r="70%">
                <Stop offset="0" stopColor="#fff6e4" />
                <Stop offset="0.7" stopColor="#f3e4c6" />
                <Stop offset="1" stopColor="#e3cfa9" />
              </RadialGradient>
            </Defs>
            {/* Der dunkle Teil schimmert leicht (Erdschein), damit der Knopf immer rund bleibt. */}
            <Circle cx={r} cy={r} r={r} fill="#1c2640" stroke="rgba(255,236,200,0.28)" strokeWidth={1} />
            <Path d={litPath(r, moon.illum, moon.waxing)} fill="url(#moonLit)" />
            {[[-0.3, -0.12, 0.2], [0.26, 0.22, 0.14], [0.05, -0.38, 0.1], [-0.12, 0.36, 0.09], [0.38, -0.2, 0.07]].map(([dx, dy, rr], k) => (
              <Circle key={k} cx={r + dx * r} cy={r + dy * r} r={rr * r} fill="rgba(150,130,100,0.16)" />
            ))}
          </Svg>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.icon}>
              <SymbolView name={recording ? "stop.fill" : "mic.fill"} size={size * 0.26} tintColor={darkIcon ? "rgba(12,20,35,0.78)" : colors.text} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

/* Ein Glühwürmchen: eigene Bahn, eigenes Tempo, eigenes Flackern. Ohne
   Stimme weit draußen und blass; mit Stimme enger, schneller, heller. */
function Fly({ i, t, level, rec, c, r }: { i: number; t: SharedValue<number>; level: SharedValue<number>; rec: SharedValue<number>; c: number; r: number }) {
  const seed = (i * 97.13) % 1;
  const speed = 0.00018 + ((i * 37) % 11) / 11 * 0.00016;
  const ph = i * 1.7;
  const far = r * (1.55 + ((i * 53) % 7) / 7 * 0.55);
  const near = r * (1.12 + ((i * 29) % 5) / 5 * 0.22);
  const props = useAnimatedProps(() => {
    const lv = level.value;
    const a = t.value * speed * (1 + 2.5 * lv) + ph + seed * 6.28;
    const dist = far + (near - far) * lv + Math.sin(t.value / (900 + i * 70) + ph) * r * 0.06;
    const glow = (0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t.value / (430 + i * 37) + ph))) * (0.35 + 0.65 * Math.max(lv, rec.value * 0.35));
    return { cx: c + Math.cos(a) * dist, cy: c + Math.sin(a) * dist * 0.92, opacity: glow, r: 1.6 + 1.4 * lv };
  });
  // Der weiche Schein um den Punkt: dieselbe Bahn, größer und blasser.
  const halo = useAnimatedProps(() => {
    const lv = level.value;
    const a = t.value * speed * (1 + 2.5 * lv) + ph + seed * 6.28;
    const dist = far + (near - far) * lv + Math.sin(t.value / (900 + i * 70) + ph) * r * 0.06;
    const glow = (0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t.value / (430 + i * 37) + ph))) * (0.35 + 0.65 * Math.max(lv, rec.value * 0.35));
    return { cx: c + Math.cos(a) * dist, cy: c + Math.sin(a) * dist * 0.92, opacity: glow * 0.28, r: 5 + 4 * lv };
  });
  return (
    <>
      <AnimatedCircle fill="#ffd58f" animatedProps={halo} />
      <AnimatedCircle fill="#fff1d2" animatedProps={props} />
    </>
  );
}

const styles = StyleSheet.create({
  glow: { position: "absolute", backgroundColor: "rgba(255,213,143,0.10)", shadowColor: "#ffd58f", shadowOpacity: 0.9, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  icon: { flex: 1, alignItems: "center", justifyContent: "center" },
});
