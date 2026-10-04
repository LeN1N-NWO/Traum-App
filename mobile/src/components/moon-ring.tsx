import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path } from "react-native-svg";
import { FrogStage, type FrogEvent } from "@/components/frog-stage";
import type { GiftCard, HomeData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Traumfänger (Antons Wahl 04.10., Variante C — Rechnung bleibt
 * src/lib/dreamRing.js):
 *
 *   · Ein leicht unregelmäßiger, umwickelter Reif mit ein paar Fasern,
 *     darin ein gewebtes Netz aus drei Ringen. Jeder Traum mit Glimpse oder
 *     Film setzt eine Perle (sein Bild) ins Netz, von außen nach innen —
 *     ohne Datum, ohne Serie; Nummern laufen über 12 hinaus weiter.
 *   · Ein goldener Faden verbindet die Perlen in ihrer Reihenfolge; das
 *     Stück zur nächsten Perle ist gestrichelt und pulsiert.
 *   · Geschenke wie eine Uhr: 3 rechts, 6 unten, 9 links (je ein Glimpse)
 *     als farbige Federn, 12 oben (Film aus dem Ring). Die Zahlen sitzen
 *     als Perlen AM REIF, wo die Feder angeknotet ist — sie schwingen
 *     nicht mit (Antons Befund: „die machen die Schaukel nicht mit").
 *   · Die Federn hängen im HINTERGRUND unter dem Reif hinaus: Sie schieben
 *     das Layout nicht, alles darunter (Geschenk-Zeile, Texte, Knopf) liegt
 *     über ihnen. Antippen geht über die Zahl am Reif.
 *   · In der Mitte der Frosch (frog-stage.tsx).
 *
 * Leistung (Lehren vom 27.09.): Reif, Netz und Federn sind stille SVGs;
 * bewegt werden nur native Ebenen — Federn drehen sich um ihren Knoten,
 * das Netz atmet (Skalierung), die nächste Perle und das gestrichelte
 * Stück pulsieren (Deckkraft). Keine SVG-Neuzeichnung je Bild. */
const SLOTS = 12;
const BEAD = 30;
const RINGS = [0.82, 0.67, 0.53];   // Netzringe, Anteil am Reif-Radius
const INNER = 0.4;                   // innerer Kreis (Frosch)

type Feather = { num: number; ang: number; len: number; tilt: number; c1: string; c2: string; c3: string; eye: string };

export function MoonRing({ C, width, onOpen, onGift }: { C: HomeData["cycle"]; width: number; onOpen: (id: string) => void; onGift: (card: GiftCard) => void }) {
  const W = width, H = width;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.4;
  const pt = (slot: number, r: number) => {
    const a = -Math.PI / 2 + (slot / SLOTS) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  /* Perle k (0…11): drei Ringe zu je vier Perlen, nach innen gewunden. */
  const bead = (k: number) => {
    const ring = Math.floor(k / 4);
    return pt(k * 3 + (ring + 1) * 0.5, R * RINGS[ring]);
  };
  const frogSize = Math.round(R * INNER * 2 * 1.15);
  const filled = C.slots.filter((s) => s.dreamId).length;
  const start = C.slots[0]?.num - 1 || 0;

  /* Die Ereignisse des Froschs: Antippen, ein neuer Traum, ein Geschenk,
     der volle Ring. */
  const [event, setEvent] = useState<{ kind: FrogEvent; at: number } | null>(null);
  const seen = useRef(C.count);
  useEffect(() => {
    if (C.count > seen.current) setEvent({ kind: C.count % SLOTS === 0 ? "cheer" : C.count % 3 === 0 ? "milestone" : "dream", at: Date.now() });
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

  /* Die Federn wie auf einer Uhr: 3 rechts unten, 6 unten, 9 links unten. */
  const feathers: Feather[] = [
    { num: start + 3, ang: Math.PI * 0.3, len: R * 0.62, tilt: -9, c1: "#2F8FA6", c2: "#1B5E73", c3: "#9EE0E8", eye: "#E8B04B" },
    { num: start + 6, ang: Math.PI * 0.5, len: R * 0.8, tilt: 0, c1: "#C2622D", c2: "#7E3714", c3: "#F6C08A", eye: "#2B1A10" },
    { num: start + 9, ang: Math.PI * 0.7, len: R * 0.62, tilt: 9, c1: "#6E5BD0", c2: "#3E2F8F", c3: "#CFC6FF", eye: "#E8B04B" },
  ];
  const giftOf = (num: number) => C.slots.find((s) => s.num === num)?.gift ?? null;

  /* Reif und Netz — einmal gerechnet, nicht je Bild. */
  const art = useMemo(() => {
    const rnd = (i: number) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
    let hoop = "";
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      const r = R + 1.6 * (Math.sin(a * 5 + 1) * 0.6 + Math.sin(a * 11 + 2) * 0.4);
      hoop += `${k ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
    }
    const fibers = Array.from({ length: 16 }, (_, k) => {
      const a = rnd(k + 3) * Math.PI * 2, r = R + 4;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      return `M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a) * 6 + (rnd(k) - 0.5) * 3).toFixed(1)} ${(Math.sin(a) * 6).toFixed(1)}`;
    });
    const rings = RINGS.map((f, ring) => {
      let d = "";
      for (let v = 0; v <= SLOTS; v++) {
        const [x, y] = pt(v + (ring + 1) * 0.5, R * f + Math.sin(v * 2.3 + ring) * 1.4);
        d += `${v ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      return d;
    });
    const spokes = Array.from({ length: SLOTS }, (_, v) => {
      const [x0, y0] = pt(v, R), [x1, y1] = pt(v + 1.5, R * INNER);
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`;
    });
    return { hoop, fibers, rings, spokes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W]);

  /* Der gewebte Faden: von der 12 oben durch alle gefüllten Perlen. */
  const [topX, topY] = pt(0, R);
  const woven = Array.from({ length: filled }, (_, k) => bead(k)).reduce((d, [x, y]) => `${d} L${x.toFixed(1)} ${y.toFixed(1)}`, `M${topX.toFixed(1)} ${topY.toFixed(1)}`);
  const [px, py] = filled > 0 ? bead(filled - 1) : [topX, topY];
  const [nx, ny] = filled < SLOTS ? bead(filled) : [px, py];

  return (
    <View style={{ alignItems: "center", gap: 8, zIndex: 0 }}>
      <View style={{ width: W, height: H }}>
        {/* Die Federn — hinter allem, hängen über den Rand hinaus */}
        {feathers.map((f, i) => {
          const [ax, ay] = pt(f.ang / (Math.PI * 2) * SLOTS + 3, R + 3);
          return <FeatherView key={f.num} f={f} x={ax} y={ay} done={C.count >= f.num} delay={i * 700} />;
        })}

        {/* Reif, Fasern, Netz — still; das Netz atmet als Ganzes */}
        <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path d={art.hoop} fill="none" stroke="#9C6B1E" strokeWidth={7} />
          <Path d={art.hoop} fill="none" stroke={colors.gold} strokeWidth={2.4} strokeDasharray="3 2.2" />
          {art.fibers.map((d, k) => <Path key={k} d={d} stroke={colors.gold} strokeWidth={0.8} strokeOpacity={0.7} />)}
        </Svg>
        <Breath style={StyleSheet.absoluteFill}>
          <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
            {art.rings.map((d, k) => <Path key={k} d={d} fill="none" stroke="#F3E3C3" strokeWidth={0.8} strokeOpacity={0.5} />)}
            {art.spokes.map((d, k) => <Path key={k} d={d} stroke="#F3E3C3" strokeWidth={0.6} strokeOpacity={0.35} />)}
            <Circle cx={cx} cy={cy} r={R * INNER} fill="none" stroke={colors.gold} strokeWidth={1.2} strokeOpacity={0.7} />
            {filled > 0 ? <Path d={woven} fill="none" stroke={colors.gold} strokeWidth={1.8} strokeOpacity={0.8} strokeLinejoin="round" /> : null}
            {C.slots.map((s, k) => {
              if (s.dreamId || s.num === C.next) return null;
              const [x, y] = bead(k);
              return <Circle key={s.num} cx={x} cy={y} r={2.6} fill="rgba(234,240,251,0.4)" />;
            })}
          </Svg>
          {filled < SLOTS ? <NextThread d={`M${px.toFixed(1)} ${py.toFixed(1)} L${nx.toFixed(1)} ${ny.toFixed(1)}`} W={W} H={H} /> : null}
          {/* Die Perlen: die Traumbilder */}
          {C.slots.map((s, k) => {
            if (!s.dreamId) return null;
            const [x, y] = bead(k);
            return (
              <Animated.View key={s.num} entering={FadeIn.delay(80 + k * 40).duration(380)} style={[styles.bead, { left: x - BEAD / 2, top: y - BEAD / 2 }]}>
                <Pressable onPress={() => { Haptics.selectionAsync(); onOpen(s.dreamId!); }} hitSlop={4}>
                  {s.img ? <Image source={{ uri: s.img }} style={styles.beadImg} contentFit="cover" transition={150} /> : <View style={[styles.beadImg, styles.noImg]} />}
                </Pressable>
              </Animated.View>
            );
          })}
          {filled < SLOTS ? <NextMark x={nx} y={ny} size={BEAD - 4} /> : null}
        </Breath>

        {/* Der Frosch in der Mitte — antippen: er sagt das nächste Ziel */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEvent({ kind: "tap", at: Date.now() }); say(asleep ? C.sayAsleep : C.say); }}
          style={[styles.center, { left: cx - frogSize / 2, top: cy - frogSize / 2, width: frogSize, height: frogSize }]}
          accessibilityRole="button" accessibilityLabel={C.say}>
          <FrogStage base={asleep ? "sleep" : "idle"} event={event} size={frogSize} />
        </Pressable>

        {/* Die Zahlen am Reif — fest, wo die Federn angeknotet sind; die 12 oben */}
        {[...feathers.map((f) => ({ num: f.num, at: pt(f.ang / (Math.PI * 2) * SLOTS + 3, R + 3) })), { num: start + 12, at: pt(0, R + 3) }].map(({ num, at: [x, y] }) => {
          const g = giftOf(num);
          const done = C.count >= num;
          const big = num === start + 12;
          const size = big ? 30 : 26;
          return (
            <Pressable key={num} hitSlop={10} disabled={!g} onPress={() => { if (!g) return; Haptics.selectionAsync(); setEvent({ kind: "tap", at: Date.now() }); onGift(g); }}
              style={[styles.knot, done && styles.knotDone, { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 }]}
              accessibilityRole="button" accessibilityLabel={g?.title ?? String(num)}>
              {big && !done ? <SymbolView name="film.fill" size={11} tintColor={colors.gold} /> : <Text style={[styles.knotN, done && { color: "#2a1a05" }]}>{num}</Text>}
            </Pressable>
          );
        })}

        {/* Die Sprechblase des Froschs */}
        {bubble ? (
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(200)} pointerEvents="none"
            style={[styles.bubble, { left: 24, right: 24, top: cy - frogSize / 2 - 46 }]}>
            <Text style={styles.bubbleText}>{bubble}</Text>
          </Animated.View>
        ) : null}
      </View>
      {/* Das nächste Geschenk als Satz — liegt über den Federn */}
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

/* Eine Feder: hängt an ihrem Knoten am Reif und schwingt um ihn (nur die
   Drehung der nativen Ebene bewegt sich). Unerreicht ist sie blass. */
function FeatherView({ f, x, y, done, delay }: { f: Feather; x: number; y: number; done: boolean; delay: number }) {
  const w = 16, top = 30, L = f.len;
  const VW = w * 2 + 8, VH = top + L + 10;
  const swing = useSharedValue(0);
  useEffect(() => {
    const amp = 3.5 + (delay % 3) * 0.6;
    swing.value = withDelay(delay, withRepeat(withSequence(
      withTiming(amp, { duration: 2300 + delay * 0.4, easing: Easing.inOut(Easing.sin) }),
      withTiming(-amp, { duration: 2300 + delay * 0.4, easing: Easing.inOut(Easing.sin) }),
    ), -1, true));
  }, [swing, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${f.tilt + swing.value}deg` }] }));
  const id = `f${f.num}`;
  const ox = VW / 2;
  const vane =
    `M${ox} ${top} C${ox + w * 1.05} ${top + L * 0.12} ${ox + w * 1.1} ${top + L * 0.55} ${ox + w * 0.35} ${top + L * 0.92} ` +
    `Q${ox + 0.5} ${top + L + 4} ${ox} ${top + L + 2} Q${ox - 0.6} ${top + L + 3} ${ox - w * 0.3} ${top + L * 0.9} ` +
    `C${ox - w * 0.9} ${top + L * 0.55} ${ox - w * 0.85} ${top + L * 0.14} ${ox} ${top}Z`;
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x - VW / 2, top: y, width: VW, height: VH, transformOrigin: "50% 0%", opacity: done ? 1 : 0.3 }, style]}>
      <Svg width={VW} height={VH}>
        <Defs><ClipPath id={id}><Path d={vane} /></ClipPath></Defs>
        <Path d={`M${ox} 0 C${ox + 1.5} 10 ${ox - 1} 18 ${ox} ${top - 8}`} stroke="#9C6B1E" strokeWidth={1} fill="none" />
        <Circle cx={ox} cy={top - 14} r={2.8} fill={f.c3} />
        <Circle cx={ox} cy={top - 7} r={3.2} fill={colors.gold} />
        <Path d={vane} fill={f.c1} />
        <G clipPath={`url(#${id})`}>
          <Path d={`M${ox - w} ${top + L * 0.62} Q${ox} ${top + L * 0.5} ${ox + w * 1.2} ${top + L * 0.6} L${ox + w * 1.2} ${top + L + 6} L${ox - w} ${top + L + 6}Z`} fill={f.c2} opacity={0.85} />
          <Ellipse cx={ox + 0.5} cy={top + L * 0.78} rx={w * 0.42} ry={L * 0.09} fill={f.eye} opacity={0.9} />
          <Ellipse cx={ox + 0.5} cy={top + L * 0.78} rx={w * 0.18} ry={L * 0.04} fill={f.c2} />
          <Path d={`M${ox - w} ${top} L${ox + w * 1.2} ${top} L${ox + w * 1.2} ${top + L * 0.22} Q${ox} ${top + L * 0.3} ${ox - w} ${top + L * 0.2}Z`} fill={f.c3} opacity={0.55} />
          {Array.from({ length: 16 }, (_, k) => {
            const yy = top + 6 + k * (L / 17);
            return (
              <G key={k}>
                <Path d={`M${ox} ${yy} Q${ox + w * 0.5} ${yy + 2} ${ox + w * 1.2} ${yy + 7}`} stroke={f.c3} strokeWidth={0.55} fill="none" opacity={0.35} />
                <Path d={`M${ox} ${yy + 1} Q${ox - w * 0.5} ${yy + 3} ${ox - w} ${yy + 8}`} stroke={f.c3} strokeWidth={0.55} fill="none" opacity={0.3} />
              </G>
            );
          })}
        </G>
        {/* kleine Risse im Rand — in der Farbe des Himmels */}
        {[[0.38, 1], [0.6, -1], [0.71, 1]].map(([p, side], k) => (
          <Path key={k} d={`M${ox + side * w * 1.3} ${top + L * p + 2} L${ox + side * w * 0.55} ${top + L * p + 6} L${ox + side * w * 1.3} ${top + L * p + 9}Z`} fill={colors.bg} />
        ))}
        <Path d={`M${ox} ${top - 2} L${ox} ${top + L * 0.9}`} stroke="#fff6e3" strokeWidth={1.1} strokeLinecap="round" opacity={0.85} />
        {Array.from({ length: 7 }, (_, k) => {
          const a = -1.2 + k * 0.4;
          return <Path key={k} d={`M${ox} ${top + 2} q${Math.cos(a) * 7} 4 ${Math.cos(a) * 10} 9`} stroke={f.c3} strokeWidth={0.8} fill="none" opacity={0.7} />;
        })}
      </Svg>
    </Animated.View>
  );
}

