/* Der Traumatlas — Muster aus dem, was die App LÄNGST speichert.
 *
 * Das dreimal bestätigte Muster (Kaufblatt, Besetzung, Filme) ein viertes
 * Mal: `analysis` trägt Stimmung und englische Beats, `references` die
 * Besetzung, symbols.js kennt die Symbole — gezeigt hat das bisher niemand.
 * Alles hier ist reine Rechnung über state.journal, kein API-Aufruf, kein
 * externes Gedächtnis (ADR-0001): der Atlas entsteht bei jedem Rendern neu,
 * wie die Symbolseite es vormacht — keine Migration, keine Doppeldaten.
 *
 * ⚠ Erkannt wird auf Text UND Beats: die Stichwortlisten in symbols.js sind
 * englisch, Träume sind es oft nicht — aber die Beats aus der Analyse sind
 * IMMER englisch. Ohne sie wäre der Atlas für deutsche Träume leer.
 */
import { detectSymbols, symbolById } from "./symbols.js";

// Seed-Träume erzählen nichts über den Menschen (dieselbe Linie wie
// castStats: references leer, id mit e_seed-Präfix).
const isSeed = (e) => String(e?.id || "").startsWith("e_seed");

export function realDreams(journal) {
  return (journal || []).filter((e) => e && !isSeed(e));
}

function detectableText(e) {
  return [e.text || "", ...(e.analysis?.beats || [])].join(" ");
}

/** Symbole über alle Träume: [{id, count, entryIds}], häufigste zuerst.
 *  entryIds neueste zuerst — die Listen darunter stimmen dann ohne
 *  weiteres Sortieren. */
export function symbolCounts(journal) {
  const dreams = realDreams(journal)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const map = new Map();
  for (const e of dreams) {
    for (const id of detectSymbols(detectableText(e))) {
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(e.id);
    }
  }
  return [...map.entries()]
    .map(([id, entryIds]) => ({ id, count: entryIds.length, entryIds }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

/** Stimmungen (analysis.mood, Freitext in Traumsprache): [{mood, count}]. */
export function moodCounts(journal) {
  const map = new Map();
  for (const e of realDreams(journal)) {
    const mood = String(e.analysis?.mood || "").trim().toLowerCase();
    if (!mood) continue;
    map.set(mood, (map.get(mood) || 0) + 1);
  }
  return [...map.entries()]
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count || a.mood.localeCompare(b.mood));
}

/** Der Monat in vier Zahlen: Träume, Top-Symbol, Top-Stimmung, Top-Figur. */
export function monthReview(journal, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const dreams = realDreams(journal).filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === y && d.getMonth() === m;
  });
  const castMap = new Map();
  for (const e of dreams) {
    for (const r of e.references || []) {
      castMap.set(r.tag, (castMap.get(r.tag) || 0) + 1);
    }
  }
  const topCast = [...castMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))[0] || null;
  return {
    count: dreams.length,
    topSymbol: symbolCounts(dreams)[0] || null,
    topMood: moodCounts(dreams)[0] || null,
    topCast,
  };
}

/** Kontextzeilen für die Reflection — kompakt und englisch (DeepSeek liest
 *  englisch am verlässlichsten; geantwortet wird in der Traumsprache).
 *  Nur Muster, die DIESEN Traum berühren: Symbole, die er teilt, und
 *  Figuren, die er referenziert. Genau das unterscheidet unsere Deutung
 *  vom Lexikon der Konkurrenz — „der Zug taucht zum dritten Mal auf"
 *  schlägt jede Wörterbuch-Definition. Höchstens fünf Zeilen: Kontext
 *  würzt den Brief, er ist nicht das Gericht. */
export function reflectionContext(journal, entry) {
  const others = realDreams(journal).filter((e) => e.id !== entry?.id);
  const lines = [];

  const own = new Set(detectSymbols(detectableText(entry || {})));
  for (const s of symbolCounts(others)) {
    if (lines.length >= 3) break;
    if (!own.has(s.id)) continue;
    const label = symbolById(s.id)?.label || s.id;
    lines.push(`${label}: also in ${s.count} earlier dream${s.count === 1 ? "" : "s"}`);
  }

  const castMap = new Map();
  for (const e of others) {
    for (const r of e.references || []) {
      castMap.set(r.tag, (castMap.get(r.tag) || 0) + 1);
    }
  }
  for (const r of entry?.references || []) {
    if (lines.length >= 5) break;
    const n = castMap.get(r.tag);
    if (n) lines.push(`${r.tag}: appears in ${n} earlier dream${n === 1 ? "" : "s"}`);
  }
  return lines;
}
