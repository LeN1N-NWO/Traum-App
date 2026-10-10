import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing, FadeIn, FadeOut, ZoomIn, cancelAnimation, interpolate, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withTiming, type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import de from "../../../src/i18n/de.js";
import en from "../../../src/i18n/en.js";
import { useAmbient } from "@/lib/ambient-clock";
import { useScreenActive } from "@/lib/use-screen-active";
import { useJournalStore, type GiftCard, type HomeData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Moonweave — der Traumfänger (Antons Übergabe 10.10., ersetzt den
 * gewebten Fänger mit Traumsteinen und Federn aus moon-ring.tsx; Vorlage
 * site/handoff/moonweave-for-claude, Moonweave.astro + dreamcatcher-concept).
 *
 *   · Ein Traum mit Glimpse oder Film = ein Blatt + ein nummerierter Punkt.
 *     Zwölf durchscheinende Blätter wachsen im Uhrzeigersinn zur Rosette;
 *     Traum 1 oben, Traum 12 auf elf Uhr. Die Nummern laufen über den Ring
 *     hinaus weiter (13–24 …), wie bisher (dreamRing.js).
 *   · Der nächste freie Punkt hat einen gestrichelten warmen Rand.
 *   · Geschenke bei 3, 6, 9, bei 12 der Sammelfilm: Diese Punkte leuchten
 *     selbst — warm, die 12 in Lavendel —, und ein leiser Schimmer wandert
 *     reihum 3 → 6 → 9 → 12 (Antons Wunsch 10.10., statt kleiner Sterne
 *     auf dunklen Plaketten: „sieht ein bisschen billig aus"; wie früher
 *     die Geschenksteine besonders markiert). Vergeben werden sie wie bisher — automatisch und
 *     nie doppelt (streakBoard.js giftFor, `giftedUpTo`). „Bereit zum
 *     Öffnen" heißt hier: vergeben, aber noch nicht angesehen (`giftUnseen`);
 *     das Siegel in der Mitte öffnet die bestehende Geschenk-Karte
 *     (gift-sheet.tsx GiftOpen).
 *   · Keine Bänder, Federn, Anhänger, Steine — die Übergabe hat sie
 *     ausdrücklich entfernt. Nichts dreht oder pulsiert dauerhaft.
 *
 * Geometrie exakt wie die Vorlage: viewBox 600 × 568, Mitte (300, 284),
 * gleichmäßig auf die Breite skaliert.
 *
 * Lagen (Antons Wahl 10.10., Entwurf „Moonweave nach Traum 12"): Ist ein
 * Ring voll, legt er sich verkleinert und um ein halbes Blatt gedreht nach
 * innen, der neue Ring wächst außen in seiner eigenen Farbe (Mondsilber,
 * Meeresleuchten, Morgenrot, Goldstunde, Nordlicht, dann wieder von vorn).
 * Höchstens drei innere Lagen sind zu sehen; ältere verschmelzen mit dem
 * Licht in der Mitte, das dadurch heller wird.
 *
 * Aufbau beim Erscheinen (Antons Wunsch 10.10.: „wie eine Uhr, die sich
 * dreht, aufbaut, zum Ende hin langsamer wird und am aktuellen Punkt stehen
 * bleibt"): Jedes Mal, wenn die Startseite nach vorn kommt, drehen sich
 * die inneren Lagen von innen nach außen ein, dann läuft ein Lichtzeiger
 * über den aktuellen Ring und lässt Blatt für Blatt erscheinen — immer
 * langsamer, bis er am letzten Traum stehen bleibt. Erst danach wächst ein
 * neuer Traum ein.
 *
 * Bewegung sonst nur bei NEUEM Stand (`seen` aus der Brücke, Befehl
 * `catcherSeen`): das neue Blatt wächst in 1,1 s ein, sein Punkt bekommt
 * einen Ring, der einmal ausläuft; ein neues Geschenk lässt das Siegel
 * auftauchen; ist der Ring voll, wird die Mitte hell. Wiederkommen spielt
 * nichts erneut ab. Dauerhaft bewegt sich nur der Schimmer der
 * Geschenk-Punkte (Deckkraft nativer Ebenen, nur solange sichtbar). Bei
 * „Bewegung reduzieren" sofort der Endstand, die Punkte leuchten still. */

export const VB_W = 600, VB_H = 568;
const CX = 300, CY = 284;
const LEAF = "M300 71 Q373 170 318 261 Q298 291 300 284 Q230 180 300 71Z";
const THREADS = [0, 1, 2, 3, 4].map((k) => ({ d: `M300 71 Q${322 + k * 8} ${163 + k * 4} 300 284 Q${265 + k * 5} 177 300 71`, o: 0.18 + k * 0.09 }));
const ARC = "M292 71.2 A213 213 0 0 1 343 75.5";
const NODE_R = 237;
const DOT = 26;              // sichtbarer Punkt (Vorlage: 24 mobil, 28 Desktop)
const HIT = 44;              // Tippfläche
const GLOW = 66;             // Schein hinter den Geschenk-Punkten
const GIFTS = [3, 6, 9, 12];

const nodeXY = (i: number) => {
  const a = (i * 30 - 90) * Math.PI / 180;
  return [CX + Math.cos(a) * NODE_R, CY + Math.sin(a) * NODE_R] as const;
};

/* Die Texte (src/i18n, cycle.weave) — mit Platzhaltern, deshalb direkt
   aus en.js/de.js wie offline-labels.ts; fehlt eine Sprache, Englisch. */
type WeaveText = {
  title: (n: number) => string; collected: string; ring: (r: number) => string;
  firstGift: string; nextGift: string; film: string; distance: (left: number) => string; full: string;
  filmMaking: string; filmReady: string; watch: string; milestone: (n: number) => string;
  states: Record<"locked" | "ready" | "collected" | "film", string>;
  sealGift: (k: number) => string; sealFilm: string; open: (k: number) => string; pending: string;
  node: (n: number, state: string, kind: string) => string;
  nodeStates: Record<"collected" | "next" | "empty", string>; nodeKinds: Record<"gift" | "film", string>;
  hint: string; hintEmpty: string; hintFull: string; tapNext: (leaf: number) => string; tapEmpty: (leaf: number, num: number) => string;
  rewards: string;
};
export function useWeaveText(): WeaveText {
  const lang = useJournalStore()?.language ?? Intl.DateTimeFormat().resolvedOptions().locale;
  const pick = String(lang).toLowerCase().startsWith("de") ? de : en;
  const base = (en as unknown as { cycle: { weave: WeaveText } }).cycle.weave;
  return { ...base, ...((pick as unknown as { cycle?: { weave?: WeaveText } }).cycle?.weave ?? {}) };
}

/* Das Funkeln (✧) und das Abspielzeichen (▷) — leichte Zeichen, keine Steine. */
export function Mark({ kind, size, color, width = 1.4 }: { kind: "spark" | "play"; size: number; color: string; width?: number }) {
  const s = size / 2, r = s - width;
  const d = kind === "play"
    ? `M${s - r * 0.55} ${s - r * 0.8} L${s + r * 0.85} ${s} L${s - r * 0.55} ${s + r * 0.8}Z`
    : `M${s} ${s - r} Q${s + r * 0.14} ${s - r * 0.14} ${s + r} ${s} Q${s + r * 0.14} ${s + r * 0.14} ${s} ${s + r} Q${s - r * 0.14} ${s + r * 0.14} ${s - r} ${s} Q${s - r * 0.14} ${s - r * 0.14} ${s} ${s - r}Z`;
  return <Svg width={size} height={size}><Path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" /></Svg>;
}

/* Die Farben der Ringe (Lagen, 10.10.): Ring 1 Mondsilber wie die
   Vorlage, dann Meeresleuchten, Morgenrot, Goldstunde, Nordlicht — danach
   wieder von vorn. `line` färbt die Umrisse des laufenden Rings. */
const RINGS = [
  { silk: ["#a6dded", "#b9a8ef", "#d2c2f4"], thread: ["#b5deec", "#c3b1ee", "#8a89b0"], line: "#b7c2e0" },
  { silk: ["#8fe3dc", "#7fb8e8", "#a8c8f0"], thread: ["#a4ece4", "#8cc3ef", "#6f8fb0"], line: "#8fd8e0" },
  { silk: ["#f2b8c0", "#d9a6d8", "#f0c8d8"], thread: ["#f5c6cc", "#d8a9dc", "#9a7f9e"], line: "#ecb3c2" },
  { silk: ["#f0d49c", "#e3b98a", "#f2dcb0"], thread: ["#f4dcaa", "#e6c08e", "#a08a6a"], line: "#e1c99c" },
  { silk: ["#9fe8c2", "#8fd0e0", "#b8f0d8"], thread: ["#aef0cc", "#94d4e6", "#6f9f8f"], line: "#9fe0c4" },
] as const;
const palette = (ring: number) => RINGS[(Math.max(1, ring) - 1) % RINGS.length];
/* Die inneren Lagen: je tiefer, desto kleiner, gedrehter, leiser (Tiefe 0 = der laufende Ring). */
const DEPTH_SCALE = [1, 0.8, 0.63, 0.49, 0.38];
const DEPTH_OPACITY = [1, 0.95, 0.85, 0.72, 0];
const MAX_LAYERS = 3;

/* Die Verläufe einer Zeichenfläche — in den Farben ihres Rings. */
function WeaveDefs({ ring = 1 }: { ring?: number }) {
  const P = palette(ring);
  return (
    <Defs>
      <RadialGradient id="mw-aura" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#8f7bc9" stopOpacity={0.2} /><Stop offset="1" stopColor="#8f7bc9" stopOpacity={0} /></RadialGradient>
      <LinearGradient id="mw-silk" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={P.silk[0]} stopOpacity={0.35} /><Stop offset="0.55" stopColor={P.silk[1]} stopOpacity={0.12} /><Stop offset="1" stopColor={P.silk[2]} stopOpacity={0.02} />
      </LinearGradient>
      <LinearGradient id="mw-thread" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={P.thread[0]} /><Stop offset="0.5" stopColor={P.thread[1]} /><Stop offset="1" stopColor={P.thread[2]} stopOpacity={0.25} />
      </LinearGradient>
      <LinearGradient id="mw-hand" x1="0" y1="1" x2="0" y2="0">
        <Stop offset="0" stopColor={P.thread[0]} stopOpacity={0} /><Stop offset="0.7" stopColor={P.thread[0]} stopOpacity={0.55} /><Stop offset="1" stopColor="#ffffff" stopOpacity={0.95} />
      </LinearGradient>
    </Defs>
  );
}

/* Ein gefülltes Blatt: Seide, Faden, fünf feine Innenlinien, der Bogen am Ring, der Punkt oben. */
function Leaf({ i }: { i: number }) {
  return (
    <G transform={`rotate(${i * 30} ${CX} ${CY})`}>
      <Path d={LEAF} fill="url(#mw-silk)" stroke="url(#mw-thread)" strokeWidth={0.85} />
      {THREADS.map((t, k) => <Path key={k} d={t.d} fill="none" stroke="url(#mw-thread)" strokeWidth={0.5} opacity={t.o} />)}
      <Path d={ARC} fill="none" stroke="url(#mw-thread)" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={300} cy={71} r={2.1} fill="#e4e3fa" />
    </G>
  );
}

/* Ein Blatt des laufenden Rings, das beim Aufbau erscheint, sobald der
   Lichtzeiger daran vorbeikommt. Nach dem Aufbau einfach sichtbar. */
const AnimatedG = Animated.createAnimatedComponent(G);
const easeOut = (x: number) => { "worklet"; const c = Math.max(0, Math.min(1, x)); return 1 - (1 - c) * (1 - c) * (1 - c); };
function SweepLeaf({ i, t, B, S, N }: { i: number; t: SharedValue<number>; B: SharedValue<number>; S: SharedValue<number>; N: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    if (t.value >= B.value) return { opacity: 1 };
    const p = easeOut((t.value - S.value) / Math.max(1, B.value - S.value)) * N.value;
    return { opacity: Math.max(0, Math.min(1, p - i)) };
  });
  return <AnimatedG animatedProps={props}><Leaf i={i} /></AnimatedG>;
}

export type WeaveHandlers = {
  onOpen: (id: string) => void;              // Tipp auf einen gesammelten Punkt → sein Traum
  onGift: (card: GiftCard) => void;          // Tipp auf die leere Mitte → was der volle Ring bringt
  onOpenGift: () => void;                    // ein vergebenes, ungeöffnetes Geschenk öffnen
  onFilm: (id: string | null) => void;       // der Sammelfilm (null: entsteht noch)
  onSeen: (count: number) => void;           // der Stand ist gezeigt — nichts mehr einwachsen lassen
  onIntroDone?: () => void;
};

export function Moonweave({ C, width, action, ...h }: { C: HomeData["cycle"]; width: number; action?: React.ReactNode } & WeaveHandlers) {
  const T = useWeaveText();
  const reduce = useReducedMotion();
  const active = useScreenActive();
  const k = width / VB_W, W = width, H = VB_H * k;
  const start = (C.slots[0]?.num ?? 1) - 1;                  // Ring 2 zählt 13–24
  const count = C.count;
  const ringNo = Math.floor(start / 12) + 1;
  const pastRings = ringNo - 1;
  const layers = Math.min(pastRings, MAX_LAYERS);            // sichtbare innere Lagen
  const melted = pastRings - layers;                          // im Licht der Mitte aufgegangen

  /* Was neu ist: alles über `seen` wächst einmal sichtbar ein — erst, wenn
     die Startseite zu sehen ist. Ohne `seen` (alter Stand) gilt alles als gesehen. */
  const [from, setFrom] = useState<number | null>(null);      // ab welcher Traumzahl gerade eingewachsen wird
  const [ack, setAck] = useState(-1);                         // schon gezeigt, auch wenn die Brücke es noch nicht zurückgemeldet hat
  const seen = C.seen == null ? null : Math.max(C.seen, ack);
  const shownUpTo = from ?? (seen != null && !reduce ? Math.min(seen, count) : count);   // still gezeichnet bis zu dieser Traumzahl
  const settled = C.slots.filter((s) => s.dreamId && s.num <= shownUpTo).length;

  /* Der Aufbau: `t` läuft in ms von 0 bis B. Die Lagen drehen sich von
     innen nach außen ein, ab S läuft der Lichtzeiger über die N Blätter
     des laufenden Rings — mit nachlassendem Tempo. Beim Weggehen zurück
     auf 0, damit das nächste Erscheinen wieder von vorn aufbaut. */
  const t = useSharedValue(reduce ? 1e9 : 0);
  const B = useSharedValue(1), S = useSharedValue(0), N = useSharedValue(0);
  const buildEnd = useRef(0);
  useEffect(() => {
    if (reduce) { cancelAnimation(t); t.value = 1e9; buildEnd.current = 0; return; }
    if (!active) { cancelAnimation(t); t.value = 0; buildEnd.current = 0; return; }
    const sweepFrom = 150 + layers * 160;
    const total = sweepFrom + 1150 + 75 * settled;
    S.value = sweepFrom; N.value = settled; B.value = total;
    t.value = 0;
    t.value = withTiming(total, { duration: total, easing: Easing.linear });
    buildEnd.current = Date.now() + total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduce]);

  const grow = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); if (startTimer.current) clearTimeout(startTimer.current); }, []);
  useEffect(() => {
    if (!active) { if (startTimer.current) clearTimeout(startTimer.current); return; }
    // alter Stand, ein gelöschter Traum oder „Bewegung reduzieren": nur merken, nichts einwachsen lassen
    if (seen == null || count < seen || reduce) { if (ack > count) setAck(count); if (C.seen !== count) h.onSeen(count); return; }
    if (count === seen) return;
    const was = seen;
    const begin = () => {
      setFrom(was);
      setAck(count);
      h.onSeen(count);
      grow.value = 0;
      grow.value = withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) });
      // nicht an die Abhängigkeiten gebunden: die Rückmeldung der Brücke darf das Aufräumen nicht abbrechen
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFrom(null), 1900);
    };
    // erst wenn der Aufbau steht, wächst das Neue ein
    if (startTimer.current) clearTimeout(startTimer.current);
    const wait = buildEnd.current - Date.now();
    if (wait > 0) startTimer.current = setTimeout(begin, wait); else begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count, seen, reduce]);
  const isFresh = (num: number) => from != null && num > from && num <= count;
  /* Sichtbar ist ein Traum, sobald sein Blatt steht oder gerade einwächst —
     erst dann zählen Punkt, Zahl, Siegel und Schein ihn mit. */
  const revealed = (num: number) => num <= (from != null ? count : shownUpTo);
  const filled = C.slots.filter((s) => s.dreamId && revealed(s.num)).length;   // die Plätze füllen sich der Reihe nach
  const full = filled === 12;
  const freshIdx = C.slots.map((s, i) => (s.dreamId && s.num > shownUpTo && revealed(s.num) ? i : -1)).filter((i) => i >= 0);
  const growStyle = useAnimatedStyle(() => ({ opacity: grow.value }));

  /* Der Schimmer der Geschenk-Punkte: der gemeinsame 30er-Takt (lib/ambient-clock.tsx),
     jeder Punkt etwas später — so wandert er reihum. */
  const wave = useAmbient(active && !reduce);

  /* Ein Punkt ist ausgewählt (Tipp) — sein Blatt leuchtet leise. */
  const [selected, setSelected] = useState<number | null>(null);
  const [said, setSay] = useState<{ text: string; at: number } | null>(null);   // gilt nur für den Stand, zu dem getippt wurde
  const say = said && said.at === count ? said.text : null;
  useEffect(() => { if (!active) { setSelected(null); setSay(null); } }, [active]);
  const [peek, setPeek] = useState<{ film: string | null; img: string | null; title: string } | null>(null);
  const [replay, setReplay] = useState(false);
  const showIntro = !!C.intro && (C.intro.auto || replay);

  /* Die Mitte: ein ungeöffnetes Geschenk, sonst — voller Ring — der Film. */
  const pending = C.unseen != null && revealed(C.unseen) ? C.unseen : null;
  const giftNo = pending ? (((pending - 1) % 12) + 1) / 3 : 0;
  const seal = pending ? "gift" : full ? "film" : null;
  const sealFresh = from != null && (pending ? pending > from : full);
  const ringGift = C.slots[11]?.gift ?? null;

  const tapNode = (i: number) => {
    const s = C.slots[i];
    Haptics.selectionAsync();
    if (s.dreamId) {
      setSelected(i); setSay(null);
      const id = s.dreamId;
      setTimeout(() => h.onOpen(id), reduce ? 0 : 260);
      return;
    }
    setSelected(null);
    const line = i === filled ? T.tapNext(i + 1) : T.tapEmpty(i + 1, s.num);
    setSay({ text: line, at: count });
    AccessibilityInfo.announceForAccessibility(line);
  };
  const hint = say ?? (full ? T.hintFull : filled === 0 ? T.hintEmpty : T.hint);

  return (
    <View style={{ alignItems: "center", alignSelf: "stretch" }}>
      <View style={{ width: W, height: H }} accessibilityLabel={T.title(filled)}>
        {/* Still: Schein und die beiden Ringe */}
        <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
          <WeaveDefs />
          <Circle cx={CX} cy={CY} r={278} fill="url(#mw-aura)" />
          <Circle cx={CX} cy={CY} r={221} fill="none" stroke="#b9c3df" strokeOpacity={0.11} />
          <Circle cx={CX} cy={CY} r={213} fill="none" stroke="#b9c3df" strokeOpacity={0.32} strokeWidth={0.8} />
        </Svg>
        {/* Die inneren Lagen: volle Ringe, die tiefste zuerst */}
        {Array.from({ length: layers }, (_, d) => {
          const depth = layers - d;                    // 3, 2, 1
          const ring = ringNo - depth;
          return <PastLayer key={ring} ring={ring} depth={depth} delay={(layers - depth) * 160} W={W} H={H} t={t} B={B}
            rollIn={depth === 1 && from != null && from === start} />;
        })}
        {/* Der laufende Ring: Umrisse in seiner Farbe, die gezeigten Blätter; dreht sich beim Aufbau ein */}
        <RingTurn t={t} B={B} W={W} H={H}>
          <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
            <WeaveDefs ring={ringNo} />
            {C.slots.map((_, i) => <Path key={i} d={LEAF} transform={`rotate(${i * 30} ${CX} ${CY})`} fill="none" stroke={palette(ringNo).line} strokeOpacity={ringNo === 1 ? 0.075 : 0.13} />)}
            {Array.from({ length: settled }, (_, i) => <SweepLeaf key={i} i={i} t={t} B={B} S={S} N={N} />)}
            {selected != null && C.slots[selected]?.dreamId ? (
              <G transform={`rotate(${selected * 30} ${CX} ${CY})`}>
                <Path d={LEAF} fill="none" stroke="#b9a8ef" strokeOpacity={0.35} strokeWidth={7} strokeLinejoin="round" />
                <Path d={LEAF} fill="#b9a8ef" fillOpacity={0.33} stroke="#f0e6ff" strokeWidth={1.5} />
              </G>
            ) : null}
          </Svg>
          <Hand t={t} B={B} S={S} N={N} W={W} H={H} ring={ringNo} />
        </RingTurn>
        {/* Neu dazugekommen: wächst einmal ein, dann zeichnet es der laufende Ring */}
        {freshIdx.length ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, growStyle]}>
            <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
              <WeaveDefs ring={ringNo} />
              {freshIdx.map((i) => <Leaf key={i} i={i} />)}
            </Svg>
          </Animated.View>
        ) : null}

        <Heart k={k} W={W} H={H} full={full} boost={Math.min(1, pastRings * 0.12 + melted * 0.15)} />

        {/* Die Mitte antippen: der volle Ring bringt einen Film; lang drücken = die Einführung noch einmal */}
        {!seal ? (
          <Pressable style={[styles.center, { left: W / 2 - 34, top: H / 2 - 34 }]} hitSlop={6}
            onPress={() => { if (ringGift) { Haptics.selectionAsync(); h.onGift(ringGift); } }}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setReplay(true); }}
            accessibilityRole="button" accessibilityLabel={ringGift?.title ?? T.film} />
        ) : (
          <Seal key={`${seal}-${pending ?? 0}`} W={W} H={H} label={seal === "gift" ? T.sealGift(giftNo) : T.sealFilm} kind={seal === "gift" ? "spark" : "play"}
            enter={sealFresh && !reduce} delay={from != null ? 700 : 0}
            a11y={seal === "gift" ? T.open(giftNo) : T.watch}
            onPress={() => { Haptics.selectionAsync(); if (seal === "gift") h.onOpenGift(); else h.onFilm(C.film?.id ?? null); }}
            onLongPress={() => setReplay(true)} />
        )}

        {/* Die zwölf Punkte — aufrecht, außen am Ring */}
        {C.slots.map((s, i) => {
          const [x, y] = nodeXY(i);
          const got = !!s.dreamId && revealed(s.num), next = i === filled;
          const gift = (i + 1) % 3 === 0;
          const state = got ? T.nodeStates.collected : next ? T.nodeStates.next : T.nodeStates.empty;
          const kind = gift ? (i === 11 ? T.nodeKinds.film : T.nodeKinds.gift) : "";
          return (
            <Pressable key={s.num} onPress={() => tapNode(i)} delayLongPress={280}
              onLongPress={got ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPeek({ film: s.film, img: s.img, title: s.title }); } : undefined}
              onPressOut={() => setPeek(null)}
              style={[styles.hit, { left: x * k - HIT / 2, top: y * k - HIT / 2 }]}
              accessibilityRole="button" accessibilityLabel={T.node(s.num, state, kind)} accessibilityState={{ selected: selected === i }}>
              {gift ? <GiftGlow wave={wave} order={(i + 1) / 3 - 1} film={i === 11} got={got} still={reduce} /> : null}
              {isFresh(s.num) && !reduce ? <Ripple /> : null}
              {selected === i ? <View style={styles.ring} /> : null}
              <View style={[styles.dot, got && styles.dotGot, gift && (i === 11 ? (got ? styles.dotFilmGot : styles.dotFilm) : (got ? styles.dotGiftGot : styles.dotGift)), next && styles.dotNext]}>
                <Text style={[styles.num, got && styles.numGot, gift && (i === 11 ? styles.numFilm : styles.numGift), next && styles.numNext, s.num > 99 && { fontSize: 9 }]} maxFontSizeMultiplier={1.2}>{s.num}</Text>
              </View>
            </Pressable>
          );
        })}

        {showIntro && C.intro ? (
          <Intro steps={C.intro.steps} cta={C.intro.cta} W={W} k={k}
            onDone={() => { Haptics.selectionAsync(); setReplay(false); if (C.intro?.auto) h.onIntroDone?.(); }} />
        ) : null}
        {peek ? <PeekTile key={peek.film || peek.img || "p"} {...peek} W={W} H={H} /> : null}
      </View>

      <View style={styles.countRow} accessible>
        <Text style={styles.countN}>{filled}</Text>
        <Text style={styles.countText}>{T.collected}{C.ringNo > 1 ? `  ·  ${T.ring(C.ringNo)}` : ""}</Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>
      {/* der Platz für den Aufnahme-Knopf der Startseite — vor dem Geschenk-Feld */}
      {action}

      <RewardPanel C={C} T={T} filled={filled} start={start} pending={pending} giftNo={giftNo}
        celebrate={from != null && !reduce && GIFTS.some((g) => start + g > from && start + g <= count)}
        onOpenGift={h.onOpenGift} onFilm={() => h.onFilm(C.film?.id ?? null)} />
    </View>
  );
}

