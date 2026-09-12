import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Glass } from "@/components/glass";
import type { ChecklistData } from "@/store/journal-store";
import { colors } from "@/theme";

/* Die Abend-Checkliste, nativ — SleepChecklist.jsx im Aufbau: Vorspann,
   Fortschritt in Segmenten, „Noch n", ein Raster kleiner Altäre (Antons
   Entwurf 09.08. nach Hatch), fertige Karten dimmen und klappen ihren Text
   weg. Nativ: Glas-Karten, SF Symbols statt eigener Strich-Glyphen, Feder
   beim Drücken, Haptik. Die Haken gehören einer Nacht (Datum). */
const SYMBOLS: Record<string, SFSymbol> = {
  light: "lightbulb", shower: "shower", cool: "thermometer.medium", caffeine: "cup.and.saucer",
  screens: "iphone", relax: "figure.mind.and.body", breathe: "wind",
};

export function SleepChecklist({ C, onSave }: { C: ChecklistData; onSave: (date: string, done: string[]) => void }) {
  const [done, setDone] = useState<string[]>(C.done);
  useEffect(() => { setDone(C.done); }, [C.done.join(",")]);   // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    Haptics.impactAsync(next.length > done.length ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    setDone(next);
    onSave(C.today, next);
  }
  const left = Math.max(0, C.items.length - done.length);

  return (
    <View style={styles.wrap}>
      <Text style={styles.lede}>{C.lede}</Text>
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel={C.progressLabel} accessibilityValue={{ min: 0, max: C.items.length, now: done.length }}>
        {C.items.map((it) => <View key={it.id} style={[styles.seg, done.includes(it.id) && styles.segOn]} />)}
      </View>
      <Text style={styles.remaining}>{C.remaining[left] ?? ""}</Text>
      <View style={styles.grid}>
        {C.items.map((it) => <Card key={it.id} title={it.title} text={it.text} sf={SYMBOLS[it.id] ?? SYMBOLS.light} done={done.includes(it.id)} onPress={() => toggle(it.id)} />)}
      </View>
      <Text style={styles.hint}>{C.hint}</Text>
    </View>
  );
}

function Card({ title, text, sf, done, onPress }: { title: string; text: string; sf: SFSymbol; done: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable style={styles.cell} onPress={onPress} onPressIn={() => { scale.value = withSpring(0.96, { damping: 18, stiffness: 260 }); }} onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }} accessibilityState={{ selected: done }}>
      <Animated.View style={[anim, { flex: 1 }]}>
        <Glass style={[styles.card, done && styles.cardDone]} tint={done ? "rgba(61,220,151,0.10)" : undefined} interactive>
          {done ? <View style={styles.tick}><SymbolView name="checkmark" size={11} tintColor={colors.bg} weight="bold" /></View> : null}
          <View style={styles.art}><SymbolView name={sf} size={24} tintColor={done ? colors.ok : colors.accentSoft} /></View>
          <Text style={[styles.title, done && styles.titleDone]}>{title}</Text>
          {!done ? <Text style={styles.text}>{text}</Text> : null}
        </Glass>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  progress: { flexDirection: "row", gap: 6, marginTop: 4 },
  seg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.10)" },
  segOn: { backgroundColor: colors.ok },
  remaining: { color: colors.faint, fontSize: 13, textAlign: "right" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: { width: "31.5%", flexGrow: 1, minHeight: 150 },
  card: { flex: 1, borderRadius: 20, padding: 11, paddingTop: 14, gap: 6, alignItems: "flex-start" },
  cardDone: { opacity: 0.6 },
  tick: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.ok, alignItems: "center", justifyContent: "center", opacity: 1 },
  art: { alignSelf: "center", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.10)", marginBottom: 2 },
  title: { color: colors.text, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  titleDone: { color: colors.muted, textDecorationLine: "line-through" },
  text: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 6 },
});
