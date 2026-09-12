import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { LayoutAnimation, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import type { LucidData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Luzid-Guide, nativ — LucidGuide.jsx im Aufbau: Vorspann, die drei
   Hebel VOR den Methoden (Aspy 2020: der Hebel schlug die Technik), dann
   die Methoden als aufklappbare Karten mit der Trefferquote auf der
   geschlossenen Karte, Quelle am Ende. Keine Kennzahl über den Hebeln
   (Antons Entscheidung 26.08.). Nativ: Glas, Klappen mit Layout-Animation,
   echter Schalter für den Erinnerungs-Wunsch unter den Realitätschecks. */
export function LucidGuide({ G, onReminder }: { G: LucidData; onReminder: (wants: boolean, perDay: number) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  function toggle(id: string) {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.create(260, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setOpen(open === id ? null : id);
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.lede}>{G.lede}</Text>

      <Text style={styles.head}>{G.leversTitle}</Text>
      <View style={styles.levers}>
        {G.levers.map((l) => (
          <Glass key={l.title} style={styles.lever}>
            <Text style={styles.leverTitle}>{l.title}</Text>
            <Text style={styles.leverText}>{l.text}</Text>
          </Glass>
        ))}
      </View>

      <Text style={styles.head}>{G.methodsTitle}</Text>
      <View style={styles.methods}>
        {G.methods.map((m) => {
          const on = open === m.id;
          return (
            <Pressable key={m.id} onPress={() => toggle(m.id)} accessibilityState={{ expanded: on }}>
              <Glass style={styles.method} interactive tint={on ? "rgba(79,156,249,0.10)" : undefined}>
                <View style={styles.methodTop}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.methodHead}>
                      <Text style={styles.methodName}>{m.name}</Text>
                      {m.rate ? <Text style={styles.methodRate}>{m.rate}</Text> : null}
                    </View>
                    <Text style={styles.methodSum}>{m.summary}</Text>
                  </View>
                  <SymbolView name={on ? "chevron.up" : "chevron.down"} size={14} tintColor={colors.faint} />
                </View>
                {on ? (
                  <View style={styles.body}>
                    {m.steps.map((s, i) => (
                      <View key={i} style={styles.step}>
                        <View style={styles.stepN}><Text style={styles.stepNText}>{i + 1}</Text></View>
                        <Text style={styles.stepText}>{s}</Text>
                      </View>
                    ))}
                    <Text style={styles.note}>{m.note}</Text>
                    {m.id === "rc" ? <Reminder G={G} onReminder={onReminder} /> : null}
                  </View>
                ) : null}
              </Glass>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.source}>{G.sourceNote}</Text>
    </View>
  );
}

/* Der Erinnerungs-Wunsch: nur unter den Realitätschecks (die einzige
   Methode am Tag). Sammelt heute NUR den Wunsch ein — reminders.js trennt
   Wunsch und Erlaubnis, weil iOS die Benachrichtigungs-Frage genau einmal
   stellt. Das Planen kommt mit der nativen Benachrichtigungs-Schicht. */
function Reminder({ G, onReminder }: { G: LucidData; onReminder: (wants: boolean, perDay: number) => void }) {
  const [on, setOn] = useState(G.reminder.on);
  const [perDay, setPerDay] = useState(G.reminder.perDay);
  return (
    <View style={styles.remind}>
      <View style={styles.remindRow}>
        <Text style={styles.remindLabel}>{on ? G.reminderActive[perDay] ?? G.reminderAsk : G.reminderAsk}</Text>
        <Switch value={on} onValueChange={(v) => { Haptics.selectionAsync(); setOn(v); onReminder(v, perDay); }} trackColor={{ true: colors.accent }} />
      </View>
      {on ? (
        <View style={styles.perDay} accessibilityLabel={G.reminderPerDay}>
          {Array.from({ length: G.maxPerDay }, (_, i) => i + 1).map((n) => (
            <Pressable key={n} onPress={() => { Haptics.selectionAsync(); setPerDay(n); onReminder(true, n); }} style={[styles.pd, perDay === n && styles.pdOn]}>
              <Text style={[styles.pdText, perDay === n && styles.pdTextOn]}>{n}×</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={styles.remindHint}>{on ? G.reminderSoon : G.reminderWhy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  head: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, marginTop: 8 },
  levers: { gap: 10 },
  lever: { borderRadius: 20, padding: 16, gap: 6 },
  leverTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  leverText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  methods: { gap: 10 },
  method: { borderRadius: 20, padding: 16, gap: 12 },
  methodTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  methodHead: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  methodName: { color: colors.text, fontSize: 16, fontWeight: "600" },
  methodRate: { color: colors.gold, fontSize: 12, fontWeight: "600" },
  methodSum: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  body: { gap: 12, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panelLine },
  step: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 8 },
  stepN: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(140,192,255,0.16)", alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNText: { color: colors.accentSoft, fontSize: 12, fontWeight: "700" },
  stepText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  source: { color: colors.faint, fontSize: 12, lineHeight: 17, marginTop: 6 },
  remind: { gap: 10, borderRadius: 16, padding: 12, backgroundColor: "rgba(255,255,255,0.05)" },
  remindRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  remindLabel: { flex: 1, color: colors.text, fontSize: 14 },
  perDay: { flexDirection: "row", gap: 8 },
  pd: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  pdOn: { backgroundColor: colors.accent },
  pdText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  pdTextOn: { color: colors.bg },
  remindHint: { color: colors.faint, fontSize: 12, lineHeight: 17 },
});
