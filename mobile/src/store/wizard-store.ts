import { useSyncExternalStore } from "react";

/* Der native Wizard hält seine Wahl hier, über die Stack-Screens hinweg.
   Der Auftrag selbst läuft im Web-Motor (dream/order.tsx) — Geldweg und
   Prompt-Kette bleiben unangetastet. */
export type WizardState = {
  text: string; originalText: string; analysis: any | null;
  styleId: string; pace: "calm" | "fast" | "flow"; videoModel: "standard" | "premium";
  quality: "sd" | "hd" | null; seconds: number; orderId: string | null;
  assignmentOverrides: Record<string, { avatarId?: string; free?: boolean }>;
  pendingRead: boolean;
  entryId: string | null;    // „Nochmal, anders": neue Fassung fuer einen bestehenden Traum (Step5 haengt sie an)
  secondsTouched: boolean;   // der Mensch hat den Regler bewegt — die Empfehlung setzt ihn dann nicht mehr
  audioUrl: string | null;   // die eigene Aufnahme (ADR-0007), am Traum gespeichert
  mode: "images" | "film";
  /* Zählt bei jedem resetWizard hoch. Der Erzähl-Bildschirm bleibt im Tab
     gemountet (NativeTabs) und hält Rekorder und Text lokal — an dieser
     Zahl merkt er, dass ein Auftrag durch ist und er von vorn beginnt. */
  resets: number;
};
const EMPTY: WizardState = { text: "", originalText: "", analysis: null, styleId: "ultrareal", pace: "calm", videoModel: "standard", quality: null, seconds: 6, orderId: null, assignmentOverrides: {}, pendingRead: false, entryId: null, secondsTouched: false, audioUrl: null, mode: "film", resets: 0 };
let state: WizardState = EMPTY;
const listeners = new Set<() => void>();
export function patchWizard(p: Partial<WizardState>) { state = { ...state, ...p }; listeners.forEach((l) => l()); }
export function resetWizard() { state = { ...EMPTY, resets: state.resets + 1 }; listeners.forEach((l) => l()); }
export function useWizardStore() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state, () => state);
}
