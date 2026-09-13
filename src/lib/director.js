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
CAMERA — one lens character expressed ONLY as a diagonal field of view in degrees (18 tight portrait, 29 portrait, 47 natural, 84 wide, 107 immersive wide), the camera height, and one slow physical movement written as measurable operator behaviour (handheld sway in centimeters, dolly speed in meters per second). Never use millimeters and never name lens brands. Describe what the choice looks like on screen — how the background sits behind the subject, how much environment stays visible — and hold that character for the whole shot: closer or wider framing comes from moving the camera, never from changing the lens.
ACTION TIMING — numbered time blocks covering the full duration (0:00–…), each with one clear visible action and one physical event.
PERFORMANCE — for every person visible, what the face and body do: gaze, breath, tension, the delay before a reaction. Physical detail, never named emotions.
PHYSICS — weight, ground contact and follow-through for the main motions; cloth, hair and liquids follow gravity.
LIGHTING — treat light as a constraint, not as decoration: keep the light of the still, name its source and direction and what stays in shadow.
AUDIO — real-world sound only, one cue per block timed to its physical event; no speech, no subtitles, no music unless the dream itself contains it.
POSITIVE LOCKS — three to five one-line constraints that hold for the whole take: every person and object of the still keeps shape, size, markings and wardrobe; the light source never changes side; nothing appears that the still does not show.

Introduce no new people, objects or places that are not visible in the still. Never quote the dream's original wording in any language — no written text may appear in the frame. Write concrete physical language over poetry and desired visual outcomes over camera hardware. Where a style anchor is given, weave its colour, light and texture in after the control blocks — never let it override the optics or lighting you just set. Close with a short line asking for sharp clarity, natural colour and a stable picture. Output only the prompt.`;

/* Drei Adressformate, eine Invariante. Wie ein Videomodell eine Referenz im
 * Prompt angesprochen haben will, ist eine Familieneigenschaft (gemessen
 * 19.08.2026 an fals OpenAPI-Schemata, Filmplan §10b):
 *   "at"      → @Image1    (Seedance 2.0)
 *   "bracket" → [Image1]   (Seedance 2.5)
 *   "plain"   → Image 1    (MiniMax H3)
 * Der Wert steht in der Modelltabelle (video.js, refStyle) — hier lebt nur
 * die Übersetzung, damit Brief, Anweisung und Prüfung dieselbe benutzen und
 * nie auseinanderlaufen können. */
export function refHandle(refStyle, n) {
  if (refStyle === "bracket") return `[Image${n}]`;
  if (refStyle === "plain") return `Image ${n}`;
  return `@Image${n}`;
}

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
 * optional und rät zu lokalen Sperren statt eines Schlussblocks.
 *
 * Seit 20.08. eine Funktion statt einer Konstante: Die Anweisung nennt das
 * Adressformat der Referenzen, und das ist je Modellfamilie verschieden
 * (refHandle). DIRECTOR_FULL bleibt als @Image-Fassung exportiert — für
 * Tests und als das Format, in dem die Anweisung geschrieben wurde. */
