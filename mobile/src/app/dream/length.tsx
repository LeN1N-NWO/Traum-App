import { Host, Slider } from "@expo/ui/swift-ui";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { Easing, FadeIn, ZoomIn } from "react-native-reanimated";
import { Clip } from "@/components/preset-tile";
import { PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { startTap } from "@/store/tap-store";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
// Dieselbe Preisrechnung wie Wizard und Server (src/lib/quote.js, reine Logik).
import { quoteFor } from "../../../../src/lib/quote.js";
import { clampSeconds, flowStationSeconds, FLOW_MIN_STATION } from "../../../../src/lib/video.js";
import { sketchAvailable } from "../../../modules/dream-sketch";

/* Schritt 3, nativ: Modell, Qualität, Tempo, Länge — und der Preis auf dem
   Knopf. Der Auftrag läuft danach im Web-Motor (order.tsx). */
export default function DreamLengthScreen() {
  const router = useRouter();
  const { data, bridge } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const model = W?.models.find((m) => m.id === w.videoModel) ?? W?.models[0];
  const seconds = model ? clampSeconds(model.id, w.seconds) : w.seconds;
  const price = quoteFor({ mode: "film", model: w.videoModel, seconds, quality: w.quality ?? undefined });
  const credits = data?.profile.credits ?? 0;
  const affordable = credits >= price;
  const creditWord = W ? (price === 1 ? W.credit1 : W.creditN) : "credits";

  /* Was von der Geschichte in den Film passt — dieselbe Rechnung wie im
     Web (Step5Style: shotBudget/beatBudget + recommendation). Ohne diese
     Zeile bestellt man 10 s fuer sechs Szenen und wundert sich ueber zwei. */
  /* Seit 12.09. (Antons Ansage) kommt IMMER der ganze Traum in den Film:
     die Zeile sagt, wie eng es wird, und nennt die Laenge, die die Analyse
     empfiehlt (filmSeconds, der Kern). Beim ersten Betreten wird diese
     Empfehlung vorausgewaehlt — der Regler steht dann schon richtig. */
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
     die Stelle, an der er war (components/mascot-tap.tsx). Der Auftrag
     startet SOFORT, der Frosch ist geschenkte Wartezeit, nie ein Tor. */
  const button = useRef<View>(null);
  /* Gedrückthalten öffnet das Info-Blatt (Antons Ansage 26.09.: „fester
     draufdrücken, dann geht das Feld auf und erklärt, was es ist" — mit
     Beispielfilm). Doppelte Haptik wie bei Haptic Touch. */
  const [about, setAbout] = useState<{ title: string; model: string; info: string; clip: string } | null>(null);
  const explain = (a: { title: string; model?: string; info?: string; clip: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 90);
    setAbout({ title: a.title, model: a.model || "", info: a.info || "", clip: a.clip });
  };
  const EXAMPLE: Record<string, string> = {
    standard: "/clips/style-ultrareal.mp4", premium: "/clips/style-goldenage.mp4", sketch: "/clips/style-dreamlike.mp4",
  };
  /* Die Traum-Skizze als dritte Karte (Antons Ansage 24.09.: „kostenlose
     Alternative, die keine Credits kostet, bei der Auswahl der Modelle").
     Nur wo das Gerät sie kann (iPhone 15 Pro+, natives Modul im Bau) —
     sonst gibt es die Karte gar nicht, statt einer, die scheitert. */
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

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{W?.lengthLabel ?? "How long"}</Text>

        <Text style={styles.label}>{W?.modelLabel ?? "Model"}</Text>
        <View style={styles.row}>
          {(W?.models ?? []).map((m) => {
            const on = !sketching && m.id === w.videoModel;
            return (
              <Pressable key={m.id} style={[styles.choice, on && styles.choiceOn]} delayLongPress={380}
                onLongPress={() => explain({ title: m.name, model: m.modelName, info: m.info, clip: EXAMPLE[m.id] ?? EXAMPLE.standard })} onPress={() => { Haptics.selectionAsync(); patchWizard({ videoModel: m.id as any, quality: null, seconds: clampSeconds(m.id, w.seconds), sketch: false }); }}>
                {m.badge ? (
                  <View style={[styles.badge, m.id === "premium" && styles.badgeBest]} pointerEvents="none">
                    <Text style={styles.badgeText}>{m.badge}</Text>
                  </View>
                ) : null}
                <Text style={[styles.choiceTitle, on && styles.on]}>{m.name}</Text>
                <Text style={styles.choiceHint} numberOfLines={2}>{m.hint}</Text>
              </Pressable>
            );
          })}
        </View>
        {canSketch && S?.card ? (
          <Pressable style={[styles.choice, styles.sketchCard, sketching && styles.choiceOn]} delayLongPress={380}
            onLongPress={() => explain({ title: S.card!.name, model: S.card!.model, info: S.card!.info, clip: EXAMPLE.sketch })} onPress={() => { Haptics.selectionAsync(); patchWizard({ sketch: true }); }}>
            <View style={[styles.badge, styles.badgeFree]} pointerEvents="none">
              <Text style={styles.badgeText}>{S.card.badge}</Text>
            </View>
            <View style={styles.sketchHead}>
              <Text style={[styles.choiceTitle, sketching && styles.on]}>{S.card.name}</Text>
              <Text style={styles.sketchPrice}>{S.price}</Text>
            </View>
            <Text style={styles.choiceHint} numberOfLines={2}>{S.card.hint}</Text>
          </Pressable>
        ) : null}
        {W?.holdHint ? <Text style={styles.holdHint}>{W.holdHint}</Text> : null}

        {model && !sketching ? (
          <>
            <Text style={styles.label}>{W?.qualityLabel}</Text>
            <View style={styles.row}>
              {model.qualities.map((q) => {
                const on = (w.quality ?? model.preferred) === q.id;
                return (
                  <Pressable key={q.id} style={[styles.pill, on && styles.choiceOn]} onPress={() => { Haptics.selectionAsync(); patchWizard({ quality: q.id as any }); }}>
                    <Text style={[styles.pillText, on && styles.on]}>{q.name}</Text>
                    <Text style={styles.pillSub}>{q.perSec}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {sketching ? (
          <Text style={styles.fit}>{S!.lede}</Text>
        ) : (
          <>
            <Text style={styles.label}>{W?.paceLabel ?? "Pace"}</Text>
            <View style={styles.row}>
              {(W?.paces ?? []).map((p) => {
                const on = w.pace === p.id;
                return (
                  <Pressable key={p.id} style={[styles.pill, on && styles.choiceOn]} onPress={() => { Haptics.selectionAsync(); patchWizard({ pace: p.id as any }); }}>
                    <Text style={[styles.pillText, on && styles.on]}>{p.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {model && !sketching ? (
          <>
            <View style={styles.secondsRow}><Text style={styles.label}>{W?.lengthLabel}</Text><Text style={styles.seconds}>{seconds} s</Text></View>
            <Host style={{ width: "100%", height: 44 }}>
              <Slider value={seconds} min={model.min} max={model.max} step={model.step} onValueChange={(v) => patchWizard({ seconds: clampSeconds(model.id, v), secondsTouched: true })} />
            </Host>
            {fit ? <Text style={styles.fit}>{fit}</Text> : null}
          </>
        ) : null}

        <View ref={button} collapsable={false} style={{ marginTop: 14 }}>
          <PrimaryButton label={label} onPress={order} heavy style={[{ flex: 0 }, !affordable && !sketching && { opacity: 0.6 }]} />
        </View>
        {!affordable && !sketching ? (
          <Pressable onPress={() => router.push({ pathname: "/dream/paywall", params: { reason: "spent" } })}>
            <Text style={[styles.hint, { color: colors.accentSoft }]}>{W?.noCredits}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
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

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 12 },
  fit: { color: colors.accentSoft, fontSize: 14, lineHeight: 20, marginTop: -2 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.text, marginTop: 8 },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase", marginTop: 8 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  choice: { flex: 1, padding: 14, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, gap: 4 },
  choiceOn: { borderColor: colors.accentSoft, backgroundColor: "rgba(79,156,249,0.14)" },
  choiceTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.text },
  choiceHint: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  on: { color: colors.accentSoft },
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, alignItems: "center", gap: 1 },
  pillText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  pillSub: { color: colors.muted, fontSize: 11, fontVariant: ["tabular-nums"] },
  badge: { position: "absolute", top: -9, right: 10, backgroundColor: colors.accentSoft, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8, zIndex: 1 },
  badgeFree: { backgroundColor: colors.ok },
  badgeBest: { backgroundColor: colors.warm },
  aboutCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  aboutCard: { width: "100%", maxWidth: 440, borderRadius: 28, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.14)" },
  aboutVideo: { width: "100%", aspectRatio: 16 / 10, backgroundColor: colors.panel },
  aboutTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.text },
  aboutModel: { color: colors.accentSoft, fontSize: 12, letterSpacing: 1.4, fontWeight: "700", textTransform: "uppercase" },
  aboutInfo: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  holdHint: { color: colors.faint, fontSize: 12, textAlign: "center", marginTop: -4 },
  sketchCard: { flex: 0, marginTop: 2 },
  sketchHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  sketchPrice: { color: colors.ok, fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  badgeText: { color: colors.bg, fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  secondsRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  seconds: { color: colors.text, fontSize: 22, fontWeight: "600", fontVariant: ["tabular-nums"] },
  primary: { height: 54, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm, marginTop: 14 },
  primaryOff: { backgroundColor: colors.panel },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 13, textAlign: "center" },
  bridge: { height: 0, overflow: "hidden" },
});
