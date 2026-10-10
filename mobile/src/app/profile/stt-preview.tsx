import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { fetchWithSession } from "@/lib/auth";
import { dropRecording } from "@/lib/recordings";
import { readNotes, speechNotes } from "@/lib/speech-timing";
import { colors, fonts, radius } from "@/theme";
import { prepareOnDeviceSpeech, transcribeOnDevice } from "../../../modules/dream-sketch";

/* Messseite: Apple auf dem iPhone gegen Gemini auf dem Server (Antons
 * Versuch 10.10.). EINE Aufnahme läuft durch beide Wege gleichzeitig, die
 * Seite zeigt Texte und Zeiten nebeneinander — dazu die Zeiten der echten
 * Träume (Aufschreiben und KI-Analyse, lib/speech-timing.ts).
 *
 * Nur in Entwicklungs-Bauten (wie moonweave-preview):
 *   dreamrushes://profile/stt-preview
 * „Testdatei" nimmt Documents/stt-test.m4a, falls vorhanden (Simulator). */
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_PREVIEW === "1";

type Run = { ms: number; text: string; error?: string } | null;

export default function SttPreview() {
  const { data } = useJournal();
  const lang = (data?.language || "de").slice(0, 2);
  const url = data?.wizard?.transcribeUrl as string | undefined;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [rec, setRec] = useState(false);
  const [pack, setPack] = useState("…");
  const [busy, setBusy] = useState(false);
  const [apple, setApple] = useState<Run>(null);
  const [server, setServer] = useState<Run>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => { prepareOnDeviceSpeech("").then(setPack); }, [tick]);
  if (!ENABLED) return <Redirect href="/profile" />;

  async function runBoth(uri: string) {
    setBusy(true); setApple(null); setServer(null);
    const a = (async () => {
      const t0 = Date.now();
      try { const r = await transcribeOnDevice(uri, ""); setApple({ ms: Date.now() - t0, text: r.text }); }
      catch (e: any) { setApple({ ms: Date.now() - t0, text: "", error: String(e?.message ?? e) }); }
    })();
    const s = (async () => {
      const t0 = Date.now();
      try {
        const b64 = await new File(uri).base64();
        const res = await fetchWithSession(url!, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio: `data:audio/mp4;base64,${b64}`, language: lang }) });
        const out = await res.json().catch(() => null);
        setServer({ ms: Date.now() - t0, text: String(out?.text || ""), error: res.ok ? undefined : String(out?.error || res.status) });
      } catch (e: any) { setServer({ ms: Date.now() - t0, text: "", error: String(e?.message ?? e) }); }
    })();
    await Promise.all([a, s]);
    setBusy(false); setTick((t) => t + 1);
  }

  async function toggle() {
    if (!rec) {
      const p = await requestRecordingPermissionsAsync();
      if (!p.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record(); setRec(true);
      return;
    }
    await recorder.stop(); setRec(false);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    const u = recorder.uri;
    if (!u) return;
    await runBoth(u);
    dropRecording(u);
  }

  function testFile() {
    const f = new File(new Directory(Paths.document), "stt-test.m4a");
    if (f.exists) runBoth(f.uri);
    else setApple({ ms: 0, text: "", error: "Documents/stt-test.m4a fehlt" });
  }

  const notes = speechNotes(), reads = readNotes();
  return (
    <>
      <Stack.Screen options={{ title: "Spracherkennung" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.muted}>App-Sprache: {lang} · Apple nimmt die iPhone-Sprache · Sprachpaket: {pack}</Text>
        <Pressable onPress={toggle} disabled={busy} style={[styles.btn, rec && styles.btnRec]}>
          <Text style={styles.btnText}>{rec ? "Stopp — beide Wege messen" : busy ? "Messe …" : "Aufnehmen"}</Text>
        </Pressable>
        <Pressable onPress={testFile} disabled={busy || rec}><Text style={styles.link}>Testdatei</Text></Pressable>

        <Result title="Apple (auf dem iPhone)" run={apple} />
        <Result title="Server (Gemini)" run={server} />

        <Text style={styles.h}>Echte Träume</Text>
        {notes.length === 0 && reads.length === 0 ? <Text style={styles.muted}>Noch nichts gemessen.</Text> : null}
        {notes.map((n, i) => <Text key={`s${i}`} style={styles.line}>{n.via === "device" ? "Apple " : "Server"}  {n.ms} ms · {n.chars} Zeichen{n.error ? ` · ${n.error}` : ""}</Text>)}
        {reads.map((n, i) => <Text key={`r${i}`} style={styles.line}>Analyse  {n.ms} ms{n.ok ? "" : " · Fehler"}</Text>)}
      </ScrollView>
    </>
  );
}

function Result({ title, run }: { title: string; run: Run }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.ms}>{run ? `${run.ms} ms` : "—"}</Text></View>
      {run?.error ? <Text style={styles.err}>{run.error}</Text> : null}
      {run?.text ? <Text style={styles.body}>{run.text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  muted: { color: colors.faint, fontSize: 13 },
  btn: { paddingVertical: 14, borderRadius: 999, alignItems: "center", backgroundColor: colors.accentDeep },
  btnRec: { backgroundColor: colors.danger },
  btnText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  link: { color: colors.accentSoft, fontSize: 14, textAlign: "center" },
  card: { padding: 14, borderRadius: radius.card, backgroundColor: colors.panelSolid, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
  ms: { color: colors.gold, fontSize: 14, fontVariant: ["tabular-nums"] },
  err: { color: colors.warm, fontSize: 13 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  h: { color: colors.text, fontFamily: fonts.serif, fontSize: 20, marginTop: 8 },
  line: { color: colors.muted, fontSize: 13, fontVariant: ["tabular-nums"] },
});
