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
CAMERA — one lens character expressed ONLY as a diagonal field of view in degrees (18 tight portrait, 29 portrait, 47 natural, 84 wide, 107 immersive wide), the camera height, and one slow physical movement written as operator behaviour. Never use millimeters and never name lens brands.
ACTION TIMING — numbered time blocks covering the full duration (0:00–…), each with one clear visible action and one physical event.
PHYSICS — weight, ground contact and follow-through for the main motions; cloth, hair and liquids follow gravity.
LIGHTING — keep the light of the still: name its source and direction and what stays in shadow.
AUDIO — ambient sound and effects only; no speech, no subtitles, no music unless the dream itself contains it.

Introduce no new people, objects or places that are not visible in the still. Never quote the dream's original wording in any language — no written text may appear in the frame. Write concrete physical language over poetry and desired visual outcomes over camera hardware. Output only the prompt.`;

/* Für Referenz-Modelle (Regie, Seedance R2V): das volle Programm mit
 * @ImageN-Verweisen. Kommt mit der R2V-Verdrahtung zum Einsatz; steht hier
 * schon, damit Bauanleitung und Prüfung zusammen getestet werden. */
export const DIRECTOR_FULL = `You are the film director for a dream-film renderer. From the dream and the materials below, write ONE production-ready video prompt in clear cinematic English. Describe only what is visible or audible in this single shot sequence — no scene numbers, no references to other shots, no text overlays, and never quote the dream's original wording in any language.

Structure the prompt as short labeled blocks, in this order:
SCENE CONTEXT — one or two sentences: what happens in this shot only.
ACTIVE REFERENCES — one line per provided reference, addressed by its @ImageN handle: type + current state + the visible anchors that must match the reference exactly. Describe nothing about a referenced subject that its reference line does not give you — no invented clothing, props or features. Leave out any reference that does not appear in this shot.
FIRST FRAME AND BLOCKING — the first visible frame already contains the required subjects. Give each subject a screen position, a distance to a landmark in meters or by physical contact, and body facing and gaze direction as two separate statements.
FORMAT — a single continuous take by default. Use two or three hard cuts only if the beats demand it, and then restate positions, gaze lines and lighting direction after every cut.
OPTICS — choose ONE diagonal field of view in degrees (18 tight portrait, 29 portrait, 47 natural, 84 wide, 107 immersive wide) matching the content, state the camera distance in meters, and keep that lens character for the whole shot. Express the lens ONLY as degrees — never millimeters, never lens brands.
CAMERA — height, side and movement written as physical operator behaviour.
ACTION TIMING — numbered time blocks covering the full duration (0:00–…), each with subject position, one clear action, camera behaviour and one physical event.
PHYSICS — weight, ground contact and follow-through for the main motions; cloth, hair and liquids follow gravity.
LIGHTING — the primary source and its direction, which side the camera holds, what stays in shadow, and what the exposure prioritises.
AUDIO — ambient sound and effects only; no speech, no subtitles, no music unless the dream itself contains it.

Write concrete physical language over poetry, measurable positions over vague nearness, and desired visual outcomes over camera hardware. Weave the given style anchor in after the control blocks, not before. Output only the prompt.`;

/**
 * Die Materialliste für den Regisseur — der User-Teil des Aufrufs.
 *
 * `refs` nummeriert in EXAKT der Reihenfolge des image_urls-Arrays; Zeile N
 * gehört zu @ImageN. Das ist dieselbe Invariante wie in promptBuilder.js
 * („riskiest code in the app"): stimmt die Nummer nicht, bekommen Menschen
 * die Gesichter der anderen.
 *
 * @param {object} p
 * @param {string} p.dream        Originalsprache — der Regisseur übersetzt
 * @param {string} [p.still]      Beschreibung des schon gerenderten Startbilds
 * @param {{tag,kind,desc}[]} [p.refs]  leer bei Ein-Bild-Modellen
 * @param {number} p.seconds      bereits geklemmt (clampSeconds)
 * @param {boolean} [p.audio]     ob das Modell Ton erzeugt
 * @param {string} [p.style]      Stil-Anker in einer Zeile
 */
export function buildDirectorBrief({ dream, still, refs = [], seconds, audio, style }) {
  const parts = [
    `THE DREAM (in its original language; the film must depict it, your prompt is English):\n"${dream}"`,
  ];
  if (still) parts.push(`THE STILL the film starts from (already rendered):\n${still}`);
  if (refs.length) {
    const lines = refs.map((r, i) =>
      `@Image${i + 1} — ${r.kind || "person"} "${r.tag}"${r.desc ? `: ${r.desc}` : ""}`);
    parts.push(`REFERENCES (address by handle; use each only where it appears):\n${lines.join("\n")}`);
  }
  parts.push(`DURATION: ${seconds} seconds.` +
    (refs.length ? ` MODEL: supports up to 9 image references${audio ? ", native ambient audio" : ""}, controlled multi-shot with restated continuity.`
                 : audio ? " MODEL: renders native ambient audio." : ""));
  if (style) parts.push(`STYLE ANCHOR: ${style}`);
  return parts.join("\n\n");
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