export function directorFull(refStyle = "at") {
  const handle = refHandle(refStyle, "N");
  return `You are the film director for a dream-film renderer. From the dream and the materials below, write ONE production-ready video prompt in clear cinematic English. Describe only what is visible or audible in this single shot sequence — no scene numbers, no references to other shots, no text overlays, and never quote the dream's original wording in any language.

Structure the prompt as short labeled blocks, in this order:
SCENE CONTEXT — one or two sentences: what happens in this shot only.
ACTIVE REFERENCES — one line per provided reference, addressed by its ${handle} handle exactly as written in the materials, built as: type + current state + the visible anchors that must match. Close every line with a statement that the subject matches its reference exactly. Describe nothing a reference line does not give you — no invented clothing, props or features. Leave out any reference that does not appear in this shot.
LOCATION MAP — before placing anyone, fix the geography: where the camera stands and which way it faces, what occupies foreground, midground and background, where the landmarks sit, and which way the light comes from. Every distance in the next block refers to this map.
FIRST FRAME AND BLOCKING — the first visible frame already contains every required subject in position, readable immediately. No empty establishing frame, no delayed entrance. Give each subject a screen position, a distance to a landmark in meters or by physical contact, and body facing and gaze direction as two separate statements.
FORMAT — if a SHOT PLAN is given, follow it exactly: one time block per listed shot, cutting at the stated times, never more cuts than the plan has and never fewer. The camera never cuts on its own — cuts happen only at the listed points, and inside a block the take runs unbroken. Restate positions, gaze lines and lighting direction after every cut. Hard cuts only — no fades, dissolves or transition effects. If instead a TRANSFORMATION CHAIN is given, there are no cuts at all: write one unbroken take in which each state physically turns into the next, and say what becomes what. Without either, a single continuous take.
OPTICS — express every lens ONLY as a diagonal field of view in degrees (18 tight portrait, 29 portrait, 47 natural, 63 observational, 84 wide, 107 immersive wide) — never millimeters, never lens brands. With a SHOT PLAN, give each shot its own shot size and field of view, using the size the plan suggests: name the size (WIDE, MEDIUM, MEDIUM CLOSE, CLOSE, OVER-SHOULDER) and the degrees, and vary them across the film — a wide shot for scale and geography, a close shot on a face for the moment that matters; never the same size for every cut. Inside one shot, hold the lens: wider or closer framing within a block comes from moving the camera, never from changing the lens. Without a plan, choose ONE field of view for the whole take. For each lens state the camera distance in meters and what it looks like on screen: for a long lens, how far the camera physically stands and how the background compresses and dissolves behind the subject; for a wide lens, how near the camera stands, how the foreground looms and how far the environment stays visible.
CAMERA — height, side and movement written as measurable operator behaviour: handheld sway in centimeters (1–3 cm), dolly or crane speed in meters per second, a track that follows the subject half a beat late. One movement per shot; nothing that needs longer than the block to read.
ACTION TIMING — numbered time blocks covering the full duration (0:00–…), each with subject position, one clear action, camera behaviour and one physical event.
PERFORMANCE — for every person in frame, what the face and body do before and after the event: gaze shifts, breath, a swallow, muscle tension, a half-step back, the delay before a reaction. Acting in physical detail, never named emotions.
PHYSICS — weight, ground contact and follow-through for the main motions; cloth, hair and liquids follow gravity.
LIGHTING — treat light as a constraint, not as decoration: the primary source and its direction, which side the camera holds, what stays in shadow, and what the exposure prioritises.
AUDIO — real-world sound only, one cue per block timed to its physical event: footsteps, wind, water, cloth, impacts; no speech, no subtitles, no music unless the dream itself contains it.
POSITIVE LOCKS — three to six one-line constraints that must hold in every block: each referenced person keeps face, hair and wardrobe identical to their reference and inherits nothing from the reference's background; every landmark and object named in the LOCATION MAP keeps its shape, size and markings; the light source never changes side; nothing and nobody appears that the blocks did not introduce.

Write concrete physical language over poetry, measurable positions over vague nearness, and desired visual outcomes over camera hardware. Where a style anchor is given, weave its colour, light and texture in after the control blocks — never let it override the optics, blocking or lighting you just set. Close with a short line asking for sharp clarity, natural colour and a stable picture. Output only the prompt.`;
}

export const DIRECTOR_FULL = directorFull("at");

/* Die Bildgröße je Shot, aus dem Beat-Typ (v2, 13.09.2026 — nach dem
 * Higgsfield-Fallbeispiel „case4k", das jedem Schnitt seine eigene Größe
 * und seinen eigenen Bildwinkel gibt). Vorher hielt der Regisseur EINEN
 * Bildwinkel über alle Schnitte: der Tornado-Film vom 12.09. war drei Mal
 * 84° wide — alles im Bild, nie ein Gesicht. Das Gesicht gehört an den
 * Moment, der zählt.
 *   setup/transit → weit (Ort und Maßstab), build → halbnah, turn/reveal/
 *   reversal → Push von halbnah auf nah, climax → nah am Gesicht, dann weit
 *   für die Wirkung, resolution → halbnah, ruhig. */
const SIZE_FOR_HOOK = {
  setup: "WIDE 84°", transit: "WIDE 63°, tracking", build: "MEDIUM 47°",
  turn: "MEDIUM CLOSE 29°, pushing in", reveal: "MEDIUM CLOSE 29°, pushing in", reversal: "MEDIUM CLOSE 29°",
  callback: "MEDIUM 47°", climax: "CLOSE 29° on the face, then WIDE 84° for the effect", resolution: "MEDIUM 47°, still",
};
/* Ohne Typ (alte Analysen: alles „build") entscheidet die POSITION — ein
   Wechselschritt, damit nie zwei Cuts hintereinander gleich groß sind. */
