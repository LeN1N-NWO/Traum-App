import { useEffect, useId, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedProps, useAnimatedStyle, useFrameCallback, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Mask, RadialGradient, Rect, Stop } from "react-native-svg";

/* Der Leuchtrand, fünfte Fassung (Antons Wahl 27.09. aus dem Variantenbuch):
 *
 *   · „Lichtstrahl" auf jedem Hauptknopf — eine kaum sichtbare Linie, um
 *     die ein kurzer, heller Strahl mit warmem Schweif läuft (Vorlage:
 *     Magic UI „Border Beam");
 *   · `spend` — Knöpfe, die Credits ausgeben: zusätzlich der „atmende
 *     Rand": die Linie ist goldenes Metall, und ihr Schein schwillt ruhig
 *     an und ab. So sieht man, bevor man tippt, dass es etwas kostet.
 *
 * Was NICHT wiederkommen soll:
 *   · zwei harte Striche übereinander (erste Fassung: „wie ein Bug"),
 *   · ein Band aus vielen kurzen Strichen (zweite: „eine Schlange"),
 *   · ein Band, dessen Farbverlauf mitwandert (dritte: „kaputt") — ein
 *     Verlauf in <Defs>, dessen Koordinaten Reanimated jedes Bild neu setzt,
 *     aktualisiert react-native-svg auf dem Gerät nicht zuverlässig.
 * Deshalb bewegen sich nur Kreise mit FESTEM Verlauf (wie die
 * Glühwürmchen am Mond). Sie liegen dicht hintereinander auf dem Rand und
 * sind nur durch eine Maske aus der Randlinie zu sehen — zusammen ein
 * durchgehender Strahl, der nie den Knopf selbst färbt. Die Ebene liegt
 * ÜBER dem Knopf und fängt keine Tipps. */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LAP = 5200;                         // eine Runde des Strahls in ms
const BEAM = 0.12;                        // Länge des Strahls (Anteil des Umfangs)
const DOTS = 12;                          // Kreise, aus denen er besteht
const BREATH = 5000;                      // ein Atemzug des Credit-Rands in ms

type Geo = { x: number; y: number; w: number; h: number; r: number; per: number };

/* Punkt auf dem Rand des abgerundeten Rechtecks, u in [0,1) — im
   Uhrzeigersinn ab oben links, gleichmäßig in der Bogenlänge: Der Strahl
   kriecht nicht auf den langen Kanten und rast nicht an den Enden. */
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

export function OrbitGlow({ radius, lap = LAP, spend = false }: { radius?: number; lap?: number; spend?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [box, setBox] = useState({ w: 0, h: 0 });
  const t = useSharedValue(0);
  useFrameCallback((f) => { t.value = f.timeSinceFirstFrame; });
  const breath = useSharedValue(0);
  useEffect(() => {
    if (spend) breath.value = withRepeat(withTiming(1, { duration: BREATH, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [spend, breath]);

  const inset = 0.75;
  const w = Math.max(0, box.w - inset * 2), h = Math.max(0, box.h - inset * 2);
  const r = Math.min(radius ?? h / 2, h / 2, w / 2);
  const per = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const geo: Geo = { x: inset, y: inset, w, h, r, per };

  // Der Credit-Rand atmet: Schein und Linie schwellen gemeinsam.
  const halo = useAnimatedStyle(() => (spend
    ? { shadowOpacity: 0.35 + 0.6 * breath.value, shadowRadius: 5 + 9 * breath.value }
    : { shadowOpacity: 0.85, shadowRadius: 5 }));
  const rim = useAnimatedProps(() => ({ strokeOpacity: spend ? 0.55 + 0.4 * breath.value : 1 }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
    <Animated.View style={[StyleSheet.absoluteFill, styles.glow, halo]} pointerEvents="none">
      {per > 0 ? (
        <Svg width={box.w} height={box.h}>
          <Defs>
            {/* Gebürstetes Gold für den Credit-Rand: hell und dunkel im Wechsel. */}
            <LinearGradient id={`metal${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#9a7432" />
              <Stop offset="0.22" stopColor="#f7dea2" />
              <Stop offset="0.45" stopColor="#b88d3e" />
              <Stop offset="0.7" stopColor="#fff0c8" />
              <Stop offset="1" stopColor="#a57d37" />
            </LinearGradient>
            <RadialGradient id={`hot${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#fffaf0" stopOpacity={1} />
              <Stop offset="0.45" stopColor="#fff0cc" stopOpacity={0.85} />
              <Stop offset="1" stopColor="#ffe3a6" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`warm${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#f6b86e" stopOpacity={0.95} />
              <Stop offset="1" stopColor="#f2a765" stopOpacity={0} />
            </RadialGradient>
            <Mask id={`line${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={box.w} height={box.h}>
              <Rect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke="#fff" strokeWidth={1.6} />
            </Mask>
          </Defs>
          {spend ? (
            <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke={`url(#metal${id})`} strokeWidth={1} animatedProps={rim} />
          ) : (
            <Rect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
          )}
          <G mask={`url(#line${id})`}>
            {/* Vom Schweif zum Kopf: warm und breit hinten, weiß-heiß vorn. */}
            {Array.from({ length: DOTS }, (_, k) => {
              const along = k / (DOTS - 1);                       // 0 = Schweifende, 1 = Kopf
              return (
                <Dot key={k} t={t} geo={geo} lap={lap} lag={BEAM * (1 - along)}
                  size={7 + 7 * along} alpha={0.2 + 0.8 * along * along} fill={along > 0.7 ? `url(#hot${id})` : `url(#warm${id})`} />
              );
            })}
          </G>
        </Svg>
      ) : null}
    </Animated.View>
    </View>
  );
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function Dot({ t, geo, lap, lag, size, alpha, fill }: { t: SharedValue<number>; geo: Geo; lap: number; lag: number; size: number; alpha: number; fill: string }) {
  const props = useAnimatedProps(() => {
    const [cx, cy] = pointAt(t.value / lap - lag, geo);
    return { cx, cy };
  });
  return <AnimatedCircle r={size} fill={fill} opacity={alpha} animatedProps={props} />;
}

const styles = StyleSheet.create({
  glow: { shadowColor: "#f4c27a", shadowOffset: { width: 0, height: 0 } },
});
