/* The only place the client talks to the server.
 *
 * API_BASE is configurable because a Capacitor bundle will not run on the same
 * origin as the server. Keys live in server.js only — never here, never in
 * the bundle.
 */
import { t } from "../i18n/index.js";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/* Where a stored media path actually lives.
 *
 * Generated files are kept by the server and referenced as "/media/<name>",
 * which is what goes into the journal: a relative path survives the server
 * moving or the app being wrapped, an absolute one would not. It is resolved
 * against API_BASE here, at render time — a Capacitor bundle does not run on
 * the server's origin. Anything else (an old fal.ai URL, a data URI) is
 * handed back untouched.
 */
export function mediaUrl(u) {
  return typeof u === "string" && u.startsWith("/media/") ? `${API_BASE}${u}` : u;
}

/* Jeder Aufruf hat eine Uhr. Ohne sie wartet fetch unbegrenzt, und ein
 * Server, der nie antwortet (kein Schlüssel, falsches Netz, Dienst weg),
 * wird zur toten Schleife mit Spinner — Antons Befund vom 21.08. in der
 * Cloud-Session.
 *
 * EINE Zahl reicht, seit das Rendern in der Warteschlange läuft
 * (awaitJob weiter unten): Keine Anfrage wartet mehr auf eine
 * Generierung — sie geben nur einen Auftrag ab oder fragen dessen Stand
 * ab, und das sind Millisekunden. Eine Minute ist deshalb kein Budget
 * mehr, sondern eine großzügige Obergrenze für „der Server lebt". */
/* ⚠ Die Analyse bekommt mehr Zeit als alles andere (03.09.2026). Seit sie
 * die Szenen nicht mehr gleichmäßig teilt, sondern gewichtet — wie viele
 * Ereignisse hat der Traum, welches ist der Signatur-Beat, welcher Typ je
 * Szene — ist sie echte Denkarbeit, und deepseek-v4-flash denkt erst ins
 * Denkfeld.
 *
 * ⚠ Und das ist NICHT durch die Gewichtung entstanden — am selben Traum
 * gegeneinander gemessen (03.09.2026, 1500 Zeichen):
 *     alter Prompt  121 s, 16 768 Denk-Token, 5 Szenen
 *     neuer Prompt  184 s, 22 958 Denk-Token, 7 Szenen
 * Der lange Traum wäre also VORHER genauso an den 60 Sekunden gescheitert.
 * Aufgefallen ist es nie, weil bisher niemand einen langen Traum eingegeben
 * hat: Ein Vier-Satz-Traum ist in gut einer Minute gelesen. Die 60 Sekunden
 * waren die stumme Obergrenze für die Länge eines Traums — und zwar genau
 * bei dem Traum, für den sich die Arbeit am meisten lohnt.
 *
 * Fünf Minuten sind trotzdem keine Lösung, sondern ein Pflaster: Das Denken
 * macht 96 % der erzeugten Token aus. Solange es kein schnelleres Modell
 * für diese Aufgabe gibt, muss der Wartebildschirm es aushalten. */
const TIMEOUTS = { default: 60_000, analyze: 300_000 };

function friendly(err) {
  // TimeoutError: die Uhr. TypeError: Netz/Server gar nicht erreichbar.
  // Beide heißen für den Menschen dasselbe: keine Antwort, versuch's gleich
  // nochmal — nur ein echter Serverfehler trägt seine eigene Meldung.
  if (err?.name === "TimeoutError" || err instanceof TypeError) {
    return new Error(t.errors.timeout);
  }
  return err;
}

async function post(path, body, { timeout = TIMEOUTS.default } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    throw friendly(err);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    /* ⚠ Der GRUND muss am Fehler hängen bleiben (24.08.2026). Der Server
       schickt bei einer inhaltlichen Ablehnung `reason` mit; ein blankes
       `new Error(text)` hätte ihn hier verloren, und die App wäre wieder
       bei „versuch es noch mal" gelandet — genau dem Rat, der bei einem
       Policy-Verstoß nicht funktioniert. */
    const err = new Error(data?.error || t.errors.serverStatus(res.status));
    if (data?.reason) err.reason = data.reason;
    throw err;
  }
  return data;
}

/** The one LLM call per dream: polished text, people, places, beats, style. */
export async function analyze(dream) {
  const data = await post("/api/analyze", { dream }, { timeout: TIMEOUTS.analyze });
  if (!data?.analysis?.text) throw new Error(t.errors.unexpected);
  return data.analysis;
}

/* Träume als Dateien sichern (Antons Ansage 22.08.). Läuft im Hintergrund
 * und darf ohne Folgen scheitern: Ein Tagebuch, das nicht mehr schreiben
 * kann, weil die Sicherung hakt, wäre die schlechtere Krankheit. Deshalb
 * fängt der Aufrufer nichts ab — diese Funktion wirft nicht. */
