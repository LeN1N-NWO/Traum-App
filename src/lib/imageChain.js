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
 *   entry.chain = { next, total, beats: [Szenentexte], step }
 *     `step` ist neu seit dem 24.08.2026: wie viele Szenen EIN Auftrag
 *     trägt — 1 beim Einzelbild, 4 beim 2×2-Raster. `next` zählt weiterhin
 *     SZENEN. Alte Einträge ohne `step` verhalten sich exakt wie vorher.
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
import { buildReferences, buildImagePrompt, buildGridPrompt } from "./promptBuilder.js";
import { renderRef } from "./sheets.js";
import { GRID_COLS, GRID_ROWS } from "./gridLayout.js";

/* ── Ein Auftrag kann seit dem 24.08.2026 MEHRERE Szenen tragen ───────────
 *
 * `chain.step` sagt, wie viele: 1 bei Einzelbildern, 4 beim 2×2-Raster.
 * `chain.next` zählt weiterhin SZENEN, nicht Aufträge — daran hängen die
 * Szenentexte, und eine zweite Zählweise wäre eine zweite Wahrheit.
 *
 * ⚠ Fehlt `step` (alte Einträge, die noch offen im Journal liegen), gilt 1.
 * Das ist genau ihr altes Verhalten; sie dürfen von der Umstellung nichts
 * merken. */
function stepOf(entry) {
  return Math.max(1, entry?.chain?.step || 1);
}

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
  const step = stepOf(entry);
  if (jobs.length !== entry.chain.next / step) return null;  // Einreichung läuft gerade
  const last = jobs[jobs.length - 1];
  if (!last || (!last.url && !last.failed)) return null;     // Vorgänger noch unterwegs

  /* ⚠ Beim Raster wartet die Kette zusätzlich auf den SCHNITT. Der Anker für
     den zweiten Block ist die LETZTE KACHEL des ersten — solange das
     Rasterbild ungeschnitten ist, gäbe es nur das ganze Raster, und der
     zweite Block bekäme ein Bild mit vier Szenen darin als „voriger Frame".
     Das Ergebnis wäre ein Raster im Raster, bezahlt. */
  if (last.url && last.grid && !last.tileUrls) return null;

  /* Der Anker ist das JÜNGSTE fertige Einzelbild. Beim Raster steht es in
     `tileUrls` des Auftrags, beim Einzelbild ist `url` schon eines. */
  const fertig = [...jobs].reverse().find((j) => j.tileUrls?.length || j.url);
  const ref = fertig ? (fertig.tileUrls?.slice(-1)[0] || fertig.url || null) : null;

  return { beatIndex: entry.chain.next, sequenceRef: ref, step };
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
  /* ⚠ Beim Raster sind es MEHRERE Szenen auf einmal — und der letzte Block
     kann kürzer sein als die Rasterplätze (bei acht Szenen geht es auf, bei
     einer Auswahl von sechs nicht). `slice` kappt von selbst; die leeren
     Plätze regelt buildGridPrompt. */
  const beats = (entry.chain.beats || []).slice(step.beatIndex, step.beatIndex + step.step);
  if (!beats.length || !beats[0]) return null;
  const beat = beats[0];

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

  const styleId = entry.style || entry.analysis?.style || "dreamlike";

  /* ⚠ Der Rasterzweig baut einen ANDEREN Prompt, nicht denselben mit anderen
     Zahlen. Ein Rasterbild muss sagen, dass es ein Raster IST, in welcher
     Lesereihenfolge die Kacheln stehen und was mit leeren Plätzen passiert —
     `buildImagePrompt` sagt nichts davon, und ein Modell, das das nicht
     gesagt bekommt, liefert vier Varianten DERSELBEN Szene. */
  const prompt = step.step > 1
    ? buildGridPrompt({
        beats, styleId, clauses, cols: GRID_COLS, rows: GRID_ROWS,
        tile: entry.format || "9:16",
      })
    : buildImagePrompt({
        beat, styleId, format: entry.format || "9:16", clauses,
        index: step.beatIndex + 1, total: entry.chain.total,
        prevFrame: !!step.sequenceRef,
      });

  return {
    beatIndex: step.beatIndex,
    sequenceRef: step.sequenceRef,
    cast: castForApi,
    /* ⚠ ZWEI verschiedene Zahlen, und sie am 25.08.2026 zu verwechseln hat
       im ersten bezahlten Lauf acht Credits für fünf Bilder gekostet:
         `slots`  — wie viele Plätze das Raster HAT (immer 4). Entscheidet,
                    ob überhaupt ein Raster bestellt wird.
         `tiles`  — wie viele ECHTE Szenen darin stecken (1 bis 4).
                    Entscheidet, was abgerechnet, was behalten und was
                    erstattet wird.
       Beim letzten Block eines Traums mit fünf Szenen ist slots=4 und
       tiles=1: Ein angefangenes Raster ist ein voller, bezahlter AUFRUF —
       aber der Mensch bekommt daraus EIN Bild und zahlt einen Credit. Der
       Verschnitt geht zu unseren Lasten, und genau deshalb sind vier und
       acht die Traumgrößen (pricing.js). */
    slots: step.step,
    tiles: beats.length,
    prompt,
  };
}
