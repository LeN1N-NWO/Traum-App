import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from "react-native-svg";
import { colors, fonts } from "@/theme";
import { EDGES, STAGES, STARS, skyState } from "../../../src/lib/constellation.js";

/* Dein Sternbild auf der Startseite (Antons Wahl 28.09., statt des Mondes;
 * Aufbau „Alles zusammen" aus dem Sternbild-Variantenbuch):
 *
 *   · Jede Traum-Nacht zündet einen Stern, mit ihm zieht sich die Linie zu
 *     seinem Vorgänger. Ist eine Stufe voll, leuchtet das Bild einmal auf.
 *   · Der Weg durch die laufende Stufe ist schon GESTRICHELT vorgezeichnet;
 *     der nächste Stern trägt seine Nummer und pulsiert leise.
 *   · Der Stern, der die Stufe vollmacht, ist ein goldener Funkelstern, der
 *     atmet — darüber ein Schild mit der Belohnung („+1 ✦").
 *   · Dahinter schimmert die ÜBERNÄCHSTE Stufe als Nebel: Man ahnt, dass
 *     das Bild wächst, aber nicht genau wie.
 *
 * Die Vorschau (Antons Idee): Beim allerersten Anschauen — und bei jedem
 * Tipp — spielt das Bild vor, wie sich die volle Stufe anfühlt, dann sinkt
 * es zurück auf den echten Stand.
 *
 * ⚠ Leistung (28.09., iOS meldete Dauerlast): Das SVG bewegt sich nur
 * während Aufleuchten und Vorschau. Das Dauerhafte — Pulsieren, Atmen —
 * sind NATIVE Ebenen darüber (nur Transform/Deckkraft), kein SVG-Zeichnen
 * je Bild. Die Rechnung liegt in src/lib/constellation.js. */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const GOLD = "#ffe7b0";

