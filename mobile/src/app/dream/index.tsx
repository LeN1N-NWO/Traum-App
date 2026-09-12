import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius } from "@/theme";

/* Schritt 1, nativ: erzählen. Ein großes Feld in Lesegröße, darunter die
   Lesung (kostet einen Credit, wie im Web) — und das Ergebnis als Vergleich:
   deine Worte oder die aufgeräumte Fassung. Die Stimme führt noch in den
   Web-Wizard (Gemini-Gespräch), bis das nativ ist. */
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

  async function read() {
    if (clean.length < 8) { setError(W?.tooShort ?? "Tell a little more."); return; }
    if (W && credits < W.readPrice) { router.push({ pathname: "/profile/page", params: { page: "paywall" } }); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy(true); setError(null);
    const r = await ask({ type: "analyze", text: clean });
    setBusy(false);
    if (r.error) { setError(r.error === "nocredits" ? (W?.noCredits ?? "No credits") : r.error); return; }
    setPreview(r.result);
  }
  function go(useImproved: boolean) {
    const a = preview;
    Haptics.selectionAsync();
    patchWizard({ text: useImproved ? a.text : clean, originalText: clean, analysis: useImproved ? a : { ...a, text: clean }, styleId: a?.style || "ultrareal" });
    setPreview(null);
    router.push("/dream/style");
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{W?.title ?? "What did you dream?"}</Text>
        {!preview ? (
          <>
            <TextInput
              style={styles.input} multiline value={text} onChangeText={setText}
              placeholder="…" placeholderTextColor={colors.faint} textAlignVertical="top" autoFocus={!w.text}
              keyboardAppearance="dark"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable style={styles.mic} onPress={() => { Haptics.selectionAsync(); router.push("/dream/voice"); }} accessibilityLabel="Talk instead">
                <SymbolView name="mic.fill" size={20} tintColor={colors.accentSoft} />
              </Pressable>
              <Pressable style={[styles.primary, (busy || clean.length < 8) && styles.disabled]} onPress={read} disabled={busy}>
                {busy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>{W?.read ?? "Read my dream"}{W && W.readPrice > 0 ? ` · ${W.readPrice} ${W.readPrice === 1 ? W.credit1 : W.creditN}` : ""}</Text>}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.h}>{W?.previewTitle}</Text>
            <Text style={styles.lede}>{W?.previewLede}</Text>
            <View style={styles.card}><Text style={styles.label}>{W?.yours}</Text><Text style={styles.body}>{clean}</Text></View>
            <View style={[styles.card, styles.cardNew]}><Text style={styles.label}>{W?.improved}</Text><Text style={styles.body}>{preview.text}</Text></View>
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
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.text, marginTop: 8 },
  input: { minHeight: 220, color: colors.text, fontSize: 19, lineHeight: 30, padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  error: { color: colors.warm, fontSize: 14 },
  actions: { flexDirection: "row", gap: 10, alignItems: "center" },
  mic: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  primary: { flex: 1, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  quiet: { flex: 1, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  quietText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  h: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  lede: { color: colors.muted, fontSize: 14 },
  card: { padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 6 },
  cardNew: { borderColor: colors.accent },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  body: { color: colors.text, fontSize: 16, lineHeight: 25 },
  bridge: { height: 0, overflow: "hidden" },
});
