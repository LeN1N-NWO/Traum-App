import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Glass, GlassButton } from "@/components/glass";
import type { SymbolEntry, SymbolsData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Symbol-Atlas, nativ — SymbolsScreen.jsx im Aufbau: Gruppen mit
   Serifen-Überschrift (ohne Glyphe: die Kategorie ist eine Überschrift,
   kein 21. Symbol), Kacheln mit Icon, Name, Zähler; Antippen öffnet die
   Lesart als Sheet (SymbolDetail.jsx) mit den Träumen, in denen das Symbol
   vorkommt. Strich-Icons → SF Symbols (Antons Befund 26.08.: keine Emoji). */
const SF: Record<string, SFSymbol> = {
  water: "water.waves", home: "house", city: "building.2", forest: "tree", sky: "moon.stars",
  falling: "arrow.down.to.line", flying: "bird", chase: "figure.run", missing: "tram", lost: "safari", exposed: "eye", teeth: "mouth",
  animal: "pawprint", monster: "theatermasks", family: "figure.2.and.child.holdinghands", stranger: "figure.walk", partner: "heart",
  fear: "bolt.heart", joy: "sun.max", grief: "cloud.rain",
};

export function SymbolsAtlas({ S }: { S: SymbolsData }) {
  const router = useRouter();
  const [open, setOpen] = useState<SymbolEntry | null>(null);
  if (!S.groups.length) return <Text style={styles.empty}>{S.empty}</Text>;
  return (
    <View style={styles.wrap}>
      {S.groups.map((g) => (
        <View key={g.key} style={styles.group}>
          <Text style={styles.groupTitle}>{g.label}</Text>
          <View style={styles.grid}>
            {g.symbols.map((sym) => (
              <Pressable key={sym.id} style={styles.cell} onPress={() => { Haptics.selectionAsync(); setOpen(sym); }}>
                <Glass style={styles.tile} interactive>
                  <SymbolView name={SF[sym.id] ?? "sparkles"} size={26} tintColor={colors.accentSoft} />
                  <Text style={styles.label} numberOfLines={2}>{sym.label}</Text>
                  <Text style={styles.count}>{sym.count}×</Text>
                </Glass>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Modal visible={!!open} presentationStyle="formSheet" animationType="slide" onRequestClose={() => setOpen(null)}>
        {open ? (
          <ScrollView style={{ backgroundColor: colors.bg2 }} contentContainerStyle={styles.sheet}>
            <View style={styles.sheetIcon}><SymbolView name={SF[open.id] ?? "sparkles"} size={34} tintColor={colors.accentSoft} /></View>
            <Text style={styles.sheetTitle}>{open.label}</Text>
            <Text style={styles.meaning}>{open.meaning}</Text>
            <Text style={styles.disclaimer}>{S.disclaimer}</Text>
            <Text style={styles.occTitle}>{open.countLine}</Text>
            <View style={styles.occ}>
              {open.occurrences.map((o) => (
                <Pressable key={o.entryId} style={styles.occRow} onPress={() => { setOpen(null); router.push({ pathname: "/journal/[id]", params: { id: o.entryId } }); }}>
                  <Text style={styles.occDate}>{o.date}</Text>
                  <Text style={styles.occText} numberOfLines={1}>{o.title}</Text>
                  <SymbolView name="chevron.right" size={12} tintColor={colors.faint} />
                </Pressable>
              ))}
            </View>
            <GlassButton label={S.close} onPress={() => setOpen(null)} style={{ flex: 0, marginTop: 8 }} />
          </ScrollView>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  empty: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", paddingVertical: 24 },
  group: { gap: 10 },
  groupTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: { width: "31%", flexGrow: 1, maxWidth: "33%" },
  tile: { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", gap: 6, minHeight: 104 },
  label: { color: colors.text, fontSize: 13, textAlign: "center", lineHeight: 17 },
  count: { color: colors.faint, fontSize: 12, fontVariant: ["tabular-nums"] },
  sheet: { padding: 22, paddingTop: 28, gap: 10 },
  sheetIcon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.12)" },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, textAlign: "center" },
  meaning: { color: colors.text, fontSize: 16, lineHeight: 24, textAlign: "center" },
  disclaimer: { color: colors.faint, fontSize: 12, lineHeight: 17, textAlign: "center" },
  occTitle: { color: colors.muted, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase", marginTop: 14 },
  occ: { gap: 6 },
  occRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.panelLine },
  occDate: { color: colors.faint, fontSize: 13, width: 64 },
  occText: { flex: 1, color: colors.text, fontSize: 15 },
});
