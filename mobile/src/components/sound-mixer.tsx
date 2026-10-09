import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedProps, useFrameCallback, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Glass } from "@/components/glass";
import { getVolumes, IDS, setVolume, startTimer, subscribe, type SoundId } from "@/lib/sound-engine";
import { useScreenActive } from "@/lib/use-screen-active";
import type { SoundsData } from "@/store/journal-store";
import { colors } from "@/theme";

/* Das Mischpult — seit 09.10. im Bild der Website (Antons Wahl; Vorlage
 * DreamRushes-Landingpage/site/handoff/noise-mixer-for-claude): EIN
 * dunkles Feld, darin eine ruhige Welle aus 23 feinen Stäben, darunter
 * drei schmale waagerechte Regler, oben rechts der Timer als Pille.
 * Vorher standen hier drei senkrechte Fader — die stritten mit dem
 * Scrollen der Seite und ließen sich kaum schieben.
 *
 * Die Welle zeigt die QUELLEN, keine Frequenzbänder: links Weiß, Mitte
 * Rosa, rechts Braun, weich ineinander. Jede Region wächst mit IHREM
 * Regler (gemessen wird nichts — die Höhe kommt aus der eingestellten
 * Lautstärke, dazu eine leise, gleichmäßige Eigenbewegung: Weiß fein und
 * etwas schneller, Rosa fließend, Braun breit und langsam). Ist alles
 * aus, liegt eine blasse, stille Grundlinie da.
 *
 * Klang, Mischung, Timer und Autostart unverändert: lib/sound-engine.ts,
 * gesichert über die Brücke (soundMix). */
const TIMER_CHOICES = [0, 15, 30, 60];
const N = 23;
/* Die Grundform der Stäbe — dieselbe Formel wie auf der Website. */
const SHAPE = Array.from({ length: N }, (_, i) => 13 + Math.sin(i * 1.7) ** 2 * 53 + Math.sin(i * 0.4) ** 2 * 24);
const REGION = [1 / 6, 1 / 2, 5 / 6];                  // Mitte von Weiß, Rosa, Braun
const SPEED: [number, number][] = [[2.4, 3.9], [1.5, 2.3], [0.8, 1.25]];
const WAVE_H = 150, MIN_H = 3;

const FPS = 30;                                         // langsame Bewegung — mehr Bilder braucht sie nicht
const AnimatedPath = Animated.createAnimatedComponent(Path);
const TINT: Record<SoundId, string> = { white: "#9ac9f7", pink: "#b5a3de", brown: "#c6a293" };

