import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, FadeIn, runOnJS, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { MascotLoader } from "@/components/mascot-loader";
import { colors, fonts } from "@/theme";

/* Der Ladebildschirm zwischen Einsprechen und „Film oder Speichern"
 * (Antons Wunsch 10.10.): die Galaxie, darunter ein Balken von 0 bis 100 %
 * und ein Satz, der wechselt — was gerade passiert.
 *
 * Der Balken ist bewusst NICHT wahrheitsgemäß („der Ladebalken ist random"):
 * Er läuft nach der geschätzten Dauer (lib/speech-timing.ts estimateReadMs)
 * in zufälligen Etappen — mal ein Sprung, mal ein Zögern — bis ~90 %. Kommt
 * die Antwort früher, beschleunigt er auf 100 % und meldet `onComplete`.
 * Dauert es länger als geschätzt, kriecht er langsam weiter, bleibt aber
 * unter 100 %, bis die Antwort wirklich da ist.
 *
 * Bewegt wird nur eine Skalierung (UI-Thread), die Prozentzahl folgt in
 * ganzen Schritten. Bei „Bewegung reduzieren" springt nichts, er füllt sich
 * gleichmäßig. */
export function DreamLoader({ estimateMs, done, onComplete, steps, cancelLabel, onCancel }: {
  estimateMs: number;
  done: boolean;
  onComplete: () => void;
  steps: string[];
  cancelLabel?: string;
  onCancel?: () => void;
}) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  const [pct, setPct] = useState(0);
  const [step, setStep] = useState(0);
  const finished = useRef(false);
  const complete = useRef(onComplete);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => complete.current(), 180);   // die 100 % kurz stehen lassen
  };

  /* Der Plan: 5–7 Etappen mit zufälligen Anteilen an Weg und Zeit, zusammen
     ~90 % in der geschätzten Dauer, danach ein langsames Kriechen. */
  useEffect(() => {
    if (reduce) {
      p.value = withTiming(0.92, { duration: estimateMs, easing: Easing.linear });
      return;
    }
    const n = 5 + Math.floor(Math.random() * 3);
    const way = Array.from({ length: n }, () => 0.4 + Math.random());
    const time = Array.from({ length: n }, () => 0.3 + Math.random());
    const sw = way.reduce((a, b) => a + b, 0), st = time.reduce((a, b) => a + b, 0);
    let at = 0;
    const legs = way.map((w, i) => {
      at += (w / sw) * 0.9;
      const ms = Math.max(160, (time[i] / st) * estimateMs);
      // mal zügig, mal zögernd — wie ein echter Ladevorgang
      const easing = Math.random() < 0.5 ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad);
      return withTiming(at, { duration: ms, easing });
    });
    p.value = withSequence(...legs, withTiming(0.97, { duration: Math.max(8000, estimateMs * 2), easing: Easing.out(Easing.quad) }));
    return () => cancelAnimation(p);
  }, [estimateMs, reduce, p]);

  // Fertig: zügig auf 100 % — je mehr fehlt, desto etwas länger, nie zäh.
  useEffect(() => {
    if (!done || finished.current) return;
    finished.current = true;
    cancelAnimation(p);
    const left = 1 - p.value;
    p.value = withTiming(1, { duration: 280 + left * 520, easing: Easing.out(Easing.quad) }, (ok) => {
      if (ok) runOnJS(finish)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  useAnimatedReaction(() => Math.floor(p.value * 100), (v, prev) => { if (v !== prev) runOnJS(setPct)(v); });

  // Der Satz darunter: über die geschätzte Dauer verteilt, der letzte bleibt stehen.
  useEffect(() => {
    if (steps.length < 2) return;
    const every = Math.max(1400, Math.min(2600, estimateMs / steps.length));
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), every);
    return () => clearInterval(id);
  }, [steps.length, estimateMs]);

  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.001, p.value) }] }));

  return (
    <View style={styles.wrap} accessible accessibilityRole="progressbar" accessibilityLabel={steps[step] ?? ""} accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <MascotLoader size={230} />
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <Text style={styles.pct}>{pct} %</Text>
      <Animated.Text key={step} entering={FadeIn.duration(380)} style={styles.step}>{steps[step] ?? ""}</Animated.Text>
      {onCancel ? (
        <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button" style={{ marginTop: 18 }}>
          <Text style={styles.cancel}>{cancelLabel ?? "Cancel"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 14, paddingHorizontal: 32 },
  track: { alignSelf: "stretch", height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 18 },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, right: 0, borderRadius: 3, backgroundColor: colors.gold, transformOrigin: "left center" },
  pct: { color: colors.gold, fontSize: 13, fontVariant: ["tabular-nums"], marginTop: -4 },
  step: { color: colors.text, fontFamily: fonts.serif, fontSize: 20, textAlign: "center", minHeight: 28 },
  cancel: { color: colors.faint, fontSize: 14 },
});
