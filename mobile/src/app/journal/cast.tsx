import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, usePathname, useRouter } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { askPhotoThenOpen } from "@/lib/cast-photo";
import { colors, fonts, TAB_INSET } from "@/theme";

const GROUP_ICON: Record<string, SFSymbol> = { person: "person.fill", pet: "pawprint.fill", place: "house.fill", object: "cube.fill" };
const WARM = "#e1c99c";

/* Die Besetzung — seit 10.10. „Abspann plus Casting" (Antons Wahl aus dem
 * Entwurf „Deine Besetzung, neu gedacht"; vorher eine Liste wie in den
 * Einstellungen):
 *   · Casting oben: wer in den Träumen vorkam, aber noch kein Gesicht hat —
 *     die häufigsten drei (castStats.js castSuggestions). Ein Tipp öffnet
 *     den Dialog mit dem Namen schon eingetragen.
 *   · Du in der Hauptrolle: das eigene Porträt groß, „in allen N Träumen".
 *   · Je Gattung eine Reihe großer Karten wie im Abspann — Bild, Name, in
 *     wie vielen Träumen —, am Ende eine leere Karte, die einlädt.
 * Antippen einer Karte öffnet den Dialog zum Bearbeiten, wie bisher.
 * Dieselbe Seite lebt im Journal UND im Profil; der Pfad entscheidet, in
 * welchem Stapel der Dialog aufgeht, damit Zurück wieder hier landet. */