export function SoundMixer({ S, onSave }: { S: SoundsData; onSave: (mix: { volumes: Record<string, number>; timer: number; autoStart: boolean }) => void }) {
  const saved = S.mix ?? { volumes: {}, timer: 0, autoStart: false };
  const [vols, setVols] = useState<Record<SoundId, number>>(() => {
    const live = getVolumes();
    // Nichts an, aber eine Mischung gespeichert? Dann stehen die Regler dort — wie im Web (state.soundMix).
    return IDS.some((id) => live[id] > 0) ? live : { white: 0, pink: 0, brown: 0 };
  });
  const [timer, setTimer] = useState<number>(saved.timer || 0);
  const [auto, setAuto] = useState<boolean>(!!saved.autoStart);
  const volsRef = useRef(vols);
  useEffect(() => { volsRef.current = vols; }, [vols]);
  useEffect(() => subscribe(() => setVols(getVolumes())), []);

  /* Was die Welle zeigt: die wirklich eingestellte Lautstärke je Quelle,
     kurz geglättet (150 ms) — sofort, aber ohne Ruck. */
  const lw = useSharedValue(vols.white), lp = useSharedValue(vols.pink), lb = useSharedValue(vols.brown);
  useEffect(() => {
    lw.value = withTiming(vols.white, { duration: 150 });
    lp.value = withTiming(vols.pink, { duration: 150 });
    lb.value = withTiming(vols.brown, { duration: 150 });
  }, [vols, lw, lp, lb]);

  /* Eine Uhr für die Eigenbewegung — nur, solange etwas klingt und das
     Feld zu sehen ist, und höchstens 30-mal je Sekunde weitergestellt
     (10.10.: 23 Stäbe in jedem Bild belasteten den Hauptthread, auf dem
     auch das Audio seine Schleifen weiterschaltet). */
  const t = useSharedValue(0);
  const acc = useSharedValue(0);
  const clock = useFrameCallback((f) => {
    acc.value += Math.min(0.1, (f.timeSincePreviousFrame ?? 16) / 1000);
    if (acc.value < 1 / FPS) return;
    t.value = (t.value + acc.value) % 3600;
    acc.value = 0;
  }, false);
  const reduce = useReducedMotion();
  const visible = useScreenActive();
  const playing = IDS.some((id) => vols[id] > 0);
  useEffect(() => { clock.setActive(visible && playing && !reduce); }, [visible, playing, reduce, clock]);

  function change(id: SoundId, v: number, final: boolean) {
    setVolume(id, v);
    const next = { ...volsRef.current, [id]: v };
    setVols(next);
    if (final) {
      onSave({ volumes: next, timer, autoStart: auto });
      // Der Timer zählt ab der letzten Berührung (SleepScreen.jsx).
      if (timer) startTimer(timer);
    }
  }
  /* Die Pille schaltet weiter: Aus → 15 → 30 → 60 → Aus. */
  function nextTimer() {
    Haptics.selectionAsync();
    const m = TIMER_CHOICES[(TIMER_CHOICES.indexOf(timer) + 1) % TIMER_CHOICES.length];
    startTimer(m); setTimer(m);
    onSave({ volumes: volsRef.current, timer: m, autoStart: auto });
  }
  function toggleAuto(v: boolean) {
    Haptics.selectionAsync();
    setAuto(v);
    onSave({ volumes: volsRef.current, timer, autoStart: v });
  }

  const [w, setW] = useState(0);
  const inner = Math.max(0, w - 36);
  const step = inner / N, barW = Math.max(3, Math.min(5, step * 0.36));

  /* Die ganze Welle ist EIN Pfad: je Stab ein Strich mit runden Enden.
     Höhe aus den drei Quellen, gewichtet nach Nähe zu ihrer Region, mal
     Grundform, mal leise Eigenbewegung (.65 … 1, feste Phasen je Stab). */
  const geo = useMemo(() => SHAPE.map((sh, i) => {
    const pos = (i + 0.5) / N;
    return { x: (i + 0.5) * step, shape: 0.45 + 0.55 * (sh - 13) / 77, w: REGION.map((c) => Math.exp(-(((pos - c) / 0.13) ** 2))) };
  }), [step]);
  const wave = useAnimatedProps(() => {
   /* Eine Zierwelle darf die App nie beenden (10.10.: ein Fehler in dieser
      Funktion auf dem UI-Thread hat sie abstürzen lassen) — im Zweifel die
      stille Grundlinie. */
   try {
    const lv = [lw.value, lp.value, lb.value];
    const resp = lv.map((v) => 1 - (1 - v) * (1 - v));   // 0 → 0, 1 → 1, unten etwas großzügiger
    const max = WAVE_H - 10, mid = WAVE_H / 2;
    let d = "";
    for (let i = 0; i < geo.length; i++) {
      const g = geo[i];
      let amp = 0;
      for (let s = 0; s < 3; s++) {
        // kein Array-Zerlegen im Worklet — Babel macht daraus eine Hilfsfunktion, die es auf dem UI-Thread nicht gibt (Absturz 10.10.)
        const a = SPEED[s][0], b = SPEED[s][1];
        const move = reduce ? 0.85 : 0.65 + 0.35 * (0.5 + 0.5 * (0.6 * Math.sin(a * t.value + i * 1.7 + s) + 0.4 * Math.sin(b * t.value + i * 0.9 + 2 * s)));
        amp += g.w[s] * resp[s] * move;
      }
      const h = Math.max(0.01, (MIN_H + (max - MIN_H) * Math.min(1, amp) * g.shape) - barW);
      d += `M${g.x.toFixed(1)} ${(mid - h / 2).toFixed(1)}L${g.x.toFixed(1)} ${(mid + h / 2).toFixed(1)}`;
    }
    return { d, strokeOpacity: 0.3 + 0.7 * Math.max(resp[0], resp[1], resp[2]) };
   } catch { return { d: "", strokeOpacity: 0.3 }; }
  }, [geo, barW, reduce]);
  const timerText = timer ? S.timerMin[timer] : S.timerOff;
  const short = S.short ?? { white: "White", pink: "Pink", brown: "Brown" };

  return (
    <View style={styles.wrap}>
      <Text style={styles.lede}>{S.lede}</Text>
      <View style={styles.panel} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
        {/* die Welle */}
        <View style={[styles.wave, { width: inner }]} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
          <View style={styles.baseline} />
          {inner > 0 ? (
            <Svg width={inner} height={WAVE_H}>
              <Defs>
                {/* quer über die Welle: Cyan → Lavendel → warmes Braun */}
                <LinearGradient id="mx-wave" x1="0" y1="0" x2={inner} y2="0" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#9ac9f7" />
                  <Stop offset="0.55" stopColor="#b5a3de" />
                  <Stop offset="1" stopColor="#c6a293" />
                </LinearGradient>
              </Defs>
              <AnimatedPath animatedProps={wave} stroke="url(#mx-wave)" strokeWidth={barW} strokeLinecap="round" fill="none" />
            </Svg>
          ) : null}
        </View>
        {/* die drei Regler, je unter ihrer Region */}
        <View style={[styles.controls, { width: inner }]}>
          {IDS.map((id) => (
            <Level key={id} id={id} value={vols[id]} label={short[id]} name={S.names[id]} hint={S.descs[id]} off={S.timerOff}
              onChange={(v, final) => change(id, v, final)} />
          ))}
        </View>
        {/* der Timer als Pille, oben rechts auf der Kante */}
        <Pressable onPress={nextTimer} style={styles.pill} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${S.timer}: ${timerText}`}>
          <SymbolView name="clock" size={13} tintColor="#29263d" />
          <Text style={styles.pillText} maxFontSizeMultiplier={1.4}>{timerText}</Text>
        </Pressable>
      </View>

      <Glass style={styles.auto}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.autoText}>{S.autoStart}</Text>
          <Text style={styles.autoHint}>{S.background}</Text>
        </View>
        <Switch value={auto} onValueChange={toggleAuto} trackColor={{ true: colors.accent }} />
      </Glass>
    </View>
  );
}

/* Ein Regler: schmale Spur, heller Knopf, Fläche in der Farbe der Quelle.
   Waagerecht, damit er nicht mit dem Scrollen streitet; Ziehen und Tippen
   setzen den Wert, alle zehn Prozent ein Tick. Beim Ziehen steht die Zahl
   neben dem Namen, sonst nur der Name. VoiceOver: einstellbar ± 10 %. */
function Level({ id, value, label, name, hint, off, onChange }: { id: SoundId; value: number; label: string; name: string; hint: string; off: string; onChange: (v: number, final: boolean) => void }) {
  const [tw, setTw] = useState(0);
  const [drag, setDrag] = useState(false);
  const lastTick = useRef(Math.round(value * 10));
  const KNOB = 16;
  const set = (x: number, final: boolean) => {
    const v = Math.max(0, Math.min(1, (x - KNOB / 2) / Math.max(1, tw - KNOB)));
    const tick = Math.round(v * 10);
    if (tick !== lastTick.current) { lastTick.current = tick; Haptics.selectionAsync(); }
    onChange(Math.round(v * 100) / 100, final);
  };
  // waagerecht erst ab 4 pt — senkrechtes Wischen bleibt Scrollen der Seite
  const pan = Gesture.Pan().runOnJS(true).activeOffsetX([-4, 4]).failOffsetY([-14, 14])
    .onStart((e) => { setDrag(true); set(e.x, false); })
    .onUpdate((e) => set(e.x, false))
    .onEnd((e) => set(e.x, true))
    .onFinalize(() => setDrag(false));
  const tap = Gesture.Tap().runOnJS(true).onEnd((e) => set(e.x, true));
  const pct = Math.round(value * 100);
  const step = (d: number) => { Haptics.selectionAsync(); onChange(Math.max(0, Math.min(1, Math.round((value + d) * 10) / 10)), true); };
  return (
    <View style={styles.level}
      accessible accessibilityRole="adjustable" accessibilityLabel={name} accessibilityHint={hint}
      accessibilityValue={{ min: 0, max: 100, now: pct, text: pct === 0 ? off : `${pct} %` }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 0.1 : -0.1)}>
      <Text style={[styles.label, pct === 0 && styles.labelOff]} maxFontSizeMultiplier={1.4} numberOfLines={1} adjustsFontSizeToFit>
        {label}{drag ? <Text style={styles.labelVal}>{`  ${pct === 0 ? off : `${pct} %`}`}</Text> : null}
      </Text>
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View style={styles.track} onLayout={(e: LayoutChangeEvent) => setTw(e.nativeEvent.layout.width)}>
          <View style={styles.rail} />
          <View style={[styles.railFill, { width: KNOB / 2 + value * (tw - KNOB), backgroundColor: TINT[id] }]} />
          <View style={[styles.knob, { left: value * (tw - KNOB), width: KNOB, height: KNOB, borderRadius: KNOB / 2 }, pct === 0 && styles.knobOff]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  panel: { marginTop: 14, borderRadius: 28, backgroundColor: "#131d2f", borderWidth: 1, borderColor: "rgba(101,121,153,0.2)", paddingTop: 30, paddingBottom: 12, alignItems: "center" },
  wave: { height: WAVE_H },
  baseline: { position: "absolute", left: 0, right: 0, top: WAVE_H / 2, height: 1, backgroundColor: "rgba(142,156,182,0.14)" },
  controls: { flexDirection: "row", marginTop: 6 },
  level: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  label: { color: "#b5c3d9", fontSize: 13, fontWeight: "500" },
  labelOff: { color: "#6f7c93" },
  labelVal: { color: "#e1def6", fontVariant: ["tabular-nums"] },
  track: { alignSelf: "stretch", height: 44, justifyContent: "center" },
  rail: { position: "absolute", left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: "#47516a" },
  railFill: { position: "absolute", left: 0, height: 2, borderRadius: 1, opacity: 0.75 },
  knob: { position: "absolute", backgroundColor: "#c6c0df", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  knobOff: { backgroundColor: "#8b86a6" },
  pill: { position: "absolute", top: -16, right: 16, flexDirection: "row", alignItems: "center", gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 16, backgroundColor: "#c8c1ee" },
  pillText: { color: "#29263d", fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
  auto: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 20 },
  autoText: { color: colors.text, fontSize: 15 },
  autoHint: { color: colors.faint, fontSize: 12, lineHeight: 17 },
});
