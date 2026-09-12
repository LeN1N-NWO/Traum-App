import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { LegacyTab } from "@/components/legacy-tab";
import { SleepChecklist } from "@/components/sleep-checklist";
import { SoundMixer } from "@/components/sound-mixer";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Ein Schlaf-Raum. Checkliste und Klänge sind nativ; Guide und Symbole
   bleiben vorerst Web-Seiten mit eigenem Rückweg. Die Bühne der Unterseite
   ist die des Web (SleepScreen.jsx, view-Zweig): Schein in der Raumfarbe,
   Icon im Kreis, Serife, Untertitel. */
export default function SleepSectionScreen() {
  const { view } = useLocalSearchParams<{ view: string }>();
  const v = String(view);
  if (v === "sounds") return <SoundsRoom />;
  if (v === "checklist") return <ChecklistRoom />;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyTab screen="sleep" view={v} />
    </>
  );
}

function Room({ id, sf, tint, glow, children }: { id: string; sf: SFSymbol; tint: string; glow: string; children: React.ReactNode }) {
  const { data, bridge } = useJournal();
  const tile = data?.sleep?.tiles.find((t) => t.id === id);
  return (
    <>
      <Stack.Screen options={{ headerLargeTitle: false, title: "" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <LinearGradient colors={[glow, "rgba(0,0,0,0)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.hero} pointerEvents="none" />
        <View style={styles.head}>
          <View style={[styles.icon, { borderColor: tint }]}><SymbolView name={sf} size={24} tintColor={tint} /></View>
          <Text style={styles.title}>{tile?.title ?? ""}</Text>
          <Text style={styles.sub}>{tile?.text ?? ""}</Text>
        </View>
        {data ? children : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

function ChecklistRoom() {
  const { data, send } = useJournal();
  const C = data?.sleep?.checklist;
  return (
    <Room id="checklist" sf="moon.zzz.fill" tint={colors.warm} glow="rgba(242,167,101,0.30)">
      {C ? <SleepChecklist C={C} onSave={(date, done) => send({ type: "sleepCheck", date, done })} /> : null}
    </Room>
  );
}

function SoundsRoom() {
  const { data, send } = useJournal();
  const S = data?.sleep?.sounds;
  return (
    <Room id="sounds" sf="waveform" tint={colors.cyan} glow="rgba(79,214,230,0.35)">
      {S ? <SoundMixer S={S} onSave={(mix) => send({ type: "soundMix", mix })} /> : null}
    </Room>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 20 },
  hero: { position: "absolute", left: -16, right: -16, top: -120, height: 360 },
  head: { alignItems: "center", gap: 8, paddingTop: 8 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, textAlign: "center" },
  sub: { color: colors.muted, fontSize: 15, textAlign: "center", lineHeight: 21 },
  bridge: { height: 0, overflow: "hidden" },
});
