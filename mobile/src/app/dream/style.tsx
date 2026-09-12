import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PresetTile } from "@/components/preset-tile";
import { useJournal } from "@/components/journal-data";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts } from "@/theme";

/* Schritt 2, nativ: der Stil — die Kacheln, in denen die Filme laufen
   (Antons „diese Dynamik muss beibehalten werden"). Zehn in der ersten
   Reihe, der Rest hinter „Mehr Stile". Dreamflow ist ein Tempo (flow),
   kein Stil — wie im Web (presets.js). */
export default function DreamStyleScreen() {
  const router = useRouter();
  const { data, bridge } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const [more, setMore] = useState(false);
  const activeId = w.pace === "flow" ? "dreamflow" : (W?.presets.find((p) => p.id !== "dreamflow" && p.styleId === w.styleId)?.id ?? "ultrareal");
  const featured = (W?.presets ?? []).filter((p) => p.featured);
  const rest = (W?.presets ?? []).filter((p) => !p.featured);

  function pick(id: string) {
    const p = W?.presets.find((x) => x.id === id); if (!p) return;
    Haptics.selectionAsync();
    patchWizard(p.id === "dreamflow" ? { pace: "flow", styleId: p.styleId } : { styleId: p.styleId, pace: w.pace === "flow" ? "calm" : w.pace });
  }

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{W?.styleTitle ?? "How should it look?"}</Text>
        <View style={styles.grid}>
          {featured.map((p) => <PresetTile key={p.id} preset={p} active={p.id === activeId} onPress={pick} />)}
          {more ? rest.map((p) => <PresetTile key={p.id} preset={p} active={p.id === activeId} onPress={pick} />) : null}
        </View>
        {!more && rest.length ? (
          <Pressable style={styles.more} onPress={() => { Haptics.selectionAsync(); setMore(true); }}><Text style={styles.moreText}>{W?.moreStyles}</Text></Pressable>
        ) : null}
        <Pressable style={styles.primary} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/dream/length"); }}>
          <Text style={styles.primaryText}>{W?.next ?? "Continue"}</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.text, marginTop: 8, marginLeft: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  more: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  moreText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  primary: { height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm, marginTop: 6 },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  bridge: { height: 0, overflow: "hidden" },
});
