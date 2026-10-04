import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedStyle, useFrameCallback, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { useScreenActive } from "@/lib/use-screen-active";
import { colors } from "@/theme";

/* Das Traumportal (Antons Wahl 04.10., ersetzt den Mond als Aufnahmeknopf):
 * eine Spirale, die in die Tiefe zieht, Sterne fliegen hinein, in der
 * Mitte der goldene Knopf (Play = erzählen, Quadrat = fertig).
 *
 * Beim Sprechen dreht es schneller, zieht stärker und leuchtet heller —
 * `level` (0…1) kommt aus dem Rekorder, geglättet wie beim Mond.
 *
 * Leistung (Lehren vom 27.09.): Spirale, Sterne und Glühen sind STILLE
 * SVGs; bewegt werden nur native Ebenen (Drehung, Skalierung, Deckkraft).
 * Die Uhr läuft nur, solange der Tab zu sehen ist. */
const ARMS = 5;

export function PortalButton({ size = 150, recording, level, onPress, disabled, label }: {
  size?: number; recording: boolean; level: SharedValue<number>; onPress: () => void; disabled?: boolean; label: string;
}) {
  const stage = size * 2.3;
  const c = stage / 2;
  const R = stage * 0.5;

  /* Geglättete Stimme, Drehung und Tiefe als Eigenzeit — Tempowechsel
     verschieben nie die Phase, sie machen die Bewegung nur sanft schneller. */
  const sl = useSharedValue(0);
  const rot = useSharedValue(0);
  const zoom = useSharedValue(0);
  const clock = useFrameCallback((f) => {
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    sl.value += (level.value - sl.value) * Math.min(1, dt * 3);
    const speed = 0.35 + 1.4 * sl.value;
    rot.value = (rot.value + dt * speed * 34) % 360;          // Grad je Sekunde
    zoom.value = (zoom.value + dt * speed * 0.22) % 1;
  }, false);
  const active = useScreenActive();
  useEffect(() => { clock.setActive(active); }, [active, clock]);

  const rec = useSharedValue(0);
  useEffect(() => { rec.value = withTiming(recording ? 1 : 0, { duration: 500 }); }, [recording, rec]);
  const breath = useSharedValue(0);
  useEffect(() => { breath.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true); }, [breath]);

  /* Die Spirale: fünf logarithmische Arme, einmal gezeichnet. */
  const arms = useMemo(() => Array.from({ length: ARMS }, (_, k) => {
    let d = "";
    for (let s = 0; s <= 120; s++) {
      const f = s / 120;
      const rr = R * Math.pow(f, 1.8) * 1.05;
      const th = k * (Math.PI * 2 / ARMS) + f * 7.5;
      d += `${s ? "L" : "M"}${(c + Math.cos(th) * rr).toFixed(1)} ${(c + Math.sin(th) * rr * 0.92).toFixed(1)} `;
    }
    return d;
  }), [R, c]);
  /* Zwei Sternfelder; jedes zoomt nach innen, das zweite versetzt — so
     fliegt man endlos in die Tiefe. Dichter zur Mitte hin. */
  const stars = useMemo(() => {
    const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 3.1) * 43758.5453; return x - Math.floor(x); };
    return Array.from({ length: 46 }, (_, i) => {
      const a = rnd(i) * Math.PI * 2, r = R * (0.12 + 0.88 * Math.sqrt(rnd(i + 99)));
      return { x: c + Math.cos(a) * r, y: c + Math.sin(a) * r * 0.92, s: 0.6 + 1.8 * rnd(i + 7) };
    });
  }, [R, c]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }, { scale: 1 + 0.04 * sl.value }], opacity: 0.55 + 0.35 * sl.value + 0.1 * rec.value }));
  const layer = (offset: number) => () => {
    "worklet";
    const z = (zoom.value + offset) % 1;                // 0 außen … 1 in der Mitte
    return { transform: [{ rotate: `${rot.value * 0.5}deg` }, { scale: 1.5 - 1.25 * z }], opacity: Math.sin(z * Math.PI) * (0.7 + 0.3 * sl.value) };
  };
  const starsA = useAnimatedStyle(layer(0));
  const starsB = useAnimatedStyle(layer(0.5));
  const glow = useAnimatedStyle(() => ({ opacity: 0.45 + 0.2 * breath.value + 0.3 * sl.value, transform: [{ scale: 0.95 + 0.08 * breath.value + 0.15 * sl.value }] }));
  const core = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.03 * breath.value + 0.1 * sl.value }] }));
  const btn = size * 0.62;

  return (
    <View style={{ width: stage, height: stage, alignItems: "center", justifyContent: "center" }}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glow]}>
        <Svg width={stage} height={stage}>
          <Defs>
            <RadialGradient id="pg" cx={c} cy={c} r={R} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#8C84E8" stopOpacity={0.5} />
              <Stop offset="0.4" stopColor="#2F3C8C" stopOpacity={0.22} />
              <Stop offset="1" stopColor="#050A14" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={c} cy={c} r={R} fill="url(#pg)" />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, spin]}>
        <Svg width={stage} height={stage}>
          <Defs>
            <LinearGradient id="pa" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.gold} stopOpacity={0.75} />
              <Stop offset="1" stopColor="#8C84E8" stopOpacity={0.7} />
            </LinearGradient>
          </Defs>
          {arms.map((d, k) => <Path key={k} d={d} fill="none" stroke="url(#pa)" strokeWidth={1.6} strokeLinecap="round" />)}
        </Svg>
      </Animated.View>
      {[starsA, starsB].map((st, k) => (
        <Animated.View key={k} pointerEvents="none" style={[StyleSheet.absoluteFill, st]}>
          <Svg width={stage} height={stage}>
            {stars.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#FFF6DD" />)}
          </Svg>
        </Animated.View>
      ))}
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
