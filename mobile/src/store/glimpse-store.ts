import { File, Paths } from "expo-file-system";
import { useSyncExternalStore } from "react";
import type { SketchPrep } from "@/store/journal-store";

/* Glimpse-Aufträge (26.09.2026, Antons Ansage: „nach zehn Sekunden kann
   man sich in der App frei bewegen; wenn der Traum fertig ist, ploppt er
   auf"). Der Glimpse-Bildschirm legt den Auftrag hier ab und geht; die
   GlimpseLayer im Wurzel-Layout (components/glimpse-layer.tsx) arbeitet ihn
   ab — unabhängig davon, welcher Bildschirm gerade offen ist.

   ⚠ Das PROTOKOLL (26.09. abends, Antons Befund: App abgestürzt, danach
   hing der Traum für immer auf „Rendering"): Jeder Auftrag steht mit
   seinem Fortschritt in Documents/glimpse-jobs.json — was schon bezahlt
   und fertig ist (Bildadressen, geschnittene Szenen, Ton). Beim nächsten
   Start macht die Schicht dort weiter, statt neu zu bezahlen; nach zwei
   gescheiterten Anläufen oder einem Tag gibt sie auf und schreibt den
   Fehler an den Traum. */
export type GlimpseJob = {
  id: string;
  entryId: string;                 // der Traum im Journal, schon angelegt („entsteht gerade")
  prep: SketchPrep;
  beats: string[];
  vertigo: number;
  hold: number; fade: number; seconds: number;
  styleId: string; mood: string; seed: number;
  dream: { text: string; originalText: string; analysis: any; title: string };
  texts: { readyTitle: string; readyBody: string; failed: string };
  /* Fortschritt — jede Stufe wird gespeichert, sobald sie fertig ist. */
  createdAt: number;
  attempts: number;
  urls?: string[];                 // Bilder bei fal: bezahlt, nicht noch einmal bestellen
  scenes?: string[];               // geschnittene Szenen auf dem Gerät
  sound?: string | null;           // Tonspur, sobald sie da ist
};

const MAX_ATTEMPTS = 2;
const MAX_AGE_MS = 24 * 3600 * 1000;

let queue: GlimpseJob[] = [];
let running: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function file() { return new File(Paths.document, "glimpse-jobs.json"); }

/** Alle offenen Aufträge (inklusive des laufenden) — das Protokoll. */
let open: GlimpseJob[] = [];
function persist() {
  try { file().write(JSON.stringify(open)); } catch (e) { console.warn("[glimpse] Protokoll", e); }
}

/** Beim Start: das Protokoll lesen. Gibt zurück, was wieder aufgenommen
 *  wird, und was aufgegeben werden muss (zu alt, zu oft gescheitert). */
export function restoreGlimpses(): { resumed: GlimpseJob[]; given: GlimpseJob[] } {
  if (loaded) return { resumed: [], given: [] };
  loaded = true;
  let saved: GlimpseJob[] = [];
  try { const f = file(); if (f.exists) saved = JSON.parse(f.textSync()) as GlimpseJob[]; } catch { saved = []; }
  const now = Date.now();
  const given = saved.filter((j) => j.attempts >= MAX_ATTEMPTS || now - (j.createdAt || 0) > MAX_AGE_MS);
  const resumed = saved.filter((j) => !given.includes(j)).map((j) => ({ ...j, attempts: j.attempts + 1 }));
  open = resumed;
  queue = [...resumed, ...queue.filter((q) => !resumed.some((r) => r.id === q.id))];
  persist();
  emit();
  return { resumed, given };
}

/** Alle Traum-IDs mit offenem Auftrag — was NICHT hier steht und trotzdem
 *  „entsteht gerade" zeigt, ist verwaist. */
export function openGlimpseEntries() { return open.map((j) => j.entryId); }

export function enqueueGlimpse(job: Omit<GlimpseJob, "createdAt" | "attempts">) {
  const full: GlimpseJob = { ...job, createdAt: Date.now(), attempts: 1 };
  open = [...open, full]; persist();
  queue = [...queue, full]; emit();
}
/** Einen Fortschritt festhalten (Bilder bezahlt, Szenen geschnitten, Ton da). */
export function noteGlimpse(id: string, patch: Partial<GlimpseJob>) {
  open = open.map((j) => (j.id === id ? { ...j, ...patch } : j)); persist();
}
/** Auftrag erledigt (fertig oder endgültig gescheitert): aus dem Protokoll. */
export function closeGlimpse(id: string) {
  open = open.filter((j) => j.id !== id); persist();
}
export function takeGlimpse(): GlimpseJob | null {
  if (running || !queue.length) return null;
  const [job, ...rest] = queue;
  queue = rest; running = job.id; emit();
  return job;
}
export function finishGlimpse() { running = null; emit(); }
export function useGlimpseQueue() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => `${running ?? ""}|${queue.length}`, () => "");
}
