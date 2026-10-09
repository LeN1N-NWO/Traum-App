import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { PrimaryButton } from "@/components/glass";
import { Mark } from "@/components/moonweave";
import type { GiftCard, GiftReveal } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Die Geschenke der Serie (Antons Ansage 03.10.: „noch so ein Icon, wie so
 * ein Geschenk … sodass es mehr Wert diesem Credit bietet").
 *
 *   · GiftPreview — Tipp auf ein Geschenk (die Mitte des Traumfängers):
 *     das Geschenk-Siegel — gedämpft, wenn noch nicht erreicht —, darunter NUR Titel, ein Satz und der Fortschritt (Antons
 *     Befund 03.10.: „muss kompakter und schneller verständlich sein").
 *   · GiftOpen — das frisch erreichte Geschenk (home.giftReveal, seit
 *     10.10. über das Siegel in der Mitte geöffnet): antippen, das Funkeln
 *     dreht sich, Sterne fliegen, das Guthaben zählt hoch, und gleich
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

/* ── Das Geschenk-Siegel (Moonweave, Antons Übergabe 10.10.: „keine
 * Edelsteine, nur Licht" — ersetzt die Geschenksteine vom 04.10.). Eine
 * dunkle runde Fläche mit warmem Rand, darin das Funkeln (3, 6, 9) oder
 * das Abspielzeichen (12, der Sammelfilm) — dieselben Zeichen wie am Ring
 * (components/moonweave.tsx). Drei Phasen:
 *   idle   — noch nicht erreicht: kühl und gedämpft; erreicht: warm.
 *   charge — 0,6 s: das Zeichen zittert, der Schein wird heller, Haptik-Ticks
 *   open   — das Zeichen dreht sich einmal halb (in der Mitte 1,3-fach),
 *            Lichtstrahlen fächern auf, kleine Sterne fliegen heraus
 * Alles nur transform/opacity nativer Ebenen; das Siegel selbst ist still. */
export type GiftPhase = "idle" | "charge" | "open";
const STONE = 116;
const STAGE_W = 200, STAGE_H = 216, CY = 92;
const WARM = "#efd19e";

function Twinkle({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true)); }, [k, delay]);
  const a = useAnimatedStyle(() => ({ opacity: 0.15 + 0.85 * k.value, transform: [{ scale: 0.6 + 0.5 * k.value }, { rotate: `${k.value * 45}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s }, a]}>
      <Svg width={s} height={s}><Path d={`M${s / 2} 0 L${s * 0.6} ${s * 0.4} L${s} ${s / 2} L${s * 0.6} ${s * 0.6} L${s / 2} ${s} L${s * 0.4} ${s * 0.6} L0 ${s / 2} L${s * 0.4} ${s * 0.4}Z`} fill="#FFF3CF" /></Svg>
    </Animated.View>
  );
}

/** Das Siegel mit Bühne: Schein, Strahlen, Zeichen, Funkeln, Sterne.
 *  `mode` preview = Tipp auf ein Geschenk, reveal = das frisch erreichte öffnen. */
function GiftArt({ phase, num, mode, reached = false }: { phase: GiftPhase; num: number; mode: "preview" | "reveal"; reached?: boolean; filled?: number }) {
  const reduce = useReducedMotion();
  const film = num % 12 === 0;
  const lit = mode === "reveal" || reached;
  const rock = useSharedValue(0), glow = useSharedValue(0), rays = useSharedValue(0), spin = useSharedValue(0), turn = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    glow.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
  }, [reduce, glow, spin]);
  useEffect(() => {
    if (phase === "open") {
      rock.value = withTiming(0, { duration: 60 });
      if (reduce) return;
      turn.value = withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) });
      rays.value = withSequence(withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }), withDelay(900, withTiming(0.55, { duration: 900 })));
      return;
    }
    if (reduce || phase !== "charge") return;
    rock.value = withRepeat(withSequence(withTiming(-0.06, { duration: 45 }), withTiming(0.06, { duration: 45 })), -1, true);
    glow.value = withTiming(1.6, { duration: 600 });
  }, [phase, reduce, rock, glow, rays, turn]);

  const aura = useAnimatedStyle(() => ({ opacity: 0.25 + 0.3 * glow.value, transform: [{ scale: 0.95 + 0.12 * glow.value + 0.6 * rays.value }] }));
  const rayStyle = useAnimatedStyle(() => ({ opacity: rays.value, transform: [{ scale: 0.3 + 1.1 * rays.value }, { rotate: `${spin.value * 360}deg` }] }));
  const emblem = useAnimatedStyle(() => ({ transform: [{ rotate: `${rock.value + turn.value * Math.PI}rad` }, { scale: 1 + 0.3 * Math.sin(turn.value * Math.PI) }] }));
  const cx = STAGE_W / 2;
  const opened = phase === "open";

  return (
    <View style={{ width: STAGE_W, height: STAGE_H }} pointerEvents="none">
      {/* weich auslaufender Schein — keine Scheibe mit Kante */}
      <Animated.View style={[{ position: "absolute", left: cx - 110, top: CY - 110, width: 220, height: 220 }, aura]}>
        <Svg width={220} height={220}>
          <Defs>
            <RadialGradient id="gs-aura" cx="50%" cy="50%" r="50%">
              <Stop offset="0.4" stopColor={lit ? "#e1c99c" : "#8f7bc9"} stopOpacity={0.32} />
              <Stop offset="1" stopColor={lit ? "#e1c99c" : "#8f7bc9"} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={110} cy={110} r={110} fill="url(#gs-aura)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: cx - 120, top: CY - 120, width: 240, height: 240 }, rayStyle]}>
        <Svg width={240} height={240}>
          {/* Lichtstrahlen, die nach außen auslaufen — keine Keile mit Kante */}
          <Defs>
            <RadialGradient id="gs-ray" gradientUnits="userSpaceOnUse" cx={120} cy={120} r={118} fx={120} fy={120}>
              <Stop offset="0.3" stopColor={WARM} stopOpacity={0.55} />
              <Stop offset="1" stopColor={WARM} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2, b = a + (i % 2 ? 0.05 : 0.09);
            return <Path key={i} d={`M120 120 L${120 + Math.cos(a) * 118} ${120 + Math.sin(a) * 118} L${120 + Math.cos(b) * 118} ${120 + Math.sin(b) * 118}Z`} fill="url(#gs-ray)" opacity={i % 2 ? 0.6 : 1} />;
          })}
        </Svg>
      </Animated.View>
      {/* das Siegel */}
      <View style={{ position: "absolute", left: cx - STONE / 2, top: CY - STONE / 2, width: STONE, height: STONE, alignItems: "center", justifyContent: "center" }}>
        <Svg width={STONE} height={STONE} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="gs-seal" cx="35%" cy="25%" r="80%"><Stop offset="0" stopColor={lit ? "#39313f" : "#1d2233"} /><Stop offset="1" stopColor="#131828" /></RadialGradient>
          </Defs>
          <Circle cx={STONE / 2} cy={STONE / 2} r={STONE / 2 - 1} fill="url(#gs-seal)" stroke={lit ? "#d7c19b" : "#5e6c85"} strokeOpacity={lit ? 0.54 : 0.4} strokeWidth={1.2} />
        </Svg>
        <Animated.View style={emblem}>
          <Mark kind={film ? "play" : "spark"} size={52} width={1.8} color={lit ? WARM : "#7c7182"} />
        </Animated.View>
      </View>
      {!opened && lit ? (
        <>
          <Twinkle x={cx - 70} y={34} s={12} delay={0} />
          <Twinkle x={cx + 72} y={60} s={9} delay={500} />
          <Twinkle x={cx + 62} y={146} s={11} delay={900} />
          <Twinkle x={cx - 66} y={136} s={8} delay={300} />
        </>
      ) : null}
      {opened && !reduce ? Array.from({ length: 16 }, (_, i) => <Flyer key={i} i={i} n={16} cx={cx} cy={CY} />) : null}
    </View>
  );
}

/* Was beim Öffnen herausfliegt: kleine Sterne, rundum. */
function Flyer({ i, n, cx, cy }: { i: number; n: number; cx: number; cy: number }) {
  const k = useSharedValue(0);
  const a = -Math.PI / 2 + (i / Math.max(1, n - 1) - 0.5) * 3.6 + (i % 2 ? 0.12 : -0.12);
  const dist = 80 + (i % 4) * 26;
  useEffect(() => {
    k.value = withDelay(20 + (i % 5) * 30, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, [k, i]);
  const st = useAnimatedStyle(() => ({
    opacity: k.value === 0 ? 0 : k.value < 0.75 ? 1 : (1 - k.value) * 4,
    transform: [
      { translateX: Math.cos(a) * dist * k.value },
      { translateY: Math.sin(a) * dist * k.value + 60 * k.value * k.value },   // sinkt am Ende, wie geworfen
      { rotate: `${(i % 2 ? 1 : -1) * 260 * k.value}deg` },
      { scale: 1.2 - 0.6 * k.value },
    ],
  }));
  const s = i % 3 === 0 ? 12 : 7;
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: cx - s / 2, top: cy - s / 2, width: s, height: s }, st]}>
      <Svg width={s} height={s}><Path d={`M${s / 2} 0 L${s * 0.6} ${s * 0.4} L${s} ${s / 2} L${s * 0.6} ${s * 0.6} L${s / 2} ${s} L${s * 0.4} ${s * 0.6} L0 ${s / 2} L${s * 0.4} ${s * 0.4}Z`} fill={i % 4 ? "#FFF3CF" : WARM} /></Svg>
    </Animated.View>
  );
}

/* Der Blitz beim Öffnen — über der ganzen Karte. */
function Flash({ go }: { go: boolean }) {
  const k = useSharedValue(0);
  useEffect(() => { if (go) k.value = withSequence(withTiming(0.85, { duration: 70 }), withTiming(0, { duration: 420 })); }, [go, k]);
  const st = useAnimatedStyle(() => ({ opacity: k.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#FFF6DD" }, st]} />;
}

/** Tipp auf ein Geschenk: Titel, ein Satz, Fortschritt. */
export function GiftPreview({ card, onClose }: { card: GiftCard | null; onClose: () => void }) {
  return (
    !card ? null : <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.layer}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {card ? (
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.eyebrow}>{card.eyebrow}</Text>
            <GiftArt phase="idle" mode="preview" num={card.num ?? 12} reached={card.progress >= 1} filled={card.ringFilled ?? 0} />
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
  const [phase, setPhase] = useState<GiftPhase>("idle");
  const [n, setN] = useState(0);
  const pop = useSharedValue(0);
  useEffect(() => { if (!g) { setPhase("idle"); setN(0); pop.value = 0; } }, [g, pop]);
  /* Aufladen: 0,6 s Zittern mit leisen Ticks, dann knallt es. */
  useEffect(() => {
    if (phase !== "charge") return;
    let ticks = 0;
    const tick = setInterval(() => { ticks += 1; Haptics.impactAsync(ticks < 4 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium); }, 120);
    const go = setTimeout(() => {
      clearInterval(tick);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 140);
      setPhase("open");
    }, 620);
    return () => { clearInterval(tick); clearTimeout(go); };
  }, [phase]);
  useEffect(() => {
    if (phase !== "open" || !g) return;
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - 420 - start) / 900);
      if (p <= 0) return;
      setN(Math.round(g.credits * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) {
        clearInterval(t);
        pop.value = withSequence(withTiming(1.25, { duration: 140 }), withSpring(1, { damping: 7 }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      }
    }, 30);
    return () => clearInterval(t);
  }, [phase, g, pop]);
  const numStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value || 1 }] }));
  const open = phase === "open";

  return (
    !g ? null : <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={styles.layer}>
      <View style={styles.backdrop}>
        {g ? (
          <View style={styles.card}>
            <Animated.Text entering={FadeInDown.duration(400)} style={styles.eyebrow}>{g.title}</Animated.Text>
            <Pressable disabled={phase !== "idle"} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPhase("charge"); }} accessibilityRole="button" accessibilityLabel={g.tapToOpen}>
              <GiftArt phase={phase} mode="reveal" num={g.nights} />
              {open && g.credits > 0 ? (
                <Animated.View entering={FadeIn.delay(380).duration(300)} style={styles.burst} pointerEvents="none">
                  <Animated.Text style={[styles.burstN, numStyle]}>+{n}</Animated.Text>
                </Animated.View>
              ) : null}
            </Pressable>
            {!open ? (
              <Text style={styles.tap}>{g.tapToOpen}</Text>
            ) : (
              <Animated.View entering={FadeInDown.delay(800).duration(420)} style={{ alignItems: "center", gap: 6, alignSelf: "stretch" }}>
                <Text style={styles.title}>{g.label}</Text>
                {g.sub ? <Text style={styles.surprise}>{g.sub}</Text> : null}
                {g.expires ? <Text style={styles.small}>{g.expires}</Text> : null}
                <PrimaryButton label={g.redeem} heavy onPress={onRedeem} style={{ alignSelf: "stretch", marginTop: 10, flex: 0 }} />
                <Pressable onPress={onLater} hitSlop={10} style={styles.later}><Text style={styles.laterText}>{g.later}</Text></Pressable>
              </Animated.View>
            )}
          </View>
        ) : null}
        <Flash go={open} />
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
  burst: { position: "absolute", left: 0, right: 0, top: CY + STONE / 2 - 8, alignItems: "center" },
  burstN: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 52, color: GOLD, fontVariant: ["tabular-nums"] },
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
