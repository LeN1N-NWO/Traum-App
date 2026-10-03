import { useSyncExternalStore } from "react";

/* Was diese Sitzung schon gesehen hat.
 *
 * Antons Wunsch 13.09.2026: „Ich möchte den Onboarding-Screen jetzt erst
 * mal immer sehen, weil ich in der Entwicklung bin." Also zeigt die App es
 * bei JEDEM Start (nicht: einmalig nach `state.onboarded`) — genau die
 * Begründung, mit der im Web das StartMenu steht: Ein Ablauf, der hinter
 * einer Marke liegt, ist nach dem ersten Blick unerreichbar.
 * Seit dem 18.09. gilt das auch im Release-Bau (Anton testet auf dem
 * iPhone) — vor der Veröffentlichung braucht es hier die Einmal-Marke.
 *
 * Die Marke lebt nur im Speicher, nicht auf der Platte: Neustart heißt
 * wieder sehen; innerhalb einer Sitzung kommt es nach dem Durchgehen nicht
 * noch einmal. */
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
