import { Image } from "expo-image";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

type Row = { name: string; kind: "person" | "place"; avatarId: string | null };
type Lib = { id: string; tag: string; img: string | null; category: string };
type CastData = { people: Row[]; places: Row[]; library: Lib[]; labels: Record<string, string> };

/* Schritt 2, nativ: wer ist drin, wo spielt es. Die Web-Logik liefert Namen
   und Auto-Treffer (autoMatch), hier wählt der Mensch je Name ein Foto aus
   der Bibliothek oder lässt die KI erfinden. Die Wahl reist als
   assignmentOverrides in den Web-Motor. Neue Fotos anlegen: noch im Web. */
export default function DreamCastScreen() {
  const router = useRouter();
  const { data, bridge, ask } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const [cast, setCast] = useState<CastData | null>(null);

  /* Bei jedem Fokus neu fragen — nach „Neu anlegen" (Web-Dialog mit Foto)
     steht das Foto in der Bibliothek; passt sein @tag zum Namen, ist es die
     Wahl (wie CastStep.onCreated im Web). */
  useFocusEffect(useCallback(() => {
    ask({ type: "cast", analysis: w.analysis }).then((r) => {
      if (!r.result) return;
      setCast(r.result);
      const lib: Lib[] = r.result.library;
      const over = { ...w.assignmentOverrides };
      let changed = false;
      for (const row of [...r.result.people, ...r.result.places] as Row[]) {
        if (over[row.name]) continue;
        const hit = lib.find((l) => l.tag.toLowerCase() === row.name.toLowerCase().replace(/[^a-z0-9äöüß]/gi, ""));
        if (hit) { over[row.name] = { avatarId: hit.id, free: false }; changed = true; }
      }
      if (changed) patchWizard({ assignmentOverrides: over });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.analysis]));

  const choice = (row: Row) => {
    const o = w.assignmentOverrides[row.name];
    if (o?.free) return { free: true, avatar: null as Lib | null };
    const id = o?.avatarId ?? row.avatarId;
    return { free: false, avatar: cast?.library.find((l) => l.id === id) ?? null };
  };
  function set(name: string, value: { avatarId?: string; free?: boolean }) {
    Haptics.selectionAsync();
    patchWizard({ assignmentOverrides: { ...w.assignmentOverrides, [name]: value } });
  }
  const L = cast?.labels ?? {};
  const section = (title: string, lede: string, empty: string, rows: Row[], kind: "person" | "place") => (
    <View style={styles.section}>
      <Text style={styles.h}>{title}</Text>
      <Text style={styles.lede}>{lede}</Text>
      {rows.length === 0 ? <Text style={styles.empty}>{empty}</Text> : rows.map((row) => {
        const c = choice(row);
        const options = (cast?.library ?? []).filter((l) => kind === "place" ? l.category === "place" : l.category !== "place");
        /* Die Wahl steht DIREKT in der Zeile (Antons Befund 12.09.): links der
           Name mit Stand, rechts eine Reihe runder Knöpfe — KI erfindet,
           Foto neu, dann die Gesichter der Bibliothek. Kein Text, kein
           Ausklappen; der gewählte trägt den Ring. */
        return (
          <View key={row.name} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{c.avatar ? `@${c.avatar.tag}` : c.free ? L.free : L.undecided}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip} style={{ flexShrink: 1 }}>
                <Pressable onPress={() => set(row.name, { free: true })} accessibilityLabel={L.free} style={[styles.dot, c.free && styles.dotOn]}>
                  <SymbolView name="sparkles" size={18} tintColor={c.free ? colors.bg : colors.accentSoft} />
                </Pressable>
                {options.map((l) => (
                  <Pressable key={l.id} onPress={() => set(row.name, { avatarId: l.id, free: false })} accessibilityLabel={`@${l.tag}`} style={[styles.dot, c.avatar?.id === l.id && styles.dotOn]}>
                    {l.img ? <Image source={{ uri: l.img }} style={styles.dotImg} contentFit="cover" /> : <Text style={styles.dotInitial}>{l.tag.slice(0, 1).toUpperCase()}</Text>}
                  </Pressable>
                ))}
                {/* Neu anlegen — mit Foto aus Kamera oder Mediathek (Web-Dialog). */}
                <Pressable onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/dream/avatar", params: { category: kind, tag: row.name } }); }} accessibilityLabel={L.createNew} style={[styles.dot, styles.dotNew]}>
                  <SymbolView name="camera.fill" size={17} tintColor={colors.accentSoft} />
                </Pressable>
              </ScrollView>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <>
      <WizardHeader step={3} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {cast ? (
          <>
            {section(L.people, L.peopleLede, L.peopleEmpty, cast.people, "person")}
            {section(L.places, L.placesLede, L.placesEmpty, cast.places, "place")}
          </>
        ) : null}
        <PrimaryButton label={W?.next ?? "Continue"} onPress={() => router.push("/dream/style")} style={{ flex: 0, marginTop: 6 }} />
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 18 },
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
  strip: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 10 },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.10)", borderWidth: 1.5, borderColor: "transparent", overflow: "hidden" },
  dotOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  dotNew: { borderColor: colors.panelLine, borderStyle: "dashed", backgroundColor: "transparent" },
  dotImg: { width: 40, height: 40 },
  dotInitial: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 18 },
  bridge: { height: 0, overflow: "hidden" },
});