/* Die Mitte: ein stiller Schein. Wird der Ring voll: heller und größer
   (1,8 s) — nur beim Wechsel, beim Wiederkommen steht er schon so da. */
function Heart({ k, W, H, full, boost = 0 }: { k: number; W: number; H: number; full: boolean; boost?: number }) {
  const reduce = useReducedMotion();
  const v = useSharedValue(full ? 1 : 0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    v.value = reduce ? (full ? 1 : 0) : withTiming(full ? 1 : 0, { duration: 1800, easing: Easing.inOut(Easing.quad) });
  }, [full, reduce, v]);
  /* Jeder volle Ring macht das Licht in der Mitte etwas heller — die verschmolzenen Lagen leben darin weiter. */
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, 0.28 + 0.4 * boost + 0.72 * v.value), transform: [{ scale: 1 + 0.2 * boost + 0.35 * v.value }] }));
  const r = 49 * k, s = r * 2;
  return (
    <>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: W / 2 - r, top: H / 2 - r, width: s, height: s }, style]}>
        <Svg width={s} height={s}>
          <Defs>
            <RadialGradient id="mw-heart" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#f3eaff" stopOpacity={0.8} /><Stop offset="0.22" stopColor="#c6b4ee" stopOpacity={0.3} /><Stop offset="1" stopColor="#bca6ed" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={r} cy={r} r={r} fill="url(#mw-heart)" />
        </Svg>
      </Animated.View>
      {/* der Punkt in der Mitte bleibt stehen */}
      <View pointerEvents="none" style={{ position: "absolute", left: W / 2 - 4 * k, top: H / 2 - 4 * k, width: 8 * k, height: 8 * k, borderRadius: 4 * k, backgroundColor: "#ddd3f0" }} />
    </>
  );
}

