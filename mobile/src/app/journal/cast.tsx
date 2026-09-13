import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Stack, usePathname, useRouter } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, TAB_INSET } from "@/theme";

const GROUP_ICON: Record<string, SFSymbol> = { person: "person.fill", pet: "pawprint.fill", place: "house.fill", object: "cube.fill" };

/* Die Besetzung — CastLibrary.jsx + CastGroup.jsx: Rollenliste je Gattung
   wie ein Abspann (Name links, Häufigkeit rechts, Haarlinie), sortiert
   nach Auftritten. Antippen öffnet den Dialog zum Bearbeiten.

   Seit 13.09.2026 (Antons Ansage: „Diese Library muss einen viel, viel
   größeren Wert bekommen"): alle vier Gattungen stehen immer da — Personen,
   Tiere, Orte, Dinge —, eine leere mit ihrem eigenen „hinzufügen". Dieselbe
   Seite lebt im Journal UND im Profil; der Pfad entscheidet, in welchem
   Stapel der Dialog aufgeht, damit Zurück wieder hier landet. */
export default function CastScreen() {
  const router = useRouter();
  const base = usePathname().startsWith("/profile") ? "/profile" : "/journal";
  const { data, bridge } = useJournal();
  const L = data?.library;
  const open = (params: Record<string, string>) => { Haptics.selectionAsync(); router.push({ pathname: `${base}/avatar` as "/journal/avatar", params }); };
  return (
    <>
      <Stack.Screen options={{ title: L?.title ?? "", headerLargeTitleStyle: { color: colors.text, fontFamily: fonts.serif } }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {L ? <Text style={styles.sub}>{L.why ?? L.lede}</Text> : null}
        {(L?.groups ?? []).map((g) => (
          <View key={g.category} style={styles.group}>
            <View style={styles.labelRow}>
              <SymbolView name={GROUP_ICON[g.category] ?? "circle"} size={13} tintColor={colors.faint} />
              <Text style={styles.label}>{g.label}</Text>
              {g.rows.length ? <Text style={styles.labelCount}>{g.rows.length}</Text> : null}
            </View>
            <Glass style={styles.list}>
              {g.rows.map((r, i) => (
                <Pressable key={r.id} onPress={() => open({ edit: r.id })} style={[styles.row, i > 0 && styles.rowLine]}>
                  {r.img ? <Image source={{ uri: r.img }} style={[styles.face, g.category === "place" && styles.faceWide]} contentFit="cover" /> : <View style={[styles.face, styles.initial]}><Text style={styles.initialText}>{r.initial}</Text></View>}
                  <Text style={styles.name}>{r.tag}</Text>
                  {r.count > 0
                    ? <Text style={styles.count}><Text style={styles.countN}>{r.count}</Text> {r.countWord}</Text>
                    : <Text style={styles.never}>{L?.never}</Text>}
                </Pressable>
              ))}
              <Pressable onPress={() => open({ category: g.category })} style={[styles.row, g.rows.length > 0 && styles.rowLine]} accessibilityRole="button">
                <View style={[styles.face, styles.add]}><SymbolView name="plus" size={16} tintColor={colors.accentSoft} /></View>
                <Text style={styles.addText}>{g.addLabel}</Text>
              </Pressable>
            </Glass>
          </View>
        ))}
        {L ? <PrimaryButton label={L.newLabel} onPress={() => open({ category: "any" })} style={{ flex: 0, marginTop: 8 }} /> : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 16 },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 21, marginLeft: 2 },
  group: { gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4 },
  label: { color: colors.faint, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase" },
  labelCount: { color: colors.faint, fontSize: 13, fontVariant: ["tabular-nums"] },
  list: { borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panelLine },
  face: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sky },
  faceWide: { width: 56, borderRadius: 10 },
  initial: { alignItems: "center", justifyContent: "center" },
  initialText: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 18 },
  add: { alignItems: "center", justifyContent: "center", backgroundColor: "transparent", borderWidth: 1, borderStyle: "dashed", borderColor: colors.panelLine },
  addText: { flex: 1, color: colors.accentSoft, fontSize: 15 },
  name: { flex: 1, color: colors.text, fontSize: 16 },
  count: { color: colors.muted, fontSize: 13 },
  countN: { color: colors.text, fontFamily: fonts.serif, fontSize: 17 },
  never: { color: colors.faint, fontSize: 13, fontStyle: "italic" },
  bridge: { height: 0, overflow: "hidden" },
});
