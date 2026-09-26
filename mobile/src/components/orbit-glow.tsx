import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedProps, useFrameCallback, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Rect } from "react-native-svg";

/* Der Leuchtrand „Nordlicht" (Antons Wahl 26.09., Variante B): EIN weiches
   Lichtband läuft langsam um jeden Knopf, den man als Nächstes drücken
   soll — an beiden Enden ausgeblendet, von Rosé über Orange nach Gold, der
   ganze Rand atmet. Vorn ziehen ein paar Funken mit.
 *
 * Vorher (26.09. früh) liefen zwei harte Striche übereinander; Anton: „sieht
 * billig aus, wie ein Bug". Und in der ersten Vorschau hakten die Funken:
 * Sie sprangen am Ende ihres Zyklus zurück. Hier hängt ALLES an einer
 * durchlaufenden Uhr (useFrameCallback), jede Bewegung ist ein Sinus — es
 * gibt keinen Zeitpunkt, an dem etwas springt.
 *
 * Das Band sind SEGMENTS kurze, überlappende Striche mit runden Kappen; ihre
 * Dicke und Deckkraft folgen einem Sinusbogen, so entsteht der weiche
 * Verlauf ohne Kante. Der Schein darum ist der iOS-Schatten der Ebene (er
 * folgt der Form des Bandes, also echte Unschärfe ohne Filter).
 * Nur SVG + Reanimated, alles auf dem UI-Thread. Die Ebene liegt ÜBER dem
 * Knopf und fängt keine Tipps (pointerEvents none). */
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ROSE = [244, 150, 170];
const WARM = [242, 167, 101];
const GOLD = [255, 214, 150];
const SEGMENTS = 18;
const BAND = 0.3;          // Anteil des Umfangs, den das Band einnimmt
const BREATH = 5000;       // ein Atemzug in ms
const SPARKS = 4;

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

type Geo = { x: number; y: number; w: number; h: number; r: number; per: number };

export function OrbitGlow({ radius, lap = 14000 }: { radius?: number; color?: string; lap?: number }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const t = useSharedValue(0);
  useFrameCallback((f) => { t.value = f.timeSinceFirstFrame; });

  const inset = 1.5;
  const w = Math.max(0, box.w - inset * 2), h = Math.max(0, box.h - inset * 2);
  const r = Math.min(radius ?? h / 2, h / 2, w / 2);
  // Umfang eines abgerundeten Rechtecks: gerade Stücke + ein ganzer Kreis.
  const per = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const geo: Geo = { x: inset, y: inset, w, h, r, per };

  return (
    <View style={[StyleSheet.absoluteFill, styles.glow]} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {per > 0 ? (
        <Svg width={box.w} height={box.h}>
          {Array.from({ length: SEGMENTS }, (_, k) => <Segment key={k} k={k} t={t} geo={geo} lap={lap} />)}
          {Array.from({ length: SPARKS }, (_, j) => <Spark key={j} j={j} t={t} geo={geo} lap={lap} />)}
        </Svg>
      ) : null}
    </View>
  );
}

/* Ein Stück des Bandes. s = 0 ist das Ende, s = 1 der Kopf. */
function Segment({ k, t, geo, lap }: { k: number; t: SharedValue<number>; geo: Geo; lap: number }) {
  const s = k / (SEGMENTS - 1);
  const fade = Math.sin(s * Math.PI * 0.92 + 0.12);          // weich an beiden Enden, der Kopf etwas heller
  const col = s < 0.5 ? mix(ROSE, WARM, s * 2) : mix(WARM, GOLD, (s - 0.5) * 2);
  const len = (BAND * geo.per / SEGMENTS) * 1.6;               // überlappen, damit keine Lücke entsteht
  const per = geo.per;
  const props = useAnimatedProps(() => {
    const head = t.value / lap;
    const at = ((head - BAND * (1 - s)) % 1 + 1) % 1;
    const breath = 0.5 + 0.5 * Math.sin((t.value / BREATH) * Math.PI * 2);
    return { strokeDashoffset: -at * per, strokeOpacity: fade * (0.55 + 0.35 * breath) };
  });
  return (
    <AnimatedRect x={geo.x} y={geo.y} width={geo.w} height={geo.h} rx={geo.r} ry={geo.r} fill="none"
      stroke={rgb(col)} strokeWidth={1 + 2.2 * fade} strokeLinecap="round"
      strokeDasharray={[len, Math.max(0, per - len)]} animatedProps={props} />
  );
}

/* Ein Funke am Kopf: gleitet sanft vor und zurück und funkelt — beides Sinus. */
function Spark({ j, t, geo, lap }: { j: number; t: SharedValue<number>; geo: Geo; lap: number }) {
  const { x, y, w, h, r, per } = geo;
  const core = useAnimatedProps(() => {
    const u = t.value / lap - BAND * (0.1 + j * 0.07) + 0.012 * Math.sin(t.value / (1300 + j * 230) + j * 2.1);
    // Punkt auf dem Rand (im Uhrzeigersinn ab oben links, wie der SVG-Pfad des Rechtecks).
    const sw = w - 2 * r, sh = h - 2 * r, q = Math.PI * r / 2;
    let d = ((u % 1) + 1) % 1 * per;
    let px = 0, py = 0;
    if (d < sw) { px = x + r + d; py = y; }
    else if ((d -= sw) < q) { const a = -Math.PI / 2 + d / r; px = x + w - r + r * Math.cos(a); py = y + r + r * Math.sin(a); }
    else if ((d -= q) < sh) { px = x + w; py = y + r + d; }
    else if ((d -= sh) < q) { const a = d / r; px = x + w - r + r * Math.cos(a); py = y + h - r + r * Math.sin(a); }
    else if ((d -= q) < sw) { px = x + w - r - d; py = y + h; }
    else if ((d -= sw) < q) { const a = Math.PI / 2 + d / r; px = x + r + r * Math.cos(a); py = y + h - r + r * Math.sin(a); }
    else if ((d -= q) < sh) { px = x; py = y + h - r - d; }
    else { d -= sh; const a = Math.PI + d / r; px = x + r + r * Math.cos(a); py = y + r + r * Math.sin(a); }
    // Ein Hauch neben der Linie, damit die Funken nicht auf einer Schnur sitzen.
    const off = 2.2 * Math.sin(t.value / (1700 + j * 310) + j);
    const tw = 0.5 + 0.5 * Math.sin(t.value / (520 + j * 140) + j * 1.7);
    return { cx: px + off, cy: py - off * 0.6, opacity: tw * tw * 0.95, r: 0.9 + 0.7 * tw };
  });
  return <AnimatedCircle fill="#fff4e1" animatedProps={core} />;
}

const styles = StyleSheet.create({
  glow: { shadowColor: "#f2a765", shadowOpacity: 0.9, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
});
