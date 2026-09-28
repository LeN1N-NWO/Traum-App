import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedProps, useFrameCallback, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useScreenActive } from "@/lib/use-screen-active";

/* Der Leuchtrand, sechste Fassung (Antons Wahl 27.09. aus dem Variantenbuch):
 *
 *   · „Lichtstrahl" auf jedem Hauptknopf — eine kaum sichtbare Linie, um
 *     die ein kurzer, heller Strahl mit warmem Schweif läuft (Vorlage:
 *     Magic UI „Border Beam");
 *   · `spend` — Knöpfe, die Credits ausgeben: zusätzlich der „atmende
 *     Rand": die Linie ist goldenes Metall, ihr Schein schwillt ruhig an
 *     und ab. So sieht man vor dem Tippen, dass es etwas kostet.
 *
 * Was NICHT wiederkommen soll:
 *   · zwei harte Striche übereinander (erste Fassung: „wie ein Bug"),
 *   · viele kurze Striche mit runden Kappen (zweite: „eine Schlange"),
 *   · ein mitwandernder Farbverlauf (dritte: „kaputt") — Verlaufs-
 *     Koordinaten, die Reanimated jedes Bild neu setzt, aktualisiert
 *     react-native-svg auf dem Gerät nicht zuverlässig,
 *   · Kreise hinter einer Maske (fünfte: sah gut aus, aber die Maske wird
 *     bei jedem Bild neu gerechnet — iOS meldete Dauerlast).
 *
 * Jetzt: fünf deckungsgleiche Striche auf der Randlinie, jeder EIN
 * Strichstück mit glatten Enden, alle mit gemeinsamem Kopf und
 * verschieden lang — übereinander ergibt das einen Strahl, der zum Kopf
 * hin heller wird. Bewegt wird nur der Strich-Versatz (strokeDashoffset),
 * keine Maske, kein Verlauf. Unsichtbare Bildschirme halten an
 * (useScreenActive). Die Ebene liegt ÜBER dem Knopf und fängt keine Tipps. */
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const LAP = 5200;                         // eine Runde des Strahls in ms
const BEAM = 0.13;                        // Länge des Strahls (Anteil des Umfangs)
const BREATH = 5000;                      // ein Atemzug des Credit-Rands in ms
const PAD = 4;
/* Die Schichten vom Schweif zum Kopf: Anteil der Strahllänge, Farbe, Deckkraft, Breite. */
const LAYERS: [number, string, number, number][] = [
  [0.6, "#ffd58f", 0.12, 6],                 // der Schein um den Kopf (statt Schatten)
  [1.0, "#f2a765", 0.28, 1.3],
  [0.7, "#f6b86e", 0.32, 1.3],
  [0.45, "#ffd58f", 0.4, 1.4],
  [0.24, "#fff0cc", 0.6, 1.6],
  [0.08, "#fffaf0", 1, 2],
];

export function OrbitGlow({ radius, lap = LAP, spend = false }: { radius?: number; lap?: number; spend?: boolean }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const active = useScreenActive();
  const t = useSharedValue(0);
  const clock = useFrameCallback((f) => { t.value += f.timeSincePreviousFrame ?? 16; }, false);
  useEffect(() => { clock.setActive(active); }, [active, clock]);
  const breath = useSharedValue(0);
  useEffect(() => {
    if (spend) breath.value = withRepeat(withTiming(1, { duration: BREATH, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [spend, breath]);

  // Die Ebene ragt PAD über den Knopf hinaus, damit der breite Schein nicht abgeschnitten wird.
  const inset = PAD + 0.75;
  const w = Math.max(0, box.w - inset * 2), h = Math.max(0, box.h - inset * 2);
  const r = Math.min(radius ?? h / 2, h / 2, w / 2);
  const per = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;

  /* ⚠ Kein iOS-Schatten mehr (28.09.): Ein Schatten über einer Ebene, deren
     Inhalt sich jedes Bild ändert, rechnet Core Animation jedes Bild neu —
     das war die Dauerlast (cpu_resource 63 %). Der Schein ist jetzt eine
     breite, blasse Linie im selben SVG. */
  const rim = useAnimatedProps(() => ({ strokeOpacity: spend ? 0.55 + 0.4 * breath.value : 1 }));
  const aura = useAnimatedProps(() => ({ strokeOpacity: 0.1 + 0.22 * breath.value }));

  return (
    <View style={styles.over} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {per > 0 ? (
          <Svg width={box.w} height={box.h}>
            <Defs>
              {/* Gebürstetes Gold für den Credit-Rand: hell und dunkel im Wechsel. */}
              <LinearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#9a7432" />
                <Stop offset="0.22" stopColor="#f7dea2" />
                <Stop offset="0.45" stopColor="#b88d3e" />
                <Stop offset="0.7" stopColor="#fff0c8" />
                <Stop offset="1" stopColor="#a57d37" />
              </LinearGradient>
            </Defs>
            {spend ? (
              <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke="#f6c65b" strokeWidth={6} animatedProps={aura} />
            ) : null}
            {spend ? (
              <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke="url(#metal)" strokeWidth={1} animatedProps={rim} />
            ) : (
              <Rect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
            )}
            {LAYERS.map(([part, color, alpha, width], k) => (
              <Beam key={k} t={t} lap={lap} per={per} len={BEAM * part * per} color={color} alpha={alpha} width={width}
                x={inset} y={inset} w={w} h={h} r={r} />
            ))}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

/* Ein Strichstück der Länge `len`, dessen Ende auf dem Kopf des Strahls sitzt. */
function Beam({ t, lap, per, len, color, alpha, width, x, y, w, h, r }: { t: SharedValue<number>; lap: number; per: number; len: number; color: string; alpha: number; width: number; x: number; y: number; w: number; h: number; r: number }) {
  const props = useAnimatedProps(() => {
    const head = ((t.value / lap) % 1) * per;
    return { strokeDashoffset: -(head - len) };
  });
  return <AnimatedRect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="none" stroke={color} strokeOpacity={alpha} strokeWidth={width}
    strokeLinecap="butt" strokeDasharray={[len, Math.max(0.01, per - len)]} animatedProps={props} />;
}

const styles = StyleSheet.create({
  over: { position: "absolute", top: -PAD, left: -PAD, right: -PAD, bottom: -PAD },
});