/* Das Netz atmet: eine langsame, kaum sichtbare Skalierung der Ebene. */
function Breath({ style, children }: { style: any; children: React.ReactNode }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.012 * k.value }] }));
  return <Animated.View style={[style, a]} pointerEvents="box-none">{children}</Animated.View>;
}

/* Das Stück vom letzten Traum zur nächsten Perle — gestrichelt, pulsiert. */
function NextThread({ d, W, H }: { d: string; W: number; H: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.3 + 0.7 * k.value }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, pulse]}>
      <Svg width={W} height={H}>
        <Path d={d} fill="none" stroke={colors.gold} strokeWidth={2.2} strokeDasharray="4 5" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

/* Die nächste Perle: ein goldener Ring, der leise pulsiert. */
function NextMark({ x, y, size }: { x: number; y: number; size: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * k.value, transform: [{ scale: 0.9 + 0.2 * k.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.nextMark, { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 }, pulse]} />;
}

const styles = StyleSheet.create({
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  bead: { position: "absolute", width: BEAD, height: BEAD, borderRadius: BEAD / 2, borderWidth: 1.4, borderColor: colors.gold, backgroundColor: colors.bg2 },
  beadImg: { width: "100%", height: "100%", borderRadius: BEAD / 2 },
  noImg: { backgroundColor: "#8C84E8" },
  knot: { position: "absolute", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, borderWidth: 1.6, borderColor: colors.gold },
  knotDone: { backgroundColor: colors.gold },
  knotN: { color: colors.gold, fontSize: 10.5, fontWeight: "700", fontVariant: ["tabular-nums"] },
  nextMark: { position: "absolute", borderWidth: 1.6, borderColor: colors.gold },
  next: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7, paddingLeft: 7, paddingRight: 12, borderRadius: 999, backgroundColor: "rgba(12,20,35,0.88)", borderWidth: 1, borderColor: "rgba(246,198,91,0.45)", maxWidth: "92%" },
  nextIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  nextText: { color: colors.gold, fontSize: 13.5, fontWeight: "600", flexShrink: 1 },
  bubble: { position: "absolute", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "rgba(12,20,35,0.95)", borderWidth: 1, borderColor: "rgba(246,198,91,0.45)" },
  bubbleText: { color: colors.text, fontSize: 13.5, lineHeight: 19, textAlign: "center" },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  thread: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 14, color: colors.gold, textAlign: "center" },
});
