import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import JournalBridge from "@/legacy/journal-bridge";
import { closeGlimpse, finishGlimpse, noteGlimpse, openGlimpseEntries, restoreGlimpses, takeGlimpse, useGlimpseQueue, type GlimpseJob } from "@/store/glimpse-store";
import { setJournal, type BridgeCommand, type BridgeResult, type JournalSnapshot } from "@/store/journal-store";
import { showToast } from "@/store/toast-store";
import { DreamSketch, resolveSketchesDeep, resolveSketchUrl } from "../../modules/dream-sketch";

/* Der Glimpse im Hintergrund (26.09.2026, Antons Ansage): Der Glimpse-
 * Bildschirm legt nur den Auftrag ab (store/glimpse-store.ts) und schickt
 * den Menschen nach ein paar Sekunden weiter. Diese unsichtbare Schicht im
 * Wurzel-Layout — mit EIGENER Brücke, wie die Konto-Sicherung — macht ihn
 * fertig, egal welcher Tab offen ist:
 *
 *   alle Bilder (parallel) · schneiden · Film (ohne Partikel, Nebel,
 *   Farbstufe) · Film in die Cloud: Geräusche AUS DEM FILM + Musik
 *   (/api/sketch-sound, multipart) · Ton unterlegen · ins Journal ·
 *   Benachrichtigung „Dein Glimpse ist fertig".
 *
 * Seit 26.09. spätabends (Antons Ansage) entsteht der Ton erst NACH dem
 * Film: Das Modell sieht die Bilder und legt die Effekte passend darauf.
 *
 * Absturz oder Beenden mittendrin (26.09. abends, Antons Befund): Das
 * Protokoll (store/glimpse-store.ts) hält jede fertige Stufe fest; beim
 * nächsten Start geht es dort weiter — schon bezahlte Bilder werden nicht
 * neu bestellt. Ein Traum, der „entsteht gerade" zeigt, aber keinen
 * offenen Auftrag hat, bekommt den Fehler (Brücke sketchSweep).
 *
 * ⚠ Grenze: Das gilt, solange die App im Vordergrund ist. Geht sie in den
 * Hintergrund, rechnet das iPhone den laufenden Film noch fertig (native
 * Hintergrund-Frist, DreamSketchModule), aber Netzaufrufe der Brücke hält
 * iOS nach wenigen Sekunden an; sie laufen weiter, sobald die App wieder
 * offen ist. Scheitert etwas, bekommt der Traum im Journal den Fehler
 * statt ewig „entsteht gerade". */
/* Bis zum Journal wartet der Glimpse so lange auf den Ton (fal-Kaltstart
   gemessen: bis ~100 s); kommt er später, wird er noch nachgereicht. */
const SOUND_WAIT_MS = 240000;
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:8100";

