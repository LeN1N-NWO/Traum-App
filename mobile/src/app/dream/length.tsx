import { Button, Host, HStack, Image as SFImage, Menu, Slider, Spacer, Text as SText, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, frame, kerning, lineLimit, minimumScaleFactor, padding } from "@expo/ui/swift-ui/modifiers";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, ZoomIn } from "react-native-reanimated";
import { Clip } from "@/components/preset-tile";
import { PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { startTap } from "@/store/tap-store";
import { type FilmFormat, patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
// Dieselbe Preisrechnung wie Wizard und Server (src/lib/quote.js, reine Logik).
import { quoteFor } from "../../../../src/lib/quote.js";
import { clampSeconds, flowStationSeconds, FLOW_MIN_STATION } from "../../../../src/lib/video.js";
import { sketchAvailable } from "../../../modules/dream-sketch";

/* Schritt 5, nativ: Modell, Qualität, Tempo, Format, Länge — und der Preis
   auf dem Knopf. Der Auftrag läuft danach im Web-Motor (order.tsx).
 *
 * Seit 26.09. (Antons Wahl „A" aus den drei Entwürfen) ALLES auf einem
 * Bildschirm, nichts scrollt:
 *   · drei Karten nebeneinander, nach Preis — Glimpse, Glow, Aurora —,
 *   · Qualität, Tempo und Format als native iOS-Menüs (Vorgabe ist die
 *     günstigste Stufe, video.js `preferred`),
 *   · darunter läuft der Beispielfilm des GEWÄHLTEN Modells mit ein paar
 *     Sätzen dazu (Antons Ansage: „dann begreift jeder, was das Modell
 *     kann" — Gedrückthalten allein fand keiner); ein Tipp öffnet das
 *     ganze Info-Blatt,
 *   · der Längenregler steht immer da, darunter die Empfehlung für DIESEN
 *     Traum, dann der Knopf. */
export default function DreamLengthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, bridge } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const model = W?.models.find((m) => m.id === w.videoModel) ?? W?.models[0];
  const seconds = model ? clampSeconds(model.id, w.seconds) : w.seconds;
  const price = quoteFor({ mode: "film", model: w.videoModel, seconds, quality: w.quality ?? undefined });
  const credits = data?.profile.credits ?? 0;
  const affordable = credits >= price;
  const creditWord = W ? (price === 1 ? W.credit1 : W.creditN) : "credits";

  /* Seit 12.09. (Antons Ansage) kommt IMMER der ganze Traum in den Film:
     die Zeile sagt, wie eng es wird, und nennt die Länge, die die Analyse
     empfiehlt (filmSeconds). Beim ersten Betreten wird diese Empfehlung
     vorausgewählt — der Regler steht dann schon richtig. */
  const recommended = model && w.analysis?.filmSeconds ? clampSeconds(model.id, Number(w.analysis.filmSeconds)) : null;
  const preset = useRef(false);
  useEffect(() => {
    if (preset.current || !recommended) return;
    preset.current = true;
    if (!w.secondsTouched) patchWizard({ seconds: recommended });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommended]);
  const fit = (() => {
    const a = w.analysis; if (!a?.beats?.length || !model || !W) return null;
    const fill = (tpl: string, k: number | string, n?: number | string, m?: number | string) => tpl.replace("1000", String(k)).replace("2000", String(n ?? "")).replace("3000", String(m ?? ""));
    const n = a.beats.length;
    let line: string;
    if (w.pace === "flow") {
      const per = flowStationSeconds(model.id, seconds, n);
      line = per < FLOW_MIN_STATION ? fill(W.flowFast, Math.ceil(n * FLOW_MIN_STATION)) : fill(W.flowAll, n);
    } else {
      line = fill(W.cutAllIn, n, seconds, (Math.round((seconds / n) * 10) / 10).toString().replace(".", ","));
    }
    if (recommended && recommended !== seconds) line += " " + fill(W.cutRecommend, recommended);
    return line;
  })();

  /* Der Knopf wird im Moment des Drucks gemessen (Fensterkoordinaten) —
     danach liegt der Auftragsbildschirm darüber, und der Frosch tippt auf
     die Stelle, an der er war (components/mascot-tap.tsx). */
  const button = useRef<View>(null);
  /* Das Info-Blatt (26.09.): Tipp auf den Film oder Gedrückthalten einer Karte. */
  const [about, setAbout] = useState<{ title: string; model: string; info: string; clip: string } | null>(null);
  const explain = (a: { title: string; model?: string; info?: string; clip: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 90);
    setAbout({ title: a.title, model: a.model || "", info: a.info || "", clip: a.clip });
  };
  const EXAMPLE: Record<string, string> = {
    standard: "/clips/style-ultrareal.mp4", premium: "/clips/style-goldenage.mp4", sketch: "/clips/style-dreamlike.mp4",
  };
  /* Glimpse nur, wo das Gerät ihn kann — sonst gibt es die Karte gar nicht. */
  const [canSketch] = useState(() => sketchAvailable());
  const S = W?.sketch;
  const sketching = canSketch && !!S?.card && w.sketch;
  const label = sketching ? S!.create : `${W?.generate ?? "Create it"} · ${price} ${creditWord}`;
  function order() {
    if (sketching) { router.push("/dream/sketch"); return; }
    if (!affordable) { router.push({ pathname: "/dream/paywall", params: { reason: "spent" } }); return; }
    patchWizard({ seconds, orderId: "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) });
    const go = () => router.push("/dream/order");
    if (!button.current) { go(); return; }
    button.current.measureInWindow((x, y, width, height) => {
      if (width > 0) startTap({ x, y, width, height }, label);
      go();
    });
  }

  /* Die drei Karten, nach Preis (Antons Ansage 26.09.). */
  type Card = { id: string; name: string; badge: string | null; price: string; free?: boolean; on: boolean; hint: string; model: string; info: string; clip: string; pick: () => void };
  const cards: Card[] = [];
  if (canSketch && S?.card) {
    cards.push({ id: "sketch", name: S.card.name, badge: S.card.badge, price: S.price, free: true, on: !!sketching, hint: S.card.hint ?? "", model: S.card.model ?? "", info: S.card.info ?? "", clip: EXAMPLE.sketch,
      pick: () => patchWizard({ sketch: true }) });
  }
  for (const m of W?.models ?? []) {
    const cheapest = m.qualities[0];
    cards.push({ id: m.id, name: m.name, badge: m.badge, price: cheapest ? `${W?.fromWord ?? "from"} ${cheapest.perSec}` : "", on: !sketching && m.id === w.videoModel,
      hint: m.hint, model: m.modelName, info: m.info, clip: EXAMPLE[m.id] ?? EXAMPLE.standard,
      pick: () => patchWizard({ videoModel: m.id as any, quality: null, seconds: clampSeconds(m.id, w.seconds), sketch: false }) });
  }
  const shown = cards.find((c) => c.on) ?? cards[0];
  const quality = model?.qualities.find((q) => q.id === (w.quality ?? model.preferred)) ?? model?.qualities[0];

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <View style={[styles.screen, { paddingTop: insets.top + 56 }]}>
        <View style={styles.cards}>
          {cards.map((c) => (
            <Pressable key={c.id} style={({ pressed }) => [styles.card, c.on && styles.cardOn, pressed && { transform: [{ scale: 0.97 }] }]} delayLongPress={380}
              onPress={() => { Haptics.selectionAsync(); c.pick(); }} onLongPress={() => explain({ title: c.name, model: c.model, info: c.info, clip: c.clip })}
              accessibilityRole="button" accessibilityState={{ selected: c.on }} accessibilityLabel={`${c.name}, ${c.price}`}>
              {c.badge ? (
                <View style={styles.badgeRow} pointerEvents="none">
                  <View style={[styles.badge, c.id === "premium" && styles.badgeBest, c.free && styles.badgeFree]}>
                    <Text style={styles.badgeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{c.badge}</Text>
                  </View>
                </View>
              ) : null}
              <Text style={[styles.cardName, c.on && styles.on]} numberOfLines={1} adjustsFontSizeToFit>{c.name}</Text>
              <Text style={[styles.cardPrice, c.free && { color: colors.ok }]} numberOfLines={2}>{c.price}</Text>
            </Pressable>
          ))}
        </View>

        {model && !sketching ? (
          <View style={styles.chips}>
            <Chip label={W?.qualityLabel ?? "Quality"} value={quality?.name ?? ""} selected={quality?.id ?? ""}
              options={model.qualities.map((q) => ({ id: q.id, name: `${q.name} · ${q.perSec}` }))} onPick={(id) => patchWizard({ quality: id as any })} />
            <Chip label={W?.paceLabel ?? "Pace"} value={W?.paces.find((p) => p.id === w.pace)?.name ?? ""} selected={w.pace}
              options={(W?.paces ?? []).map((p) => ({ id: p.id, name: p.name }))} onPick={(id) => patchWizard({ pace: id as any })} />
            <Chip label={W?.formatLabel ?? "Format"} value={w.format} selected={w.format}
              options={(W?.formats ?? []).map((f) => ({ id: f.id, name: `${f.name} · ${f.hint}` }))} onPick={(id) => patchWizard({ format: id as FilmFormat })} />
          </View>
        ) : null}

        {/* Der Film des gewählten Modells — zeigt, was man bekommt. */}
        {shown ? (
          <Pressable style={styles.show} onPress={() => explain({ title: shown.name, model: shown.model, info: shown.info, clip: shown.clip })}
            accessibilityRole="button" accessibilityLabel={`${shown.name} — ${W?.aboutModel ?? "About this model"}`}>
            <Clip key={shown.clip} url={shown.clip} />
            <LinearGradient colors={["rgba(5,10,20,0)", "rgba(5,10,20,0.35)", "rgba(5,10,20,0.9)"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <Animated.View key={shown.id} entering={FadeIn.duration(220)} style={styles.showText} pointerEvents="none">
              {shown.model ? <Text style={styles.showModel}>{shown.model}</Text> : null}
              <Text style={styles.showName}>{shown.name}</Text>
              <Text style={styles.showHint} numberOfLines={3}>{sketching ? S!.lede : shown.hint}</Text>
              <View style={styles.more}>
                <SymbolView name="info.circle" size={13} tintColor={colors.accentSoft} />
                <Text style={styles.moreText}>{W?.aboutModel ?? "About this model"}</Text>
              </View>
            </Animated.View>
          </Pressable>
        ) : <View style={{ flex: 1 }} />}

        {model && !sketching ? (
          <View style={styles.length}>
            <View style={styles.secondsRow}><Text style={styles.label}>{W?.lengthLabel}</Text><Text style={styles.seconds}>{seconds} s</Text></View>
            <Host style={{ width: "100%", height: 34 }}>
              <Slider value={seconds} min={model.min} max={model.max} step={model.step} onValueChange={(v) => patchWizard({ seconds: clampSeconds(model.id, v), secondsTouched: true })} />
            </Host>
            {fit ? <Text style={styles.fit} numberOfLines={2}>{fit}</Text> : null}
          </View>
        ) : null}

        <View ref={button} collapsable={false}>
          <PrimaryButton label={label} onPress={order} heavy style={[{ flex: 0 }, !affordable && !sketching && { opacity: 0.6 }]} />
        </View>
        {!affordable && !sketching ? (
          <Pressable onPress={() => router.push({ pathname: "/dream/paywall", params: { reason: "spent" } })} hitSlop={8}>
            <Text style={[styles.hint, { color: colors.accentSoft }]}>{W?.noCredits}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.bridge}>{bridge}</View>
      <Modal visible={!!about} transparent animationType="none" onRequestClose={() => setAbout(null)}>
        {about ? (
          <Animated.View entering={FadeIn.duration(160)} style={StyleSheet.absoluteFill}>
            <BlurView intensity={60} tint="systemThickMaterialDark" style={StyleSheet.absoluteFill} />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbout(null)} />
            <View style={styles.aboutCenter} pointerEvents="box-none">
              <Animated.View entering={ZoomIn.duration(260).easing(Easing.out(Easing.back(1.4)))} style={styles.aboutCard}>
                <View style={styles.aboutVideo}><Clip url={about.clip} /></View>
                <View style={{ padding: 18, gap: 6 }}>
                  <Text style={styles.aboutTitle}>{about.title}</Text>
                  {about.model ? <Text style={styles.aboutModel}>{about.model}</Text> : null}
                  <Text style={styles.aboutInfo}>{about.info}</Text>
                  <PrimaryButton label={W?.close ?? "Close"} glow={false} onPress={() => setAbout(null)} style={{ flex: 0, marginTop: 8 }} />
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}

/* Ein Einstellungs-Knopf: Titel klein, Wert groß, Tipp öffnet das native
   iOS-Menü (SwiftUI Menu) mit Haken an der aktuellen Wahl. */
function Chip({ label, value, selected, options, onPick }: { label: string; value: string; selected: string; options: { id: string; name: string }[]; onPick: (id: string) => void }) {
  return (
    <View style={styles.chip}>
      <Host style={StyleSheet.absoluteFill}>
        <Menu label={
          <VStack alignment="leading" spacing={2} modifiers={[frame({ maxWidth: 1000, maxHeight: 1000, alignment: "leading" }), padding({ horizontal: 12 })]}>
            <SText modifiers={[font({ size: 10, weight: "semibold" }), kerning(1.2), foregroundStyle(colors.faint)]}>{label.toUpperCase()}</SText>
            <HStack spacing={4}>
              <SText modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle(colors.text), lineLimit(1), minimumScaleFactor(0.6)]}>{value}</SText>
              <Spacer />
              <SFImage systemName="chevron.up.chevron.down" size={11} color={colors.faint} />
            </HStack>
          </VStack>
        }>
          {options.map((o) => (
            <Button key={o.id} label={o.name} systemImage={o.id === selected ? "checkmark" : undefined}
              onPress={() => { Haptics.selectionAsync(); onPick(o.id); }} />
          ))}
        </Menu>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 12 },
  cards: { flexDirection: "row", gap: 8, marginTop: 8 },
  card: { flex: 1, paddingTop: 14, paddingBottom: 11, paddingHorizontal: 10, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, gap: 3 },
  cardOn: { borderColor: colors.accentSoft, backgroundColor: "rgba(79,156,249,0.14)" },
  cardName: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  cardPrice: { color: colors.muted, fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  on: { color: colors.accentSoft },
  badgeRow: { position: "absolute", top: -9, left: 3, right: 3, alignItems: "center", zIndex: 1 },
  badge: { maxWidth: "100%", backgroundColor: colors.accentSoft, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 6 },
  badgeFree: { backgroundColor: colors.ok },
  badgeBest: { backgroundColor: colors.warm },
  badgeText: { color: colors.bg, fontSize: 8.5, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  chips: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, height: 54, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, overflow: "hidden" },
  show: { flex: 1, minHeight: 150, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.14)" },
  showText: { position: "absolute", left: 16, right: 16, bottom: 14, gap: 3 },
  showModel: { color: colors.accentSoft, fontSize: 11, letterSpacing: 1.4, fontWeight: "700", textTransform: "uppercase" },
  showName: { fontFamily: fonts.serif, fontSize: 28, color: colors.text },
  showHint: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 19 },
  more: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  moreText: { color: colors.accentSoft, fontSize: 13, fontWeight: "600" },
  length: { gap: 2 },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  secondsRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  seconds: { color: colors.text, fontSize: 20, fontWeight: "600", fontVariant: ["tabular-nums"] },
  fit: { color: colors.accentSoft, fontSize: 13, lineHeight: 18 },
  hint: { color: colors.muted, fontSize: 13, textAlign: "center" },
  aboutCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  aboutCard: { width: "100%", maxWidth: 440, borderRadius: 28, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.14)" },
  aboutVideo: { width: "100%", aspectRatio: 16 / 10, backgroundColor: colors.panel },
  aboutTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.text },
  aboutModel: { color: colors.accentSoft, fontSize: 12, letterSpacing: 1.4, fontWeight: "700", textTransform: "uppercase" },
  aboutInfo: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  bridge: { height: 0, overflow: "hidden" },
});
