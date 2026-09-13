import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PrimaryButton } from "@/components/glass";
import { colors, fonts } from "@/theme";

/* Der Atem (13.09.2026, Gratis-Feature aus der Analyse „Warum die App
 * scheitern kann", §2): die 4-7-8-Übung, die als Text in der Checkliste
 * stand, als geführte Minute. Einatmen 4 s — der Kreis wächst; halten 7 s —
 * er leuchtet; ausatmen 8 s — er sinkt. Vier Runden, eine sanfte Haptik je
 * Wechsel, damit es mit geschlossenen Augen geht. */
type Phase = "in" | "hold" | "out";
const STEPS: { phase: Phase; seconds: number }[] = [
  { phase: "in", seconds: 4 },
  { phase: "hold", seconds: 7 },
  { phase: "out", seconds: 8 },
];

export function Breath({ L, rounds = 4 }: { L: Record<string, any>; rounds?: number }) {
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const scale = useSharedValue(0.55);
  const glow = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function run(r: number, s: number) {
    const cur = STEPS[s];
    setRound(r); setStep(s); setLeft(cur.seconds);
    Haptics.impactAsync(cur.phase === "hold" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft);
    const ms = cur.seconds * 1000;
    if (cur.phase === "in") { scale.value = withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }); glow.value = withTiming(0.4, { duration: ms }); }
    if (cur.phase === "hold") { glow.value = withTiming(1, { duration: 900 }); }
    if (cur.phase === "out") { scale.value = withTiming(0.55, { duration: ms, easing: Easing.inOut(Easing.sin) }); glow.value = withTiming(0, { duration: ms }); }
    let n = cur.seconds;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      n -= 1;
      if (n > 0) { setLeft(n); return; }
      clearInterval(timer.current!);
      const nextStep = (s + 1) % STEPS.length;
      const nextRound = nextStep === 0 ? r + 1 : r;
      if (nextRound >= rounds) { finish(true); return; }
      run(nextRound, nextStep);
    }, 1000);
  }

  function start() { setDone(false); setRunning(true); run(0, 0); }
  function finish(complete: boolean) {
    if (timer.current) clearInterval(timer.current);
    cancelAnimation(scale); cancelAnimation(glow);
    scale.value = withTiming(0.55, { duration: 600 }); glow.value = withTiming(0, { duration: 600 });
    setRunning(false); setDone(complete);
    if (complete) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.25 + glow.value * 0.55, transform: [{ scale: scale.value * (1.15 + glow.value * 0.1) }] }));
  const phase = STEPS[step].phase;
  const word = running ? (phase === "in" ? L.in : phase === "hold" ? L.hold : L.out) : done ? L.done : L.ready;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={running ? () => finish(false) : start} style={styles.stage} accessibilityRole="button" accessibilityLabel={running ? L.stop : L.start}>
        <Animated.View style={[styles.halo, halo]} />
        <Animated.View style={[styles.circle, circle]} />
        <View style={styles.center}>
          <Text style={styles.word}>{word}</Text>
          {running ? <Text style={styles.count}>{left}</Text> : null}
        </View>
      </Pressable>
      {running ? <Text style={styles.round}>{String(L.round ?? "{n}/{m}").replace("{n}", String(round + 1)).replace("{m}", String(rounds))}</Text> : <Text style={styles.how}>{L.how}</Text>}
      <PrimaryButton label={running ? L.stop : done ? L.again : L.start} onPress={running ? () => finish(false) : start} style={{ flex: 0, alignSelf: "stretch" }} />
    </View>
  );
}

const SIZE = 240;
const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 18 },
  stage: { width: SIZE + 60, height: SIZE + 60, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: "rgba(79,214,230,0.25)", shadowColor: colors.cyan, shadowOpacity: 0.8, shadowRadius: 40, shadowOffset: { width: 0, height: 0 } },
  circle: { position: "absolute", width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: "rgba(79,214,230,0.16)", borderWidth: 1.5, borderColor: "rgba(79,214,230,0.6)" },
  center: { alignItems: "center", gap: 2 },
  word: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, textAlign: "center" },
  count: { color: colors.cyan, fontSize: 22, fontVariant: ["tabular-nums"], fontWeight: "600" },
  round: { color: colors.muted, fontSize: 14, fontVariant: ["tabular-nums"] },
  how: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", paddingHorizontal: 12 },
});
