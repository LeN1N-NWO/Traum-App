import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Die Besetzung — CastLibrary.jsx + CastGroup.jsx: Rollenliste je Gattung
   wie ein Abspann (Name links, Häufigkeit rechts, Haarlinie), sortiert
   nach Auftritten; leere Gattung ohne Überschrift; EIN Knopf zum Anlegen
   (Gattung fragt der Dialog); Löschen liegt im Dialog. Antippen öffnet den
   Web-Dialog zum Bearbeiten (journal/avatar.tsx) — Foto und Charakterbogen
   bleiben dort, bis der Bildwähler nativ ist. */
export default function CastScreen() {
  const router = useRouter();
  const { data, bridge } = useJournal();
  const L = data?.library;
  const empty = !L || L.groups.length === 0;
  return (
    <>
      <Stack.Screen options={{ title: L?.title ?? "", headerLargeTitleStyle: { color: colors.text, fontFamily: fonts.serif } }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {L ? <Text style={styles.sub}>{L.lede}</Text> : null}
        {empty && L ? <Text style={styles.empty}>{L.empty}</Text> : null}
        {(L?.groups ?? []).map((g) => (
          <View key={g.category} style={styles.group}>
            <Text style={styles.label}>{g.label}</Text>
            <Glass style={styles.list}>
              {g.rows.map((r, i) => (
                <Pressable key={r.id} onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/journal/avatar", params: { edit: r.id } }); }} style={[styles.row, i > 0 && styles.rowLine]}>
                  {r.img ? <Image source={{ uri: r.img }} style={styles.face} contentFit="cover" /> : <View style={[styles.face, styles.initial]}><Text style={styles.initialText}>{r.initial}</Text></View>}
                  <Text style={styles.name}>{r.tag}</Text>
                  {r.count > 0
                    ? <Text style={styles.count}><Text style={styles.countN}>{r.count}</Text> {r.countWord}</Text>
                    : <Text style={styles.never}>{L?.never}</Text>}
                </Pressable>
              ))}
            </Glass>
          </View>
        ))}
        {L ? <PrimaryButton label={L.newLabel} onPress={() => router.push({ pathname: "/journal/avatar", params: { category: "any" } })} style={{ flex: 0, marginTop: 8 }} /> : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 16 },
  sub: { color: colors.muted, fontSize: 15, marginLeft: 2 },
  empty: { color: colors.faint, fontSize: 15, lineHeight: 22, textAlign: "center", paddingVertical: 20 },
  group: { gap: 8 },
  label: { color: colors.faint, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase", marginLeft: 4 },
  list: { borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panelLine },
  face: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sky },
  initial: { alignItems: "center", justifyContent: "center" },
  initialText: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 18 },
  name: { flex: 1, color: colors.text, fontSize: 16 },
  count: { color: colors.muted, fontSize: 13 },
  countN: { color: colors.text, fontFamily: fonts.serif, fontSize: 17 },
  never: { color: colors.faint, fontSize: 13, fontStyle: "italic" },
  bridge: { height: 0, overflow: "hidden" },
});
