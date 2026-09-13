import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import * as WebBrowser from "expo-web-browser";
import { useMemo, useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import { colors, fonts } from "@/theme";

/* Das Wissen (13.09.2026) — Antons höheres Ziel: „Wir verbringen so viel Zeit
 * mit Schlafen und untersuchen das so gut wie nicht." Eine Sammlung belegter
 * Befunde zu Träumen und Schlaf, neueste zuerst, jede mit Quelle, Grenze und
 * dem einen Satz, was sie für den eigenen Morgen heißt.
 *
 * Die Inhalte stehen wie alle Texte in src/i18n (knowledge.cards) — die
 * Website bekommt dieselben Karten als Blog-Grundlage. Jede Karte trägt,
 * wie sicher der Befund ist („solide" = repliziert/groß, „vorläufig" =
 * einzelne oder kleine Studie). Kein Heilversprechen, keine Deutung. */
export type KnowledgeCard = {
  id: string; category: string; year: number; journal: string; title: string; text: string; why: string;
  confidence: "solide" | "vorläufig"; cite: string; url: string;
};
export type KnowledgeData = {
  lede: string; mission: string; all: string; why: string; source: string; open: string; disclaimer: string;
  categories: Record<string, string>; confidence: Record<string, string>; cards: KnowledgeCard[];
};

const CAT_ICON: Record<string, SFSymbol> = {
  klartraum: "eye", gedaechtnis: "brain", gehirn: "waveform.path.ecg", albtraum: "cloud.bolt", kreativitaet: "lightbulb", schlaf: "moon.zzz", gesellschaft: "person.3",
};

export function Knowledge({ K }: { K: KnowledgeData }) {
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const cards = useMemo(() => [...K.cards].sort((a, b) => b.year - a.year).filter((c) => !cat || c.category === cat), [K.cards, cat]);
  const cats = useMemo(() => Object.keys(K.categories).filter((k) => K.cards.some((c) => c.category === k)), [K]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.mission}>{K.mission}</Text>
      <Text style={styles.lede}>{K.lede}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ marginHorizontal: -16 }}>
        {[null, ...cats].map((k) => {
          const on = cat === k;
          return (
            <Pressable key={k ?? "all"} onPress={() => { Haptics.selectionAsync(); setCat(k); }} style={[styles.chip, on && styles.chipOn]}>
              {k ? <SymbolView name={CAT_ICON[k] ?? "sparkles"} size={13} tintColor={on ? colors.bg : colors.accentSoft} /> : null}
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{k ? K.categories[k] : K.all}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {cards.map((c) => {
        const expanded = open === c.id;
        const solid = c.confidence === "solide";
        return (
          <Pressable key={c.id} onPress={() => { Haptics.selectionAsync(); LayoutAnimation.easeInEaseOut(); setOpen(expanded ? null : c.id); }} accessibilityRole="button" accessibilityState={{ expanded }}>
            <Glass style={styles.card} interactive>
              <View style={styles.meta}>
                <SymbolView name={CAT_ICON[c.category] ?? "sparkles"} size={13} tintColor={colors.accentSoft} />
                <Text style={styles.metaText}>{K.categories[c.category] ?? c.category} · {c.year}</Text>
                <View style={[styles.pill, solid ? styles.pillSolid : styles.pillSoft]}><Text style={[styles.pillText, { color: solid ? colors.ok : colors.gold }]}>{K.confidence[c.confidence] ?? c.confidence}</Text></View>
              </View>
              <Text style={styles.title}>{c.title}</Text>
              <Text style={styles.text} numberOfLines={expanded ? undefined : 3}>{c.text}</Text>
              {expanded ? (
                <>
                  <View style={styles.why}>
                    <Text style={styles.whyLabel}>{K.why}</Text>
                    <Text style={styles.whyText}>{c.why}</Text>
                  </View>
                  <Pressable onPress={() => { Haptics.selectionAsync(); WebBrowser.openBrowserAsync(c.url).catch(() => {}); }} style={styles.source} accessibilityRole="link">
                    <Text style={styles.sourceLabel}>{K.source}</Text>
                    <Text style={styles.sourceText}>{c.cite} · {c.journal}</Text>
                    <Text style={styles.sourceOpen}>{K.open} ›</Text>
                  </Pressable>
                </>
              ) : null}
            </Glass>
          </Pressable>
        );
      })}
      <Text style={styles.disclaimer}>{K.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  mission: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 28, color: colors.text },
  lede: { color: colors.muted, fontSize: 14.5, lineHeight: 21 },
  chips: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, backgroundColor: colors.panel },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  chipText: { color: colors.text, fontSize: 13.5, fontWeight: "600" },
  chipTextOn: { color: colors.bg },
  card: { borderRadius: 20, padding: 16, gap: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { flex: 1, color: colors.faint, fontSize: 12, letterSpacing: 0.4 },
  pill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  pillSolid: { backgroundColor: "rgba(61,220,151,0.14)" },
  pillSoft: { backgroundColor: "rgba(246,198,91,0.14)" },
  pillText: { fontSize: 11, fontWeight: "700" },
  title: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 25, color: colors.text },
  text: { color: colors.muted, fontSize: 14.5, lineHeight: 21 },
  why: { marginTop: 4, padding: 12, borderRadius: 14, backgroundColor: "rgba(140,192,255,0.08)", gap: 3 },
  whyLabel: { color: colors.accentSoft, fontSize: 11, letterSpacing: 1.4, fontWeight: "700", textTransform: "uppercase" },
  whyText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  source: { gap: 2, paddingTop: 4 },
  sourceLabel: { color: colors.faint, fontSize: 11, letterSpacing: 1.4, fontWeight: "700", textTransform: "uppercase" },
  sourceText: { color: colors.muted, fontSize: 12.5, lineHeight: 17 },
  sourceOpen: { color: colors.accentSoft, fontSize: 13, fontWeight: "600", marginTop: 2 },
  disclaimer: { color: colors.faint, fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: 6 },
});
