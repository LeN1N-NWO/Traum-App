import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DreamRecorder } from "@/components/dream-recorder";
import { GlassButton, PrimaryButton } from "@/components/glass";
import { MascotLoader } from "@/components/mascot-loader";
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
 *   3. preview  Deine Worte oder aufgeräumt (wie bisher).
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
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [autoKey, setAutoKey] = useState(0);
  const [mineOpen, setMineOpen] = useState(false);
  const input = useRef<TextInput>(null);
  const credits = data?.profile.credits ?? 0;
  const clean = text.trim();

  /* Öffnen = aufnehmen: jeder Fokus auf der Rekorder-Stufe stößt die
     Aufnahme an (der Rekorder ignoriert es, wenn schon etwas läuft). */
  useFocusEffect(useCallback(() => {
    setFocused(true);
    if (stage === "voice") setAutoKey((k) => k + 1);
    return () => setFocused(false);
  }, [stage]));

  // Ein Auftrag ist durch (resetWizard): von vorn, mit Aufnahme.
  const seenResets = useRef(w.resets);
  useEffect(() => {
    if (w.resets === seenResets.current) return;
    seenResets.current = w.resets;
    setText(""); setPreview(null); setError(null); setFromVoice(false); setStage("voice");
  }, [w.resets]);

  function onText(t: string, audioUrl: string | null) {
    setText((prev) => (prev.trim() ? `${prev.trim()}\n\n${t}` : t));
    if (audioUrl) patchWizard({ audioUrl });
    setFromVoice(true);
    setStage("text");
  }

  function onType() {
    setFromVoice(false);
    setStage("text");
    setTimeout(() => input.current?.focus(), 350);
  }

  async function read(t = clean) {
    if (t.length < 8) { setError(W?.tooShort ?? "Tell a little more."); return; }
    if (W && credits < W.readPrice) { router.push({ pathname: "/dream/paywall", params: { reason: "spent" } }); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true); setError(null);
    const r = await ask({ type: "analyze", text: t });
    setBusy(false);
    if (r.error) { setError(r.error === "nocredits" ? (W?.noCredits ?? "No credits") : r.error); return; }
    setMineOpen(false);
    setPreview(r.result);
  }
  function go(useImproved: boolean) {
    const a = preview;
    Haptics.selectionAsync();
    patchWizard({ text: useImproved ? a.text : clean, originalText: clean, analysis: useImproved ? a : { ...a, text: clean }, styleId: a?.style || "ultrareal", assignmentOverrides: {} });
    setPreview(null);
    router.push("/dream/output");
  }
  const price = W ? (W.readPrice ? `${W.readPrice} ${W.credit}` : W.free) : "";

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <WizardHeader step={1} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {busy ? (
          <View style={styles.reading}><MascotLoader /><Text style={styles.readingText}>{W?.reading}</Text><Text style={styles.hint}>{W?.readingHint}</Text></View>
        ) : preview ? (
          <>
            <Text style={styles.h}>{W?.previewTitle}</Text>
            <Text style={styles.lede}>{W?.previewLede}</Text>
            {/* Antons Ansage 25.09.: „Verbessert" oben und leuchtend, die eigenen
                Worte klein darunter — die ersten Zeilen, ein Tipp klappt auf. */}
            <View style={styles.glow}>
              <View style={[styles.card, styles.cardNew]}>
                <View style={styles.newHead}>
                  <SymbolView name="sparkles" size={13} tintColor={colors.accentSoft} />
                  <Text style={[styles.cardLabel, { color: colors.accentSoft }]}>{W?.improved}</Text>
                </View>
                <Text style={styles.body}>{preview.text}</Text>
              </View>
            </View>
            <Pressable onPress={() => { Haptics.selectionAsync(); setMineOpen((o) => !o); }} style={[styles.card, styles.cardMine]} accessibilityRole="button">
              <View style={styles.newHead}>
                <Text style={[styles.cardLabel, { flex: 1 }]}>{W?.yours}</Text>
                <SymbolView name={mineOpen ? "chevron.up" : "chevron.down"} size={12} tintColor={colors.faint} />
              </View>
              <Text style={styles.bodySmall} numberOfLines={mineOpen ? undefined : 2}>{clean}</Text>
            </Pressable>
            {preview.title ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><SymbolView name="film" size={14} tintColor={colors.muted} /><Text style={styles.poster}><Text style={{ fontWeight: "700" }}>{preview.title}</Text>{preview.tagline ? ` — ${preview.tagline}` : ""}</Text></View> : null}
            <View style={styles.actions}>
              <GlassButton label={W?.keepMine ?? "Keep my words"} onPress={() => go(false)} />
              <PrimaryButton label={W?.useImproved ?? "Use this version"} onPress={() => go(true)} />
            </View>
          </>
        ) : stage === "voice" ? (
          <DreamRecorder
            W={W} language={data?.language ?? ""} autoStartKey={autoKey} active={focused}
            onText={onText} onType={onType}
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
              <Pressable style={styles.tool} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); input.current?.blur(); setStage("voice"); /* der Fokus-Effekt startet die Aufnahme */ }} accessibilityRole="button">
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
            <PrimaryButton label={`✦ ${W?.read ?? "Read my dream"} · ${price}`} heavy onPress={() => read()} disabled={clean.length < 8} style={{ flex: 0 }} />
            <Text style={styles.hint}>{W?.why}</Text>
          </>
        )}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.text, marginTop: 8 },
  input: { minHeight: 220, color: colors.text, fontSize: 17, lineHeight: 27, padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  tools: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  tool: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  toolText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  error: { color: colors.warm, fontSize: 14 },
  hint: { color: colors.faint, fontSize: 12.5, lineHeight: 18 },
  reading: { alignItems: "center", gap: 10, paddingVertical: 60 },
  readingText: { color: colors.text, fontSize: 16 },
  h: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: { padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 6 },
  cardNew: { borderColor: colors.accentSoft, borderWidth: 1.5, backgroundColor: "rgba(79,156,249,0.10)" },
  /* Das Leuchten: ein weicher farbiger Schatten um die Karte (iOS). */
  glow: { borderRadius: radius.card, shadowColor: colors.accentSoft, shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  newHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardMine: { paddingVertical: 12, opacity: 0.85 },
  bodySmall: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  cardLabel: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  body: { color: colors.text, fontSize: 16, lineHeight: 25 },
  poster: { color: colors.muted, fontSize: 14 },
  actions: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  bridge: { height: 0, overflow: "hidden" },
});
