/* Foto-Tags — portiert aus legacy/app.js.
 *
 * Ein Avatar trägt einen selbst vergebenen Tag ("anna", "island"). Nennt der
 * Traumtext diesen Tag, geht das Foto als benannte Referenz an die
 * Bildgenerierung.
 *
 * Wortgrenzen sind Pflicht: "anna" darf nicht in "annals" anschlagen und "ex"
 * nicht in "exam". Gleiche Logik wie bei der Symbolerkennung.
 *
 * ⚠ Ab Phase 2 ist diese Erkennung nur noch ein VORSCHLAG: der Wizard lässt
 * den Menschen jede Person ausdrücklich zuordnen. Heute ist sie noch der
 * Filter — deshalb bekommt "meine Schwester" derzeit kein Referenzfoto,
 * obwohl eins da wäre.
 */

export function mentionsTag(text, tag) {
  if (!tag) return false;
  const esc = String(tag).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(String(text || ""));
}

/** Fundstellen eines Tags im Text: [{start,end,tag}], für die Hervorhebung. */
export function findTagSpans(text, tags) {
  const spans = [];
  for (const tag of tags) {
    if (!tag) continue;
    const esc = String(tag).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])(${esc})([^a-z0-9]|$)`, "gi");
    let m;
    while ((m = re.exec(String(text || ""))) !== null) {
      const start = m.index + m[1].length;
      spans.push({ start, end: start + m[2].length, tag });
      re.lastIndex = start + m[2].length;   // Überlappungen zulassen
    }
  }
  // nach Position sortieren, Überschneidungen verwerfen (längster Treffer gewinnt)
  spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const clean = [];
  let last = -1;
  for (const s of spans) { if (s.start >= last) { clean.push(s); last = s.end; } }
  return clean;
}

/** Alle Avatare, die der Text namentlich nennt (inkl. @me).
 *  Nimmt den Zustand als Parameter — früher las es eine globale Variable,
 *  was in React weder prüfbar noch nachvollziehbar wäre. */
export function taggedPhotosIn(state, text) {
  const out = [];
  if (state?.me?.img && mentionsTag(text, "me")) {
    out.push({ tag: "me", category: "person", img: state.me.img });
  }
  for (const p of state?.cast || []) {
    if (p.img && mentionsTag(text, p.tag)) out.push(p);
  }
  return out;
}
