import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { DreamStone, PrismStone, giftStoneOf } from "@/components/dream-stone";
import { PrimaryButton } from "@/components/glass";
import { useScreenActive } from "@/lib/use-screen-active";
import type { GiftCard, GiftReveal } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Die Geschenke der Serie (Antons Ansage 03.10.: „noch so ein Icon, wie so
 * ein Geschenk … sodass es mehr Wert diesem Credit bietet").
 *
 *   · GiftPreview — Tipp auf ein Geschenk (das nächste unter dem Ring oder
 *     ein Stein am Reif): der Geschenkstein in groß — roh, wenn noch nicht
 *     erreicht —, darunter NUR Titel, ein Satz und der Fortschritt (Antons
 *     Befund 03.10.: „muss kompakter und schneller verständlich sein").
 *   · GiftOpen — das frisch erreichte Geschenk (home.giftReveal): antippen,
 *     die rohe Schale springt, der Stein funkelt, das Guthaben zählt hoch, und gleich
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

/* ── Der Geschenkstein (Antons Wunsch 04.10. abends: „die jeweiligen Steine
 * in groß statt den Geschenken" — ersetzt die Traum-Schachtel). Die
 * Geschenke 3, 6, 9 sind die Steine vom Reif in groß, das Geschenk 12 ist
 * der Herzstein (components/dream-stone.tsx). Drei Phasen:
 *   idle   — noch nicht erreicht: roh und matt, wackelt alle paar Sekunden;
 *            erreicht: geschliffen und funkelnd. Der Herzstein zeigt in
 *            der Vorschau seine schon leuchtenden Keile.
 *   charge — 0,6 s: der rohe Stein zittert schneller, glüht auf, Haptik-Ticks
 *   open   — Blitz, die rohe Schale springt in Splitter, Lichtstrahlen
 *            fächern auf, der geschliffene Stein springt heraus und funkelt
 * Alles nur transform/opacity nativer Ebenen; die Steine selbst sind still. */
export type GiftPhase = "idle" | "charge" | "open";
const STONE = 116;
const STAGE_W = 200, STAGE_H = 216, CY = 92;

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

/** Der Stein mit Bühne: Aura, Strahlen, roher und geschliffener Stein, Funkeln, Splitter.
 *  `mode` preview = Tipp auf ein Geschenk, reveal = das frisch erreichte öffnen. */
function GiftArt({ phase, num, mode, reached = false, filled = 0 }: { phase: GiftPhase; num: number; mode: "preview" | "reveal"; reached?: boolean; filled?: number }) {
  const reduce = useReducedMotion();
  const live = useScreenActive();
  const st = giftStoneOf(num);
  // Was zu Beginn zu sehen ist: die rohe Schale oder schon der geschliffene Stein.
  const roughFirst = mode === "reveal" || (!st.heart && !reached);
  const rock = useSharedValue(0), glow = useSharedValue(0), rays = useSharedValue(0), spin = useSharedValue(0);
  const rough = useSharedValue(roughFirst ? 1 : 0), cut = useSharedValue(roughFirst ? 0 : 1);
  useEffect(() => {
    if (reduce) return;
    glow.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
  }, [reduce, glow, spin]);
  useEffect(() => {
    if (phase === "open") {
      rock.value = withTiming(0, { duration: 60 });
      if (reduce) { rough.value = 0; cut.value = 1; return; }
      rough.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
      cut.value = withDelay(90, withSpring(1, { damping: 8, stiffness: 140 }));
      rays.value = withSequence(withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }), withDelay(900, withTiming(0.55, { duration: 900 })));
      return;
    }
    if (reduce || !roughFirst) return;
    if (phase === "idle") {
      rock.value = withRepeat(withSequence(
        withDelay(1500, withTiming(-0.08, { duration: 90 })), withTiming(0.08, { duration: 110 }),
        withTiming(-0.05, { duration: 100 }), withTiming(0.03, { duration: 90 }), withTiming(0, { duration: 80 }),
      ), -1, false);
    } else {
      rock.value = withRepeat(withSequence(withTiming(-0.06, { duration: 45 }), withTiming(0.06, { duration: 45 })), -1, true);
      glow.value = withTiming(1.6, { duration: 600 });
    }
  }, [phase, reduce, roughFirst, rock, glow, rays, rough, cut]);

  const shake = useAnimatedStyle(() => ({ transform: [{ rotate: `${rock.value}rad` }] }));
  const aura = useAnimatedStyle(() => ({ opacity: 0.25 + 0.3 * glow.value, transform: [{ scale: 0.95 + 0.12 * glow.value + 0.6 * rays.value }] }));
  const rayStyle = useAnimatedStyle(() => ({ opacity: rays.value, transform: [{ scale: 0.3 + 1.1 * rays.value }, { rotate: `${spin.value * 360}deg` }] }));
  const roughStyle = useAnimatedStyle(() => ({ opacity: rough.value, transform: [{ scale: 1 + 0.35 * (1 - rough.value) }] }));
  const cutStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, cut.value * 1.5), transform: [{ scale: 0.3 + 0.7 * cut.value }] }));
  const cx = STAGE_W / 2;
  const box = { position: "absolute" as const, left: cx - STONE / 2, top: CY - STONE / 2, width: STONE, height: STONE };
  const opened = phase === "open";

  return (
    <View style={{ width: STAGE_W, height: STAGE_H }} pointerEvents="none">
      <Animated.View style={[styles.aura2, { left: cx - 80, top: CY - 80, backgroundColor: st.heart ? "rgba(246,198,91,0.22)" : `${st.pal[2]}38` }, aura]} />
      <Animated.View style={[{ position: "absolute", left: cx - 120, top: CY - 120, width: 240, height: 240 }, rayStyle]}>
        <Svg width={240} height={240}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2, b = a + 0.09;
            return <Path key={i} d={`M120 120 L${120 + Math.cos(a) * 118} ${120 + Math.sin(a) * 118} L${120 + Math.cos(b) * 118} ${120 + Math.sin(b) * 118}Z`} fill={i % 2 ? "#FFF3CF" : st.heart ? colors.gold : st.pal[3]} opacity={i % 2 ? 0.35 : 0.5} />;
          })}
        </Svg>
      </Animated.View>
      {/* der geschliffene Stein — erst nach dem Öffnen, oder sofort, wenn schon erreicht */}
      <Animated.View style={[box, cutStyle]}>
        {st.heart
          ? <PrismStone size={STONE} filled={mode === "reveal" ? 12 : filled} live={live && (opened || !roughFirst)} />
          : <DreamStone size={STONE} pal={st.pal} num={num} live={live && (opened || !roughFirst)} seed={st.i + 3} />}
      </Animated.View>
      {/* die rohe Schale — springt beim Öffnen auf */}
      {roughFirst ? (
        <Animated.View style={[box, shake, roughStyle]}>
          <DreamStone size={STONE} pal={st.pal} num={st.heart ? undefined : num} rough live={false} />
        </Animated.View>
      ) : null}
      {!opened ? (
        <>
          <Twinkle x={cx - 70} y={34} s={12} delay={0} />
          <Twinkle x={cx + 72} y={60} s={9} delay={500} />
          <Twinkle x={cx + 62} y={146} s={11} delay={900} />
          <Twinkle x={cx - 66} y={136} s={8} delay={300} />
        </>
      ) : null}
      {opened ? <Burst cx={cx} cy={CY} pal={st.pal} /> : null}
    </View>
  );
}

