/* Die Bildkette — Antons Ansage vom 22.08.2026:
 *
 * „Das erste Bild, das generiert wird, muss wieder als Input für das
 * nächste Bild genutzt werden, und so weiter. Da das eh in der
 * Warteschlange unabhängig von uns weitergeht, kann das ein bisschen
 * länger dauern. Sonst fehlt uns der Bezug, und das sieht alles nicht wie
 * ein Film aus, sondern wie verschiedene Sachen."
 *
 * Vorher gingen alle Szenen einer Strecke GLEICHZEITIG in die Warteschlange
 * — schnell, aber jedes Bild erfand Licht, Palette und Welt neu; die
 * Konsistenz hing allein an Worten („keep palette consistent") und an den
 * Figuren-Referenzen. Jetzt wartet Szene n+1 auf Szene n und bekommt deren
 * Bild als Weltanker mit (Nano-Banana-Struktur: das LETZTE Referenzbild ist
 * der vorige Frame; die Figuren bleiben trotzdem in jedem Bild einzeln an
 * ihre eigenen Fotos gebunden — ein Anker ersetzt keine Besetzung).
 *
 * Bausteine:
 *   entry.chain = { next, total, beats: [Szenentexte] }
 *     `beats` steht IN der Kette, nicht nur in der Analyse: Wer 3 von 5
 *     Szenen bestellt, rendert eine Auswahl — die Analyse-Liste wäre die
 *     falsche.
 *   chainStep()            — ist der nächste Schritt fällig, und mit
 *                            welchem Anker?
 *   buildChainSubmission() — alles für den Auftrag, rein und testbar;
 *                            den Netzwerkteil macht AppState.
 *
 * Die Kette überlebt einen Neustart gratis: Sie lebt am Eintrag im
 * Journal, der Collector holt den offenen Auftrag ab, und der Läufer in
 * AppState reicht die nächste Szene nach, sobald das Bild da ist.
 *
 * Scheitert eine Szene, läuft die Kette WEITER — mit dem jüngsten
 * gelungenen Bild als Anker. Ein Loch in der Strecke ist erstattbar
 * (Collector), eine abgebrochene Strecke wäre lauter bezahltes Treibgut.
 */
import { buildReferences, buildImagePrompt } from "./promptBuilder.js";
import { renderRef } from "./sheets.js";

/** Stehen noch Szenen aus? (Collector: nicht abschließen; AppState: ticken.) */
export function chainRemaining(entry) {
  const c = entry?.chain;
  return !!c && c.next < c.total;
}

/** Der nächste fällige Schritt — oder null, wenn nichts zu tun ist.
 *  Fällig heißt: alle bisherigen Szenen sind eingereicht UND die letzte ist
 *  entschieden (Bild da oder gescheitert). Solange sie rendert, wartet die
 *  Kette — genau das ist ihr Sinn. */
export function chainStep(entry) {
  if (!chainRemaining(entry)) return null;
  const jobs = entry.imageJobs || [];
  if (jobs.length !== entry.chain.next) return null;       // Einreichung läuft gerade
  const last = jobs[jobs.length - 1];
  if (!last || (!last.url && !last.failed)) return null;   // Vorgänger noch unterwegs
  const ref = [...jobs].reverse().find((j) => j.url)?.url || null;
  return { beatIndex: entry.chain.next, sequenceRef: ref };
}

/** Fingerabdruck der fälligen Schritte — der Effekt in AppState läuft nur,
 *  wenn sich hieran etwas ändert, nicht bei jedem Tastendruck. */
export function chainFingerprint(journal) {
  return (journal || [])
    .map((e) => { const s = chainStep(e); return s ? `${e.id}:${s.beatIndex}` : null; })
    .filter(Boolean)
    .join(",");
}

/** Alles, was der Auftrag braucht — Prompt, Besetzung, Anker. Rein:
 *  dieselbe Rekonstruktion wie renderScene im Traum-Detail (Referenzen aus
 *  entry.references + Bibliothek), damit die Gesichter auch in Szene 4
 *  noch stimmen. */
export function buildChainSubmission(entry, { cast = [], me = null } = {}) {
  const step = chainStep(entry);
  if (!step) return null;
  const beat = entry.chain.beats?.[step.beatIndex];
  if (!beat) return null;

  const pool = [...cast, ...(me ? [me] : [])];
  const byTag = new Map(pool.filter((a) => a?.tag).map((a) => [a.tag, a]));
  const assigns = (entry.references || [])
    .map((r) => ({ kind: r.category || "person", avatar: byTag.get(r.tag) }))
    .filter((a) => a.avatar?.img);
  const { clauses } = buildReferences(assigns);
  const castForApi = assigns.map(({ kind, avatar }) => {
    const category = kind === "pet" ? "pet" : kind === "place" ? "place" : "person";
    return {
      tag: avatar.tag, category, desc: avatar.desc || "",
      img: renderRef({ ...avatar, category, desc: avatar.desc || "" }),
    };
  });

  return {
    beatIndex: step.beatIndex,
    sequenceRef: step.sequenceRef,
    cast: castForApi,
    prompt: buildImagePrompt({
      beat,
      styleId: entry.style || entry.analysis?.style || "dreamlike",
      format: entry.format || "9:16",
      clauses,
      index: step.beatIndex + 1,
      total: entry.chain.total,
      prevFrame: !!step.sequenceRef,
    }),
  };
}
