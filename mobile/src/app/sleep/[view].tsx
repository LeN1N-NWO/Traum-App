import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { LegacyTab } from "@/components/legacy-tab";
import { SoundMixer } from "@/components/sound-mixer";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Ein Schlaf-Raum. Die Klänge sind nativ (Mischpult mit Glas-Fadern, Klang
   in lib/sound-engine.ts); Checkliste, Guide und Symbole bleiben vorerst
   Web-Seiten mit eigenem Rückweg. Die Bühne der Unterseite ist die des Web:
   Schein in der Raumfarbe, Icon im Kreis, Serife, Untertitel. */
export default function SleepSectionScreen() {
  const { view } = useLocalSearchParams<{ view: string }>();
  const v = String(view);
  if (v !== "sounds") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LegacyTab screen="sleep" view={v} />
      </>
    );
  }
  return <SoundsRoom />;
}

function SoundsRoom() {
  const { data, bridge, send } = useJournal();
  const sleep = data?.sleep;
  const tile = sleep?.tiles.find((t) => t.id === "sounds");
  const S = sleep?.sounds;
  return (
    <>
      <Stack.Screen options={{ headerLargeTitle: false, title: "" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <LinearGradient colors={["rgba(79,214,230,0.35)", "rgba(79,214,230,0)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.hero} pointerEvents="none" />
        <View style={styles.head}>
          <View style={styles.icon}><SymbolView name={"waveform" as SFSymbol} size={24} tintColor={colors.cyan} /></View>
          <Text style={styles.title}>{tile?.title ?? "Sleep sounds"}</Text>
          <Text style={styles.sub}>{tile?.text ?? ""}</Text>
        </View>
        {S ? <SoundMixer S={S} onSave={(mix) => send({ type: "soundMix", mix })} /> : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 20 },
  hero: { position: "absolute", left: -16, right: -16, top: -120, height: 360 },
  head: { alignItems: "center", gap: 8, paddingTop: 8 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cyan, backgroundColor: "rgba(255,255,255,0.05)" },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, textAlign: "center" },
  sub: { color: colors.muted, fontSize: 15, textAlign: "center", lineHeight: 21 },
  bridge: { height: 0, overflow: "hidden" },
});
