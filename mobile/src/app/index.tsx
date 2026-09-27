import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "@/components/glass";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useJournal } from "@/components/journal-data";
import { Moon } from "@/components/moon-strip";
import { NightSky } from "@/components/night-sky";
import { StreakSheet } from "@/components/streak-sheet";
import { useQuickActions } from "@/lib/use-quick-actions";
import { useReminders } from "@/lib/use-reminders";
import { applyMix, isActive } from "@/lib/sound-engine";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Die Startseite „Der Mond von heute Nacht" (Antons Wahl 27.09.,
   Variantenbuch C1 — nach einem Nachmittag mit C3, das ihm zu voll war):
   oben die Serie (immer antippbar → Serien-Seite), in der Mitte der echte
   Mond der letzten Nacht, darunter die eine Frage und der eine Knopf. Dann
   die Schlaf-Frage und ein Artikel aus dem Wissen — jeden Tag ein anderer.
   Die Träume selbst stehen im Journal, nicht hier.
   „Wovon willst du heute träumen?" steht im Schlaf-Tab; morgens erinnert
   eine Zeile hier an den Vorsatz der letzten Nacht. */
const SLEEP_MOON: Record<number, number> = { 1: 0.12, 2: 0.5, 3: 1 };
const MOON_SIZE = 168;