const CADENCE = ["MEDIUM 47°", "MEDIUM CLOSE 29°", "MEDIUM 47°", "CLOSE 29°", "WIDE 63°, tracking"];
export function shotSize(hook, i = 0, total = 1) {
  /* Der erste Shot zeigt den Ort, wenn er nicht selbst der Höhepunkt ist;
     ein Einzelshot bleibt bei dem, was sein Typ verlangt. */
  if (i === 0 && total > 1 && hook !== "climax") return "WIDE 84°";
  if (!hook || hook === "build") return total > 1 ? CADENCE[(i - 1 + CADENCE.length) % CADENCE.length] : SIZE_FOR_HOOK.build;
  return SIZE_FOR_HOOK[hook] || SIZE_FOR_HOOK.build;
}
/** Die Größen aller Shots eines Plans — und keine zwei Nachbarn gleich:
 *  wo der Typ dieselbe Größe zweimal ergäbe (zwei „turn" in Folge), rückt
 *  der zweite eine Stufe näher heran. */
export function shotSizes(plan) {
  const out = [];
  plan.forEach((s, i) => {
    let size = shotSize(s.hook, i, plan.length);
    if (i > 0 && size === out[i - 1]) size = size.startsWith("CLOSE") ? "MEDIUM 47°" : size.startsWith("WIDE") ? "MEDIUM 47°" : "CLOSE 29°";
    out.push(size);
  });
  return out;
}

/* Ein Schnittzeitpunkt, wie MiniMax H3 ihn liest: 00:04.000. Sekunden
 * bleiben ganzzahlig — der Schnitt rechnet in ganzen Sekunden (cut.js), die
 * Millisekunden sind reine Schreibweise des Modells. */
