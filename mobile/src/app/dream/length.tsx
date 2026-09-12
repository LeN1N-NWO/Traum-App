import { Host, Slider } from "@expo/ui/swift-ui";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
// Dieselbe Preisrechnung wie Wizard und Server (src/lib/quote.js, reine Logik).
import { quoteFor } from "../../../../src/lib/quote.js";
import { clampSeconds } from "../../../../src/lib/video.js";

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

  function order() {
    if (!affordable) { router.push({ pathname: "/dream/paywall", params: { reason: "spent" } }); return; }
    patchWizard({ seconds, orderId: "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) });
    router.push("/dream/order");
  }

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{W?.lengthLabel ?? "How long"}</Text>

        <Text style={styles.label}>{W?.modelLabel ?? "Model"}</Text>
        <View style={styles.row}>
          {(W?.models ?? []).map((m) => (
            <Pressable key={m.id} style={[styles.choice, m.id === w.videoModel && styles.choiceOn]} onPress={() => { Haptics.selectionAsync(); patchWizard({ videoModel: m.id as any, quality: null, seconds: clampSeconds(m.id, w.seconds) }); }}>
              <Text style={[styles.choiceTitle, m.id === w.videoModel && styles.on]}>{m.name}</Text>
              <Text style={styles.choiceHint} numberOfLines={2}>{m.hint}</Text>
            </Pressable>
          ))}
        </View>

        {model ? (
          <>
            <Text style={styles.label}>{W?.qualityLabel}</Text>
            <View style={styles.row}>
              {model.qualities.map((q) => {
                const on = (w.quality ?? model.preferred) === q.id;
                return (
                  <Pressable key={q.id} style={[styles.pill, on && styles.choiceOn]} onPress={() => { Haptics.selectionAsync(); patchWizard({ quality: q.id as any }); }}>
                    <Text style={[styles.pillText, on && styles.on]}>{q.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

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

        {model ? (
          <>
            <View style={styles.secondsRow}><Text style={styles.label}>{W?.lengthLabel}</Text><Text style={styles.seconds}>{seconds} s</Text></View>
            <Host style={{ width: "100%", height: 44 }}>
              <Slider value={seconds} min={model.min} max={model.max} step={model.step} onValueChange={(v) => patchWizard({ seconds: clampSeconds(model.id, v) })} />
            </Host>
          </>
        ) : null}

        <PrimaryButton label={`${W?.generate ?? "Create it"} · ${price} ${creditWord}`} onPress={order} heavy style={[{ flex: 0, marginTop: 14 }, !affordable && { opacity: 0.6 }]} />
        {!affordable ? (
          <Pressable onPress={() => router.push({ pathname: "/dream/paywall", params: { reason: "spent" } })}>
            <Text style={[styles.hint, { color: colors.accentSoft }]}>{W?.noCredits}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.text, marginTop: 8 },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase", marginTop: 8 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  choice: { flex: 1, padding: 14, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, gap: 4 },
  choiceOn: { borderColor: colors.accentSoft, backgroundColor: "rgba(79,156,249,0.14)" },
  choiceTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.text },
  choiceHint: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  on: { color: colors.accentSoft },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine },
  pillText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  secondsRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  seconds: { color: colors.text, fontSize: 22, fontWeight: "600", fontVariant: ["tabular-nums"] },
  primary: { height: 54, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm, marginTop: 14 },
  primaryOff: { backgroundColor: colors.panel },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 13, textAlign: "center" },
  bridge: { height: 0, overflow: "hidden" },
});
