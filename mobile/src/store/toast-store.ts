import { useSyncExternalStore } from "react";

/* Toasts, nativ (Toast.jsx im Web): eine Zeile oben, kurz, dann weg.
   Modul-Speicher, damit die Brücke (Abholer) und jeder Bildschirm sie
   zeigen können; gezeichnet einmal im Wurzel-Layout (components/toasts.tsx). */
export type Toast = { id: number; text: string };
let toasts: Toast[] = [];
let n = 0;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
export function showToast(text: string, ms = 3200) {
  const id = ++n;
  toasts = [...toasts, { id, text }]; emit();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, ms);
}
export function useToasts() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => toasts, () => toasts);
}
