import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
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

/* ── Die Traum-Schachtel (Antons Befund 04.10.: „Das Geschenke-Icon muss
 * geil sein … in Richtung Traum oder Video … die Animation muss richtig
 * knallen").
 *
 * Nachtblau mit goldenen Sternpunkten, die Schleife ist ein FILMSTREIFEN
 * mit Perforation, obendrauf Mondsichel und Stern. Drei Phasen:
 *   idle   — wackelt alle paar Sekunden, die Aura atmet, Sterne funkeln
 *   charge — 0,6 s: zittert schneller, glüht auf, leise Haptik-Ticks
 *   open   — Blitz, der Deckel fliegt drehend weg, Lichtstrahlen fächern
 *            auf, Filmbilder und Sterne schießen heraus
 * Alles nur transform/opacity nativer Ebenen; die Zeichnung ist still. */
export type GiftPhase = "idle" | "charge" | "open";
const BW = 104, BH = 76, LH = 26;              // Körper, Deckelhöhe
const STAGE_W = 200, STAGE_H = 190;
const NIGHT = "#1B2457", NIGHT2 = "#121a43", GOLDD = "#9C6B1E";

function FilmBand({ x, y, w, h, vertical }: { x: number; y: number; w: number; h: number; vertical?: boolean }) {
  const holes = [];
  const n = Math.max(3, Math.floor((vertical ? h : w) / 9));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    if (vertical) {
      holes.push(<Rect key={`a${i}`} x={x + 2} y={y + t * h - 2} width={3.2} height={4} rx={1} fill="#0b1020" />);
      holes.push(<Rect key={`b${i}`} x={x + w - 5.2} y={y + t * h - 2} width={3.2} height={4} rx={1} fill="#0b1020" />);
    } else {
      holes.push(<Rect key={`a${i}`} x={x + t * w - 2} y={y + 2} width={4} height={3.2} rx={1} fill="#0b1020" />);
      holes.push(<Rect key={`b${i}`} x={x + t * w - 2} y={y + h - 5.2} width={4} height={3.2} rx={1} fill="#0b1020" />);
    }
  }
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={colors.gold} />
      <Rect x={vertical ? x + 6.5 : x} y={vertical ? y : y + 6.5} width={vertical ? w - 13 : w} height={vertical ? h : h - 13} fill="#F7D98A" opacity={0.55} />
      {holes}
    </G>
  );
}

function BoxBody() {
  const dots = [[16, 18], [30, 52], [80, 14], [88, 58], [22, 62], [70, 40], [12, 40], [94, 30]];
  return (
    <Svg width={BW} height={BH}>
      <Rect x={1} y={1} width={BW - 2} height={BH - 2} rx={8} fill={NIGHT} stroke={colors.gold} strokeWidth={1.5} />
      <Rect x={1} y={BH * 0.55} width={BW - 2} height={BH * 0.45 - 1} rx={8} fill={NIGHT2} opacity={0.8} />
      {dots.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 3 ? 1.1 : 1.7} fill="#F7D98A" opacity={0.85} />)}
      <FilmBand x={BW / 2 - 10} y={1} w={20} h={BH - 2} vertical />
    </Svg>
  );
}

function BoxLid() {
  const W2 = BW + 12;
  return (
    <Svg width={W2} height={LH + 34}>
      {/* Schleife: Mondsichel und Stern */}
      <Path d={`M${W2 / 2 - 4} 4 a15 15 0 1 0 14 22 a11.5 11.5 0 1 1 -14 -22Z`} fill={colors.gold} stroke={GOLDD} strokeWidth={0.8} />
      <Path d={`M${W2 / 2 + 15} 6 l2.2 5.2 5.2 2.2 -5.2 2.2 -2.2 5.2 -2.2 -5.2 -5.2 -2.2 5.2 -2.2Z`} fill="#FFF3CF" />
      <Rect x={1} y={34} width={W2 - 2} height={LH - 2} rx={6} fill={NIGHT} stroke={colors.gold} strokeWidth={1.5} />
      <Rect x={1} y={34} width={W2 - 2} height={6} rx={3} fill="#2A3577" opacity={0.9} />
      <FilmBand x={W2 / 2 - 10} y={34} w={20} h={LH - 2} vertical />
    </Svg>
  );
}

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