/* Was herausspringt: Splitter der rohen Schale und Sterne, rundum. */
function Burst({ cx, cy, pal }: { cx: number; cy: number; pal: readonly string[] }) {
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => <Flyer key={`f${i}`} i={i} n={9} cx={cx} cy={cy} shard={i % 3 ? "#7A7F92" : pal[2]} />)}
      {Array.from({ length: 16 }, (_, i) => <Flyer key={`s${i}`} i={i} n={16} cx={cx} cy={cy} />)}
    </>
  );
}
function Flyer({ i, n, cx, cy, shard }: { i: number; n: number; cx: number; cy: number; shard?: string }) {
  const k = useSharedValue(0);
  const spread = shard ? 5.4 : 3.6;
  const a = -Math.PI / 2 + (i / Math.max(1, n - 1) - 0.5) * spread + (shard ? 0 : (i % 2 ? 0.12 : -0.12));
  const dist = shard ? 90 + (i % 3) * 24 : 80 + (i % 4) * 26;
  useEffect(() => {
    k.value = withDelay(shard ? 20 + i * 12 : 20 + (i % 5) * 30, withTiming(1, { duration: shard ? 1100 : 1000, easing: Easing.out(Easing.cubic) }));
  }, [k, i, shard]);
  const st = useAnimatedStyle(() => ({
    opacity: k.value === 0 ? 0 : k.value < 0.75 ? 1 : (1 - k.value) * 4,
    transform: [
      { translateX: Math.cos(a) * dist * k.value },
      { translateY: Math.sin(a) * dist * k.value + 60 * k.value * k.value },   // sinkt am Ende, wie geworfen
      { rotate: `${(i % 2 ? 1 : -1) * 260 * k.value}deg` },
      { scale: shard ? 1 - 0.3 * k.value : 1.2 - 0.6 * k.value },
    ],
  }));
  if (shard) {
    const w = 14 + (i % 3) * 4, h = 11 + (i % 2) * 4;
    return (
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h }, st]}>
        <Svg width={w} height={h}>
          <Path d={`M1 ${h * 0.45} L${w * 0.5} 0 L${w} ${h * 0.3} L${w * 0.82} ${h} L${w * 0.25} ${h * 0.9}Z`} fill={shard} />
          <Path d={`M${w * 0.5} 0 L${w} ${h * 0.3} L${w * 0.55} ${h * 0.5}Z`} fill="#FFFFFF" opacity={0.25} />
        </Svg>
      </Animated.View>
    );
  }
  const s = i % 3 === 0 ? 12 : 7;
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: cx - s / 2, top: cy - s / 2, width: s, height: s }, st]}>
      <Svg width={s} height={s}><Path d={`M${s / 2} 0 L${s * 0.6} ${s * 0.4} L${s} ${s / 2} L${s * 0.6} ${s * 0.6} L${s / 2} ${s} L${s * 0.4} ${s * 0.6} L0 ${s / 2} L${s * 0.4} ${s * 0.4}Z`} fill={i % 4 ? "#FFF3CF" : colors.gold} /></Svg>
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
  aura2: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(246,198,91,0.22)" },
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
