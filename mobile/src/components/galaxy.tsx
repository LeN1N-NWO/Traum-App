import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";
import { useScreenActive } from "@/lib/use-screen-active";

/* Die Galaxie der Website (Antons Wahl 09.10., ersetzt die Spirale des
 * Traumportals). Vorlage: DreamRushes-Landingpage/site/handoff/
 * galaxy-for-claude (GalaxyClosing.astro, night-motion.ts #dr-universe).
 *
 * Eine schräg gesehene Spiralgalaxie: drei Arme aus je 18 feinen Fäden,
 * 180 Sterne auf den Armen, ein Halo, ein leuchtender Kern, 48 stille
 * Hintergrundsterne. Geometrie und Zufall wie auf der Website (gleiche
 * Formeln, gleiche Startwerte), in deren Einheiten (Bühne 1440 × 850)
 * und per viewBox skaliert — einmal gerechnet, nie pro Bild.
 *
 * Bewegung wie auf der Website: Spirale samt Sternen eine Umdrehung in
 * 140 s, Halo atmet 1 → .65 in 9 s, Kern 1 → 1.14 / 1 → .7 in 7 s. Die
 * Scheibe bleibt schräg, gedreht wird nur IN ihr (geplättete Elternebene,
 * drehendes Kind). Bewegt werden nur native Ebenen (Drehung, Skalierung,
 * Deckkraft), die SVGs sind still. Eine eigene Uhr hält die Phase, wenn
 * der Tab oder die App pausiert. Bei „Bewegung reduzieren" steht sie
 * still in ihrer Grundpose.
 *
 * In der App neu: `level` (0…1, die Stimme beim Aufnehmen) lässt sie
 * schneller drehen und heller leuchten — wie vorher das Portal. */

