import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import type { StoneKind } from "@/store/journal-store";

/* Die Traumsteine (Antons Wahl 04.10. abends, am Einzelstein abgestimmt):
 * Jeder Traum im Traumfänger ist ein Edelstein im Brillantschliff — Tafel,
 * Stern-, Haupt- und Rondistfacetten, goldene Fassung, am Rand kleine
 * Farbsplitter wie Feuer. Die Steinart kommt aus der Gruppe des Traum-
 * symbols (Orte Aquamarin, Erlebnisse Bernstein, Wesen Smaragd, Menschen
 * Rosenquarz, Gefühle Amethyst, ohne Symbol Mondstein).
 *
 * Die Geschenksteine an 3, 6, 9 tragen ihre Zahl: roh und matt, solange
 * sie nicht erreicht sind, geschliffen und funkelnd danach.
 *
 * Funkeln: zwei Facettengruppen leuchten im Wechsel auf, als drehe sich der
 * Stein im Licht, und ab und zu blitzt ein Lichtstern. Der Stein selbst ist
 * ein stilles SVG; bewegt werden nur native Ebenen (Deckkraft, Skalierung,
 * Drehung) — und nur, solange der Bildschirm zu sehen ist (`live`). */

/** tief, dunkel, mittel, hell, Glanz */
type Pal = readonly [string, string, string, string, string];

export const STONES: Record<StoneKind, Pal> = {
  place: ["#05303D", "#0E5E74", "#2BA3C4", "#8EE4F4", "#F2FEFF"],     // Aquamarin
  scenario: ["#3A1F03", "#7C4708", "#E2952A", "#FFD88F", "#FFF8E8"],  // Bernstein
  creature: ["#03301B", "#0A5E36", "#22A865", "#8EEDB8", "#F0FFF6"],  // Smaragd
  person: ["#4A1428", "#8E3A5C", "#DE7FA2", "#FAC8DA", "#FFF5F9"],    // Rosenquarz
  emotion: ["#1D0E47", "#43288C", "#8A62E2", "#D3C3FF", "#FAF7FF"],   // Amethyst
  none: ["#262A45", "#585E8C", "#B5BADB", "#E6E9F8", "#FFFFFF"],      // Mondstein
};
/* Die Geschenksteine in den Farben ihrer Federn: Petrol, Feueropal, Violett. */
export const GIFT_STONES: Pal[] = [
  ["#04303A", "#0D5A6B", "#2F8FA6", "#9ADCE8", "#F0FDFF"],
  ["#3E1104", "#842A0B", "#D9612A", "#F8B27C", "#FFF3E6"],
  ["#1E1250", "#3E2F8F", "#6E5BD0", "#C4B8FF", "#F6F2FF"],
];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
type Pt = [number, number];
const poly = (pts: Pt[]) => "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L") + "Z";

