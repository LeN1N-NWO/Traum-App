/* Die Traum-Skizze aus der Cloud (25.09.2026, Antons Entscheidung): EIN
 * Rasterbild bei GPT Image 2 „low" (2×2, 1024², mit den Besetzungsfotos als
 * Referenz) liefert vier Szenen; den Film macht das iPhone. Einkauf je Traum
 * $0,015 mit Foto (Edit-Preistabelle 1024² low), weniger ohne.
 *
 * Die Regel: SKETCH_FREE Skizzen je Kalendermonat gratis, danach kostet eine
 * SKETCH_PRICE Credits. Hochgerechnet (Plan 2026-09-24, v4): höchstens
 * ~$45 je 1.000 Nutzer und Monat für das Gratis-Kontingent.
 *
 * ⚠ Wie die Credits heute liegt auch dieser Zähler auf dem Gerät und ist
 * Buchhaltung, keine Zugangskontrolle — scharf wird er mit der Anmeldung
 * (serverseitiger Zähler, wie server_spend). Bis dahin loggt der Server
 * jeden Aufruf mit seinem Preis. */
export const SKETCH_FREE = 3;
export const SKETCH_PRICE = 1;

/** "2026-09" — der Monat, in dem gezählt wird (Ortszeit des Geräts). */
export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Wie viele Gratis-Skizzen in diesem Monat noch übrig sind. */
export function sketchFreeLeft(state, date = new Date()) {
  const q = state?.sketchQuota;
  const used = q && q.month === monthKey(date) ? Math.max(0, Number(q.used) || 0) : 0;
  return Math.max(0, SKETCH_FREE - used);
}

/** Was die nächste Skizze kostet: 0 solange Gratis übrig ist, sonst SKETCH_PRICE. */
export function sketchCost(state, date = new Date()) {
  return sketchFreeLeft(state, date) > 0 ? 0 : SKETCH_PRICE;
}

/** Der Zähler nach einer GELUNGENEN Skizze (misslungene zählen nicht). */
export function countSketch(state, date = new Date()) {
  const month = monthKey(date);
  const q = state?.sketchQuota;
  const used = q && q.month === month ? Math.max(0, Number(q.used) || 0) : 0;
  return { sketchQuota: { month, used: used + 1 } };
}
