import { File, Paths } from "expo-file-system";

/* Wie lange das Aufschreiben und das Lesen eines Traums dauern (Antons
 * Versuch 10.10.: Apple auf dem iPhone gegen Gemini auf dem Server). Für
 * die Messseite profile/stt-preview und die Schätzung des Ladebalkens.
 * Die letzten 20 Einträge je Art liegen in einer kleinen Datei auf dem
 * Gerät (sonst schätzte der Balken nach jedem Neustart wieder ins Blaue) —
 * nichts davon verlässt das Gerät. */
export type SpeechNote = { via: "device" | "server"; ms: number; chars: number; error?: string; at?: number };
export type ReadNote = { ms: number; ok: boolean; at?: number };

const store = new File(Paths.document, "speech-timing.json");
const saved = (() => {
  try { return store.exists ? JSON.parse(store.textSync()) : null; } catch { return null; }
})();
const speech: SpeechNote[] = Array.isArray(saved?.speech) ? saved.speech : [];
const reads: ReadNote[] = Array.isArray(saved?.reads) ? saved.reads : [];
function save() {
  try { store.write(JSON.stringify({ speech, reads })); } catch {}
}

export function noteSpeech(n: SpeechNote) {
  speech.unshift({ ...n, at: Date.now() });
  speech.length = Math.min(speech.length, 20);
  save();
  console.log(`[speech] ${n.via} ${n.ms} ms, ${n.chars} chars${n.error ? ` (${n.error})` : ""}`);
}

export function noteRead(n: ReadNote) {
  reads.unshift({ ...n, at: Date.now() });
  reads.length = Math.min(reads.length, 20);
  save();
  console.log(`[read] analyze ${n.ms} ms ${n.ok ? "ok" : "failed"}`);
}

export const speechNotes = () => [...speech];
export const readNotes = () => [...reads];

/* Die Schätzung für den Ladebalken (components/dream-loader.tsx, 10.10.):
   der Median der letzten gelungenen Messungen, ohne Messung ein Startwert —
   gemessen 10.10.: Analyse ~11 s, Aufschreiben 1,6 s (Server) / < 1 s (Apple).
   `withSpeech`: Der Balken beginnt schon beim Aufschreiben. */
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
export function estimateReadMs(withSpeech: boolean) {
  const stt = median(speech.filter((n) => !n.error && n.chars > 0).slice(0, 7).map((n) => n.ms)) ?? 2500;
  const read = median(reads.filter((n) => n.ok).slice(0, 7).map((n) => n.ms)) ?? 10000;
  return Math.round((withSpeech ? stt : 0) + read);
}
