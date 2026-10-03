import { useSyncExternalStore } from "react";

/* Das Anmelde-Blatt (S1 Schritt 3, 03.10.2026). Umschauen geht ohne Konto,
 * alles was Geld kostet nur mit (needsAccount() in src/lib/gatekeeper.js).
 * Weist der Server einen Gast ab, soll nicht ein Fehler stehen bleiben,
 * sondern die Anmeldung aufgehen — von jeder Stelle aus, nativ wie aus den
 * Web-Ansichten. Deshalb ein winziger Zustand hier und EIN Blatt im
 * Wurzel-Layout (components/sign-in-sheet.tsx), statt eines je Bildschirm.
 *
 * Auslöser: auth.ts, wenn ein Aufruf mit 401 abgewiesen wird und sich keine
 * Sitzung erneuern lässt; und die Zeile „Account" in den Einstellungen. */

let open = false;
const listeners = new Set<() => void>();
const emit = () => { for (const l of listeners) l(); };

export function requestSignIn() {
  if (open) return;              // mehrere 401 gleichzeitig → ein Blatt
  open = true;
  emit();
}

export function closeSignIn() {
  if (!open) return;
  open = false;
  emit();
}

export function useSignInPrompt(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => open,
  );
}