/** Die Schachtel mit Bühne: Aura, Strahlen, Körper, Deckel, Funkeln, Teilchen. */
function GiftArt({ phase }: { phase: GiftPhase }) {
  const reduce = useReducedMotion();
  const rock = useSharedValue(0), glow = useSharedValue(0), lid = useSharedValue(0), body = useSharedValue(1), rays = useSharedValue(0), spin = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    glow.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
  }, [reduce, glow, spin]);
  useEffect(() => {
    if (reduce) return;
    if (phase === "idle") {
      rock.value = withRepeat(withSequence(
        withDelay(1500, withTiming(-0.08, { duration: 90 })), withTiming(0.08, { duration: 110 }),
        withTiming(-0.05, { duration: 100 }), withTiming(0.03, { duration: 90 }), withTiming(0, { duration: 80 }),
      ), -1, false);
    } else if (phase === "charge") {
      rock.value = withRepeat(withSequence(withTiming(-0.06, { duration: 45 }), withTiming(0.06, { duration: 45 })), -1, true);
      glow.value = withTiming(1.6, { duration: 600 });
    } else {
      rock.value = withTiming(0, { duration: 60 });
      lid.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
      body.value = withSequence(withTiming(1.12, { duration: 120 }), withSpring(0.92, { damping: 9 }));
      rays.value = withSequence(withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }), withDelay(900, withTiming(0.55, { duration: 900 })));
    }
  }, [phase, reduce, rock, glow, lid, body, rays]);

  const shake = useAnimatedStyle(() => ({ transform: [{ rotate: `${rock.value}rad` }] }));
  const aura = useAnimatedStyle(() => ({ opacity: 0.25 + 0.3 * glow.value, transform: [{ scale: 0.95 + 0.12 * glow.value + 0.6 * rays.value }] }));
  const rayStyle = useAnimatedStyle(() => ({ opacity: rays.value, transform: [{ scale: 0.3 + 1.1 * rays.value }, { rotate: `${spin.value * 360}deg` }] }));
  const lidStyle = useAnimatedStyle(() => ({
    opacity: 1 - lid.value * 0.9,
    transform: [{ translateY: -150 * lid.value }, { translateX: 40 * lid.value }, { rotate: `${1.3 * lid.value}rad` }, { scale: 1 - 0.3 * lid.value }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: body.value }] }));
  const cx = STAGE_W / 2, top = STAGE_H / 2 - (BH + LH) / 2 + 10;

  return (
    <View style={{ width: STAGE_W, height: STAGE_H }} pointerEvents="none">
      <Animated.View style={[styles.aura2, { left: cx - 80, top: STAGE_H / 2 - 80 }, aura]} />
      <Animated.View style={[{ position: "absolute", left: cx - 120, top: STAGE_H / 2 - 120, width: 240, height: 240 }, rayStyle]}>
        <Svg width={240} height={240}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2, b = a + 0.09;
            return <Path key={i} d={`M120 120 L${120 + Math.cos(a) * 118} ${120 + Math.sin(a) * 118} L${120 + Math.cos(b) * 118} ${120 + Math.sin(b) * 118}Z`} fill={i % 2 ? "#FFF3CF" : colors.gold} opacity={i % 2 ? 0.35 : 0.5} />;
          })}
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: cx - BW / 2, top: top + LH + 6, width: BW, height: BH }, shake, bodyStyle]}>
        <BoxBody />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: cx - (BW + 12) / 2, top: top - 28, width: BW + 12, height: LH + 34 }, shake, lidStyle]}>
        <BoxLid />
      </Animated.View>
      {phase !== "open" ? (
        <>
          <Twinkle x={cx - 70} y={44} s={12} delay={0} />
          <Twinkle x={cx + 72} y={70} s={9} delay={500} />
          <Twinkle x={cx + 58} y={150} s={11} delay={900} />
          <Twinkle x={cx - 62} y={140} s={8} delay={300} />
        </>
      ) : null}
      {phase === "open" ? <Burst cx={cx} cy={top + LH + 10} /> : null}
    </View>
  );
}

/* Was herausschießt: Filmbilder und Sterne, fächerförmig nach oben. */
function Burst({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => <Flyer key={`f${i}`} i={i} n={7} cx={cx} cy={cy} film />)}
      {Array.from({ length: 16 }, (_, i) => <Flyer key={`s${i}`} i={i} n={16} cx={cx} cy={cy} />)}
    </>
  );
}
function Flyer({ i, n, cx, cy, film }: { i: number; n: number; cx: number; cy: number; film?: boolean }) {
  const k = useSharedValue(0);
  const spread = film ? 2.4 : 3.6;
  const a = -Math.PI / 2 + (i / Math.max(1, n - 1) - 0.5) * spread + (film ? 0 : (i % 2 ? 0.12 : -0.12));
  const dist = film ? 120 + (i % 3) * 22 : 80 + (i % 4) * 26;
  useEffect(() => {
    k.value = withDelay(film ? 60 + i * 25 : 20 + (i % 5) * 30, withTiming(1, { duration: film ? 1300 : 1000, easing: Easing.out(Easing.cubic) }));
  }, [k, i, film]);
  const st = useAnimatedStyle(() => ({
    opacity: k.value === 0 ? 0 : k.value < 0.75 ? 1 : (1 - k.value) * 4,
    transform: [
      { translateX: Math.cos(a) * dist * k.value },
      { translateY: Math.sin(a) * dist * k.value + 60 * k.value * k.value },   // sinkt am Ende, wie geworfen
      { rotate: `${(i % 2 ? 1 : -1) * 220 * k.value}deg` },
      { scale: film ? 1 : 1.2 - 0.6 * k.value },
    ],
  }));
  if (film) {
    return (
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: cx - 13, top: cy - 10, width: 26, height: 20 }, st]}>
        <Svg width={26} height={20}>
          <Rect x={0} y={0} width={26} height={20} rx={2.5} fill={colors.gold} />
          <Rect x={4} y={4} width={18} height={12} rx={1.5} fill={["#8C84E8", "#2F8FA6", "#C2622D"][i % 3]} />
          {[2, 8, 14, 20].map((x) => <Rect key={x} x={x + 1} y={0.8} width={2.4} height={2} rx={0.6} fill="#0b1020" />)}
          {[2, 8, 14, 20].map((x) => <Rect key={`b${x}`} x={x + 1} y={17.2} width={2.4} height={2} rx={0.6} fill="#0b1020" />)}
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
            <GiftArt phase="idle" />
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
              <GiftArt phase={phase} />
              {open ? (
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
  burst: { position: "absolute", left: 0, right: 0, top: 56, alignItems: "center" },
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