const rand = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const point = (r: number, arm: number, offset = 0) => {
  const th = arm * Math.PI * 2 / 3 + Math.pow(1 - r / 650, 1.2) * 5.8 + offset;
  return [Math.cos(th) * r, Math.sin(th) * r] as const;
};
const FILAMENTS = Array.from({ length: 54 }, (_, i) => {
  const arm = Math.floor(i / 18), offset = ((i % 18) - 8.5) * 0.026;
  let d = "";
  for (let j = 0; j < 80; j++) {
    const [x, y] = point(30 + j * 7.45, arm, offset);
    d += `${j ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return { d, o: 0.2 + rand(i + 71) * 0.48 };
});
const ARM_STARS = Array.from({ length: 180 }, (_, i) => {
  const [x, y] = point(40 + rand(i + 20) * 545, i % 3, (rand(i + 411) - 0.5) * 0.54);
  return { x, y, r: 0.65 + rand(i + 51) * 1.55, o: 0.3 + rand(i + 151) * 0.65 };
});
const SKY_STARS = Array.from({ length: 48 }, (_, i) => ({
  x: rand(i + 710) * 1440, y: rand(i + 1100) * 850, r: i % 7 === 0 ? 1.5 : 0.8, o: 0.1 + rand(i + 931) * 0.35,
}));

/* Bühne der Website und Mitte der Scheibe darin. */
const STAGE_W = 1440, STAGE_H = 850, GX = 720, GY = 430;
const DISK = 1300;      // Kasten der drehenden Ebene (Fäden reichen bis r ≈ 619)
const CORE = 390;       // Kern r = 195
const TURN = 360 / 140; // Grad je Sekunde
/* Phasen in Sekunden: 18 s Halo, 14 s Kern — 126 ist beider Vielfaches. */
const CYCLE = 126;

export const Galaxy = memo(function Galaxy({ size, scale = 1, intensity = 1, animated = true, speed = 1, level }: {
  /** Kantenlänge des quadratischen Kastens, in dessen Mitte die Galaxie sitzt (sie darf seitlich überstehen). */
  size: number;
  /** Zusätzlicher Zoom; 1 = Scheibe etwa 1,5 × Kastenbreite. */
  scale?: number;
  /** Gesamthelligkeit 0…1. */
  intensity?: number;
  animated?: boolean;
  /** Drehtempo; 1 = eine Umdrehung in 140 s wie auf der Website. */
  speed?: number;
  /** Stimme 0…1 (geglättet), optional. */
  level?: SharedValue<number>;
}) {
  const s = (size / 820) * scale;            // Website-Einheit → Punkte
  const c = size / 2;

  const zero = useSharedValue(0);
  const voice = level ?? zero;
  const t = useSharedValue(0);
  const rot = useSharedValue(0);
  const sl = useSharedValue(0);
  const clock = useFrameCallback((f) => {
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    sl.value += (voice.value - sl.value) * Math.min(1, dt * 3);
    t.value = (t.value + dt) % CYCLE;
    rot.value = (rot.value + dt * TURN * speed * (1 + 7 * sl.value)) % 360;
  }, false);
  const reduce = useReducedMotion();
  const active = useScreenActive() && animated && !reduce;
  useEffect(() => { clock.setActive(active); }, [active, clock]);

  // sin-Kurve hin und zurück: (1 − cos(π·t/T)) / 2 läuft in T Sekunden 0 → 1 und wieder zurück.
  const halo = useAnimatedStyle(() => {
    const e = (1 - Math.cos(Math.PI * t.value / 9)) / 2;
    return { opacity: Math.min(1, 1 - 0.35 * e + 0.35 * sl.value) };
  });
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const core = useAnimatedStyle(() => {
    const e = (1 - Math.cos(Math.PI * t.value / 7)) / 2;
    return { opacity: Math.min(1, 1 - 0.3 * e + 0.3 * sl.value), transform: [{ scale: (1 + 0.14 * e) * (1 + 0.12 * sl.value) }] };
  });

  const stage = { position: "absolute" as const, width: STAGE_W * s, height: STAGE_H * s, left: c - GX * s, top: c - GY * s };
  const disk = DISK * s, coreSize = CORE * s;

  /* Die stillen Zeichnungen — nur neu, wenn sich die Größe ändert. */
  const layers = useMemo(() => ({
    halo: (
      <Svg width={STAGE_W * s} height={STAGE_H * s} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
        <Defs>
          <RadialGradient id="gx-halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#9774ea" stopOpacity={0.35} />
            <Stop offset="0.42" stopColor="#694dc9" stopOpacity={0.17} />
            <Stop offset="1" stopColor="#47398c" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={720} cy={425} rx={660} ry={395} fill="url(#gx-halo)" />
      </Svg>
    ),
    sky: (
      <Svg width={STAGE_W * s} height={STAGE_H * s} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
        {SKY_STARS.map((st, i) => <Circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#ccdbfa" opacity={st.o} />)}
      </Svg>
    ),
    // Die Scheibe ist rund — sie darf mitdrehen, ohne dass man es sieht.
    spiral: (
      <Svg width={disk} height={disk} viewBox={`${-DISK / 2} ${-DISK / 2} ${DISK} ${DISK}`}>
        <Defs>
          <RadialGradient id="gx-disk" cx="0" cy="0" r="620" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#7b76e9" stopOpacity={0.17} />
            <Stop offset="0.8" stopColor="#5b4ba0" stopOpacity={0.06} />
            <Stop offset="1" stopColor="#4a3c80" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="gx-thread" cx="0" cy="0" r="650" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#dfcaff" />
            <Stop offset="0.2" stopColor="#b993f4" />
            <Stop offset="0.58" stopColor="#8a68e3" />
            <Stop offset="0.84" stopColor="#6989dc" stopOpacity={0.6} />
            <Stop offset="1" stopColor="#6989dc" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle r={620} fill="url(#gx-disk)" />
        {/* jeder sechste Faden zusätzlich breit und kaum sichtbar — weiches Licht ohne Unschärfe-Filter */}
        {FILAMENTS.filter((_, i) => i % 6 === 0).map((f, i) => <Path key={`b${i}`} d={f.d} fill="none" stroke="url(#gx-thread)" strokeOpacity={0.045} strokeWidth={22} />)}
        {FILAMENTS.map((f, i) => <Path key={i} d={f.d} fill="none" stroke="url(#gx-thread)" strokeOpacity={f.o} strokeWidth={1.5} />)}
        {ARM_STARS.map((st, i) => <Circle key={`s${i}`} cx={st.x} cy={st.y} r={st.r} fill="#d0d3ff" opacity={st.o} />)}
      </Svg>
    ),
    core: (
      <Svg width={coreSize} height={coreSize} viewBox={`${-CORE / 2} ${-CORE / 2} ${CORE} ${CORE}`}>
        <Defs>
          <RadialGradient id="gx-core" cx="0" cy="0" r="195" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#e3d7ff" stopOpacity={0.9} />
            <Stop offset="0.09" stopColor="#c3adf6" stopOpacity={0.65} />
            <Stop offset="0.3" stopColor="#9172dc" stopOpacity={0.26} />
            <Stop offset="1" stopColor="#756be2" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle r={195} fill="url(#gx-core)" />
      </Svg>
    ),
  }), [s, disk, coreSize]);

  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
      <Animated.View style={[stage, halo]}>{layers.halo}</Animated.View>
      <View style={stage}>{layers.sky}</View>
      {/* Die Scheibe: schräg (−21°) und geplättet (.54) — darin dreht sich die Spirale. */}
      <View style={{ position: "absolute", width: disk, height: disk, left: c - disk / 2, top: c - disk / 2, transform: [{ rotate: "-21deg" }, { scaleY: 0.54 }] }}>
        <Animated.View style={[StyleSheet.absoluteFill, spin]}>{layers.spiral}</Animated.View>
        <Animated.View style={[{ position: "absolute", width: coreSize, height: coreSize, left: (disk - coreSize) / 2, top: (disk - coreSize) / 2 }, core]}>{layers.core}</Animated.View>
      </View>
    </View>
  );
});
