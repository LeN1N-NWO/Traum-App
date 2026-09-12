import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Schritt 1 — der Aufbau des Web (Step1Dream.jsx): Erzählen kommt zuerst
   und ist das Größte auf dem Bildschirm, das ist der halbwache Fall, für den
   die App gebaut ist. Darunter „oder schreib es", das Feld, die Lesung
   (gratis), warum. Danach der Vergleich: deine Worte oder aufgeräumt. */
export default function DreamTextScreen() {
  const router = useRouter();
  const { data, bridge, ask } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const [text, setText] = useState(w.text);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const credits = data?.profile.credits ?? 0;
  const clean = text.trim();

  // Aus dem Gespräch zurück: Text übernehmen und sofort lesen (wie im Web).
  useEffect(() => {
    if (!w.pendingRead || !W) return;
    setText(w.text); patchWizard({ pendingRead: false });
    read(w.text.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.pendingRead, W]);

  async function read(t = clean) {
    if (t.length < 8) { setError(W?.tooShort ?? "Tell a little more."); return; }
    if (W && credits < W.readPrice) { router.push({ pathname: "/profile/page", params: { page: "paywall" } }); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true); setError(null);
    const r = await ask({ type: "analyze", text: t });
    setBusy(false);
    if (r.error) { setError(r.error === "nocredits" ? (W?.noCredits ?? "No credits") : r.error); return; }
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
        <Text style={styles.title}>{W?.title ?? "What did you dream?"}</Text>
        {busy ? (
          <View style={styles.reading}><ActivityIndicator color={colors.accentSoft} /><Text style={styles.readingText}>{W?.reading}</Text><Text style={styles.hint}>{W?.readingHint}</Text></View>
        ) : !preview ? (
          <>
            <Pressable style={styles.tell} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/dream/voice"); }}>
              <View style={styles.tellIcon}><SymbolView name="waveform.and.mic" size={26} tintColor={colors.bg} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.tellTitle}>{W?.interview ?? "Tell it out loud"}</Text>
                <Text style={styles.tellHint}>{W?.interviewHint}</Text>
              </View>
            </Pressable>
            <View style={styles.or}><View style={styles.orLine} /><Text style={styles.orText}>{W?.or}</Text><View style={styles.orLine} /></View>
            <Text style={styles.label}>{W?.label}</Text>
            <TextInput
              style={styles.input} multiline value={text} onChangeText={setText}
              placeholder={W?.placeholder ?? "…"} placeholderTextColor={colors.faint} textAlignVertical="top" keyboardAppearance="dark"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.quiet, clean.length < 8 && styles.disabled]} onPress={() => read()} disabled={clean.length < 8}>
              <SymbolView name="sparkles" size={16} tintColor={colors.text} />
              <Text style={styles.quietText}>{W?.read ?? "Read my dream"} · {price}</Text>
            </Pressable>
            <Text style={styles.hint}>{W?.why}</Text>
          </>
        ) : (
          <>
            <Text style={styles.h}>{W?.previewTitle}</Text>
            <Text style={styles.lede}>{W?.previewLede}</Text>
            <View style={styles.card}><Text style={styles.cardLabel}>{W?.yours}</Text><Text style={styles.body}>{clean}</Text></View>
            <View style={[styles.card, styles.cardNew]}><Text style={styles.cardLabel}>{W?.improved}</Text><Text style={styles.body}>{preview.text}</Text></View>
            {preview.title ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><SymbolView name="film" size={14} tintColor={colors.muted} /><Text style={styles.poster}><Text style={{ fontWeight: "700" }}>{preview.title}</Text>{preview.tagline ? ` — ${preview.tagline}` : ""}</Text></View> : null}
            <View style={styles.actions}>
              <Pressable style={styles.quiet} onPress={() => go(false)}><Text style={styles.quietText}>{W?.keepMine}</Text></Pressable>
              <Pressable style={styles.primary} onPress={() => go(true)}><Text style={styles.primaryText}>{W?.useImproved}</Text></Pressable>
            </View>
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
  tell: { flexDirection: "row", alignItems: "center", gap: 16, padding: 18, borderRadius: radius.lg, backgroundColor: colors.warm },
  tellIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,10,20,0.18)" },
  tellTitle: { color: colors.bg, fontSize: 20, fontWeight: "700" },
  tellHint: { color: "rgba(5,10,20,0.75)", fontSize: 13 },
  or: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.panelLine },
  orText: { color: colors.faint, fontSize: 13 },
  label: { color: colors.muted, fontSize: 13 },
  input: { minHeight: 200, color: colors.text, fontSize: 17, lineHeight: 27, padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  error: { color: colors.warm, fontSize: 14 },
  quiet: { flex: 1, height: 50, borderRadius: 999, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  quietText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  primary: { flex: 1, height: 50, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm },
  primaryText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  hint: { color: colors.faint, fontSize: 12.5, lineHeight: 18 },
  reading: { alignItems: "center", gap: 10, paddingVertical: 60 },
  readingText: { color: colors.text, fontSize: 16 },
  h: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  lede: { color: colors.muted, fontSize: 14 },
  card: { padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 6 },
  cardNew: { borderColor: colors.accent },
  cardLabel: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  body: { color: colors.text, fontSize: 16, lineHeight: 25 },
  poster: { color: colors.muted, fontSize: 14 },
  actions: { flexDirection: "row", gap: 10 },
  bridge: { height: 0, overflow: "hidden" },
});