/* Der Schliff: einmal gerechnet, Licht von oben links. */
function brilliant(c: number, r: number, pal: Pal) {
  const P = (a: number, d: number): Pt => [c + Math.cos(a * Math.PI / 180) * d, c + Math.sin(a * Math.PI / 180) * d];
  const T = (k: number) => P(22.5 + 45 * k, r * 0.52), S = (k: number) => P(45 * k, r * 0.8);
  const G = (k: number) => P(22.5 + 45 * k, r), M = (k: number) => P(45 * k, r);
  const stops = [0, 0.3, 0.55, 0.8, 1];
  const col = (b: number) => {
    b = Math.max(0, Math.min(1, b));
    for (let i = 0; i < 4; i++) if (b <= stops[i + 1]) return mix(pal[i], pal[i + 1], (b - stops[i]) / (stops[i + 1] - stops[i]));
    return pal[4];
  };
  const base = (a: number) => 0.5 + 0.28 * Math.cos((a + 135) * Math.PI / 180);
  const facets: { d: string; fill: string; o?: number; edge?: boolean }[] = [];
  for (let k = 0; k < 8; k++) {
    facets.push({ d: poly([S(k), G(k - 1), M(k)]), fill: col(base(45 * k - 11) + 0.17), edge: true });
    facets.push({ d: poly([S(k), M(k), G(k)]), fill: col(base(45 * k + 11) - 0.17), edge: true });
  }
  for (let k = 0; k < 8; k++) facets.push({ d: poly([T(k), S(k + 1), G(k), S(k)]), fill: col(k === 4 ? 0.9 : base(22.5 + 45 * k) + (k % 2 ? -0.1 : 0.12)), edge: true });
  for (let k = 0; k < 8; k++) facets.push({ d: poly([T(k - 1), S(k), T(k)]), fill: col(k === 5 ? 1 : base(45 * k) + (k % 2 ? 0.15 : -0.06)), edge: true });
  facets.push({ d: poly([0, 1, 2, 3, 4, 5, 6, 7].map(T)), fill: col(0.6), edge: true });
  // die Spiegelung des Unterteils in der Tafel
  for (let k = 0; k < 8; k++) facets.push({ d: poly([[c, c], T(k), T(k + 1)]), fill: col(k % 2 ? 0.4 : 0.74), o: 0.5 });
  facets.push({ d: poly([0, 1, 2, 3, 4, 5, 6, 7].map((k) => P(45 * k, r * 0.2))), fill: col(0.28), o: 0.55 });
  // Feuer: kleine Farbsplitter am Rand
  const fire = ([[150, "#FF9A3C"], [300, "#7CF29A"], [35, "#6EA8FF"], [200, "#FF6FB0"]] as const).map(([a, f]) => {
    const [x, y] = P(a, r * 0.88), z = r * 0.075;
    return { d: poly([[x, y - z], [x + z, y + z * 0.8], [x - z, y + z * 0.8]]), fill: f };
  });
  // die zwei Facettengruppen, die im Wechsel aufleuchten
  const shimmerA = [poly([T(7), S(8), G(7), S(7)]), poly([T(2), S(3), G(2), S(2)])].join(" ");
  const shimmerB = poly([T(-1), S(0), T(0)]);
  return { facets, fire, shimmerA, shimmerB, glint: P(225, r * 0.6) };
}

/* Der rohe Stein: unregelmäßig, matt, mit ein paar groben Flächen. */
function roughCut(c: number, r: number, pal: Pal) {
  const pts = ([[0, 0.98], [48, 0.86], [95, 0.97], [150, 0.84], [200, 0.95], [250, 0.88], [305, 0.96]] as const)
    .map(([a, d]): Pt => [c + Math.cos(a * Math.PI / 180) * r * d, c + Math.sin(a * Math.PI / 180) * r * d]);
  const planes = ([[0, 1, 0.08], [2, 3, -0.1], [4, 5, 0.12], [5, 6, -0.05]] as const)
    .map(([a, b, t]) => ({ d: poly([[c, c], pts[a], pts[b]]), fill: t > 0 ? "#FFFFFF" : "#000000", o: Math.abs(t) }));
  return { body: poly(pts), fill: mix(pal[2], "#5A5F70", 0.62), planes };
}