export default function CastScreen() {
  const router = useRouter();
  const base = usePathname().startsWith("/profile") ? "/profile" : "/journal";
  const { data, bridge } = useJournal();
  const L = data?.library;
  const meImg = data?.profile?.img ?? null;
  const go = (params: Record<string, string>) => router.push({ pathname: `${base}/avatar` as "/journal/avatar", params });
  /* Bearbeiten: direkt in den Dialog. Neu anlegen: erst das Foto (Kamera,
     Mediathek oder ohne), dann der Dialog mit dem Foto darin (10.10.). */
  const open = (params: Record<string, string>) => {
    if (params.edit) { Haptics.selectionAsync(); go(params); return; }
    askPhotoThenOpen(L?.photo, params.category === "any" ? undefined : params.category, () => go(params));
  };
  const openMe = () => { Haptics.selectionAsync(); router.push({ pathname: "/profile/page", params: { page: "avatar" } }); };

  return (
    <>
      <Stack.Screen options={{ title: L?.title ?? "", headerLargeTitleStyle: { color: colors.text, fontFamily: fonts.serif } }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {L ? <Text style={styles.sub}>{L.why ?? L.lede}</Text> : null}

        {/* Casting: wer schon vorkam, aber noch kein Gesicht hat */}
        {L?.suggest?.length ? (
          <View style={styles.casting}>
            <Text style={styles.castingTitle}>{L.suggestTitle}</Text>
            <Text style={styles.castingHint}>{L.suggestHint}</Text>
            {L.suggest.map((s) => (
              <Pressable key={`${s.category}-${s.name}`} onPress={() => open({ category: s.category, tag: s.tag || s.name })} style={styles.suggestRow}
                accessibilityRole="button" accessibilityLabel={`${s.name}, ${s.line}. ${L.suggestAdd}`}>
                <View style={styles.suggestFace}><SymbolView name={GROUP_ICON[s.category] ?? "person.fill"} size={14} tintColor={WARM} /></View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={styles.suggestName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.suggestLine}>{s.line}</Text>
                </View>
                <View style={styles.suggestBtn}><Text style={styles.suggestBtnText}>{L.suggestAdd}</Text></View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Du in der Hauptrolle */}
        {L?.me ? (
          <Pressable onPress={openMe} style={styles.star} accessibilityRole="button" accessibilityLabel={`${L.starring}: ${L.me.name}, ${L.me.line}`}>
            <LinearGradient colors={["#3b2d5c", "#12233f", "#0b1324"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            {meImg ? (
              <Image source={{ uri: meImg }} style={styles.starImg} contentFit="cover" contentPosition="top" />
            ) : (
              <View style={[styles.starImg, styles.starEmpty]}><SymbolView name="person.crop.circle.badge.plus" size={42} tintColor={colors.accentSoft} /></View>
            )}
            <LinearGradient colors={["rgba(11,19,36,0)", "rgba(11,19,36,0.92)"]} start={{ x: 0.3, y: 0 }} end={{ x: 0.75, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.starText}>
              <Text style={styles.starLabel}>{L.starring}</Text>
              <Text style={styles.starName} numberOfLines={1}>{L.me.name}</Text>
              <Text style={styles.starLine}>{L.me.line}</Text>
            </View>
          </Pressable>
        ) : null}

        {/* Der Abspann: je Gattung eine Reihe Karten */}
        {(L?.groups ?? []).map((g) => (
          <View key={g.category} style={styles.group}>
            <View style={styles.labelRow}>
              <SymbolView name={GROUP_ICON[g.category] ?? "circle"} size={13} tintColor={colors.faint} />
              <Text style={styles.label}>{g.label}</Text>
              {g.rows.length ? <Text style={styles.labelCount}>{g.rows.length}</Text> : null}
            </View>
            {/* Leere Gattung: eine schmale Einladung statt einer hohen leeren Karte */}
            {!g.rows.length ? (
              <Pressable onPress={() => open({ category: g.category })} style={styles.emptyRow} accessibilityRole="button" accessibilityLabel={g.addLabel}>
                <SymbolView name="plus" size={16} tintColor={colors.accentSoft} />
                <Text style={styles.emptyRowText} numberOfLines={1}>{g.emptyCard ?? g.addLabel}</Text>
              </Pressable>
            ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards} style={styles.cardsScroll}>
              {g.rows.map((r) => (
                <Pressable key={r.id} onPress={() => open({ edit: r.id })} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.97 }] }]}
                  accessibilityRole="button" accessibilityLabel={`${r.tag}, ${r.count > 0 ? `${r.count} ${r.countWord}` : L?.never ?? ""}`}>
                  {r.img ? (
                    <Image source={{ uri: r.img }} style={styles.cardImg} contentFit="cover" contentPosition="top" transition={200} />
                  ) : (
                    <View style={[styles.cardImg, styles.cardInitial]}><Text style={styles.initialText}>{r.initial}</Text></View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={1}>{r.tag}</Text>
                    {r.count > 0
                      ? <Text style={styles.cardCount}><Text style={styles.cardCountN}>{r.count}</Text> {r.countWord}</Text>
                      : <Text style={styles.cardNever} numberOfLines={1}>{L?.never}</Text>}
                  </View>
                </Pressable>
              ))}
              <Pressable onPress={() => open({ category: g.category })} style={[styles.card, styles.cardAdd]} accessibilityRole="button" accessibilityLabel={g.addLabel}>
                <SymbolView name="plus" size={22} tintColor={colors.accentSoft} />
                <Text style={styles.cardAddText} numberOfLines={3}>{g.emptyCard ?? g.addLabel}</Text>
              </Pressable>
            </ScrollView>
            )}
          </View>
        ))}
        {L ? <PrimaryButton label={L.newLabel} onPress={() => open({ category: "any" })} style={{ flex: 0, marginTop: 8 }} /> : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const CARD_W = 112;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 18 },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 21, marginLeft: 2 },

  casting: { gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "rgba(225,201,156,0.35)", backgroundColor: "rgba(212,188,141,0.07)" },
  castingTitle: { color: WARM, fontSize: 14, fontWeight: "600" },
  castingHint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: -6 },
  suggestRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  suggestFace: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(225,201,156,0.55)" },
  suggestName: { color: colors.text, fontFamily: fonts.serif, fontStyle: "italic", fontSize: 16 },
  suggestLine: { color: colors.faint, fontSize: 12 },
  suggestBtn: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: WARM },
  suggestBtnText: { color: "#1b1608", fontSize: 13, fontWeight: "700" },

  star: { height: 168, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(225,201,156,0.35)", justifyContent: "flex-end" },
  starImg: { position: "absolute", right: 0, top: 0, bottom: 0, width: "58%" },
  starEmpty: { alignItems: "center", justifyContent: "center" },
  starText: { padding: 16, gap: 2, maxWidth: "62%" },
  starLabel: { color: WARM, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: "600" },
  starName: { color: colors.text, fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 },
  starLine: { color: WARM, fontSize: 13 },

  group: { gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4 },
  label: { color: colors.faint, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase" },
  labelCount: { color: colors.faint, fontSize: 13, fontVariant: ["tabular-nums"] },
  cardsScroll: { marginHorizontal: -16 },
  cards: { paddingHorizontal: 16, gap: 10 },
  card: { width: CARD_W, borderRadius: 16, overflow: "hidden", backgroundColor: "#111a2c", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  cardImg: { width: CARD_W, height: 128, backgroundColor: colors.sky },
  cardInitial: { alignItems: "center", justifyContent: "center" },
  initialText: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 40 },
  cardBody: { paddingHorizontal: 9, paddingTop: 7, paddingBottom: 9, gap: 1 },
  cardName: { color: colors.text, fontSize: 14, fontWeight: "600" },
  cardCount: { color: colors.muted, fontSize: 12 },
  cardCountN: { color: colors.text, fontFamily: fonts.serif, fontSize: 15 },
  cardNever: { color: colors.faint, fontSize: 11.5, fontStyle: "italic" },
  cardAdd: { minHeight: 172, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10, backgroundColor: "transparent", borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(195,179,231,0.4)" },
  cardAddText: { color: "#c3b3e7", fontSize: 12.5, lineHeight: 16, textAlign: "center" },
  emptyRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(195,179,231,0.35)" },
  emptyRowText: { flex: 1, color: "#c3b3e7", fontSize: 14 },
  bridge: { height: 0, overflow: "hidden" },
});