export async function backupJournal(entries) {
  if (!entries?.length) return null;
  try {
    return await post("/api/journal-backup", { entries });
  } catch (err) {
    console.warn("[DreamRushes] Traum-Sicherung fehlgeschlagen:", err.message);
    return null;
  }
}

/* Die Besetzung sichern — MIT Fotos, ausdrücklich (castBackup.js).
 *
 * ⚠ Scheitert genauso lautlos wie die Traum-Sicherung, und aus demselben
 * Grund: Es ist eine Bequemlichkeit für die Entwicklungsumgebung. Wer beim
 * Anlegen einer Figur eine Fehlermeldung über eine misslungene Sicherung
 * bekäme, hielte SEINE Figur für kaputt — sie ist es nicht. */
export async function backupCast(entries) {
  if (!entries?.length) return null;
  try {
    return await post("/api/cast-backup", { entries });
  } catch (err) {
    console.warn("[DreamRushes] Besetzungs-Sicherung fehlgeschlagen:", err.message);
    return null;
  }
}

/** Die gesicherten Figuren holen (nur im Entwicklungsmodus, siehe AppState). */
export async function sharedCast() {
  try {
    const res = await fetch(`${API_BASE}/api/cast-backup`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.figuren) ? data.figuren : [];
  } catch {
    return [];
  }
}

/* Die geteilten Testträume holen (nur im Entwicklungsmodus aufgerufen,
 * siehe AppState). Scheitert lautlos: Ein frischer Klon ohne Ordner ist
 * der Normalfall, kein Fehler. */
export async function sharedDreams() {
  try {
    const res = await fetch(`${API_BASE}/api/journal-backup`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.traeume) ? data.traeume : [];
  } catch {
    return [];
  }
}

/** Rework an existing dream. mode: "correct" | "rewrite" | "elaborate". */
export async function refine(dream, mode) {
  const data = await post("/api/refine", { dream, mode });
  if (typeof data?.text !== "string") throw new Error(t.errors.unexpected);
  return data.text;
}

/** Die Reflection zu einem Traum — Spiegel, nicht Orakel. `context` sind
 *  die Musterzeilen aus atlas.js (reflectionContext), gratis wie alle
 *  Textarbeit. `lang` ist die App-Sprache (state.language): Ohne sie rät
 *  das Modell die Antwortsprache aus dem Traumtext — und riet am 25.08.
 *  bei einem deutschen Traum Englisch. */
export async function reflect(dream, context = [], lang = null) {
  const data = await post("/api/reflect", { dream, context, lang });
  if (typeof data?.text !== "string") throw new Error(t.errors.unexpected);
  return data.text;
}

/** Dictation: audio as a base64 data URI in, spoken words as text out. */
export async function transcribe(audio) {
  const data = await post("/api/transcribe", { audio });
  if (typeof data?.text !== "string") throw new Error(t.errors.unexpected);
  return data.text;
}

/* Renders images or a film. `prompt` overrides the server's own wording.
 *
 * Two shapes come back, because the two jobs are nothing alike in length:
 *   images → { urls }   — seconds, worth waiting for
 *   film   → { jobId }  — minutes (a 15s render measured 280s), so the
 *                         server queues it and we collect it afterwards.
 */
/* Die Felder stehen hier einzeln statt als durchgereichtes Objekt, damit
 * sichtbar bleibt, was den Server erreicht. Preis dieser Sichtbarkeit: ein
 * neues Feld muss an BEIDEN Stellen stehen, sonst verschwindet es still —
 * `styleId` und `beats` kamen am 19.08.2026 für den Regisseur dazu. */
/* ⚠ Was hier nicht in der Liste steht, kommt beim Server NICHT an — auch
   wenn der Aufrufer es brav mitgibt. Diese Zeile ist ein stiller Filter, und
   genau daran ist am 24.08. beinahe der Rasterweg gescheitert: `grid` fehlte,
   der Server setzte kein Pixelmaß, und ein 2×2 wäre mit Kacheln von 288×512
   zurückgekommen — bezahlt und unbrauchbar.
     grid     — ein Bild mit mehreren Szenen darin (2×2). Der Server setzt
                daraufhin das Rastermaß aus appGrid().
     fallback — Plan B: das Ausweichmodell. Bewusst ein JA/NEIN und kein
                Modellname; die Auflösung steht im Server (modelFor). */
export async function generate({ dream, mode, cast, prompt, seconds, aspectRatio, keyframe, model, quality, styleId, beats, shots, sequenceRef, grid, fallback }) {
  const data = await post("/api/generate", { dream, mode, cast, prompt, seconds, aspectRatio, keyframe, model, quality, styleId, beats, shots, sequenceRef, grid, fallback });
  if (Array.isArray(data?.urls)) return { urls: data.urls };
  if (typeof data?.jobId === "string") return { jobId: data.jobId };
  throw new Error(t.errors.unexpected);
}

