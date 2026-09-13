import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Glass, GlassButton, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { MascotLoader } from "@/components/mascot-loader";
import { showToast } from "@/store/toast-store";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Bearbeiten, Umschreiben und der erste Wortlaut — nativ seit 13.09.2026
 * (vorher die ganze Web-Traumseite hinter „…").
 *
 *   mode=edit       das Textfeld, Speichern / Änderungen verwerfen
 *   mode=correct    |
 *   mode=rewrite    |  die KI schlägt vor (Brücke `refine`), dann der
 *   mode=elaborate  |  Vergleich Jetzt ↔ Überarbeitet (RefineProposal.jsx):
 *                      „Meine Fassung behalten" oder „Diese Fassung verwenden"
 *   mode=original   der erste Wortlaut, nur zum Lesen
 *
 * Übernommen wird ein Text immer über `dreamText` — die Brücke hält den
 * ersten Wortlaut fest und wirft die Reflection weg, die zum alten gehörte.
 * Es ist sein Traum: nichts wird ersetzt, bevor er zustimmt. */
type Mode = "edit" | "correct" | "rewrite" | "elaborate" | "original";

export default function EditDreamScreen() {
  const { id, mode: m } = useLocalSearchParams<{ id: string; mode: Mode }>();
  const mode = (m ?? "edit") as Mode;
  const router = useRouter();
  const { data, bridge, send, ask } = useJournal();
  const item = data?.items.find((e) => e.id === id);
  const L = data?.labels ?? {};
  const [draft, setDraft] = useState<string | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const refining = mode === "correct" || mode === "rewrite" || mode === "elaborate";

  useEffect(() => { if (item && draft === null) setDraft(item.text); }, [item, draft]);
  useEffect(() => {
    if (!refining || !item || proposal || failed) return;
    ask({ type: "refine", id: item.id, value: mode }).then((r) => {
      if (r.error || !r.result?.text) { setFailed(r.error ?? "?"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      setProposal(r.result.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  }, [refining, item?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const title = mode === "edit" ? L.editing : mode === "original" ? L.original : mode === "correct" ? L.menuCorrect : mode === "rewrite" ? L.menuRewrite : L.menuElaborate;

  function commit(text: string) {
    if (!item) return;
    if (text.trim().length < 8) { showToast(L.tooShort ?? "…"); return; }
    send({ type: "dreamText", id: item.id, text });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(L.edited ?? "Saved");
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: title ?? "", headerLargeTitle: false, headerTransparent: true }} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!item ? null : mode === "original" ? (
            <Glass style={styles.card}>
              <Text style={styles.body}>{item.originalText ?? item.text}</Text>
            </Glass>
          ) : mode === "edit" ? (
            <>
              <TextInput
                style={styles.input} multiline autoFocus value={draft ?? ""} onChangeText={setDraft}
                keyboardAppearance="dark" textAlignVertical="top" placeholderTextColor={colors.faint}
              />
              <View style={styles.actions}>
                <GlassButton label={L.cancelEdit ?? "Discard"} onPress={() => router.back()} />
                <PrimaryButton label={L.save ?? "Save"} heavy onPress={() => commit(draft ?? "")} disabled={(draft ?? "").trim().length < 8} />
              </View>
            </>
          ) : proposal ? (
            <>
              <Text style={styles.lede}>{L.refineLede}</Text>
              <Text style={styles.label}>{L.before}</Text>
              <Glass style={styles.card}><Text style={[styles.body, { color: colors.muted }]}>{item.text}</Text></Glass>
              <Text style={styles.label}>{L.after}</Text>
              <Glass style={[styles.card, styles.cardNew]} tint="rgba(140,192,255,0.12)"><Text style={styles.body}>{proposal}</Text></Glass>
              <View style={styles.actions}>
                <GlassButton label={L.keep ?? "Keep mine"} onPress={() => router.back()} />
                <PrimaryButton label={L.accept ?? "Use this version"} heavy onPress={() => commit(proposal)} />
              </View>
            </>
          ) : failed ? (
            <>
              <Text style={styles.lede}>⚠ {failed}</Text>
              <GlassButton label={L.cancel ?? "Back"} onPress={() => router.back()} style={{ flex: 0 }} />
            </>
          ) : (
            <View style={styles.working}>
              <MascotLoader size={140} />
              <Text style={styles.workingText}>{L.working}</Text>
              <Text style={styles.lede}>{(L.refineHints as unknown as Record<string, string> | undefined)?.[mode]}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: TAB_INSET + 20, gap: 12 },
  input: { minHeight: 320, color: colors.text, fontSize: 17, lineHeight: 25, padding: 18, borderRadius: 20, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  card: { padding: 18, borderRadius: 20 },
  cardNew: { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(140,192,255,0.35)" },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  lede: { color: colors.muted, fontSize: 14.5, lineHeight: 21 },
  label: { color: colors.faint, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 6, marginLeft: 4 },
  working: { alignItems: "center", gap: 12, paddingTop: 60 },
  workingText: { fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  bridge: { height: 0, overflow: "hidden" },
});
