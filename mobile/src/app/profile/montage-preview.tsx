import { Redirect, Stack } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { buildMontage } from "@/components/glimpse-layer";
import { useJournal } from "@/components/journal-data";
import { colors, radius } from "@/theme";
import { resolveSketchUrl } from "../../../modules/dream-sketch";

/* Messseite für den Sammelfilm (Antons Wahl 10.10., „Weg A"): baut aus den
 * vorhandenen Träumen einen Testfilm — echte Clips, Musik, Titel, Abspann —,
 * misst die Renderzeit und spielt ihn ab. Gespeichert wird nichts.
 *
 * Nur in Entwicklungs-Bauten: dreamrushes://profile/montage-preview */
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_PREVIEW === "1";

export default function MontagePreview() {
  const { data, bridge, ask } = useJournal();
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ film: string; ms: number; seconds: number; clips: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // einmal abspielen, nicht endlos — sonst läuft der Ton weiter, wenn man die Seite vergisst (10.10.)
  const player = useVideoPlayer(out?.film ?? null, (p) => { p.loop = false; p.play(); });
  if (!ENABLED) return <Redirect href="/profile" />;

  const items = (data?.items ?? []).filter((e) => e.films.length || e.images.length || e.poster).slice(0, 12);

  async function run() {
    setBusy(true); setError(null); setOut(null);
    const t0 = Date.now();
    try {
      const dreams = items.map((e) => ({ id: e.id, img: e.poster ?? e.images[0] ?? "", film: e.films.length ? e.films[e.films.length - 1].url : null }));
      const r = await buildMontage({
        key: `test-${Date.now()}`, dreams, style: "dreamlike", mood: "",
        montage: { title: "Deine Träume", subtitle: `RING 1 · TRÄUME 1–${dreams.length}`, endTitle: "Zwölf Träume. Ein Film.", endSub: "DREAM RUSHES" },
      }, ask);
      if (!r) { setError("Zu wenige Clips (mindestens 3)."); return; }
      setOut({ film: resolveSketchUrl(r.film) ?? r.film, ms: Date.now() - t0, seconds: r.seconds, clips: dreams.length });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Sammelfilm" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.muted}>{items.length} Träume mit Film oder Bild · nimmt bis zu 12</Text>
        <Pressable onPress={run} disabled={busy} style={styles.btn}>
          {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnText}>Testfilm bauen</Text>}
        </Pressable>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {out ? (
          <>
            <Text style={styles.muted}>{out.clips} Clips · {out.seconds.toFixed(1)} s Film · gebaut in {(out.ms / 1000).toFixed(1)} s (mit Musik und Downloads)</Text>
            <View style={styles.video}><VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls /></View>
          </>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  muted: { color: colors.faint, fontSize: 13 },
  btn: { paddingVertical: 14, borderRadius: 999, alignItems: "center", backgroundColor: colors.accentDeep },
  btnText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  err: { color: colors.warm, fontSize: 13 },
  video: { width: "100%", aspectRatio: 9 / 16, borderRadius: radius.card, overflow: "hidden", backgroundColor: "#000" },
  bridge: { height: 0, overflow: "hidden" },
});
