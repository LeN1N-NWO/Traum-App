/* Assembles the master prompt from local parts. NO model call happens here.
 *
 * ⚠ The riskiest code in the app. Reference clauses say "Reference image 2
 * shows @anton", and that number must line up with the position of Anton's
 * photo in the image array sent to the renderer. A character assigned "let the
 * AI decide" contributes NO image — so it must not consume an index. Get this
 * wrong and people get each other's faces. Hence the tests.
 */
import { styleById } from "./styles.js";

/**
 * @param {object[]} assignments  one per character/place the person kept, in order.
 *        Shape: { name, kind: "person"|"pet"|"place", avatar?: {tag, img, desc}, free?: boolean }
 * @returns {{ references: {tag,img}[], clauses: string[] }}
 *          `references` is exactly what goes into the image array, in order;
 *          clause N refers to references[N-1].
 */
export function buildReferences(assignments = []) {
  const references = [];
  const clauses = [];

  for (const a of assignments) {
    // Only an assignment with an actual image earns an index.
    if (!a || !a.avatar?.img) continue;
    references.push({ tag: a.avatar.tag, img: a.avatar.img });
    const kind = a.kind === "pet" ? "pet" : a.kind === "place" ? "place" : "person";
    const desc = a.avatar.desc ? `, described as: ${a.avatar.desc}` : "";
    clauses.push(
      `Reference image ${references.length} shows @${a.avatar.tag} (${kind}${desc}) — ` +
      `wherever "${a.name}" appears, depict them with this exact likeness, not a generic stand-in.`
    );
  }

  // Characters the person left to the model get named as inventable, so the
  // model does not silently reuse a referenced face for them.
  const free = assignments.filter((a) => a && a.free && !a.avatar?.img).map((a) => a.name);
  if (free.length) {
    clauses.push(`Invent the appearance of ${free.join(", ")} freely; no reference image is given for them.`);
  }

  return { references, clauses };
}

/* Der Bildprompt OHNE seine Referenzklauseln.
 *
 * Wozu: Der fertige Bildprompt dient dem Regisseur als Beschreibung des
 * Startbilds — aber er endet auf Sätzen wie „Reference image 1 shows @anton".
 * Das Videomodell zählt seine eigenen Referenzen als @Image1…9, und dort ist
 * @Image1 IMMER das Startbild. Beide Nummerierungen ungefiltert nebeneinander
 * ergeben denselben Schaden, vor dem der Kopf dieser Datei warnt: Gesichter
 * wandern zur falschen Figur, nur eine Stufe später.
 *
 * Steht bewusst NEBEN buildReferences(): Wer dort die Klausel umformuliert,
 * sieht hier, dass sie auch wieder entfernt werden muss.
 */
export function stripReferenceClauses(prompt) {
  return String(prompt || "")
    .split("\n")
    .filter((l) => !/^\s*(Reference image \d+ shows|Invent the appearance of)/.test(l.trim()))
    .join("\n")
    .trim();
}


/**
 * The prompt for a single image in the sequence.
 * @param {object} p
 * @param {string} p.beat        what this image shows
 * @param {string} p.styleId
 * @param {string} p.format      "9:16" | "16:9"
 * @param {string[]} p.clauses   from buildReferences()
 * @param {number} p.index       1-based, for the reader's sense of sequence
 * @param {number} p.total
 */
/**
 * One request that reads back as several: a wide canvas cut into equal
 * vertical panels by a hard divider line, each panel a distinct beat. A
 * proven shape, not a guess — verified against the real API on 09.08.2026,
 * one call, three cleanly separated scenes, exact thirds crop with no
 * bleed. Only 3 panels is proven; do not raise this without testing first —
 * the per-panel pixel budget shrinks with every extra panel, and faces and
 * hands are exactly what degrades first.
 *
 * The canvas is deliberately wide (16:9, not the app's own 9:16 default) —
 * cutting a WIDE image into vertical strips is what yields portrait-ish
 * single images; cutting a tall one would yield unusable slivers. The
 * caller must request that aspect ratio; this function only writes English.
 *
 * @param {object} p
 * @param {string[]} p.beats     exactly 3, one per panel, left to right
 * @param {string} p.styleId
 * @param {string[]} p.clauses   from buildReferences()
 */
