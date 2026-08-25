import frogIdle from "../assets/mascot-frog-idle.mp4";
import frogIdlePoster from "../assets/mascot-frog-idle.jpg";
import frogTap from "../assets/mascot-frog-button.mp4";

/* Die Maskottchen — eine Tabelle, kein fest verdrahteter Frosch.
 *
 * Antons Ansage (25.08.2026): „Es wird drei verschiedene Maskottchen geben,
 * und der User kann die auswählen … diese Maskottchen ändern ALLE
 * Maskottchen über die ganze App."
 *
 * Deshalb steht hier eine Tabelle und keine Konstante: Wer ein zweites
 * Maskottchen bringt, trägt eine Zeile ein und ändert sonst NICHTS. Jeder
 * Bildschirm fragt `mascot(state)`, niemand importiert eine Datei direkt.
 *
 * ⚠ Der TIPP-ANKER gehört zur Datei, nicht zur App. Jede Animation trifft
 * den Knopf an einer anderen Stelle ihres Bildes — beim Frosch bei 14,5 %
 * Breite und 78 % Höhe, gemessen am 25.08. über alle 145 Einzelbilder.
 * Stünde das als globale Zahl im Bauteil, träfe das zweite Maskottchen
 * daneben, und zwar lautlos: Ein Frosch, der ins Leere tippt, wirft keine
 * Fehlermeldung. Neue Animation → Anker neu messen → hier eintragen.
 *
 * Wie man ihn misst, ohne zu raten: die Alphamaske über alle Einzelbilder
 * legen, den Moment mit der größten Deckung im unteren Bilddrittel suchen
 * (das ist der Funke) und dessen Schwerpunkt nehmen. Beim Frosch war das
 * Sekunde 3,0 von 6,04.
 *
 * ⚠ `scale` ist kein Geschmack, sondern Geometrie: Der Anker sitzt links
 * unten im Bild, der Knopf aber in der Bildschirmmitte. Formatfüllend
 * gelegt schiebt das Verankern den Kopf aus dem Bild. Bei 0,65 passt das
 * ganze Tier — am 25.08. bei 0,65 / 0,75 / 0,85 gegengerendert, 0,85 ist
 * abgeschnitten.
 *
 * ── Zwei Arten, ein Video transparent zu bekommen ────────────────────────
 * `idle.blend: "screen"` heißt: weiße Kreide auf gemessenem Reinschwarz,
 * ohne Alphakanal, per `mix-blend-mode` freigestellt — kostet null Bytes
 * extra (siehe Mascot.jsx).
 * `tap.src` ist dagegen eine echte Alpha-Packung (alpha-packen.mjs), weil
 * das Bild über einem Knopf liegt und nicht über dem Seitenhintergrund.
 * Beide Wege sind richtig, an ihrem jeweiligen Ort. */

const FROG = {
  id: "frog",
  name: "Frog",
  idle: { src: frogIdle, poster: frogIdlePoster, blend: "screen" },
  tap: {
    src: frogTap,
    /* Maße der QUELLE, nicht der Packung: Die gepackte Datei ist doppelt so
       hoch (Farbe oben, Maske unten), AlphaVideo halbiert sie wieder. */
    width: 720,
    height: 1280,
    anchor: { x: 0.145, y: 0.78 },
    scale: 0.65,
    seconds: 6.05,
  },
};

/* Noch eine Tabelle mit einer Zeile — bewusst. Die beiden anderen kommen
   als Zeile dazu, sobald die Zeichnungen da sind. */
export const MASCOTS = [FROG];

export const DEFAULT_MASCOT = FROG.id;

/* Nimmt den ganzen Zustand entgegen, nicht nur die id: So bleibt der
   Aufrufer von der Frage verschont, WO die Wahl gespeichert liegt — und
   der Tag, an dem sie umzieht, ist eine Änderung an dieser einen Zeile. */
export function mascot(state) {
  const id = typeof state === "string" ? state : state?.mascot;
  return MASCOTS.find((m) => m.id === id) || MASCOTS[0];
}