/* Eine innere Lage: ein voller Ring, verkleinert und gedreht. Beim Aufbau
   dreht sie sich von innen ein (die tiefste zuerst). Wird sie tiefer (ein
   neuer Ring ist voll), gleitet sie in 0,9 s an ihren neuen Platz; ein
   gerade voll gewordener Ring sinkt aus der vollen Größe nach innen (`rollIn`). */
function PastLayer({ ring, depth, delay, W, H, t, B, rollIn }: {
  ring: number; depth: number; delay: number; W: number; H: number; t: SharedValue<number>; B: SharedValue<number>; rollIn: boolean;
}) {
  const reduce = useReducedMotion();
  const d = useSharedValue(rollIn && !reduce ? 0 : depth);
  useEffect(() => {
    d.value = reduce ? depth : withTiming(depth, { duration: 900, easing: Easing.inOut(Easing.cubic) });
  }, [depth, reduce, d]);
  const style = useAnimatedStyle(() => {
    const b = t.value >= B.value ? 1 : easeOut((t.value - delay) / 900);
    const sc = interpolate(d.value, [0, 1, 2, 3, 4], DEPTH_SCALE as unknown as number[]);
    const op = interpolate(d.value, [0, 1, 2, 3, 4], DEPTH_OPACITY as unknown as number[]);
    return { opacity: op * b, transform: [{ rotate: `${d.value * 15 - 150 * (1 - b)}deg` }, { scale: sc * (0.55 + 0.45 * b) }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <WeaveDefs ring={ring} />
        {Array.from({ length: 12 }, (_, i) => <Leaf key={i} i={i} />)}
      </Svg>
    </Animated.View>
  );
}

/* Der laufende Ring dreht sich beim Aufbau ein und kommt langsam zur Ruhe. */
function RingTurn({ t, B, W, H, children }: { t: SharedValue<number>; B: SharedValue<number>; W: number; H: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const b = t.value >= B.value ? 1 : easeOut(t.value / Math.max(1, B.value));
    return { transform: [{ rotate: `${-55 * (1 - b)}deg` }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width: W, height: H }, style]}>{children}</Animated.View>;
}

/* Der Lichtzeiger: läuft wie ein Uhrzeiger über die Blätter, wird langsamer und verblasst am aktuellen Punkt. */
function Hand({ t, B, S, N, W, H, ring }: { t: SharedValue<number>; B: SharedValue<number>; S: SharedValue<number>; N: SharedValue<number>; W: number; H: number; ring: number }) {
  const style = useAnimatedStyle(() => {
    if (t.value >= B.value || N.value <= 0) return { opacity: 0, transform: [{ rotate: "0deg" }] };
    const p = easeOut((t.value - S.value) / Math.max(1, B.value - S.value)) * N.value;
    const fadeIn = Math.max(0, Math.min(1, (t.value - S.value) / 220));
    const fadeOut = Math.max(0, Math.min(1, (B.value - t.value) / 450));
    return { opacity: fadeIn * fadeOut, transform: [{ rotate: `${p * 30 + 12}deg` }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width: W, height: H }, style]}>
      <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <WeaveDefs ring={ring} />
        <Path d={`M${CX} ${CY} L${CX} ${CY - 213}`} stroke="url(#mw-hand)" strokeWidth={2.2} strokeLinecap="round" />
        <Circle cx={CX} cy={CY - 213} r={4} fill="#ffffff" opacity={0.9} />
      </Svg>
    </Animated.View>
  );
}

/* Das Siegel in der Mitte: dunkle runde Fläche, warmer Rand, Funkeln + Satz. */
function Seal({ W, H, label, kind, enter, delay, a11y, onPress, onLongPress }: {
  W: number; H: number; label: string; kind: "spark" | "play"; enter: boolean; delay: number; a11y: string; onPress: () => void; onLongPress: () => void;
}) {
  const D = Math.max(82, Math.min(100, W * 0.24));
  const v = useSharedValue(enter ? 0 : 1);
  useEffect(() => { if (enter) v.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })); }, [enter, delay, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.65 + 0.35 * v.value }] }));
  const G2 = D + 40;
  return (
    <Animated.View style={[{ position: "absolute", left: W / 2 - G2 / 2, top: H / 2 - G2 / 2, width: G2, height: G2, alignItems: "center", justifyContent: "center" }, style]}>
      <Svg width={G2} height={G2} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="mw-halo" cx="50%" cy="50%" r="50%"><Stop offset="0.55" stopColor="#c5a67b" stopOpacity={0.16} /><Stop offset="1" stopColor="#c5a67b" stopOpacity={0} /></RadialGradient>
          <RadialGradient id="mw-seal" cx="35%" cy="25%" r="80%"><Stop offset="0" stopColor="#39313f" /><Stop offset="1" stopColor="#131828" /></RadialGradient>
        </Defs>
        <Circle cx={G2 / 2} cy={G2 / 2} r={G2 / 2} fill="url(#mw-halo)" />
        <Circle cx={G2 / 2} cy={G2 / 2} r={D / 2 - 0.5} fill="url(#mw-seal)" stroke="#d7c19b" strokeOpacity={0.54} strokeWidth={1} />
      </Svg>
      <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.sealHit, { width: D, height: D, borderRadius: D / 2 }]}
        accessibilityRole="button" accessibilityLabel={a11y}>
        <Mark kind={kind} size={D * 0.32} width={1.5} color="#efd8ab" />
        <Text style={styles.sealText} numberOfLines={2} maxFontSizeMultiplier={1.15}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* Das Leuchten eines Geschenk-Punkts: ein weicher Schein dahinter, der
   aufglimmt, wenn der Schimmer vorbeikommt (3 → 6 → 9 → 12, alle 5,2 s).
   Erreicht leuchtet er heller. Warm für Geschenke, Lavendel für den Film. */
