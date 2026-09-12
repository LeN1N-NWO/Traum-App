import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Der Schlaf-Tab, nativ: die Übersicht als vier volle Zeilen (Antons Wahl
   25.08. gegen das Raster), jede in der Farbe ihres Raums. Die Räume selbst
   — Checkliste, Klänge (Web Audio), Luzid-Guide, Symbole — bleiben Web und
   werden per Stack aufgeschoben ([view].tsx). */
const TILES: Record<string, { sf: SFSymbol; tint: string }> = {
  checklist: { sf: "moon.zzz.fill", tint: colors.warm },
  sounds: { sf: "waveform", tint: colors.cyan },
  guide: { sf: "brain.head.profile", tint: colors.accent },
  symbols: { sf: "sparkles", tint: colors.accentSoft },
};

export default function SleepScreen() {
  const router = useRouter();
  const { data, bridge } = useJournal();
  const sleep = data?.sleep;
  return (
    <>
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {sleep ? <Text style={styles.sub}>{sleep.subtitle}</Text> : null}
        {(sleep?.tiles ?? []).map((tile) => {
          const cfg = TILES[tile.id] ?? TILES.symbols;
          return (
            <Pressable key={tile.id} style={styles.row} onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/sleep/[view]", params: { view: tile.id } }); }}>
              <LinearGradient colors={[colors.sky, "rgba(12,20,35,1)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={[styles.glow, { backgroundColor: cfg.tint }]} />
              <View style={[styles.icon, { borderColor: cfg.tint }]}>
                <SymbolView name={cfg.sf} size={22} tintColor={cfg.tint} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.title}>{tile.title}</Text>
                <Text style={styles.text}>{tile.text}</Text>
              </View>
              <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
            </Pressable>
          );
        })}
        {sleep ? <Text style={styles.free}>{sleep.free}</Text> : null}
      </ScrollView>
      <Stack.Screen.Title large style={{ color: colors.text, fontFamily: fonts.serif }} largeStyle={{ color: colors.text, fontFamily: fonts.serif, fontSize: 36 }}>
        {sleep?.title ?? "Sleep"}
      </Stack.Screen.Title>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 12 },
  sub: { color: colors.muted, fontSize: 15, marginBottom: 4, marginLeft: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.card, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  glow: { position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: 70, opacity: 0.14 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, backgroundColor: "rgba(255,255,255,0.04)" },
  title: { fontFamily: fonts.serif, fontSize: 19, color: colors.text },
  text: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  free: { color: colors.faint, fontSize: 13, textAlign: "center", marginTop: 8 },
  bridge: { height: 0, overflow: "hidden" },
});
