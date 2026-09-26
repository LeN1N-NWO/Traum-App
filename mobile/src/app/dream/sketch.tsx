import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { MascotLoader } from "@/components/mascot-loader";
import { WizardHeader } from "@/components/wizard-header";
import type { SketchPrep } from "@/store/journal-store";
import { enqueueGlimpse } from "@/store/glimpse-store";
import { resetWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
import { selectBeats } from "../../../../src/lib/cut.js";
import { recommendedStrips, SCENES_PER_STRIP, sketchTiming } from "../../../../src/lib/sketchQuota.js";
import { DreamSketch, sketchAvailable } from "../../../modules/dream-sketch";

/* Die Traum-Skizze. Seit 25.09. abends (Antons Entscheidung nach dem
   Raster-Test) malt NICHT mehr das iPhone, sondern die Cloud:
     1. EIN 2×2-Raster bei GPT Image 2 „low" — Look-Preset und Fotos der
        Besetzung im Prompt (Brücke: sketchPrep/sketchGrid, Server:
        /api/sketch-grid). Einkauf ≤ $0,015, 3 je Monat gratis, danach
        1 Credit (src/lib/sketchQuota.js).
     2. Das iPhone schneidet die vier Kacheln und macht den Film: Tiefe,
        Kamera, Tiefen-Überblendung, Teilchen (SketchRenderer.swift). Dafür
        braucht es nur das Tiefenmodell (~50 MB) — kein 1-GB-Maler mehr.
   Das echte Foto ist NUR Referenz für die Gesichter — seit Antons
   iPhone-Test (25.09.) beginnt der Film nicht mehr damit.
   Seit 26.09. (Antons Ansage): Man wählt vorher 1–3 Bilder à vier Szenen;
   alle Bilder entstehen PARALLEL, und parallel dazu der Ton (Atmosphäre +
   Musik, /api/sketch-sound). Das iPhone legt ihn unter den Film; kommt er
   nicht rechtzeitig, bleibt der Film stumm.
   Plan: docs/plans/2026-09-24-traum-skizze-on-device.md (v4/v5) */


type Phase = "unsupported" | "setup" | "downloading" | "queued" | "handoff" | "failed";

/* Wie lange der Frosch mit Statuszeilen läuft, bevor die App sagt „du kannst
   dich umschauen" — und wann sie ohne Tipp von selbst ins Journal geht. */
const HANDOFF_MS = 7000;
const AUTO_JOURNAL_MS = 9000;

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
  const [tick, setTick] = useState(0);
  const [download, setDownload] = useState({ done: 0, total: 1 });
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  /* Wie viele Bilder: vorgeschlagen ist eins je vier Szenen der Analyse. */
  const arcLength = Array.isArray(w.analysis?.beats) ? w.analysis.beats.length : 0;
  const fits = recommendedStrips(arcLength);
  const [strips, setStrips] = useState(fits);
  const timing = sketchTiming(strips);

  /* Dieselbe Szenenauswahl wie der Film-Schnitt; die Signatur-Szene des
     Traums bekommt den Dolly-Zoom. */
  const plan = useMemo(() => {
    const analysis = w.analysis;
    const want = strips * SCENES_PER_STRIP;
    const arc: string[] = Array.isArray(analysis?.beats) ? analysis.beats : [];
    const picked: number[] = arc.length ? (selectBeats(analysis, want) as number[]) : [];
    const fromText = w.text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, want);
    const beats = picked.length ? picked.map((i) => arc[i]) : fromText.length ? fromText : [w.text];
    const sig = typeof analysis?.signature === "number" ? picked.indexOf(analysis.signature) : -1;
    return { beats, vertigo: sig >= 0 ? sig : Math.min(1, beats.length - 1) };
  }, [w.analysis, w.text, strips]);

  const loadPrep = useCallback(async () => {
    const r = await ask({ type: "sketchPrep", sketchPrep: { beats: plan.beats, strips, analysis: w.analysis, styleId: w.styleId, assignmentOverrides: w.assignmentOverrides } });
    const p = (r.result as SketchPrep) ?? null;
    if (alive.current) setPrep(p);
    return p;
  }, [ask, plan.beats, strips, w.analysis, w.styleId, w.assignmentOverrides]);
  // Andere Bildzahl → anderer Auftrag: neu vorbereiten.
  useEffect(() => { setPrep((p) => (p && p.strips !== strips ? null : p)); }, [strips]);

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

  const faces = prep?.refs ?? [];

  /* Man soll spüren, dass etwas passiert (Antons Ansage 25.09.): alle paar
     Sekunden eine neue Zeile — beim Malen und beim Film je eigene. */
  useEffect(() => {
    if (phase !== "queued") return;
    setTick(0);
    const t = setInterval(() => setTick((n) => n + 1), 2800);
    return () => clearInterval(t);
  }, [phase]);

  /* Seit 26.09. (Antons Ansage): Der Glimpse entsteht im HINTERGRUND. Hier
     wird nur geprüft, der Traum im Journal angelegt („entsteht gerade") und
     der Auftrag abgelegt — die GlimpseLayer macht ihn fertig. Nach ein paar
     Sekunden Frosch und Statuszeilen heißt es: „Du kannst dich umschauen." */
  const hand = useCallback(async (p: SketchPrep) => {
    if (!W) return;
    setError(null);
    setPhase("queued");
    try {
      const r = await ask({ type: "sketchStart", sketchStart: { entryId: w.entryId, text: w.text, originalText: w.originalText, analysis: w.analysis, styleId: w.styleId } });
      if (r.error || !r.entryId) throw new Error(r.error || "start");
      enqueueGlimpse({
        id: "s_" + Date.now().toString(36), entryId: r.entryId, prep: p, beats: plan.beats, vertigo: plan.vertigo,
        hold: timing.hold, fade: timing.fade, seconds: timing.seconds,
        styleId: w.styleId, mood: String(w.analysis?.mood || ""), seed: seedOf(w.text),
        dream: { text: w.text, originalText: w.originalText, analysis: w.analysis, title: String(w.analysis?.title || "") },
        texts: { readyTitle: S?.readyTitle ?? "Your Glimpse is ready", readyBody: S?.readyBody ?? "{title}", failed: S?.failed ?? "" },
      });
      setTimeout(() => { if (alive.current) setPhase("handoff"); }, HANDOFF_MS);
    } catch (e: any) {
      if (!alive.current) return;
      setError(String(e?.message || e));
      setPhase("failed");
    }
  }, [W, S, w, ask, plan, timing]);

  function toJournal() {
    Haptics.selectionAsync();
    resetWizard();
    router.dismissAll();
    router.navigate("/journal");
  }
  // Wer nichts tippt, landet nach einer Weile von selbst im Journal.
  useEffect(() => {
    if (phase !== "handoff") return;
    const t = setTimeout(toJournal, AUTO_JOURNAL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function start() {
    if (!DreamSketch) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const p = prep ?? await loadPrep();
    if (!p) { setError("prep"); setPhase("failed"); return; }
    if (p.cost > p.credits) { router.push({ pathname: "/dream/paywall", params: { reason: "spent" } }); return; }
    // Das Tiefenmodell lädt einmalig im Vordergrund — danach geht alles ohne diesen Bildschirm.
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
    if (alive.current) hand(p);
  }

  const fill = (tpl: string | undefined, v: Record<string, string | number>) =>
    Object.entries(v).reduce((s, [k, x]) => s.replace(`{${k}}`, String(x)), tpl || "");
  const mb = (b: number) => Math.max(1, Math.round(b / 1_000_000));
  const needsDepth = DreamSketch ? !DreamSketch.modelReady() : false;

  let status = "";
  let bar: number | null = null;
  if (phase === "downloading") { status = fill(S?.downloading, { done: mb(download.done), total: mb(download.total) }); bar = download.done / Math.max(1, download.total); }
  else if (phase === "queued") status = S?.working?.length ? S.working[Math.min(tick, S.working.length - 1)] : (S?.creating ?? "");

  const line = status;
  const working = phase === "downloading" || phase === "queued";
  const label = !prep ? (S?.create ?? "Create Glimpse")
    : prep.cost > 1 ? fill(S?.createCredits ?? S?.createCredit, { n: prep.cost })
    : prep.cost === 1 ? fill(S?.createCredit, { n: 1 }) : (S?.create ?? "Create Glimpse");
  const options = prep?.options ?? [1, 2, 3].map((n) => ({ ...sketchTiming(n), cost: 0 }));

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{S?.title ?? "Dream sketch"}</Text>

        {phase === "unsupported" ? <Text style={styles.lede}>{S?.unsupported}</Text> : null}

        {phase === "setup" ? (
          <>
            <Text style={styles.lede}>{S?.lede}</Text>

            {/* Wie viele Bilder (26.09.): je Wahl Szenen, Länge, Preis. */}
            <Text style={styles.kicker}>{S?.stripsTitle ?? "How many pictures?"}</Text>
            <View style={styles.options}>
              {options.map((o) => {
                const on = o.strips === strips;
                return (
                  <Pressable key={o.strips} onPress={() => { Haptics.selectionAsync(); setStrips(o.strips); }}
                    style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && { transform: [{ scale: 0.97 }] }]}
                    accessibilityRole="button" accessibilityState={{ selected: on }}>
                    {o.strips === fits ? <View style={styles.fitsBadge}><Text style={styles.fitsText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{S?.stripFits ?? "Fits"}</Text></View> : null}
                    <View style={styles.stack}>
                      {Array.from({ length: o.strips * SCENES_PER_STRIP }, (_, k) => <View key={k} style={[styles.stackTile, on && styles.stackTileOn]} />)}
                    </View>
                    <Text style={[styles.optionText, on && { color: colors.accentSoft }]} numberOfLines={2}>{fill(S?.stripOption, { scenes: o.scenes, seconds: Math.round(o.seconds) })}</Text>
                    <Text style={[styles.optionPrice, !o.cost && { color: colors.ok }]}>{o.cost ? fill(S?.priceShort, { n: o.cost }) : (S?.freeShort ?? "Free")}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.soundRow}>
              <SymbolView name="music.note" size={14} tintColor={colors.accentSoft} />
              <Text style={styles.small}>{S?.soundNote}</Text>
            </View>

            {faces.length ? (
              <Glass style={styles.photoCard}>
                <View style={styles.faces}>
                  {faces.map((f, i) => <Image key={f.img + i} source={{ uri: f.img }} style={[styles.photo, i > 0 && { marginLeft: -14 }]} />)}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.body}>{S?.photoTitle}</Text>
                  <Text style={styles.small}>{fill(S?.photoHint, { name: faces.map((f) => f.name).join(", ") })}</Text>
                </View>
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
            <View style={styles.mascot}><MascotLoader size={200} /></View>
            <Animated.Text key={`${phase}-${line}`} entering={FadeIn.duration(450)} style={styles.status}>
              {line}
            </Animated.Text>
            {bar !== null ? (
              <View style={styles.track}><View style={[styles.barFill, { width: `${Math.round(Math.min(1, bar) * 100)}%` }]} /></View>
            ) : null}
            {phase === "downloading" ? <Text style={styles.hint}>{S?.stayHint}</Text> : null}
            {phase === "downloading" ? (
              <Pressable onPress={() => DreamSketch?.cancelDownload()} hitSlop={10}>
                <Text style={styles.cancel}>{S?.cancel}</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {/* Die Übergabe (Antons Ansage 26.09.): wie beim Film — umschauen
            erlaubt, der Glimpse erscheint im Journal, eine Nachricht kommt. */}
        {phase === "handoff" ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ gap: 14, alignItems: "center" }}>
            <View style={styles.mascot}><MascotLoader size={160} /></View>
            <Text style={[styles.title, { textAlign: "center" }]}>{S?.queuedTitle}</Text>
            <Text style={[styles.lede, { textAlign: "center" }]}>{S?.queuedBody}</Text>
            <PrimaryButton label={S?.toJournal ?? "Journal"} heavy onPress={toJournal} style={{ flex: 0, alignSelf: "stretch", marginTop: 6 }} />
          </Animated.View>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  options: { flexDirection: "row", gap: 8, marginTop: -4 },
  option: { flex: 1, paddingTop: 16, paddingBottom: 10, paddingHorizontal: 8, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, alignItems: "center", gap: 6 },
  optionOn: { borderColor: colors.accentSoft, backgroundColor: "rgba(79,156,249,0.14)" },
  optionText: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: "600", fontVariant: ["tabular-nums"], textAlign: "center" },
  optionPrice: { color: colors.muted, fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  stack: { flexDirection: "row", flexWrap: "wrap", width: 44, gap: 2, justifyContent: "center", minHeight: 38, alignContent: "center" },
  stackTile: { width: 9, height: 12, borderRadius: 2, backgroundColor: colors.panelLine },
  stackTileOn: { backgroundColor: colors.accentSoft },
  fitsBadge: { position: "absolute", top: -9, backgroundColor: colors.ok, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7, maxWidth: "96%" },
  fitsText: { color: colors.bg, fontSize: 9, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  soundRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: -4 },
  tile: { borderRadius: 14, backgroundColor: colors.panel },
  status: { color: colors.text, fontSize: 16, fontWeight: "600", textAlign: "center" },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.panel, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentSoft },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 18, textAlign: "center" },
  cancel: { color: colors.accentSoft, fontSize: 15, textAlign: "center", marginTop: 4 },
  bridge: { height: 0, overflow: "hidden" },
  photoCard: { padding: 12, borderRadius: radius.card, flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.panel, borderWidth: 2, borderColor: colors.bg },
  faces: { flexDirection: "row" },
  mascot: { alignItems: "center", paddingVertical: 24 },
});
