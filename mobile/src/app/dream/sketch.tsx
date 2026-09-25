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
import { sketchFallback } from "../../../../src/lib/sketchPrompt.js";
import { STYLES } from "../../../../src/lib/styles.js";
import { DreamSketch, resolveSketchUrl, sketchAvailable, type Painter } from "../../../modules/dream-sketch";

/* Die Traum-Skizze (Antons Ansage 24.09.2026): „ohne Credits, durch die
   eigene Rechenleistung auf dem Telefon". Plan:
   docs/plans/2026-09-24-traum-skizze-on-device.md

   Ablauf seit 25.09. („alle Schritte übernehmen — das Bestmögliche"):
     Einrichten: Maler wählen (Apple SD 1.5 oder DreamShaper), eigenes Foto
       an/aus; im Hintergrund werden die Szenen zu SD-Stichworten (sketchPrep)
     Malen: erst die Szenen (sofort sichtbar), dann das Foto, das zu träumen
       beginnt (Bild-zu-Bild), dann die Morph-Zwischenbilder je Übergang
     Film: Kamera, Tiefe, Nebel, Teilchen (SketchRenderer.swift) → Journal

   ⚠ Die App muss dabei offen bleiben — iOS hält Neural-Engine-Arbeit im
   Hintergrund an. Deshalb bleibt der Bildschirm wach (useKeepAwake). */
const SCENES = 4;
const STEPS = 20;
/* Zwischenbilder je Übergang. Jedes kostet so viel Rechenzeit wie eine
   Szene — 2 ist der Kompromiss, bis Antons Stoppuhr vom iPhone da ist. */
const MORPHS = 2;
/* Wie stark das eigene Foto umgemalt wird: erst leicht, dann kräftig. Danach
   löst es sich in die erste Szene auf. */
const PHOTO_STRENGTHS = [0.42, 0.64];
const NEGATIVE =
  "text, letters, words, watermark, signature, logo, blurry, deformed, disfigured, extra limbs, " +
  "bad anatomy, ugly, low quality, nsfw, nudity, naked, sexual, gore, blood";

type Phase = "unsupported" | "setup" | "downloading" | "loading" | "painting" | "rendering" | "saving" | "failed";
type Job = { kind: "scene" | "photo" | "morph"; a: number; b: number; done: number; total: number };

