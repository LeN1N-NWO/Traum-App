import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "@/components/glass";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState, useEffect } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { MascotLoader } from "@/components/mascot-loader";
import { Moon } from "@/components/moon-strip";
import { NightSky } from "@/components/night-sky";
import { useQuickActions } from "@/lib/use-quick-actions";
import { useReminders } from "@/lib/use-reminders";
import { applyMix, isActive } from "@/lib/sound-engine";
import type { DreamItem } from "@/store/journal-store";
import { useRecording } from "@/store/recording-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Die Startseite „Deine Nächte" (Antons Wahl 27.09., Variantenbuch C3):
   oben die Serie (antippbar → Meilenstein-Leiter) und der schlafende
   Frosch, dann der eine Knopf „Traum aufnehmen", darunter die eigenen
   Träume als Plakate — man sieht sich selbst, das macht Lust —, die
   Schlaf-Frage mit echten Monden und ein Motiv, das wiederkehrt.
   Das Faultier-Video ist raus (Antons Ansage 27.09.: „komplett sinnlos").
   „Wovon willst du heute träumen?" steht im Schlaf-Tab; morgens erinnert
   die Startseite an den Vorsatz der letzten Nacht. */
const SLEEP_MOON: Record<number, number> = { 1: 0.12, 2: 0.5, 3: 1 };

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
  const recent = (home?.recentIds ?? []).map((id) => data?.items.find((e) => e.id === id)).filter(Boolean) as DreamItem[];
  const nightOpen = !evening && home && !home.nightMarked;
  const [board, setBoard] = useState(false);

  return (
    <>
      {/* Der Schein am oberen Rand (HeroGlow im Web): Himmel, der ins Dunkel ausläuft. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none"><NightSky density={0.6} /></View>
      <LinearGradient colors={[colors.sky, "rgba(5,10,20,0)"]} style={styles.glow} pointerEvents="none" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.top}>
          <Text style={styles.greeting}>{L["greeting" + key] ?? ""}</Text>
          {home && home.streak > 0 ? (
            <Pressable style={[styles.pill, home.atRisk && styles.pillRisk]} onPress={() => { Haptics.selectionAsync(); setBoard(true); }} accessibilityRole="button">
              <Text style={styles.pillText}>✦ {home.streakLine}  ›</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Der Frosch schläft oben (Antons Wunsch 27.09.) — Platzhalter, bis
            sein eigener Loop für die Startseite da ist. */}
        <View style={styles.mascot}><MascotLoader size={150} /></View>

        {!evening && home?.intention ? (
          <View style={styles.intention}>
            <Text style={styles.label}>{L.intentionHeading}</Text>
            <Text style={styles.intentionText}>„{home.intention}“</Text>
          </View>
        ) : null}

        <PrimaryButton label={L.homeCta ?? "Record your dream"} heavy onPress={() => router.push("/dream")} style={{ flex: 0 }} />
        {nightOpen ? (
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); send({ type: "blankNight" }); }} hitSlop={8} style={{ alignSelf: "center" }}>
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

        {/* Deine Nächte: die letzten Träume als Plakate, nur das erste läuft. */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>{L.homeNights}</Text>
          {recent.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
              {recent.map((e, i) => <NightPoster key={e.id} item={e} live={i === 0} labels={L} onPress={() => router.push({ pathname: "/journal/[id]", params: { id: e.id } })} />)}
            </ScrollView>
          ) : (
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 14 }]}>
              <Moon illum={0.08} waxing size={40} />
              <Text style={[styles.rowText, { flex: 1, color: colors.muted }]}>{L.homeNightsEmpty}</Text>
            </View>
          )}
        </View>

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

        {home?.pattern ? (
          <Pressable style={styles.card} onPress={() => { Haptics.selectionAsync(); router.push("/journal/atlas"); }}>
            <Text style={styles.label}>{L.patternHeading}</Text>
            <View style={[styles.row, { marginTop: -4 }]}>
              <Text style={{ fontSize: 22 }}>{home.pattern.emoji}</Text>
              <Text style={[styles.patternText, { flex: 1 }]}>{home.pattern.line}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Pressable>
        ) : null}

        {evening ? (
          <Pressable style={styles.line} onPress={() => router.push("/sleep")}>
            <SymbolView name="water.waves" size={20} tintColor={colors.accentSoft} /><Text style={[styles.lineText, { flex: 1 }]}>{L.soundsShortcut}</Text><Text style={styles.chev}>›</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>

      {/* Die Meilenstein-Leiter — als echtes iOS-Sheet (StreakBoard.jsx). */}
      <Modal visible={board} presentationStyle="formSheet" animationType="slide" onRequestClose={() => setBoard(false)}>
        <ScrollView style={{ backgroundColor: colors.bg2 }} contentContainerStyle={styles.sheet}>
          {home ? (
            <>
              <Text style={styles.sheetLabel}>{home.board.title}</Text>
              <Text style={styles.sheetCount}><Text style={styles.sheetN}>{home.streak}</Text> {home.board.nights}</Text>
              <Text style={styles.sheetLede}>{home.board.lede}</Text>
              {home.board.rungs.map((r) => (
                <View key={r.nights} style={[styles.rung, r.state === "next" && styles.rungNext, r.state === "far" && { opacity: 0.55 }]}>
                  <View style={[styles.check, r.state === "done" && styles.checkDone]}><Text style={styles.checkText}>{r.state === "done" ? "✓" : r.nights}</Text></View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.rungTitle}>{r.title}{r.gift ? <Text style={styles.gift}>  {r.gift}</Text> : null}</Text>
                    <Text style={styles.rungReward}>{r.reward}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.shield}><Text style={styles.rungTitle}>🌙 {home.board.shieldTitle}</Text><Text style={styles.rungReward}>{home.board.shieldText}</Text></View>
            </>
          ) : null}
          <Pressable style={styles.sheetClose} onPress={() => setBoard(false)}><Text style={styles.sheetCloseText}>OK</Text></Pressable>
        </ScrollView>
      </Modal>
    </>
  );
}

/* Ein Traum als Plakat. Nur das erste läuft als Film (stumm, Schleife) —
   mehrere Player gleichzeitig bremsen den Renderer; die anderen zeigen ihr
   Standbild. Während einer Aufnahme steht der Film (recording-store.ts). */
function NightPoster({ item, live, labels, onPress }: { item: DreamItem; live: boolean; labels: Record<string, string>; onPress: () => void }) {
  const film = live ? item.films[item.films.length - 1]?.url ?? null : null;
  const still = item.poster ?? item.images[0] ?? (item.media?.kind === "image" ? item.media.url : null);
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.nposter, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      {film ? <PosterFilm url={film} /> : still ? <Image source={{ uri: still }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
      <LinearGradient colors={["rgba(5,10,20,0)", "rgba(5,10,20,0.85)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
      {item.pending ? <View style={styles.npending}><View style={styles.dot} /></View> : null}
      <Text style={styles.ntitle} numberOfLines={2}>{item.title || labels.untitled}</Text>
    </Pressable>
  );
}
function PosterFilm({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  const rec = useRecording();
  useEffect(() => { player.loop = true; player.muted = true; if (rec) player.pause(); else player.play(); }, [player, rec]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: TAB_INSET, gap: 14 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  greeting: { color: colors.muted, fontSize: 15 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  pillRisk: { borderColor: colors.warm },
  pillText: { color: colors.gold, fontSize: 13, fontWeight: "600" },
  mascot: { alignItems: "center", marginTop: -6, marginBottom: -8 },
  intention: { alignItems: "center", gap: 4, paddingHorizontal: 12 },
  intentionText: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 18, color: colors.text, textAlign: "center" },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.text, paddingHorizontal: 2, marginTop: 6 },
  nposter: { width: 132, height: 196, borderRadius: 18, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  ntitle: { position: "absolute", left: 10, right: 10, bottom: 10, fontFamily: fonts.serif, fontSize: 15, lineHeight: 18, color: colors.text },
  npending: { position: "absolute", top: 10, right: 10 },
  patternText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  poster: { aspectRatio: 4 / 5, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  posterBody: { position: "absolute", left: 20, right: 20, bottom: 20, gap: 8 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.text, letterSpacing: -0.3 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  cta: { flex: 0, alignSelf: "flex-start", marginTop: 6, minWidth: 150 },
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
  level: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  levelText: { color: colors.muted, fontSize: 13 },
  emoji: { fontSize: 20 },
  blank: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 2 },
  blankText: { color: colors.faint, fontSize: 14, paddingVertical: 4 },
  blankHint: { color: colors.faint, fontSize: 12.5 },
  note: { color: colors.faint, fontSize: 13, lineHeight: 19, paddingHorizontal: 4 },
  last: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  lastImg: { width: 64, height: 84, borderRadius: 12 },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, fontWeight: "600", textTransform: "uppercase" },
  lastTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.text },
  lastText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  bridge: { height: 0, overflow: "hidden" },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 260, opacity: 0.55 },
  sheet: { padding: 20, paddingTop: 28, gap: 10 },
  sheetLabel: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  sheetCount: { color: colors.muted, fontSize: 16 },
  sheetN: { color: colors.text, fontSize: 40, fontFamily: fonts.serif },
  sheetLede: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  rung: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  rungNext: { borderColor: colors.accentSoft },
  check: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  checkDone: { backgroundColor: colors.accentDeep },
  checkText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  rungTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  gift: { color: colors.gold, fontSize: 12 },
  rungReward: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  shield: { marginTop: 8, padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 2 },
  sheetClose: { alignSelf: "center", marginTop: 12, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  sheetCloseText: { color: colors.text, fontWeight: "600" },
});
