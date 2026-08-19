/* Der Filmregisseur: Bauanleitungen für den Videoprompt, und die mechanische
 * Prüfung seiner Antwort. Eigene Datei aus demselben Grund wie gatekeeper.js —
 * prüfbar ohne laufenden Server (director.test.js). Den DeepSeek-Aufruf
 * selbst macht server.js.
 *
 * Warum es einen Regisseur braucht: Bis 18.08.2026 bekam das Videomodell
 * wörtlich einen STANDBILD-Prompt („photoreal film still …"). Was minimax
 * daraus machte, war Zufall. Die Bauanleitungen hier sind aus dem
 * CINEDANCE-Regelwerk destilliert und am 17.08. real getestet (T0/T4):
 * messbares Blocking, Blick- und Körperrichtung getrennt, Optik als
 * Bildwinkel in Grad, Zeitblöcke über die volle Dauer, Physik mit Ursache
 * und Wirkung, Licht als Vorrang-Regel.
 *
 * Zwei Persona-Lehren gelten wörtlich weiter: KEINE Beispielsätze im Prompt
 * (sie verbiegen die Sprache), und Verbote allein erzeugen Neutralität.
 * Drei Regeln stammen aus echten T0-Abdriften: nur Grad statt Millimeter,
 * nie den Originaltext des Traums zitieren (sonst malt das Modell TEXT ins
 * Bild), nichts über eine Referenz behaupten, was ihre Zeile nicht hergibt.
 */

/* Für Modelle mit EINEM Startbild (Lebendig, Kino): Das Bild existiert
 * schon — der Regisseur beschreibt nur Kamera und Bewegung. Neue Figuren,
 * Orte oder Requisiten einzuführen wäre ein Wunsch an ein Bild, das längst
 * gerendert ist. */
export const DIRECTOR_MOTION = `You are the film director for a dream-film renderer that animates ONE existing still image. Write ONE production-ready video prompt in clear cinematic English describing only camera and motion: what in the given scene starts to move, in which direction, with what weight.

Structure the prompt as short labeled blocks, in this order:
SCENE CONTEXT — one sentence: what happens in this shot, based on the still.
CAMERA — one lens character expressed ONLY as a diagonal field of view in degrees (18 tight portrait, 29 portrait, 47 natural, 84 wide, 107 immersive wide), the camera height, and one slow physical movement written as operator behaviour. Never use millimeters and never name lens brands. Describe what the choice looks like on screen — how the background sits behind the subject, how much environment stays visible — and hold that character for the whole shot: closer or wider framing comes from moving the camera, never from changing the lens.
ACTION TIMING — numbered time blocks covering the full duration (0:00–…), each with one clear visible action and one physical event.
PHYSICS — weight, ground contact and follow-through for the main motions; cloth, hair and liquids follow gravity.
LIGHTING — treat light as a constraint, not as decoration: keep the light of the still, name its source and direction and what stays in shadow.
AUDIO — ambient sound and effects only; no speech, no subtitles, no music unless the dream itself contains it.

Introduce no new people, objects or places that are not visible in the still. Never quote the dream's original wording in any language — no written text may appear in the frame. Write concrete physical language over poetry and desired visual outcomes over camera hardware. Where a style anchor is given, weave its colour, light and texture in after the control blocks — never let it override the optics or lighting you just set. Close with a short line asking for sharp clarity, natural colour and a stable picture. Output only the prompt.`;

/* Für Referenz-Modelle (Regie, Seedance R2V): das volle Programm mit
 * @ImageN-Verweisen.
 *
 * Näher an CINEDANCE gezogen am 19.08.2026, nachdem ein Trockenlauf
 * (scripts/dry-run-prompts.mjs) die Destillation gegen das Regelwerk hielt.
 * Zurückgeholt wurden die vier Stellen, an denen das Original die eigentliche
 * Arbeit leistet und die Kurzfassung nur andeutete:
 *   LOCATION MAP — fehlte ganz. Ohne Geographie vor dem Blocking sind
 *     Meterangaben Behauptungen: es gibt keinen Bezugspunkt, auf den sie sich
 *     beziehen könnten.
 *   Identitäts-Formel — das Original schließt jede Figurenzeile mit „100%
 *     matches the reference". Genau dieser Satz hält das Gesicht.
 *   Optik-Drift — eine Brennweite zu WÄHLEN heißt nicht, sie zu HALTEN. Das
 *     Original verlangt beobachtbare Bildwirkung und sperrt das Abdriften.
 *   Erstes Bild — „enthält die Figuren" ist schwächer als der ausdrückliche
 *     Ausschluss von Establisher und verzögertem Auftritt.
 * POSITIVE CONSTRAINTS bleibt bewusst draußen: das Original nennt es selbst
 * optional und rät zu lokalen Sperren statt eines Schlussblocks. */
