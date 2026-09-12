import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Die Menagerie — Menagerie.jsx: ein Wesen je aufgeschriebenem Traum,
   neueste zuerst; Zeichen, Name, Seltenheit, Datum. Nebenraum unter den
   Träumen (Antons Entscheidung 21.08.), nicht auf der Titelseite. */
const RARE: Record<string, string> = { common: colors.muted, uncommon: colors.ok, rare: colors.accentSoft, epic: "#c9a0ff", legendary: colors.gold };

export default function MenagerieScreen() {
  const { data, bridge } = useJournal();
  const M = data?.menagerie;
  return (
    <>
      <Stack.Screen options={{ title: M?.title ?? "", headerLargeTitleStyle: { color: colors.text, fontFamily: fonts.serif } }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {M ? <Text style={styles.sub}>{M.lede}</Text> : null}
        {M && M.creatures.length === 0 ? <Text style={styles.empty}>{M.empty}</Text> : null}
        <View style={styles.grid}>
          {(M?.creatures ?? []).map((c) => (
            <Glass key={c.id} style={styles.card}>
              <Text style={styles.emoji}>{c.e}</Text>
              <Text style={styles.name} numberOfLines={2}>{c.name}</Text>
              <Text style={[styles.rare, { color: RARE[c.rareClass.replace(/^.*-/, "")] ?? colors.muted }]}>{c.rare}</Text>
              <Text style={styles.date}>{c.date}</Text>
            </Glass>
          ))}
        </View>
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 14 },
  sub: { color: colors.muted, fontSize: 15, marginLeft: 2 },
  empty: { color: colors.faint, fontSize: 15, lineHeight: 22, textAlign: "center", paddingVertical: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", flexGrow: 1, borderRadius: 20, padding: 14, alignItems: "center", gap: 4, minHeight: 140 },
  emoji: { fontSize: 40, lineHeight: 48 },
  name: { fontFamily: fonts.serif, fontSize: 17, color: colors.text, textAlign: "center" },
  rare: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  date: { color: colors.faint, fontSize: 12 },
  bridge: { height: 0, overflow: "hidden" },
});