export function buildGridPrompt({ beats, styleId, clauses = [] }) {
  const style = styleById(styleId);
  const refs = clauses.length ? `\n${clauses.join(" ")}` : "";
  const panels = beats
    .map((b, i) => `Panel ${i + 1} (${["leftmost", "middle", "rightmost"][i]} third): ${b}`)
    .join("\n");

  return (
    `A single 16:9 image divided into exactly THREE equal vertical panels side by side, ` +
    `separated by a thin solid black divider line running the full height between each panel — ` +
    `like a triptych or a 3-panel comic strip. The panels fill the ENTIRE canvas edge to edge: ` +
    `no letterboxing, no black bars above or below, no outer frame or margin of any kind. ` +
    `Each panel is a self-contained cinematic photoreal ` +
    `film still with no bleed or shared elements across the divider lines.` +
    `\n${panels}` +
    `\nConsistent color grade and lighting across all three panels so they read as one continuous ` +
    `sequence, in this style: ${style.prompt}` +
    `\nUltra-detailed, accurate hands and faces. No text, no captions, no watermarks.${refs}`
  );
}

export function buildImagePrompt({ beat, styleId, format, clauses = [], index = 1, total = 1, prevFrame = false }) {
  const style = styleById(styleId);
  const framing = format === "16:9" ? "16:9 widescreen framing" : "9:16 vertical framing";
  const place = total > 1 ? ` This is image ${index} of ${total} in one continuous dream sequence; keep characters, wardrobe and palette consistent across all of them.` : "";
  /* Der Weltanker der Bildkette (Antons Ansage 22.08.). Die Struktur folgt
     dem, was Nano Banana versteht: Referenzen werden ÜBER IHRE POSITION
     angesprochen. Der Server hängt den vorigen Frame als LETZTES Bild an
     (falSubmitImage) — dieser Satz hier benennt genau diese Position. Wer
     die Reihenfolge dort ändert, macht diesen Satz zur Lüge.
     Zwei Aufgaben, sauber getrennt: Der Frame gibt Welt, Licht und Farbe
     vor — die FIGUREN bleiben an ihre eigenen Fotos gebunden (clauses).
     Ein Anker ersetzt keine Besetzung. Und er gibt nur die Welt vor, nie
     den Bildaufbau: sonst klebt jede Szene in der Komposition der ersten. */
  const anchor = prevFrame
    ? "\nThe LAST reference image is the previous frame of this exact dream sequence. " +
      "Match its colour grade, light, weather, environment and overall world precisely — " +
      "these are consecutive stills from one film. Do not copy its composition; stage this " +
      "scene's own action. Every named character must still match their own reference photo."
    : "";
  const refs = clauses.length ? `\n${clauses.join(" ")}` : "";

  return (
    `A cinematic, photoreal film still: ${beat}` +
    `\n${style.prompt}` +
    `\n${framing}, ultra-detailed, accurate hands and faces.${place}${refs}${anchor}`
  );
}

