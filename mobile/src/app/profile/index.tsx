import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

const GROUP_ICON: Record<string, SFSymbol> = { person: "person.fill", pet: "pawprint.fill", place: "house.fill", object: "cube.fill" };

/* Das Profil, nativ: Gesicht, Name, Guthaben, zwei Zahlen — und seit
   13.09.2026 direkt darunter die Besetzung (Antons Ansage: „Diese Library
   muss einen viel, viel größeren Wert bekommen … ein zentraler Punkt, damit
   diese Träume auch geil sind"). Vier Gattungen mit Zahl und Gesichtern,
   ein Tipp öffnet die ganze Liste. */
export default function ProfileScreen() {
  const router = useRouter();
  const { data, bridge } = useJournal();
  const p = data?.profile;
  const lib = data?.library;
  const open = (page: string) => { Haptics.selectionAsync(); router.push({ pathname: "/profile/page", params: { page } }); };
  return (
    <>
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {p ? (
          <>
            <Pressable style={styles.hero} onPress={() => open("avatar")}>
              <View style={styles.faceRing}>
                {p.img ? <Image source={{ uri: p.img }} style={styles.face} contentFit="cover" /> : <View style={[styles.face, styles.faceEmpty]}><SymbolView name="plus" size={28} tintColor={colors.accentSoft} /></View>}
              </View>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.hint}>{p.hint}</Text>
            </Pressable>
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statN}>{p.dreams}</Text><Text style={styles.statL}>{p.statDreams}</Text></View>
              <View style={styles.stat}><Text style={styles.statN}>{p.streak}</Text><Text style={styles.statL}>{p.statStreak}</Text></View>
            </View>
            {lib ? (
              <Pressable style={styles.world} onPress={() => { Haptics.selectionAsync(); router.push("/profile/cast"); }} accessibilityRole="button">
                <View style={styles.worldHead}>
                  <Text style={styles.worldTitle}>{lib.title}</Text>
                  <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
                </View>
                <Text style={styles.worldWhy}>{lib.why}</Text>
                <View style={styles.worldGrid}>
                  {lib.groups.map((g) => (
                    <View key={g.category} style={styles.worldTile}>
                      <View style={styles.faces}>
                        {g.rows.slice(0, 3).map((r, i) => (
                          r.img
                            ? <Image key={r.id} source={{ uri: r.img }} style={[styles.miniFace, i > 0 && { marginLeft: -10 }]} contentFit="cover" />
                            : <View key={r.id} style={[styles.miniFace, styles.miniInitial, i > 0 && { marginLeft: -10 }]}><Text style={styles.miniInitialText}>{r.initial}</Text></View>
                        ))}
                        {g.rows.length === 0 ? <View style={[styles.miniFace, styles.miniEmpty]}><SymbolView name={GROUP_ICON[g.category] ?? "circle"} size={13} tintColor={colors.faint} /></View> : null}
                      </View>
                      <Text style={styles.worldN}>{g.rows.length}</Text>
                      <Text style={styles.worldL} numberOfLines={1}>{g.label}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            ) : null}
            {!p.surveyDone ? (
              <Pressable style={styles.card} onPress={() => open("survey")}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.cardTitle}>{p.surveyTitle}</Text>
                  <Text style={styles.cardHint}>{p.surveyHint}</Text>
                </View>
                <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
              </Pressable>
            ) : null}
            {p.dreamer ? (
              <View style={styles.dreamer}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={styles.dreamerTitle}>{p.dreamer.title}</Text>
                  <Pressable onPress={() => open("survey")}><Text style={styles.retake}>{p.dreamer.retake}</Text></Pressable>
                </View>
                {p.dreamer.sign ? <View style={styles.sign}><Text style={styles.signGlyph}>{p.dreamer.sign.glyph}</Text><Text style={styles.signName}>{p.dreamer.sign.name}</Text></View> : null}
                {p.dreamer.facts.map(([k, v]) => (
                  <View key={k} style={styles.fact}><Text style={styles.factK}>{k}</Text><Text style={styles.factV}>{v}</Text></View>
                ))}
                {p.dreamer.themes.length ? (
                  <>
                    <Text style={styles.factK}>{p.dreamer.themesLabel}</Text>
                    <View style={styles.themes}>{p.dreamer.themes.map((th) => <View key={th} style={styles.theme}><Text style={styles.themeText}>{th}</Text></View>)}</View>
                  </>
                ) : null}
              </View>
            ) : null}
            <Pressable style={styles.card} onPress={() => { Haptics.selectionAsync(); router.push("/profile/settings"); }}>
              <SymbolView name="gearshape" size={20} tintColor={colors.accentSoft} />
              <Text style={[styles.cardTitle, { flex: 1 }]}>{p.settings}</Text>
              <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
            </Pressable>
          </>
        ) : null}
      </ScrollView>
      <Stack.Screen.Title large style={{ color: colors.text, fontFamily: fonts.serif }} largeStyle={{ color: colors.text, fontFamily: fonts.serif, fontSize: 36 }}>
        {p?.title ?? "Profile"}
      </Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/profile/paywall", params: { reason: "browse" } }); }}>{p ? `✦ ${p.credits} ${p.creditsWord}` : ""}</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 14 },
  hero: { alignItems: "center", gap: 6, paddingVertical: 12 },
  faceRing: { padding: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.panelLine, marginBottom: 8 },
  face: { width: 168, height: 168, borderRadius: 84, backgroundColor: colors.bg2 },
  faceEmpty: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.accentSoft },
  name: { fontFamily: fonts.serif, fontSize: 32, color: colors.text },
  hint: { color: colors.muted, fontSize: 14, textAlign: "center" },
  stats: { flexDirection: "row", justifyContent: "center", gap: 48, paddingVertical: 6 },
  stat: { alignItems: "center", gap: 2 },
  statN: { color: colors.text, fontSize: 28, fontWeight: "600", fontVariant: ["tabular-nums"] },
  statL: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase" },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cardHint: { color: colors.accentSoft, fontSize: 13 },
  bridge: { height: 0, overflow: "hidden" },
  world: { padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(140,192,255,0.28)", gap: 8 },
  worldHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  worldTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  worldWhy: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
  worldGrid: { flexDirection: "row", gap: 8, marginTop: 6 },
  worldTile: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.03)" },
  faces: { flexDirection: "row", height: 30, alignItems: "center" },
  miniFace: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: colors.bg, backgroundColor: colors.sky },
  miniInitial: { alignItems: "center", justifyContent: "center" },
  miniInitialText: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 13 },
  miniEmpty: { alignItems: "center", justifyContent: "center", backgroundColor: "transparent", borderColor: colors.panelLine, borderStyle: "dashed" },
  worldN: { color: colors.text, fontSize: 20, fontWeight: "600", fontVariant: ["tabular-nums"] },
  worldL: { color: colors.faint, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase" },
  dreamer: { padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 10 },
  dreamerTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  retake: { color: colors.accentSoft, fontSize: 13, fontWeight: "600" },
  sign: { flexDirection: "row", alignItems: "center", gap: 8 },
  signGlyph: { fontSize: 22, color: colors.gold },
  signName: { color: colors.text, fontSize: 15 },
  fact: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  factK: { color: colors.faint, fontSize: 12, letterSpacing: 0.4 },
  factV: { color: colors.text, fontSize: 14, flexShrink: 1, textAlign: "right" },
  themes: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  theme: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(79,156,249,0.14)" },
  themeText: { color: colors.accentSoft, fontSize: 12 },
});
