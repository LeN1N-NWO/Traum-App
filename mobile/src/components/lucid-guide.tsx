import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useState } from "react";
import { LayoutAnimation, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import type { LucidData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Luzid-Guide, nativ — seit 13.09. als TUTORIAL-STRECKE (Antons
   Vorbild: Moonlys Welcome Guide): eine Zeitleiste am linken Rand, an ihr
   die Schritte; jeder Schritt hat Überschrift und Satz, darunter Karten
   mit Titel und rechts einem Bild. Der Inhalt ist der bewährte (LucidGuide.jsx,
   Aspy 2020): erst die drei Hebel, dann die Methoden (aufklappbar, mit
   Trefferquote), dann die Quelle. Keine Kennzahl über den Hebeln (Antons
   Entscheidung 26.08.).
   ⚠ Die Bilder je Karte sind PLATZHALTER (Zeichen auf Verlauf) — Anton
   erzeugt später je Karte ein Video (Seedream); dann wird aus `art` ein Clip. */
const ART: Record<string, { sf: SFSymbol; from: string; to: string }> = {
  lever0: { sf: "bed.double.fill", from: "#5b6cff", to: "#b9a5ff" },
  lever1: { sf: "alarm.fill", from: "#ff7ab6", to: "#ffd1e6" },
  lever2: { sf: "book.closed.fill", from: "#8cc0ff", to: "#d6e8ff" },
  wbtb: { sf: "sunrise.fill", from: "#f2a765", to: "#ffe0b8" },
  mild: { sf: "brain.head.profile", from: "#7a5cff", to: "#c9b8ff" },
  ssild: { sf: "eye.fill", from: "#4fd6e6", to: "#c6f3f8" },
  rc: { sf: "hand.raised.fill", from: "#3ddc97", to: "#c6f5e0" },
};
function Art({ id }: { id: string }) {
  const a = ART[id] ?? ART.lever2;
  return (
    <View style={styles.art}>
      <LinearGradient colors={[a.from, a.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <SymbolView name={a.sf} size={30} tintColor="rgba(5,10,20,0.75)" />
    </View>
  );
}

export function LucidGuide({ G, onReminder }: { G: LucidData; onReminder: (wants: boolean, perDay: number) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  function toggle(id: string) {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.create(260, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setOpen(open === id ? null : id);
  }
  /* Ein Abschnitt an der Zeitleiste: Kreis links (der erste gefüllt, die
     nächsten als Ring — wie beim Vorbild), Linie darunter, rechts der Kopf. */
  const abschnitt = (i: number, title: string, text: string, body: React.ReactNode, last = false) => (
    <View style={styles.section} key={i}>
      <View style={styles.rail}>
        <View style={[styles.node, i === 0 ? styles.nodeDone : styles.nodeNext]}>
          {i === 0 ? <SymbolView name="checkmark" size={13} tintColor={colors.bg} weight="bold" /> : null}
        </View>
        {!last ? <View style={[styles.line, i === 0 && styles.lineDone]} /> : null}
      </View>
      <View style={styles.sectionBody}>
        <Text style={styles.stepLabel}>{G.tutorialSteps[i] ?? ""}</Text>
        <Text style={styles.head}>{title}</Text>
        <Text style={styles.sectionText}>{text}</Text>
        {body}
      </View>
    </View>
  );
  return (
    <View style={styles.wrap}>
      {abschnitt(0, G.leversTitle, G.lede, (
        <View style={styles.cards}>
          {G.levers.map((l, i) => (
            <Glass key={l.title} style={styles.card}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.kind}>{G.mediaSoon}</Text>
                <Text style={styles.cardTitle}>{l.title}</Text>
                <Text style={styles.cardText}>{l.text}</Text>
              </View>
              <Art id={`lever${i}`} />
            </Glass>
          ))}
        </View>
      ))}
      {abschnitt(1, G.methodsTitle, G.methodsLede, (
        <View style={styles.cards}>
          {G.methods.map((m) => {
            const on = open === m.id;
            return (
              <Pressable key={m.id} onPress={() => toggle(m.id)} accessibilityState={{ expanded: on }}>
                <Glass style={[styles.card, { flexDirection: "column", alignItems: "stretch" }]} interactive tint={on ? "rgba(79,156,249,0.10)" : undefined}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.kind}>{m.rate ? `${G.mediaSoon} · ${m.rate}` : G.mediaSoon}</Text>
                      <Text style={styles.cardTitle}>{m.name}</Text>
                      <Text style={styles.cardText}>{m.summary}</Text>
                    </View>
                    <Art id={m.id} />
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
      ))}
      {abschnitt(2, G.sourceTitle, G.sourceNote, null, true)}
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
  wrap: { gap: 0 },
  section: { flexDirection: "row", gap: 14 },
  rail: { width: 30, alignItems: "center" },
  node: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  nodeDone: { backgroundColor: colors.gold },
  nodeNext: { borderWidth: 2, borderColor: "rgba(255,255,255,0.18)" },
  line: { flex: 1, width: 2, backgroundColor: "rgba(255,255,255,0.10)", marginVertical: 6 },
  lineDone: { backgroundColor: colors.gold },
  sectionBody: { flex: 1, gap: 8, paddingBottom: 30 },
  stepLabel: { color: colors.faint, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginTop: 6 },
  head: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  sectionText: { color: colors.muted, fontSize: 14.5, lineHeight: 21 },
  cards: { gap: 10, marginTop: 6 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 22, padding: 14, paddingLeft: 16 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  kind: { color: colors.faint, fontSize: 12 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 21 },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  art: { width: 72, height: 72, borderRadius: 18, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  body: { gap: 12, paddingTop: 10, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panelLine },
  step: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 8 },
  stepN: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(140,192,255,0.16)", alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNText: { color: colors.accentSoft, fontSize: 12, fontWeight: "700" },
  stepText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, fontStyle: "italic" },
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
