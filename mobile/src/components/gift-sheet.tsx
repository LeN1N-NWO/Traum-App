import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { PrimaryButton } from "@/components/glass";
import type { GiftCard, GiftReveal } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Die Geschenke der Serie (Antons Ansage 03.10.: „noch so ein Icon, wie so
 * ein Geschenk … sodass es mehr Wert diesem Credit bietet").
 *
 *   · GiftPreview — Tipp auf ein Geschenk (das nächste unter dem Ring oder
 *     das große oben, „dein Monat als Film"): die geschlossene Schachtel
 *     wackelt, darunter NUR Titel, ein Satz und der Fortschritt (Antons
 *     Befund 03.10.: „muss kompakter und schneller verständlich sein").
 *   · GiftOpen — das frisch erreichte Geschenk (home.giftReveal): antippen,
 *     der Deckel fliegt, Funken, das Guthaben zählt hoch, und gleich
 *     darunter „Einlösen" — ein Geschenk, das man erst suchen muss, ist
 *     halb verschenkt.
 *
 * Leistung: nur transform/opacity, keine Schatten über bewegten Ebenen.
 *
 * ⚠ KEIN <Modal> (Antons Befund 03.10.: die Serien-Pille ließ sich nicht
 * mehr antippen, das Geschenk ging nie auf): iOS präsentiert Geschwister-
 * Modals unzuverlässig (siehe privacy-gate.tsx) — das Geschenk-Modal blieb
 * „offen", ohne sichtbar zu sein, und blockierte jedes weitere Blatt.
 * Beide Karten sind Ebenen, die die Startseite als LETZTE Kinder über sich
 * legt (app/index.tsx). */

const BOX = 96;

/** Die Schachtel: Körper, Schleife, Deckel — der Deckel fliegt beim Öffnen. */
function GiftBox({ open, wobble }: { open: boolean; wobble: boolean }) {
  const reduce = useReducedMotion();
  const rock = useSharedValue(0);
  const glow = useSharedValue(0);
  const lid = useSharedValue(0);
  const body = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    glow.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    if (wobble) {
      rock.value = withRepeat(withSequence(
        withDelay(1400, withTiming(-0.09, { duration: 90 })), withTiming(0.09, { duration: 110 }),
        withTiming(-0.06, { duration: 100 }), withTiming(0.04, { duration: 90 }), withTiming(0, { duration: 80 }),
      ), -1, false);
    }
  }, [reduce, wobble, rock, glow]);
  useEffect(() => {
    if (!open) return;
    rock.value = withTiming(0, { duration: 80 });
    lid.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    body.value = withDelay(220, withTiming(0, { duration: 380 }));
  }, [open, rock, lid, body]);

  const all = useAnimatedStyle(() => ({ transform: [{ rotate: `${rock.value}rad` }] }));
  const aura = useAnimatedStyle(() => ({ opacity: 0.25 + 0.35 * glow.value + 0.4 * lid.value, transform: [{ scale: 1 + 0.08 * glow.value + 0.9 * lid.value }] }));
  const lidStyle = useAnimatedStyle(() => ({
    opacity: 1 - lid.value,
    transform: [{ translateY: -70 * lid.value }, { translateX: 26 * lid.value }, { rotate: `${0.7 * lid.value}rad` }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({ opacity: body.value, transform: [{ scale: 0.6 + 0.4 * body.value }] }));

  return (
    <View style={styles.boxStage}>
      <Animated.View style={[styles.aura, aura]} />
      <Animated.View style={all}>
        <Animated.View style={[styles.boxBody, bodyStyle]}>
          <View style={styles.ribbonV} />
        </Animated.View>
        <Animated.View style={[styles.lid, lidStyle]}>
          <View style={styles.ribbonV} />
          <View style={styles.bowL} /><View style={styles.bowR} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Funken, die beim Öffnen aus der Schachtel fliegen. */
function Sparks({ go }: { go: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 14 }, (_, i) => <Spark key={i} i={i} go={go} />)}
    </View>
  );
}
function Spark({ i, go }: { i: number; go: boolean }) {
  const k = useSharedValue(0);
  const a = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
  const dist = 70 + (i % 3) * 26;
  useEffect(() => { if (go) k.value = withDelay(120 + (i % 4) * 30, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })); }, [go, k, i]);
  const st = useAnimatedStyle(() => ({
    opacity: k.value === 0 ? 0 : 1 - k.value,
    transform: [{ translateX: Math.cos(a) * dist * k.value }, { translateY: Math.sin(a) * dist * k.value }, { scale: 1 - 0.5 * k.value }],
  }));
  return <Animated.View style={[styles.spark, i % 3 === 0 && styles.sparkBig, st]} />;
}

/** Tipp auf ein Geschenk: Titel, ein Satz, Fortschritt. */
export function GiftPreview({ card, onClose }: { card: GiftCard | null; onClose: () => void }) {
  return (
    !card ? null : <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.layer}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {card ? (
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.eyebrow}>{card.eyebrow}</Text>
            <GiftBox open={false} wobble />
            <Text style={styles.title}>{card.title}</Text>
            <Text style={styles.surprise}>{card.sub}</Text>
            {/* Kurze Zahl („5 / 7") neben dem Balken, ein Satz darunter. */}
            <View style={styles.progressRow}>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.round(card.progress * 100)}%` }]} /></View>
              {card.progressText.length <= 9 ? <Text style={styles.progressText}>{card.progressText}</Text> : null}
            </View>
            {card.progressText.length > 9 ? <Text style={[styles.progressText, { textAlign: "center" }]}>{card.progressText}</Text> : null}
            {card.foot ? <Text style={styles.small}>{card.foot}</Text> : null}
            <Pressable onPress={onClose} hitSlop={10} style={styles.later}><Text style={styles.laterText}>{card.close}</Text></Pressable>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/** Das frisch erreichte Geschenk — öffnen, zählen, einlösen. */
export function GiftOpen({ g, onRedeem, onLater }: { g: GiftReveal | null; onRedeem: () => void; onLater: () => void }) {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => { if (!g) { setOpen(false); setN(0); } }, [g]);
  useEffect(() => {
    if (!open || !g) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - 450 - start) / 900);
      if (p <= 0) return;
      setN(Math.round(g.credits * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) { clearInterval(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    }, 30);
    return () => clearInterval(t);
  }, [open, g]);

  return (
    !g ? null : <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={styles.layer}>
      <View style={styles.backdrop}>
        {g ? (
          <View style={styles.card}>
            <Animated.Text entering={FadeInDown.duration(400)} style={styles.eyebrow}>{g.title}</Animated.Text>
            <Pressable disabled={open} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setOpen(true); }} accessibilityRole="button" accessibilityLabel={g.tapToOpen}>
              <GiftBox open={open} wobble={!open} />
              <Sparks go={open} />
              {open ? (
                <Animated.View entering={FadeIn.delay(380).duration(400)} style={styles.burst} pointerEvents="none">
                  <Text style={styles.burstN}>+{n}</Text>
                </Animated.View>
              ) : null}
            </Pressable>
            {!open ? (
              <Text style={styles.tap}>{g.tapToOpen}</Text>
            ) : (
              <Animated.View entering={FadeInDown.delay(700).duration(420)} style={{ alignItems: "center", gap: 6, alignSelf: "stretch" }}>
                <Text style={styles.title}>{g.label}</Text>
                {g.sub ? <Text style={styles.surprise}>{g.sub}</Text> : null}
                {g.expires ? <Text style={styles.small}>{g.expires}</Text> : null}
                <PrimaryButton label={g.redeem} heavy onPress={onRedeem} style={{ alignSelf: "stretch", marginTop: 10, flex: 0 }} />
                <Pressable onPress={onLater} hitSlop={10} style={styles.later}><Text style={styles.laterText}>{g.later}</Text></Pressable>
              </Animated.View>
            )}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const GOLD = colors.gold;
const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,14,0.86)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, alignItems: "center", gap: 8, paddingVertical: 26, paddingHorizontal: 22, borderRadius: 26, backgroundColor: "rgba(12,20,35,0.98)", borderWidth: 1, borderColor: "rgba(246,198,91,0.35)" },
  eyebrow: { color: GOLD, fontSize: 12, letterSpacing: 1.6, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  boxStage: { width: 180, height: 170, alignItems: "center", justifyContent: "center" },
  aura: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(246,198,91,0.22)" },
  boxBody: { width: BOX, height: BOX * 0.72, marginTop: BOX * 0.18, borderRadius: 10, backgroundColor: GOLD, alignItems: "center", overflow: "hidden" },
  lid: { position: "absolute", top: BOX * 0.02, left: -6, width: BOX + 12, height: BOX * 0.24, borderRadius: 8, backgroundColor: "#ffd98a", alignItems: "center" },
  ribbonV: { width: 14, height: "100%", backgroundColor: "#7a3b12" },
  bowL: { position: "absolute", top: -18, left: (BOX + 12) / 2 - 30, width: 30, height: 20, borderRadius: 12, borderWidth: 5, borderColor: "#7a3b12", transform: [{ rotate: "-0.35rad" }] },
  bowR: { position: "absolute", top: -18, left: (BOX + 12) / 2, width: 30, height: 20, borderRadius: 12, borderWidth: 5, borderColor: "#7a3b12", transform: [{ rotate: "0.35rad" }] },
  spark: { position: "absolute", left: 90 - 3, top: 85 - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff3cf" },
  sparkBig: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: GOLD },
  burst: { position: "absolute", left: 0, right: 0, top: 50, alignItems: "center" },
  burstN: { fontFamily: fonts.serif, fontSize: 52, color: GOLD, fontVariant: ["tabular-nums"] },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, color: colors.text, textAlign: "center" },
  worth: { color: GOLD, fontSize: 14, fontWeight: "600" },
  surprise: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "stretch", marginTop: 6 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(234,240,251,0.12)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3, backgroundColor: GOLD },
  progressText: { color: GOLD, fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  rule: { marginTop: 8, gap: 4, alignSelf: "stretch", paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(234,240,251,0.15)" },
  small: { color: colors.faint, fontSize: 12.5, lineHeight: 18, textAlign: "center" },
  tap: { color: colors.muted, fontSize: 14, marginTop: 4 },
  later: { paddingVertical: 8, marginTop: 2 },
  laterText: { color: colors.muted, fontSize: 15 },
});
