import { useSyncExternalStore } from "react";
import type { SketchPrep } from "@/store/journal-store";

/* Glimpse-Aufträge (26.09.2026, Antons Ansage: „nach zehn Sekunden kann
   man sich in der App frei bewegen; wenn der Traum fertig ist, ploppt er
   auf"). Der Glimpse-Bildschirm legt den Auftrag hier ab und geht; die
   GlimpseLayer im Wurzel-Layout (components/glimpse-layer.tsx) arbeitet ihn
   ab — unabhängig davon, welcher Bildschirm gerade offen ist. */
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
};

let queue: GlimpseJob[] = [];
let running: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function enqueueGlimpse(job: GlimpseJob) { queue = [...queue, job]; emit(); }
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
