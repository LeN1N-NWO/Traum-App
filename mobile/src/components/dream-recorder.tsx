import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { GlassButton, PrimaryButton } from "@/components/glass";
import { MascotLoader } from "@/components/mascot-loader";
import { holdForRecording } from "@/lib/sound-engine";
import { setRecording } from "@/store/recording-store";
import { colors, fonts } from "@/theme";

/* Der Rekorder als ERSTE Ansicht des Traum-Tabs (Antons Ansage 13.09.2026):
 *
 *   „Wir klicken auf ‚Neuer Traum'. Es erscheint sofort das Feld, wo wir
 *   recorden können. Nachdem wir recorded haben, können wir unser Recording
 *   anhören. Erst dann Transkribieren … so wenige Klicks wie möglich."
 *
 * Seit 26.09.: öffnen zeigt das Mikrofon, erst ein Tipp nimmt auf (autoStartKey
 * nur noch für „Weiter erzählen"); ein Tipp = fertig, dann
 * die Aufnahme zum Anhören, EIN Knopf „Aufschreiben". Wer lieber tippt,
 * kommt von jeder Phase aus mit „Lieber schreiben" ins Textfeld.
 *
 * Die Aufnahme wird gleich nach dem Stopp gesichert (/api/panel) — Antons
 * Ansage 12.09.: „selbst wenn das nicht durchgeht, muss die Aufnahme
 * gespeichert werden". Transkribiert wird erst auf Knopfdruck.
 *
 * Aus voice.tsx übernommen (dort gemessen, nicht geraten): alle Player
 * vorher stumm (recording-store, expo-video stiehlt sonst die Session), der
 * Blob braucht ausdrücklich audio/mp4, die Dauer kommt aus dem Rekorder
 * selbst statt aus dem gepollten Zustand. */
type Phase = "idle" | "rec" | "review" | "busy" | "error";
type Labels = Record<string, any>;

