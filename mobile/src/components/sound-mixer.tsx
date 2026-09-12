import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { Glass } from "@/components/glass";
import { getVolumes, IDS, setVolume, startTimer, subscribe, type SoundId } from "@/lib/sound-engine";
import type { SoundsData } from "@/store/journal-store";
import { colors } from "@/theme";

/* Das Mischpult, nativ — SoundMixerPanel aus SleepScreen.jsx im Aufbau:
   drei stehende Fader (Antons Wahl 26.08.), darunter der Einschlaf-Timer
   als eine Zeile, darunter der Autostart. Nativ ist das Material: Fader aus
   Glas mit der Farbe ihres Rauschens, Haptik alle zehn Prozent, ein echter
   Schalter. Klang und Mischung leben in lib/sound-engine.ts, die Mischung
   wird über die Brücke im Web-Zustand gesichert (soundMix). */
const TIMER_CHOICES = [0, 15, 30, 60];
const TINTS: Record<SoundId, string> = { white: colors.text, pink: "#f0a3c4", brown: colors.warm };

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
  function pickTimer(m: number) {
    Haptics.selectionAsync();
    startTimer(m); setTimer(m);
    onSave({ volumes: volsRef.current, timer: m, autoStart: auto });
  }
  function toggleAuto(v: boolean) {
    Haptics.selectionAsync();
    setAuto(v);
    onSave({ volumes: volsRef.current, timer, autoStart: v });
  }

  return (
    <GestureHandlerRootView style={styles.wrap}>
      <Text style={styles.lede}>{S.lede}</Text>
      <Glass style={styles.desk}>
        {IDS.map((id) => (
          <Fader key={id} id={id} value={vols[id]} name={S.names[id]} desc={S.descs[id]} tint={TINTS[id]} onChange={(v, final) => change(id, v, final)} />
        ))}
      </Glass>

      <View style={styles.timer}>
        <Text style={styles.timerLabel}>{S.timer}</Text>
        <Glass style={styles.timerRow}>
          {TIMER_CHOICES.map((m) => (
            <Pressable key={m} onPress={() => pickTimer(m)} style={[styles.timerBtn, timer === m && styles.timerOn]}>
              <Text style={[styles.timerText, timer === m && styles.timerTextOn]}>{m === 0 ? S.timerOff : S.timerMin[m]}</Text>
            </Pressable>
          ))}
        </Glass>
      </View>

      <Glass style={styles.auto}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.autoText}>{S.autoStart}</Text>
          <Text style={styles.autoHint}>{S.background}</Text>
        </View>
        <Switch value={auto} onValueChange={toggleAuto} trackColor={{ true: colors.accent }} />
      </Glass>
    </GestureHandlerRootView>
  );
}

/* Ein stehender Fader: Glas-Schlitz, Füllung in der Rauschfarbe, Zahl und
   Name darunter. Ziehen setzt den Wert direkt; alle zehn Prozent ein Tick. */
function Fader({ id, value, name, desc, tint, onChange }: { id: SoundId; value: number; name: string; desc: string; tint: string; onChange: (v: number, final: boolean) => void }) {
  const height = useRef(200);
  const [h, setH] = useState(200);
  const lastTick = useRef(Math.round(value * 10));
  const set = (y: number, final: boolean) => {
    const v = Math.max(0, Math.min(1, 1 - y / height.current));
    const tick = Math.round(v * 10);
    if (tick !== lastTick.current) { lastTick.current = tick; Haptics.selectionAsync(); }
    onChange(Math.round(v * 100) / 100, final);
  };
  // runOnJS(true): die Rückrufe laufen im JS-Thread, kein Worklet nötig.
  const pan = Gesture.Pan().minDistance(0).runOnJS(true)
    .onBegin((e) => set(e.y, false))
    .onUpdate((e) => set(e.y, false))
    .onFinalize((e) => set(e.y, true));
  return (
    <View style={styles.fader} accessibilityLabel={`${name} — ${desc}`}>
      <GestureDetector gesture={pan}>
        <View style={styles.slot} onLayout={(e: LayoutChangeEvent) => { height.current = e.nativeEvent.layout.height; setH(e.nativeEvent.layout.height); }}>
          <View style={[styles.fill, { height: `${Math.round(value * 100)}%`, backgroundColor: tint }]} />
          <View style={[styles.knob, { bottom: 6 + value * (h - 22) }]} />
        </View>
      </GestureDetector>
      <Text style={[styles.val, { color: tint }]}>{Math.round(value * 100)}</Text>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  desk: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 22, paddingHorizontal: 12, borderRadius: 26 },
  fader: { alignItems: "center", gap: 8, width: 84 },
  slot: { width: 44, height: 200, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden", justifyContent: "flex-end", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  fill: { width: "100%", opacity: 0.55, borderRadius: 22 },
  knob: { position: "absolute", left: 6, right: 6, height: 10, borderRadius: 5, backgroundColor: colors.text, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  val: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] },
  name: { color: colors.muted, fontSize: 12, textAlign: "center" },
  timer: { gap: 8 },
  timerLabel: { color: colors.faint, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase", marginLeft: 4 },
  timerRow: { flexDirection: "row", padding: 4, borderRadius: 999 },
  timerBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  timerOn: { backgroundColor: "rgba(255,255,255,0.14)" },
  timerText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  timerTextOn: { color: colors.text },
  auto: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 20 },
  autoText: { color: colors.text, fontSize: 15 },
  autoHint: { color: colors.faint, fontSize: 12, lineHeight: 17 },
});
