import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import type { IntentionData } from "@/store/journal-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Der Schlaf-Tab, nativ: die Übersicht als vier volle Zeilen (Antons Wahl
   25.08. gegen das Raster), jede in der Farbe ihres Raums. Die Räume selbst
   — Checkliste, Klänge (Web Audio), Luzid-Guide, Symbole — bleiben Web und
   werden per Stack aufgeschoben ([view].tsx). */
const TILES: Record<string, { sf: SFSymbol; tint: string }> = {
  breathe: { sf: "wind", tint: colors.cyan },
  checklist: { sf: "moon.zzz.fill", tint: colors.warm },
  sounds: { sf: "waveform", tint: colors.cyan },
  guide: { sf: "brain.head.profile", tint: colors.accent },
  knowledge: { sf: "books.vertical", tint: colors.gold },
  symbols: { sf: "sparkles", tint: colors.accentSoft },
};

export default function SleepScreen() {
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  const sleep = data?.sleep;
  return (
    <>
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {sleep ? <Text style={styles.sub}>{sleep.subtitle}</Text> : null}
        {sleep?.intention ? <Intention I={sleep.intention} onSave={(text) => send({ type: "intention", text })} /> : null}
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

/* Der Traum-Vorsatz (Antons Ansage 27.09.: „What would you like to dream
   about?" gehört hierher, nicht auf die Startseite). Abends ein Bild
   notieren; morgens erinnert die Startseite daran. Die Studie dazu steht
   im Wissen (Rätsel im REM-Traum, 2026). */
function Intention({ I, onSave }: { I: IntentionData; onSave: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const saved = I.text && !editing;
  const save = () => {
    const clean = draft.trim();
    if (!clean) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Keyboard.dismiss();
    onSave(clean);
    setEditing(false);
  };
  return (
    <Glass style={styles.intent}>
      <Text style={styles.intentTitle}>{saved ? I.saved : I.title}</Text>
      {saved ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={styles.intentText}>„{I.text}“</Text>
          <Pressable onPress={() => { Haptics.selectionAsync(); setDraft(I.text); setEditing(true); }} hitSlop={10}>
            <Text style={styles.intentLink}>{I.clear}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.text}>{I.lede}</Text>
          <TextInput style={styles.intentInput} value={draft} onChangeText={setDraft} placeholder={I.placeholder} placeholderTextColor={colors.faint}
            keyboardAppearance="dark" returnKeyType="done" onSubmitEditing={save} maxLength={140} />
          <PrimaryButton label={I.save} onPress={save} disabled={!draft.trim()} style={{ flex: 0 }} />
        </>
      )}
    </Glass>
  );
}

const styles = StyleSheet.create({
  intent: { padding: 16, borderRadius: radius.card, gap: 10, marginBottom: 4 },
  intentTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 27, color: colors.text },
  intentText: { flex: 1, fontFamily: fonts.serif, fontStyle: "italic", fontSize: 18, color: colors.text },
  intentLink: { color: colors.accentSoft, fontSize: 14 },
  intentInput: { minHeight: 50, color: colors.text, fontSize: 16, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
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