export function DreamRecorder({ W, language, autoStartKey, active, onText, onType, onPendingAudio }: {
  W: Labels | undefined;
  language: string;
  autoStartKey: number;            // ändert sich → Aufnahme startet (wenn nichts läuft)
  active: boolean;                 // Tab verlassen während der Aufnahme → anhalten, nicht wegwerfen
  onText: (text: string, audioUrl: string | null) => void;
  onType: () => void;
  onPendingAudio: (audioUrl: string) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const st = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null);
  const ps = useAudioPlayerStatus(player);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [say, setSay] = useState(0);
  // Die Sprechblase wechselt alle paar Sekunden, solange nachgehört wird.
  useEffect(() => {
    if (phase !== "review") return;
    const t = setInterval(() => setSay((n) => n + 1), 4200);
    return () => clearInterval(t);
  }, [phase]);
  const uri = useRef<string | null>(null);
  const audioUrl = useRef<string | null>(null);
  const lastKey = useRef(0);
  const cancelled = useRef(false);

  useEffect(() => {
    (async () => {
      const p = await requestRecordingPermissionsAsync();
      setAllowed(p.granted);
      if (!p.granted) { setError(W?.recordFailed ?? "No microphone."); setPhase("error"); }
    })();
    return () => { setRecording(false); holdForRecording(false); setAudioModeAsync({ allowsRecording: false }).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Öffnen heißt aufnehmen — aber nur, wenn gerade nichts anderes läuft.
  useEffect(() => {
    if (!allowed || !W || autoStartKey === lastKey.current) return;
    lastKey.current = autoStartKey;
    if (phase === "idle") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartKey, allowed, W]);

  // Tab gewechselt, während aufgenommen wird: anhalten und zum Anhören.
  useEffect(() => {
    if (!active && phase === "rec") stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const starting = useRef(false);
  async function start() {
    // Zwei Anstöße im selben Moment (Fokus + Knopf) dürfen nicht zweimal vorbereiten.
    if (starting.current || recorder.getStatus().isRecording) return;
    starting.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelled.current = false;
    setError(null);
    try { player.pause(); } catch {}
    try {
      setRecording(true); holdForRecording(true);
      await new Promise((r) => setTimeout(r, 250));
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, interruptionMode: "doNotMix", shouldPlayInBackground: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase("rec");
    } catch (e) {
      console.warn("[recorder] start", e);
      setRecording(false); holdForRecording(false);
      setError(W?.recordFailed ?? "Failed"); setPhase("error");
    } finally {
      starting.current = false;
    }
  }

  async function stop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const before = recorder.getStatus();
    try { await recorder.stop(); } catch {}
    setRecording(false); holdForRecording(false);
    const u = recorder.uri;
    if (!u || before.durationMillis < 1500) { setError(W?.recordTooShort ?? "Too short."); setPhase("error"); return; }
    uri.current = u;
    audioUrl.current = null;
    // Wiedergabe über den Lautsprecher: mit allowsRecording spielt iOS leise übers Ohr.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    player.replace({ uri: u });
    setPhase("review");
    upload(u);
  }

  async function upload(u: string) {
    try {
      const raw = await (await fetch(u)).blob();
      const blob = new Blob([raw], { type: "audio/mp4" });
      const up = await fetch(W!.panelUrl, { method: "POST", headers: { "content-type": "audio/mp4" }, body: blob });
      const out = await up.json().catch(() => null);
      if (up.ok && typeof out?.url === "string" && uri.current === u) { audioUrl.current = out.url; onPendingAudio(out.url); }
    } catch (e) { console.warn("[recorder] upload", e); }
  }

  async function transcribe() {
    if (!uri.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { player.pause(); } catch {}
    cancelled.current = false;
    setPhase("busy");
    try {
      const b64 = await new File(uri.current).base64();
      const res = await fetch(W!.transcribeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio: `data:audio/mp4;base64,${b64}`, language }) });
      const out = await res.json().catch(() => null);
      if (cancelled.current) return;
      const text = String(out?.text || "").trim();
      if (!res.ok || text.length < 8) { setError(text.length < 8 && res.ok ? (W?.recordTooShort ?? "Too short.") : (out?.error || W?.recordFailed || "Failed")); setPhase("error"); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const url = audioUrl.current;
      reset();
      onText(text, url);
    } catch (e) {
      console.warn("[recorder] transcribe", e);
      setError(W?.recordFailed ?? "Failed"); setPhase("error");
    }
  }

  function reset() { uri.current = null; audioUrl.current = null; setError(null); setPhase("idle"); }

  async function discard() {
    cancelled.current = true;
    try { if (recorder.getStatus().isRecording) await recorder.stop(); } catch {}
    try { player.pause(); } catch {}
    setRecording(false); holdForRecording(false);
    reset();
  }

  async function typeInstead() {
    await discard();
    onType();
  }

  function togglePlay() {
    Haptics.selectionAsync();
    if (ps.playing) { player.pause(); return; }
    if (ps.didJustFinish || (ps.duration > 0 && ps.currentTime >= ps.duration - 0.05)) player.seekTo(0);
    player.play();
  }

  const secs = Math.floor((st.durationMillis || 0) / 1000);
  const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const progress = ps.duration > 0 ? Math.min(1, ps.currentTime / ps.duration) : 0;

  if (phase === "busy") {
    return (
      <View style={styles.center}>
        <MascotLoader />
        <Text style={styles.title}>{W?.recordTranscribing ?? "Writing it down…"}</Text>
        <GlassButton label={W?.cancel ?? "Cancel"} onPress={() => { cancelled.current = true; setPhase("review"); }} style={{ flex: 0, marginTop: 16 }} />
      </View>
    );
  }

  if (phase === "review") {
    /* Antons Ansage 26.09.: oben das Maskottchen mit Sprechblase, darunter
       ein klarer „Anhören"-Knopf, dann „Aufschreiben" mit Leuchtrand. */
    const lines = W?.mascotReview?.length ? W.mascotReview : [W?.reviewHint ?? ""];
    return (
      <View style={styles.center}>
        <View style={styles.mascotRow}>
          <MascotLoader size={120} />
          <Animated.View key={say % lines.length} entering={FadeIn.duration(400)} style={styles.bubble}>
            <Text style={styles.bubbleText}>{lines[say % lines.length]}</Text>
            <View style={styles.bubbleTail} />
          </Animated.View>
        </View>
        <Pressable onPress={togglePlay} style={({ pressed }) => [styles.listen, pressed && { transform: [{ scale: 0.98 }] }]}
          accessibilityRole="button" accessibilityLabel={ps.playing ? (W?.recordPause ?? "Pause") : (W?.recordListen ?? "Listen back")}>
          <View style={styles.play}><SymbolView name={ps.playing ? "pause.fill" : "play.fill"} size={24} tintColor={colors.bg} /></View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={styles.listenLabel}>{ps.playing ? (W?.recordPause ?? "Pause") : (W?.recordListen ?? "Listen back")}</Text>
            <View style={styles.track}><View style={[styles.trackFill, { width: `${progress * 100}%` }]} /></View>
          </View>
          <Text style={styles.time}>{clock(ps.currentTime || 0)} / {clock(ps.duration || 0)}</Text>
        </Pressable>
        <PrimaryButton label={`✎ ${W?.recordTranscribe ?? "Write it down"}`} heavy onPress={transcribe} style={{ flex: 0, alignSelf: "stretch", marginTop: 8 }} />
        <View style={styles.row}>
          <GlassButton label={W?.recordRetake ?? W?.recordAgain ?? "Record again"} onPress={async () => { await discard(); start(); }} />
          <GlassButton label={W?.typeInstead ?? "Type instead"} onPress={typeInstead} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{phase === "rec" ? (W?.recording ?? "Listening…") : (W?.record ?? "Tell it out loud")}</Text>
      <Text style={styles.hint}>{phase === "rec" ? clock(secs) : (W?.recordHint ?? "")}</Text>
      <View style={styles.stage}>
        <Ring on={phase === "rec"} />
        <Pressable onPress={phase === "rec" ? stop : start} disabled={allowed === false} accessibilityRole="button" accessibilityLabel={phase === "rec" ? (W?.recordStop ?? "Done") : (W?.record ?? "Record")}>
          <View style={[styles.mic, phase === "rec" && styles.micOn, allowed === false && { opacity: 0.4 }]}>
            <SymbolView name={phase === "rec" ? "stop.fill" : "mic.fill"} size={40} tintColor={colors.bg} />
          </View>
        </Pressable>
      </View>
      {phase === "rec" ? <Text style={styles.stopHint}>{W?.recordStop ?? "Done"}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {/* Aufschreiben ging schief, die Aufnahme ist noch da: noch einmal versuchen. */}
      {phase === "error" && uri.current ? <PrimaryButton label={`✎ ${W?.recordTranscribe ?? "Write it down"}`} onPress={transcribe} style={{ flex: 0, alignSelf: "stretch" }} /> : null}
      <View style={styles.row}>
        {phase === "rec" ? <GlassButton label={W?.recordDiscard ?? "Discard"} onPress={discard} /> : null}
        <GlassButton label={W?.typeInstead ?? "Type instead"} onPress={typeInstead} />
      </View>
    </View>
  );
}

/* Zwei Ringe, die nach außen atmen, solange aufgenommen wird. */
function Ring({ on }: { on: boolean }) {
  const a = useSharedValue(0);
  useEffect(() => { a.value = on ? withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false) : withTiming(0, { duration: 300 }); }, [on, a]);
  const s1 = useAnimatedStyle(() => ({ transform: [{ scale: 1 + a.value * 0.9 }], opacity: (1 - a.value) * 0.5 }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scale: 1 + ((a.value + 0.5) % 1) * 0.9 }], opacity: (1 - ((a.value + 0.5) % 1)) * 0.5 }));
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.ring, s1]} />
      <Animated.View pointerEvents="none" style={[styles.ring, s2]} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 24 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, textAlign: "center" },
  hint: { color: colors.muted, fontSize: 16, textAlign: "center", fontVariant: ["tabular-nums"], lineHeight: 22 },
  stage: { width: 240, height: 240, alignItems: "center", justifyContent: "center", marginVertical: 12 },
  ring: { position: "absolute", width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: colors.warm },
  mic: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.warm, alignItems: "center", justifyContent: "center", shadowColor: colors.warm, shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  micOn: { backgroundColor: colors.gold },
  stopHint: { color: colors.faint, fontSize: 13 },
  error: { color: colors.warm, fontSize: 14, textAlign: "center" },
  row: { flexDirection: "row", gap: 10, alignSelf: "stretch", marginTop: 6 },
  mascotRow: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", gap: 4 },
  bubble: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  bubbleTail: { position: "absolute", left: -6, top: 22, width: 12, height: 12, backgroundColor: colors.panel, transform: [{ rotate: "45deg" }], borderLeftWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  listen: { flexDirection: "row", alignItems: "center", gap: 14, alignSelf: "stretch", padding: 14, borderRadius: 22, backgroundColor: "rgba(242,167,101,0.10)", borderWidth: 1, borderColor: "rgba(242,167,101,0.45)", marginTop: 6 },
  listenLabel: { color: colors.text, fontSize: 17, fontWeight: "700" },
  playerCard: { flexDirection: "row", alignItems: "center", gap: 14, alignSelf: "stretch", padding: 16, borderRadius: 22, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, marginTop: 14 },
  play: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.warm, alignItems: "center", justifyContent: "center" },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.panelLine, overflow: "hidden" },
  trackFill: { height: 4, backgroundColor: colors.warm },
  time: { color: colors.muted, fontSize: 13, fontVariant: ["tabular-nums"] },
});