function greetingKey(hour: number) {
  if (hour < 5) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  useReminders(data, send);
  useQuickActions(data ? { record: data.labels.quickRecord, breathe: data.sleep?.tiles.find((t) => t.id === "breathe")?.title } : null);
  const L = data?.labels ?? {};
  const R = data?.reminders;
  /* Die eine Frage nach der Erinnerung (13.09.2026): solange nie gefragt,
     nichts eingeschaltet und nicht weggeklickt. Ein Tipp = morgens 7:30 an
     (die Erlaubnis fragt use-reminders gleich danach). */
  const askReminder = !!R && R.askedAt === null && !R.homeAskDismissed && !R.plan.morning.on && !R.plan.evening.on && !R.plan.reality.on;
  const home = data?.home;
  /* „Start my mix when the app opens": nativ ohne Geste möglich — einmal
     je Start, sobald der erste Datenstand da ist und noch nichts läuft. */
  const [autoDone, setAutoDone] = useState(false);
  useEffect(() => {
    const mix = data?.sleep?.sounds?.mix;
    if (autoDone || !mix) return;
    setAutoDone(true);
    if (mix.autoStart && !isActive()) applyMix(mix.volumes as Record<"white" | "pink" | "brown", number>);
  }, [data, autoDone]);
  const key = greetingKey(new Date().getHours());
  const evening = key === "Evening" || key === "Night";
  const nightOpen = !evening && home && !home.nightMarked;
  const [board, setBoard] = useState(false);

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none"><NightSky density={0.7} /></View>
      <LinearGradient colors={[colors.sky, "rgba(5,10,20,0)"]} style={styles.glow} pointerEvents="none" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.top}>
          <Text style={styles.greeting}>{L["greeting" + key] ?? ""}</Text>
          {home ? (
            <Pressable style={[styles.pill, home.atRisk && styles.pillRisk]} onPress={() => { Haptics.selectionAsync(); setBoard(true); }} accessibilityRole="button">
              <Text style={styles.pillText}>✦ {home.streakLine}  ›</Text>
            </Pressable>
          ) : null}
        </View>

        {home ? <HeroMoon illum={home.moon.illum} waxing={home.moon.waxing} /> : <View style={{ height: MOON_SIZE + 40 }} />}

        <View style={{ alignItems: "center", gap: 6 }}>
          {home ? <Text style={styles.label}>{home.moon.label}</Text> : null}
          <Text style={styles.title}>{L.homeTitle ?? "What did you dream?"}</Text>
          {!evening && home?.intention ? (
            <Text style={styles.intention}>{L.intentionHeading}: „{home.intention}“</Text>
          ) : null}
        </View>

        <PrimaryButton label={L.homeCta ?? "Record your dream"} heavy onPress={() => router.push("/dream")} style={{ flex: 0 }} />
        {nightOpen ? (
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); send({ type: "blankNight" }); }} hitSlop={8} style={{ alignSelf: "center", marginTop: -4 }}>
            <Text style={styles.blankText}>{L.blankCta}</Text>
          </Pressable>
        ) : null}

        {askReminder && R ? (
          <View style={styles.card}>
            <Text style={styles.question}>{R.labels.homeAskTitle}</Text>
            <Text style={styles.remindText}>{R.labels.homeAskText}</Text>
            <View style={styles.remindRow}>
              <Pressable style={[styles.remindBtn, styles.remindYes]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); send({ type: "reminderSet", value: "morning", wants: true }); }}>
                <SymbolView name="bell.fill" size={15} tintColor={colors.bg} />
                <Text style={styles.remindYesText}>{R.labels.homeAskYes}</Text>
              </Pressable>
              <Pressable style={styles.remindBtn} onPress={() => { Haptics.selectionAsync(); send({ type: "reminderSet", value: "dismissAsk" }); }}>
                <Text style={styles.remindNoText}>{R.labels.homeAskNo}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {home?.rendering ? (
          <Pressable style={styles.line} onPress={() => router.push("/journal")}>
            <View style={styles.dot} /><Text style={styles.lineText}>{L.renderingLine}</Text><Text style={styles.chev}>›</Text>
          </Pressable>
        ) : null}

        {!evening && home ? (
          <View style={styles.card}>
            {home.checkin ? (
              <Pressable style={styles.row} onPress={() => router.push("/journal/atlas")}>
                <Moon illum={SLEEP_MOON[home.checkin] ?? 0.5} waxing size={24} />
                <Text style={[styles.rowText, { flex: 1 }]}>{L.checkinThanks}</Text><Text style={styles.chev}>›</Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.question}>{L.checkinQuestion}</Text>
                <View style={styles.levels}>
                  {home.checkinLevels.map((l) => (
                    <Pressable key={l.level} style={styles.level} onPress={() => { Haptics.selectionAsync(); send({ type: "checkin", level: l.level }); }}>
                      <Moon illum={SLEEP_MOON[l.level] ?? 0.5} waxing size={26} />
                      <Text style={styles.levelText}>{l.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        {evening ? (
          <Pressable style={styles.line} onPress={() => router.push("/sleep")}>
            <SymbolView name="water.waves" size={20} tintColor={colors.accentSoft} /><Text style={[styles.lineText, { flex: 1 }]}>{L.soundsShortcut}</Text><Text style={styles.chev}>›</Text>
          </Pressable>
        ) : null}

        {home?.article ? (
          <Pressable style={styles.card} onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/sleep/[view]", params: { view: "knowledge", open: home.article!.id } }); }}>
            <Text style={styles.label}>{L.articleHeading}</Text>
            <Text style={styles.articleTitle}>{home.article.title}</Text>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={styles.articleMeta}>{home.article.meta}</Text>
              <Text style={styles.articleMore}>{L.articleMore} ›</Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
      {home ? <StreakSheet visible={board} onClose={() => setBoard(false)} home={home} weekdays={data?.journal?.moon?.weekdays ?? []} /> : null}
    </>
  );
}

/* Der Mond der letzten Nacht, groß — derselbe echte Mond wie im Journal
   und auf dem Aufnahmeknopf. Ein warmer Schein atmet langsam um ihn. */
function HeroMoon({ illum, waxing }: { illum: number; waxing: boolean }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.35 + 0.3 * k.value, transform: [{ scale: 1.02 + 0.06 * k.value }] }));
  return (
    <View style={styles.hero}>
      <Animated.View style={[styles.halo, halo]} pointerEvents="none" />
      <Moon illum={illum} waxing={waxing} size={MOON_SIZE} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: TAB_INSET, gap: 16 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  greeting: { color: colors.muted, fontSize: 15 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,198,91,0.35)" },
  pillRisk: { borderColor: colors.warm },
  pillText: { color: colors.gold, fontSize: 13, fontWeight: "600" },
  hero: { alignItems: "center", justifyContent: "center", height: MOON_SIZE + 40, marginTop: 4 },
  halo: { position: "absolute", width: MOON_SIZE * 1.2, height: MOON_SIZE * 1.2, borderRadius: MOON_SIZE, backgroundColor: "rgba(255,213,143,0.08)", shadowColor: "#ffd58f", shadowOpacity: 0.8, shadowRadius: 36, shadowOffset: { width: 0, height: 0 } },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, fontWeight: "600", textTransform: "uppercase" },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 39, color: colors.text, textAlign: "center" },
  intention: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 15, color: colors.muted, textAlign: "center", paddingHorizontal: 16 },
  line: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  lineText: { color: colors.text, fontSize: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warm },
  chev: { color: colors.faint, fontSize: 20, lineHeight: 22 },
  card: { padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { color: colors.text, fontSize: 15 },
  question: { color: colors.text, fontSize: 16, fontWeight: "600" },
  remindText: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -4 },
  remindRow: { flexDirection: "row", gap: 10 },
  remindBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  remindYes: { backgroundColor: colors.warm, borderColor: colors.warm },
  remindYesText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  remindNoText: { color: colors.muted, fontSize: 15 },
  levels: { flexDirection: "row", gap: 8 },
  level: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  levelText: { color: colors.muted, fontSize: 13 },
  blankText: { color: colors.faint, fontSize: 14, paddingVertical: 4 },
  articleTitle: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 24, color: colors.text, marginTop: -4 },
  articleMeta: { color: colors.faint, fontSize: 12.5 },
  articleMore: { color: colors.accentSoft, fontSize: 14, fontWeight: "600" },
  bridge: { height: 0, overflow: "hidden" },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 260, opacity: 0.55 },
});
