import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "@/components/glass";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Moonweave } from "@/components/moonweave";
import { useJournal } from "@/components/journal-data";
import { Moon } from "@/components/moon-strip";
import { NightSky } from "@/components/night-sky";
import { StreakSheet } from "@/components/streak-sheet";
import { GiftOpen, GiftPreview } from "@/components/gift-sheet";
import type { GiftCard } from "@/store/journal-store";
import { useQuickActions } from "@/lib/use-quick-actions";
import { useReminders } from "@/lib/use-reminders";
import { applyMix, isActive } from "@/lib/sound-engine";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

/* Die Startseite (Antons Wahl 27.09., Variantenbuch C1 — nach einem
   Nachmittag mit C3, das ihm zu voll war): oben die Serie (immer
   antippbar → Serien-Seite), in der Mitte seit 03.10. DER RING MIT FÄDEN:
   die Nächte dieses Mondes mit ihren Traumbildern, Fäden zwischen gleichen
   Motiven, am Vollmond der Mondfilm — seit 10.10. Moonweave,
   components/moonweave.tsx —, darunter
   die eine Frage und der eine Knopf. Dann
   die Schlaf-Frage und ein Artikel aus dem Wissen — jeden Tag ein anderer.
   Die Träume selbst stehen im Journal, nicht hier.
   „Wovon willst du heute träumen?" steht im Schlaf-Tab; morgens erinnert
   eine Zeile hier an den Vorsatz der letzten Nacht. */
const SLEEP_MOON: Record<number, number> = { 1: 0.12, 2: 0.5, 3: 1 };

function greetingKey(hour: number) {
  if (hour < 5) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
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
  /* Ein frisch erreichtes Geschenk (03.10.) — seit Moonweave (10.10.)
     wartet es als Siegel in der Mitte des Fängers und öffnet sich erst auf
     Tipp („Geschenk öffnen"), statt von selbst aufzuspringen. `giftSeen`
     räumt es danach weg, auch bei „Später". Vergeben ist es da längst
     (streakBoard.js giftFor) — hier wird nur angesehen. */
  const gift = home?.giftReveal ?? null;
  const [giftOpen, setGiftOpen] = useState<number | null>(null);
  const [peek, setPeek] = useState<GiftCard | null>(null);   // Tipp auf die leere Mitte: was der volle Ring bringt
  const showGift = gift && giftOpen === gift.nights ? gift : null;
  const closeGift = (redeem: boolean) => {
    if (!gift) return;
    setGiftOpen(null);
    send({ type: "giftSeen" });
    if (!redeem) return;
    if (gift.target === "journal" && gift.dreamId) router.push({ pathname: "/night/[id]", params: { id: gift.dreamId } });
    else router.push("/dream");
  };

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

        {home ? (
          <Moonweave C={home.cycle} width={width - 32}
            onOpen={(id) => router.push({ pathname: "/night/[id]", params: { id } })}   // im Stapel der Startseite: „Zurück" führt hierher (10.10.)
            onGift={setPeek}
            onOpenGift={() => { if (gift) setGiftOpen(gift.nights); }}
            onFilm={(id) => { if (id) router.push({ pathname: "/night/[id]", params: { id } }); }}
            onSeen={(n) => send({ type: "catcherSeen", value: String(n) })}
            onIntroDone={() => send({ type: "catcherIntro" })}
            action={
              /* Der Knopf gleich unter dem Fänger, vor dem Geschenk-Feld (Antons
                 Wunsch 10.10.: er rutschte unter das Feld, aus dem ersten Bild).
                 Die Überschrift „What did you dream?" entfällt dafür — der Satz
                 über dem Knopf und der Knopf selbst sagen es. */
              <View style={styles.action}>
                {!evening && home.intention ? (
                  <Text style={styles.intention}>{L.intentionHeading}: „{home.intention}“</Text>
                ) : null}
                <PrimaryButton label={L.homeCta ?? "Record your dream"} heavy onPress={() => router.push("/dream")} style={{ flex: 0, alignSelf: "stretch" }} />
                {nightOpen ? (
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); send({ type: "blankNight" }); }} hitSlop={8} style={{ alignSelf: "center" }}>
                    <Text style={styles.blankText}>{L.blankCta}</Text>
                  </Pressable>
                ) : null}
              </View>
            } />
        ) : <View style={{ height: (width - 32) * 568 / 600 + 300 }} />}

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
      {/* Die Geschenk-Karten als Ebenen über allem — bewusst keine Modals (gift-sheet.tsx). */}
      <GiftPreview card={peek} onClose={() => setPeek(null)} />
      <GiftOpen g={showGift} onRedeem={() => closeGift(true)} onLater={() => closeGift(false)} />
      {home ? <StreakSheet visible={board} onClose={() => setBoard(false)} home={home} weekdays={data?.journal?.moon?.weekdays ?? []} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: TAB_INSET, gap: 16 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  greeting: { color: colors.muted, fontSize: 15 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,198,91,0.35)" },
  pillRisk: { borderColor: colors.warm },
  pillText: { color: colors.gold, fontSize: 13, fontWeight: "600" },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, fontWeight: "600", textTransform: "uppercase" },
  action: { alignSelf: "stretch", alignItems: "center", gap: 10, marginTop: 16 },
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
