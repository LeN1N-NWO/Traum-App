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

/* ── Casting: wer in den Träumen vorkommt, aber noch kein Gesicht hat ──
 * (Antons Wahl 10.10., „Abspann plus Casting"). Jede Traum-Auswertung kennt
 * ihre Personen, Tiere, Orte und Dinge (server.js, Analyse: people[],
 * places[], objects[]). Gezählt wird, in wie vielen Träumen ein Name
 * vorkommt, der noch zu keiner Figur der Besetzung passt — die häufigsten
 * zuerst. Fremde („eine Frau", „a stranger") und der Träumer selbst
 * („ich", „me") sind keine Kandidaten. Rein, ohne DOM — castStats.test.js. */
const SELF = new Set(["i", "me", "myself", "thedreamer", "ich", "mich", "mir", "ichselbst", "dertraumer", "dietraumerin", "dertraeumer", "dietraeumerin"]);
const STRANGER = /^(ein|eine|einen|einem|einer|a|an|some|irgendein|irgendeine|jemand|someone)\s/i;

function keyOf(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

/* Ein kurzer Vorschlag für das @-Kürzel (10.10.): „Brücke aus Klaviertasten"
   wurde sonst zu „brckeausklav" (Umlaute fielen weg, abgeschnitten nach 12).
   Umlaute werden umschrieben, Artikel fallen weg, und genommen wird das
   erste großgeschriebene Wort (im Deutschen das Hauptwort: „leerer Strand"
   → „strand"), sonst das erste Wort mit mindestens vier Buchstaben. */
const ARTICLE = /^(der|die|das|den|dem|des|ein|eine|einen|mein|meine|meinen|the|a|an|my|our)$/i;
export function tagSuggestion(name) {
  const words = String(name || "").trim().split(/\s+/).filter((w) => w && !ARTICLE.test(w));
  const pick = words.find((w) => /^[A-ZÄÖÜ]/.test(w)) || words.find((w) => w.replace(/[^\p{L}]/gu, "").length >= 4) || words[0] || "";
  return pick.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "").slice(0, 12);
}

/** Die häufigsten Namen aus den Träumen, die noch keine Figur sind.
 *  @returns {{name:string, category:"person"|"pet"|"place"|"object", count:number}[]} */
export function castSuggestions(journal, cast, { limit = 3 } = {}) {
  const have = new Set((cast || []).map((c) => keyOf(c?.tag)).filter(Boolean));
  const tally = new Map();
  for (const entry of journal || []) {
    const a = entry?.analysis;
    if (!a) continue;
    const at = new Date(entry.createdAt || 0).getTime() || 0;
    const seen = new Set();
    const add = (raw, category) => {
      const name = String(raw || "").trim();
      const key = keyOf(name);
      if (!key || SELF.has(key) || have.has(key) || seen.has(key) || STRANGER.test(name)) return;
      seen.add(key);
      const t = tally.get(key) || { name, category, count: 0, at: 0 };
      t.count += 1;
      if (at >= t.at) { t.at = at; t.name = name; }
      tally.set(key, t);
    };
    for (const p of a.people || []) add(typeof p === "string" ? p : p?.name, typeof p === "object" && p?.kind === "pet" ? "pet" : "person");
    for (const p of a.places || []) add(p, "place");
    for (const o of a.objects || []) add(o, "object");
  }
  return [...tally.values()]
    .sort((x, y) => y.count - x.count || y.at - x.at)
    .slice(0, limit)
    .map(({ name, category, count }) => ({ name, category, count, tag: tagSuggestion(name) }));
}
