import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DreamRow } from "@/components/dream-row";
import type { DreamItem } from "@/store/journal-store";
import { colors, radius } from "@/theme";
// Dieselben Tagesregeln wie das Web (reine Logik).
import { localDateKey, monthCells } from "../../../src/lib/dreamDays.js";

/* Der Kalender unter den Träumen (DreamCalendar.jsx): der zweite Weg hinein
   — für die Nacht, an die man sich per Datum erinnert. Geträumte Tage
   leuchten, leere Nächte sind ein blasser Punkt, mehrere Träume an einem
   Tag klappen als Liste auf. */
export function DreamCalendar({ items, blankKeys, labels, onOpen }: { items: DreamItem[]; blankKeys: string[]; labels: Record<string, any>; onOpen: (id: string) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [picked, setPicked] = useState<string | null>(null);
  const byDay = useMemo(() => {
    const m = new Map<string, DreamItem[]>();
    for (const e of items) { const k = localDateKey(new Date(e.createdAt)); m.set(k, [...(m.get(k) ?? []), e]); }
    return m;
  }, [items]);
  const blanks = useMemo(() => new Set(blankKeys), [blankKeys]);
  const cells: (number | null)[] = monthCells(year, month);
  const todayKey = localDateKey(now);
  const atCurrent = year === now.getFullYear() && month === now.getMonth();
  function shift(by: number) { const d = new Date(year, month + by, 1); setYear(d.getFullYear()); setMonth(d.getMonth()); setPicked(null); Haptics.selectionAsync(); }
  function pick(key: string) { const list = byDay.get(key); if (!list) return; Haptics.selectionAsync(); if (list.length === 1) return onOpen(list[0].id); setPicked(key === picked ? null : key); }
  const pickedList = (picked && byDay.get(picked)) || [];

  return (
    <View style={styles.card} accessibilityLabel={labels.calendar}>
      <View style={styles.head}>
        <Pressable onPress={() => shift(-1)} style={styles.nav} accessibilityLabel={labels.calPrev}><SymbolView name="chevron.left" size={14} tintColor={colors.muted} /></Pressable>
        <Text style={styles.title}>{labels.calMonths?.[month]} {year}</Text>
        <Pressable onPress={() => shift(1)} disabled={atCurrent} style={[styles.nav, atCurrent && { opacity: 0.3 }]} accessibilityLabel={labels.calNext}><SymbolView name="chevron.right" size={14} tintColor={colors.muted} /></Pressable>
      </View>
      <View style={styles.grid}>
        {(labels.calWeekdays ?? []).map((wd: string) => <Text key={wd} style={[styles.cell, styles.wd]}>{wd}</Text>)}
        {cells.map((day, i) => {
          if (!day) return <View key={`p${i}`} style={styles.cell} />;
          const key = localDateKey(new Date(year, month, day));
          const list = byDay.get(key);
          const isToday = key === todayKey, isPicked = key === picked, isBlank = !list && blanks.has(key);
          return (
            <Pressable key={key} style={styles.cell} onPress={() => pick(key)} disabled={!list}>
              <View style={[styles.day, list && styles.dreamt, isBlank && styles.blank, isToday && styles.today, isPicked && styles.picked]}>
                <Text style={[styles.dayText, list && styles.dreamtText]}>{day}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {pickedList.length > 1 ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.lede}>{String(labels.calSeveral ?? "").replace("{n}", String(pickedList.length))}</Text>
          {pickedList.map((e) => <DreamRow key={e.id} item={e} months={labels.months} onPress={onOpen} rendering={labels.rendering} untitled={labels.untitled} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, marginTop: 16 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  nav: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  title: { color: colors.text, fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  wd: { color: colors.faint, fontSize: 10, letterSpacing: 0.6, paddingBottom: 6 },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dayText: { color: colors.muted, fontSize: 13 },
  dreamt: { backgroundColor: colors.accentDeep ?? "#2a62d0" },
  dreamtText: { color: colors.text, fontWeight: "600" },
  blank: { borderWidth: 1, borderColor: colors.panelLine },
  today: { borderWidth: 1, borderColor: colors.accentSoft },
  picked: { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.accentSoft },
  lede: { color: colors.faint, fontSize: 11, marginBottom: 4 },
});
