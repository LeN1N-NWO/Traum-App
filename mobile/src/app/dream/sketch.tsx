import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import type { SketchPrep } from "@/store/journal-store";
import { resetWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
import { selectBeats } from "../../../../src/lib/cut.js";
import { DreamSketch, resolveSketchUrl, sketchAvailable } from "../../../modules/dream-sketch";

/* Die Traum-Skizze. Seit 25.09. abends (Antons Entscheidung nach dem
   Raster-Test) malt NICHT mehr das iPhone, sondern die Cloud:
     1. EIN 2×2-Raster bei GPT Image 2 „low" — Look-Preset und Fotos der
        Besetzung im Prompt (Brücke: sketchPrep/sketchGrid, Server:
        /api/sketch-grid). Einkauf ≤ $0,015, 3 je Monat gratis, danach
        1 Credit (src/lib/sketchQuota.js).
     2. Das iPhone schneidet die vier Kacheln und macht den Film: Tiefe,
        Kamera, Tiefen-Überblendung, Teilchen (SketchRenderer.swift). Dafür
        braucht es nur das Tiefenmodell (~50 MB) — kein 1-GB-Maler mehr.
   Optional beginnt der Film mit dem echten Foto aus der Besetzung.
   Plan: docs/plans/2026-09-24-traum-skizze-on-device.md (v4/v5) */

const SCENES = 4;

type Phase = "unsupported" | "setup" | "downloading" | "creating" | "rendering" | "saving" | "failed";

function seedOf(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h % 2147483647;
}

export default function DreamSketchScreen() {
  useKeepAwake();
  const router = useRouter();
  const { data, bridge, ask } = useJournal();
  const W = data?.wizard;
  const S = W?.sketch;
  const w = useWizardStore();

  const [phase, setPhase] = useState<Phase>(() => (!sketchAvailable() ? "unsupported" : "setup"));
  const [prep, setPrep] = useState<SketchPrep | null>(null);
  const [usePhoto, setUsePhoto] = useState(true);
  const [download, setDownload] = useState({ done: 0, total: 1 });
  const [tiles, setTiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  /* Dieselbe Szenenauswahl wie der Film-Schnitt; die Signatur-Szene des
     Traums bekommt den Dolly-Zoom. */
  const plan = useMemo(() => {
    const analysis = w.analysis;
    const arc: string[] = Array.isArray(analysis?.beats) ? analysis.beats : [];
    const picked: number[] = arc.length ? (selectBeats(analysis, SCENES) as number[]) : [];
    const fromText = w.text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, SCENES);
    const beats = picked.length ? picked.map((i) => arc[i]) : fromText.length ? fromText : [w.text];
    const sig = typeof analysis?.signature === "number" ? picked.indexOf(analysis.signature) : -1;
    return { beats, vertigo: sig >= 0 ? sig : Math.min(1, beats.length - 1) };
  }, [w.analysis, w.text]);

  const loadPrep = useCallback(async () => {
    const r = await ask({ type: "sketchPrep", sketchPrep: { beats: plan.beats, analysis: w.analysis, styleId: w.styleId, assignmentOverrides: w.assignmentOverrides } });
    const p = (r.result as SketchPrep) ?? null;
    if (alive.current) setPrep(p);
    return p;
  }, [ask, plan.beats, w.analysis, w.styleId, w.assignmentOverrides]);

  useEffect(() => {
    alive.current = true;
    // Nur noch die Tiefe wird geladen — der „Maler" der App ist die Cloud.
    DreamSketch?.selectPainter("cloud");
    const a = DreamSketch?.addListener("onDownloadProgress", (e) => { if (alive.current) setDownload({ done: e.done, total: e.total }); });
    return () => { alive.current = false; a?.remove(); };
  }, []);

  useEffect(() => {
    if (phase === "setup" && W && !prep) loadPrep();
  }, [phase, W, prep, loadPrep]);

  const photo = prep?.refs?.find((r) => r.kind === "person" || r.kind === "pet") ?? null;

  const run = useCallback(async (p: SketchPrep) => {
    if (!DreamSketch || !W) return;
    setError(null); setTiles([]);
    setPhase("creating");
    try {
      // 1. Die Fotos als data:-URIs, in der Reihenfolge der Klauseln im Prompt.
      const refs = await Promise.all(p.refs.map((r) => DreamSketch!.referenceData(r.img)));
      const g = await ask({ type: "sketchGrid", sketchGrid: { prompt: p.prompt, refs } });
      if (g.error === "nocredits") { router.push({ pathname: "/dream/paywall", params: { reason: "spent" } }); setPhase("setup"); return; }
      if (g.error || !g.result?.url) throw new Error(g.error || "grid");
      if (!alive.current) return;

      // 2. Schneiden — vier 512²-Kacheln.
      const id = "s_" + Date.now().toString(36);
      const scenes = await DreamSketch.importGrid(g.result.url, id);
      if (alive.current) setTiles(scenes);

      // 3. Optional: das echte Foto als erste Einstellung.
      let opening: string[] = [];
      if (usePhoto && photo) {
        try { opening = [await DreamSketch.importReference(photo.img, `${id}-ref.png`)]; } catch { opening = []; }
      }

      // 4. Der Film.
      if (!alive.current) return;
      setPhase("rendering");
      const film = await DreamSketch.renderSketch(
        { opening, scenes, morphs: [], particles: p.particles || "dust", vertigo: plan.vertigo, seed: seedOf(w.text), fog: 0.12 },
        `${id}.mp4`,
      );
      if (!alive.current) return;
      setPhase("saving");
      const r = await ask({ type: "sketch", sketch: {
        entryId: w.entryId, text: w.text, originalText: w.originalText, analysis: w.analysis,
        styleId: w.styleId, film: film.film, stills: scenes, seconds: Math.round(film.seconds * 10) / 10,
      } });
      if (r.error || !r.entryId) throw new Error(r.error || "save");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetWizard();
      router.dismissAll();
      router.navigate("/journal");
      const entryId = r.entryId;
      setTimeout(() => router.push(`/journal/${entryId}`), 450);
    } catch (e: any) {
      if (!alive.current) return;
      setError(String(e?.message || e));
      setPhase("failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [W, w, ask, router, plan, usePhoto, photo]);

  async function start() {
    if (!DreamSketch) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const p = prep ?? await loadPrep();
    if (!p) { setError("prep"); setPhase("failed"); return; }
    if (p.cost > p.credits) { router.push({ pathname: "/dream/paywall", params: { reason: "spent" } }); return; }
    if (!DreamSketch.modelReady()) {
      setDownload({ done: 0, total: DreamSketch.missingBytes() || 1 });
      setPhase("downloading");
      try {
        await DreamSketch.downloadModel();
      } catch (e: any) {
        if (!alive.current) return;
        if (String(e?.message || "").includes("cancelled")) { setPhase("setup"); return; }
        setError(String(e?.message || e)); setPhase("failed"); return;
      }
    }
    if (alive.current) run(p);
  }

  const fill = (tpl: string | undefined, v: Record<string, string | number>) =>
    Object.entries(v).reduce((s, [k, x]) => s.replace(`{${k}}`, String(x)), tpl || "");
  const mb = (b: number) => Math.max(1, Math.round(b / 1_000_000));
  const needsDepth = DreamSketch ? !DreamSketch.modelReady() : false;

  let status = "";
  let bar: number | null = null;
  if (phase === "downloading") { status = fill(S?.downloading, { done: mb(download.done), total: mb(download.total) }); bar = download.done / Math.max(1, download.total); }
  else if (phase === "creating") status = S?.creating ?? "";
  else if (phase === "rendering") status = S?.rendering ?? "";
  else if (phase === "saving") status = S?.saving ?? "";

  const working = phase === "downloading" || phase === "creating" || phase === "rendering" || phase === "saving";
  const label = !prep ? (S?.create ?? "Create sketch")
    : prep.cost > 0 ? fill(S?.createCredit, { n: prep.cost }) : (S?.create ?? "Create sketch");

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{S?.title ?? "Dream sketch"}</Text>

        {phase === "unsupported" ? <Text style={styles.lede}>{S?.unsupported}</Text> : null}

        {phase === "setup" ? (
          <>
            <Text style={styles.lede}>{S?.lede}</Text>

            {photo ? (
              <Glass style={styles.photoCard}>
                <Image source={{ uri: photo.img }} style={styles.photo} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.body}>{S?.photoTitle}</Text>
                  <Text style={styles.small}>{fill(S?.photoHint, { name: photo.name })}</Text>
                </View>
                <Switch value={usePhoto} onValueChange={(v) => { Haptics.selectionAsync(); setUsePhoto(v); }} />
              </Glass>
            ) : null}

            {needsDepth ? (
              <Glass style={styles.card}>
                <Text style={styles.kicker}>{S?.needsModel}</Text>
                <Text style={styles.body}>{S?.modelInfo}</Text>
              </Glass>
            ) : null}

            <PrimaryButton label={label} onPress={start} heavy style={{ flex: 0 }} />
            <Text style={styles.hint}>
              {!prep ? S?.preparing : prep.freeLeft > 0 ? fill(S?.freeLeft, { n: prep.freeLeft }) : S?.noneLeft}
            </Text>
          </>
        ) : null}

        {working ? (
          <>
            <View style={styles.grid}>
              {[0, 1, 2, 3].map((i) => (
                tiles[i]
                  ? <Image key={i} source={{ uri: resolveSketchUrl(tiles[i])! }} style={styles.tile} />
                  : <View key={i} style={[styles.tile, styles.tileEmpty]} />
              ))}
            </View>
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
            <PrimaryButton label={S?.retry ?? "Try again"} heavy style={{ flex: 0 }} onPress={() => { setPrep(null); setPhase("setup"); }} />
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
  small: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  tile: { width: "48.5%", aspectRatio: 1, borderRadius: 14, backgroundColor: colors.panel },
  tileEmpty: { borderWidth: 1, borderColor: colors.panelLine },
  status: { color: colors.text, fontSize: 16, fontWeight: "600", textAlign: "center" },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.panel, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentSoft },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 18, textAlign: "center" },
  cancel: { color: colors.accentSoft, fontSize: 15, textAlign: "center", marginTop: 4 },
  bridge: { height: 0, overflow: "hidden" },
  photoCard: { padding: 12, borderRadius: radius.card, flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.panel },
});
