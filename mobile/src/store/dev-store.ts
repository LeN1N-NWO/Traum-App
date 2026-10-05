import { useSyncExternalStore } from "react";

/* Was diese Sitzung schon gesehen hat.
 *
 * Diese Marke lebt nur im Speicher und sagt nur: „in DIESER Sitzung ist das
 * Onboarding erledigt" (durchlaufen oder gar nicht nötig) — die Erinnerungen
 * warten darauf (use-reminders.ts). OB das Onboarding kommt, entscheidet seit
 * dem 05.10.2026 die dauerhafte Marke `state.onboarded` der Brücke
 * (onboarding-gate.tsx, B4b). Antons „bei jedem Start" (13./18.09.) gibt es
 * nur noch mit EXPO_PUBLIC_ONBOARDING_ALWAYS=1. */
let seen = false;
export function onboardingSeen() { return seen; }
export function setOnboardingSeen() { seen = true; }

/* Onboarding-Modal ganz weg — nicht nur „fertig", sondern auch fertig
 * ausgeblendet (Modal-onDismiss). Befund 26.09. auf Hannis iPhone (frische
 * Installation, Einwilligung offen): Das Einwilligungs-Tor wollte sich
 * präsentieren, während das Onboarding-Modal stand. iOS lehnt das ab
 * („view is not in the window hierarchy"), React hält das Tor trotzdem für
 * offen — nach dem Onboarding reagierte die App auf nichts mehr. Das Tor
 * wartet deshalb auf diese Marke. */
let gone = false;
const listeners = new Set<() => void>();
export function setOnboardingGone() { gone = true; listeners.forEach((l) => l()); }
export function useOnboardingGone() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => gone, () => gone);
}
