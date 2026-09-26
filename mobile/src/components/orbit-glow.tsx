import { useId, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedProps, useFrameCallback, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/* Der Leuchtrand (Antons Ansage 26.09., dritte Fassung): „eine goldene
   Linie am Rand, die leicht pulsiert und sich bewegt, mit Glow" — wie die
   Vorschau im Browser, die er hübsch fand.
 *
 * Was NICHT wiederkommen soll:
 *   · zwei harte Striche übereinander (erste Fassung: „wie ein Bug"),
 *   · ein Band aus vielen kurzen Strichen mit runden Kappen (zweite
 *     Fassung: „eine Schlange aus kleinen Teilen").
 *
 * Deshalb ist das Band jetzt EIN einziger Strich mit einem echten
 * Farbverlauf: Der Verlauf wird in Bildkoordinaten vom Schwanz zum Kopf des
 * Bandes gespannt und läuft mit — an beiden Enden durchsichtig, in der
 * Mitte Gold. Auf einem Knopf liegt das Band fast immer auf einer geraden
 * Kante, dort ist der lineare Verlauf exakt; um die Rundungen herum bleibt
 * er weich. Der Schein ist der iOS-Schatten der Ebene (folgt der Form).
 * Alles hängt an einer durchlaufenden Uhr (useFrameCallback), nichts
 * springt. Die Ebene liegt ÜBER dem Knopf und fängt keine Tipps. */
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const GOLD = "#ffd58f";
const WARM = "#f2a765";
const BAND = 0.32;         // Anteil des Umfangs, den das Band einnimmt
const BREATH = 5200;       // ein Atemzug in ms
const SPARKS = 3;

type Geo = { x: number; y: number; w: number; h: number; r: number; per: number };

/* Punkt auf dem Rand des abgerundeten Rechtecks, u in [0,1) — im
   Uhrzeigersinn ab oben links, genau wie der Strich des SVG-Rechtecks. */
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

export function OrbitGlow({ radius, lap = 12000 }: { radius?: number; color?: string; lap?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [box, setBox] = useState({ w: 0, h: 0 });
  const t = useSharedValue(0);
  useFrameCallback((f) => { t.value = f.timeSinceFirstFrame; });

  const inset = 1.5;
  const w = Math.max(0, box.w - inset * 2), h = Math.max(0, box.h - inset * 2);
  const r = Math.min(radius ?? h / 2, h / 2, w / 2);
  // Umfang eines abgerundeten Rechtecks: gerade Stücke + ein ganzer Kreis.
  const per = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const geo: Geo = { x: inset, y: inset, w, h, r, per };
  const band = BAND * per;

  // Der Verlauf spannt sich vom Schwanz zum Kopf des Bandes.
  const grad = useAnimatedProps(() => {
    const head = t.value / lap;
    const [x1, y1] = pointAt(head - BAND, geo);
    const [x2, y2] = pointAt(head, geo);
    return { x1, y1, x2, y2 };
  });
  // Das Band selbst: die Lücke im Strichmuster wandert, der Rand atmet.
  const line = useAnimatedProps(() => {
    const start = (((t.value / lap - BAND) % 1) + 1) % 1;
    const breath = 0.5 + 0.5 * Math.sin((t.value / BREATH) * Math.PI * 2);
    return { strokeDashoffset: -start * per, strokeOpacity: 0.75 + 0.25 * breath };
  });
  const body = useAnimatedProps(() => {
    const start = (((t.value / lap - BAND) % 1) + 1) % 1;
    const breath = 0.5 + 0.5 * Math.sin((t.value / BREATH) * Math.PI * 2);
    return { strokeDashoffset: -start * per, strokeOpacity: 0.22 + 0.16 * breath };
  });
  // Die feine Linie rundum: immer da, atmet leise mit.
  const rim = useAnimatedProps(() => {
    const breath = 0.5 + 0.5 * Math.sin((t.value / BREATH) * Math.PI * 2);
    return { strokeOpacity: 0.16 + 0.12 * breath };
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.glow]} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {per > 0 ? (
        <Svg width={box.w} height={box.h}>
          <Defs>
            <AnimatedGradient id={`band${id}`} gradientUnits="userSpaceOnUse" animatedProps={grad}>
              <Stop offset="0" stopColor={WARM} stopOpacity={0} />
              <Stop offset="0.3" stopColor={WARM} stopOpacity={0.85} />
              <Stop offset="0.62" stopColor={GOLD} stopOpacity={1} />
              <Stop offset="1" stopColor="#fff6e4" stopOpacity={0} />
            </AnimatedGradient>
          </Defs>
          <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none"
            stroke={GOLD} strokeWidth={0.8} animatedProps={rim} />
          <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none"
            stroke={`url(#band${id})`} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={[band, Math.max(0, per - band)]} animatedProps={body} />
          <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none"
            stroke={`url(#band${id})`} strokeWidth={2} strokeLinecap="round"
            strokeDasharray={[band, Math.max(0, per - band)]} animatedProps={line} />
          {Array.from({ length: SPARKS }, (_, j) => <Spark key={j} j={j} t={t} geo={geo} lap={lap} />)}
        </Svg>
      ) : null}
    </View>
  );
}

/* Ein Funke im hellen Teil des Bandes: gleitet sanft und funkelt — beides Sinus. */
function Spark({ j, t, geo, lap }: { j: number; t: SharedValue<number>; geo: Geo; lap: number }) {
  const core = useAnimatedProps(() => {
    const u = t.value / lap - BAND * (0.12 + j * 0.09) + 0.01 * Math.sin(t.value / (1400 + j * 260) + j * 2.1);
    const [px, py] = pointAt(u, geo);
    // Ein Hauch neben der Linie, damit die Funken nicht auf einer Schnur sitzen.
    const off = 2.4 * Math.sin(t.value / (1900 + j * 330) + j);
    const tw = 0.5 + 0.5 * Math.sin(t.value / (600 + j * 170) + j * 1.7);
    return { cx: px + off, cy: py - off * 0.6, opacity: tw * tw * 0.9, r: 0.8 + 0.7 * tw };
  });
  return <AnimatedCircle fill="#fff6e4" animatedProps={core} />;
}

const styles = StyleSheet.create({
  glow: { shadowColor: "#f4b46a", shadowOpacity: 0.85, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
});
