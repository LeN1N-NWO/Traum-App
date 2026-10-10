import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue } from "react-native-reanimated";
import { useAmbient } from "@/lib/ambient-clock";
import { CORE, DISK, GX, GY, INFALL, SKY_STARS, STAGE_H, STAGE_W } from "@/lib/galaxy-geometry";
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
 * schneller drehen und heller leuchten — wie vorher das Portal.
 *
 * ⚠ Halo, Scheibe, Spirale und Kern sind seit 10.10. BILDER
 * (assets/galaxy, gerendert von scripts/galaxy-art.mjs aus
 * lib/galaxy-geometry.ts). Antons Befund: „beim ersten Öffnen des
 * Traum-Tabs ein kleiner Lag, das Glas unter dem Traum-Symbol bleibt
 * stehen, bis es lädt." Gemessen: react-native-svg malte die Spirale (63
 * Fäden mit Farbverlauf, je einer eigenen Zwischenebene) auf der CPU, im
 * Hauptthread, gut eine Sekunde lang. Bilder dekodiert iOS im Hintergrund;
 * gedreht und überblendet wird auf der Grafikkarte. Nur die Sterne, die
 * nichts kosten, sind noch SVG. Formen ändern → Bilder neu rendern. */

/* Die stillen Ebenen (assets/galaxy — scripts/galaxy-art.mjs). */
const ART = {
  halo: require("../../assets/galaxy/halo.webp"),
  disk: require("../../assets/galaxy/disk.webp"),
  spiral: require("../../assets/galaxy/spiral.webp"),
  core: require("../../assets/galaxy/core.webp"),
};
const FALL = 1 / 10;    // eine Reise vom Rand in die Mitte je 10 s
/* Beim allerersten Mal kommen die Bilder einen Augenblick nach dem Bildschirm
   (Dekodieren im Hintergrund) — dann blenden sie weich ein, statt aufzuploppen. */
const FADE = 260;
const TURN = 360 / 140; // Grad je Sekunde
/* Phasen in Sekunden: 18 s Halo, 14 s Kern — 126 ist beider Vielfaches. */
const CYCLE = 126;