const WAVE = 5200, STEP = 420;
function GiftGlow({ wave, order, film, got, still }: { wave: SharedValue<number>; order: number; film: boolean; got: boolean; still: boolean }) {
  const base = got ? 0.55 : 0.3, peak = got ? 1 : 0.75;
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: base, transform: [{ scale: 1 }] };
    let ms = (wave.value % WAVE) - order * STEP;
    if (ms < 0) ms += WAVE;
    const g = ms < 900 ? Math.pow(Math.sin((Math.PI / 2) * (ms / 900)), 2) : ms < 2200 ? Math.pow(Math.cos((Math.PI / 2) * ((ms - 900) / 1300)), 2) : 0;
    return { opacity: base + (peak - base) * g, transform: [{ scale: 1 + 0.14 * g }] };
  });
  const c = film ? "#d8caf6" : "#e1c99c";
  return (
    <Animated.View pointerEvents="none" style={[styles.glow, style]}>
      <Svg width={GLOW} height={GLOW}>
        <Defs>
          <RadialGradient id={`mw-glow-${film ? "f" : "g"}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0.3" stopColor={c} stopOpacity={0.55} />
            <Stop offset="1" stopColor={c} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill={`url(#mw-glow-${film ? "f" : "g"})`} />
      </Svg>
    </Animated.View>
  );
}

/* Ein frisch gesammelter Punkt: ein Ring läuft einmal aus (0 → 18 pt, 1,1 s). */
function Ripple() {
  const v = useSharedValue(0);
  useEffect(() => { v.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }); }, [v]);
  const style = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - v.value), transform: [{ scale: 1 + (36 / DOT) * v.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.ripple, style]} />;
}

