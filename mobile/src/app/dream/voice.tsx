import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Glass, GlassButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { MascotLoader } from "@/components/mascot-loader";
import { patchWizard } from "@/store/wizard-store";
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
  const { data, bridge } = useJournal();
  const W = data?.wizard;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const st = useAudioRecorderState(recorder, 250);
  const [phase, setPhase] = useState<"idle" | "rec" | "busy" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await requestRecordingPermissionsAsync();
      if (!p.granted) { setError(W?.recordFailed ?? "No microphone."); setPhase("error"); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
    return () => { setAudioModeAsync({ allowsRecording: false }).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase("rec");
  }

  async function stop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri || st.durationMillis < 1500) { setError(W?.recordTooShort ?? "Too short."); setPhase("error"); return; }
    setPhase("busy");
    try {
      const file = new File(uri);
      const b64 = await file.base64();
      const res = await fetch(W!.transcribeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio: `data:audio/mp4;base64,${b64}` }) });
      const out = await res.json().catch(() => null);
      const text = String(out?.text || "").trim();
      if (!res.ok || text.length < 8) { setError(text.length < 8 && res.ok ? (W?.recordTooShort ?? "Too short.") : (out?.error || W?.recordFailed || "Failed")); setPhase("error"); return; }
      // Die Aufnahme selbst in den Medienordner — geht das schief, bleibt der Text trotzdem.
      let audioUrl: string | null = null;
      try {
        const blob = await (await fetch(uri)).blob();
        const up = await fetch(W!.panelUrl, { method: "POST", headers: { "content-type": "audio/mp4" }, body: blob });
        const u = await up.json().catch(() => null);
        if (up.ok && typeof u?.url === "string") audioUrl = u.url;
      } catch (e) { console.warn("[voice] upload", e); }
      patchWizard({ text, pendingRead: true, audioUrl });
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
      <Stack.Screen options={{ headerShown: false, gestureEnabled: phase !== "rec" }} />
      <Pressable onPress={() => router.back()} style={[styles.close, { top: insets.top + 8 }]} hitSlop={12} accessibilityLabel={W?.cancel ?? "Cancel"}>
        <Glass style={styles.closeGlass} interactive><SymbolView name="xmark" size={14} tintColor={colors.text} weight="semibold" /></Glass>
      </Pressable>

      <View style={styles.center}>
        {phase === "busy" ? (
          <>
            <MascotLoader />
            <Text style={styles.title}>{W?.recordTranscribing ?? "Writing it down…"}</Text>
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
            {phase === "rec" ? <Text style={styles.stopHint}>{W?.recordStop ?? "Done"}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {phase === "error" ? <GlassButton label={W?.recordAgain ?? "Record again"} onPress={() => { setError(null); setPhase("idle"); }} style={{ flex: 0, marginTop: 8 }} /> : null}
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