export const Galaxy = memo(function Galaxy({ size, scale = 1, intensity = 1, animated = true, speed = 1, infall = false, level }: {
  /** Kantenlänge des quadratischen Kastens, in dessen Mitte die Galaxie sitzt (sie darf seitlich überstehen). */
  size: number;
  /** Zusätzlicher Zoom; 1 = Scheibe etwa 1,5 × Kastenbreite. */
  scale?: number;
  /** Gesamthelligkeit 0…1. */
  intensity?: number;
  animated?: boolean;
  /** Drehtempo; 1 = eine Umdrehung in 140 s wie auf der Website. */
  speed?: number;
  /** Teilchen, die vom Rand in den Kern fallen (Traumportal). */
  infall?: boolean;
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
  const fall = useSharedValue(0);
  /* Im gemeinsamen 30er-Takt (lib/ambient-clock.tsx, 10.10., Energie):
     Vorher eigener Takt mit jedem Bild — auf ProMotion 120 Runden je
     Sekunde durch Schattenbaum und Layout. Die Drehung ist so langsam, dass
     30 Schritte je Sekunde nicht zu sehen sind. */
  const reduce = useReducedMotion();
  const active = useScreenActive() && animated && !reduce;
  const clock = useAmbient(active);
  useAnimatedReaction(() => clock.value, (now, prev) => {
    if (!active || prev == null) return;
    const dt = Math.min(0.1, Math.max(0, (now - prev) / 1000));
    sl.value += (voice.value - sl.value) * Math.min(1, dt * 3);
    t.value = (t.value + dt) % CYCLE;
    rot.value = (rot.value + dt * TURN * speed * (1 + 7 * sl.value)) % 360;
    fall.value = (fall.value + dt * FALL * (1 + 2 * sl.value)) % 1;
  }, [active, speed]);

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

  /* Ein Feld: außen groß und blass, wird kleiner, dreht sich hinein und
     verlischt im Kern (z 0 → 1). */
  const layerOf = (k: number) => () => {
    "worklet";
    const z = (fall.value + k / 3) % 1;
    return {
      opacity: Math.pow(Math.sin(Math.PI * z), 0.8) * (0.75 + 0.25 * sl.value),
      transform: [{ rotate: `${rot.value + k * 120 + z * 110}deg` }, { scale: 1.25 - 1.15 * z }],
    };
  };
  const fall0 = useAnimatedStyle(layerOf(0));
  const fall1 = useAnimatedStyle(layerOf(1));
  const fall2 = useAnimatedStyle(layerOf(2));
  const falls = [fall0, fall1, fall2];

  const stage = { position: "absolute" as const, width: STAGE_W * s, height: STAGE_H * s, left: c - GX * s, top: c - GY * s };
  const disk = DISK * s, coreSize = CORE * s;

  /* Die stillen Zeichnungen — nur neu, wenn sich die Größe ändert. */
  const layers = useMemo(() => ({
    halo: <Image source={ART.halo} style={StyleSheet.absoluteFill} contentFit="fill" transition={FADE} />,
    sky: <Dots list={SKY_STARS} s={s} color={() => "204,219,250"} />,
    // Die Scheibe ist rund — sie darf mitdrehen, ohne dass man es sieht.
    spiral: (
      <>
        <Image source={ART.disk} style={StyleSheet.absoluteFill} contentFit="fill" transition={FADE} />
        <Image source={ART.spiral} style={StyleSheet.absoluteFill} contentFit="fill" transition={FADE} />
      </>
    ),
    infall: INFALL.map((field, k) => <Dots key={k} list={field} s={s} at={DISK / 2} color={(p) => (p.warm ? "255,241,214" : "226,227,255")} />),
    core: <Image source={ART.core} style={StyleSheet.absoluteFill} contentFit="fill" transition={FADE} />,
  }), [s]);

  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
      <Animated.View style={[stage, halo]}>{layers.halo}</Animated.View>
      <View style={stage}>{layers.sky}</View>
      {/* Die Scheibe: schräg (−21°) und geplättet (.54) — darin dreht sich die Spirale. */}
      <View style={{ position: "absolute", width: disk, height: disk, left: c - disk / 2, top: c - disk / 2, transform: [{ rotate: "-21deg" }, { scaleY: 0.54 }] }}>
        <Animated.View style={[StyleSheet.absoluteFill, spin]}>{layers.spiral}</Animated.View>
        {infall && !reduce ? layers.infall.map((field, k) => <Animated.View key={k} style={[StyleSheet.absoluteFill, falls[k]]}>{field}</Animated.View>) : null}
        <Animated.View style={[{ position: "absolute", width: coreSize, height: coreSize, left: (disk - coreSize) / 2, top: (disk - coreSize) / 2 }, core]}>{layers.core}</Animated.View>
      </View>
    </View>
  );
});

/* Sterne und Teilchen als winzige native Punkte (10.10.): Als SVG brauchte
   jedes Feld eine Zeichenfläche so groß wie die Scheibe — vier Flächen,
   ~85 MB, für 150 Punkte. Ein Punkt ist ein runder View; die Grafikkarte
   setzt ihn, nichts wird gemalt. `at` verschiebt den Ursprung (Scheibe:
   Mitte), Einheiten wie auf der Website, `s` rechnet sie in Punkte. */
type Dot = { x: number; y: number; r: number; o: number; warm?: boolean };
const Dots = memo(function Dots({ list, s, at = 0, color }: { list: Dot[]; s: number; at?: number; color: (p: Dot) => string }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {list.map((p, i) => {
        const d = Math.max(1, 2 * p.r * s);
        return <View key={i} style={{ position: "absolute", left: (at + p.x) * s - d / 2, top: (at + p.y) * s - d / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: `rgba(${color(p)},${p.o})` }} />;
      })}
    </View>
  );
});
