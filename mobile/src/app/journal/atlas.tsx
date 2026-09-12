import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { SymbolsAtlas } from "@/components/symbols-atlas";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Der Atlas als Nebenraum des Journals (JournalScreen.jsx, view "atlas"):
   dieselbe Komponente wie der Schlaf-Raum „Symbole", hier mit dem großen
   Titel des Journal-Stapels. */
export default function AtlasScreen() {
  const { data, bridge } = useJournal();
  const S = data?.symbols;
  return (
    <>
      <Stack.Screen options={{ title: S?.title ?? "" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {S ? <Text style={styles.sub}>{S.subtitle}</Text> : null}
        {S ? <SymbolsAtlas S={S} /> : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 16 },
  sub: { color: colors.muted, fontSize: 15, marginLeft: 2, fontFamily: fonts.sans },
  bridge: { height: 0, overflow: "hidden" },
});
