import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, radius } from "@/theme";

/* Die Startseite, nativ (12.09.2026). Als Plakat, wie im Web entschieden
   (09.08.): das Faultier-Video in einer gerahmten Karte, Titel und der eine
   warme Knopf auf ihrer Unterkante. Darunter, auf ruhigem Dunkel: die
   Schlaf-Frage, „Nichts hängengeblieben", die Serie, der letzte Traum.
   Zwei Momente wie im Web: morgens erzählen, abends einschlafen. */
const heroVideo = require("../../../src/assets/home-faultier.mp4");

/* Schlafqualität 1–3 als SF Symbols: eine Regennacht, ein halber Mond, Mond
   mit Sternen. Die Web-Seite nimmt Emoji; nativ sitzt das Symbol im System. */
const SLEEP_SYMBOL: Record<number, import("expo-symbols").SFSymbol> = { 1: "cloud.moon.rain", 2: "moon", 3: "moon.stars.fill" };

function greetingKey(hour: number) {
  if (hour < 5) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, bridge, send } = useJournal();
  const L = data?.labels ?? {};
  const home = data?.home;
  const key = greetingKey(new Date().getHours());
  const evening = key === "Evening" || key === "Night";
  const last = home?.lastId ? data?.items.find((e) => e.id === home.lastId) ?? null : null;
  const nightOpen = !evening && home && !home.nightMarked;

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} contentInsetAdjustmentBehavior="never">
        <View style={styles.top}>
          <Text style={styles.greeting}>{L["greeting" + key] ?? ""}</Text>
          {home && home.streak > 0 ? (
            <View style={[styles.pill, home.atRisk && styles.pillRisk]}>
              <Text style={styles.pillText}>✦ {home.streakLine}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.poster}>
          <HeroVideo />
          <LinearGradient colors={["rgba(5,10,20,0)", "rgba(5,10,20,0.25)", "rgba(5,10,20,0.92)"]} locations={[0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.posterBody}>
            <Text style={styles.title}>{L.homeTitle ?? "What did you dream?"}</Text>
            <Text style={styles.lede}>{L.homeLede ?? ""}</Text>
            <Pressable style={styles.cta} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/dream"); }}>
              <Text style={styles.ctaText}>{L.homeCta ?? "Record it"}</Text>
            </Pressable>
          </View>
        </View>

        {home?.rendering ? (
          <Pressable style={styles.line} onPress={() => router.push("/journal")}>
            <View style={styles.dot} /><Text style={styles.lineText}>{L.renderingLine}</Text><Text style={styles.chev}>›</Text>
          </Pressable>
        ) : null}

        {!evening && home ? (
          <View style={styles.card}>
            {home.checkin ? (
              <Pressable style={styles.row} onPress={() => router.push("/journal/web")}>
                <SymbolView name={SLEEP_SYMBOL[home.checkin] ?? "moon"} size={22} tintColor={colors.accentSoft} />
                <Text style={[styles.rowText, { flex: 1 }]}>{L.checkinThanks}</Text><Text style={styles.chev}>›</Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.question}>{L.checkinQuestion}</Text>
                <View style={styles.levels}>
                  {home.checkinLevels.map((l) => (
                    <Pressable key={l.level} style={styles.level} onPress={() => { Haptics.selectionAsync(); send({ type: "checkin", level: l.level }); }}>
                      <SymbolView name={SLEEP_SYMBOL[l.level] ?? "moon"} size={24} tintColor={colors.accentSoft} />
                      <Text style={styles.levelText}>{l.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        {nightOpen ? (
          <Pressable style={styles.blank} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); send({ type: "blankNight" }); }}>
            <Text style={styles.blankText}>{L.blankCta}</Text>
            <Text style={styles.blankHint}>{L.blankHint}</Text>
          </Pressable>
        ) : null}

        {evening ? (
          <Pressable style={styles.line} onPress={() => router.push("/sleep")}>
            <SymbolView name="water.waves" size={20} tintColor={colors.accentSoft} /><Text style={[styles.lineText, { flex: 1 }]}>{L.soundsShortcut}</Text><Text style={styles.chev}>›</Text>
          </Pressable>
        ) : null}

        {home && home.streak > 0 ? <Text style={styles.note}>{home.streakNote}</Text> : null}

        {last ? (
          <Pressable style={styles.last} onPress={() => router.push({ pathname: "/journal/[id]", params: { id: last.id } })}>
            {last.media ? <Image source={{ uri: last.media.url }} style={styles.lastImg} contentFit="cover" transition={200} /> : <View style={[styles.lastImg, { backgroundColor: colors.sky }]} />}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.label}>{L.lastHeading}</Text>
              <Text style={styles.lastTitle} numberOfLines={1}>{last.title || L.untitled}</Text>
              <Text style={styles.lastText} numberOfLines={2}>{last.tagline || last.text}</Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

function HeroVideo() {
  const player = useVideoPlayer(heroVideo, (p) => { p.loop = true; p.muted = true; p.play(); });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  greeting: { color: colors.muted, fontSize: 15 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  pillRisk: { borderColor: colors.warm },
  pillText: { color: colors.gold, fontSize: 13, fontWeight: "600" },
  poster: { aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  posterBody: { position: "absolute", left: 20, right: 20, bottom: 20, gap: 8 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.text, letterSpacing: -0.3 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  cta: { alignSelf: "flex-start", marginTop: 6, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 999, backgroundColor: colors.warm },
  ctaText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  line: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  lineText: { color: colors.text, fontSize: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warm },
  chev: { color: colors.faint, fontSize: 20, lineHeight: 22 },
  card: { padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { color: colors.text, fontSize: 15 },
  question: { color: colors.text, fontSize: 16, fontWeight: "600" },
  levels: { flexDirection: "row", gap: 8 },
  level: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  levelText: { color: colors.muted, fontSize: 13 },
  emoji: { fontSize: 20 },
  blank: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 2 },
  blankText: { color: colors.text, fontSize: 15 },
  blankHint: { color: colors.faint, fontSize: 12.5 },
  note: { color: colors.faint, fontSize: 13, lineHeight: 19, paddingHorizontal: 4 },
  last: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  lastImg: { width: 64, height: 84, borderRadius: 12 },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, fontWeight: "600", textTransform: "uppercase" },
  lastTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.text },
  lastText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  bridge: { height: 0, overflow: "hidden" },
});
