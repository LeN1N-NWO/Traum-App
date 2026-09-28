import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Line } from "react-native-svg";
import { colors, fonts } from "@/theme";
import { EDGES, STAGES, STARS, edgeStage, skyState } from "../../../src/lib/constellation.js";

/* Dein Sternbild auf der Startseite (Antons Wahl 28.09., statt des Mondes):
 * Jede notierte Nacht zündet einen Stern; ist eine Stufe voll, ziehen sich
 * die Linien, und das ganze Bild leuchtet einmal auf. Die Sterne der
 * laufenden Stufe, die noch fehlen, stehen blass als Ring da — man sieht,
 * wohin es geht.
 *
 * Die Vorschau (Antons Idee): Beim allerersten Anschauen — und bei jedem
 * Tipp — spielt das Bild vor, wie sich die nächste Stufe anfühlt: alle
 * Sterne gehen an, die Linien ziehen sich, alles leuchtet auf, darunter
 * steht, was dafür fehlt. Dann sinkt es sanft zurück auf den echten Stand.
 *
 * Bewegt wird nur während dieser Momente (drei gemeinsame Werte), danach
 * steht das SVG still — kein Zeichnen je Bild. Die Rechnung liegt in
 * src/lib/constellation.js. */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const GOLD = "#ffe7b0";

export function ConstellationSky({ nights, name, count, line, introSeen, onIntroSeen, width }: {
  nights: number; name: string; count: string; line: string; introSeen: boolean; onIntroSeen: () => void; width: number;
}) {
  const H = Math.round(width * 0.62);
  const st = useMemo(() => skyState(nights), [nights]);
  // In der Vorschau zeigt das Bild die nächste Stufe schon ganz.
  const target = st.next ?? st.lit;
  const shownCount = Math.max(st.shown, 5);
  const lit = useSharedValue(0);       // wie viele Sterne leuchten (fließend)
  const linked = useSharedValue(0);    // wie viele Stufen verbunden sind (fließend)
  const flash = useSharedValue(0);     // das kurze Aufleuchten
  const played = useRef(false);

  const settle = (delay: number) => {
    lit.value = withDelay(delay, withTiming(st.lit, { duration: 700 + st.lit * 60, easing: Easing.out(Easing.cubic) }));
    linked.value = withDelay(delay + 500, withTiming(st.done, { duration: 900, easing: Easing.inOut(Easing.cubic) }));
  };
  const preview = () => {
    Haptics.selectionAsync();
    lit.value = withSequence(withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) }), withDelay(2600, withTiming(st.lit, { duration: 900 })));
    const stages = st.next ? st.done + 1 : st.done;
    linked.value = withSequence(withDelay(700, withTiming(stages, { duration: 900, easing: Easing.inOut(Easing.cubic) })), withDelay(1400, withTiming(st.done, { duration: 900 })));
    flash.value = withSequence(withDelay(1500, withTiming(1, { duration: 450 })), withTiming(0, { duration: 1400 }));
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1550);
  };

  useEffect(() => {
    if (!introSeen && !played.current) {
      played.current = true;
      preview();
      onIntroSeen();
    } else {
      settle(200);
      // Frisch voll geworden? Dann leuchtet es einmal auf.
      if (st.done > 0 && st.lit === STAGES[st.done - 1]) flash.value = withDelay(1500, withSequence(withTiming(1, { duration: 450 }), withTiming(0, { duration: 1400 })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nights]);

  const glow = useAnimatedStyle(() => ({ shadowOpacity: 0.25 + 0.6 * flash.value, transform: [{ scale: 1 + 0.02 * flash.value }] }));

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Pressable onPress={preview} accessibilityRole="button" accessibilityLabel={`${name}. ${count}. ${line}`}>
        <Animated.View style={[styles.glow, { width, height: H }, glow]}>
          <Svg width={width} height={H}>
            {EDGES.map((e, k) => {
              const s = edgeStage(e);
              if (s < 0 || Math.max(e[0], e[1]) >= Math.max(shownCount, target)) return null;
              return <Edge key={k} a={STARS[e[0]]} b={STARS[e[1]]} stage={s} linked={linked} flash={flash} W={width} H={H} />;
            })}
            {STARS.slice(0, Math.max(shownCount, target)).map((p, i) => (
              <Star key={i} i={i} x={p[0] * width} y={p[1] * H} lit={lit} flash={flash} ghost={i >= shownCount} />
            ))}
          </Svg>
        </Animated.View>
      </Pressable>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.count}>{count.toUpperCase()}</Text>
      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

function Star({ i, x, y, lit, flash, ghost }: { i: number; x: number; y: number; lit: SharedValue<number>; flash: SharedValue<number>; ghost: boolean }) {
  // Kleine Unterschiede in Größe, damit das Bild nicht wie ein Raster wirkt.
  const size = 2.2 + ((i * 37) % 10) / 10;
  const core = useAnimatedProps(() => {
    const on = Math.max(0, Math.min(1, lit.value - i));
    return { opacity: on, r: size + 0.8 * flash.value };
  });
  const halo = useAnimatedProps(() => {
    const on = Math.max(0, Math.min(1, lit.value - i));
    return { opacity: on * (0.28 + 0.4 * flash.value), r: size * 3.2 + 3 * flash.value };
  });
  const ring = useAnimatedProps(() => ({ opacity: (1 - Math.max(0, Math.min(1, lit.value - i))) * (ghost ? 0 : 0.45) }));
  return (
    <>
      <AnimatedCircle cx={x} cy={y} fill="none" stroke="rgba(234,240,251,0.7)" strokeWidth={0.8} r={size + 0.6} animatedProps={ring} />
      <AnimatedCircle cx={x} cy={y} fill="#ffd58f" animatedProps={halo} />
      <AnimatedCircle cx={x} cy={y} fill="#fffaf0" animatedProps={core} />
    </>
  );
}

function Edge({ a, b, stage, linked, flash, W, H }: { a: number[]; b: number[]; stage: number; linked: SharedValue<number>; flash: SharedValue<number>; W: number; H: number }) {
  const x1 = a[0] * W, y1 = a[1] * H, x2 = b[0] * W, y2 = b[1] * H;
  const len = Math.hypot(x2 - x1, y2 - y1);
  // Die Linie zieht sich vom ersten zum zweiten Stern, dann bleibt sie leise stehen.
  const props = useAnimatedProps(() => {
    const p = Math.max(0, Math.min(1, linked.value - stage));
    return { strokeDashoffset: len * (1 - p), strokeOpacity: 0.45 * p + 0.45 * flash.value * p };
  });
  return <AnimatedLine x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth={1} strokeLinecap="round" strokeDasharray={[len, len]} animatedProps={props} />;
}

const styles = StyleSheet.create({
  glow: { shadowColor: "#ffd58f", shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  name: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 29, color: colors.text, textAlign: "center" },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  line: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", paddingHorizontal: 20 },
});
