import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { GlassButton, PrimaryButton } from "@/components/glass";
import { MascotLoader } from "@/components/mascot-loader";
import { MoonButton } from "@/components/moon-button";
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
type Phase = "idle" | "rec" | "busy" | "error";
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
  // Mit Pegel (26.09.): die Glühwürmchen am Mond-Knopf tanzen zur Stimme.
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const st = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
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
    upload(u);
    /* Seit 26.09. abends (Antons Ansage: „Stopp heißt: gleich weiter, die
       nächste Seite fällt weg"): kein Anhören-Zwischenschritt mehr — nach
       dem Stopp wird sofort aufgeschrieben, und der Traum-Bildschirm lässt
       ihn danach direkt von der KI lesen. Die Aufnahme hängt am Traum. */
    transcribe();
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
    setRecording(false); holdForRecording(false);
    reset();
  }

  async function typeInstead() {
    await discard();
    onType();
  }


  /* Der Pegel in dB (−160…0) → 0…1; leise Räume beginnen um −55 dB. */
  const level = useSharedValue(0);
  useEffect(() => {
    const db = typeof st.metering === "number" ? st.metering : -160;
    level.value = withTiming(phase === "rec" ? Math.max(0, Math.min(1, (db + 55) / 45)) : 0, { duration: 140 });
  }, [st.metering, phase, level]);

  const secs = Math.floor((st.durationMillis || 0) / 1000);
  const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (phase === "busy") {
    return (
      <View style={styles.center}>
        <MascotLoader />
        <Text style={styles.title}>{W?.recordTranscribing ?? "Writing it down…"}</Text>
        <GlassButton label={W?.cancel ?? "Cancel"} onPress={discard} style={{ flex: 0, marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{phase === "rec" ? (W?.recording ?? "Listening…") : (W?.record ?? "Tell it out loud")}</Text>
      <Text style={styles.hint}>{phase === "rec" ? clock(secs) : (W?.recordHint ?? "")}</Text>
      {/* Der Mond ist der Knopf (Antons Wahl 26.09.). */}
      <View style={styles.stage}>
        <MoonButton size={150} recording={phase === "rec"} level={level} onPress={phase === "rec" ? stop : start} disabled={allowed === false}
          label={phase === "rec" ? (W?.recordStop ?? "Done") : (W?.record ?? "Record")} />
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

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 24 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, textAlign: "center" },
  hint: { color: colors.muted, fontSize: 16, textAlign: "center", fontVariant: ["tabular-nums"], lineHeight: 22 },
  stage: { width: 345, height: 345, alignItems: "center", justifyContent: "center", marginVertical: -40 },
  stopHint: { color: colors.faint, fontSize: 13 },
  error: { color: colors.warm, fontSize: 14, textAlign: "center" },
  row: { flexDirection: "row", gap: 10, alignSelf: "stretch", marginTop: 6 },
});
