/* Wie oft eine Figur in Träumen vorkommt.
 *
 * Diese Zahl lag von Anfang an im Zustand und wurde nirgends gezeigt: Jeder
 * Traum hält unter `references` fest, welche Figuren beim Rendern benutzt
 * wurden (siehe Step6Result.jsx). Die Besetzungsliste zeigte bis zum
 * 17.08.2026 nur Namen — dabei ist „in zwölf Träumen" das Einzige, was diese
 * Seite über eine Figur weiß und was sonst nirgends steht.
 *
 * Zwei Entscheidungen, die man der Zahl nicht ansieht:
 *
 * 1. **Ein Traum zählt einmal, auch wenn die Figur zweimal darin steckt.**
 *    Die Zahl beantwortet „in wie vielen Träumen", nicht „wie oft benutzt".
 *    Ohne diese Sperre bekäme eine Figur, die in einem einzigen Traum
 *    doppelt referenziert ist, eine 2 — und die Liste sortierte falsch.
 *
 * 2. **Seed-Träume zählen nicht** — und zwar ohne Sonderbehandlung: Sie
 *    tragen `references: []` (seedJournal.js), also fallen sie von selbst
 *    heraus. Das ist auch richtig so: Es sind nicht seine Träume.
 */

/** @returns {Map<string, number>} Tag → Anzahl Träume */
export function appearances(journal) {
  const counts = new Map();
  for (const entry of journal || []) {
    const inThisDream = new Set();
    for (const ref of entry?.references || []) {
      const tag = ref?.tag;
      if (!tag || inThisDream.has(tag)) continue;
      inThisDream.add(tag);
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return counts;
}

/**
 * Die Besetzung einer Gattung, häufigste zuerst.
 *
 * Die Reihenfolge ist der eigentliche Gewinn gegenüber dem alten Raster: Sie
 * sagt selbst etwas aus. Wer oben steht, taucht in den Nächten am häufigsten
 * auf — eine Information, die es sonst nirgends in der App gibt.
 *
 * Gleichstand geht alphabetisch, damit die Liste zwischen zwei Aufrufen nicht
 * springt. Figuren ohne einen einzigen Traum landen unten, aber sie
 * verschwinden nicht: gerade angelegt zu sein ist kein Grund, unsichtbar zu
 * werden.
 *
 * @param {object[]} cast     state.cast
 * @param {object[]} journal  state.journal
 * @param {string} category   "person" | "pet" | "place"
 */
export function castByCategory(cast, journal, category) {
  const counts = appearances(journal);
  return (cast || [])
    .filter((entry) => entry?.category === category)
    .map((entry) => ({ ...entry, count: counts.get(entry.tag) || 0 }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Der Buchstabe, der ohne Foto im Bildfeld steht.
 *
 * Vorher stand dort ein Fragezeichen — das liest sich als „kaputt". Ein
 * Anfangsbuchstabe sagt dasselbe (kein Bild) und behauptet dabei nichts
 * Schlechtes: Die Figur wirkt unfertig, nicht defekt.
 *
 * Über den Zeichenpunkt statt über [0], sonst zerfällt ein Emoji oder ein
 * Zeichen außerhalb der Basisebene in sein halbes Ersatzpaar.
 */
export function initialOf(tag) {
  const first = [...String(tag || "")][0] || "?";
  return first.toLocaleUpperCase();
}
