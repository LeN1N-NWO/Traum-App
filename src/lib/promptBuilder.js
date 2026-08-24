/* Assembles the master prompt from local parts. NO model call happens here.
 *
 * ⚠ The riskiest code in the app. Reference clauses say "Reference image 2
 * shows @anton", and that number must line up with the position of Anton's
 * photo in the image array sent to the renderer. A character assigned "let the
 * AI decide" contributes NO image — so it must not consume an index. Get this
 * wrong and people get each other's faces. Hence the tests.
 */
import { styleById } from "./styles.js";
import { shotClause } from "./cinematography.js";
import { slotName } from "./gridLayout.js";

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
    /* Die Garderobe DIESES Traums — nicht die der Figur.
     *
     * ⚠ Der Unterschied ist der ganze Punkt: `avatar.desc` gehört der Person
     * für immer und steht in jedem Traum; `wardrobe` gehört diesem einen
     * Traum. Bis zum 24.08.2026 gab es nur das erste, und deshalb trug jede
     * Figur in Traum 40 dasselbe wie in Traum 1 — nämlich das, was der Bogen
     * zeigte.
     *
     * Der Satz sagt AUSDRÜCKLICH, dass er das Referenzbild schlägt. Ohne das
     * gewinnt das Bild: Ein Modell glaubt eher, was es sieht, als was es
     * liest. Gemessen am 23.08. — GPT hat die Badehose aus dem Bogen in eine
     * nächtliche Bibliothek mitgenommen, Nano Banana nicht.
     *
     * Und er nennt zuerst, was BLEIBT: Gesicht, Haare, Statur. Sonst liest
     * sich „trägt etwas anderes" wie „ist jemand anderes". */
    const garderobe = a.wardrobe
      ? ` In THIS dream they are wearing: ${a.wardrobe}. This overrides the clothing visible in ` +
        `the reference image — keep the face, hair and build from it, but dress them as described here.`
      : "";
    clauses.push(
      `Reference image ${references.length} shows @${a.avatar.tag} (${kind}${desc}) — ` +
      `wherever "${a.name}" appears, depict them with this exact likeness, not a generic stand-in.` +
      garderobe
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
 * ── Seit 23.08.2026 zusätzlich: das echte Raster (rows > 1) ──────────────
 * Der Grund für den zweiten Zweig ist ein Preiswechsel, keine Laune:
 * Seedream rechnet FLACH je Bild bis 3K — Auflösung kostet dort nichts
 * mehr. Damit dreht sich die Rechnung von 2026-08-19 um, die den Streifen
 * auf drei Panels festgenagelt hat: Ein 3×2-Raster liefert sechs Szenen
 * für den Preis von einer.
 *
 * ⚠ Der Vorbehalt von damals gilt UNVERÄNDERT und ist nicht widerlegt:
 * Jeder zusätzliche Platz verkleinert jede Szene, und Gesichter und Hände
 * zerfallen zuerst. Bewiesen ist bis heute nur der Dreier-Streifen. Das
 * Raster ist ein MESSAUFTRAG (docs/plans/2026-08-23-raster-test.md), kein
 * Ersatz — deshalb ändert dieser Zweig auch nichts an dem, was die App
 * heute tut: Er wird bisher nur vom Prüfskript aufgerufen.
 *
 * @param {object} p
 * @param {string[]} p.beats     einer je Platz, in LESEREIHENFOLGE
 * @param {string} p.styleId
 * @param {string[]} p.clauses   from buildReferences()
 * @param {number} [p.cols]      Spalten; Vorgabe: so viele wie Beats
 * @param {number} [p.rows]      Zeilen; 1 = der bewährte Streifen
 */
export function buildGridPrompt({ beats, styleId, clauses = [], cols, rows = 1, tile = "9:16" }) {
  const style = styleById(styleId);
  const refs = clauses.length ? `\n${clauses.join(" ")}` : "";
  const spalten = cols || beats.length;

  /* Der bewährte Dreier-Streifen bleibt WÖRTLICH, wie er war (eine Reihe).
     Er ist an echten Renders belegt (09.08.) und splitIntoPanels() schneidet
     genau diese Formulierung. Ein zweidimensionales Raster ist ein anderes
     Bild und bekommt deshalb einen eigenen Zweig — nicht dieselben Sätze mit
     ein paar ausgetauschten Wörtern. */
  if (rows === 1) {
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

  /* Das zweidimensionale Raster (Antons Test vom 23.08.).
     Drei Dinge, die der Prompt leisten MUSS, weil sonst der Schnitt danach
     Unsinn ergibt:
       1. Die Plätze werden in LESEREIHENFOLGE benannt — dieselbe, die
          tileBoxes() schneidet. Läuft das auseinander, bekommt jeder Beat
          das Bild seines Nachbarn.
       2. Jede Kachel ist HOCHKANT 9:16 und randlos. Ein Modell, das die
          Kacheln quer füllt, macht den Schnitt wertlos.
       3. Kein Überlaufen zwischen den Kacheln. Genau dafür steht die
          Trennlinie da; sie ist keine Zierde, sie ist die Schnittkante. */
  const zeilen = rows;
  /* ⚠ JEDE Kachel bekommt ihre EIGENE Einstellung. Genau hier entscheidet
     sich, ob ein Raster ein Film wird oder eine Kontaktbogen-Seite: Ohne
     diesen Zusatz malt das Modell vier Varianten derselben Aufnahme, weil
     nichts es davon abhält — und das ist der Fehler, den ein Raster
     STÄRKER macht als Einzelbilder, weil alle vier in einem Zug entstehen. */
  const plaetze = beats
    .map((b, i) => `${slotName(i, spalten, zeilen)}: ${b}\n  ${shotClause(i + 1, beats.length)}`)
    .join("\n");
  const frei = spalten * zeilen - beats.length;
  const leer = frei > 0
    ? `\nThe remaining ${frei === 1 ? "tile" : `${frei} tiles`} must show a quiet establishing ` +
      `shot of the same world — same place, same light, no characters. Never leave a tile blank, ` +
      `black or filled with a pattern.`
    : "";

  return (
    `A single image laid out as an EXACT ${spalten}×${zeilen} grid of ${spalten * zeilen} equally ` +
    `sized tiles (${spalten} columns, ${zeilen} rows), separated by thin solid black divider lines ` +
    /* ⚠ Das KACHELFORMAT steht hier, nicht das Behälterformat. Ein
       quadratisches Raster hat beide gleich (2×2 aus 9:16 ergibt 9:16, 2×2
       aus 16:9 ergibt 16:9) — bei 3×2 laufen sie auseinander, und dann ist
       genau diese Zeile der Unterschied zwischen einem Schnitt, der passt,
       und sechs Kacheln im falschen Format. */
    `running the full width and height between them. Every tile is ` +
    `${tile === "16:9" ? "a HORIZONTAL 16:9 landscape frame" : "a VERTICAL 9:16 portrait frame"} ` +
    `and is completely filled edge to edge — no letterboxing inside a tile, no black bars, no outer ` +
    `frame or margin around the grid. Each tile is a self-contained cinematic photoreal film still ` +
    `with no bleed, no shared elements and no continuing scenery across the divider lines.` +
    `\n${plaetze}${leer}` +
    `\nConsistent color grade, lighting and wardrobe across all tiles so they read as one continuous ` +
    `sequence from the same film, in this style: ${style.prompt}` +
    `\nUltra-detailed, accurate hands and faces. No text, no captions, no numbers, no watermarks.${refs}`
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
      "Use it ONLY for continuity of world and look: colour grade, light quality, time of day, " +
      "weather, environment and wardrobe. Do not copy its composition, and never cut out, paste " +
      "or re-use any figure from it. Every character is re-photographed from scratch for THIS " +
      "scene — new pose, new angle, lit by THIS scene's own light — while still matching their " +
      "own reference photo for face and build. The result must read as the next shot of the same " +
      "film, never as a montage."
    : "";
  const refs = clauses.length ? `\n${clauses.join(" ")}` : "";

  /* Die EINSTELLUNG (cinematography.js) steht vor dem Stil, nicht danach:
     Zuerst was für ein Bild das ist, dann wie es aussieht. Ohne sie kam
     jede Szene als dieselbe Aufnahme zurück — Person mittig, frontal,
     formatfüllend —, und vier davon sind kein Film, sondern vier Passfotos
     an vier Orten (Antons Befund 23.08.).
     ⚠ Sie nennt bewusst KEINE Optik; die gehört dem Stil, und die Stile
     widersprechen sich darin. Zwei Brennweiten in einem Prompt sind
     schlechter als eine. */
  return (
    `A cinematic, photoreal film still: ${beat}` +
    `\n${shotClause(index, total)}` +
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
export function buildSheetFromPhotoPrompt({ desc, category = "person", photos = 1 } = {}) {
  const clean = String(desc || "").trim();
  /* Zwei Fotos, zwei Aufgaben — und sie MÜSSEN benannt werden. Ohne diesen
     Satz mittelt das Modell über beide Bilder und bekommt aus einem
     Selfie-von-schräg-oben plus einem Ganzkörperbild einen Menschen, der
     weder das Gesicht noch die Statur trifft. Die Reihenfolge ist Vertrag
     mit photosOf() in sheets.js. */
  const zwei = photos > 1
    ? "Reference image 1 is a close view of their face — take the face, hair and skin from it. "
      + "Reference image 2 shows their whole body — take height, build and posture from it. "
      + "Where the two disagree, the face image wins for the head and the body image for the body. "
    : "";
  const panels = category === "pet"
    ? "left panel the whole animal standing, side-on to three-quarter view; "
      + "right panel a close view of its head, eyes clearly visible. "
      + "Same animal, same likeness, same coat in both panels."
    : "left panel the full body standing, facing the camera; "
      + "right panel a head-and-shoulders portrait, neutral expression, eyes open and visible. "
      + "Same person, same likeness, same outfit in both panels.";

  return [
    `Reference sheet of the ${category === "pet" ? "animal" : "person"} shown in reference image 1`
      + `${photos > 1 ? " and reference image 2" : ""}, split into two panels side by side: ${panels}`,
    zwei,
    /* ⚠ Ohne Angabe NEUTRALE Alltagskleidung, nicht das, was auf dem Foto
       zufällig an war. Antons Bogen vom 23.08. kam in Badehose und
       Sonnenbrille zurück, weil das Foto am Strand entstand — und ein Bogen
       trägt seine Kleidung in JEDEN künftigen Traum. Ein Urlaubsfoto darf
       nicht die Garderobe eines Jahres bestimmen. */
    clean
      ? `Look and wardrobe: ${clean}. Depict exactly this in both panels.`
      : "Dress them in plain, neutral everyday clothing — a simple long-sleeved top and plain "
        + "trousers in muted colours — regardless of what they happen to wear in the reference "
        + "photo. This is a neutral reference, not a snapshot of one particular day.",
    /* Und das Gesicht muss FREI sein. Der Bogen ist die Quelle jeder
       späteren Ähnlichkeit; was hier verdeckt ist, fehlt für immer. */
    category === "pet" ? "" :
      "Remove any sunglasses, glasses, hat, cap or hood: the whole face must be visible and "
      + "both eyes open. If the reference photo hides the eyes, reconstruct them plausibly from "
      + "the rest of the face.",
    "Plain mid-grey background in both panels, even soft lighting, no shadows cast on the background.",
    "Sharp focus, natural colour, photographic. No text, no logos, no border decorations.",
    "Do not add props, scenery, weather, story or mood — this is a reference sheet, not a scene.",
  ].filter(Boolean).join(" ");
}