/* Warten, ohne eine Verbindung offen zu halten (Antons Ansage 21.08.:
 * „Die App muss im Hintergrund immer wieder eine Abfrage durchführen").
 *
 * Jede einzelne Abfrage ist winzig und dauert Millisekunden — nur die
 * SUMME darf lange sein. Das ist der ganze Unterschied zum vorherigen
 * Bau: Vorher hing eine Anfrage 30 Sekunden in der Luft und starb an
 * jedem Leerlauf-Timeout zwischen Handy und Server; jetzt gibt es nichts
 * mehr, das sterben könnte.
 *
 * Ein Aussetzer ist kein Abbruch: Fehlgeschlagene Abfragen (Funkloch,
 * Serverneustart) werden gezählt und weiter versucht — erst nach
 * MAX_MISSES hintereinander gibt die Schleife auf. `onTick` meldet jede
 * Runde nach oben, damit die Oberfläche zeigen kann, dass etwas läuft.
 */
const POLL_MS = 2000;
const MAX_MISSES = 12;          // ~24 s durchgehende Funkstille
const MAX_WAIT_MS = 15 * 60_000; // Notbremse gegen ewige Schleifen

export async function awaitJob(jobId, { onTick } = {}) {
  const started = Date.now();
  let misses = 0;
  for (let round = 0; ; round++) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    if (Date.now() - started > MAX_WAIT_MS) throw new Error(t.errors.timeout);
    try {
      const r = await jobStatus(jobId);
      misses = 0;
      if (r.status === "done") return r.urls || [];
      if (r.status === "failed") {
        // Derselbe Grund wie oben, nur auf dem Warteschlangen-Weg.
        const err = new Error(t.errors.renderFailed);
        err.reason = r.reason || null;
        throw err;
      }
      // "pending" und "unknown": weiter fragen. "unknown" heisst bei einem
      // gerade erst angelegten Auftrag oft nur, dass die Datei noch nicht
      // auf der Platte war.
      onTick?.(round);
    } catch (err) {
      if (err.message === t.errors.renderFailed) throw err;
      if (++misses >= MAX_MISSES) throw err;
    }
  }
}

/** Bild(er) rendern: Auftrag abgeben, im Hintergrund abholen. Eine
 *  Funktion für beide Hälften, damit kein Aufrufer das Nachfragen
 *  vergessen kann. */
export async function renderImages(params, { onTick } = {}) {
  const res = await generate(params);
  if (res.urls) return res.urls;            // ältere Serverstände
  return awaitJob(res.jobId, { onTick });
}

/** Ein Referenzbild aus einer Beschreibung — der Charakterbogen.
 *  Gibt einen /media/-Pfad zurück, also genau das, was auch ein hochgeladenes
 *  Foto wäre: ab hier behandelt alles Weitere beides gleich.
 *  Mit `photo` (data:image-URI) wird stattdessen ein vorhandenes Foto zum
 *  Bogen NORMALISIERT (grau, Ganzkörper + Gesicht) — gratis, nur aus einem
 *  bezahlten Render heraus aufgerufen (sheets.js hat die Regeln). */
export async function characterSheet({ desc, category, photo, photo2 }) {
  const data = await post("/api/character", { desc, category, photo, photo2 });
  // Auftrag (seit 21.08.) oder fertige URL (ältere Serverstände).
  if (typeof data?.jobId === "string") {
    const urls = await awaitJob(data.jobId);
    if (typeof urls[0] !== "string") throw new Error(t.errors.unexpected);
    return urls[0];
  }
  const url = Array.isArray(data?.urls) ? data.urls[0] : null;
  if (typeof url !== "string") throw new Error(t.errors.unexpected);
  return url;
}

/** Store one cropped grid panel and get back its own /media/ path — the
 *  same kind of path a normal generation returns, so everything downstream
 *  (the journal, the carousel, sharing) treats it identically. */
export async function uploadPanel(blob) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/panel`, {
      method: "POST",
      headers: { "content-type": blob.type || "image/png" },
      body: blob,
      signal: AbortSignal.timeout(TIMEOUTS.default),
    });
  } catch (err) {
    throw friendly(err);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.url !== "string") throw new Error(data?.error || t.errors.serverStatus(res.status));
  return data.url;
}

/** Haengt den Abspann an einen bereits gerenderten Film und gibt den Pfad
 *  der neuen Datei zurueck. Wirft, wenn der Server es nicht kann (501) —
 *  share.js faengt das ab und teilt dann das Original. */
export async function filmWithOutro(film, card) {
  const data = await post("/api/film-outro", { film, card });
  if (typeof data?.url !== "string") throw new Error(t.errors.unexpected);
  return data.url;
}

/** Where a queued film stands: "pending" | "done" | "failed" | "unknown". */
export async function jobStatus(id) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/job?id=${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw friendly(err);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || t.errors.serverStatus(res.status));
  return data;
}
