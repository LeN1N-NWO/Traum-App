import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { PrimaryButton } from "@/components/glass";
import { useScreenActive } from "@/lib/use-screen-active";
import { colors } from "@/theme";

/* Der Atem (13.09.2026, Gratis-Feature aus der Analyse „Warum die App
 * scheitern kann", §2): die 4-7-8-Übung als geführte Minute — vier
 * Runden, eine sanfte Haptik je Wechsel, damit es mit geschlossenen Augen
 * geht.
 *
 * Seit 09.10. im Bild der Website (Antons Wahl; Vorlage
 * DreamRushes-Landingpage/site/handoff/breathing-for-claude): vier
 * abgerundete Quadrate, gegeneinander verdreht, Cyan → Lavendel, um eine
 * dunkle Scheibe. Einatmen 4 s — alles wächst gemeinsam (.78 → 1.10),
 * halten 7 s — bleibt groß, ausatmen 8 s — sinkt zurück. Nichts dreht
 * sich, nichts wabert.
 *
 * EINE Uhr: Größe, Phase, Text, Haptik und Rundenzahl kommen alle aus
 * derselben verstrichenen Zeit (Bilduhr auf dem UI-Thread). Sie hält an,
 * wenn der Tab oder die App nicht zu sehen ist, und läuft danach ohne
 * Sprung weiter. Bei „Bewegung reduzieren" stehen die Konturen still,
 * Text, Zeit und Haptik laufen weiter. */
type Phase = "in" | "hold" | "out";
const CYCLE = 19;                                  // 4 + 7 + 8 Sekunden
const REST = 0.78, FULL = 1.1;
const phaseAt = (u: number): Phase => (u < 4 ? "in" : u < 11 ? "hold" : "out");

/* Vorlage: viewBox 0 0 340 310, gemeinsame Mitte (170, 154). */
const VB_W = 340, VB_H = 310, CX = 170, CY = 154;
const CONTOURS = [116, 101, 86, 71].map((r, i) => ({ r, rot: i * 12 - 18, o: 0.2 + i * 0.2 }));
/* Der Kasten der wachsenden Gruppe: ein Quadrat um die Mitte. */
const BOX = 300;

