import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { GlassButton, PrimaryButton } from "@/components/glass";
import { BlurInText } from "@/components/blur-in-text";
import { MascotLoader } from "@/components/mascot-loader";
import { PortalButton } from "@/components/portal-button";
import { dropRecording, sweepRecordings } from "@/lib/recordings";
import { noteSpeech } from "@/lib/speech-timing";
import { showToast } from "@/store/toast-store";
import { prepareOnDeviceSpeech, transcribeOnDevice } from "../../modules/dream-sketch";
import { holdForRecording } from "@/lib/sound-engine";
import { setRecording } from "@/store/recording-store";
import { colors, fonts } from "@/theme";
import { fetchWithSession, useBridgeAccount } from "@/lib/auth";

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
const MEASURE = __DEV__ || process.env.EXPO_PUBLIC_DEV_PREVIEW === "1";
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
  const lastKey = useRef(0);
  const cancelled = useRef(false);
  /* Gast hat gesprochen (06.10.): Aufschreiben verlangt ein Konto (es kostet,
     S1) — fetchWithSession öffnet dafür das Anmelde-Blatt. Die Aufnahme bleibt
     liegen; sobald ein Konto da ist, wird sie gesichert und aufgeschrieben,
     ohne dass noch einmal getippt werden muss. */
  const account = useBridgeAccount();
  /* Das Konto im Moment des Scheiterns — nachgeholt wird nur, wenn sich das
     Konto seitdem GEÄNDERT hat. Sonst liefe eine abgelaufene Sitzung (Konto
     gesetzt, Server sagt trotzdem „signin") in eine Schleife. undefined =
     nichts wartet. */
  const waitingForSignIn = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      // Reste früherer Sitzungen (abgestürzt, beendet beim Hochladen) — älter als ein Tag (10.10.)
      sweepRecordings();
      const p = await requestRecordingPermissionsAsync();
      setAllowed(p.granted);
      if (!p.granted) { setError(W?.recordFailed ?? "No microphone."); setPhase("error"); }
    })();
    // shouldPlayInBackground bleibt an — sonst hält expo-audio die Einschlafgeräusche beim Sperren an (10.10.).
    return () => { setRecording(false); holdForRecording(false); setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "mixWithOthers" }).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Apples Sprachpaket bereitlegen (10.10.): Fehlt es, lädt iOS es jetzt im
     Hintergrund — beim nächsten Traum schreibt dann das iPhone selbst mit. */
  useEffect(() => { prepareOnDeviceSpeech(""); }, []);

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
    // eine liegengebliebene Aufnahme (Fehler, nicht verworfen) weicht der neuen
    if (uri.current) { dropRecording(uri.current); uri.current = null; }
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
    if (!u || before.durationMillis < 1500) { dropRecording(u); setError(W?.recordTooShort ?? "Too short."); setPhase("error"); return; }
    uri.current = u;
    // Wiedergabe über den Lautsprecher: mit allowsRecording spielt iOS leise übers Ohr.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "mixWithOthers" }).catch(() => {});
    /* Seit 26.09. abends (Antons Ansage: „Stopp heißt: gleich weiter, die
       nächste Seite fällt weg"): kein Anhören-Zwischenschritt mehr — nach
       dem Stopp wird sofort aufgeschrieben, und der Traum-Bildschirm lässt
       ihn danach direkt von der KI lesen. Die Aufnahme hängt am Traum.
       Hochgeladen wird sie erst, wenn das Aufschreiben geklappt hat (10.10.)
       — verworfene oder gescheiterte Aufnahmen landen nie auf dem Server. */
    transcribe();
  }

  /* Die Aufnahme zum Traum auf den Server (ADR-0007). Danach braucht das
     Gerät sie nicht mehr: die lokale Datei wird gelöscht. Scheitert das
     Hochladen (offline), bleibt sie liegen — der Aufräumer nimmt sie nach
     einem Tag mit. */
  async function upload(u: string) {
    try {
      const raw = await (await fetch(u)).blob();
      const blob = new Blob([raw], { type: "audio/mp4" });
      const up = await fetchWithSession(W!.panelUrl, { method: "POST", headers: { "content-type": "audio/mp4" }, body: blob });
      const out = await up.json().catch(() => null);
      if (up.ok && typeof out?.url === "string") { onPendingAudio(out.url); dropRecording(u); }
    } catch (e) { console.warn("[recorder] upload", e); }
  }

  /* Aufschreiben — seit 10.10. zuerst AUF dem iPhone (Antons Versuch:
     „ein SDK direkt von Apple, ohne über die API zu gehen — vielleicht
     schneller"): Apples SpeechTranscriber (iOS 26) liest die Datei, ohne
     Upload und ohne Server. Geht das nicht (älteres iOS, Sprachpaket noch
     nicht da, zu wenig erkannt), schreibt wie bisher der Server mit
     (Gemini). Beide Zeiten landen in lib/speech-timing.ts. */
  async function transcribe() {
    if (!uri.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelled.current = false;
    setPhase("busy");
    const t0 = Date.now();
    try {
      /* "" = die Sprache des iPhones: Apples Modell versteht nur EINE Sprache,
         und gesprochen wird in der des Geräts — nicht unbedingt in der der App
         (gemessen 10.10.: App auf Englisch, Traum auf Deutsch). Gemini auf
         dem Server verzeiht das, Apple nicht. */
      const local = await transcribeOnDevice(uri.current, "").catch((e) => { noteSpeech({ via: "device", ms: Date.now() - t0, chars: 0, error: String(e?.message ?? e) }); return null; });
      if (cancelled.current) return;
      const localText = local?.text.trim() ?? "";
      if (local) noteSpeech({ via: "device", ms: Date.now() - t0, chars: localText.length });
      if (localText.length >= 8) { finish(localText, `Apple · ${((Date.now() - t0) / 1000).toFixed(1)} s`); return; }

      const t1 = Date.now();
      const b64 = await new File(uri.current).base64();
      const res = await fetchWithSession(W!.transcribeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio: `data:audio/mp4;base64,${b64}`, language }) });
      const out = await res.json().catch(() => null);
      if (cancelled.current) return;
      if (res.status === 401 && out?.reason === "signin") {
        waitingForSignIn.current = account ?? null;
        setError(W?.recordSignIn ?? "Sign in to write it down."); setPhase("error"); return;
      }
      const text = String(out?.text || "").trim();
      noteSpeech({ via: "server", ms: Date.now() - t1, chars: text.length });
      if (!res.ok || text.length < 8) { setError(text.length < 8 && res.ok ? (W?.recordTooShort ?? "Too short.") : (out?.error || W?.recordFailed || "Failed")); setPhase("error"); return; }
      finish(text, `Server · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    } catch (e) {
      console.warn("[recorder] transcribe", e);
      setError(W?.recordFailed ?? "Failed"); setPhase("error");
    }
  }

  function finish(text: string, via: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Nur in Test-Bauten: wer hat mitgeschrieben, wie schnell (Antons Versuch 10.10.)
    if (MEASURE) showToast(`✎ ${via}`);
    const done = uri.current;
    reset();
    onText(text, null);
    // erst jetzt hochladen — die Datei gehört ab hier zum Text
    if (done) upload(done);
  }

  // Angemeldet, während die Aufnahme wartet: nachsichern (der Gast-Upload
  // scheiterte ebenfalls an S1) und aufschreiben.
  useEffect(() => {
    const before = waitingForSignIn.current;
    if (before === undefined || typeof account !== "string" || account === before || phase !== "error" || !uri.current) return;
    waitingForSignIn.current = undefined;
    transcribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, phase]);

  function reset() { uri.current = null; waitingForSignIn.current = undefined; setError(null); setPhase("idle"); }

  /* Verwerfen: anhalten, die Datei löschen, nichts hochladen (10.10.). Auch
     eine noch laufende Aufnahme hat schon eine Datei — recorder.uri. */
  async function discard() {
    cancelled.current = true;
    const live = recorder.getStatus().isRecording;
    try { if (live) await recorder.stop(); } catch {}
    setRecording(false); holdForRecording(false);
    dropRecording(uri.current ?? (live ? recorder.uri : null));
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

  /* Das Portal füllt den Bildschirm (Antons Wunsch 04.10.: „den Space besser
     ausnutzen") — breiter als der Rand, so hoch, wie Titel und Leiste lassen. */
  const { width: winW, height: winH } = useWindowDimensions();
  const portal = Math.round(Math.min(winW * 1.25, winH * 0.66));
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
      {/* taucht aus der Unschärfe auf, von links nach rechts (Antons Wunsch 10.10.) */}
      <BlurInText text={phase === "rec" ? (W?.recording ?? "Listening…") : (W?.record ?? "Tell it out loud")} style={styles.title} align="center" />
      <Text style={styles.hint}>{phase === "rec" ? clock(secs) : (W?.recordHint ?? "")}</Text>
      {/* Das Traumportal ist der Knopf (Antons Wahl 04.10., vorher der Mond). */}
      <View style={[styles.stage, { width: portal, height: portal, marginVertical: -portal * 0.07 }]}>
        <PortalButton size={150} stageSize={portal} recording={phase === "rec"} level={level} onPress={phase === "rec" ? stop : start} disabled={allowed === false}
          label={phase === "rec" ? (W?.recordStop ?? "Done") : (W?.record ?? "Record")} />
      </View>
      {phase === "rec" ? <Text style={styles.stopHint}>{W?.recordStop ?? "Done"}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {/* Aufschreiben ging schief, die Aufnahme ist noch da: noch einmal versuchen. */}
      {phase === "error" && uri.current ? <PrimaryButton label={`✎ ${W?.recordTranscribe ?? "Write it down"}`} onPress={transcribe} style={{ flex: 0, alignSelf: "stretch" }} /> : null}
      {/* Klein und ruhig unter dem Portal — das Portal ist der Star. */}
      <View style={styles.row}>
        {phase === "rec" ? (
          <Pressable onPress={discard} hitSlop={10} style={styles.pill} accessibilityRole="button"><Text style={styles.pillText}>{W?.recordDiscard ?? "Discard"}</Text></Pressable>
        ) : null}
        <Pressable onPress={typeInstead} hitSlop={10} style={styles.pill} accessibilityRole="button"><Text style={styles.pillText}>✎ {W?.typeInstead ?? "Type instead"}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 8 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, textAlign: "center" },
  hint: { color: colors.muted, fontSize: 16, textAlign: "center", fontVariant: ["tabular-nums"], lineHeight: 22 },
  stage: { alignItems: "center", justifyContent: "center" },
  stopHint: { color: colors.faint, fontSize: 13 },
  error: { color: colors.warm, fontSize: 14, textAlign: "center" },
  row: { flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 2 },
  pill: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)" },
  pillText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
});
