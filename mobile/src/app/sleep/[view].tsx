import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { LegacyTab } from "@/components/legacy-tab";
import { Breath } from "@/components/breath";
import { Knowledge } from "@/components/knowledge";
import { LucidGuide } from "@/components/lucid-guide";
import { Clip } from "@/components/preset-tile";
import { SleepChecklist } from "@/components/sleep-checklist";
import { SoundMixer } from "@/components/sound-mixer";
import { SymbolsAtlas } from "@/components/symbols-atlas";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Ein Schlaf-Raum — alle vier nativ (Checkliste, Klänge, Guide, Symbole);
   der Web-Rückfall bleibt für unbekannte Ansichten. Die Bühne der Unterseite
   ist die des Web (SleepScreen.jsx, view-Zweig): Schein in der Raumfarbe,
   Icon im Kreis, Serife, Untertitel. */
export default function SleepSectionScreen() {
  const { view } = useLocalSearchParams<{ view: string }>();
  const v = String(view);
  if (v === "breathe") return <BreatheRoom />;
  if (v === "knowledge") return <KnowledgeRoom />;
  if (v === "sounds") return <SoundsRoom />;
  if (v === "checklist") return <ChecklistRoom />;
  if (v === "guide") return <GuideRoom />;
  if (v === "symbols") return <SymbolsRoom />;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyTab screen="sleep" view={v} />
    </>
  );
}

function Room({ id, sf, tint, glow, trailer, kicker, children }: { id: string; sf: SFSymbol; tint: string; glow: string; trailer?: string | null; kicker?: string; children: React.ReactNode }) {
  const { data, bridge } = useJournal();
  const tile = data?.sleep?.tiles.find((t) => t.id === id);
  return (
    <>
      {/* Kopf immer durchsichtig (13.09.2026): undurchsichtig malte iOS ihn
          weiß über den dunklen Schein — die Räume haben ihren eigenen Kopf. */}
      <Stack.Screen options={{ headerLargeTitle: false, title: "", headerTransparent: true }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior={trailer ? "never" : "automatic"} contentContainerStyle={[styles.content, trailer && { paddingTop: 0 }]}>
        {trailer ? (
          /* Der Trailer oben (Antons Vorbild 13.09.: Moonlys Welcome Guide,
             wie die Traum-Seite im Journal): Film über die Breite, unten
             Kicker, Titel, Satz im Schleier. ⚠ PLATZHALTER-Clip. */
          <View style={styles.trailer}>
            <Clip url={trailer} />
            <LinearGradient colors={["rgba(5,10,20,0.35)", "rgba(5,10,20,0)", "rgba(5,10,20,0.6)", "rgba(5,10,20,1)"]} locations={[0, 0.35, 0.75, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={styles.trailerBody}>
              {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
              <Text style={styles.trailerTitle}>{tile?.title ?? ""}</Text>
              <Text style={styles.trailerSub}>{tile?.text ?? ""}</Text>
            </View>
          </View>
        ) : (
          <>
            <LinearGradient colors={[glow, "rgba(0,0,0,0)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.hero} pointerEvents="none" />
            <View style={styles.head}>
              <View style={[styles.icon, { borderColor: tint }]}><SymbolView name={sf} size={24} tintColor={tint} /></View>
              <Text style={styles.title}>{tile?.title ?? ""}</Text>
              <Text style={styles.sub}>{tile?.text ?? ""}</Text>
            </View>
          </>
        )}
        {data ? children : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

function BreatheRoom() {
  const { data } = useJournal();
  const B = data?.sleep?.breathe;
  return (
    <Room id="breathe" sf="wind" tint={colors.cyan} glow="rgba(79,214,230,0.30)">
      {B ? <Breath L={B} /> : null}
    </Room>
  );
}

function KnowledgeRoom() {
  const { data } = useJournal();
  const K = data?.sleep?.knowledge;
  return (
    <Room id="knowledge" sf="books.vertical" tint={colors.gold} glow="rgba(246,198,91,0.26)">
      {K ? <Knowledge K={K} /> : null}
    </Room>
  );
}

function ChecklistRoom() {
  const { data, send } = useJournal();
  const router = useRouter();
  const C = data?.sleep?.checklist;
  return (
    <Room id="checklist" sf="moon.zzz.fill" tint={colors.warm} glow="rgba(242,167,101,0.30)">
      {C ? <SleepChecklist C={C} onSave={(date, done) => send({ type: "sleepCheck", date, done })} onBreathe={() => router.push({ pathname: "/sleep/[view]", params: { view: "breathe" } })} breatheLabel={data?.sleep?.breathe?.guided} /> : null}
    </Room>
  );
}

function GuideRoom() {
  const { data, send } = useJournal();
  const G = data?.sleep?.lucid;
  return (
    <Room id="guide" sf="brain.head.profile" tint={colors.accent} glow="rgba(79,156,249,0.30)" trailer={G?.heroClip ?? null} kicker={G?.tutorialKicker}>
      {G ? <LucidGuide G={G} onReminder={(wants, perDay) => send({ type: "reminders", wants, perDay })} /> : null}
    </Room>
  );
}

function SymbolsRoom() {
  const { data } = useJournal();
  return (
    <Room id="symbols" sf="sparkles" tint={colors.accentSoft} glow="rgba(140,192,255,0.28)">
      {data ? <SymbolsAtlas S={data.symbols} /> : null}
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
  trailer: { aspectRatio: 4 / 5, marginHorizontal: -16, backgroundColor: colors.bg2, overflow: "hidden", justifyContent: "flex-end" },
  trailerBody: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  kicker: { color: colors.accentSoft, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" },
  trailerTitle: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.text },
  trailerSub: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  bridge: { height: 0, overflow: "hidden" },
});