export function Breath({ L, rounds = 4 }: { L: Record<string, any>; rounds?: number }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sec, setSec] = useState(0);              // volle Sekunden seit dem Start
  const last = useRef("");                        // zuletzt gemeldete Runde:Phase — nie doppelt tippen

  const elapsed = useSharedValue(0);
  const scale = useSharedValue(REST);
  const reduce = useReducedMotion();
  const active = useScreenActive();
  const clock = useFrameCallback((f) => {
    // höchstens 0,1 s je Bild — nach einer Pause wird nichts übersprungen
    const dt = Math.min(0.1, (f.timeSincePreviousFrame ?? 16) / 1000);
    elapsed.value += dt;
    const u = elapsed.value % CYCLE;
    const ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
    scale.value = reduce ? REST
      : u < 4 ? REST + (FULL - REST) * ease(u / 4)
      : u < 11 ? FULL
      : FULL - (FULL - REST) * ease((u - 11) / 8);
  }, false);
  useEffect(() => { clock.setActive(running && active); }, [running, active, clock]);
  useAnimatedReaction(() => Math.floor(elapsed.value), (s, prev) => { if (s !== prev) runOnJS(setSec)(s); });

  const round = Math.floor(sec / CYCLE);
  const within = sec % CYCLE;
  const phase = phaseAt(within);
  const left = (phase === "in" ? 4 : phase === "hold" ? 11 : CYCLE) - within;
  const word = running ? L[phase] : done ? L.done : L.ready;

  /* Haptik und VoiceOver genau an den Phasengrenzen — aus derselben Uhr. */
  useEffect(() => {
    if (!running) return;
    if (round >= rounds) { finish(true); return; }
    const key = `${round}:${phase}`;
    if (key === last.current) return;
    last.current = key;
    Haptics.impactAsync(phase === "hold" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft);
    AccessibilityInfo.announceForAccessibility(L[phase]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, round, phase]);

  function start() {
    elapsed.value = 0; scale.value = REST;
    last.current = ""; setSec(0); setDone(false); setRunning(true);
  }
  function finish(complete: boolean) {
    setRunning(false); setDone(complete);
    scale.value = withTiming(REST, { duration: 600 });
    if (complete) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /* Die Vorlage gleichmäßig auf die Breite skaliert — nie verzerrt. */
  const { width: winW } = useWindowDimensions();
  const W = Math.min(winW - 40, 380), k = W / VB_W, H = VB_H * k;
  const form = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.wrap}>
      <Pressable onPress={running ? () => finish(false) : start} style={{ width: W, height: H }}
        accessibilityRole="button" accessibilityLabel={running ? L.stop : L.start}>
        {/* das stille Licht dahinter */}
        <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="br-light" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#a69ce2" stopOpacity={0.2} />
              <Stop offset="1" stopColor="#656ab5" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={CX} cy={CY} r={150} fill="url(#br-light)" />
        </Svg>
        {/* die Konturen und die Scheibe — wachsen gemeinsam um die Mitte */}
        <Animated.View pointerEvents="none" style={[{ position: "absolute", width: BOX * k, height: BOX * k, left: (CX - BOX / 2) * k, top: (CY - BOX / 2) * k }, form]}>
          <Svg width={BOX * k} height={BOX * k} viewBox={`${CX - BOX / 2} ${CY - BOX / 2} ${BOX} ${BOX}`}>
            <Defs>
              <LinearGradient id="br-line" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#9ed4f9" />
                <Stop offset="0.52" stopColor="#bca7f0" />
                <Stop offset="1" stopColor="#a4b8ee" stopOpacity={0.2} />
              </LinearGradient>
            </Defs>
            {CONTOURS.map(({ r, rot, o }) => (
              <Rect key={r} x={CX - r} y={CY - r} width={r * 2} height={r * 2} rx={r * 0.77} ry={r * 0.77}
                fill="none" stroke="url(#br-line)" strokeOpacity={o} strokeWidth={1} transform={`rotate(${rot} ${CX} ${CY})`} />
            ))}
            <Circle cx={CX} cy={CY} r={48} fill="#20243e" stroke="#b8aaea" strokeOpacity={0.25} />
          </Svg>
        </Animated.View>
        {/* Der Text wächst nicht mit — ruhig und lesbar in der Mitte. */}
        <View pointerEvents="none" style={[styles.center, { top: (CY - 37) * k, height: 74 * k }]}>
          <Text style={[styles.word, { fontSize: 15 * k }]} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>{word}</Text>
          {running ? <Text style={[styles.left, { fontSize: 11 * k }]} maxFontSizeMultiplier={1.3}>{left}</Text> : null}
        </View>
        {/* 4 · 7 · 8 — die laufende Zahl hell */}
        <View pointerEvents="none" style={[styles.steps, { top: 279 * k }]} accessible={false} importantForAccessibility="no-hide-descendants">
          <Text style={[styles.step, { fontSize: 11 * k, letterSpacing: 3 * k }]} maxFontSizeMultiplier={1.3}>
            {(["in", "hold", "out"] as const).map((p, i) => (
              <Text key={p}>
                {i ? " · " : ""}
                <Text style={running && p === phase ? styles.stepOn : null}>{p === "in" ? 4 : p === "hold" ? 7 : 8}</Text>
              </Text>
            ))}
          </Text>
        </View>
      </Pressable>
      {running ? <Text style={styles.round}>{String(L.round ?? "{n}/{m}").replace("{n}", String(Math.min(round, rounds - 1) + 1)).replace("{m}", String(rounds))}</Text> : <Text style={styles.how}>{L.how}</Text>}
      <PrimaryButton label={running ? L.stop : done ? L.again : L.start} onPress={running ? () => finish(false) : start} style={{ flex: 0, alignSelf: "stretch" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 18 },
  center: { position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: "36%" },
  word: { color: "#e1def6", fontWeight: "500", textAlign: "center" },
  left: { color: "#a3b2ca", fontVariant: ["tabular-nums"], marginTop: 2 },
  steps: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center" },
  step: { color: "#a3b2ca" },
  stepOn: { color: "#e1def6", fontWeight: "600" },
  round: { color: colors.muted, fontSize: 14, fontVariant: ["tabular-nums"] },
  how: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", paddingHorizontal: 12 },
});
