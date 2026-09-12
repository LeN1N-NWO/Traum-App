import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState, useEffect } from "react";
import { ActionSheetIOS, Alert, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { MascotLoader } from "@/components/mascot-loader";
import { Glass, GlassButton, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
import { patchWizard, resetWizard } from "@/store/wizard-store";
import type { DreamItem } from "@/store/journal-store";

/* Die Traum-Seite, nativ (12.09.2026) — zum Lesen und Sehen: der Film groß
   oben und leise in Schleife, darunter Titelblatt, Fassungen, der Text in
   Lesegröße, die Reflexion, das Original. Die Aktionen (Film machen,
   Umschreiben, Bearbeiten) liegen noch auf der Web-Seite hinter „…" —
   Teilen ist nativ. Zurück: Wisch vom Rand oder der Pfeil im Kopf. */
export default function DreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, bridge, send, ask } = useJournal();
  const item = data?.items.find((e) => e.id === id) ?? null;
  const [reflecting, setReflecting] = useState(false);
  /* „Nochmal, anders" / „Zum Leben erwecken": der native Fluss ab dem Stil
     mit Text und Analyse DIESES Traums (Antons Wunsch 12.09. — vorher
     landete man auf der alten Web-Seite). Mit entryId haengt der Auftrag
     die neue Fassung an den Traum; alle Fassungen bleiben. */
  function retake() {
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetWizard();
    patchWizard({ entryId: item.id, text: item.text, originalText: item.originalText ?? item.text, analysis: item.analysis, styleId: item.styleId ?? item.analysis?.style ?? "ultrareal", mode: "film" });
    router.push("/dream/style");
  }
  async function reflectNow() {
    if (!item || reflecting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReflecting(true);
    const r = await ask({ type: "reflect", id: item.id });
    setReflecting(false);
    if (r.error) Alert.alert("⚠", String(r.error));
  }

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
        {item ? <DreamBody item={item} labels={labels} locale={locale} onMore={retake} onReflect={reflectNow} reflecting={reflecting} /> : null}
      </ScrollView>
      <Stack.Toolbar placement="right">
        {item ? <Stack.Toolbar.Button icon="ellipsis.circle" onPress={menu} /> : null}
      </Stack.Toolbar>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

function RecordingRow({ url, label }: { url: string; label: string }) {
  const player = useAudioPlayer({ uri: url });
  const st = useAudioPlayerStatus(player);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const k = st.duration > 0 ? Math.min(1, st.currentTime / st.duration) : 0;
  return (
    <View style={styles.section}>
      <Pressable onPress={() => { Haptics.selectionAsync(); if (st.playing) player.pause(); else { if (st.didJustFinish || (st.duration > 0 && st.currentTime >= st.duration - 0.05)) player.seekTo(0); player.play(); } }}>
        <Glass style={styles.rec} interactive>
          <View style={styles.recBtn}><SymbolView name={st.playing ? "pause.fill" : "play.fill"} size={16} tintColor={colors.bg} /></View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.recLabel}>{label}</Text>
            <View style={styles.recBar}><View style={[styles.recFill, { width: `${Math.round(k * 100)}%` }]} /></View>
          </View>
          <Text style={styles.recTime}>{fmt(st.playing || st.currentTime > 0 ? st.currentTime : st.duration)}</Text>
        </Glass>
      </Pressable>
    </View>
  );
}

function DreamBody({ item, labels, locale, onMore, onReflect, reflecting }: { item: DreamItem; labels: Record<string, string>; locale: string; onMore: () => void; onReflect?: () => void; reflecting?: boolean }) {
  const { width, height } = useWindowDimensions();
  const [take, setTake] = useState(item.films.length ? item.films.length - 1 : 0);
  const [sound, setSound] = useState(false);
  const [full, setFull] = useState(false);
  const film = item.films[take]?.url ?? null;
  const still = item.images[0] ?? null;
  const date = new Date(item.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const heroH = Math.round(Math.min(height * 0.62, width * 1.35));

  return (
    <View>
      <View style={[styles.hero, { height: heroH }]}>
        {item.films.length > 1 ? (
          /* Mehrere Fassungen: wischen zwischen ihnen (Antons Wunsch 12.09.),
             die Punkte unten zeigen, welche laeuft. Alle bleiben erhalten. */
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={StyleSheet.absoluteFill}
            contentOffset={{ x: width * take, y: 0 }}
            onMomentumScrollEnd={(e) => { const i = Math.round(e.nativeEvent.contentOffset.x / width); if (i !== take) { Haptics.selectionAsync(); setTake(i); } }}>
            {item.films.map((f, i) => <View key={f.url} style={{ width, height: heroH }}><FilmHero url={f.url} sound={sound && i === take} /></View>)}
          </ScrollView>
        ) : film ? <FilmHero url={film} sound={sound} /> : still ? <Image source={{ uri: still }} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" transition={300} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
        {/* pointerEvents="none": der Verlauf lag ueber den Knoepfen und schluckte jeden Tipp. */}
        <LinearGradient colors={["rgba(5,10,20,0.55)", "rgba(5,10,20,0)", "rgba(5,10,20,0)", "rgba(5,10,20,0.75)", colors.bg]} locations={[0, 0.22, 0.5, 0.85, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        {film ? (
          <View style={styles.heroTools}>
            <Pressable onPress={() => { Haptics.selectionAsync(); setSound((v) => !v); }} hitSlop={10} accessibilityLabel={sound ? "Mute" : "Sound"} accessibilityState={{ selected: sound }}>
              <Glass style={styles.heroTool} interactive tint={sound ? "rgba(140,192,255,0.45)" : undefined}><SymbolView name={sound ? "speaker.wave.2.fill" : "speaker.slash.fill"} size={15} tintColor={colors.text} weight="semibold" /></Glass>
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFull(true); }} hitSlop={10} accessibilityLabel="Fullscreen">
              <Glass style={styles.heroTool} interactive><SymbolView name="arrow.up.left.and.arrow.down.right" size={15} tintColor={colors.text} weight="semibold" /></Glass>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.titleBlock} pointerEvents="none">
          {item.films.length > 1 ? (
            <View style={styles.takeDots}>{item.films.map((f, i) => <View key={f.url} style={[styles.takeDot, i === take && styles.takeDotOn]} />)}</View>
          ) : null}
          <Text style={styles.eyebrow}>{date.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title || labels.untitled || "Untitled dream"}</Text>
          {item.tagline ? <Text style={styles.tagline}>{item.tagline}</Text> : null}
        </View>
      </View>

      {/* Vollbild — eigenes Blatt statt System-Vollbild: das hatte ohne
          Bedienelemente keinen Weg zurueck (Antons Befund 12.09.). Sanfter
          Zoom, Ton an, Regler des Systems, X oben links. */}
      {film ? <FullscreenFilm url={film} visible={full} onClose={() => setFull(false)} label={item.title || ""} /> : null}

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

      {/* Die eigene Aufnahme (ADR-0007): die Stimme von damals gehört zum Traum. */}
      {item.audio ? <RecordingRow url={item.audio} label={labels.yourRecording ?? "Your recording"} /> : null}

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

      {!item.reflection && onReflect ? (
        <View style={styles.section}>
          {reflecting ? (
            <View style={{ alignItems: "center", gap: 8 }}><MascotLoader size={120} /><Text style={styles.note}>{labels.reflectNote}</Text></View>
          ) : (
            <GlassButton label={labels.reflectCta ?? "What might this dream be saying?"} onPress={onReflect} style={{ flex: 0 }} />
          )}
        </View>
      ) : null}

      {item.reflection ? (
        <View style={[styles.section, styles.card]}>
          <Text style={styles.label}>{labels.reflectTitle}</Text>
          <Text style={styles.reflect}>{item.reflection}</Text>
          <Text style={styles.note}>{labels.reflectNote}</Text>
        </View>
      ) : null}

      {/* Kein „Ursprünglich geschrieben" mehr auf der Seite (Antons Ansage
          12.09.: „sinnlos") — das Original bleibt gespeichert und im Web-Menü
          erreichbar. */}

      <View style={styles.actions}>
        {film || still ? <GlassButton label={labels.share ?? "Share"} onPress={() => { shareFile(film ?? still!); }} /> : null}
        <PrimaryButton label={film ? (labels.anotherTake ?? "Another take") : (labels.makeFilm ?? "Bring it to life")} onPress={onMore} />
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

/* Der Film oben: leise in Schleife als Plakat. Der Vollbild-Knopf (Antons
   Wunsch 12.09.) öffnet den System-Player — iOS zoomt sanft auf, die
   Tonspur läuft, mit Regler und Fertig-Knopf; zurück wird er wieder leise. */
function FilmHero({ url, sound }: { url: string; sound: boolean }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { player.loop = true; player.play(); }, [player]);
  /* Ton an/aus ohne Vollbild: laut heisst „nicht mischen", sonst kippt der
     Klangmischer die Session. */
  useEffect(() => { player.muted = !sound; player.audioMixingMode = sound ? "doNotMix" : "mixWithOthers"; }, [player, sound]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

function FullscreenFilm({ url, visible, onClose, label }: { url: string; visible: boolean; onClose: () => void; label: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} style={styles.full}>
        <Animated.View entering={ZoomIn.duration(320)} style={StyleSheet.absoluteFill}>
          {visible ? <FullPlayer url={url} /> : null}
        </Animated.View>
        <Pressable onPress={() => { Haptics.selectionAsync(); onClose(); }} style={[styles.fullClose, { top: insets.top + 8 }]} hitSlop={12} accessibilityLabel="Close">
          <Glass style={styles.heroTool} interactive><SymbolView name="xmark" size={15} tintColor={colors.text} weight="semibold" /></Glass>
        </Pressable>
        {label ? <Text style={[styles.fullTitle, { top: insets.top + 14 }]} numberOfLines={1}>{label}</Text> : null}
      </Animated.View>
    </Modal>
  );
}
function FullPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = false; p.audioMixingMode = "doNotMix"; p.play(); });
  useEffect(() => { player.muted = false; player.play(); return () => { player.pause(); }; }, [player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls allowsPictureInPicture={false} />;
}

/* Teilen mit der DATEI, nicht mit dem Link: Erst dann bietet das
   iOS-Blatt „Video sichern" (Fotos), AirDrop und Nachrichten mit dem Film
   selbst an (Antons Wunsch 12.09.: „in die Kamera rollen"). Der Film wird
   dafür einmal in den Cache geladen. */
async function shareFile(url: string) {
  try {
    const dir = new Directory(Paths.cache, "share");
    try { dir.create({ idempotent: true }); } catch {}
    const file = await File.downloadFileAsync(url, dir, { idempotent: true });
    await Share.share({ url: file.uri });
  } catch (e) {
    console.warn("[share] fallback to link", e);
    await Share.share({ url });
  }
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
  heroTools: { position: "absolute", right: 14, bottom: 150, gap: 10, zIndex: 5 },
  takeDots: { flexDirection: "row", gap: 6, marginBottom: 2 },
  takeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" },
  takeDotOn: { backgroundColor: colors.text, width: 16 },
  full: { flex: 1, backgroundColor: "#000" },
  fullClose: { position: "absolute", left: 16, zIndex: 3 },
  fullTitle: { position: "absolute", left: 64, right: 64, color: colors.muted, fontSize: 14, textAlign: "center" },
  heroTool: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rec: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, paddingRight: 16, borderRadius: 18 },
  recBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warm, alignItems: "center", justifyContent: "center" },
  recLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  recBar: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  recFill: { height: 4, backgroundColor: colors.warm },
  recTime: { color: colors.muted, fontSize: 13, fontVariant: ["tabular-nums"] },
  bridge: { height: 0, overflow: "hidden" },
  storyImg: { width: "100%", aspectRatio: 9 / 16, borderRadius: radius.card, backgroundColor: colors.bg2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingLeft: 4, paddingRight: 10, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  chipImg: { width: 24, height: 24, borderRadius: 12 },
  chipText: { color: colors.text, fontSize: 13 },
});
