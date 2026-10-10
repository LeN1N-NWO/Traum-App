import { Directory, File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import JournalBridge from "@/legacy/journal-bridge";
import { closeGlimpse, finishGlimpse, noteGlimpse, openGlimpseEntries, restoreGlimpses, takeGlimpse, useGlimpseQueue, type GlimpseJob } from "@/store/glimpse-store";
import { setJournal, useJournalStore, type BridgeCommand, type BridgeResult, type HomeData, type JournalSnapshot } from "@/store/journal-store";
import { showToast } from "@/store/toast-store";
import { DreamSketch, resolveSketchesDeep, resolveSketchUrl } from "../../modules/dream-sketch";
import { fetchWithSession, getAccessToken, useBridgeAccount } from "@/lib/auth";
import { useMediaKey } from "@/lib/media-key";
import { localMedia, signedMedia } from "@/lib/media-cache";
import { fonts } from "@/theme";

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
  const res = await fetchWithSession(`${API_BASE}/api/sketch-sound`, { method: "POST", body: fd });
  const out = await res.json().catch(() => null);
  if (!res.ok || typeof out?.url !== "string") return null;
  return out.url.startsWith("/") ? API_BASE + out.url : out.url;
}

export function GlimpseLayer() {
  const mediaKey = useMediaKey();   // S2: signierte Medienadressen in der Web-Ansicht
  const bridgeAccount = useBridgeAccount();   // ADR-0009: Bereich je Konto
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

  /* Der Mondfilm (03.10.): Ist einer fällig (Brücke home.moonFilm) und
     läuft gerade kein Glimpse, macht ihn diese Schicht — einmal je Sitzung
     und Zyklus versucht, damit ein Fehler nicht in Schleife läuft. */
  const pendingFilm = useJournalStore()?.home?.moonFilm ?? null;
  const filmBusy = useRef(false);
  useEffect(() => {
    if (!pendingFilm || !DreamSketch || filmBusy.current || triedFilms.has(pendingFilm.key) || busy !== "|0") return;
    filmBusy.current = true;
    triedFilms.add(pendingFilm.key);
    makeMoonFilm(pendingFilm, ask).finally(() => { filmBusy.current = false; });
  }, [pendingFilm, busy, ask]);

  return (
    <View style={styles.hidden} pointerEvents="none">
      <JournalBridge getToken={getAccessToken} mediaKey={mediaKey} account={bridgeAccount} onJournal={onJournal} onResult={onResult} refreshTick={0} command={command} devCredits={500} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
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
    /* Der Ton wird bis zu dreimal erfragt (04.10., Antons Befund: der
       Glimpse vom 28.09. blieb stumm — der Server antwortete damals nicht,
       und die App fragte nie wieder). Kommt er spät, legt lateSound ihn
       nachträglich darunter. */
    const ask3 = async (): Promise<string | null> => {
      for (let i = 0; i < 3; i++) {
        const u = await soundFromFilm(job, filmUri).catch(() => null);
        if (u) return u;
        await new Promise((r) => setTimeout(r, [20000, 60000, 0][i]));
      }
      return null;
    };
    const sound: Promise<string | null> = job.sound
      ? Promise.resolve(job.sound)
      : ask3().then((u) => { if (u) noteGlimpse(job.id, { sound: u }); return u; }).catch(() => null);
    const soundUrl = await Promise.race([sound, new Promise<null>((r) => setTimeout(() => r(null), SOUND_WAIT_MS))]);
    let withSound = false;
    if (soundUrl) {
      withSound = await DreamSketch.addSound(film.film, signedMedia(soundUrl)).then(() => true).catch((e) => { console.warn("[glimpse] Ton", e?.message || e); return false; });
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
    // Kam der Ton nicht rechtzeitig (oder ließ er sich nicht anlegen), wird er nebenher nachgereicht.
    if (!withSound) {
      void sound.then((late) => (late ? lateSound(job, film.film, late, ask) : null))
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

/* Der nachgereichte Ton kommt in eine NEUE Datei (27.09., Hannis Befund:
   „der Loop lief einmal durch und blieb stehen"). Vorher schrieb addSound
   die Filmdatei an Ort und Stelle um — während das Journal sie schon
   abspielte. Der Player spielte den ersten Durchgang aus dem Puffer, der
   Sprung an den Anfang traf dann eine andere Datei, und er blieb stehen.
   Jetzt: Kopie mit Ton, der Traum zeigt auf die Kopie (Brücke sketchSwap),
   die alte Datei geht erst, wenn kein Player sie mehr hält. */
async function lateSound(job: GlimpseJob, film: string, sound: string, ask: (cmd: Omit<BridgeCommand, "n">) => Promise<BridgeResult>) {
  const src = resolveSketchUrl(film);
  if (!DreamSketch || !src) return;
  const name = `${job.id}-s.mp4`;
  const copy = new File(resolveSketchUrl(`sketch:${name}`)!);
  if (copy.exists) copy.delete();
  new File(src).copySync(copy);
  await DreamSketch.addSound(`sketch:${name}`, signedMedia(sound));   // S2: erst beim Abholen signieren
  const r = await ask({ type: "sketchSwap", id: job.entryId, value: film, text: `sketch:${name}` });
  if (r.error) { try { copy.delete(); } catch {} return; }
  setTimeout(() => { try { new File(src).delete(); } catch {} }, 60000);
}

/* Der Mondfilm aus den Traumbildern eines Mondzyklus — wie ein Glimpse
   ganz auf dem iPhone gerendert (keine Kosten): jedes Bild wird quadratisch
   übernommen (importReference), der Renderer fährt langsam darüber und
   blendet über. Ohne Partikel, Nebel, Ton. Höchstens 20 Bilder (≈ 1 min). */
const triedFilms = new Set<string>();
/* Der Sammelfilm eines vollen Rings — seit 10.10. aus den ECHTEN Clips
   (Antons Befund: „peinlich — Videos aus einem höheren Modell werden mit
   diesem Modell verarbeitet, komplett Panne"; Wahl „Weg A", auf dem iPhone).
   Bis dahin bekam jeder Traum ein Standbild mit gespielter Tiefe.

     1. je Traum sein jüngster Film: Glimpse-Filme liegen auf dem Gerät,
        Server-Filme meist schon im Medienspeicher (media-cache.ts), sonst
        werden sie geholt; ein Traum nur mit Bildern bekommt wie früher
        einen kurzen Standbild-Clip,
     2. Musik im Stil des Rings (derselbe Dienst wie beim Glimpse, 45 s,
        68 BPM) — fehlt sie, trägt der Ton der Clips,
     3. nativ geschnitten (renderMontage): alle vier Schläge ein Schnitt,
        weich überblendet, Titel am Anfang, Abspann am Ende. */
const BPM = 68;
type Ask = (cmd: Omit<BridgeCommand, "n">) => Promise<BridgeResult>;

/* Absturz-Schutz: Vor dem Rendern steht ein Merker auf dem Gerät, danach
   wird er gelöscht. Findet der nächste Start ihn noch, ist die App mitten
   im Film abgestürzt — dann ohne Titel/Abspann (die Ebenen über dem Video
   sind das Empfindlichste), beim zweiten Mal der alte Standbild-Weg. Sonst
   liefe die App bei jedem Start erneut in denselben Absturz. */
function attempts(key: string) {
  const f = new File(Paths.document, `ringfilm-${key}.try`);
  let n = 0;
  try { n = f.exists ? Number(f.textSync()) || 0 : 0; } catch {}
  return { n, mark: () => { try { f.write(String(n + 1)); } catch {} }, clear: () => { try { f.delete(); } catch {} } };
}

async function makeMoonFilm(f: NonNullable<HomeData["moonFilm"]>, ask: Ask) {
  const tries = attempts(f.key);
  if (!DreamSketch?.renderMontage || tries.n >= 2) return makeStillFilm(f, ask);      // älteres Binary / zweimal abgestürzt
  try {
    tries.mark();
    const r = await buildMontage(f, ask, { overlays: tries.n === 0 });
    tries.clear();
    if (!r) return;
    const res = await ask({ type: "moonFilm", moonFilm: { key: f.key, title: f.title, text: "", film: r.film, stills: [r.poster], seconds: r.seconds } });
    if (res.error) throw new Error(res.error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Notifications.scheduleNotificationAsync({
      content: { title: f.readyTitle, body: f.readyBody, data: { glimpse: "/journal" } },
      trigger: null,
    }).catch(() => {});
  } catch (e: any) {
    tries.clear();      // ein Fehler ist kein Absturz — beim nächsten Start normal neu versuchen
    console.warn("[moonfilm]", e?.message || e);
  }
}

/** Den Film bauen, ohne ihn zu speichern — auch für die Vorschau-Seite
 *  (profile/moonweave-preview). null = zu wenige Clips. */
export async function buildMontage(f: Pick<NonNullable<HomeData["moonFilm"]>, "key" | "dreams" | "style" | "mood" | "montage">, ask: Ask, opts: { overlays?: boolean } = {}) {
  const sketch = DreamSketch!;
  if (!sketch.renderMontage) throw new Error("unsupported");
  const tmp = new Directory(Paths.cache, "ringfilm");
  try {
    tmp.create({ idempotent: true, intermediates: true });
    const fetchTo = async (url: string, name: string) => {
      const src = url.startsWith("file:") ? url : signedMedia(url);
      if (src.startsWith("file:")) return src;
      const out = await File.downloadFileAsync(src, new File(tmp, name), { idempotent: true });
      return out.uri;
    };
    const clips: string[] = [];
    for (let i = 0; i < f.dreams.length; i++) {
      const d = f.dreams[i];
      const film = d.film ? localMedia(d.film) : null;
      if (film) {
        try { clips.push(await fetchTo(film, `${f.key}-${i}.mp4`)); continue; }
        catch (e: any) { console.warn("[moonfilm] Clip", e?.message || e); }
      }
      if (!d.img) continue;
      try {
        const scene = await sketch.importReference(resolveSketchUrl(d.img) ?? d.img, `moon-${f.key}-${i}.png`);
        const still = await sketch.renderSketch({ opening: [], scenes: [scene], morphs: [], particles: "dust", vertigo: -1, seed: i * 7919 + 1, fog: 0, hold: 4, fade: 0.6, effects: false }, `moon-${f.key}-${i}.mp4`);
        clips.push(resolveSketchUrl(still.film) ?? still.film);
      } catch (e: any) { console.warn("[moonfilm] Bild", e?.message || e); }
    }
    if (clips.length < 3) return null;

    const slot = (4 * 60) / BPM;               // vier Schläge je Traum
    const seconds = Math.ceil(clips.length * slot + 2.4);
    let music: string | null = null;
    // nur Musik — ohne die Geräusch-Atmosphäre des Glimpse (Antons Befund 10.10.: „komische Geräusche darunter")
    const snd = await ask({ type: "sketchSound", sketchSound: { styleId: f.style || "dreamlike", mood: f.mood || "", beats: [], seconds, musicOnly: true } });
    const url = snd.result?.url as string | undefined;
    /* Ein älterer Server kennt `musicOnly` nicht und liefert Musik MIT
       Atmosphäre. Dann jetzt keinen Film — beim nächsten Start neu, sobald
       der Server sie bestätigt (die Reihenfolge Deploy/App ist so egal). */
    if (url && !snd.result?.musicOnly) throw new Error("Server ohne reine Musik — später erneut");
    if (url) {
      const ext = /\.(m4a|mp3|wav|aac)(?:[?#]|$)/i.exec(url)?.[1] ?? "m4a";
      try { music = await fetchTo(url, `${f.key}-music.${ext}`); } catch (e: any) { console.warn("[moonfilm] Musik", e?.message || e); }
    }

    const M = f.montage;
    return await sketch.renderMontage({
      clips, music, slot, fade: 0.5, tail: 2.4,
      title: M?.title ?? "", subtitle: M?.subtitle ?? "", endTitle: M?.endTitle ?? "", endSub: M?.endSub ?? "", font: fonts.serif,
      overlays: opts.overlays ?? true,
    }, `ring-${f.key}.mp4`);
  } finally {
    try { tmp.delete(); } catch {}
  }
}

/* Der alte Weg (bis 10.10.) — nur noch für ein Binary ohne renderMontage. */
async function makeStillFilm(f: NonNullable<HomeData["moonFilm"]>, ask: Ask) {
  try {
    const sketch = DreamSketch!;
    const all = f.dreams.filter((d) => !!d.img);
    const step = Math.max(1, all.length / 20);
    const picks = Array.from({ length: Math.min(20, all.length) }, (_, i) => all[Math.floor(i * step)]);
    const scenes: string[] = [];
    for (let i = 0; i < picks.length; i++) {
      const src = resolveSketchUrl(picks[i].img) ?? picks[i].img;
      try { scenes.push(await sketch.importReference(src, `moon-${f.key}-${i}.png`)); } catch (e: any) { console.warn("[moonfilm] Bild", e?.message || e); }
    }
    if (scenes.length < 3) return;
    const film = await sketch.renderSketch(
      { opening: [], scenes, morphs: [], particles: "dust", vertigo: -1, seed: scenes.length * 7919, fog: 0, hold: 2.2, fade: 1.0, effects: false },
      `moon-${f.key}.mp4`,
    );
    const r = await ask({ type: "moonFilm", moonFilm: { key: f.key, title: f.title, text: "", film: film.film, stills: scenes, seconds: film.seconds } });
    if (r.error) throw new Error(r.error);
  } catch (e: any) {
    console.warn("[moonfilm]", e?.message || e);
  }
}

const styles = StyleSheet.create({
  hidden: { position: "absolute", width: 0, height: 0, overflow: "hidden" },
});
