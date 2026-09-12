import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState, useEffect } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
import type { DreamItem } from "@/store/journal-store";

/* Die Traum-Seite, nativ (12.09.2026) — zum Lesen und Sehen: der Film groß
   oben und leise in Schleife, darunter Titelblatt, Fassungen, der Text in
   Lesegröße, die Reflexion, das Original. Die Aktionen (Film machen,
   Umschreiben, Bearbeiten) liegen noch auf der Web-Seite hinter „…" —
   Teilen ist nativ. Zurück: Wisch vom Rand oder der Pfeil im Kopf. */
export default function DreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  const item = data?.items.find((e) => e.id === id) ?? null;

  /* Das „…"-Menü (EntryMenu.jsx) als natives Aktionsblatt: Bearbeiten und
     die drei Umschreib-Arten öffnen die Web-Seite (dort läuft die KI),
     Löschen ist nativ — mit Rückfrage, weil es der einzige unumkehrbare
     Punkt ist und ein Aktionsblatt schneller getippt ist als das Web-Menü. */
  function menu() {
    if (!item) return;
    const toWeb = () => router.push({ pathname: "/journal/web-dream", params: { id: item.id } });
    const options = [labels.menuEdit ?? "Edit", labels.menuCorrect ?? "Correct", labels.menuRewrite ?? "Rewrite", labels.menuElaborate ?? "Elaborate", labels.menuDelete ?? "Delete", labels.cancel ?? "Cancel"];
    const del = () => Alert.alert(labels.menuDelete ?? "Delete", item.title || labels.untitled || "", [
      { text: labels.cancel ?? "Cancel", style: "cancel" },
      { text: labels.menuDelete ?? "Delete", style: "destructive", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); send({ type: "deleteDream", id: item.id }); router.back(); } },
    ]);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions({ options, destructiveButtonIndex: 4, cancelButtonIndex: 5, userInterfaceStyle: "dark" }, (i) => { if (i === 4) del(); else if (i < 4) toWeb(); });
    } else {
      toWeb();
    }
  }
  const labels = data?.labels ?? {};
  const locale = data?.language === "de" ? "de-DE" : "en-GB";

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true, headerLargeTitle: false, title: "", headerBackTitle: labels.dreams ?? "Journal",
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="never" contentContainerStyle={styles.content}>
        {item ? <DreamBody item={item} labels={labels} locale={locale} onMore={() => router.push({ pathname: "/journal/web-dream", params: { id: item.id } })} /> : null}
      </ScrollView>
      <Stack.Toolbar placement="right">
        {item ? <Stack.Toolbar.Button icon="ellipsis.circle" onPress={menu} /> : null}
      </Stack.Toolbar>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

