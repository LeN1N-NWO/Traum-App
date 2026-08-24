/* Die Einstellung — was für ein Bild das ist, nicht wie es aussieht.
 *
 * ── Der Befund, aus dem das entstand (Anton, 23.08.2026) ──────────────────
 * „Die Bilder sind überhaupt nicht cinematic." Er hat recht, aber die
 * Ursache liegt woanders, als es scheint: Der DEAKINS-LOOK steht längst im
 * Prompt — `styles.js`, Stil „ultrareal", nennt eine motivierte Lichtquelle,
 * minimales Aufhellen, 40 mm auf Augenhöhe, T2.8, gemischte Farbtemperaturen
 * und „invisible technique". Das ist Deakins' Grammatik, wörtlich.
 *
 * Was FEHLTE, war die Einstellung. Jedes Bild kam als dieselbe Aufnahme
 * zurück: Person mittig, frontal, Augenhöhe, formatfüllend. Vier davon
 * nebeneinander sind kein Film, sondern vier Passfotos an vier Orten. Ein
 * Kameramann dreht eine Szene nicht viermal gleich — er etabliert weit, geht
 * näher, sucht ein Gesicht, tritt zurück. Genau diese Abfolge stand nirgends.
 *
 * ── Die Arbeitsteilung, und warum sie strikt ist ──────────────────────────
 * ⚠ Diese Datei sagt NICHTS über Optik, Licht oder Farbe. Kein Objektiv,
 * keine Blende, keine Lichtfarbe. Das gehört dem STIL — und die Stile
 * widersprechen sich darin absichtlich: „dreamlike" will 50 mm mit weichem
 * Randabfall, „adventure" 24 mm und tiefe Winkel, „noir" 35 mm mit
 * Dutch-Angle. Nennte diese Datei auch ein Objektiv, stünden in jedem Prompt
 * zwei verschiedene Brennweiten, und das Modell entscheidet dann selbst,
 * welche es glaubt. Ein Prompt, der sich widerspricht, ist schlechter als
 * einer, der schweigt.
 *
 * Hier steht deshalb nur, was jeder Stil gleich beantwortet: Wie NAH bin ich
 * dran, WO steht die Kamera, und WO im Bild steht die Figur.
 *
 * Reine Rechnung, kein DOM, kein Modellwissen — nur Text.
 */

/* Die Deckung einer Szene, wie sie am Schneidetisch Sinn ergibt. Vier
 * Einstellungen im Wechsel, nicht zufällig, sondern in der Reihenfolge, in
 * der ein Mensch eine Szene begreift: erst wo bin ich, dann wer ist da,
 * dann was fühlt der, dann wie klein ist er darin.
 *
 * ⚠ `place` ist der Teil, der die Passfotos abstellt. „Rule of thirds" allein
 * reicht nicht — Modelle zentrieren trotzdem. Es muss dastehen, dass die
 * Mitte FREI bleibt. */
const SHOTS = [
  {
    id: "establish",
    frame: "a wide establishing shot: the environment dominates and the figure is small within it, "
         + "no larger than a third of the frame height",
    height: "Camera at eye level, level horizon",
    place: "the figure stands off-centre on a third, the opposite side of the frame left open",
  },
  {
    id: "medium",
    frame: "a medium shot from the waist up, the figure turned slightly away from the lens "
         + "rather than facing it squarely",
    height: "Camera at eye level",
    place: "there is something real in the near foreground — an edge, a surface, a shoulder — "
         + "giving the picture a front, a middle and a back",
  },
  {
    id: "close",
    frame: "a close shot: head and shoulders, the background falling away soft and unreadable",
    height: "Camera a touch below eye level",
    place: "the face sits high and off-centre, with air on the side the eyes are looking toward",
  },
  {
    id: "low-wide",
    frame: "a wide shot from low down, the figure read against whatever is above — sky, ceiling, "
         + "canopy, water surface",
    height: "Camera low, near knee height, tilted slightly up",
    place: "generous empty space is left above the figure, and that emptiness carries the shot",
  },
];

/* ⚠ Was in JEDEM Bild steht, unabhängig von der Einstellung. Drei Verbote,
 * jedes gegen einen Fehler, der in den Läufen vom 23.08. wirklich auftrat:
 *   · „nicht mittig, nicht frontal" — sonst kommt das Passfoto zurück.
 *   · „nicht in die Kamera schauen" — vier Bilder, in denen jemand den
 *     Betrachter anstarrt, sind ein Fotoshooting, kein Traum.
 *   · „kein Plakat" — die Einzelbilder kamen als Filmplakate zurück:
 *     Vollmond mittig, Symmetrie, alles auf Wirkung. Schön einzeln,
 *     zusammenhanglos in Folge. */