export function DreamStone({ size, pal, live, num, rough, seed = 0 }: { size: number; pal: Pal; live: boolean; num?: number; rough?: boolean; seed?: number }) {
  const c = size / 2, r = size / 2 / 1.12;
  const cut = useMemo(() => brilliant(c, r, pal), [c, r, pal]);
  const raw = useMemo(() => roughCut(c, r, pal), [c, r, pal]);

  const sh = useSharedValue(0);
  const gl = useSharedValue(0);
  const sparkle = live && !rough;
  useEffect(() => {
    if (!sparkle) {
      cancelAnimation(sh); cancelAnimation(gl);
      sh.value = 0; gl.value = 0;
      return;
    }
    sh.value = withDelay((seed * 431) % 2600, withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true));
    // jeder Stein blitzt in seinem eigenen Takt — der Fänger funkelt, statt im Gleichschritt zu blinken
    const every = 4200 + ((seed * 1371) % 4800);
    gl.value = withDelay((seed * 977) % 3000, withRepeat(withSequence(
      withTiming(0, { duration: every }),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 520, easing: Easing.in(Easing.quad) }),
    ), -1, false));
  }, [sparkle, seed, sh, gl]);
  const shA = useAnimatedStyle(() => ({ opacity: 0.7 * sh.value }));
  const shB = useAnimatedStyle(() => ({ opacity: 0.7 * (1 - sh.value) }));
  const glS = useAnimatedStyle(() => ({ opacity: gl.value, transform: [{ scale: 0.2 + 0.8 * gl.value }, { rotate: `${gl.value * 35}deg` }] }));

  const L = r * 0.85, w = r * 0.07, GL = L * 2;
  const numSize = r * 0.9;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Svg width={size} height={size}>
        {/* die Fassung */}
        <Circle cx={c} cy={c} r={r * 1.12} fill={rough ? "#6B4A16" : "#8A5A14"} opacity={rough ? 0.7 : 1} />
        {rough ? null : <Circle cx={c - r * 0.025} cy={c - r * 0.025} r={r * 1.075} fill="#E7C267" />}
        <Circle cx={c} cy={c} r={r * 1.02} fill={rough ? "#0b1220" : "#5E3C0C"} />
        {rough ? (
          <>
            <Path d={raw.body} fill={raw.fill} />
            {raw.planes.map((p, k) => <Path key={k} d={p.d} fill={p.fill} opacity={p.o} />)}
          </>
        ) : (
          <>
            <Circle cx={c} cy={c} r={r} fill={pal[0]} />
            {cut.facets.map((f, k) => (
              <Path key={k} d={f.d} fill={f.fill} opacity={f.o ?? 1}
                stroke={f.edge ? pal[3] : undefined} strokeOpacity={0.28} strokeWidth={Math.max(0.35, r * 0.012)} strokeLinejoin="round" />
            ))}
            {cut.fire.map((f, k) => <Path key={k} d={f.d} fill={f.fill} opacity={0.55} />)}
            <Circle cx={c} cy={c} r={r} fill="none" stroke={pal[0]} strokeWidth={r * 0.035} strokeOpacity={0.8} />
          </>
        )}
      </Svg>
      {sparkle ? (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, shA]}><Svg width={size} height={size}><Path d={cut.shimmerA} fill={pal[4]} /></Svg></Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, shB]}><Svg width={size} height={size}><Path d={cut.shimmerB} fill={pal[4]} /></Svg></Animated.View>
        </>
      ) : null}
      {num != null ? (
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <SvgText x={c} y={c + numSize * 0.35} textAnchor="middle" fontSize={numSize} fontWeight="700"
            fill={rough ? "#0b1220" : pal[0]} stroke={rough ? "#0b1220" : pal[0]} strokeWidth={r * 0.18} strokeLinejoin="round">{num}</SvgText>
          <SvgText x={c} y={c + numSize * 0.35} textAnchor="middle" fontSize={numSize} fontWeight="700" fill={rough ? "#F6C65B" : "#FFF8E8"}>{num}</SvgText>
        </Svg>
      ) : null}
      {sparkle ? (
        <Animated.View style={[{ position: "absolute", left: cut.glint[0] - L, top: cut.glint[1] - L, width: GL, height: GL }, glS]}>
          <Svg width={GL} height={GL}>
            <Path d={`M${L} 0 L${L + w} ${L} L${L} ${GL} L${L - w} ${L}Z M${L - L * 0.7} ${L} L${L} ${L + w} L${L + L * 0.7} ${L} L${L} ${L - w}Z`} fill="#FFFFFF" />
            <Circle cx={L} cy={L} r={w * 2.2} fill="#FFFFFF" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}