/* Das nächste Ziel, gleich unter dem Ring: Titel, Bruch, Abstand, zwölf
   Striche, die vier Meilensteine — und, wenn eines wartet, „Geschenk öffnen". */
function RewardPanel({ C, T, filled, start, pending, giftNo, celebrate, onOpenGift, onFilm }: {
  C: HomeData["cycle"]; T: WeaveText; filled: number; start: number; pending: number | null; giftNo: number; celebrate: boolean; onOpenGift: () => void; onFilm: () => void;
}) {
  const full = filled === 12;
  const target = GIFTS.find((g) => g > filled) ?? 12;
  const heading = full || target === 12 ? T.film : target === 3 ? T.firstGift : T.nextGift;
  const what = !full && C.nextGift && C.nextGift.num === start + target ? C.nextGift.title : null;   // was es wirklich gibt (giftKinds)
  const gifted = C.gifted ?? 0;
  const stateOf = (g: number) => {
    const num = start + g;
    if (g === 12) return filled >= 12 ? "film" : "locked";
    if (g > filled) return "locked";
    if (pending === num) return "ready";
    return num <= gifted ? "collected" : "ready";
  };
  /* Ein neu erreichtes Geschenk: das Funkeln dreht sich einmal halb (1,2 s). */
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!celebrate) return;
    spin.value = 0;
    spin.value = withDelay(500, withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }));
  }, [celebrate, spin]);
  const emblem = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 180}deg` }, { scale: 1 + 0.3 * Math.sin(spin.value * Math.PI) }] }));

  return (
    <View style={styles.panel}>
      <View style={styles.panelTop}>
        <Animated.View style={emblem}><Mark kind={full || target === 12 ? "play" : "spark"} size={26} width={1.4} color="#e1c99c" /></Animated.View>
        <Text style={styles.panelHeading}>{heading}</Text>
        <Text style={styles.panelFraction}>{full ? "12 / 12" : `${filled} / ${target}`}</Text>
      </View>
      <Text style={styles.distance}>{full ? T.full : T.distance(target - filled)}</Text>
      <View style={styles.track} accessible={false}>
        {Array.from({ length: 12 }, (_, i) => {
          const g = (i + 1) % 3 === 0, on = i < filled;
          return <View key={i} style={[styles.step, g && styles.stepGift, on && (g ? styles.stepGiftOn : styles.stepOn)]} />;
        })}
      </View>
      {pending ? <Text style={styles.event}>{T.pending}</Text>
        : full ? <Text style={styles.event}>{C.film?.id ? T.filmReady : T.filmMaking}</Text>
        : what ? <Text style={styles.event}>{what}</Text> : null}
      {pending ? (
        <Pressable onPress={() => { Haptics.selectionAsync(); onOpenGift(); }} style={styles.claim} accessibilityRole="button" accessibilityLabel={T.open(giftNo)}>
          <Text style={styles.claimText}>{T.open(giftNo)}</Text>
          <Mark kind="spark" size={14} width={1.2} color="#ebd5ae" />
        </Pressable>
      ) : full && C.film?.id ? (
        <Pressable onPress={() => { Haptics.selectionAsync(); onFilm(); }} style={styles.claim} accessibilityRole="button">
          <Text style={styles.claimText}>{T.watch}</Text>
          <Mark kind="play" size={14} width={1.2} color="#ebd5ae" />
        </Pressable>
      ) : null}
      <View style={styles.milestones} accessibilityLabel={T.rewards}>
        {GIFTS.map((g) => {
          const st = stateOf(g), reached = st !== "locked";
          const tint = !reached ? "#71809b" : g === 12 ? "#d8caf6" : "#d7c19b";
          return (
            <View key={g} style={styles.milestone} accessible accessibilityLabel={`${T.milestone(start + g)}, ${T.states[st]}`}>
              <Mark kind={g === 12 ? "play" : "spark"} size={20} width={1.2} color={tint} />
              <Text style={[styles.msTitle, { color: tint }]} numberOfLines={1}>{T.milestone(start + g)}</Text>
              <Text style={[styles.msState, { color: tint }]} numberOfLines={2}>{T.states[st]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* Die Einführung im leeren Fänger (04.10., jetzt mit Blättern): drei
   Schritte, die von selbst weiterlaufen (antippen springt weiter):
   1 · Punkt 1 leuchtet — dort wächst das erste Blatt,
   2 · die Punkte 3, 6, 9 leuchten — dort warten die Geschenke,
   3 · die Mitte leuchtet — voll wird der Fänger zum Film.
   Danach „Verstanden" (Befehl `catcherIntro`). */
function Intro({ steps, cta, W, k, onDone }: { steps: string[]; cta: string; W: number; k: number; onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= steps.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 3600);
    return () => clearTimeout(t);
  }, [step, steps.length]);
  const spots = step === 0 ? [nodeXY(0)] : step === 1 ? [nodeXY(2), nodeXY(5), nodeXY(8)] : [[CX, CY] as const];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {spots.map(([x, y], i) => <Halo key={`${step}-${i}`} x={x * k} y={y * k} size={step === 2 ? 72 : 44} delay={i * 180} />)}
      <Animated.View key={step} entering={FadeIn.duration(300)} style={[styles.introCard, { left: 18, right: 18, top: W * 0.2 }]}>
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
  const reduce = useReducedMotion();
  const v = useSharedValue(reduce ? 0.6 : 0);
  useEffect(() => {
    if (reduce) return;
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(v);
  }, [v, delay, reduce]);
  const a = useAnimatedStyle(() => ({ opacity: 0.25 + 0.6 * v.value, transform: [{ scale: 0.85 + 0.3 * v.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.halo, { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 }, a]} />;
}

/* Langer Druck auf einen gesammelten Punkt: der Film als Kachel, solange
   der Finger liegt (Antons Wunsch 04.10.). */
function PeekTile({ film, img, title, W, H }: { film: string | null; img: string | null; title: string; W: number; H: number }) {
  const player = useVideoPlayer(film, (p) => { p.loop = true; p.muted = true; p.play(); });
  const w = W * 0.5, h = w * 16 / 9;
  return (
    <Animated.View entering={ZoomIn.duration(180)} exiting={FadeOut.duration(140)} pointerEvents="none"
      style={[styles.peek, { width: w, height: h, left: (W - w) / 2, top: (H - h) / 2 }]}>
      {img ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      {film ? <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} /> : null}
      {title ? <View style={styles.peekBar}><Text style={styles.peekTitle} numberOfLines={2}>{title}</Text></View> : null}
    </Animated.View>
  );
}

/* Für die Vorschau (app/dev/moonweave.tsx): ein Ring mit `n` Träumen, ohne echte Daten. */
export function usePreviewCycle(n: number, opts: { ring?: number; unseen?: number | null; gifted?: number; film?: boolean; seen?: number | null }): HomeData["cycle"] {
  return useMemo(() => {
    const ring = opts.ring ?? 1, start = (ring - 1) * 12;
    const count = start + n;
    const slots = Array.from({ length: 12 }, (_, i) => ({
      num: start + i + 1, pos: (i + 1) % 12, dreamId: i < n ? `preview-${start + i + 1}` : null, img: null, film: null,
      title: i < n ? `Dream ${start + i + 1}` : "", stone: null, stoneLine: "", gift: null,
    }));
    return {
      ringNo: ring, next: count + 1, count, todayDone: false, streak: count, slots, threads: [],
      nextGift: null, intro: null, countLine: "", line: "", thread: "", say: "", sayAsleep: "",
      seen: opts.seen === undefined ? count : opts.seen, gifted: opts.gifted ?? count, unseen: opts.unseen ?? null,
      film: n === 12 ? { id: opts.film ? "preview-film" : null } : null,
    };
  }, [n, opts.ring, opts.unseen, opts.gifted, opts.film, opts.seen]);
}

const styles = StyleSheet.create({
  hit: { position: "absolute", width: HIT, height: HIT, alignItems: "center", justifyContent: "center" },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: "center", justifyContent: "center", backgroundColor: "#08101c", borderWidth: 1, borderColor: "rgba(94,108,133,0.33)" },
  dotGot: { backgroundColor: "#24273c", borderColor: "#c0b0dc" },
  dotNext: { backgroundColor: "#24202a", borderColor: "#e1c99c", borderStyle: "dashed" },
  num: { color: "#7c8ba8", fontSize: 11, fontVariant: ["tabular-nums"] },
  numGot: { color: "#eae5fa" },
  numNext: { color: "#eed9b0" },
  ring: { position: "absolute", width: DOT + 10, height: DOT + 10, borderRadius: (DOT + 10) / 2, borderWidth: 2, borderColor: "#e1c99c" },
  ripple: { position: "absolute", width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: "#c5b3ef" },
  glow: { position: "absolute", left: (HIT - GLOW) / 2, top: (HIT - GLOW) / 2, width: GLOW, height: GLOW },
  dotGift: { backgroundColor: "#16131c", borderColor: "rgba(225,201,156,0.55)" },
  dotGiftGot: { backgroundColor: "#2e2733", borderColor: "#e1c99c" },
  dotFilm: { backgroundColor: "#15142a", borderColor: "rgba(216,202,246,0.5)" },
  dotFilmGot: { backgroundColor: "#29263d", borderColor: "#d8caf6" },
  numGift: { color: "#e1c99c" },
  numFilm: { color: "#d8caf6" },
  center: { position: "absolute", width: 68, height: 68, borderRadius: 34 },
  sealHit: { alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 10 },
  sealText: { color: "#efd8ab", fontSize: 10.5, lineHeight: 13, textAlign: "center" },
  countRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 2 },
  countN: { color: "#e4e3fa", fontSize: 27, fontWeight: "400", fontVariant: ["tabular-nums"] },
  countText: { color: "#a9b4c9", fontSize: 12.5 },
  hint: { color: "#b7aed5", fontSize: 13.5, lineHeight: 20, textAlign: "center", marginTop: 6, paddingHorizontal: 18, minHeight: 40 },
  panel: { alignSelf: "stretch", marginTop: 12, paddingVertical: 20, paddingHorizontal: 20, borderRadius: 22, borderWidth: 1, borderColor: "rgba(212,189,137,0.2)", backgroundColor: "rgba(20,24,38,0.55)" },
  panelTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  panelHeading: { color: "#e1c99c", fontSize: 14.5, flexShrink: 1 },
  panelFraction: { marginLeft: "auto", color: "#b4aac7", fontSize: 12.5, fontVariant: ["tabular-nums"] },
  distance: { color: "#e4e3fa", fontSize: 21, lineHeight: 28, letterSpacing: -0.6, marginTop: 14, marginBottom: 18 },
  track: { flexDirection: "row", gap: 5, alignItems: "center" },
  step: { flex: 1, height: 4, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.07)" },
  stepGift: { height: 8 },
  stepOn: { backgroundColor: "#c3b3e7" },
  stepGiftOn: { backgroundColor: "#e1c99c" },
  event: { color: "#c2b5ce", fontSize: 12.5, lineHeight: 19, marginTop: 15 },
  claim: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 14, marginTop: 14, minHeight: 44, paddingHorizontal: 18, borderRadius: 24, borderWidth: 1, borderColor: "rgba(215,193,155,0.44)" },
  claimText: { color: "#ebd5ae", fontSize: 14.5 },
  // auf dem Telefon als vier schmale Spalten — nebeneinander brach „6 dreams" um (Test 10.10.)
  milestones: { flexDirection: "row", gap: 6, marginTop: 20 },
  milestone: { flex: 1, alignItems: "center", gap: 4 },
  msTitle: { fontSize: 12, textAlign: "center" },
  msState: { fontSize: 10, lineHeight: 13, textAlign: "center" },
  introCard: { position: "absolute", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, backgroundColor: "rgba(12,16,30,0.94)", borderWidth: 1, borderColor: "rgba(225,201,156,0.4)" },
  introText: { color: "#e4e3fa", fontSize: 15, lineHeight: 21, textAlign: "center" },
  introDots: { flexDirection: "row", gap: 6 },
  introDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(228,227,250,0.3)" },
  introDotOn: { backgroundColor: "#e1c99c", width: 16 },
  introCta: { color: "#e1c99c", fontSize: 15, fontWeight: "700" },
  halo: { position: "absolute", borderWidth: 2, borderColor: "#e1c99c", backgroundColor: "rgba(225,201,156,0.12)" },
  peek: { position: "absolute", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#c0b0dc", backgroundColor: colors.bg2, zIndex: 20 },
  peekBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "rgba(5,10,20,0.72)" },
  peekTitle: { color: colors.text, fontFamily: fonts.serif, fontSize: 15, lineHeight: 19 },
});
