import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GiftOpen, GiftPreview } from "@/components/gift-sheet";
import { Moonweave, usePreviewCycle } from "@/components/moonweave";
import { colors, TAB_INSET } from "@/theme";

/* Vorschau des Traumfängers (Moonweave, 10.10.) mit allen wichtigen
 * Zuständen: 0–12 Träume, ein ungeöffnetes Geschenk, der Film fertig oder
 * noch in Arbeit, Ring 1–5 (Lagen), das Einwachsen eines neuen Blatts.
 *
 * ⚠ Nur zum Ansehen: keine echten Daten, keine Brücke — hier wird nichts
 * vergeben, gezählt oder gespeichert. Erreichbar nur im Entwicklungsbau
 * oder mit EXPO_PUBLIC_DEV_PREVIEW=1 beim Bauen, per Link
 * dreamrushes://profile/moonweave-preview?n=3&gift=1 (n, gift, film, ring, grow). */
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_PREVIEW === "1";

export default function MoonweavePreview() {
  const q = useLocalSearchParams<{ n?: string; gift?: string; film?: string; ring?: string; grow?: string }>();
  const { width } = useWindowDimensions();
  const [n, setN] = useState(Math.max(0, Math.min(12, Number(q.n ?? 3) || 0)));
  const [gift, setGift] = useState(q.gift === "1");
  const [film, setFilm] = useState(q.film === "1");
  const [ring, setRing] = useState(Number(q.ring ?? 1) || 1);
  const [seen, setSeen] = useState<number | null>(q.grow === "1" ? Math.max(0, (Number(q.ring ?? 1) - 1) * 12 + n - 1) : null);
  const start = (ring - 1) * 12, count = start + n;
  const unseen = gift ? [3, 6, 9].map((g) => start + g).filter((g) => g <= count).pop() ?? null : null;
  const C = usePreviewCycle(n, { ring, unseen, gifted: count, film, seen: seen ?? count });
  const [reveal, setReveal] = useState(false);
  const [card, setCard] = useState(false);
  if (!ENABLED) return <Redirect href="/profile" />;

  const chip = (label: string, on: boolean, press: () => void) => (
    <Pressable key={label} onPress={press} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text></Pressable>
  );
  return (
    <>
      <Stack.Screen options={{ title: "Moonweave", headerLargeTitle: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.row}>{Array.from({ length: 13 }, (_, i) => chip(String(i), i === n, () => { setN(i); setSeen(null); }))}</View>
        <View style={styles.row}>
          {chip("Geschenk wartet", gift, () => setGift((v) => !v))}
          {chip("Film fertig", film, () => setFilm((v) => !v))}
          {chip(`Ring ${ring} → ${ring >= 5 ? 1 : ring + 1}`, ring > 1, () => { setRing((r) => (r >= 5 ? 1 : r + 1)); setSeen(null); })}
          {chip("+1 einwachsen", false, () => { if (n < 12) { setSeen(count); setN(n + 1); } })}
        </View>
        <Moonweave C={C} width={width - 32}
          onOpen={() => {}} onGift={() => setCard(true)} onOpenGift={() => setReveal(true)} onFilm={() => {}}
          onSeen={(c) => setSeen(c)} />
      </ScrollView>
      {/* Die echten Karten mit Platzhalter-Texten — nur zum Ansehen */}
      <GiftPreview card={card ? { kind: "ring", title: "Preview · ring film", sub: "Preview only", eyebrow: `${n} / 12`, progress: n / 12, progressText: `${n} / 12`, foot: "", close: "Close", num: 12, ringFilled: n } : null} onClose={() => setCard(false)} />
      <GiftOpen g={reveal && unseen ? { nights: unseen, kind: "glimpse", credits: 1, title: `Dream no. ${unseen}!`, label: "Preview gift", sub: "Preview only — nothing is granted.", expires: null, tapToOpen: "Tap to open", redeem: "Close", later: "Later", target: "dream", dreamId: null } : null}
        onRedeem={() => { setReveal(false); setGift(false); }} onLater={() => { setReveal(false); setGift(false); }} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: TAB_INSET, gap: 14 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextOn: { color: colors.bg, fontWeight: "700" },
});
