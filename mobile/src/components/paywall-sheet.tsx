import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import type { PaywallPlan } from "@/store/journal-store";
import { colors, fonts, radius } from "@/theme";

// Der Platzhalter-Film, solange noch kein eigener da ist (wie Paywall.jsx).
const fallbackFilm = require("../../../src/assets/home-faultier.mp4");

/* ⚠ Karten (presentation: modal) sitzen unter der Statusleiste — oben ein
   fester Abstand, nicht insets.top (der meldet in der Karte trotzdem 59).

/* Das Kaufblatt, nativ — Paywall.jsx 1:1 im Aufbau: Anlass-Überschrift,
   Reiter Abo/Credits, Tarifliste, Ertrag, „immer frei", Knopf, Kontostand.
   Nativ ist das Material: Glas-Kacheln, echte Karte (modal), Haptik.
   Bilder kommen nicht mehr vor — Antons Ansage 12.09. Und die Kacheln
   wachsen mit ihrem Text, statt ihn zu quetschen. */
export function PaywallSheet({ reason = "browse" }: { reason?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, bridge } = useJournal();
  const P = data?.paywall;
  const [tab, setTab] = useState<"sub" | "pack">("sub");
  const [chosen, setChosen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const plans = (tab === "sub" ? P?.subs : P?.packs) ?? [];
  const plan = plans.find((p) => p.id === chosen) ?? plans.find((p) => p.featured) ?? plans[0];

  function switchTab(next: "sub" | "pack") {
    Haptics.selectionAsync();
    setTab(next);
    setChosen(null);
  }
  function pick(p: PaywallPlan) {
    Haptics.selectionAsync();
    setChosen(p.id);
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#2a62d0", "rgba(42,98,208,0)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.hero} pointerEvents="none" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 18, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} accessibilityLabel={P?.close ?? "Close"} style={styles.close} hitSlop={12}>
          <Glass style={styles.closeGlass} interactive><SymbolView name="xmark" size={14} tintColor={colors.text} weight="semibold" /></Glass>
        </Pressable>

        <View style={styles.head}>
          <Text style={styles.brand}>{P?.brand ?? "Dream Rushes"} <Text style={styles.plus}>{P?.plus ?? "PLUS"}</Text></Text>
          <Text style={styles.title}>{P?.headlineFor[reason] ?? P?.headlineFor.browse ?? ""}</Text>
          <Text style={styles.lede}>{P?.ledeFor[reason] ?? P?.ledeFor.browse ?? ""}</Text>
        </View>

        <Glass style={styles.tabs}>
          {([["sub", P?.tabSub ?? "Subscribe"], ["pack", P?.tabPack ?? "Buy credits"]] as const).map(([id, label]) => (
            <Pressable key={id} onPress={() => switchTab(id)} style={[styles.tab, tab === id && styles.tabOn]}>
              <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </Glass>

        <View style={styles.plans}>
          {plans.map((p) => {
            const on = plan?.id === p.id;
            return (
              <Pressable key={p.id} onPress={() => pick(p)}>
                <Glass style={[styles.plan, on && styles.planOn]} tint={on ? "rgba(79,156,249,0.22)" : undefined} interactive>
                  <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  <View style={styles.planBody}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{p.name}</Text>
                      {p.badge ? <View style={styles.badge}><Text style={styles.badgeText}>{p.badge}</Text></View> : null}
                    </View>
                    <Text style={styles.planSub}>{p.sub}</Text>
                  </View>
                  <View style={styles.price}>
                    <Text style={styles.priceMain}>{p.price}</Text>
                    <Text style={styles.pricePer}>{p.per}</Text>
                  </View>
                </Glass>
              </Pressable>
            );
          })}
        </View>
        {tab === "pack" ? <Text style={styles.packNote}>{P?.packNote}</Text> : null}

        {/* Was der Tarif hergibt: die Ware selbst, ein eigener Film im Lauf. */}
        {plan && plan.films > 0 ? (
          <FilmYield urls={P?.films ?? []} backup={P?.filmsBackup ?? []} count={plan.films} upTo={P?.upTo ?? ""} word={plan.filmsWord} />
        ) : null}
        {plan?.yearly ? <Text style={styles.yieldNote}>{P?.yieldYearNote}</Text> : null}

        <View style={styles.included}>
          <Text style={styles.includedTitle}>{P?.included}</Text>
          <View style={styles.chips}>
            {(P?.chips ?? []).map((c) => <Glass key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></Glass>)}
          </View>
          <Text style={styles.freeNote}>{P?.freeNote}</Text>
        </View>

        <View style={styles.foot}>
          <PrimaryButton label={P?.cta ?? "Continue"} heavy onPress={() => { setNote(P?.notYet ?? ""); }} style={{ flex: 0 }} />
          {note ? <Text style={styles.notYet}>{note}</Text> : null}
          <Text style={styles.balance}>{P?.balance}</Text>
        </View>
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </View>
  );
}

/* Die Ertrags-Kachel für Filme: ein eigener Film läuft still in Schleife,
   die Zahl steht groß darauf. Lädt der eigene nicht, kommt das Seed-
   Material, sonst der Platzhalter (showcase.js, dreistufig). */
function FilmYield({ urls, backup, count, upTo, word }: { urls: string[]; backup: string[]; count: number; upTo: string; word: string }) {
  const [failed, setFailed] = useState(0);
  const source = useMemo(() => {
    const list = failed === 0 ? urls : failed === 1 ? backup : [];
    return list.length ? { uri: list[0] } : fallbackFilm;
  }, [urls, backup, failed]);
  const player = useVideoPlayer(source, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { player.loop = true; player.muted = true; player.play(); }, [player]);
  useEffect(() => {
    const sub = player.addListener("statusChange", (e) => { if (e.status === "error") setFailed((f) => Math.min(f + 1, 2)); });
    return () => sub.remove();
  }, [player]);
  return (
    <View style={styles.yield}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <LinearGradient colors={["rgba(5,10,20,0)", "rgba(5,10,20,0.85)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.yieldText}>
        <Text style={styles.yieldUpTo}>{upTo}</Text>
        <Text style={styles.yieldCount}>{count}</Text>
        <Text style={styles.yieldLine}>{word}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { position: "absolute", left: 0, right: 0, top: 0, height: 320, opacity: 0.45 },
  content: { paddingHorizontal: 18, gap: 18 },
  close: { alignSelf: "flex-end" },
  closeGlass: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  head: { gap: 8, marginTop: -6 },
  brand: { color: colors.accentSoft, fontSize: 13, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  plus: { color: colors.gold },
  title: { color: colors.text, fontFamily: fonts.serif, fontSize: 32, lineHeight: 38 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  tabs: { flexDirection: "row", padding: 4, borderRadius: 999 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  tabOn: { backgroundColor: "rgba(255,255,255,0.14)" },
  tabText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  tabTextOn: { color: colors.text },
  plans: { gap: 10 },
  plan: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, paddingHorizontal: 16, borderRadius: radius.card },
  planOn: {},
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.faint, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: colors.accentSoft },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentSoft },
  planBody: { flex: 1, gap: 4 },
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  planName: { color: colors.text, fontSize: 17, fontWeight: "600" },
  badge: { backgroundColor: "rgba(246,198,91,0.18)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: colors.gold, fontSize: 11, fontWeight: "700" },
  planSub: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  price: { alignItems: "flex-end", gap: 2, flexShrink: 0 },
  priceMain: { color: colors.text, fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
  pricePer: { color: colors.faint, fontSize: 11 },
  packNote: { color: colors.faint, fontSize: 13, lineHeight: 18, marginTop: -8 },
  yield: { height: 150, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.bg2, justifyContent: "flex-end" },
  yieldText: { padding: 14, flexDirection: "row", alignItems: "baseline", gap: 8 },
  yieldUpTo: { color: colors.muted, fontSize: 13 },
  yieldCount: { color: colors.text, fontFamily: fonts.serif, fontSize: 40 },
  yieldLine: { color: colors.text, fontSize: 15, flex: 1, flexWrap: "wrap" },
  yieldNote: { color: colors.faint, fontSize: 13, lineHeight: 18, marginTop: -8 },
  included: { gap: 10 },
  includedTitle: { color: colors.text, fontSize: 13, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 },
  chipText: { color: colors.text, fontSize: 13 },
  freeNote: { color: colors.faint, fontSize: 13, lineHeight: 18 },
  foot: { gap: 10, alignItems: "stretch" },
  notYet: { color: colors.warm, fontSize: 13, lineHeight: 18, textAlign: "center" },
  balance: { color: colors.faint, fontSize: 13, textAlign: "center" },
  bridge: { height: 0, overflow: "hidden" },
});
