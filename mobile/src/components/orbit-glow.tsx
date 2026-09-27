import { useId, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedProps, useFrameCallback, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Mask, RadialGradient, Rect, Stop } from "react-native-svg";

/* Der Leuchtrand, vierte Fassung (Antons Ansage 27.09.): „eine golden
 * schimmernde Hairline, poliert, die sich drum herum bewegt".
 *
 * Was NICHT wiederkommen soll:
 *   · zwei harte Striche übereinander (erste Fassung: „wie ein Bug"),
 *   · ein Band aus vielen kurzen Strichen (zweite: „eine Schlange"),
 *   · ein Band, dessen Farbverlauf mitwandern sollte (dritte: „kaputt").
 *     Ein Verlauf in <Defs>, dessen Koordinaten Reanimated jedes Bild neu
 *     setzt, aktualisiert react-native-svg auf dem Gerät nicht zuverlässig —
 *     das Band lief durch einen stehenden Verlauf und riss ab.
 *
 * Jetzt bewegt sich KEIN Verlauf mehr, nur Kreise (wie die Glühwürmchen am
 * Mond, das läuft sauber):
 *   · die Hairline selbst: 1 pt, gebürstetes Gold — ein fester Verlauf
 *     diagonal über den Knopf, hell und dunkel im Wechsel wie poliertes
 *     Metall; sie atmet leise;
 *   · der Schimmer: ein weicher Lichtfleck mit kurzem Schweif gleitet mit
 *     gleichmäßiger Geschwindigkeit den Rand entlang. Er ist durch eine
 *     Maske aus genau dieser Hairline zu sehen — er färbt nur die Linie,
 *     nie den Knopf;
 *   · der Schein: der iOS-Schatten der Ebene, golden — er folgt dem, was
 *     leuchtet, also vor allem dem Schimmer.
 * Die Ebene liegt ÜBER dem Knopf und fängt keine Tipps. */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const BREATH = 6000;       // ein Atemzug der Linie in ms
const TAIL = [0, 0.028, 0.056, 0.084];   // Schweif des Schimmers (Anteil des Umfangs)

type Geo = { x: number; y: number; w: number; h: number; r: number; per: number };

/* Punkt auf dem Rand des abgerundeten Rechtecks, u in [0,1) — im
   Uhrzeigersinn ab oben links. Gleichmäßig in der Bogenlänge, damit der
   Schimmer auf langen Kanten nicht kriecht und an den Enden nicht rast. */
function pointAt(u: number, g: Geo): [number, number] {
  "worklet";
  const { x, y, w, h, r, per } = g;
  const sw = w - 2 * r, sh = h - 2 * r, q = (Math.PI * r) / 2;
  let d = (((u % 1) + 1) % 1) * per;
  if (d < sw) return [x + r + d, y];
  if ((d -= sw) < q) { const a = -Math.PI / 2 + d / r; return [x + w - r + r * Math.cos(a), y + r + r * Math.sin(a)]; }
  if ((d -= q) < sh) return [x + w, y + r + d];
  if ((d -= sh) < q) { const a = d / r; return [x + w - r + r * Math.cos(a), y + h - r + r * Math.sin(a)]; }
  if ((d -= q) < sw) return [x + w - r - d, y + h];
  if ((d -= sw) < q) { const a = Math.PI / 2 + d / r; return [x + r + r * Math.cos(a), y + h - r + r * Math.sin(a)]; }
  if ((d -= q) < sh) return [x, y + h - r - d];
  d -= sh; const a = Math.PI + d / r; return [x + r + r * Math.cos(a), y + r + r * Math.sin(a)];
}

export function OrbitGlow({ radius, lap = 9000 }: { radius?: number; color?: string; lap?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [box, setBox] = useState({ w: 0, h: 0 });
  const t = useSharedValue(0);
  useFrameCallback((f) => { t.value = f.timeSinceFirstFrame; });

  const inset = 0.75;
  const w = Math.max(0, box.w - inset * 2), h = Math.max(0, box.h - inset * 2);
  const r = Math.min(radius ?? h / 2, h / 2, w / 2);
  const per = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const geo: Geo = { x: inset, y: inset, w, h, r, per };
  const spot = Math.max(16, Math.min(30, h * 0.55));

  const rim = useAnimatedProps(() => {
    const breath = 0.5 + 0.5 * Math.sin((t.value / BREATH) * Math.PI * 2);
    return { strokeOpacity: 0.42 + 0.2 * breath };
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.glow]} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {per > 0 ? (
        <Svg width={box.w} height={box.h}>
          <Defs>
            {/* Gebürstetes Gold: Licht und Schatten im Wechsel, diagonal. */}
            <LinearGradient id={`metal${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#9a7432" />
              <Stop offset="0.22" stopColor="#f7dea2" />
              <Stop offset="0.45" stopColor="#b88d3e" />
              <Stop offset="0.7" stopColor="#fff0c8" />
              <Stop offset="1" stopColor="#a57d37" />
            </LinearGradient>
            <RadialGradient id={`spot${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#fffaf0" stopOpacity={1} />
              <Stop offset="0.35" stopColor="#ffe3a6" stopOpacity={0.9} />
              <Stop offset="1" stopColor="#f2b35e" stopOpacity={0} />
            </RadialGradient>
            <Mask id={`line${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={box.w} height={box.h}>
              <Rect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke="#fff" strokeWidth={1.25} />
            </Mask>
          </Defs>
          <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none"
            stroke={`url(#metal${id})`} strokeWidth={1} animatedProps={rim} />
          <G mask={`url(#line${id})`}>
            {TAIL.map((lag, k) => <Spot key={k} t={t} geo={geo} lap={lap} lag={lag} size={spot * (1 - k * 0.14)} alpha={1 - k * 0.24} fill={`url(#spot${id})`} />)}
            {/* Ein leiser Widerschein gegenüber — das Metall fängt das Licht zweimal. */}
            <Spot t={t} geo={geo} lap={lap} lag={-0.5} size={spot * 0.8} alpha={0.28} fill={`url(#spot${id})`} />
          </G>
          <Sparkle t={t} geo={geo} lap={lap} />
        </Svg>
      ) : null}
    </View>
  );
}

function Spot({ t, geo, lap, lag, size, alpha, fill }: { t: SharedValue<number>; geo: Geo; lap: number; lag: number; size: number; alpha: number; fill: string }) {
  const props = useAnimatedProps(() => {
    const [cx, cy] = pointAt(t.value / lap - lag, geo);
    return { cx, cy, opacity: alpha };
  });
  return <AnimatedCircle r={size} fill={fill} animatedProps={props} />;
}

/* Ein einzelnes Funkeln genau an der Spitze des Schimmers: glimmt auf und
   vergeht, ein paar Mal pro Runde — der „Glanz" auf dem Metall. */
function Sparkle({ t, geo, lap }: { t: SharedValue<number>; geo: Geo; lap: number }) {
  const props = useAnimatedProps(() => {
    const [cx, cy] = pointAt(t.value / lap + 0.004, geo);
    const tw = Math.max(0, Math.sin(t.value / 700));
    return { cx, cy, opacity: tw * tw * 0.95, r: 0.6 + 0.9 * tw };
  });
  return <AnimatedCircle fill="#fffaf0" animatedProps={props} />;
}

const styles = StyleSheet.create({
  glow: { shadowColor: "#f4c27a", shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
});
