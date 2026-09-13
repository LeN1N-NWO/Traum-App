import * as Haptics from "expo-haptics";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import { colors, fonts } from "@/theme";

/* Die Belohnung nach dem Abgeben (Antons Ansage 13.09.2026): „Nach dem Klick
 * eher eine Belohnungsbenachrichtigung — ‚Wow, das ist dein erster Traum',
 * Konfetti, coole Animation — und dann zurück ins Journal, wo wir warten,
 * bis der Traum ankommt."
 *
 * Konfetti ohne neue native Abhängigkeit: ein gemeinsamer Fortschritt, jedes
 * Teilchen rechnet daraus Flugbahn (Wurf + Schwerkraft), Drehung und
 * Ausblenden. Zwei Salven, damit es nicht nach einem einzelnen Knall wirkt. */
const PALETTE = [colors.warm, colors.gold, colors.accentSoft, colors.cyan, colors.ok, "#ff8fb1", "#ffffff"];
const COUNT = 56;

type Piece = { vx: number; vy: number; spin: number; size: number; color: string; round: boolean; delay: number; sway: number };

function makePieces(seed: number): Piece[] {
  let x = seed;
  const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  return Array.from({ length: COUNT }, (_, i) => {
    const angle = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.1;   // nach oben gefächert
    const speed = 0.55 + rnd() * 0.65;
    return {
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      spin: (rnd() - 0.5) * 1440, size: 6 + rnd() * 7, color: PALETTE[i % PALETTE.length],
      round: rnd() > 0.65, delay: i % 2 === 0 ? 0 : 0.18, sway: (rnd() - 0.5) * 0.08,
    };
  });
}

function Bit({ p, t, w, h }: { p: Piece; t: SharedValue<number>; w: number; h: number }) {
  const style = useAnimatedStyle(() => {
    const k = Math.max(0, Math.min(1, (t.value - p.delay) / (1 - p.delay)));
    const x = (p.vx * k + p.sway * Math.sin(k * 12)) * w * 0.9;
    const y = (p.vy * k + 1.25 * k * k) * h * 0.75;              // Wurf nach oben, dann fällt es
    return {
      opacity: k === 0 ? 0 : k > 0.75 ? (1 - k) / 0.25 : 1,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${p.spin * k}deg` }, { scaleY: 0.6 + 0.4 * Math.abs(Math.cos(k * 18)) }],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.bit, { width: p.size, height: p.round ? p.size : p.size * 0.45, borderRadius: p.round ? p.size / 2 : 1.5, backgroundColor: p.color }, style]} />;
}

export function Confetti({ burst, origin }: { burst: number; origin?: { x: number; y: number } }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const pieces = useMemo(() => makePieces(burst * 7919 + 17), [burst]);
  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) });
  }, [burst, t]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
      <View style={{ position: "absolute", top: origin?.y ?? height * 0.52, left: origin?.x ?? width / 2 }}>
        {pieces.map((p, i) => <Bit key={i} p={p} t={t} w={width} h={height} />)}
      </View>
    </View>
  );
}

/** Der ganze Moment: Konfetti, ein pulsierender Stern, die Überschrift. */
/** `origin`: Wo das Konfetti herausplatzt — beim Frosch-Tipp die Mitte des
 *  Knopfes, den er gerade getroffen hat (Fensterkoordinaten). */
export function Celebration({ title, text, hint, origin }: { title: string; text: string; hint?: string; origin?: { x: number; y: number } }) {
  const star = useSharedValue(0);
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const second = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 420);
    star.value = withSequence(withSpring(1.15, { damping: 7, stiffness: 120 }), withDelay(200, withSpring(1, { damping: 12 })));
    return () => clearTimeout(second);
  }, [star]);
  const starStyle = useAnimatedStyle(() => ({ transform: [{ scale: star.value }, { rotate: `${(1 - Math.min(star.value, 1)) * -40}deg` }], opacity: Math.min(1, star.value * 1.4) }));
  return (
    <View style={styles.stage}>
      <Confetti burst={1} origin={origin} />
      <Animated.View style={[styles.star, starStyle]}>
        <Text style={styles.starGlyph}>✦</Text>
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(220).duration(420)} style={styles.title}>{title}</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(420).duration(420)} style={styles.text}>{text}</Animated.Text>
      {hint ? <Animated.Text entering={FadeInDown.delay(620).duration(420)} style={styles.hint}>{hint}</Animated.Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 14 },
  bit: { position: "absolute" },
  star: { width: 132, height: 132, borderRadius: 66, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,198,91,0.12)", borderWidth: 1, borderColor: "rgba(246,198,91,0.45)", shadowColor: colors.gold, shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, marginBottom: 10 },
  starGlyph: { fontSize: 64, color: colors.gold, lineHeight: 72 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40, color: colors.text, textAlign: "center" },
  text: { color: colors.text, fontSize: 17, lineHeight: 24, textAlign: "center" },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
});
