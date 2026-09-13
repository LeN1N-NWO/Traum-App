import { useSyncExternalStore } from "react";

/* Der Frosch-Tipp (ButtonTapOverlay im Web, nativ 13.09.2026): Wer den
   Erzeugen-Knopf drückt, legt hier fest, WO der Knopf war und WANN gedrückt
   wurde. Die Ebene über allem (components/mascot-tap.tsx) spielt den Frosch
   genau dort ab; der Auftragsbildschirm liest `tapAt`, damit Konfetti und
   Überschrift in dem Moment kommen, in dem der Frosch trifft. */
export type TapRect = { x: number; y: number; width: number; height: number };
export type TapState = { rect: TapRect; label: string; startedAt: number; tapAt: number; endsAt: number } | null;

/* Gemessen am 25.08. (mascots.js): Der Funke sitzt bei 3,0 s von 6,04 s. */
export const TAP_MOMENT_MS = 3000;
export const TAP_LENGTH_MS = 6040;

let state: TapState = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function startTap(rect: TapRect, label: string, now = Date.now()) {
  state = { rect, label, startedAt: now, tapAt: now + TAP_MOMENT_MS, endsAt: now + TAP_LENGTH_MS };
  emit();
}
export function clearTap() { if (!state) return; state = null; emit(); }
export function currentTap() { return state; }
export function useTap() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state, () => state);
}
