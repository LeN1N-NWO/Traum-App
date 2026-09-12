import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Die lesbare Rechtsseite (LegalPage.jsx): Titel, Stand, Entwurfs-Hinweis,
   Abschnitte in Lesegröße. Eine geschobene Seite mit Systemkopf — keine
   Karte, die Texte sind lang und sollen nicht nach Kleingedrucktem aussehen. */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const { data, bridge } = useJournal();
  const L = data?.profile?.settingsPage?.legal;
  const d = L ? (String(doc) === "privacy" ? L.privacy : L.terms) : null;
  return (
    <>
      <Stack.Screen options={{ title: d?.title ?? "" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {d && L ? (
          <>
            <Text style={styles.title}>{d.title}</Text>
            <Text style={styles.meta}>{L.updated}</Text>
            <Text style={styles.draft}>{L.draftNote}</Text>
            {d.sections.map((s, i) => (
              <View key={i} style={styles.section}>
                <Text style={styles.h}>{s.h}</Text>
                <Text style={styles.p}>{s.p}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: TAB_INSET, gap: 14 },
  title: { color: colors.text, fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  meta: { color: colors.faint, fontSize: 13 },
  draft: { color: colors.warm, fontSize: 13, lineHeight: 18 },
  section: { gap: 6, marginTop: 6 },
  h: { color: colors.text, fontSize: 17, fontWeight: "600" },
  p: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  bridge: { height: 0, overflow: "hidden" },
});
