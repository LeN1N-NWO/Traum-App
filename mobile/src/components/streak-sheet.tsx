import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { Moon } from "@/components/moon-strip";
import type { HomeData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Die Serien-Seite (Antons Befund 27.09.: „die Streak-Page aus dem Entwurf
   sehe ich in der App nicht"). Vorher gab es sie nur als schlichte Liste,
   und die Pille, die sie öffnet, erschien erst ab der ersten Nacht — jetzt
   ist die Pille immer da und die Seite erzählt:
     · die Zahl der Nächte zählt hoch,
     · die letzten sieben Nächte als Monde (voll = Film-Nacht, halb = nur
       Text oder leer — hält, zählt nicht; seit 03.10.),
     · der Weg zum nächsten Meilenstein als Balken, mit dem Geschenk daran,
     · die ganze Leiter, Stufe für Stufe eingeblendet,
     · die Schlummernächte, die eine verpasste Nacht auffangen.
   Die Belohnungen selbst kommen aus src/lib/streakBoard.js (Antons Zahlen). */
export function StreakSheet({ visible, onClose, home, weekdays }: { visible: boolean; onClose: () => void; home: HomeData; weekdays: string[] }) {
  const B = home.board;
  const next = B.rungs.find((r) => r.state === "next") ?? null;
  const prev = [...B.rungs].reverse().find((r) => r.state === "done")?.nights ?? 0;
  const part = next ? Math.max(0, Math.min(1, (home.streak - prev) / Math.max(1, next.nights - prev))) : 1;

  // Die Zahl zählt hoch, der Balken läuft nach — jedes Mal, wenn die Seite aufgeht.
  const [n, setN] = useState(0);
  const bar = useSharedValue(0);
  useEffect(() => {
    if (!visible) { setN(0); bar.value = 0; return; }
    const target = home.streak;
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 900);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) { clearInterval(t); if (target > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    }, 30);
    bar.value = withDelay(500, withTiming(part, { duration: 1100, easing: Easing.out(Easing.cubic) }));
    return () => clearInterval(t);
  }, [visible, home.streak, part, bar]);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  return (
    <Modal visible={visible} presentationStyle="formSheet" animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ backgroundColor: colors.bg2 }} contentContainerStyle={styles.sheet}>
        <Text style={styles.label}>{B.title}</Text>
        <View style={styles.countRow}>
          <Text style={styles.count}>{n}</Text>
          <Text style={styles.countWord}>{B.nights}</Text>
        </View>

        {/* Die letzten sieben Nächte */}
        <View style={styles.week}>
          {home.week.map((d, i) => (
            <Animated.View key={i} entering={visible ? FadeInDown.delay(120 + i * 70).duration(380) : undefined} style={styles.day}>
              <View style={[styles.dayMoon, d.today && styles.dayToday]}>
                <Moon illum={d.done ? 1 : d.held ? 0.45 : 0.04} waxing size={30} />
              </View>
              <Text style={[styles.dayName, d.today && { color: colors.gold }]}>{weekdays[d.weekday] ?? ""}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Der Weg zum nächsten Meilenstein */}
        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={styles.progressTitle}>{next ? next.title : B.lede}</Text>
            {next?.gift ? <Text style={styles.gift}>🎁 {next.gift}</Text> : null}
          </View>
          <View style={styles.track}><Animated.View style={[styles.fill, barStyle]} /></View>
          <Text style={styles.lede}>{B.lede}</Text>
        </View>

        {B.rungs.map((r, i) => (
          <Animated.View key={r.nights} entering={visible ? FadeInDown.delay(400 + i * 60).duration(360) : undefined}
            style={[styles.rung, r.state === "next" && styles.rungNext, r.state === "far" && { opacity: 0.55 }]}>
            <View style={[styles.check, r.state === "done" && styles.checkDone]}><Text style={[styles.checkText, r.state === "done" && { color: colors.bg }]}>{r.state === "done" ? "✓" : r.nights}</Text></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rungTitle}>{r.title}{r.gift ? <Text style={styles.giftInline}>  🎁 {r.gift}</Text> : null}</Text>
              <Text style={styles.rungReward}>{r.reward}</Text>
            </View>
          </Animated.View>
        ))}
        <View style={styles.shield}><Text style={styles.rungTitle}>🌙 {B.shieldTitle}</Text><Text style={styles.rungReward}>{B.shieldText}</Text></View>
        {B.note ? <Text style={styles.rungReward}>{B.note}</Text> : null}
        <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>OK</Text></Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { padding: 20, paddingTop: 28, gap: 12 },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  countRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  count: { fontFamily: fonts.serif, fontSize: 64, lineHeight: 70, color: colors.gold, fontVariant: ["tabular-nums"], textShadowColor: "rgba(246,198,91,0.55)", textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  countWord: { color: colors.muted, fontSize: 18 },
  week: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  day: { alignItems: "center", gap: 6 },
  dayMoon: { padding: 3, borderRadius: 20 },
  dayToday: { borderWidth: 1, borderColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  dayName: { color: colors.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  progressCard: { padding: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,198,91,0.3)", gap: 10 },
  progressHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  progressTitle: { color: colors.text, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  gift: { color: colors.bg, backgroundColor: colors.gold, fontSize: 12, fontWeight: "700", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden" },
  track: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  lede: { color: colors.muted, fontSize: 13.5 },
  rung: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  rungNext: { borderColor: colors.gold },
  check: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  checkDone: { backgroundColor: colors.gold },
  checkText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  rungTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  giftInline: { color: colors.gold, fontSize: 12 },
  rungReward: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  shield: { marginTop: 4, padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 2 },
  close: { alignSelf: "center", marginTop: 12, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 999, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  closeText: { color: colors.text, fontWeight: "600" },
});
