import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Mask, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { FrogStage, type FrogEvent } from "@/components/frog-stage";
import type { GiftCard, HomeData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Traum-Ring (Antons Entwurf 03.10. spätabends, Variante A —
 * Rechnung src/lib/dreamRing.js):
 *
 *   · 12 Plätze wie eine Uhr: die 12 oben, die 3 rechts, 6 unten, 9 links.
 *     Jeder Traum mit Glimpse oder Film füllt den nächsten freien Platz —
 *     ohne Datum, ohne Serie („selbst wenn du ein Jahr brauchst … egal").
 *     Nach 12 laufen die Nummern weiter (13–24 …).
 *   · Geschenke symmetrisch auf den Vierteln: 3, 6, 9 ein Glimpse, 12 der
 *     Film aus den 12 Träumen. Antippen öffnet die Karte (gift-sheet.tsx,
 *     als Ebene auf der Startseite — onGift).
 *   · Gefüllt ist der Bogen golden; das Stück vom letzten Punkt zum
 *     nächsten ist gestrichelt und pulsiert — „ah, ich muss handeln".
 *   · Fäden quer durch den Ring zwischen Träumen mit demselben Motiv.
 *   · In der Mitte der Frosch: schläft, bis heute ein Traum da ist,
 *     reagiert auf Antippen, neue Träume und Geschenke (frog-stage.tsx).
 *
 * Leistung: Bahn, Bogen und Punkte sind ein stilles SVG; bewegt sind nur
 * das gestrichelte Stück (Deckkraft einer nativen Ebene) und der Frosch. */
const SLOTS = 12;
const THUMB = 40;
const GIFT = 34;

export function MoonRing({ C, width, onOpen, onGift }: { C: HomeData["cycle"]; width: number; onOpen: (id: string) => void; onGift: (card: GiftCard) => void }) {
  const W = width, H = width;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.4;
  const ang = (pos: number) => -Math.PI / 2 + (pos / SLOTS) * Math.PI * 2;
  const at = (pos: number, r = R) => [cx + Math.cos(ang(pos)) * r, cy + Math.sin(ang(pos)) * r];
  const arc = (from: number, to: number, r = R) => {
    const [x0, y0] = at(from, r), [x1, y1] = at(to, r);
    const large = to - from > SLOTS / 2 ? 1 : 0;
    return `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const frogSize = Math.round(W * 0.4);
  const filled = C.slots.filter((s) => s.dreamId).length;      // Plätze dieses Rings, 0…11
  const bySlot = new Map(C.slots.map((s) => [s.num, s]));

  /* Die Ereignisse des Froschs: Antippen, ein neuer Traum, ein Geschenk,
     der volle Ring. */
  const [event, setEvent] = useState<{ kind: FrogEvent; at: number } | null>(null);
  const seen = useRef(C.count);
  useEffect(() => {
    if (C.count > seen.current) {
      const g = C.count % SLOTS === 0 ? "cheer" : C.count % 3 === 0 ? "milestone" : "dream";
      setEvent({ kind: g, at: Date.now() });
    }
    seen.current = C.count;
  }, [C.count]);

  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = (text: string) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble(text);
    bubbleTimer.current = setTimeout(() => setBubble(null), 4200);
  };
  useEffect(() => () => { if (bubbleTimer.current) clearTimeout(bubbleTimer.current); }, []);
  const asleep = !C.todayDone;
  const posOf = (num: number) => bySlot.get(num)?.pos ?? 0;
  const nextPos = filled + 1;                                  // 1…12, in Uhr-Schritten ab oben

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <View style={{ width: W, height: H }}>
        {/* Das stille Bild: Bahn, gefüllter Bogen, leere Plätze, Nummern der Geschenke */}
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(234,240,251,0.1)" strokeWidth={1} />
          {filled > 0 ? <Path d={arc(0, filled)} fill="none" stroke={colors.gold} strokeOpacity={0.75} strokeWidth={2} strokeLinecap="round" /> : null}
          {C.slots.map((s) => {
            if (s.dreamId || s.gift) return null;
            const [x, y] = at(s.pos === 0 ? SLOTS : s.pos);
            return <Circle key={s.num} cx={x} cy={y} r={2.6} fill="rgba(234,240,251,0.35)" />;
          })}
        </Svg>
        {/* Das Stück zum nächsten Platz — gestrichelt, pulsiert */}
        <NextArc d={arc(filled, nextPos)} W={W} H={H} />
        {/* Die Fäden — blenden nach den Bildern ein. ⚠ Der Frosch ist
            durchsichtig (Alpha aus der Helligkeit, auch sein Inneres): Ohne
            Aussparung liefen die Fäden sichtbar DURCH ihn, als läge er
            darunter (Antons Befund 04.10.). Eine stille Maske blendet sie
            zur Mitte hin weich aus — keine bewegte Maske (Dauerlast-Lehre). */}
        <Animated.View entering={FadeIn.delay(500).duration(900)} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={W} height={H}>
            <Defs>
              <RadialGradient id="frogHole" cx={cx} cy={cy} r={frogSize * 0.56} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#000" />
                <Stop offset="0.78" stopColor="#000" />
                <Stop offset="1" stopColor="#fff" />
              </RadialGradient>
              <Mask id="threadMask" x={0} y={0} width={W} height={H} maskUnits="userSpaceOnUse">
                <Rect x={0} y={0} width={W} height={H} fill="#fff" />
                <Circle cx={cx} cy={cy} r={frogSize * 0.56} fill="url(#frogHole)" />
              </Mask>
            </Defs>
            {C.threads.map(([a, b], k) => {
              const [x1, y1] = at(posOf(a) || SLOTS, R - THUMB / 2 - 2), [x2, y2] = at(posOf(b) || SLOTS, R - THUMB / 2 - 2);
              // Der Faden biegt sich zur Mitte — wie gespannt, nicht wie eine Sehne.
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
              const qx = cx + (mx - cx) * 0.25, qy = cy + (my - cy) * 0.25;
              return <Path key={k} d={`M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`} fill="none" stroke="#ffe7b0" strokeOpacity={0.45} strokeWidth={1.1} mask="url(#threadMask)" />;
            })}
          </Svg>
        </Animated.View>

        {/* Der Frosch in der Mitte — antippen: er sagt das nächste Ziel */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEvent({ kind: "tap", at: Date.now() }); say(asleep ? C.sayAsleep : C.say); }}
          style={[styles.center, { left: cx - frogSize / 2, top: cy - frogSize / 2, width: frogSize, height: frogSize }]}
          accessibilityRole="button" accessibilityLabel={C.say}>
          <FrogStage base={asleep ? "sleep" : "idle"} event={event} size={frogSize} />
        </Pressable>

        {/* Die Plätze: Traumbild, Geschenk oder beides */}
        {C.slots.map((s, i) => {
          const [x, y] = at(s.pos === 0 ? SLOTS : s.pos);
          const isNext = s.num === C.next;
          if (s.dreamId) {
            return (
              <Animated.View key={s.num} entering={FadeIn.delay(80 + i * 30).duration(380)} style={[styles.thumbWrap, s.gift && styles.thumbGift, { left: x - THUMB / 2, top: y - THUMB / 2 }]}>
                <Pressable onPress={() => { Haptics.selectionAsync(); onOpen(s.dreamId!); }} hitSlop={4}>
                  {s.img ? <Image source={{ uri: s.img }} style={styles.thumb} contentFit="cover" transition={150} /> : <View style={[styles.thumb, styles.noImg]} />}
                </Pressable>
                {s.gift ? <View pointerEvents="none" style={styles.giftBadge}><SymbolView name="gift.fill" size={9} tintColor="#1a1206" /></View> : null}
              </Animated.View>
            );
          }
          if (s.gift) {
            const big = s.gift.kind === "ring";
            const size = big ? GIFT + 6 : GIFT;
            return (
              <Pressable key={s.num} hitSlop={8} onPress={() => { Haptics.selectionAsync(); setEvent({ kind: "tap", at: Date.now() }); onGift(s.gift!); }}
                style={[styles.gift, big && styles.giftBig, { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 }]}
                accessibilityRole="button" accessibilityLabel={s.gift.title}>
                <SymbolView name={big ? "film.fill" : "gift.fill"} size={big ? 16 : 14} tintColor={colors.gold} />
                <Text style={styles.giftN}>{s.num}</Text>
              </Pressable>
            );
          }
          return null;
        })}
        {/* Der nächste Platz pulsiert */}
        {(() => { const s = bySlot.get(C.next); if (!s) return null; const [x, y] = at(s.pos === 0 ? SLOTS : s.pos); return <NextMark x={x} y={y} size={s.gift ? GIFT + 12 : 22} />; })()}

        {/* Die Sprechblase des Froschs */}
        {bubble ? (
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(200)} pointerEvents="none"
            style={[styles.bubble, { left: 24, right: 24, top: cy - frogSize / 2 - 46 }]}>
            <Text style={styles.bubbleText}>{bubble}</Text>
          </Animated.View>
        ) : null}
      </View>
      {/* Das nächste Geschenk als Satz */}
      {C.nextGift ? (
        <Pressable onPress={() => { Haptics.selectionAsync(); setEvent({ kind: "tap", at: Date.now() }); if (C.nextGift) onGift(C.nextGift); }} style={styles.next} accessibilityRole="button">
          <View style={styles.nextIcon}><SymbolView name="gift.fill" size={13} tintColor="#1a1206" /></View>
          <Text style={styles.nextText} numberOfLines={1}>{C.nextGift.say}</Text>
          <SymbolView name="chevron.right" size={11} tintColor={colors.faint} />
        </Pressable>
      ) : null}
      <Text style={styles.count}>{C.countLine.toUpperCase()}</Text>
      {C.thread ? <Text style={styles.thread}>{C.thread}</Text> : null}
    </View>
  );
}

/* Das gestrichelte Stück vom letzten zum nächsten Platz — nur die
   Deckkraft der nativen Ebene bewegt sich, das SVG bleibt still. */
function NextArc({ d, W, H }: { d: string; W: number; H: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.3 + 0.7 * k.value }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, pulse]}>
      <Svg width={W} height={H}>
        <Path d={d} fill="none" stroke={colors.gold} strokeWidth={2.4} strokeDasharray="5 6" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

/* Der nächste Platz: ein goldener Ring, der leise pulsiert. */
function NextMark({ x, y, size }: { x: number; y: number; size: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * k.value, transform: [{ scale: 0.92 + 0.16 * k.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.nextMark, { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 }, pulse]} />;
}

const styles = StyleSheet.create({
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  thumbWrap: { position: "absolute", width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 1.4, borderColor: "rgba(255,231,176,0.85)", backgroundColor: colors.bg2 },
  thumbGift: { borderColor: colors.gold, borderWidth: 2 },
  thumb: { width: "100%", height: "100%", borderRadius: THUMB / 2 },
  noImg: { backgroundColor: "#fffaf0", opacity: 0.85 },
  giftBadge: { position: "absolute", right: -4, top: -4, width: 17, height: 17, borderRadius: 8.5, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  gift: { position: "absolute", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12,20,35,0.95)", borderWidth: 1.4, borderColor: colors.gold },
  giftBig: { borderWidth: 2 },
  giftN: { position: "absolute", bottom: -16, color: colors.gold, fontSize: 10.5, fontWeight: "700", fontVariant: ["tabular-nums"] },
  nextMark: { position: "absolute", borderWidth: 1.6, borderColor: colors.gold },
  next: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7, paddingLeft: 7, paddingRight: 12, borderRadius: 999, backgroundColor: "rgba(246,198,91,0.1)", borderWidth: 1, borderColor: "rgba(246,198,91,0.4)", maxWidth: "92%" },
  nextIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  nextText: { color: colors.gold, fontSize: 13.5, fontWeight: "600", flexShrink: 1 },
  bubble: { position: "absolute", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "rgba(12,20,35,0.95)", borderWidth: 1, borderColor: "rgba(246,198,91,0.45)" },
  bubbleText: { color: colors.text, fontSize: 13.5, lineHeight: 19, textAlign: "center" },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  thread: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 14, color: colors.gold, textAlign: "center" },
});