/** Den fertigen Film hochladen; zurück kommt die gemischte Tonspur (m4a). */
async function soundFromFilm(job: GlimpseJob, filmUri: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("video", { uri: filmUri, name: "film.mp4", type: "video/mp4" } as any);
  fd.append("styleId", job.styleId);
  fd.append("mood", job.mood);
  fd.append("seconds", String(job.seconds));
  fd.append("beats", JSON.stringify(job.beats));
  const res = await fetch(`${API_BASE}/api/sketch-sound`, { method: "POST", body: fd });
  const out = await res.json().catch(() => null);
  if (!res.ok || typeof out?.url !== "string") return null;
  return out.url.startsWith("/") ? API_BASE + out.url : out.url;
}

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

  // Beim Start: Protokoll lesen, Aufgegebenes melden, Verwaistes aufräumen.
  useEffect(() => {
    const { given } = restoreGlimpses();
    (async () => {
      for (const job of given) {
        await ask({ type: "sketchFail", id: job.entryId, value: "interrupted" });
        closeGlimpse(job.id);
      }
      await ask({ type: "sketchSweep", keep: openGlimpseEntries() });
    })();
  }, [ask]);

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
    let scenes = job.scenes ?? [];
    if (!scenes.length) {
      let urls = job.urls ?? [];
      if (!urls.length) {
        // Die Fotos als data:-URIs, in der Reihenfolge der Klauseln im Prompt.
        const refs = await Promise.all(p.refs.map((r) => DreamSketch!.referenceData(r.img)));
        // Alle Bilder gleichzeitig (Antons Ansage 26.09.: parallel reicht).
        const g = await ask({ type: "sketchGrid", sketchGrid: { prompts: p.prompts?.length ? p.prompts : [p.prompt], refs } });
        urls = Array.isArray(g.result?.urls) ? g.result.urls : g.result?.url ? [g.result.url] : [];
        if (g.error || !urls.length) throw new Error(g.error || "grid");
        noteGlimpse(job.id, { urls });                 // bezahlt — beim Neustart nicht noch einmal
      }
      // Je Bild vier 576×1024-Kacheln, genau das Filmformat.
      scenes = (await Promise.all(urls.map((u, k) => DreamSketch!.importGrid(u, `${job.id}-${k}`, 4, 1)))).flat();
      noteGlimpse(job.id, { scenes });
    }
    // Der Film — nur Bild, Tiefe und Kamera (keine Partikel, kein Nebel, keine Farbstufe).
    const film = await DreamSketch.renderSketch(
      { opening: [], scenes, morphs: [], particles: p.particles || "dust", vertigo: job.vertigo, seed: job.seed, fog: 0,
        hold: job.hold, fade: job.fade, effects: false },
      `${job.id}.mp4`,
    );
    // Der Film geht in die Cloud; zurück kommt der Ton, der zu ihm passt.
    const filmUri = resolveSketchUrl(film.film) ?? "";
    const sound: Promise<string | null> = job.sound
      ? Promise.resolve(job.sound)
      : soundFromFilm(job, filmUri).then((u) => { if (u) noteGlimpse(job.id, { sound: u }); return u; }).catch(() => null);
    const soundUrl = await Promise.race([sound, new Promise<null>((r) => setTimeout(() => r(null), SOUND_WAIT_MS))]);
    let withSound = false;
    if (soundUrl) {
      withSound = await DreamSketch.addSound(film.film, soundUrl).then(() => true).catch((e) => { console.warn("[glimpse] Ton", e?.message || e); return false; });
    }
    const r = await ask({ type: "sketch", sketch: {
      entryId: job.entryId, text: job.dream.text, originalText: job.dream.originalText, analysis: job.dream.analysis,
      styleId: job.styleId, film: film.film, stills: scenes, seconds: Math.round(film.seconds * 10) / 10,
    } });
    if (r.error) throw new Error(r.error);
    closeGlimpse(job.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Notifications.scheduleNotificationAsync({
      content: { title: job.texts.readyTitle, body: job.texts.readyBody.replace("{title}", job.dream.title || ""), data: { glimpse: `/journal/${job.entryId}` } },
      trigger: null,
    }).catch(() => {});
    // Der Film ist da; kam der Ton zu spät, wird er jetzt noch daruntergelegt.
    // Kam der Ton nicht rechtzeitig, wird er nebenher nachgereicht.
    if (!withSound && !soundUrl) {
      const sketch = DreamSketch;
      void sound.then((late) => (late ? sketch.addSound(film.film, late) : null))
        .catch((e) => console.warn("[glimpse] Ton nachträglich", e?.message || e));
    }
  } catch (e: any) {
    console.warn("[glimpse]", e?.message || e);
    await ask({ type: "sketchFail", id: job.entryId, value: String(e?.message || e) }).catch(() => null);
    closeGlimpse(job.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showToast(`⚠ ${job.texts.failed}`);
  }
}

const styles = StyleSheet.create({
  hidden: { position: "absolute", width: 0, height: 0, overflow: "hidden" },
});