function DreamBody({ item, labels, locale, onMore }: { item: DreamItem; labels: Record<string, string>; locale: string; onMore: () => void }) {
  const { width, height } = useWindowDimensions();
  const [take, setTake] = useState(item.films.length ? item.films.length - 1 : 0);
  const film = item.films[take]?.url ?? null;
  const still = item.images[0] ?? null;
  const date = new Date(item.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const heroH = Math.round(Math.min(height * 0.62, width * 1.35));

  return (
    <View>
      <View style={[styles.hero, { height: heroH }]}>
        {film ? <FilmHero url={film} /> : still ? <Image source={{ uri: still }} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" transition={300} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
        <LinearGradient colors={["rgba(5,10,20,0.55)", "rgba(5,10,20,0)", "rgba(5,10,20,0)", "rgba(5,10,20,0.75)", colors.bg]} locations={[0, 0.22, 0.5, 0.85, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>{date.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title || labels.untitled || "Untitled dream"}</Text>
          {item.tagline ? <Text style={styles.tagline}>{item.tagline}</Text> : null}
        </View>
      </View>

      {item.films.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.takes} accessibilityLabel={labels.takes}>
          {item.films.map((f, i) => (
            <Pressable key={f.url} onPress={() => { Haptics.selectionAsync(); setTake(i); }} style={[styles.take, i === take && styles.takeOn]}>
              <Text style={[styles.takeN, i === take && styles.takeTextOn]}>{i + 1}</Text>
              <Text style={[styles.takeLabel, i === take && styles.takeTextOn]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {item.pending && !film && (
        <View style={styles.pending}><View style={styles.dot} /><Text style={styles.pendingText}>{labels.rendering}</Text></View>
      )}

      {/* Die Bildergeschichte (DreamStory im Web): ein Textabschnitt, dann das
          Bild dazu — wie ein Comic liest. Nur bei Bildfolgen; ein Film oder
          ein einzelnes Bild lässt den Text ganz. */}
      {item.images.length >= 2 && !film ? (
        <View style={styles.section}>
          {splitPassages(item.text, item.images.length).map((p, i) => (
            <View key={i} style={{ gap: 10, marginBottom: 18 }}>
              <Image source={{ uri: item.images[i] }} style={styles.storyImg} contentFit="cover" transition={200} />
              {p ? <Text style={styles.body}>{p}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.body}>{item.text}</Text>
          {item.images.length === 1 && !film ? <Image source={{ uri: item.images[0] }} style={[styles.storyImg, { marginTop: 14 }]} contentFit="cover" /> : null}
        </View>
      )}

      {item.cast.length ? (
        <View style={[styles.section, styles.chips]}>
          {item.cast.map((c) => (
            <View key={c.tag} style={styles.chip}>
              {c.img ? <Image source={{ uri: c.img }} style={styles.chipImg} contentFit="cover" /> : <View style={[styles.chipImg, { backgroundColor: colors.sky }]} />}
              <Text style={styles.chipText}>@{c.tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {item.reflection ? (
        <View style={[styles.section, styles.card]}>
          <Text style={styles.label}>{labels.reflectTitle}</Text>
          <Text style={styles.reflect}>{item.reflection}</Text>
          <Text style={styles.note}>{labels.reflectNote}</Text>
        </View>
      ) : null}

      {item.originalText ? (
        <View style={styles.section}>
          <Text style={styles.label}>{labels.original}</Text>
          <Text style={styles.original}>{item.originalText}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {film || still ? (
          <Pressable style={[styles.button, styles.buttonQuiet]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Share.share({ url: film ?? still! }); }}>
            <Text style={styles.buttonText}>{labels.share ?? "Share"}</Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onMore(); }}>
          <Text style={styles.buttonPrimaryText}>{film ? (labels.anotherTake ?? "Another take") : (labels.makeFilm ?? "Make a short film")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* Sätze gleichmäßig auf n Bilder verteilen — dieselbe Regel wie DreamViews.splitPassages. */
function splitPassages(text: string, n: number) {
  const sentences = String(text || "").match(/[^.!?…]+[.!?…]*\s*/g) || [String(text || "")];
  const per = Math.ceil(sentences.length / n);
  return Array.from({ length: n }, (_, i) => sentences.slice(i * per, (i + 1) * per).join("").trim());
}

function FilmHero({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { player.loop = true; player.muted = true; player.play(); }, [player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: TAB_INSET },
  hero: { width: "100%", backgroundColor: colors.bg2, overflow: "hidden" },
  titleBlock: { position: "absolute", left: 20, right: 20, bottom: 18, gap: 8 },
  eyebrow: { color: colors.faint, fontSize: 11, letterSpacing: 2.2, fontWeight: "600" },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 39, color: colors.text, letterSpacing: -0.3 },
  tagline: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 16, color: colors.muted },
  takes: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  take: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  takeOn: { backgroundColor: "rgba(79,156,249,0.16)", borderColor: colors.accentSoft },
  takeN: { color: colors.faint, fontSize: 12, fontWeight: "700" },
  takeLabel: { color: colors.muted, fontSize: 13 },
  takeTextOn: { color: colors.accentSoft },
  pending: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warm },
  pendingText: { color: colors.warm, fontSize: 13 },
  section: { marginHorizontal: 20, marginTop: 22 },
  body: { color: colors.text, fontSize: 17, lineHeight: 28 },
  card: { backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, borderRadius: radius.card, padding: 16, gap: 8 },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  reflect: { color: colors.text, fontSize: 15, lineHeight: 23 },
  note: { color: colors.faint, fontSize: 12, lineHeight: 17, marginTop: 4 },
  original: { color: colors.muted, fontSize: 15, lineHeight: 24 },
  actions: { flexDirection: "row", gap: 10, marginHorizontal: 20, marginTop: 28 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  buttonQuiet: { backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  buttonPrimary: { backgroundColor: colors.warm },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  buttonPrimaryText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  bridge: { height: 0, overflow: "hidden" },
  storyImg: { width: "100%", aspectRatio: 9 / 16, borderRadius: radius.card, backgroundColor: colors.bg2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingLeft: 4, paddingRight: 10, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  chipImg: { width: 24, height: 24, borderRadius: 12 },
  chipText: { color: colors.text, fontSize: 13 },
});
