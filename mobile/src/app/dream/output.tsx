import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Schritt 2 (Step2Output.jsx): Was soll daraus werden? Nur speichern —
   gratis, direkt ins Journal — oder ein Film ab N (Preis aus video.js).
   Die Bildergeschichte gibt es nativ NICHT mehr: Dream Rushes ist ein
   Videoprodukt (Antons Entscheidung 31.08., bestätigt 12.09.: „Wir haben
   die Bilder komplett gekickt"). Der Web-Schritt zeigt sie noch, bis
   Phase 3 (nur noch Film) dort durch ist. */
export default function DreamOutputScreen() {
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const rows: { key: string; sf: SFSymbol; title?: string; hint?: string; price: string; onPress: () => void }[] = [
    { key: "save", sf: "tray.and.arrow.down", title: W?.saveOnly, hint: W?.saveOnlyHint, price: W?.free ?? "Free", onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        send({ type: "saveDream", text: w.text, originalText: w.originalText, analysis: w.analysis, title: w.analysis?.title || "", tagline: w.analysis?.tagline || "", audioUrl: w.audioUrl ?? undefined });
        router.navigate("/journal");
      } },
    { key: "film", sf: "film", title: W?.film, hint: W?.filmHint, price: `${W?.from ?? "from"} ${W?.filmFrom ?? ""}`, onPress: () => { Haptics.selectionAsync(); patchWizard({ mode: "film" }); router.push("/dream/cast"); } },
  ];
  return (
    <>
      <WizardHeader step={2} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{W?.outputTitle ?? "What should become of it?"}</Text>
        {rows.map((r) => (
          <Pressable key={r.key} style={styles.choice} onPress={r.onPress}>
            <View style={styles.icon}><SymbolView name={r.sf} size={22} tintColor={colors.accentSoft} /></View>
            <View style={{ flex: 1, gap: 2 }}><Text style={styles.choiceTitle}>{r.title}</Text><Text style={styles.hint}>{r.hint}</Text></View>
            <Text style={[styles.price, r.key === "save" && { color: colors.ok }]}>{r.price}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.text, marginTop: 4, marginBottom: 6 },
  choice: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  choiceTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 13 },
  price: { color: colors.accentSoft, fontSize: 13, fontWeight: "600" },
  bridge: { height: 0, overflow: "hidden" },
});