export const DIRECTOR_FULL = `You are the film director for a dream-film renderer. From the dream and the materials below, write ONE production-ready video prompt in clear cinematic English. Describe only what is visible or audible in this single shot sequence — no scene numbers, no references to other shots, no text overlays, and never quote the dream's original wording in any language.

Structure the prompt as short labeled blocks, in this order:
SCENE CONTEXT — one or two sentences: what happens in this shot only.
ACTIVE REFERENCES — one line per provided reference, addressed by its @ImageN handle, built as: type + current state + the visible anchors that must match. Close every line with a statement that the subject matches its reference exactly. Describe nothing a reference line does not give you — no invented clothing, props or features. Leave out any reference that does not appear in this shot.
LOCATION MAP — before placing anyone, fix the geography: where the camera stands and which way it faces, what occupies foreground, midground and background, where the landmarks sit, and which way the light comes from. Every distance in the next block refers to this map.
FIRST FRAME AND BLOCKING — the first visible frame already contains every required subject in position, readable immediately. No empty establishing frame, no delayed entrance. Give each subject a screen position, a distance to a landmark in meters or by physical contact, and body facing and gaze direction as two separate statements.
FORMAT — a single continuous take by default. Use two or three hard cuts only if the beats demand it, and then restate positions, gaze lines and lighting direction after every cut. Hard cuts only — no fades, dissolves or transition effects.
OPTICS — choose ONE diagonal field of view in degrees (18 tight portrait, 29 portrait, 47 natural, 84 wide, 107 immersive wide) matching the content, and state the camera distance in meters. Express the lens ONLY as degrees — never millimeters, never lens brands. Then describe what that choice looks like on screen: for a long lens, how far the camera physically stands, how the background compresses and dissolves behind the subject; for a wide lens, how near the camera stands, how the foreground looms and how far the environment stays visible. Hold that lens character for the whole shot; wider or closer framing comes from moving the camera, never from changing the lens.
CAMERA — height, side and movement written as physical operator behaviour.
ACTION TIMING — numbered time blocks covering the full duration (0:00–…), each with subject position, one clear action, camera behaviour and one physical event.
PHYSICS — weight, ground contact and follow-through for the main motions; cloth, hair and liquids follow gravity.
LIGHTING — treat light as a constraint, not as decoration: the primary source and its direction, which side the camera holds, what stays in shadow, and what the exposure prioritises.
AUDIO — ambient sound and effects only; no speech, no subtitles, no music unless the dream itself contains it.

Write concrete physical language over poetry, measurable positions over vague nearness, and desired visual outcomes over camera hardware. Where a style anchor is given, weave its colour, light and texture in after the control blocks — never let it override the optics, blocking or lighting you just set. Close with a short line asking for sharp clarity, natural colour and a stable picture. Output only the prompt.`;

/**
 * Die Materialliste für den Regisseur — der User-Teil des Aufrufs.
 *
 * `refs` nummeriert in EXAKT der Reihenfolge des image_urls-Arrays; Zeile N
 * gehört zu @ImageN. Das ist dieselbe Invariante wie in promptBuilder.js
 * („riskiest code in the app"): stimmt die Nummer nicht, bekommen Menschen
 * die Gesichter der anderen.
 *
 * Drei Zutaten kamen am 19.08.2026 dazu, weil ein Trockenlauf zeigte, dass
 * die Anweisung sie verlangte und der Aufruf sie nie mitschickte:
 *   `style` — der Systemprompt wies an, den Stil-Anker einzuweben; übergeben
 *     wurde er nirgends. Der Film wusste vom gewählten Stil nichts.
 *   `still` bei Referenz-Modellen — die Beschreibung des Startbilds wurde
 *     ausgerechnet dort weggelassen, wo Bildpositionen in Metern verlangt
 *     sind. Der Regisseur sollte ein Bild ausmessen, das er nicht kannte.
 *   `beats` — die Analyse zerlegt jeden Traum ohnehin in fünf Szenen. Ohne
 *     sie zerlegte der Regisseur ihn ein zweites Mal, unabhängig; Bildstrecke
 *     und Film konnten verschiedene Geschichten erzählen.
 *
 * @param {object} p
 * @param {string} p.dream        Originalsprache — der Regisseur übersetzt
 * @param {string} [p.still]      Beschreibung des schon gerenderten Startbilds
 * @param {string[]} [p.beats]    die fünf Szenen aus der Analyse (englisch)
 * @param {{tag,kind,desc}[]} [p.refs]  leer bei Ein-Bild-Modellen
 * @param {number} p.seconds      bereits geklemmt (clampSeconds)
 * @param {boolean} [p.audio]     ob das Modell Ton erzeugt
 * @param {string} [p.style]      Stil-Anker in einer Zeile
 */
