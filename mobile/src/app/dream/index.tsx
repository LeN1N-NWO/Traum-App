import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DreamLoader } from "@/components/dream-loader";
import { DreamRecorder } from "@/components/dream-recorder";
import { PrimaryButton } from "@/components/glass";
import { NightSky } from "@/components/night-sky";
import { estimateReadMs, noteRead } from "@/lib/speech-timing";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Schritt 1 — Erzählen. Seit 13.09.2026 in Antons Reihenfolge:
 *
 *   1. voice    Der Tab öffnet, die Aufnahme läuft (ein Tipp: fertig).
 *               Anhören, dann „Aufschreiben". (components/dream-recorder)
 *   2. text     Der Text aus der Aufnahme — lesen, tippend ergänzen,
 *               „Weiter erzählen" hängt eine zweite Aufnahme an, „Neu
 *               schreiben" leert das Feld. Dann ✦ Lesen.
 *   3. preview  Deine Worte oder aufgeräumt — ENTFÄLLT seit 10.10. (Antons
 *               Ansage: „den Screen mit der improved version nicht mehr
 *               anzeigen, direkt zu Make a film oder Save it"). Es gilt die
 *               aufgeräumte Fassung; die eigenen Worte bleiben als
 *               `originalText` am Traum.
 *
 * Zwischen Einsprechen und „Film oder Speichern" steht seit 10.10. der
 * Ladebalken (components/dream-loader.tsx): ab dem Aufschreiben bis die
 * KI-Analyse da ist, ein Bildschirm, ein Balken.
 *
 * „Wenn jemand aus dem Schlaf kommt, die App anmachen und nicht noch einmal
 * klicken müssen." Wer lieber tippt, kommt mit „Lieber schreiben" direkt
 * ins Feld. */
type Stage = "voice" | "text";

export default function DreamTextScreen() {
  const router = useRouter();
  const { data, bridge, ask, send } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const [stage, setStage] = useState<Stage>(w.text ? "text" : "voice");
  const [text, setText] = useState(w.text);
  const [fromVoice, setFromVoice] = useState(false);
  /* Der Ladebalken (10.10.): läuft ab dem Aufschreiben (`speech`) bzw. ab
     „Lesen" bis die Analyse da ist. `loadDone` = Antwort da → der Balken
     beschleunigt, danach geht es mit `result` weiter (loaded). */
  const [load, setLoad] = useState<{ id: number; estimate: number; speech: boolean } | null>(null);
  const [loadDone, setLoadDone] = useState(false);
  const result = useRef<{ analysis: any; text: string } | null>(null);
  const readRun = useRef(0);                 // jeder Lauf eine Nummer — ein abgebrochener zählt nicht mehr
  const recorderCancel = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [autoKey, setAutoKey] = useState(0);
  const input = useRef<TextInput>(null);
  const credits = data?.profile.credits ?? 0;
  const clean = text.trim();

  /* Seit 26.09. (Antons Befund: „Wenn man auf Traum klickt, sollte es nicht
     automatisch angehen — die Aufnahme müsste man bestätigen"): Öffnen
     zeigt das Mikrofon, aufgenommen wird erst auf Tipp. Nur „Weiter
     erzählen" startet direkt — das ist selbst schon ein bewusster Tipp. */
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  /* Die Aufnahme, die am nächsten gespeicherten Traum hängt, ist immer die
     des laufenden Traums (10.10.): Die Brücke merkte sich die letzte
     hochgeladene Aufnahme und hängte sie an den NÄCHSTEN neuen Traum —
     auch an einen später getippten, wenn die Aufnahme davor liegen blieb.
     Hat der Traum keine eigene Aufnahme, wird die Merkung geleert (die
     Brücke schreibt nur, wenn sich etwas ändert). */
  useFocusEffect(useCallback(() => {
    if (!w.audioUrl) send({ type: "pendingAudio", audioUrl: undefined });
  }, [w.audioUrl, send]));

  // Ein Auftrag ist durch (resetWizard): von vorn, mit Aufnahme.
  const seenResets = useRef(w.resets);
  useEffect(() => {
    if (w.resets === seenResets.current) return;
    seenResets.current = w.resets;
    setText(""); setLoad(null); setError(null); setFromVoice(false); setStage("voice");
  }, [w.resets]);

  /* Aufgeschrieben → sofort lesen lassen (Antons Ansage 26.09. abends: die
     Seite „Dein Traum" fällt nach dem Einsprechen weg). Wer den Text ändern
     will, kommt aus der Vorschau mit „Text bearbeiten" dorthin. */
  function onText(t: string, audioUrl: string | null) {
    const full = text.trim() ? `${text.trim()}\n\n${t}` : t;
    setText(full);
    if (audioUrl) patchWizard({ audioUrl });
    setFromVoice(true);
    setStage("text");
    read(full.trim());
  }

  function onType() {
    setFromVoice(false);
    setStage("text");
    setTimeout(() => input.current?.focus(), 350);
  }

  function startLoad(speech: boolean) {
    setLoadDone(false);
    result.current = null;
    setLoad((l) => l ?? { id: Date.now(), estimate: estimateReadMs(speech), speech });
  }

  async function read(t = clean) {
    if (t.length < 8) { setLoad(null); setError(W?.tooShort ?? "Tell a little more."); return; }
    if (W && credits < W.readPrice) { setLoad(null); router.push({ pathname: "/dream/paywall", params: { reason: "spent" } }); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    /* Die Tastatur ZUERST schließen (26.09., Befund im Simulator): Das
       Textfeld verschwindet gleich, und verschwand es mit offener Tastatur,
       blieb der Bildschirm um die Tastaturhöhe verkürzt. */
    input.current?.blur();
    Keyboard.dismiss();
    setError(null);
    startLoad(false);
    const run = ++readRun.current;
    const t0 = Date.now();
    const r = await ask({ type: "analyze", text: t });
    noteRead({ ms: Date.now() - t0, ok: !r.error });   // Messseite profile/stt-preview (10.10.)
    if (run !== readRun.current) return;               // abgebrochen
    if (r.error) { setLoad(null); setStage("text"); setError(r.error === "nocredits" ? (W?.noCredits ?? "No credits") : r.error); return; }
    result.current = { analysis: r.result, text: t };
    setLoadDone(true);                                 // Balken auf 100 %, dann weiter (loaded)
  }

  /* Der Balken ist voll: direkt zu „Film oder Speichern", mit der
     aufgeräumten Fassung. Die eigenen Worte bleiben als originalText. */
  function loaded() {
    const res = result.current;
    setLoad(null); setLoadDone(false);
    if (!res) return;
    const a = res.analysis;
    patchWizard({ text: a?.text || res.text, originalText: res.text, analysis: a, styleId: "", assignmentOverrides: {} });   // kein Stil vorausgewählt (04.10.)
    setText(res.text); setStage("text");
    router.push("/dream/output");
  }

  // Abbrechen während des Ladens: beim Aufschreiben verwirft der Rekorder, beim Lesen zählt die Antwort nicht mehr.
  function cancelLoad() {
    Haptics.selectionAsync();
    readRun.current += 1;
    if (stage === "voice") recorderCancel.current?.();
    setLoad(null); setLoadDone(false);
  }
  const price = W ? (W.readPrice ? `${W.readPrice} ${W.credit}` : W.free) : "";

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} enabled={stage === "text" && !load}>
      {/* Nachthimmel mit Sternschnuppen (Antons Wahl 26.09.), der Mond ist der Knopf. */}
      <NightSky />
      <WizardHeader step={1} cancel={W?.cancel} />
      {/* Während des Ladens bleibt der Inhalt montiert (der Rekorder schreibt
          gerade auf), nur unsichtbar — darüber liegt der Ladebalken. */}
      <View style={[{ flex: 1 }, load ? styles.hidden : null]} pointerEvents={load ? "none" : "auto"}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {stage === "voice" ? (
          <DreamRecorder
            W={W} language={data?.language ?? ""} autoStartKey={autoKey} active={focused}
            onText={onText} onType={onType} cancelRef={recorderCancel}
            onBusy={(b) => { if (b) startLoad(true); else setLoad(null); }}
            onPendingAudio={(audioUrl) => { patchWizard({ audioUrl }); send({ type: "pendingAudio", audioUrl }); }}
          />
        ) : (
          <>
            <Text style={styles.title}>{W?.textTitle ?? W?.title ?? "What did you dream?"}</Text>
            {fromVoice ? <Text style={styles.lede}>{W?.textLede}</Text> : null}
            <TextInput
              ref={input}
              style={styles.input} multiline value={text} onChangeText={setText}
              placeholder={W?.placeholder ?? "…"} placeholderTextColor={colors.faint} textAlignVertical="top" keyboardAppearance="dark"
            />
            <View style={styles.tools}>
              <Pressable style={styles.tool} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); input.current?.blur(); setStage("voice"); setAutoKey((k) => k + 1); /* bewusster Tipp: gleich aufnehmen */ }} accessibilityRole="button">
                <SymbolView name="mic.fill" size={15} tintColor={colors.warm} />
                <Text style={styles.toolText}>{W?.tellMore ?? "Keep telling"}</Text>
              </Pressable>
              {clean ? (
                <Pressable style={styles.tool} onPress={() => { Haptics.selectionAsync(); setText(""); setFromVoice(false); setTimeout(() => input.current?.focus(), 50); }} accessibilityRole="button">
                  <SymbolView name="square.and.pencil" size={15} tintColor={colors.accentSoft} />
                  <Text style={styles.toolText}>{W?.rewriteAll ?? "Start over"}</Text>
                </Pressable>
              ) : null}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={`✦ ${W?.read ?? "Read my dream"} · ${price}`} heavy spend={!!W?.readPrice} onPress={() => read()} disabled={clean.length < 8} style={{ flex: 0 }} />
            <Text style={styles.hint}>{W?.why}</Text>
          </>
        )}
      </ScrollView>
      </View>
      {load ? (
        <View style={styles.loader}>
          <DreamLoader key={load.id} estimateMs={load.estimate} done={loadDone} onComplete={loaded}
            steps={load.speech ? (W?.readingSteps ?? []) : (W?.readingSteps ?? []).slice(1)}
            cancelLabel={W?.cancel} onCancel={cancelLoad} />
        </View>
      ) : null}
      <View style={styles.bridge}>{bridge}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.text, marginTop: 8 },
  input: { minHeight: 220, color: colors.text, fontSize: 17, lineHeight: 27, padding: 16, borderRadius: radius.card, backgroundColor: colors.panelSolid, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  tools: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  tool: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.panelSolid, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  toolText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  error: { color: colors.warm, fontSize: 14 },
  hint: { color: colors.faint, fontSize: 12.5, lineHeight: 18 },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  hidden: { opacity: 0 },
  loader: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, justifyContent: "center", paddingBottom: 40 },
  bridge: { height: 0, overflow: "hidden" },
});
