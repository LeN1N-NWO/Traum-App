import { useSyncExternalStore } from "react";

/* Der native Wizard hält seine Wahl hier, über die Stack-Screens hinweg.
   Der Auftrag selbst läuft im Web-Motor (dream/order.tsx) — Geldweg und
   Prompt-Kette bleiben unangetastet. */
export type WizardState = {
  text: string; originalText: string; analysis: any | null;
  styleId: string; pace: "calm" | "fast" | "flow"; videoModel: "standard" | "premium";
  quality: "sd" | "hd" | null; seconds: number; orderId: string | null;
  assignmentOverrides: Record<string, { avatarId?: string; free?: boolean }>;
};
const EMPTY: WizardState = { text: "", originalText: "", analysis: null, styleId: "ultrareal", pace: "calm", videoModel: "standard", quality: null, seconds: 6, orderId: null, assignmentOverrides: {} };
let state: WizardState = EMPTY;
const listeners = new Set<() => void>();
export function patchWizard(p: Partial<WizardState>) { state = { ...state, ...p }; listeners.forEach((l) => l()); }
export function resetWizard() { state = EMPTY; listeners.forEach((l) => l()); }
export function useWizardStore() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state, () => state);
}
