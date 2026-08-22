/* Wer im Traum vorkommt — und wer nur zweimal genannt wurde.
 *
 * Eigene Datei, weil server.js beim Import einen Server startet und diese
 * Regel damit nicht prüfbar wäre. Dieselbe Trennung wie bei gatekeeper.js
 * und mediaRoot.js.
 */

/* Zwei Einträge für denselben Menschen — Antons Befund vom 22.08.: „Hier wird
 * ein Arzt und dann ein Arzt. Zwei separate Menschen erkannt. Das ist komplett
 * sinnlos."
 *
 * Die Prompt-Regel darüber verlangt es richtig, aber ein Prompt ist eine Bitte,
 * kein Vertrag. Deshalb hier die Durchsetzung: Verglichen wird ohne Artikel,
 * ohne Groß- und Kleinschreibung und ohne Zeichen — „ein Arzt", „der Arzt" und
 * „Arzt" ergeben denselben Schlüssel und damit einen Eintrag. Der erste
 * gewinnt, weil er im Traum zuerst vorkam.
 *
 * ⚠ Bewusst NICHT unscharf: „ein anderer Arzt" behält sein „anderer" im
 * Schlüssel und bleibt damit eine eigene Person. Zwei Ärzte, die der Traum
 * unterscheidet, zusammenzuwerfen wäre der schlimmere Fehler — dann fehlte
 * eine Figur, die es wirklich gab.
 */
export const NUR_ARTIKEL = new Set([
  "ein", "eine", "einer", "einem", "einen", "der", "die", "das", "den", "dem",
  "des", "the", "a", "an",
]);
const ARTIKEL = /^(?:ein|eine|einer|einem|einen|der|die|das|den|dem|des|the|a|an)\s+/i;
export function dedupePeople() {
  const gesehen = new Set();
  return (p) => {
    let name = String(p.name || "").trim();
    // Artikel können sich stapeln („eine der Frauen") — bis keiner mehr da ist.
    let vorher;
    do { vorher = name; name = name.replace(ARTIKEL, ""); } while (name !== vorher);
    const schluessel = name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    // Ein Artikel allein ist kein Mensch: „der" ohne Folgewort kommt durch die
    // Abräumschleife unverändert heraus (sie verlangt ein Leerzeichen) und
    // stünde sonst als namenlose Figur in der Besetzung.
    if (!schluessel || NUR_ARTIKEL.has(schluessel) || gesehen.has(schluessel)) return false;
    gesehen.add(schluessel);
    // Der Artikel fliegt auch aus dem angezeigten Namen: Eine Besetzungsliste
    // führt „Arzt", nicht „ein Arzt".
    p.name = name || p.name;
    return true;
  };
}
