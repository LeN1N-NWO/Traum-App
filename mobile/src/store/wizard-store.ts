import { useSyncExternalStore } from "react";

/* Der native Wizard hält seine Wahl hier, über die Stack-Screens hinweg.
   Der Auftrag selbst läuft im Web-Motor (dream/order.tsx) — Geldweg und
   Prompt-Kette bleiben unangetastet. */
export type WizardState = {
  text: string; originalText: string; analysis: any | null;
  styleId: string; pace: "calm" | "fast" | "flow"; videoModel: "standard" | "premium";
  quality: "sd" | "hd" | "fhd" | null; seconds: number; orderId: string | null;
  /** Filmformat (26.09., Antons Ansage: „das Aspect-Ratio kann ich gar nicht auswählen"). */
  format: FilmFormat;
  assignmentOverrides: Record<string, { avatarId?: string; free?: boolean }>;
  pendingRead: boolean;
  entryId: string | null;    // „Nochmal, anders": neue Fassung fuer einen bestehenden Traum (Step5 haengt sie an)
  secondsTouched: boolean;   // der Mensch hat den Regler bewegt — die Empfehlung setzt ihn dann nicht mehr
  audioUrl: string | null;   // die eigene Aufnahme (ADR-0007), am Traum gespeichert
  mode: "images" | "film";
  /* Die Traum-Skizze statt eines bezahlten Films (24.09.): läuft auf dem
     iPhone (dream/sketch.tsx), ohne Server-Auftrag und ohne Credits. */
  sketch: boolean;
  /* Zählt bei jedem resetWizard hoch. Der Erzähl-Bildschirm bleibt im Tab
     gemountet (NativeTabs) und hält Rekorder und Text lokal — an dieser
     Zahl merkt er, dass ein Auftrag durch ist und er von vorn beginnt. */
  resets: number;
};
export type FilmFormat = "9:16" | "16:9" | "1:1";
export const FILM_FORMATS: FilmFormat[] = ["9:16", "16:9", "1:1"];

const EMPTY: WizardState = { text: "", originalText: "", analysis: null, styleId: "ultrareal", pace: "calm", videoModel: "standard", quality: null, format: "9:16", seconds: 6, orderId: null, assignmentOverrides: {}, pendingRead: false, entryId: null, secondsTouched: false, audioUrl: null, mode: "film", sketch: false, resets: 0 };
let state: WizardState = EMPTY;
const listeners = new Set<() => void>();
export function patchWizard(p: Partial<WizardState>) { state = { ...state, ...p }; listeners.forEach((l) => l()); }
export function resetWizard() { state = { ...EMPTY, resets: state.resets + 1 }; listeners.forEach((l) => l()); }
export function useWizardStore() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state, () => state);
}
