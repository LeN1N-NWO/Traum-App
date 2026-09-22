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
