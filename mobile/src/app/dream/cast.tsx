import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius } from "@/theme";

type Row = { name: string; kind: "person" | "place"; avatarId: string | null };
type Lib = { id: string; tag: string; img: string | null; category: string };
type CastData = { people: Row[]; places: Row[]; library: Lib[]; labels: Record<string, string> };

/* Schritt 2, nativ: wer ist drin, wo spielt es. Die Web-Logik liefert Namen
   und Auto-Treffer (autoMatch), hier wählt der Mensch je Name ein Foto aus
   der Bibliothek oder lässt die KI erfinden. Die Wahl reist als
   assignmentOverrides in den Web-Motor. Neue Fotos anlegen: noch im Web. */
export default function DreamCastScreen() {
  const router = useRouter();
  const { bridge, ask } = useJournal();
  const w = useWizardStore();
  const [cast, setCast] = useState<CastData | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { ask({ type: "cast", analysis: w.analysis }).then((r) => { if (r.result) setCast(r.result); }); }, []);

  const choice = (row: Row) => {
    const o = w.assignmentOverrides[row.name];
    if (o?.free) return { free: true, avatar: null as Lib | null };
    const id = o?.avatarId ?? row.avatarId;
    return { free: false, avatar: cast?.library.find((l) => l.id === id) ?? null };
  };
  function set(name: string, value: { avatarId?: string; free?: boolean }) {
    Haptics.selectionAsync();
    patchWizard({ assignmentOverrides: { ...w.assignmentOverrides, [name]: value } });
    setOpen(null);
  }
  const L = cast?.labels ?? {};
  const section = (title: string, lede: string, empty: string, rows: Row[], kind: "person" | "place") => (
    <View style={styles.section}>
      <Text style={styles.h}>{title}</Text>
      <Text style={styles.lede}>{lede}</Text>
      {rows.length === 0 ? <Text style={styles.empty}>{empty}</Text> : rows.map((row) => {
        const c = choice(row);
        const isOpen = open === row.name;
        const options = (cast?.library ?? []).filter((l) => kind === "place" ? l.category === "place" : l.category !== "place");
        return (
          <View key={row.name} style={styles.card}>
            <Pressable style={styles.row} onPress={() => { Haptics.selectionAsync(); setOpen(isOpen ? null : row.name); }}>
              {c.avatar?.img ? <Image source={{ uri: c.avatar.img }} style={styles.thumb} contentFit="cover" />
                : <View style={[styles.thumb, styles.thumbEmpty]}><SymbolView name={c.free ? "sparkles" : kind === "place" ? "mappin" : "person.fill.questionmark"} size={18} tintColor={colors.accentSoft} /></View>}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{row.name}</Text>
                <Text style={styles.sub}>{c.avatar ? `@${c.avatar.tag}` : c.free ? L.free : L.undecided}</Text>
              </View>
              <Text style={styles.action}>{c.avatar ? L.change : L.choose}</Text>
            </Pressable>
            {isOpen ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picker}>
                <Pressable style={[styles.opt, c.free && styles.optOn]} onPress={() => set(row.name, { free: true })}>
                  <View style={[styles.optImg, styles.thumbEmpty]}><SymbolView name="sparkles" size={20} tintColor={colors.accentSoft} /></View>
                  <Text style={styles.optText} numberOfLines={1}>{L.free}</Text>
                </Pressable>
                {options.map((l) => (
                  <Pressable key={l.id} style={[styles.opt, c.avatar?.id === l.id && styles.optOn]} onPress={() => set(row.name, { avatarId: l.id, free: false })}>
                    {l.img ? <Image source={{ uri: l.img }} style={styles.optImg} contentFit="cover" /> : <View style={[styles.optImg, styles.thumbEmpty]} />}
                    <Text style={styles.optText} numberOfLines={1}>@{l.tag}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {cast ? (
          <>
            {section(L.people, L.peopleLede, L.peopleEmpty, cast.people, "person")}
            {section(L.places, L.placesLede, L.placesEmpty, cast.places, "place")}
          </>
        ) : null}
        <Pressable style={styles.primary} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/dream/style"); }}>
          <Text style={styles.primaryText}>Continue</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 18 },
  section: { gap: 10 },
  h: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginTop: 4 },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  empty: { color: colors.faint, fontSize: 14, paddingVertical: 8 },
  card: { borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  thumb: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bg2 },
  thumbEmpty: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.panelLine },
  name: { fontFamily: fonts.serif, fontSize: 18, color: colors.text },
  sub: { color: colors.muted, fontSize: 13 },
  action: { color: colors.accentSoft, fontSize: 14, fontWeight: "600" },
  picker: { gap: 10, paddingHorizontal: 12, paddingBottom: 12 },
  opt: { alignItems: "center", gap: 6, width: 72, padding: 4, borderRadius: 14, borderWidth: 1, borderColor: "transparent" },
  optOn: { borderColor: colors.accentSoft, backgroundColor: "rgba(79,156,249,0.14)" },
  optImg: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bg2 },
  optText: { color: colors.text, fontSize: 11 },
  primary: { height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm, marginTop: 6 },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  bridge: { height: 0, overflow: "hidden" },
});
