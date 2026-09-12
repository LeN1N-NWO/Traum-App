import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Glass, GlassButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { MascotLoader } from "@/components/mascot-loader";
import { patchWizard } from "@/store/wizard-store";
import { setRecording } from "@/store/recording-store";
import { holdForRecording } from "@/lib/sound-engine";
import { colors, fonts } from "@/theme";

/* Der Rekorder (ADR-0007): Antippen, einsprechen, fertig — kein Gespräch,
   keine Rückfragen. Die Aufnahme geht als m4a an /api/transcribe (fal.ai
   Wizper, 0,05 Cent je Minute) und wird zusätzlich über /api/panel im
   Medienordner abgelegt, damit sie am Traum bleibt. Der Text kommt in den
   Wizard zurück, die Lesung startet auf dem Erzähl-Bildschirm von selbst.
   Hier steht später Antons Traumfänger in Schleife; bis dahin atmet ein
   Ring um den Knopf. */
export default function DreamVoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, bridge, send } = useJournal();
  const W = data?.wizard;
  const { auto } = useLocalSearchParams<{ auto?: string }>();
  // Statusmeldungen des Rekorders ins Gerätelog — damit ein stiller Abbruch sichtbar wird.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (s) => { console.log(`[voice] status finished=${s.isFinished} err=${s.hasError ? s.error : "-"}`); });
  const st = useAudioRecorderState(recorder, 250);
  const [phase, setPhase] = useState<"idle" | "rec" | "busy" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await requestRecordingPermissionsAsync();
      if (!p.granted) { setError(W?.recordFailed ?? "No microphone."); setPhase("error"); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
    return () => { setRecording(false); holdForRecording(false); setAudioModeAsync({ allowsRecording: false }).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Selbsttest im Entwicklungsbau: /dream/voice?auto=15 nimmt 15 s auf und
     hält an — prüft, ob die Aufnahme die Zeit übersteht (Antons Befund). */
  const autoRan = useRef(false);
  const cancelled = useRef(false);
  useEffect(() => {
    if (!__DEV__ || !auto || !W || autoRan.current) return;
    autoRan.current = true;
    const secs = Number(auto) || 10;
    let t: ReturnType<typeof setTimeout> | null = null;
    (async () => { await new Promise((r) => setTimeout(r, 1500)); await start(); t = setTimeout(() => { stop(); }, secs * 1000); })();
    return () => { if (t) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, W]);

  async function start() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Erst alle Spieler stumm, dann die Session auf Aufnahme, dann los.
    setRecording(true); holdForRecording(true);
    await new Promise((r) => setTimeout(r, 250));
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, interruptionMode: "doNotMix", shouldPlayInBackground: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    console.log("[voice] record start");
    setPhase("rec");
  }

  /* Abbrechen (Antons Befund 13.09.: „man ist im Loop gefangen"): laufende
     Aufnahme verwerfen, Audio-Session freigeben, zurück zum Erzählen. Auch
     während des Aufschreibens — dann wird das Ergebnis verworfen. */
  async function cancel() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelled.current = true;
    try { if (recorder.getStatus().isRecording) await recorder.stop(); } catch {}
    setRecording(false); holdForRecording(false);
    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    router.back();
  }

  async function stop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const before = recorder.getStatus();
    await recorder.stop();
    setRecording(false); holdForRecording(false);
    const uri = recorder.uri;
    console.log(`[voice] record stop: was recording=${before.isRecording} duration=${before.durationMillis} ms uri=${uri ? "yes" : "none"}`);
    // Dauer aus dem Rekorder selbst — der gepollte Zustand kann hinterherhinken (Selbsttest 12.09.: 19,7 s aufgenommen, „zu kurz" gemeldet).
    if (!uri || before.durationMillis < 1500) { setError(W?.recordTooShort ?? "Too short."); setPhase("error"); return; }
    setPhase("busy");
    // ZUERST die Aufnahme sichern (Antons Ansage 12.09.: „selbst wenn das
    // nicht durchgeht, muss die Aufnahme gespeichert werden") — sie hängt
    // dann am Traum, auch wenn der Text getippt wird.
    let audioUrl: string | null = null;
    try {
      // Der Blob aus file:// trägt keinen Typ — RN schickt dann application/octet-stream
      // (Selbsttest 12.09.: 400 „Not a storable"). Typ ausdrücklich setzen.
      const raw = await (await fetch(uri)).blob();
      const blob = new Blob([raw], { type: "audio/mp4" });
      const up = await fetch(W!.panelUrl, { method: "POST", headers: { "content-type": "audio/mp4" }, body: blob });
      const u = await up.json().catch(() => null);
      console.log(`[voice] upload ${up.status} size=${blob.size} → ${u?.url ?? u?.error ?? "?"}`);
      if (up.ok && typeof u?.url === "string") audioUrl = u.url;
    } catch (e) { console.warn("[voice] upload", e); }
    if (audioUrl) {
      patchWizard({ audioUrl });
      // Zusaetzlich im Web-Zustand merken: der naechste angelegte Traum nimmt sie
      // (Step5Style / saveDream), egal welcher Bildschirm gerade lebt.
      send({ type: "pendingAudio", audioUrl });
    }
    try {
      const b64 = await new File(uri).base64();
      const res = await fetch(W!.transcribeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio: `data:audio/mp4;base64,${b64}`, language: data?.language ?? "" }) });
      const out = await res.json().catch(() => null);
      if (cancelled.current) return;                    // abgebrochen: Ergebnis verwerfen
      const text = String(out?.text || "").trim();
      console.log(`[voice] transcribe ${res.status} b64=${b64.length} → ${text.length} chars`);
      if (!res.ok || text.length < 8) { setError(text.length < 8 && res.ok ? (W?.recordTooShort ?? "Too short.") : (out?.error || W?.recordFailed || "Failed")); setPhase("error"); return; }
      patchWizard({ text, pendingRead: true });
      router.back();
    } catch (e) {
      console.warn("[voice] transcribe", e);
      setError(W?.recordFailed ?? "Failed"); setPhase("error");
    }
  }

  const secs = Math.floor((st.durationMillis || 0) / 1000);
  const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable onPress={cancel} style={[styles.close, { top: insets.top + 8 }]} hitSlop={12} accessibilityLabel={W?.cancel ?? "Cancel"}>
        <Glass style={styles.closeGlass} interactive><SymbolView name="xmark" size={14} tintColor={colors.text} weight="semibold" /></Glass>
      </Pressable>

      <View style={styles.center}>
        {phase === "busy" ? (
          <>
            <MascotLoader />
            <Text style={styles.title}>{W?.recordTranscribing ?? "Writing it down…"}</Text>
            <GlassButton label={W?.cancel ?? "Cancel"} onPress={cancel} style={{ flex: 0, marginTop: 16 }} />
          </>
        ) : (
          <>
            <Text style={styles.title}>{phase === "rec" ? (W?.recording ?? "Listening…") : (W?.record ?? "Tell it out loud")}</Text>
            <Text style={styles.hint}>{phase === "rec" ? time : (W?.recordHint ?? "")}</Text>
            <View style={styles.stage}>
              <Ring on={phase === "rec"} />
              <Pressable onPress={phase === "rec" ? stop : start} accessibilityRole="button" accessibilityLabel={phase === "rec" ? (W?.recordStop ?? "Done") : (W?.record ?? "Record")}>
                <View style={[styles.mic, phase === "rec" && styles.micOn]}>
                  <SymbolView name={phase === "rec" ? "stop.fill" : "mic.fill"} size={40} tintColor={colors.bg} />
                </View>
              </Pressable>
            </View>
            {phase === "rec" ? (
              <>
                <Text style={styles.stopHint}>{W?.recordStop ?? "Done"}</Text>
                {/* Verwerfen und neu erzählen — Antons Wunsch 13.09. */}
                <GlassButton label={W?.recordDiscard ?? W?.cancel ?? "Discard"} onPress={cancel} style={{ flex: 0, marginTop: 10 }} />
              </>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {phase === "error" ? (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <GlassButton label={W?.recordAgain ?? "Record again"} onPress={() => { setError(null); setPhase("idle"); }} />
                {/* Die Aufnahme ist gesichert — den Traum tippen geht immer. */}
                <GlassButton label={W?.or ? `${W.or} ${W.label ?? ""}`.trim() : "Type it"} onPress={() => router.back()} />
              </View>
            ) : null}
          </>
        )}
      </View>
      <View style={styles.bridge}>{bridge}</View>
    </View>
  );
}

/* Zwei Ringe, die nach außen atmen, solange aufgenommen wird — der
   Platzhalter für den Traumfänger. */
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
  screen: { flex: 1, backgroundColor: colors.bg },
  close: { position: "absolute", right: 16, zIndex: 2 },
  closeGlass: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, textAlign: "center" },
  hint: { color: colors.muted, fontSize: 16, textAlign: "center", fontVariant: ["tabular-nums"] },
  stage: { width: 240, height: 240, alignItems: "center", justifyContent: "center", marginVertical: 20 },
  ring: { position: "absolute", width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: colors.warm },
  mic: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.warm, alignItems: "center", justifyContent: "center", shadowColor: colors.warm, shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  micOn: { backgroundColor: colors.gold },
  stopHint: { color: colors.faint, fontSize: 13 },
  error: { color: colors.warm, fontSize: 14, textAlign: "center" },
  bridge: { height: 0, overflow: "hidden" },
});