function msLabel(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.000`;
}

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
 * @param {number} [p.promptBudget]  Zeichenbudget des ZIELMODELLS (video.js
 *   promptMax) — dem Regisseur genannt, statt seine Antwort still zu kappen:
 *   ein Modell, das sein Limit kennt, priorisiert selbst; ein abgeschnittener
 *   Prompt verliert immer das Ende, also Auflösung und Ton.
 * @param {string} [p.refStyle]   Adressformat des Zielmodells (refHandle)
 * @param {number} [p.maxRefs]    wie viele Bildreferenzen das Modell nimmt —
 *   stand bis 20.08. als „9" fest im Text und hätte H3 (5) angelogen
 */
export function buildDirectorBrief({ dream, still, beats = [], shots = [], refs = [], seconds, audio, style, promptBudget, refStyle = "at", maxRefs = 9, timeFormat = "s", pace = "calm" }) {
  const h1 = refHandle(refStyle, 1);
  const parts = [
    `THE DREAM (in its original language; the film must depict it, your prompt is English):\n"${dream}"`,
  ];
  /* ── Der Schnittplan (03.09.2026) ───────────────────────────────────────
     Vorher stand hier ein „Bogen" mit der Bitte, ihn zu verteilen, und die
     Zeit wurde GLEICHMÄSSIG gerechnet (`seconds / scenes`). Beides ist weg:
     Welche Szenen der Film trägt und wie lange jede zu sehen ist, entscheidet
     jetzt der Schnitt (cut.js) nach Gewicht — der Höhepunkt bekommt den
     längsten Block, ein Weg fliegt ganz raus. Der Regisseur inszeniert diesen
     Plan, er stellt ihn nicht mehr selbst auf.

     Das Zeitformat ist Modellwissen (video.js, timeFormat): Seedance 2.5
     antwortet auf ganzzahlige Sekundenspannen, H3 auf Schnittzeitpunkte in
     Millisekunden. Dasselbe Format im Brief wie in der erwarteten Antwort —
     sonst rechnet das Modell um und verliert dabei die Grenzen. */
  const plan = (shots || []).filter((s) => s && typeof s.text === "string" && s.text.trim());
  if (plan.length && pace === "flow") {
    /* ── Ein Fluss statt Schnitte (Antons Ansage 03.09.2026) ─────────────
       „Dass überhaupt gar keine Cuts verwendet werden, sondern dass alles
       ineinander morpht, sprich dass die ganze Story von einem Ding ins
       andere morpht und somit in 15 Sekunden alles drin ist."

       Dieselbe Liste wie beim Schnitt, aber als VERWANDLUNGSKETTE gelesen:
       Die Zeitmarken sind keine Schnittpunkte, sondern die Momente, in
       denen ein Bild ins nächste übergeht. Der Traum liefert die Vorlage
       dafür gleich mit — ein Aufzug, der zum Flugzeug wird, ist genau das,
       was hier durchgehend passieren soll. */
    parts.push(`THE TRANSFORMATION CHAIN — ONE UNBROKEN SHOT. There are NO cuts in this film:\n`
      + plan.map((s, i) => (i === 0
        ? `Opens on: ${s.text}`
        : `By ${s.from}s it has become: ${s.text}`)).join("\n")
      + `\nThe camera never cuts and never stops moving; it flows through all ${seconds} seconds in a single take. `
      + `Each state does not replace the next — it TURNS INTO it: walls become other walls, a floor becomes a sky, `
      + `an object reshapes into the next object while the camera keeps travelling. Name what physically transforms into what, `
      + `and where in the frame the change begins. `
      + `Carry one element through every transformation as the thread the eye holds on to — a subject, a colour, a direction of travel. `
      + `No fades, no dissolves, no black frames, no cross-cutting: the change happens IN the world, not between two pictures of it. `
      + `Dream logic is the licence here — a transformation needs to be visually continuous, not physically possible.`);
  } else if (plan.length) {
    /* Schnell ist, was kurz ist: Seit 12.09. kommen ALLE Szenen in den Film,
       und ob die Bloecke eng werden, entscheidet Sekunden geteilt durch
       Szenen — nicht ein Tempo-Name. Unter 2,5 s je Block gilt die
       Kurz-Regie (eine Bewegung, spaet rein, frueh raus). */
    const schnell = pace === "fast" || seconds / plan.length < 2.5;
    /* Je Shot die vorgeschlagene Bildgröße (shotSize) und die Haltedauer in
       Worten — das Modell liest „the longest hold" so verlässlich wie eine
       Zahl, und die Zahl allein hatte alle Blöcke gleich lang aussehen
       lassen. */
    const laengster = plan.reduce((m, s) => Math.max(m, s.to - s.from), 0);
    const einzig = plan.filter((s) => s.to - s.from === laengster).length === 1;   // sonst wäre jeder Block „der längste"
    const halt = (s) => {
      const d = s.to - s.from;
      return einzig && d === laengster && plan.length > 1 ? `the longest hold, ${d} s` : `${d} s`;
    };
    const sizes = shotSizes(plan);
    const zeile = (s, i) => (timeFormat === "ms"
      ? (i === 0
        ? `[Shot 1] ${sizes[0]} — ${s.text} (${halt(s)})`
        : `[Shot ${i + 1}] At ${msLabel(s.from)}, cut to: ${sizes[i]} — ${s.text} (${halt(s)})`)
      : `[${s.from}s-${s.to}s] SHOT ${i + 1} — ${sizes[i]} — ${s.text} (${halt(s)})`);
    parts.push(`THE SHOT PLAN — this is the cut, already decided. Stage it; do not re-plan it:\n`
      + plan.map(zeile).join("\n")
      + `\nOne block per shot, ${plan.length === 1 ? "no cuts" : `${plan.length - 1} hard cut${plan.length > 2 ? "s" : ""}`}, `
      + `covering all ${seconds} seconds with no gap. Keep every block's length as given: the long blocks carry the moments that matter. `
      + `One block, one event — if a block seems to hold two, stage the second as camera movement inside it, not as an extra cut. `
      + `Each shot names its size and field of view; use the size suggested in the plan unless the content forbids it, and never give two consecutive shots the same size. `
      /* ⚠ Beim schnellen Schnitt muss die Kürze im Text stehen, nicht nur
         in den Zahlen: Ein Modell, dem man zwei Sekunden gibt und eine
         ausgebaute Handlung beschreibt, dehnt die Handlung und ignoriert
         die Zahl. Ein Block dieser Länge trägt EINE Bewegung. */
      + (schnell
        ? `This is a FAST cut: each block is about two seconds. Write each one as a single held image with one clear movement — `
        + `an action already in progress, no build-up and no settling. Enter late, leave early. `
        + `Keep camera moves short and simple, one per block; no complex choreography, nothing that needs time to read. `
        : "")
      + (timeFormat === "ms"
        ? `Write cut points as timestamps in milliseconds (00:04.000), the way this model reads them.`
        : `Write each block as an integer second span in square brackets, the way this model reads them.`));
  } else if (beats.filter((b) => typeof b === "string" && b.trim()).length) {
    /* Rückfall für alles ohne Plan: alte Träume, deren Analyse keine
       Gewichtung kennt, und jeder Aufrufer, der nur Texte schickt. Bewusst
       als Bogen ausgewiesen, nicht als Schnittliste. */
    const scenes = beats.filter((b) => typeof b === "string" && b.trim());
    const each = Math.round((seconds / scenes.length) * 10) / 10;
    parts.push(`THE ARC the dream was already broken into (use it as the shape of the shot, not as a cut list):\n`
      + scenes.map((b, i) => `${i + 1}. ${b}`).join("\n")
      + `\nThese ${scenes.length} beats have to fill ${seconds} seconds — about ${each} seconds each. `
      + `Pace the time blocks so the whole duration is covered and every beat gets room to read; `
      + `stretch or compress them where the action needs it, but never leave the last beat unresolved at the end.`);
  }
  if (still) {
    parts.push(refs.length
      /* Bei Referenz-Modellen IST dieses Bild die erste Referenz. Ohne den
         Zusatz läse das Modell zwei getrennte Materialien, wo nur eines
         existiert. */
      ? `WHAT ${h1} SHOWS (the already-rendered opening still — this is the same picture as the first reference below):\n${still}`
      : `THE STILL the film starts from (already rendered):\n${still}`);
  }
  if (refs.length) {
    const lines = refs.map((r, i) =>
      `${refHandle(refStyle, i + 1)} — ${r.kind || "person"} "${r.tag}"${r.desc ? `: ${r.desc}` : ""}`);
    parts.push(`REFERENCES (address by handle, written exactly as shown; use each only where it appears):\n${lines.join("\n")}`);
  }
  parts.push(`DURATION: ${seconds} seconds.` +
    (refs.length ? ` MODEL: supports up to ${maxRefs} image references${audio ? ", native ambient audio" : ""}, controlled multi-shot with restated continuity.`
                 : audio ? " MODEL: renders native ambient audio." : "") +
    /* Das Budget stammt aus video.js (promptMax je Modell). Mit etwas Luft
       genannt, damit „knapp drüber" nicht schon in die Servernotbremse
       läuft — Dichte soll aus Priorisierung kommen, nicht aus Kürzung. */
    (promptBudget
      ? ` LENGTH BUDGET: the finished prompt must stay under ${Math.floor(promptBudget * 0.9)} characters — if space runs short, cut style prose first, never the timing blocks or the ending.`
        /* ⚠ Bei vielen Shots reicht eine Gesamtzahl nicht (gemessen
           03.09.2026): Der Regisseur schrieb für sieben Zwei-Sekunden-Blöcke
           über 7000 Zeichen, die Notbremse kappte — und sie kappt am ENDE,
           also bei den letzten Shots, beim Ton und beim Schluss. Wer ein
           Budget einhalten soll, muss wissen, wie viel davon auf einen Shot
           entfällt; „insgesamt kürzer" ist keine Anweisung, die sich beim
           dritten von sieben Blöcken noch auswirkt. */
        + (shots.length > 3
          ? ` With ${shots.length} shots that is roughly ${Math.floor((promptBudget * 0.55) / shots.length)} characters per shot in ACTION TIMING — write them tight and telegraphic, and put the shared setting in LOCATION MAP once instead of repeating it per shot.`
          : "")
      : ""));
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
 * untrusted wie Nutzereingabe. Ein Handle über die Referenzzahl hinaus
 * heißt: Das Modell hat eine Referenz halluziniert, und das Videomodell
 * würde sie durch IRGENDEIN Bild füllen. Dann lieber der Rückfall.
 *
 * Geprüft wird in JEDER Syntaxfamilie, nicht nur der des Zielmodells: ein
 * @Image7 in einem [ImageN]-Prompt ist genauso ein Halluzinationsbeweis —
 * das Zielmodell läse ihn zwar als Text, aber der Regisseur hat dann über
 * Material geschrieben, das es nicht gibt, und der Prompt lügt.
 * „plain" ist bewusst eng gefasst (Großes I, genau ein Leerzeichen), damit
 * normale Prosa wie "images" nie zur Fehlprüfung wird.
 *
 * @returns {{ok: boolean, used: number[], bad: number[]}}
 */
const HANDLE_PATTERNS = [/@Image(\d+)/g, /\[Image(\d+)\]/g, /\bImage (\d+)\b/g];
export function checkDirectedPrompt(text, refCount) {
  const s = String(text || "");
  const used = [...new Set(HANDLE_PATTERNS.flatMap((re) => [...s.matchAll(re)].map((m) => Number(m[1]))))];
  const bad = used.filter((n) => n < 1 || n > refCount);
  const ok = Boolean(s.trim()) && bad.length === 0;
  return { ok, used, bad };
}