export function buildDirectorBrief({ dream, still, beats = [], refs = [], seconds, audio, style }) {
  const parts = [
    `THE DREAM (in its original language; the film must depict it, your prompt is English):\n"${dream}"`,
  ];
  /* Die Szenen sind bereits englisch und bereits geordnet — der Regisseur
     muss den Traum also nicht neu gliedern, sondern nur noch inszenieren.
     Ausdrücklich als Bogen ausgewiesen, nicht als Schnittliste: das Modell
     soll daraus Zeitblöcke machen, keine Schnitte je Zeile. */
  const scenes = beats.filter((b) => typeof b === "string" && b.trim());
  if (scenes.length) {
    /* Die Zeit je Szene ausrechnen statt sie erraten zu lassen. Der Bogen
       ist schon auf die Länge zugeschnitten (beatsForSeconds), aber ohne
       die Rechnung im Text verteilt das Modell fünf Szenen genauso auf
       fünf wie auf dreißig Sekunden — die Dauer stand bisher nur als
       Gesamtzahl weiter unten und blieb folgenlos. */
    const each = Math.round((seconds / scenes.length) * 10) / 10;
    parts.push(`THE ARC the dream was already broken into (use it as the shape of the shot, not as a cut list):\n`
      + scenes.map((b, i) => `${i + 1}. ${b}`).join("\n")
      + `\nThese ${scenes.length} beats have to fill ${seconds} seconds — about ${each} seconds each. `
      + `Pace the time blocks so the whole duration is covered and every beat gets room to read; `
      + `stretch or compress them where the action needs it, but never leave the last beat unresolved at the end.`);
  }
  if (still) {
    parts.push(refs.length
      /* Bei Referenz-Modellen IST dieses Bild @Image1. Ohne den Zusatz läse
         das Modell zwei getrennte Materialien, wo nur eines existiert. */
      ? `WHAT @Image1 SHOWS (the already-rendered opening still — this is the same picture as the first reference below):\n${still}`
      : `THE STILL the film starts from (already rendered):\n${still}`);
  }
  if (refs.length) {
    const lines = refs.map((r, i) =>
      `@Image${i + 1} — ${r.kind || "person"} "${r.tag}"${r.desc ? `: ${r.desc}` : ""}`);
    parts.push(`REFERENCES (address by handle; use each only where it appears):\n${lines.join("\n")}`);
  }
  parts.push(`DURATION: ${seconds} seconds.` +
    (refs.length ? ` MODEL: supports up to 9 image references${audio ? ", native ambient audio" : ""}, controlled multi-shot with restated continuity.`
                 : audio ? " MODEL: renders native ambient audio." : ""));
  /* Der Stil-Anker beschreibt den BILD-Stil und nennt dort teils Brennweiten
     in Millimetern — die Optik entscheidet hier aber der Regisseur nach
     Inhalt. Deshalb ausdrücklich auf Farbe, Licht und Textur beschränkt,
     sonst kollidiert er mit der Grad-Regel im Systemprompt. */
  if (style) parts.push(`STYLE ANCHOR (colour, light and texture only — the optics are yours to choose):\n${style}`);
  return parts.join("\n\n");
}

/* Der erste Eintrag jeder Referenzliste eines Referenz-Films: das schon
 * gerenderte Startbild. Es führt Look, Palette und Ort — deshalb steht es
 * IMMER auf @Image1, vor allen Figuren. */
export const KEYFRAME_REF = {
  tag: "keyframe",
  kind: "opening still",
  desc: "the already-rendered first frame of the film; its look, palette and location lead",
};

/**
 * Welche Besetzungsmitglieder in einen Referenz-Film mitkommen, und in
 * welcher Reihenfolge. Eine reine Funktion, weil hier die Invariante aus
 * promptBuilder.js weiterlebt: Die Position in dieser Liste IST die
 * @Image-Nummer (um eins versetzt — @Image1 ist das Startbild). Wer die
 * Reihenfolge zwischen Materialliste und image_urls-Array auseinanderlaufen
 * lässt, gibt Menschen die Gesichter der anderen.
 *
 * Priorität bei mehr Einträgen als Plätzen (Plan §5): Personen vor Tieren
 * vor Orten — Gesichter machen Identität aus, der Ort steckt ohnehin im
 * Startbild. Innerhalb einer Gattung bleibt die gegebene Reihenfolge
 * (stabile Sortierung). Ohne Bild keine Referenz — eine Beschreibung
 * allein hat im image_urls-Array nichts beizutragen.
 *
 * @param {{tag,category,desc,img}[]} cast
 * @param {number} [slots]  freie Plätze NEBEN dem Startbild
 */
export function filmReferences(cast = [], slots = 8) {
  const rank = { person: 0, pet: 1, place: 2 };
  return cast
    .filter((c) => c && c.img && c.tag)
    .sort((a, b) => (rank[a.category] ?? 0) - (rank[b.category] ?? 0))
    .slice(0, slots);
}

/**
 * Die mechanische Prüfung der Regisseur-Antwort — Modellausgabe ist so
 * untrusted wie Nutzereingabe. Ein @ImageN über die Referenzzahl hinaus
 * heißt: Das Modell hat eine Referenz halluziniert, und das Videomodell
 * würde sie durch IRGENDEIN Bild füllen. Dann lieber der Rückfall.
 *
 * @returns {{ok: boolean, used: number[], bad: number[]}}
 */
export function checkDirectedPrompt(text, refCount) {
  const used = [...new Set([...String(text || "").matchAll(/@Image(\d+)/g)].map((m) => Number(m[1])))];
  const bad = used.filter((n) => n < 1 || n > refCount);
  const ok = Boolean(String(text || "").trim()) && bad.length === 0;
  return { ok, used, bad };
}
