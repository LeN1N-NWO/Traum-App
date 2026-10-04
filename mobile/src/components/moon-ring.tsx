import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path } from "react-native-svg";
import type { GiftCard, HomeData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Traumfänger (Antons Wahl 04.10., Variante C; Rechnung bleibt
 * src/lib/dreamRing.js).
 *
 * Gewebt wie ein echter Traumfänger: Sechs Knoten am Reif, jede Runde
 * setzt ihre Knoten in die Mitte der Fäden der vorigen und zieht sie zu
 * einem V nach innen — so entsteht die Sechseck-Spirale bis zur Mitte.
 *
 *   · Jeder Traum mit Glimpse oder Film ist ein KNOTEN im Netz (Runde 1:
 *     Träume 1–6, Runde 2: 7–12), mit seinem Bild als Perle.
 *   · Die Verbindung von Traum zu Traum läuft NUR über die vorhandenen
 *     Fäden (kürzester Weg im Netz) — sie färbt sie golden, statt eigene
 *     Linien darüberzulegen (Antons Befund 04.10.: „sieht komisch aus").
 *     Der Weg zum nächsten Knoten pulsiert gestrichelt.
 *   · Die Mitte ist das Ziel: Ist das Netz voll (12), wird es zum Film.
 *   · Geschenke 3, 6, 9 als farbige Federn an den drei unteren Reif-
 *     knoten (rechts, unten, links), die Zahlen fest am Reif; die Federn
 *     hängen im Hintergrund, alles darunter liegt über ihnen.
 *   · Der Frosch ist vorerst raus aus der Mitte (Antons Ansage 04.10.).
 *
 * Leistung: Reif, Netz, Federn stille SVGs; bewegt nur native Ebenen
 * (Federn drehen, Netz atmet, Puls über Deckkraft). */
const SIX = 6;
const ROUNDS = 5;          // Runden des Netzes; Träume liegen auf 1 und 2
const SAG = 0.86;          // wie stark jede Runde nach innen gezogen ist
const BEAD = 30;
const HOLE = 0.17;         // Mitte (Ziel), Anteil am Reif-Radius

type Feather = { num: number; knot: number; len: number; tilt: number; c1: string; c2: string; c3: string; eye: string };
type Pt = [number, number];
const key = (r: number, i: number) => `${r}:${((i % SIX) + SIX) % SIX}`;

export function MoonRing({ C, width, onOpen, onGift, onIntroDone }: { C: HomeData["cycle"]; width: number; onOpen: (id: string) => void; onGift: (card: GiftCard) => void; onIntroDone?: () => void }) {
  const W = width, H = width;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.4;
  const filled = C.slots.filter((s) => s.dreamId).length;
  const start = (C.slots[0]?.num ?? 1) - 1;
  const dreamNode = (k: number) => key(1 + Math.floor(k / SIX), k % SIX);

  /* Das Netz: Knoten, Fäden, Reif — einmal gerechnet. */
  const web = useMemo(() => {
    const pos = new Map<string, Pt>();
    const ang = (deg: number) => (deg - 90) * Math.PI / 180;
    for (let i = 0; i < SIX; i++) pos.set(key(0, i), [cx + Math.cos(ang(i * 60)) * (R - 3), cy + Math.sin(ang(i * 60)) * (R - 3)]);
    for (let r = 1; r <= ROUNDS; r++) {
      for (let i = 0; i < SIX; i++) {
        const [ax, ay] = pos.get(key(r - 1, i))!, [bx, by] = pos.get(key(r - 1, i + 1))!;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        pos.set(key(r, i), [cx + (mx - cx) * SAG, cy + (my - cy) * SAG]);
      }
    }
    // Fäden: jede Runde als V von Knoten zu Knoten der vorigen; die innerste geschlossen.
    const edges: [string, string][] = [];
    for (let r = 0; r < ROUNDS; r++) {
      for (let i = 0; i < SIX; i++) { edges.push([key(r, i), key(r + 1, i)]); edges.push([key(r + 1, i), key(r, i + 1)]); }
    }
    for (let i = 0; i < SIX; i++) edges.push([key(ROUNDS, i), key(ROUNDS, i + 1)]);
    const adj = new Map<string, string[]>();
    for (const [a, b] of edges) { adj.set(a, [...(adj.get(a) || []), b]); adj.set(b, [...(adj.get(b) || []), a]); }
    const route = (from: string, to: string): string[] => {
      const prev = new Map<string, string | null>([[from, null]]);
      const q = [from];
      while (q.length) {
        const n = q.shift()!;
        if (n === to) break;
        // innere Knoten zuerst — der Weg windet sich nach innen, nicht zum Reif
        for (const m of [...(adj.get(n) || [])].sort((a, b) => Number(b.split(":")[0]) - Number(a.split(":")[0]))) {
          if (!prev.has(m)) { prev.set(m, n); q.push(m); }
        }
      }
      const out: string[] = [];
      for (let n: string | null | undefined = to; n; n = prev.get(n)) out.unshift(n);
      return out;
    };
    const d = (a: string, b: string) => { const [x1, y1] = pos.get(a)!, [x2, y2] = pos.get(b)!; return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`; };
    const pathOf = (nodes: string[]) => nodes.slice(1).map((n, k) => d(nodes[k], n)).join(" ");
    // Die Wege: in Traum k hinein — vom Reif oben (Traum 1) bzw. vom vorigen Traum.
    const legs = Array.from({ length: 2 * SIX }, (_, k) => pathOf(route(k === 0 ? key(0, 0) : dreamNode(k - 1), dreamNode(k))));
    // Reif: rund wie ein echter Traumfänger (Antons Befund 04.10.: „er ist
    // wirklich rund an den Seiten") — nur ein Hauch Unruhe der Umwicklung.
    let hoop = "";
    for (let k = 0; k <= 120; k++) {
      const a = (k / 120) * Math.PI * 2;
      const r = R + 0.5 * Math.sin(a * 9 + 1);
      hoop += `${k ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
    }
    const rnd = (i: number) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
    const fibers = Array.from({ length: 18 }, (_, k) => {
      const a = rnd(k + 3) * Math.PI * 2, rr = R + 4;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      return `M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a) * 6 + (rnd(k) - 0.5) * 3).toFixed(1)} ${(Math.sin(a) * 6).toFixed(1)}`;
    });
    return { pos, threads: edges.map(([a, b]) => d(a, b)).join(" "), legs, hoop, fibers };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W]);

  const P = (n: string) => web.pos.get(n)!;
  /* Die Federn an den drei unteren Reifknoten: 3 rechts, 6 unten, 9 links. */
  const feathers: Feather[] = [
    { num: start + 3, knot: 2, len: R * 0.62, tilt: -9, c1: "#2F8FA6", c2: "#1B5E73", c3: "#9EE0E8", eye: "#E8B04B" },
    { num: start + 6, knot: 3, len: R * 0.8, tilt: 0, c1: "#C2622D", c2: "#7E3714", c3: "#F6C08A", eye: "#2B1A10" },
    { num: start + 9, knot: 4, len: R * 0.62, tilt: 9, c1: "#6E5BD0", c2: "#3E2F8F", c3: "#CFC6FF", eye: "#E8B04B" },
  ];
  const giftOf = (num: number) => C.slots.find((s) => s.num === num)?.gift ?? null;
  const ringGift = giftOf(start + 2 * SIX);
  /* Die Einführung: von selbst beim leeren Fänger, sonst per langem Druck auf die Mitte. */
  const [replay, setReplay] = useState(false);
  /* Langer Druck auf eine Perle: der Film als Kachel, solange der Finger liegt (Antons Wunsch 04.10.). */
  const [peek, setPeek] = useState<{ film: string | null; img: string | null; title: string } | null>(null);
  const showIntro = !!C.intro && (C.intro.auto || replay);
  const [ex, ey] = filled < 2 * SIX ? P(dreamNode(filled)) : [cx, cy];

  return (
    <View style={{ alignItems: "center", gap: 8, zIndex: 0 }}>
      <View style={{ width: W, height: H }}>
        {/* Die Federn — hinter allem, hängen über den Rand hinaus */}
        {feathers.map((f, i) => {
          const [ax, ay] = P(key(0, f.knot));
          return <FeatherView key={f.num} f={f} x={ax} y={ay} done={C.count >= f.num} delay={i * 700} />;
        })}

        {/* Reif und Fasern — still */}
        <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* zurückhaltend (Antons Befund 04.10.: „die fette Linie an den Seiten ist zu dominant") */}
          <Path d={web.hoop} fill="none" stroke="#C9A86A" strokeWidth={2.6} strokeOpacity={0.55} />
          <Path d={web.hoop} fill="none" stroke="#F3E3C3" strokeWidth={1} strokeOpacity={0.45} strokeDasharray="2.4 2.6" />
          {web.fibers.map((d, k) => <Path key={k} d={d} stroke="#C9A86A" strokeWidth={0.6} strokeOpacity={0.4} />)}
        </Svg>

        <Breath style={StyleSheet.absoluteFill}>
          {/* Das Netz; die schon gewebten Wege golden — auf denselben Fäden */}
          <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d={web.threads} fill="none" stroke="#F3E3C3" strokeWidth={0.9} strokeOpacity={0.42} strokeLinecap="round" />
            {filled > 0 ? <Path d={web.legs.slice(0, filled).join(" ")} fill="none" stroke="#F1D79A" strokeWidth={1.3} strokeOpacity={0.75} strokeLinecap="round" /> : null}
            {/* die Knoten der Träume, die noch kommen */}
            {C.slots.map((s, k) => {
              if (s.dreamId || k === filled) return null;
              const [x, y] = P(dreamNode(k));
              return <Circle key={s.num} cx={x} cy={y} r={2.4} fill="rgba(243,227,195,0.55)" />;
            })}
            <Circle cx={cx} cy={cy} r={R * HOLE} fill="rgba(5,10,20,0.6)" stroke="#C9A86A" strokeWidth={1} strokeOpacity={0.6} />
          </Svg>
          {filled < 2 * SIX ? <NextThread d={web.legs[filled]} W={W} H={H} /> : null}
          {/* Die Perlen: die Traumbilder auf ihren Knoten */}
          {C.slots.map((s, k) => {
            if (!s.dreamId) return null;
            const [x, y] = P(dreamNode(k));
            return (
              <Animated.View key={s.num} entering={FadeIn.delay(80 + k * 40).duration(380)} style={[styles.bead, s.gift && styles.beadGift, { left: x - BEAD / 2, top: y - BEAD / 2 }]}>
                <Pressable onPress={() => { Haptics.selectionAsync(); onOpen(s.dreamId!); }} hitSlop={4} delayLongPress={280}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPeek({ film: s.film, img: s.img, title: s.title }); }}
                  onPressOut={() => setPeek(null)}>
                  {s.img ? <Image source={{ uri: s.img }} style={styles.beadImg} contentFit="cover" transition={150} /> : <View style={[styles.beadImg, styles.noImg]} />}
                </Pressable>
              </Animated.View>
            );
          })}
          {filled < 2 * SIX ? <NextMark x={ex} y={ey} size={BEAD - 4} /> : null}
        </Breath>

        {/* Die Mitte: das Ziel — ist das Netz voll, wird es zum Film */}
        <Pressable hitSlop={8} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setReplay(true); }}
          onPress={() => { if (ringGift) { Haptics.selectionAsync(); onGift(ringGift); } }}
          style={[styles.hole, { left: cx - R * HOLE, top: cy - R * HOLE, width: R * HOLE * 2, height: R * HOLE * 2, borderRadius: R * HOLE }]}
          accessibilityRole="button" accessibilityLabel={ringGift?.title ?? ""}>
          <Reel size={R * HOLE * 2 - 6} spin={!C.intro?.auto} full={filled >= 2 * SIX} />
        </Pressable>

        {/* Beim ersten Mal, solange der Fänger leer ist: die kleine Einführung */}
        {showIntro && C.intro ? (
          <Intro steps={C.intro.steps} cta={C.intro.cta} W={W}
            bead={[P(key(0, 0)), P(dreamNode(0))]} knots={feathers.map((f) => P(key(0, f.knot)))} center={[cx, cy]}
            onDone={() => { Haptics.selectionAsync(); setReplay(false); if (C.intro?.auto) onIntroDone?.(); }} />
        ) : null}

        {/* Die Vorschau-Kachel beim langen Druck — über allem im Ring */}
        {peek ? <PeekTile key={peek.film || peek.img || "p"} {...peek} W={W} /> : null}

        {/* Die Zahlen am Reif, wo die Federn angeknotet sind — fest */}
        {feathers.map((f) => {
          const [x, y] = P(key(0, f.knot));
          const g = giftOf(f.num);
          const done = C.count >= f.num;
          return (
            <Pressable key={f.num} hitSlop={10} disabled={!g} onPress={() => { if (g) { Haptics.selectionAsync(); onGift(g); } }}
              style={[styles.knot, done && styles.knotDone, { left: x - 13, top: y - 13 }]} accessibilityRole="button" accessibilityLabel={g?.title ?? String(f.num)}>
              <Text style={[styles.knotN, done && { color: "#2a1a05" }]}>{f.num}</Text>
            </Pressable>
          );
        })}
      </View>
      {/* Das nächste Geschenk als Satz — liegt über den Federn */}
      {C.nextGift ? (
        <Pressable onPress={() => { Haptics.selectionAsync(); if (C.nextGift) onGift(C.nextGift); }} style={styles.next} accessibilityRole="button">
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

/* Die Einführung im leeren Traumfänger (Antons Wunsch 04.10.): drei
   Schritte, die von selbst weiterlaufen (antippen springt weiter):
   1 · eine Perle fliegt vom Reif auf ihren ersten Knoten,
   2 · die drei Federknoten leuchten — dort hängen die Geschenke,
   3 · die Mitte leuchtet — voll wird der Fänger zum Film.
   Danach „Verstanden" (Befehl `catcherIntro`). */
function Intro({ steps, cta, W, bead, knots, center, onDone }: { steps: string[]; cta: string; W: number; bead: [Pt, Pt]; knots: Pt[]; center: Pt; onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= steps.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 3600);
    return () => clearTimeout(t);
  }, [step, steps.length]);
  const fly = useSharedValue(0);
  useEffect(() => {
    if (step === 0) fly.value = withRepeat(withSequence(withTiming(0, { duration: 1 }), withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.cubic) }), withDelay(600, withTiming(1, { duration: 1 }))), -1, false);
  }, [step, fly]);
  const [[x0, y0], [x1, y1]] = bead;
  const flyStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (x1 - x0) * fly.value }, { translateY: (y1 - y0) * fly.value }, { scale: 0.6 + 0.4 * fly.value }], opacity: 0.4 + 0.6 * fly.value }));
  const spots = step === 1 ? knots : step === 2 ? [center] : [];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {step === 0 ? <Animated.View pointerEvents="none" style={[styles.ghost, { left: x0 - BEAD / 2, top: y0 - BEAD / 2 }, flyStyle]} /> : null}
      {spots.map(([x, y], i) => <Halo key={`${step}-${i}`} x={x} y={y} size={step === 2 ? 64 : 44} delay={i * 180} />)}
      <Animated.View key={step} entering={FadeIn.duration(300)} style={[styles.introCard, { left: 18, right: 18, top: W * 0.06 }]}>
        <Pressable onPress={() => (step < steps.length - 1 ? setStep(step + 1) : onDone())} style={{ gap: 10, alignItems: "center" }}>
          <Text style={styles.introText}>{steps[step]}</Text>
          <View style={styles.introDots}>{steps.map((_, i) => <View key={i} style={[styles.introDot, i === step && styles.introDotOn]} />)}</View>
          {step === steps.length - 1 ? <Text style={styles.introCta}>{cta}</Text> : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}
