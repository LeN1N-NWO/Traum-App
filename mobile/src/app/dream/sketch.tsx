import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { resetWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
import { selectBeats } from "../../../../src/lib/cut.js";
import { STYLES } from "../../../../src/lib/styles.js";
import { DreamSketch, resolveSketchUrl, sketchAvailable } from "../../../modules/dream-sketch";

/* Die Traum-Skizze (Antons Ansage 24.09.2026): „ohne Credits, durch die
   eigene Rechenleistung auf dem Telefon". Plan:
   docs/plans/2026-09-24-traum-skizze-on-device.md

   Ablauf: Modell da? sonst einmal laden (889 MB) → je Szene ein Bild auf
   der Neural Engine → Kamerafahrt als Film (Core Image) → ins Journal
   (Brücken-Befehl `sketch`). Kein Server, kein Preis, kein Abholer.

   ⚠ Die App muss dabei offen bleiben — iOS hält Neural-Engine-Arbeit im
   Hintergrund an. Deshalb bleibt der Bildschirm wach (useKeepAwake). */
const SCENES = 4;
const STEPS = 20;
const NEGATIVE =
  "text, letters, words, watermark, signature, logo, blurry, deformed, disfigured, extra limbs, " +
  "bad anatomy, ugly, low quality, nsfw, nudity, naked, sexual, gore, blood";

type Phase = "unsupported" | "needsModel" | "downloading" | "loading" | "painting" | "rendering" | "saving" | "failed";

/** Derselbe Traum bekommt denselben Seed — alle Szenen teilen sich damit
 *  eine Handschrift (Farben, Licht), statt fünf fremde Bilder zu werden. */
function seedOf(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h % 2147483647;
}

/** Der Stil als kurzer Zusatz: SD 1.5 liest nur 77 Tokens, und die Szene
 *  soll vorne stehen. Aus „Soft dreamlike realism: gentle haze…" bleibt der
 *  Teil vor dem Doppelpunkt. */
function lookOf(styleId: string) {
  const full = (STYLES as { id: string; prompt?: string }[]).find((s) => s.id === styleId)?.prompt || "";
  return full.split(":")[0].trim() || "dreamlike";
}

export default function DreamSketchScreen() {
  useKeepAwake();
  const router = useRouter();
  const { data, bridge, ask } = useJournal();
  const W = data?.wizard;
  const S = W?.sketch;
  const w = useWizardStore();

  const [phase, setPhase] = useState<Phase>(() =>
    !sketchAvailable() ? "unsupported" : DreamSketch?.modelReady() ? "loading" : "needsModel");
  const [download, setDownload] = useState({ done: 0, total: DreamSketch?.modelBytes() ?? 1 });
  const [scene, setScene] = useState({ i: 0, n: 0 });
  const [step, setStep] = useState(0);
  const [stills, setStills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const a = DreamSketch?.addListener("onDownloadProgress", (e) => { if (alive.current) setDownload({ done: e.done, total: e.total }); });
    const b = DreamSketch?.addListener("onGenerateProgress", (e) => {
      if (!alive.current) return;
      if (e.phase === "loading") setPhase("loading");
      else if (e.steps) { setPhase("painting"); setStep(e.step! / e.steps); }
    });
    return () => {
      alive.current = false;
      a?.remove(); b?.remove();
      // Wer mittendrin geht, hält das Malen an — sonst rechnet das iPhone
      // für einen Bildschirm, den es nicht mehr gibt.
      DreamSketch?.cancelGeneration();
    };
  }, []);

  const run = useCallback(async () => {
    if (!DreamSketch || !W) return;
    started.current = true;
    setError(null); setStills([]); setStep(0);
    try {
      const analysis = w.analysis;
      const arc: string[] = Array.isArray(analysis?.beats) ? analysis.beats : [];
      const beats = arc.length
        ? (selectBeats(analysis, SCENES) as number[]).map((i) => arc[i])
        : w.text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
      const scenes = beats.length ? beats : [w.text];
      const look = lookOf(w.styleId);
      const seed = seedOf(w.text);
      const id = "s_" + Date.now().toString(36);
      const frames: string[] = [];
      setScene({ i: 0, n: scenes.length });
      for (let i = 0; i < scenes.length; i++) {
        if (!alive.current) return;
        setScene({ i: i + 1, n: scenes.length }); setStep(0);
        const prompt = `${scenes[i]}, ${look}, dreamlike atmosphere, cinematic light, highly detailed`;
        const ref = await DreamSketch.generateImage(prompt, NEGATIVE, seed, STEPS, `${id}-${i}.png`);
        frames.push(ref);
        if (alive.current) setStills([...frames]);
      }
      if (!alive.current) return;
      setPhase("rendering");
      const film = await DreamSketch.renderSketch(frames, `${id}.mp4`);
      DreamSketch.unload();
      if (!alive.current) return;
      setPhase("saving");
      const seconds = frames.length * 3.6 - (frames.length - 1) * 0.9;
      const r = await ask({ type: "sketch", sketch: {
        entryId: w.entryId, text: w.text, originalText: w.originalText, analysis: w.analysis,
        styleId: w.styleId, film, stills: frames, seconds,
      } });
      if (r.error || !r.entryId) throw new Error(r.error || "save");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetWizard();
      router.dismissAll();
      router.navigate("/journal");
      const entryId = r.entryId;
      setTimeout(() => router.push(`/journal/${entryId}`), 450);
    } catch (e: any) {
      if (!alive.current || String(e?.message || "").includes("cancelled")) return;
      DreamSketch?.unload();
      setError(String(e?.message || e));
      setPhase("failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [W, w, ask, router]);

  // Modell schon da → sofort los; sonst wartet der Bildschirm auf „Laden".
  useEffect(() => {
    if (phase === "loading" && !started.current && W) run();
  }, [phase, W, run]);

  async function startDownload() {
    if (!DreamSketch) return;
    setPhase("downloading");
    try {
      await DreamSketch.downloadModel();
      if (alive.current) setPhase("loading");
    } catch (e: any) {
      if (!alive.current) return;
      if (String(e?.message || "").includes("cancelled")) { setPhase("needsModel"); return; }
      setError(String(e?.message || e));
      setPhase("failed");
    }
  }

  const fill = (tpl: string | undefined, v: Record<string, string | number>) =>
    Object.entries(v).reduce((s, [k, x]) => s.replace(`{${k}}`, String(x)), tpl || "");
  const mb = (b: number) => Math.round(b / 1_000_000);
  const latest = stills.length ? resolveSketchUrl(stills[stills.length - 1]) : null;

  let status = "";
  let bar: number | null = null;
  if (phase === "downloading") { status = fill(S?.downloading, { done: mb(download.done), total: mb(download.total) }); bar = download.done / Math.max(1, download.total); }
  else if (phase === "loading") { status = S?.loading ?? ""; }
  else if (phase === "painting") { status = fill(S?.painting, { i: scene.i, n: scene.n }); bar = ((scene.i - 1) + step) / Math.max(1, scene.n); }
  else if (phase === "rendering") { status = S?.rendering ?? ""; bar = 1; }
  else if (phase === "saving") { status = S?.saving ?? ""; bar = 1; }

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{S?.title ?? "Dream sketch"}</Text>

        {phase === "unsupported" ? <Text style={styles.lede}>{S?.unsupported}</Text> : null}

        {phase === "needsModel" ? (
          <>
            <Text style={styles.lede}>{S?.lede}</Text>
            <Glass style={styles.card}>
              <Text style={styles.kicker}>{S?.needsModel}</Text>
              <Text style={styles.body}>{S?.modelInfo}</Text>
            </Glass>
            <PrimaryButton label={fill(S?.download, { mb: Math.max(1, mb(DreamSketch?.missingBytes() ?? 0)) })} onPress={startDownload} heavy style={{ flex: 0 }} />
          </>
        ) : null}

        {phase !== "needsModel" && phase !== "unsupported" && phase !== "failed" ? (
          <>
            <View style={styles.stage}>
              {latest ? <Image source={{ uri: latest }} style={styles.still} /> : <View style={[styles.still, styles.stillEmpty]} />}
            </View>
            {stills.length > 1 ? (
              <View style={styles.thumbs}>
                {stills.map((s) => <Image key={s} source={{ uri: resolveSketchUrl(s)! }} style={styles.thumb} />)}
              </View>
            ) : null}
            <Text style={styles.status}>{status}</Text>
            {bar !== null ? (
              <View style={styles.track}><View style={[styles.barFill, { width: `${Math.round(Math.min(1, bar) * 100)}%` }]} /></View>
            ) : null}
            <Text style={styles.hint}>{S?.stayHint}</Text>
            {phase === "downloading" ? (
              <Pressable onPress={() => DreamSketch?.cancelDownload()} hitSlop={10}>
                <Text style={styles.cancel}>{S?.cancel}</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {phase === "failed" ? (
          <>
            <Text style={styles.lede}>{S?.failed}</Text>
            {error ? <Text style={styles.hint}>{error}</Text> : null}
            <PrimaryButton label={S?.retry ?? "Try again"} heavy style={{ flex: 0 }} onPress={() => {
              started.current = false;
              setPhase(DreamSketch?.modelReady() ? "loading" : "needsModel");
            }} />
          </>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.text, marginTop: 8 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  card: { padding: 16, borderRadius: radius.card, gap: 6 },
  kicker: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  stage: { alignItems: "center", marginTop: 6 },
  still: { width: "100%", aspectRatio: 1, borderRadius: radius.card, backgroundColor: colors.panel },
  stillEmpty: { borderWidth: 1, borderColor: colors.panelLine },
  thumbs: { flexDirection: "row", gap: 8, justifyContent: "center" },
  thumb: { width: 54, height: 54, borderRadius: 10 },
  status: { color: colors.text, fontSize: 16, fontWeight: "600", textAlign: "center" },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.panel, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentSoft },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 18, textAlign: "center" },
  cancel: { color: colors.accentSoft, fontSize: 15, textAlign: "center", marginTop: 4 },
  bridge: { height: 0, overflow: "hidden" },
});
