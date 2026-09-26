import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedProps, useAnimatedStyle, useFrameCallback, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import Svg, { Circle, Path } from "react-native-svg";
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
const MOON = require("../../assets/moon/moon-disc.png");
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

  /* Geglättete Stimme und Eigenzeit — siehe Fly. */
  const sl = useSharedValue(0);
  const tau = useSharedValue(0);
  useFrameCallback((f) => {
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    sl.value += (level.value - sl.value) * Math.min(1, dt * 2.2);
    tau.value += dt * (1 + 0.9 * sl.value);
  });

  // Die Aura atmet (6 s), beim Aufnehmen heller und mit der Stimme größer.
  const breath = useSharedValue(0);
  useEffect(() => { breath.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true); }, [breath]);
  const rec = useSharedValue(0);
  useEffect(() => { rec.value = withTiming(recording ? 1 : 0, { duration: 500 }); }, [recording, rec]);
  const aura = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.25 * breath.value + 0.3 * rec.value,
    transform: [{ scale: 1 + 0.06 * breath.value + 0.14 * sl.value }],
  }));
  const aura2 = useAnimatedStyle(() => ({
    opacity: (0.18 + 0.12 * breath.value) * (0.6 + 0.8 * rec.value),
    transform: [{ scale: 1.25 + 0.1 * breath.value + 0.22 * sl.value }],
  }));
  const disc = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.03 * sl.value }] }));


  return (
    <View style={{ width: stage, height: stage, alignItems: "center", justifyContent: "center" }}>
      <Animated.View pointerEvents="none" style={[styles.glow, { width: size * 1.35, height: size * 1.35, borderRadius: size }, aura2]} />
      <Animated.View pointerEvents="none" style={[styles.glow, { width: size * 1.08, height: size * 1.08, borderRadius: size }, aura]} />
      <Svg width={stage} height={stage} style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: FLIES }, (_, i) => <Fly key={i} i={i} tau={tau} sl={sl} c={stage / 2} r={r} />)}
      </Svg>
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
        style={({ pressed }) => [{ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
        <Animated.View style={[{ width: size, height: size }, disc]}>
          {/* Der echte Mond (Antons Ansage 26.09.: „ein Bild vom echten Mond"):
              die Vorderseite aus der LRO-Farbkarte der NASA (Scientific
              Visualization Studio, CGI Moon Kit, gemeinfrei), orthografisch
              auf eine Scheibe gerechnet (assets/moon/moon-disc.png). */}
          <Image source={MOON} style={{ width: size, height: size }} contentFit="contain" />
          {/* Die Nachtseite: dunkel, aber nicht schwarz — der Erdschein lässt
              die Oberfläche ahnen, und der Knopf bleibt immer rund. */}
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            <Path d={litPath(r, 1 - moon.illum, !moon.waxing)} fill="rgba(4,9,20,0.86)" />
          </Svg>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.icon}>
              <View style={[styles.iconDisc, { width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18 }]}>
                <SymbolView name={recording ? "stop.fill" : "mic.fill"} size={size * 0.17} tintColor={colors.text} />
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

/* Ein Glühwürmchen (zweite Fassung, Antons Befund 26.09.: „die zittern,
   sie sollen smooth fliegen, jedes random, nicht wie Planeten auf
   Umlaufbahnen"). Jedes hat einen eigenen Ruheplatz um den Mond und
   schwirrt dort in einer Überlagerung langsamer Sinuswellen mit krummen
   Frequenzen — das wirkt zufällig und wiederholt sich kaum. Beim Sprechen
   rückt der Platz weiter nach außen und nach oben, und es wird heller.
   Kein Zittern: Die Stimme kommt nur GEGLÄTTET an (`sl`, ≈ 0,5 s), und die
   Zeit läuft als aufsummierte Eigenzeit (`tau`) — Tempowechsel verschieben
   nie die Phase, sie machen die Bewegung nur sanft schneller. */
function Fly({ i, tau, sl, c, r }: { i: number; tau: SharedValue<number>; sl: SharedValue<number>; c: number; r: number }) {
  const h = (k: number) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const theta = h(1) * Math.PI * 2;
  const baseR = r * (1.25 + 0.7 * h(2));
  const f = [0.18 + 0.2 * h(3), 0.11 + 0.17 * h(4), 0.16 + 0.22 * h(5), 0.09 + 0.15 * h(6), 0.05 + 0.08 * h(7), 0.6 + 0.9 * h(8)];
  const p = [h(9), h(10), h(11), h(12), h(13), h(14)].map((x) => x * Math.PI * 2);
  const lift = 0.5 + 0.5 * h(15);
  const place = (t: number, s: number) => {
    "worklet";
    const a = theta + 0.35 * Math.sin(t * f[4] + p[4]);
    const R = baseR * (1 + 0.32 * s);
    const nx = r * 0.26 * (Math.sin(t * f[0] + p[0]) + 0.55 * Math.sin(t * f[1] * 1.7 + p[1]));
    const ny = r * 0.22 * (Math.sin(t * f[2] + p[2]) + 0.55 * Math.sin(t * f[3] * 1.9 + p[3]));
    return { x: c + Math.cos(a) * R + nx, y: c + Math.sin(a) * R * 0.9 + ny - s * r * 0.45 * lift };
  };
  const props = useAnimatedProps(() => {
    const s = sl.value, t = tau.value;
    const q = place(t, s);
    const glow = (0.4 + 0.35 * (0.5 + 0.5 * Math.sin(t * f[5] + p[5]))) * (0.45 + 0.55 * s);
    return { cx: q.x, cy: q.y, opacity: glow, r: 1.6 + 0.9 * s };
  });
  // Der weiche Schein um den Punkt: derselbe Platz, größer und blasser.
  const halo = useAnimatedProps(() => {
    const s = sl.value, t = tau.value;
    const q = place(t, s);
    const glow = (0.4 + 0.35 * (0.5 + 0.5 * Math.sin(t * f[5] + p[5]))) * (0.45 + 0.55 * s);
    return { cx: q.x, cy: q.y, opacity: glow * 0.3, r: 5 + 3 * s };
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
  iconDisc: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,10,20,0.45)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.3)" },
});
