/* Die Einwilligung — wann das Tor steht und was gespeichert wird.
 *
 * Warum es das Tor gibt, steht im Plan (docs/plans/2026-08-20-recht-
 * einwilligung.md): Fotos und Traumtexte gehen an fremde KI-Anbieter, und
 * dafür braucht es VOR dem ersten Upload eine ausdrückliche, nachweisbare
 * Zustimmung (DSGVO Art. 6/7) — drei eigene Häkchen (AGB/Datenschutz ·
 * Datenverarbeitung · 18+), kein Sammelhäkchen, nichts vorangekreuzt.
 * Antons Linie dazu: „Lieber zu viel verlangen und Häkchen setzen lassen
 * als zu wenig."
 *
 * Gespeichert wird Version + Zeitstempel (Nachweispflicht Art. 7): Ändern
 * sich die Texte inhaltlich, zählt CONSENT_VERSION hoch und das Tor kommt
 * für alle wieder. Die Zustimmung liegt im selben localStorage wie alles
 * andere — gerätelokal, wie es zu einer App ohne Konten passt.
 */
export const CONSENT_VERSION = 1;

/** Steht das Tor? Auch nach einer Textänderung (Versionssprung) wieder. */
export function needsConsent(state) {
  return (state?.consent?.v ?? 0) < CONSENT_VERSION;
}

/** Der Patch für update(), wenn alle Häkchen gesetzt sind. */
export function consentPatch(now = Date.now()) {
  return { consent: { v: CONSENT_VERSION, at: now } };
}