export function ConstellationSky({ nights, name, count, line, chip, introSeen, onIntroSeen, width }: {
  nights: number; name: string; count: string; line: string; chip: string; introSeen: boolean; onIntroSeen: () => void; width: number;
}) {
  const H = Math.round(width * 0.74);
  const st = useMemo(() => skyState(nights), [nights]);
  const next = st.next ?? STARS.length;                    // Ziel der laufenden Stufe
  const after = STAGES[st.done + 1] ?? next;               // die übernächste, als Nebel
  const upto = Math.max(after, 5);
  /* Den Platz nutzen: gezoomt auf laufende + übernächste Stufe. */
  const place = useMemo(() => {
    const pts = STARS.slice(0, upto).map(([x, y]) => [x, y * 0.625]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 34;
    const k = Math.min((width - 2 * pad) / Math.max(0.01, maxX - minX), (H - 2 * pad) / Math.max(0.01, maxY - minY));
    const ox = (width - (maxX - minX) * k) / 2 - minX * k, oy = (H - (maxY - minY) * k) / 2 - minY * k + 8;
    return (p: number[]) => [ox + p[0] * k, oy + p[1] * 0.625 * k];
  }, [upto, width, H]);

  const lit = useSharedValue(0);       // wie viele Sterne leuchten (fließend)
  const flash = useSharedValue(0);     // das kurze Aufleuchten
  const played = useRef(false);
  const preview = () => {
    Haptics.selectionAsync();
    lit.value = withSequence(withTiming(next, { duration: 1100, easing: Easing.out(Easing.cubic) }), withDelay(2400, withTiming(st.lit, { duration: 900 })));
    flash.value = withSequence(withDelay(1150, withTiming(1, { duration: 450 })), withTiming(0, { duration: 1400 }));
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1200);
  };
  useEffect(() => {
    if (!introSeen && !played.current) {
      played.current = true;
      preview();
      onIntroSeen();
    } else {
      lit.value = withDelay(200, withTiming(st.lit, { duration: 700 + st.lit * 90, easing: Easing.out(Easing.cubic) }));
      if (st.done > 0 && st.lit === STAGES[st.done - 1]) flash.value = withDelay(1500, withSequence(withTiming(1, { duration: 450 }), withTiming(0, { duration: 1400 })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nights]);
  const glow = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.015 * flash.value }] }));

  const nextStar = st.next ? st.lit : -1;                  // der Stern, der als Nächstes kommt
  const mile = st.next ? st.next - 1 : -1;                 // der Meilenstein der Stufe
  const [nx, ny] = nextStar >= 0 ? place(STARS[nextStar]) : [0, 0];
  const [mx, my] = mile >= 0 ? place(STARS[mile]) : [0, 0];

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Pressable onPress={preview} accessibilityRole="button" accessibilityLabel={`${name}. ${count}. ${line}`}>
        <Animated.View style={[{ width, height: H }, glow]}>
          <Svg width={width} height={H}>
            <Defs>
              <RadialGradient id="fog" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#8cc0ff" stopOpacity={0.55} />
                <Stop offset="1" stopColor="#8cc0ff" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {/* Nebel: die übernächste Stufe, nur geahnt */}
            {STARS.slice(next, upto).map((p, k) => { const [x, y] = place(p); return <Circle key={`f${k}`} cx={x} cy={y} r={11} fill="url(#fog)" />; })}
            {/* Der vorgezeichnete Weg durch die laufende Stufe */}
            {EDGES.map((e, k) => {
              const m = Math.max(e[0], e[1]);
              if (m < st.lit || m >= next) return null;
              const [x1, y1] = place(STARS[e[0]]), [x2, y2] = place(STARS[e[1]]);
              return <Line key={`d${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeOpacity={m === nextStar ? 0.55 : 0.28} strokeWidth={1.2} strokeDasharray={[4, 5]} />;
            })}
            {/* Die gezogenen Linien */}
            {EDGES.map((e, k) => {
              if (Math.max(e[0], e[1]) >= next) return null;
              return <Edge key={k} a={place(STARS[e[0]])} b={place(STARS[e[1]])} after={Math.max(e[0], e[1])} lit={lit} flash={flash} />;
            })}
            {STARS.slice(0, next).map((p, i) => {
              const [x, y] = place(p);
              return <Star key={i} i={i} x={x} y={y} lit={lit} flash={flash} ring={i !== nextStar && i !== mile} />;
            })}
          </Svg>
          {/* Native Ebenen darüber: nächster Stern mit Nummer, Meilenstein mit Schild */}
          {nextStar >= 0 && nextStar !== mile ? <NextMark x={nx} y={ny} n={nextStar + 1} /> : null}
          {mile >= 0 ? <Milestone x={mx} y={my} chip={chip} /> : null}
        </Animated.View>
      </Pressable>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.count}>{count.toUpperCase()}</Text>
      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

/* Der nächste Stern: seine Nummer im Kreis, leise pulsierend. */
function NextMark({ x, y, n }: { x: number; y: number; n: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.55 + 0.45 * k.value, transform: [{ scale: 1 + 0.12 * k.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.next, { left: x - 12, top: y - 12 }, pulse]}>
      <Text style={styles.nextText}>{n}</Text>
    </Animated.View>
  );
}

/* Der Meilenstein: ein goldener Funkelstern, der atmet, darüber das Schild. */
const SPARK = (() => {
  const c = 16, s = 9;
  return `M${c} ${c - s} Q${c + s * 0.18} ${c - s * 0.18} ${c + s} ${c} Q${c + s * 0.18} ${c + s * 0.18} ${c} ${c + s} Q${c - s * 0.18} ${c + s * 0.18} ${c - s} ${c} Q${c - s * 0.18} ${c - s * 0.18} ${c} ${c - s}Z`;
})();
function Milestone({ x, y, chip }: { x: number; y: number; chip: string }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const breathe = useAnimatedStyle(() => ({ transform: [{ scale: 0.92 + 0.22 * k.value }], opacity: 0.8 + 0.2 * k.value }));
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.mile, { left: x - 16, top: y - 16 }, breathe]}>
        <Svg width={32} height={32}>
          <Circle cx={16} cy={16} r={15} fill="#f6c65b" opacity={0.14} />
          <Path d={SPARK} fill="#f6c65b" />
        </Svg>
      </Animated.View>
      {chip ? (
        <View pointerEvents="none" style={[styles.chip, { left: x - 26, top: y - 40 }]}>
          <Text style={styles.chipText}>{chip}</Text>
        </View>
      ) : null}
    </>
  );
}

function Star({ i, x, y, lit, flash, ring }: { i: number; x: number; y: number; lit: SharedValue<number>; flash: SharedValue<number>; ring: boolean }) {
  // Kleine Unterschiede in Größe, damit das Bild nicht wie ein Raster wirkt.
  const size = 3 + ((i * 37) % 10) / 8;
  const core = useAnimatedProps(() => {
    const on = Math.max(0, Math.min(1, lit.value - i));
    return { opacity: on, r: size + 0.8 * flash.value };
  });
  const halo = useAnimatedProps(() => {
    const on = Math.max(0, Math.min(1, lit.value - i));
    return { opacity: on * (0.28 + 0.4 * flash.value), r: size * 3.2 + 3 * flash.value };
  });
  const rim = useAnimatedProps(() => ({ opacity: (1 - Math.max(0, Math.min(1, lit.value - i))) * (ring ? 0.4 : 0) }));
  return (
    <>
      <AnimatedCircle cx={x} cy={y} fill="none" stroke="rgba(234,240,251,0.7)" strokeWidth={0.8} r={size + 0.8} animatedProps={rim} />
      <AnimatedCircle cx={x} cy={y} fill="#ffd58f" animatedProps={halo} />
      <AnimatedCircle cx={x} cy={y} fill="#fffaf0" animatedProps={core} />
    </>
  );
}

/* Eine Linie zieht sich, sobald ihr zweiter Stern leuchtet (Antons Wunsch
   28.09.: „bei zwei Sternen schon die erste Linie"). */
function Edge({ a, b, after, lit, flash }: { a: number[]; b: number[]; after: number; lit: SharedValue<number>; flash: SharedValue<number> }) {
  const [x1, y1] = a, [x2, y2] = b;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const props = useAnimatedProps(() => {
    const p = Math.max(0, Math.min(1, lit.value - after));
    return { strokeDashoffset: len * (1 - p), strokeOpacity: 0.55 * p + 0.4 * flash.value * p };
  });
  return <AnimatedLine x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth={1.3} strokeLinecap="round" strokeDasharray={[len, len]} animatedProps={props} />;
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 29, color: colors.text, textAlign: "center" },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  line: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", paddingHorizontal: 20 },
  next: { position: "absolute", width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(234,240,251,0.55)", backgroundColor: "rgba(234,240,251,0.06)" },
  nextText: { color: colors.muted, fontSize: 11, fontWeight: "700", fontVariant: ["tabular-nums"] },
  mile: { position: "absolute", width: 32, height: 32 },
  chip: { position: "absolute", width: 52, alignItems: "center", paddingVertical: 3, borderRadius: 10, backgroundColor: colors.gold },
  chipText: { color: "#1a1206", fontSize: 11, fontWeight: "700" },
});
