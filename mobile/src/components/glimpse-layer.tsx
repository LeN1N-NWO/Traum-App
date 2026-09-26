import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import JournalBridge from "@/legacy/journal-bridge";
import { finishGlimpse, takeGlimpse, useGlimpseQueue, type GlimpseJob } from "@/store/glimpse-store";
import { setJournal, type BridgeCommand, type BridgeResult, type JournalSnapshot } from "@/store/journal-store";
import { showToast } from "@/store/toast-store";
import { DreamSketch, resolveSketchesDeep } from "../../modules/dream-sketch";

/* Der Glimpse im Hintergrund (26.09.2026, Antons Ansage): Der Glimpse-
 * Bildschirm legt nur den Auftrag ab (store/glimpse-store.ts) und schickt
 * den Menschen nach ein paar Sekunden weiter. Diese unsichtbare Schicht im
 * Wurzel-Layout — mit EIGENER Brücke, wie die Konto-Sicherung — macht ihn
 * fertig, egal welcher Tab offen ist:
 *
 *   Ton (parallel) · alle Bilder (parallel) · schneiden · Film mit Ton ·
 *   ins Journal · Benachrichtigung „Dein Glimpse ist fertig".
 *
 * ⚠ Grenze: Das gilt, solange die App im Vordergrund ist. Geht sie in den
 * Hintergrund, rechnet das iPhone den laufenden Film noch fertig (native
 * Hintergrund-Frist, DreamSketchModule), aber Netzaufrufe der Brücke hält
 * iOS nach wenigen Sekunden an; sie laufen weiter, sobald die App wieder
 * offen ist. Scheitert etwas, bekommt der Traum im Journal den Fehler
 * statt ewig „entsteht gerade". */
const SOUND_GRACE_MS = 15000;
/* Kommt der Ton später (fal-Kaltstart), wird er bis dahin noch nachgereicht. */
const SOUND_LATE_MS = 180000;

export function GlimpseLayer() {
  const busy = useGlimpseQueue();
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  const waiting = useRef(new Map<number, (r: BridgeResult) => void>());
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(resolveSketchesDeep(snap)); }, []);
  const onResult = useCallback(async (r: BridgeResult) => {
    if (r.n === -1) return;          // Meldungen des Abholers zeigt die Tab-Brücke
    waiting.current.get(r.n)?.(r); waiting.current.delete(r.n);
  }, []);
  const ask = useCallback((cmd: Omit<BridgeCommand, "n">) => new Promise<BridgeResult>((resolve) => {
    n.current += 1; waiting.current.set(n.current, resolve); setCommand({ ...cmd, n: n.current } as BridgeCommand);
  }), []);

  // Tipp auf „Dein Glimpse ist fertig" → direkt zum Traum.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.glimpse;
      if (typeof url === "string") router.push(url as any);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const job = takeGlimpse();
    if (!job) return;
    run(job, ask).finally(finishGlimpse);
  }, [busy, ask]);

  return (
    <View style={styles.hidden} pointerEvents="none">
      <JournalBridge onJournal={onJournal} onResult={onResult} refreshTick={0} command={command} devCredits={500} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
    </View>
  );
}

async function run(job: GlimpseJob, ask: (cmd: Omit<BridgeCommand, "n">) => Promise<BridgeResult>) {
  const p = job.prep;
  try {
    if (!DreamSketch) throw new Error("unsupported");
    // Der Ton startet sofort und läuft neben den Bildern her.
    const sound = ask({ type: "sketchSound", sketchSound: { styleId: job.styleId, mood: job.mood, beats: job.beats, seconds: job.seconds } })
      .then((r) => (typeof r.result?.url === "string" ? (r.result.url as string) : null)).catch(() => null);
    // Die Fotos als data:-URIs, in der Reihenfolge der Klauseln im Prompt.
    const refs = await Promise.all(p.refs.map((r) => DreamSketch!.referenceData(r.img)));
    // Alle Bilder gleichzeitig (Antons Ansage 26.09.: parallel reicht).
    const g = await ask({ type: "sketchGrid", sketchGrid: { prompts: p.prompts?.length ? p.prompts : [p.prompt], refs } });
    const urls: string[] = Array.isArray(g.result?.urls) ? g.result.urls : g.result?.url ? [g.result.url] : [];
    if (g.error || !urls.length) throw new Error(g.error || "grid");
    // Je Bild vier 576×1024-Kacheln, genau das Filmformat.
    const scenes = (await Promise.all(urls.map((u, k) => DreamSketch!.importGrid(u, `${job.id}-${k}`, 4, 1)))).flat();
    // Der Film — mit Ton, wenn er bis dahin (plus Gnadenfrist) da ist.
    const soundUrl = await Promise.race([sound, new Promise<null>((r) => setTimeout(() => r(null), SOUND_GRACE_MS))]);
    const film = await DreamSketch.renderSketch(
      { opening: [], scenes, morphs: [], particles: p.particles || "dust", vertigo: job.vertigo, seed: job.seed, fog: 0.12,
        hold: job.hold, fade: job.fade, ...(soundUrl ? { sound: soundUrl } : {}) },
      `${job.id}.mp4`,
    );
    const r = await ask({ type: "sketch", sketch: {
      entryId: job.entryId, text: job.dream.text, originalText: job.dream.originalText, analysis: job.dream.analysis,
      styleId: job.styleId, film: film.film, stills: scenes, seconds: Math.round(film.seconds * 10) / 10,
    } });
    if (r.error) throw new Error(r.error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Notifications.scheduleNotificationAsync({
      content: { title: job.texts.readyTitle, body: job.texts.readyBody.replace("{title}", job.dream.title || ""), data: { glimpse: `/journal/${job.entryId}` } },
      trigger: null,
    }).catch(() => {});
    // Der Film ist da; kam der Ton zu spät, wird er jetzt noch daruntergelegt.
    // Nebenher, damit der nächste Glimpse nicht darauf wartet.
    if (!film.sound) {
      const sketch = DreamSketch;
      void Promise.race([sound, new Promise<null>((r) => setTimeout(() => r(null), SOUND_LATE_MS))])
        .then((late) => (late ? sketch.addSound(film.film, late) : null))
        .catch((e) => console.warn("[glimpse] Ton nachträglich", e?.message || e));
    }
  } catch (e: any) {
    console.warn("[glimpse]", e?.message || e);
    await ask({ type: "sketchFail", id: job.entryId, value: String(e?.message || e) }).catch(() => null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showToast(`⚠ ${job.texts.failed}`);
  }
}

const styles = StyleSheet.create({
  hidden: { position: "absolute", width: 0, height: 0, overflow: "hidden" },
});
