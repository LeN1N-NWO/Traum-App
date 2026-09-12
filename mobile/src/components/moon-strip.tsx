import { StyleSheet, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import type { MoonData } from "@/store/journal-store";
import { colors } from "@/theme";

/* Der Mond-Streifen im Journal (Antons Wunsch 12.09.2026, Referenzbild):
   fünf Nächte um heute, jede mit ihrer Phase, heute in Glas hervorgehoben,
   darunter der Name der heutigen Phase. Gerechnet aus dem Datum
   (`src/lib/moon.js`) — ortsunabhängig, also ohne Standort-Erlaubnis. */
export function MoonStrip({ M }: { M: MoonData }) {
  const heute = M.strip.find((d) => d.today);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {M.strip.map((d) => {
          const inner = (
            <>
              <Text style={[styles.weekday, d.today && styles.weekdayOn]}>{M.weekdays[d.weekday]}</Text>
              <Moon illum={d.illum} waxing={d.waxing} size={d.today ? 30 : 26} />
              <Text style={[styles.day, d.today && styles.dayOn]}>{d.day}</Text>
            </>
          );
          return (
            <View key={d.key} style={styles.cell}>
              {d.today ? <Glass style={styles.today}>{inner}</Glass> : <View style={styles.plain}>{inner}</View>}
            </View>
          );
        })}
      </View>
      {heute ? <Text style={styles.caption}>{M.tonight} · {heute.label}</Text> : null}
    </View>
  );
}

/* Der Mond ohne Bilddatei und ohne SVG (react-native-svg ist nicht
   installiert und wäre ein Rebuild): eine helle Scheibe, über die ein
   dunkler Kreis geschoben wird; der Behälter beschneidet auf die Mondform.
   `waxing` entscheidet die Seite — auf der Nordhalbkugel leuchtet der
   zunehmende Mond rechts. */
function Moon({ illum, waxing, size }: { illum: number; waxing: boolean; size: number }) {
  const k = Math.max(0, Math.min(1, illum));
  /* Der Schatten deckt bei Neumond die ganze Scheibe (Versatz 0) und liegt
     bei Vollmond vollständig daneben (Versatz = Durchmesser). Zunehmend
     leuchtet rechts, der Schatten wandert also nach links. */
  const shift = (waxing ? -1 : 1) * k * size;
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#e8eefc", borderRadius: size / 2 }]} />
      <View style={{ position: "absolute", top: 0, left: shift, width: size, height: size, borderRadius: size / 2, backgroundColor: colors.bg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cell: { flex: 1, alignItems: "center" },
  plain: { alignItems: "center", gap: 5, paddingVertical: 8 },
  today: { alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 18, minWidth: 58 },
  disc: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  weekday: { color: colors.faint, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" },
  weekdayOn: { color: colors.gold },
  day: { color: colors.muted, fontSize: 14, fontVariant: ["tabular-nums"] },
  dayOn: { color: colors.text, fontWeight: "700" },
  caption: { color: colors.faint, fontSize: 12.5, textAlign: "center" },
});
