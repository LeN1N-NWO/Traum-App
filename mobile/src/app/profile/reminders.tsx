import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { permission, type Permission } from "@/lib/notifications";
import { colors, TAB_INSET } from "@/theme";

type Wish = {
  morning?: boolean; evening?: boolean; autoRecord?: boolean; reality?: boolean;
  morningTime?: string; eveningTime?: string;
};

const MORNING = ["06:00", "06:30", "07:00", "07:30", "08:00", "09:00"];
const EVENING = ["21:00", "21:30", "22:00", "22:30", "23:00"];

/* Erinnerungen, nativ (13.09.2026). Jede Zeile ein Schalter mit dem, was er
   tut; die Uhrzeit als Knöpfe statt Rad — sechs sinnvolle Zeiten sind
   schneller getippt als ein Rad gedreht. Geplant wird nicht hier, sondern
   von der Startseite aus (lib/use-reminders.ts), sobald sich der Plan in der
   Brücke ändert — eine Stelle, die plant, nie zwei. */
export default function RemindersScreen() {
  const { data, bridge, send } = useJournal();
  const R = data?.reminders;
  const L = R?.labels;
  const [perm, setPerm] = useState<Permission | null>(null);
  useEffect(() => { permission().then(setPerm).catch(() => {}); }, [R]);

  /* ⚠ Der Schalter muss SOFORT umspringen (Antons Finger-Test 17.09.2026).
     Der Weg eines Tipps ist lang: send() → unsichtbarer Brücken-Webview →
     localStorage → neuer Stand → Speicher → Anzeige. Im Simulator dauerte
     das mehrere Sekunden, und in dieser Zeit sah die Seite aus, als wären
     alle Schalter tot — ich habe selbst erst nach drei Versuchen gemerkt,
     dass sie doch reagieren.

     Also hält der Bildschirm den eigenen Wunsch und zeigt ihn statt des
     Plans, solange dieser Bildschirm offen ist. Zurück und wieder herein
     räumt ihn weg (der Bildschirm wird neu gebaut), und weil jeder Befehl
     auch wirklich gespeichert wird, stimmen Wunsch und Stand nach einem
     Augenblick ohnehin überein.

     ⚠ Zwei Wege, die NICHT gehen: an der Plan-Identität festmachen (die
     Brücke schickt alle drei Sekunden ein neues Objekt mit gleichem Inhalt
     — der Wunsch wäre sofort weg) und den Wunsch nach Zeit ablaufen lassen
     (`Date.now()` beim Zeichnen ist unrein, der Lint bricht ab).
     ⚠ Preis dieser Lösung: Ändert etwas ANDERES den Plan, während dieser
     Bildschirm offen ist (etwa „Einwilligung widerrufen"), zeigt er noch
     den eigenen Wunsch. */
  const [wish, setWish] = useState<Wish>({});
  const plan = R?.plan;
  if (!R || !L || !plan) return <View style={styles.screen}><View style={styles.bridge}>{bridge}</View></View>;

  const patch = wish;
  const p = {
    morning: { on: patch.morning ?? plan.morning.on, time: patch.morningTime ?? plan.morning.time },
    evening: { on: patch.evening ?? plan.evening.on, time: patch.eveningTime ?? plan.evening.time },
    autoRecord: patch.autoRecord ?? plan.autoRecord,
    reality: { on: patch.reality ?? plan.reality.on, perDay: plan.reality.perDay },
  };
  const wishFor = (more: Wish) => setWish((w) => ({ ...w, ...more }));

  const set = (value: "morning" | "evening" | "autoRecord", on?: boolean, time?: string) => {
    Haptics.selectionAsync();
    wishFor({
      ...(typeof on === "boolean" ? { [value]: on } : {}),
      ...(time ? { [value === "evening" ? "eveningTime" : "morningTime"]: time } : {}),
    });
    send({ type: "reminderSet", value, wants: on, text: time });
  };

  const times = (key: "morning" | "evening", list: string[], current: string) => (
    <View style={styles.chips}>
      {list.map((t) => (
        <Pressable key={t} onPress={() => set(key, true, t)} style={[styles.chip, current === t && styles.chipOn]}>
          <Text style={[styles.chipText, current === t && styles.chipTextOn]}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: L.title }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.lede}>{L.lede}</Text>
        {perm === "denied" ? (
          <Pressable onPress={() => Linking.openSettings()}>
            <Glass style={[styles.card, styles.warn]} interactive>
              <Text style={styles.warnText}>{L.denied}</Text>
              <Text style={styles.link}>{L.openSettings} ›</Text>
            </Glass>
          </Pressable>
        ) : null}

        <Glass style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.label}>{L.morning}</Text><Text style={styles.hint}>{L.morningHint}</Text></View>
            <Switch value={p.morning.on} onValueChange={(v) => set("morning", v)} trackColor={{ true: colors.accent }} />
          </View>
          {p.morning.on ? times("morning", MORNING, p.morning.time) : null}
        </Glass>

        <Glass style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.label}>{L.autoRecord}</Text><Text style={styles.hint}>{L.autoRecordHint}</Text></View>
            <Switch value={p.autoRecord} onValueChange={(v) => set("autoRecord", v)} trackColor={{ true: colors.accent }} />
          </View>
        </Glass>

        <Glass style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.label}>{L.evening}</Text><Text style={styles.hint}>{L.eveningHint}</Text></View>
            <Switch value={p.evening.on} onValueChange={(v) => set("evening", v)} trackColor={{ true: colors.accent }} />
          </View>
          {p.evening.on ? times("evening", EVENING, p.evening.time) : null}
        </Glass>

        <Glass style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.label}>{L.reality}</Text><Text style={styles.hint}>{L.realityHint}</Text></View>
            <Switch value={p.reality.on} onValueChange={(v) => { Haptics.selectionAsync(); wishFor({ reality: v }); send({ type: "reminders", wants: v, perDay: p.reality.perDay || 2 }); }} trackColor={{ true: colors.accent }} />
          </View>
          {p.reality.on ? (
            <View style={styles.chips}>
              {[1, 2, 3, 4].map((n) => (
                <Pressable key={n} onPress={() => { Haptics.selectionAsync(); send({ type: "reminders", wants: true, perDay: n }); }} style={[styles.chip, p.reality.perDay === n && styles.chipOn]}>
                  <Text style={[styles.chipText, p.reality.perDay === n && styles.chipTextOn]}>{L.perDay[n]}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Glass>
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: TAB_INSET, gap: 12 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 21, marginHorizontal: 4, marginBottom: 4 },
  card: { borderRadius: 18, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { color: colors.text, fontSize: 16, fontWeight: "600" },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  chipText: { color: colors.muted, fontSize: 14, fontVariant: ["tabular-nums"] },
  chipTextOn: { color: colors.bg, fontWeight: "700" },
  warn: { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(242,167,101,0.4)" },
  warnText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  link: { color: colors.warm, fontSize: 14, fontWeight: "600" },
  bridge: { height: 0, overflow: "hidden" },
});