const IMMER =
  "This is a frame from a film, not a portrait and not a poster: the subject is not centred, "
  + "not symmetrical and not posed for the camera, and does not look into the lens unless the "
  + "scene demands it. Nothing is arranged for effect.";

/** Welche Einstellung Bild `index` von `total` bekommt (1-basiert).
 *
 *  Die erste ist IMMER die etablierende — man muss wissen, wo man ist,
 *  bevor jemand ein Gesicht bekommt. Danach läuft der Zyklus durch.
 *  Deterministisch: derselbe Traum ergibt zweimal dieselbe Auflösung, und
 *  der Rasterprompt und der Einzelprompt können nicht auseinanderlaufen.
 */
export function shotFor(index, total = 1) {
  const i = Math.max(1, Math.floor(Number(index) || 1));
  if (total <= 1) return SHOTS[1];        // ein einzelnes Bild: die Halbnahe trägt am meisten
  if (i === 1) return SHOTS[0];           // etablieren
  return SHOTS[(i - 1) % SHOTS.length];
}

/** Der Satz, der in den Prompt geht. Ein Satz, keine Liste — Deakins'
 *  eigene Regel gegen das Überbeschreiben („Trust simplicity"). */
export function shotClause(index, total = 1) {
  const s = shotFor(index, total);
  return `Shot: ${s.frame}. ${s.height}. Compose so that ${s.place}. ${IMMER}`;
}

/** Alle Einstellungen einer Strecke — für den Rasterprompt, der jede Kachel
 *  einzeln benennen muss, und für die Anzeige im Prompt-Betrachter. */
export function shotPlan(total) {
  const n = Math.max(1, Math.floor(Number(total) || 1));
  return Array.from({ length: n }, (_, i) => shotFor(i + 1, n));
}

export { SHOTS };

/* ── Der Foto-Anker ───────────────────────────────────────────────────────
 *
 * Antons Befund vom 24.08.2026: GPT Image 2 liefert schöne Bilder, die aber
 * gemalt aussehen statt fotografiert. Die Recherche zeigt, dass die Ursache
 * bei UNS liegt, nicht beim Modell:
 *
 * ⚠ Unsere eigenen Stiltexte BESTELLEN den Malerei-Look. `surreal` sagt
 * wörtlich „flat even lighting like a Magritte painting", `dreamlike` will
 * „shapes dissolving slightly where the light fades". Das Modell hat
 * gehorcht. Zwei der drei Testträume liefen auf genau diesen Stilen.
 *
 * Die Prompt-Leitfäden zu GPT Image 2 sagen dazu zwei Dinge, die hier
 * eingebaut sind:
 *   1. „photorealistic" ist der zuverlässigste einzelne Auslöser — es muss
 *      dastehen, nicht umschrieben werden.
 *   2. Lob rendert nicht. „stunning", „epic", „masterpiece" schieben ins
 *      Malerische; konkrete fotografische Tatsachen (Hautporen, Gewebe,
 *      Belichtung) ziehen zurück.
 *
 * Der letzte Satz ist der wichtigste und der unübliche: Er sagt dem Modell,
 * wie es die STILWÖRTER lesen soll. „Auflösende Formen" darf ein Objektiv-
 * und Dunstphänomen sein, aber kein Pinselstrich. So bleibt der Stil
 * erhalten, ohne dass er die Fotografie frisst.
 */
export const PHOTOREAL =
  "Photorealistic. This is a photograph taken with a real camera on real film or a real sensor — "
  + "not a painting, not an illustration, not a 3D render, not digital art and not concept art. "
  + "Real skin with visible pores, fine hair and uneven texture; real fabric with a visible weave; "
  + "real surfaces with dust, wear and fingerprints. Correct exposure with detail held in the "
  + "shadows and no crushed blacks, no added vignette, no HDR glow, no bloom beyond what a lens "
  + "actually does. "
  + "Read every stylistic instruction above as something achieved IN CAMERA — through light, "
  + "lens, atmosphere, weather and film stock — never through brushwork, painterly texture or "
  + "post-production effects.";

/** Der Foto-Anker, wenn er gewünscht ist. Eigene Funktion statt einer
 *  Konstante im Prompt, damit er sich abschalten lässt: Für einen bewusst
 *  gemalten Stil wäre er ein Widerspruch, und ein Prompt, der sich
 *  widerspricht, ist schlechter als einer, der schweigt. */
export function photorealClause(an = true) {
  return an ? `\n${PHOTOREAL}` : "";
}