function Halo({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1, true)); }, [k, delay]);
  const a = useAnimatedStyle(() => ({ opacity: 0.25 + 0.6 * k.value, transform: [{ scale: 0.85 + 0.3 * k.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.halo, { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 }, a]} />;
}

/* Die Vorschau eines Traums: hochkant, der Film läuft stumm in Schleife
   (ohne Film das Bild). Verschwindet, sobald der Finger loslässt. */
function PeekTile({ film, img, title, W }: { film: string | null; img: string | null; title: string; W: number }) {
  const player = useVideoPlayer(film, (p) => { p.loop = true; p.muted = true; p.play(); });
  const w = W * 0.52, h = w * 16 / 9;
  return (
    <Animated.View entering={ZoomIn.duration(180)} exiting={FadeOut.duration(140)} pointerEvents="none"
      style={[styles.peek, { width: w, height: h, left: (W - w) / 2, top: (W - h) / 2 }]}>
      {img ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      {film ? <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} /> : null}
      {title ? <View style={styles.peekBar}><Text style={styles.peekTitle} numberOfLines={2}>{title}</Text></View> : null}
    </Animated.View>
  );
}

/* Die Mitte: eine goldene Filmspule statt eines Geschenks (Antons Wunsch
   04.10.: „nicht wie ein Geschenk, eher ein Film-Icon"). Sie dreht sich
   langsam — die Träume laufen schon auf die Rolle. */
function Reel({ size, spin, full }: { size: number; spin: boolean; full: boolean }) {
  const k = useSharedValue(0);
  useEffect(() => { if (spin) k.value = withRepeat(withTiming(1, { duration: full ? 2600 : 16000, easing: Easing.linear }), -1, false); }, [k, spin, full]);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${k.value * 360}deg` }] }));
  const r = size / 2;
  return (
    <Animated.View style={[{ width: size, height: size }, a]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Circle cx={r} cy={r} r={r - 1} fill={full ? colors.gold : "#1B2457"} stroke={colors.gold} strokeWidth={1.6} />
        <Circle cx={r} cy={r} r={r * 0.78} fill="none" stroke={full ? "#9C6B1E" : "rgba(246,198,91,0.45)"} strokeWidth={0.8} />
        {Array.from({ length: 5 }, (_, i) => {
          const an = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return <Circle key={i} cx={r + Math.cos(an) * r * 0.52} cy={r + Math.sin(an) * r * 0.52} r={r * 0.18} fill={full ? "#9C6B1E" : "#0b1020"} stroke={colors.gold} strokeWidth={0.8} />;
        })}
        <Circle cx={r} cy={r} r={r * 0.14} fill={full ? "#fff6dd" : colors.gold} />
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
        <Path d={d} fill="none" stroke="#F1D79A" strokeWidth={1.6} strokeDasharray="4 5" strokeLinecap="round" />
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
  bead: { position: "absolute", width: BEAD, height: BEAD, borderRadius: BEAD / 2, borderWidth: 1.4, borderColor: colors.gold, backgroundColor: colors.bg2 },
  beadGift: { borderWidth: 2.2 },
  beadImg: { width: "100%", height: "100%", borderRadius: BEAD / 2 },
  noImg: { backgroundColor: "#8C84E8" },
  hole: { position: "absolute", alignItems: "center", justifyContent: "center" },
  knot: { position: "absolute", width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, borderWidth: 1.6, borderColor: colors.gold },
  knotDone: { backgroundColor: colors.gold },
  knotN: { color: colors.gold, fontSize: 10.5, fontWeight: "700", fontVariant: ["tabular-nums"] },
  nextMark: { position: "absolute", borderWidth: 1.6, borderColor: colors.gold },
  next: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7, paddingLeft: 7, paddingRight: 12, borderRadius: 999, backgroundColor: "rgba(12,20,35,0.88)", borderWidth: 1, borderColor: "rgba(246,198,91,0.45)", maxWidth: "92%" },
  nextIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  nextText: { color: colors.gold, fontSize: 13.5, fontWeight: "600", flexShrink: 1 },
  peek: { position: "absolute", borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: colors.gold, backgroundColor: colors.bg2, zIndex: 20 },
  peekBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "rgba(5,10,20,0.72)" },
  peekTitle: { color: colors.text, fontFamily: fonts.serif, fontSize: 15, lineHeight: 19 },
  ghost: { position: "absolute", width: BEAD, height: BEAD, borderRadius: BEAD / 2, backgroundColor: "#8C84E8", borderWidth: 1.6, borderColor: colors.gold },
  halo: { position: "absolute", borderWidth: 2, borderColor: colors.gold, backgroundColor: "rgba(246,198,91,0.12)" },
  introCard: { position: "absolute", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, backgroundColor: "rgba(12,20,35,0.92)", borderWidth: 1, borderColor: "rgba(246,198,91,0.45)" },
  introText: { color: colors.text, fontSize: 15, lineHeight: 21, textAlign: "center" },
  introDots: { flexDirection: "row", gap: 6 },
  introDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(234,240,251,0.3)" },
  introDotOn: { backgroundColor: colors.gold, width: 16 },
  introCta: { color: colors.gold, fontSize: 15, fontWeight: "700" },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  thread: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 14, color: colors.gold, textAlign: "center" },
});
