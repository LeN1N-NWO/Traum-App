/* Die Maße eines alpha-gepackten Videos — und die Grenze, an der es
 * unabspielbar wird.
 *
 * Die Packung legt Farbe und Maske übereinander: aus 720×1280 wird
 * 720×2560. Das ist der ganze Trick, mit dem iOS und Android sich EIN
 * Alpha-Video teilen können (Begründung im Kopf von AlphaVideo.jsx).
 *
 * ⚠ Warum das eine eigene, geprüfte Datei ist und keine Zeile im Skript:
 * Telefon-Dekoder haben eine Höhengrenze, und sie ist niedriger, als man
 * denkt. Wer 2160×3840 packt, bekommt 2160×7680 — das nimmt kein Handy an.
 * Der Fehler zeigt sich NICHT beim Kodieren (ffmpeg schreibt die Datei
 * klaglos), sondern erst auf einem fremden Gerät als schwarze Fläche. Genau
 * die Sorte Fehler, die man nicht findet, wenn man sie nicht vorher prüft.
 */

/* H.264 Level 5.1 — was Telefone seit Jahren sicher können. Höhere Level
 * gibt es, aber sie sind Gerätewissen und keine Verlässlichkeit. */
export const MAX_SIDE = 4096;

/** Welche Maße die gepackte Datei bekommt. */
export function packedSize(width, height) {
  return { width, height: height * 2 };
}

/** Geht diese Quelle als Packung durch — und wenn nicht, auf welches Maß
 *  muss sie vorher herunter?
 *
 *  Gibt IMMER einen Vorschlag zurück statt nur „nein": Wer eine Grenze
 *  meldet, ohne den Ausweg zu nennen, verschiebt die Rechnerei nur. */
export function checkPackable(width, height) {
  const gepackt = packedSize(width, height);
  if (gepackt.height <= MAX_SIDE && gepackt.width <= MAX_SIDE) {
    return { ok: true, ...gepackt };
  }
  /* Auf gerade Zahlen abrunden: H.264 in 4:2:0 kann keine ungeraden
     Kantenlängen, und ffmpeg bricht dann mit einer Meldung ab, die nach
     einem anderen Problem aussieht. */
  const faktor = Math.min(MAX_SIDE / gepackt.height, MAX_SIDE / gepackt.width);
  const gerade = (n) => Math.max(2, Math.floor(n / 2) * 2);
  return {
    ok: false,
    ...gepackt,
    vorschlag: { width: gerade(width * faktor), height: gerade(height * faktor) },
  };
}