/** Derselbe Traum bekommt denselben Seed — alle Szenen teilen sich damit
 *  eine Handschrift, und nur so gelingt der Morph (gleiches Rauschen,
 *  gemischter Prompt = Zwischenbild). */
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

  const [phase, setPhase] = useState<Phase>(() => (!sketchAvailable() ? "unsupported" : "setup"));
  const [painters, setPainters] = useState<Painter[]>(() => DreamSketch?.painters() ?? []);
  const [painterId, setPainterId] = useState(() => DreamSketch?.painter() ?? "sd15");
  const [prep, setPrep] = useState<SketchPrep | null>(null);
  const [usePhoto, setUsePhoto] = useState(true);
  const [download, setDownload] = useState({ done: 0, total: 1 });
  const [job, setJob] = useState<Job | null>(null);
  const [step, setStep] = useState(0);
  const [stills, setStills] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const prepPromise = useRef<Promise<SketchPrep | null> | null>(null);

  /* Welche Szenen: dieselbe Auswahl wie der Film-Schnitt (selectBeats), und
     die Signatur-Szene des Traums bekommt den Dolly-Zoom. */
  const plan = useMemo(() => {
    const analysis = w.analysis;
    const arc: string[] = Array.isArray(analysis?.beats) ? analysis.beats : [];
    const picked: number[] = arc.length ? (selectBeats(analysis, SCENES) as number[]) : [];
    const fromText = w.text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
    const beats = picked.length ? picked.map((i) => arc[i]) : fromText.length ? fromText : [w.text];
    const sig = typeof analysis?.signature === "number" ? picked.indexOf(analysis.signature) : -1;
    return { beats, vertigo: sig >= 0 ? sig : Math.floor(beats.length / 2) };
  }, [w.analysis, w.text]);

  const loadPrep = useCallback(() => {
    prepPromise.current ??= ask({ type: "sketchPrep", sketchPrep: { beats: plan.beats, analysis: w.analysis, assignmentOverrides: w.assignmentOverrides } })
      .then((r) => (r.result as SketchPrep) ?? null)
      .catch(() => null);
    return prepPromise.current;
  }, [ask, plan.beats, w.analysis, w.assignmentOverrides]);

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

  // Schon beim Einrichten die Szenen lesen lassen — beim Tippen auf „Malen" liegen sie meist bereit.
  useEffect(() => {
    if (phase !== "setup" || !W) return;
    loadPrep().then((p) => { if (alive.current) setPrep(p); });
  }, [phase, W, loadPrep]);

  const painter = painters.find((p) => p.id === painterId) ?? painters[0];
  const ref = prep?.refs?.[0] ?? null;

  function choosePainter(id: string) {
    if (!DreamSketch || id === painterId) return;
    Haptics.selectionAsync();
    DreamSketch.selectPainter(id);
    setPainterId(id);
    setPainters(DreamSketch.painters());
  }

  const run = useCallback(async () => {
    if (!DreamSketch || !W) return;
    setError(null); setStills([]); setPreview(null); setStep(0);
    setPhase("loading");
    try {
      const p: SketchPrep = (await loadPrep())
        ?? { ...sketchFallback(plan.beats, w.analysis?.people ?? []), source: "fallback", refs: [] };
      const look = lookOf(w.styleId);
      const prompts = p.scenes.map((s) => `${s}, ${look}, dreamlike atmosphere, cinematic light, highly detailed`);
      const n = prompts.length;
      const seed = seedOf(w.text);
      const id = "s_" + Date.now().toString(36);
      const photo = usePhoto && p.refs?.[0] ? p.refs[0] : null;
      const total = n + MORPHS * (n - 1) + (photo ? PHOTO_STRENGTHS.length : 0);
      let done = 0;
      const paint = async (kind: Job["kind"], a: number, b: number, prompt: string, name: string, options?: Parameters<NonNullable<typeof DreamSketch>["generateImage"]>[5]) => {
        if (!alive.current) throw new Error("cancelled");
        setJob({ kind, a, b, done, total }); setStep(0);
        const out = await DreamSketch!.generateImage(prompt, NEGATIVE, seed, STEPS, name, options);
        done += 1;
        if (alive.current) setPreview(out);
        return out;
      };

      // 1. Die Szenen — das Wichtigste zuerst, damit man sie früh sieht.
      const frames: string[] = [];
      for (let i = 0; i < n; i++) {
        frames.push(await paint("scene", i + 1, n, prompts[i], `${id}-${i}.png`));
        if (alive.current) setStills([...frames]);
      }

      // 2. Das eigene Foto träumt: Bild-zu-Bild auf die erste Szene hin.
      let opening: string[] = [];
      if (photo) {
        try {
          const refName = await DreamSketch.importReference(photo.img, `${id}-ref.png`);
          const dreamt: string[] = [];
          for (let k = 0; k < PHOTO_STRENGTHS.length; k++) {
            dreamt.push(await paint("photo", k + 1, PHOTO_STRENGTHS.length, prompts[0], `${id}-p${k}.png`, { startImage: refName, strength: PHOTO_STRENGTHS[k] }));
          }
          opening = [refName, ...dreamt];
        } catch (e: any) {
          if (String(e?.message || "").includes("cancelled")) throw e;
          // Foto nicht lesbar (offline, gelöscht) — der Film beginnt dann ohne.
          done += PHOTO_STRENGTHS.length;
        }
      }

      // 3. Morph: gleiches Rauschen, Prompt wandert von Szene i zu i+1.
      const morphs: string[][] = [];
      for (let i = 1; i < n; i++) {
        const chain: string[] = [];
        for (let k = 1; k <= MORPHS; k++) {
          chain.push(await paint("morph", i, i + 1, prompts[i - 1], `${id}-m${i}-${k}.png`, { morphPrompt: prompts[i], morphWeight: k / (MORPHS + 1) }));
        }
        morphs.push(chain);
      }

      if (!alive.current) return;
      setPhase("rendering");
      const film = await DreamSketch.renderSketch(
        { opening, scenes: frames, morphs, particles: p.particles || "dust", vertigo: plan.vertigo, seed },
        `${id}.mp4`,
      );
      DreamSketch.unload();
      if (!alive.current) return;
      setPhase("saving");
      const r = await ask({ type: "sketch", sketch: {
        entryId: w.entryId, text: w.text, originalText: w.originalText, analysis: w.analysis,
        styleId: w.styleId, film: film.film, stills: frames, seconds: Math.round(film.seconds * 10) / 10,
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
  }, [W, w, ask, router, loadPrep, plan, usePhoto]);

  async function start() {
    if (!DreamSketch) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (DreamSketch.modelReady()) { run(); return; }
    setDownload({ done: 0, total: painter?.total ?? 1 });
    setPhase("downloading");
    try {
      await DreamSketch.downloadModel();
      if (!alive.current) return;
      setPainters(DreamSketch.painters());
      run();
    } catch (e: any) {
      if (!alive.current) return;
      setPainters(DreamSketch.painters());
      if (String(e?.message || "").includes("cancelled")) { setPhase("setup"); return; }
      setError(String(e?.message || e));
      setPhase("failed");
    }
  }

  const fill = (tpl: string | undefined, v: Record<string, string | number>) =>
    Object.entries(v).reduce((s, [k, x]) => s.replace(`{${k}}`, String(x)), tpl || "");
  const mb = (b: number) => Math.round(b / 1_000_000);
  const latest = preview ? resolveSketchUrl(preview) : null;

  let status = "";
  let bar: number | null = null;
  if (phase === "downloading") { status = fill(S?.downloading, { done: mb(download.done), total: mb(download.total) }); bar = download.done / Math.max(1, download.total); }
  else if (phase === "loading") { status = S?.loading ?? ""; }
  else if (phase === "painting" && job) {
    status = job.kind === "scene" ? fill(S?.painting, { i: job.a, n: job.b })
      : job.kind === "photo" ? (S?.dreamingPhoto ?? "")
      : fill(S?.morphing, { a: job.a, b: job.b });
    bar = (job.done + step) / Math.max(1, job.total);
  }
  else if (phase === "rendering") { status = S?.rendering ?? ""; bar = 1; }
  else if (phase === "saving") { status = S?.saving ?? ""; bar = 1; }

  const working = phase === "downloading" || phase === "loading" || phase === "painting" || phase === "rendering" || phase === "saving";

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{S?.title ?? "Dream sketch"}</Text>

        {phase === "unsupported" ? <Text style={styles.lede}>{S?.unsupported}</Text> : null}

        {phase === "setup" ? (
          <>
            <Text style={styles.lede}>{S?.lede}</Text>

            <Text style={styles.label}>{S?.painterTitle}</Text>
            <View style={styles.row}>
              {painters.map((p) => {
                const on = p.id === painterId;
                const txt = S?.painters?.[p.id];
                return (
                  <Pressable key={p.id} style={[styles.choice, on && styles.choiceOn]} onPress={() => choosePainter(p.id)}>
                    <Text style={[styles.choiceTitle, on && styles.on]}>{txt?.name ?? p.id}</Text>
                    <Text style={styles.choiceHint} numberOfLines={3}>{txt?.hint}</Text>
                    <Text style={[styles.choiceMeta, p.ready && styles.ready]}>
                      {p.ready ? S?.painterReady : fill(S?.painterSize, { mb: Math.max(1, mb(p.missing)) })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {ref ? (
              <Glass style={styles.photoCard}>
                <Image source={{ uri: ref.img }} style={styles.photo} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.body}>{S?.photoTitle}</Text>
                  <Text style={styles.choiceHint}>{fill(S?.photoHint, { name: ref.name })}</Text>
                </View>
                <Switch value={usePhoto} onValueChange={(v) => { Haptics.selectionAsync(); setUsePhoto(v); }} />
              </Glass>
            ) : null}

            {/* Nur wenn wirklich ein ganzer Maler fehlt — nicht für ein paar MB Nachschub. */}
            {painter && !painter.ready && painter.missing > 300_000_000 ? (
              <Glass style={styles.card}>
                <Text style={styles.kicker}>{S?.needsModel}</Text>
                <Text style={styles.body}>{S?.modelInfo}</Text>
              </Glass>
            ) : null}

            <PrimaryButton
              label={painter && !painter.ready ? fill(S?.download, { mb: Math.max(1, mb(painter.missing)) }) : (S?.start ?? "Paint")}
              onPress={start} heavy style={{ flex: 0 }}
            />
            {!prep ? <Text style={styles.hint}>{S?.preparing}</Text> : null}
          </>
        ) : null}

        {working ? (
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
              setPainters(DreamSketch?.painters() ?? []);
              setPhase("setup");
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
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase", marginTop: 6 },
  row: { flexDirection: "row", gap: 10 },
  choice: { flex: 1, padding: 14, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, gap: 4 },
  choiceOn: { borderColor: colors.accentSoft, backgroundColor: "rgba(79,156,249,0.14)" },
  choiceTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.text },
  choiceHint: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  choiceMeta: { color: colors.faint, fontSize: 11, marginTop: 4, fontVariant: ["tabular-nums"] },
  ready: { color: colors.ok },
  on: { color: colors.accentSoft },
  photoCard: { padding: 12, borderRadius: radius.card, flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.panel },
});
