import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { FrogStage, type FrogEvent } from "@/components/frog-stage";
import type { GiftCard, HomeData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Ring mit Fäden (Antons Wahl 03.10.):
 *
 *   · die Nächte dieses Mondes im Kreis, von Vollmond zu Vollmond; oben
 *     wartet die Belohnung für den vollen Ring („dein Monat als Film"),
 *   · jede Nacht mit Traum zeigt ihr Bild (antippen öffnet ihn); leere
 *     Nächte sind kleine Punkte, kommende ganz blass, heute pulsiert,
 *   · oben das große Geschenk (antippen: was es ist, wann Vollmond ist),
 *     im Ring die Geschenke nach der ZAHL der Träume (seit 03.10. abends
 *     keine Serie mehr: „Mir geht es einfach nur um die Anzahl der
 *     Träume") — jedes auf der frühesten Nacht, an der man es erreichen
 *     kann; wer aussetzt, verliert nichts, es rückt nur weiter. Unter dem
 *     Ring dasselbe als Satz. Antippen öffnet die Schachtel (gift-sheet.tsx),
 *   · Fäden quer durch den Ring zwischen Nächten mit demselben Motiv,
 *   · in der Mitte der Frosch (statt des Mondes — „den haben wir schon zu
 *     viel"): schläft, bis heute ein Traum da ist, reagiert auf Antippen,
 *     neue Träume, Meilensteine und den vollen Ring (frog-stage.tsx). Beim
 *     Antippen sagt er das nächste Ziel.
 * Am Morgen nach dem Ring macht das iPhone den Film (glimpse-layer.tsx).
 * Rechnung: src/lib/moonCycle.js, Meilensteine in der Brücke.
 *
 * Leistung: Ring, Punkte und Fäden sind ein stilles SVG; Bilder und
 * Geschenke sind native Ansichten darüber; dauernd bewegen sich nur der
 * Heute-Punkt und der Frosch-Loop (pausiert, wenn der Tab nicht sichtbar ist). */
const THUMB = 28;
const GIFT = 24;

export function MoonRing({ C, width, onOpen, onGift }: { C: HomeData["cycle"]; width: number; onOpen: (id: string) => void; onGift: (card: GiftCard) => void }) {
  const W = width, H = width;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.41;
  const N = C.days.length;
  const at = (i: number, r = R) => {
    const a = -Math.PI / 2 + ((i + 0.5) / N) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const frogSize = Math.round(W * 0.46);
  const todayIndex = C.days.findIndex((d) => d.today);

  /* Die Ereignisse des Froschs: Antippen, ein neuer Traum, ein erreichter
     Meilenstein, der volle Ring. */
  const [event, setEvent] = useState<{ kind: FrogEvent; at: number } | null>(null);
  const seen = useRef({ count: C.count, total: C.streak });
  useEffect(() => {
    const prev = seen.current;
    // `streak` trägt seit 03.10. die Zahl aller Träume mit Bild.
    if (C.count > prev.count || C.streak > prev.total) setEvent({ kind: C.left === 0 && C.todayDone ? "cheer" : [3, 7, 14, 30, 60, 100].includes(C.streak) && C.streak > prev.total ? "milestone" : "dream", at: Date.now() });
    seen.current = { count: C.count, total: C.streak };
  }, [C.count, C.streak, C.left, C.todayDone]);

  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = (text: string) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble(text);
    bubbleTimer.current = setTimeout(() => setBubble(null), 4200);
  };
  useEffect(() => () => { if (bubbleTimer.current) clearTimeout(bubbleTimer.current); }, []);
  const asleep = !C.todayDone;
  const giftAt = new Map(C.gifts.map((g) => [g.index, g]));
  const setPeek = onGift;

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View style={{ width: W, height: H }}>
        {/* Das stille Bild: Bahn und Punkte */}
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(234,240,251,0.08)" strokeWidth={1} />
          {C.days.map((d, i) => {
            if ((d.dreamId && d.img) || d.today || giftAt.has(i)) return null;
            const [x, y] = at(i);
            if (d.dreamId) return <Circle key={d.key} cx={x} cy={y} r={4} fill="#fffaf0" opacity={0.85} />;   // Traum ohne Bild: ein Lichtpunkt
            return <Circle key={d.key} cx={x} cy={y} r={d.future ? 1.6 : 2.2} fill={d.future ? "rgba(234,240,251,0.2)" : "rgba(234,240,251,0.38)"} />;
          })}
        </Svg>
        {/* Die Fäden — blenden nach den Bildern ein */}
        <Animated.View entering={FadeIn.delay(500).duration(900)} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={W} height={H}>
            {C.threads.map(([a, b], k) => {
              const [x1, y1] = at(a, R - THUMB / 2 - 2), [x2, y2] = at(b, R - THUMB / 2 - 2);
              // Der Faden biegt sich zur Mitte — wie gespannt, nicht wie eine Sehne.
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
              const qx = cx + (mx - cx) * 0.25, qy = cy + (my - cy) * 0.25;
              return <Path key={k} d={`M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`} fill="none" stroke="#ffe7b0" strokeOpacity={0.45} strokeWidth={1.1} />;
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

        {/* Oben: das große Geschenk, der Monat als Film — antippen erklärt es */}
        <Pressable hitSlop={8} onPress={() => { Haptics.selectionAsync(); setPeek(C.month); }} accessibilityRole="button" accessibilityLabel={C.chip}
          style={[styles.top, { left: cx - 90, top: cy - R - 15 }]}>
          <View style={styles.topGift}><SymbolView name="gift.fill" size={15} tintColor="#1a1206" /></View>
          <Text style={styles.topText} numberOfLines={2}>{C.chip}</Text>
        </Pressable>

        {/* Die Geschenke auf der frühesten Nacht, an der man sie erreicht */}
        {C.gifts.map((g) => {
          const [x, y] = at(g.index);
          return (
            <Pressable key={g.nights} hitSlop={8} onPress={() => { Haptics.selectionAsync(); setEvent({ kind: "tap", at: Date.now() }); setPeek(g); }}
              style={[styles.ms, { left: x - GIFT / 2, top: y - GIFT / 2 }]} accessibilityRole="button" accessibilityLabel={g.title}>
              <SymbolView name="gift.fill" size={12} tintColor="#1a1206" />
              <Text style={styles.msN}>{g.nights}</Text>
            </Pressable>
          );
        })}

        {/* Die Traumbilder */}
        {C.days.map((d, i) => {
          if (!d.dreamId || !d.img) return null;
          const [x, y] = at(i);
          return (
            <Animated.View key={d.key} entering={FadeIn.delay(80 + i * 22).duration(380)} style={[styles.thumbWrap, { left: x - THUMB / 2, top: y - THUMB / 2 }]}>
              <Pressable onPress={() => { Haptics.selectionAsync(); onOpen(d.dreamId!); }} hitSlop={6}>
                <Image source={{ uri: d.img }} style={styles.thumb} contentFit="cover" transition={150} />
              </Pressable>
            </Animated.View>
          );
        })}
        {todayIndex >= 0 && !C.days[todayIndex].dreamId && !giftAt.has(todayIndex) ? <TodayMark x={at(todayIndex)[0]} y={at(todayIndex)[1]} /> : null}

        {/* Die Sprechblase des Froschs */}
        {bubble ? (
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(200)} pointerEvents="none"
            style={[styles.bubble, { left: 24, right: 24, top: cy - frogSize / 2 - 46 }]}>
            <Text style={styles.bubbleText}>{bubble}</Text>
          </Animated.View>
        ) : null}
      </View>
      {/* Das nächste Geschenk nach der Zahl der Träume */}
      {C.next ? (
        <Pressable onPress={() => { Haptics.selectionAsync(); setEvent({ kind: "tap", at: Date.now() }); if (C.next) setPeek(C.next); }} style={styles.next} accessibilityRole="button">
          <View style={styles.nextIcon}><SymbolView name="gift.fill" size={13} tintColor="#1a1206" /></View>
          <Text style={styles.nextText} numberOfLines={1}>{C.next.say}</Text>
          <SymbolView name="chevron.right" size={11} tintColor={colors.faint} />
        </Pressable>
      ) : null}
      <Text style={styles.count}>{C.countLine.toUpperCase()}</Text>
      <Text style={styles.line}>{C.line}</Text>
      {C.thread ? <Text style={styles.thread}>{C.thread}</Text> : null}
    </View>
  );
}

/* Heute: ein goldener Ring, der leise pulsiert — hier kommt der nächste Traum hin. */
function TodayMark({ x, y }: { x: number; y: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * k.value, transform: [{ scale: 0.9 + 0.2 * k.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.today, { left: x - 10, top: y - 10 }, pulse]}>
      <View style={styles.todayDot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  top: { position: "absolute", width: 180, alignItems: "center", gap: 4 },
  topGift: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  topText: { color: colors.gold, fontSize: 11.5, fontWeight: "600", textAlign: "center" },
  ms: { position: "absolute", width: GIFT, height: GIFT, borderRadius: GIFT / 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold, borderWidth: 1, borderColor: "#ffe7b0" },
  msN: { position: "absolute", bottom: -13, color: colors.gold, fontSize: 9.5, fontWeight: "700" },
  next: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7, paddingLeft: 7, paddingRight: 12, borderRadius: 999, backgroundColor: "rgba(246,198,91,0.1)", borderWidth: 1, borderColor: "rgba(246,198,91,0.4)", maxWidth: "92%" },
  nextIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  nextText: { color: colors.gold, fontSize: 13.5, fontWeight: "600", flexShrink: 1 },
  thumbWrap: { position: "absolute", width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 1.2, borderColor: "rgba(255,231,176,0.8)", overflow: "hidden", backgroundColor: colors.bg2 },
  thumb: { width: "100%", height: "100%" },
  today: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 1.4, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  todayDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  bubble: { position: "absolute", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "rgba(12,20,35,0.95)", borderWidth: 1, borderColor: "rgba(246,198,91,0.45)" },
  bubbleText: { color: colors.text, fontSize: 13.5, lineHeight: 19, textAlign: "center" },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  line: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", paddingHorizontal: 20 },
  thread: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 14, color: colors.gold, textAlign: "center" },
});