/* Ein Referenzbild aus einer Beschreibung — der „Charakterbogen".
 *
 * Wozu das überhaupt gut ist, steht nicht im Preis: Ohne Foto reicht die
 * Beschreibung als WORTE in jeden Bildauftrag, und der Renderer erfindet die
 * Figur jedes Mal neu. In einer Zehnerstrecke sind das zehn verschiedene
 * Menschen mit demselben Namen. Ein einmal erzeugtes Bild macht daraus eine
 * Referenz, und ab da läuft es über denselben `.../edit`-Pfad wie ein echtes
 * Foto — dieselbe Person in jedem Bild.
 *
 * Deshalb ist das hier ausdrücklich KEIN Szenenbild: neutraler Hintergrund,
 * frontal, gleichmäßiges Licht, keine Handlung, kein Stil. Alles, was das
 * Bild interessant machen würde, macht es als Referenz schlechter — ein
 * dramatischer Schatten wandert später in jedes Bild der Strecke mit.
 *
 * Bewusst OHNE styleId: der Stil gehört an die Traumbilder, nicht an die
 * Referenz. Sonst kann man die Figur nicht in einem zweiten Traum mit
 * anderem Stil wiederverwenden.
 */
export function buildCharacterPrompt({ desc, category = "person" }) {
  const clean = String(desc || "").trim();
  const framing = {
    person: "Head-and-shoulders reference portrait of one person, facing the camera, "
          + "neutral expression, eyes open and visible.",
    pet: "Reference photo of one animal, side-on to three-quarter view, whole animal in frame, "
       + "head clearly visible.",
    place: "Establishing reference photograph of one location, eye level, no people in frame.",
  }[category] || "Reference portrait of one subject, facing the camera.";

  return [
    framing,
    `The subject: ${clean}`,
    "Plain mid-grey background, even soft lighting, no shadows cast on the background.",
    "Sharp focus, natural colour, photographic. No text, no logos, no border, no collage.",
    "Do not add props, weather, story or mood — this is a reference sheet, not a scene.",
  ].join(" ");
}

/* Der Bogen aus einem FOTO — die Umkehrung von buildCharacterPrompt: dort
 * erschafft eine Beschreibung die Figur, hier wird eine vorhandene
 * normalisiert. Warum überhaupt, steht im Plan (2026-08-20-charakterbogen-
 * pflicht.md) und ist bezahlt bewiesen: Ein Foto mit Umgebung blutet seine
 * Umgebung in jede Szene (Lenas Segelboot, 19./20.08.); derselbe Auftrag
 * über den Bogen ist sauber, und die Ähnlichkeit hält trotz der einen
 * Generation Abstand. Der Wortlaut hier IST der getestete Prompt des
 * Prüfsteins (§7), nur die Gattung ist parametrisiert.
 *
 * Orte bekommen absichtlich KEINEN Bogen — ein Ort ist seine Umgebung, ihn
 * zu neutralisieren löschte genau das, was referenziert werden soll. Der
 * Aufrufer filtert; kommt trotzdem "place" an, gilt die Personenform, denn
 * ein grauer Bogen ist immer noch besser als ein ungeprüfter Durchlauf.
 *
 * `desc` legt die Garderobe EINMAL im Bogen fest statt in jedem Bild neu —
 * dieselbe Anti-Drift-Linie wie beim Regisseur (keine erfundene Garderobe). */
export function buildSheetFromPhotoPrompt({ desc, category = "person" } = {}) {
  const clean = String(desc || "").trim();
  const panels = category === "pet"
    ? "left panel the whole animal standing, side-on to three-quarter view; "
      + "right panel a close view of its head, eyes clearly visible. "
      + "Same animal, same likeness, same coat in both panels."
    : "left panel the full body standing, facing the camera; "
      + "right panel a head-and-shoulders portrait, neutral expression, eyes open and visible. "
      + "Same person, same likeness, same outfit in both panels.";

  return [
    `Reference sheet of the ${category === "pet" ? "animal" : "person"} shown in reference image 1, `
      + `split into two panels side by side: ${panels}`,
    clean ? `Look and wardrobe: ${clean}. Depict exactly this in both panels.` : "",
    "Plain mid-grey background in both panels, even soft lighting, no shadows cast on the background.",
    "Sharp focus, natural colour, photographic. No text, no logos, no border decorations.",
    "Do not add props, scenery, weather, story or mood — this is a reference sheet, not a scene.",
  ].filter(Boolean).join(" ");
}
