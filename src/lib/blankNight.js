/* „Nichts hängengeblieben" — der Ein-Tipp-Eintrag (Antons Ja vom 22.08.,
 * Plan streak-board-gamification §3).
 *
 * Warum es das gibt: Man träumt nicht auf Kommando und erinnert sich nicht
 * jede Nacht. Eine Serie, die an „jede Nacht ein erzählter Traum" hängt,
 * bestraft Biologie. Der Ein-Tipp-Eintrag hält die Serie am Leben, ohne zu
 * lügen — die App behauptet nicht, da wäre ein Traum gewesen.
 *
 * ⚠ DIE WICHTIGSTE REGEL: Eine leere Nacht ist KEIN TRAUM. Sie bekommt kein
 * Wesen, keine Analyse, keine Reflection, sie taucht in keinem Atlas-Zähler
 * auf und in keiner Traumliste. Sie ist ein Anwesenheitsvermerk, mehr nicht.
 * Wer das aufweicht, verwässert jede Statistik der App gleichzeitig —
 * deshalb hängt die Erkennung an EINEM Feld (`kind: "blank"`) und die Filter
 * lesen ausschließlich `isBlank()`.
 *
 * Bewusst NICHT gebaut: nachträgliches Ausfüllen („doch noch was erinnert").
 * Wer morgens etwas erinnert, schreibt einen Traum — dafür ist der große
 * Knopf da. Ein leerer Eintrag, der sich später in einen Traum verwandelt,
 * wäre ein zweiter Weg in die Traumanlage und damit eine zweite Wahrheit.
 */
import { genId } from "./storage.js";
import { localDateKey } from "./dreamDays.js";

export const BLANK_KIND = "blank";

/** Ist dieser Eintrag eine leere Nacht? */
export function isBlank(entry) {
  return entry?.kind === BLANK_KIND;
}

/** Gibt es für DIESEN Tag schon einen Vermerk (Traum oder leere Nacht)?
 *  Der Knopf verschwindet dann — zweimal „nichts" am selben Tag ist
 *  keine zweite Nacht. */
export function nightMarked(journal, date = new Date()) {
  const key = localDateKey(date);
  return (journal || []).some((e) => e?.createdAt && localDateKey(e.createdAt) === key);
}

/** Der neue Eintrag. Rein: der Aufrufer speichert ihn samt bumpStreak(). */
export function blankNight(now = new Date()) {
  return {
    id: genId("e"),
    createdAt: now.toISOString(),
    kind: BLANK_KIND,
    /* Kein text, kein title, keine analysis, keine media, kein creatureId —
       und das ist die ganze Datenstruktur. Alles, was hier hinzukäme, müsste
       an jeder Filterstelle wieder ausgeschlossen werden. */
  };
}
