/* Wie lange das Aufschreiben und das Lesen eines Traums dauern (Antons
 * Versuch 10.10.: Apple auf dem iPhone gegen Gemini auf dem Server). Nur im
 * Speicher, nur für die Messseite profile/stt-preview — nichts verlässt das
 * Gerät. Die letzten 20 Einträge je Art. */
export type SpeechNote = { via: "device" | "server"; ms: number; chars: number; error?: string; at?: number };
export type ReadNote = { ms: number; ok: boolean; at?: number };

const speech: SpeechNote[] = [];
const reads: ReadNote[] = [];

export function noteSpeech(n: SpeechNote) {
  speech.unshift({ ...n, at: Date.now() });
  speech.length = Math.min(speech.length, 20);
  console.log(`[speech] ${n.via} ${n.ms} ms, ${n.chars} chars${n.error ? ` (${n.error})` : ""}`);
}

export function noteRead(n: ReadNote) {
  reads.unshift({ ...n, at: Date.now() });
  reads.length = Math.min(reads.length, 20);
  console.log(`[read] analyze ${n.ms} ms ${n.ok ? "ok" : "failed"}`);
}

export const speechNotes = () => [...speech];
export const readNotes = () => [...reads];
