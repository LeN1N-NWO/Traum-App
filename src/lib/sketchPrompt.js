/* Die Bildsprache der Traum-Skizze (25.09.2026, Antons Befund: „Der Kontext
 * ist auch ziemlich komisch").
 *
 * Warum eigene Prompts: Die Analyse-Beats sind Regieanweisungen für die
 * Kino-Modelle — ganze Sätze mit Namen („Anton opens the door and realizes
 * …"). Stable Diffusion 1.5 liest aber nur 77 Tokens und versteht Namen und
 * Handlungsketten nicht: Es malte in jeder Szene eine andere Person und
 * verlor den Rest. SD will kurze, sichtbare Stichworte — Motiv, Ort, Licht,
 * Einstellung — und für dieselbe Figur jedes Mal dieselben Worte.
 *
 * Zwei Wege, eine Form ({ scenes, particles }):
 *   - Server (/api/sketch-prompts): DeepSeek schreibt die Szenen neu. Kostet
 *     uns Bruchteile eines Cents, den Menschen nichts.
 *   - sketchFallback(): ohne Netz oder mit altem Server — Namen raus,
 *     neutrale Worte rein. Schlechter, aber nie Kauderwelsch.
 *
 * Alles hier ist rein (kein Netz), damit es getestet werden kann. */
import { buildGridPrompt } from "./promptBuilder.js";
import { styleById } from "./styles.js";

export const PARTICLES = ["dust", "snow", "fireflies", "embers", "bubbles", "none"];

export const SKETCH_SYSTEM = `You write image prompts for Stable Diffusion 1.5, which paints the scenes of a dream on a phone.
Stable Diffusion reads at most 77 tokens, knows no names, and cannot follow a story. It paints nouns, adjectives, places, light and camera words.

You receive the dream's scenes (English, in order), its characters and its mood. Return ONLY this JSON:
{
  "cast": { "<name>": "<fixed visual description>" },
  "scenes": [ "<prompt for scene 1>", "<prompt for scene 2>", ... ],
  "particles": "dust" | "snow" | "fireflies" | "embers" | "bubbles" | "none"
}

Rules for "cast":
- One entry per character. A fixed ENGLISH visual description of 4-10 words: age range, hair, clothing, one striking detail. Use the given description and clothing when there is one; otherwise invent a plausible, ordinary look.
- The dreamer ("I", "me", "ich" …) is painted as "a lone figure seen from behind" plus clothing if known — never a face.
- An animal gets species, color and size ("a small grey tabby cat").

Rules for "scenes":
- Exactly one prompt per input scene, same order, same count.
- 12-35 words, English, comma-separated visual phrases, most important first:
  subject (use the cast description VERBATIM instead of any name), one simple visible pose, the setting, light and time of day, camera shot (wide shot / close-up / low angle / aerial view).
- Never a name, never a pronoun without its description, never feelings, sounds, thoughts or story words (then, suddenly, realizes, remembers, tries).
- Make the surreal concrete: "a whale floating through a living room", not "the room felt like the ocean".
- No text, signs, letters or logos in the picture.
- Nothing sexual, no nudity, no gore — if the dream has it, paint the setting and the mood instead.

Rules for "particles" (drifting through the film): snow for cold or winter, embers for fire, anger or heat, fireflies for night, forests or gardens, bubbles for water or underwater, none for bright daylight interiors, otherwise dust.`;

const MAX_SCENE = 300;

/** Nur saubere, kurze Szenen; Anzahl muss stimmen — sonst lieber der Ersatzweg. */
export function normaliseSketch(rawText, count) {
  let parsed;
  try {
    const unfenced = String(rawText).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
    parsed = JSON.parse(unfenced);
  } catch {
    throw new Error("SKETCH_FAILED");
  }
  const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  const clean = scenes
    .map((s) => (typeof s === "string" ? s.replace(/[\u0000-\u001f"<>{}]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SCENE) : ""))
    .filter(Boolean);
  if (clean.length !== count) throw new Error("SKETCH_FAILED");
  const particles = PARTICLES.includes(parsed?.particles) ? parsed.particles : "dust";
  return { scenes: clean, particles };
}

/** Die Nachricht an das Modell — nur das, was die Bilder brauchen. */
export function sketchUserMessage({ beats, people, mood }) {
  const cast = (people || []).map((p) => {
    const bits = [p.kind === "pet" ? "animal" : "person", p.desc, p.wearing ? `wearing ${p.wearing}` : ""].filter(Boolean);
    return `- ${p.name}: ${bits.join(", ")}`;
  });
  return [
    `Mood: ${mood || "dreamlike"}`,
    `Characters:\n${cast.length ? cast.join("\n") : "- (none named)"}`,
    `Scenes:\n${beats.map((b, i) => `${i + 1}. ${b}`).join("\n")}`,
  ].join("\n\n");
}

const SELF = /\b(I|me|myself)\b/g;

/** Ersatzweg ohne Server: Namen gegen neutrale Worte tauschen. */
export function sketchFallback(beats, people) {
  const names = (people || [])
    .map((p) => (typeof p === "string" ? { name: p } : p))
    .filter((p) => p?.name && p.name.length > 1)
    .sort((a, b) => b.name.length - a.name.length);
  const scenes = beats.map((beat) => {
    let s = String(beat || "");
    for (const p of names) {
      const word = p.kind === "pet" ? "an animal" : "a figure";
      s = s.replace(new RegExp(`\\b${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}('s)?\\b`, "gi"), word);
    }
    return s.replace(/\b[Mm]y\b/g, "the").replace(SELF, "a lone figure").replace(/\s+/g, " ").trim().slice(0, MAX_SCENE);
  });
  return { scenes, particles: pickParticles(beats.join(" ")) };
}

/** Teilchen aus Stichworten — für den Ersatzweg. */
export function pickParticles(text) {
  const t = String(text || "").toLowerCase();
  const has = (words) => new RegExp(`\\b(${words})\\b`).test(t);
  if (has("snow\\w*|winter|ice|icy|frost\\w*|frozen|cold|schnee|eis|kalt\\w*")) return "snow";
  if (has("fire\\w*|flames?|burn\\w*|lava|embers?|feuer|brennt?|flammen?")) return "embers";
  if (has("underwater|ocean|sea|lake|swim\\w*|water|meer|wasser|schwimm\\w*")) return "bubbles";
  if (has("night|forest|garden|stars?|moon\\w*|nachts?|wald|garten|sterne?|mond")) return "fireflies";
  return "dust";
}

/* ── Der Raster-Prompt der Cloud-Skizze (25.09. abends) ────────────────────
 * Antons iPhone-Test: „Der Style ist überhaupt nicht durchgekommen." Grund:
 * In buildGridPrompt steht der Look am ENDE, und die Referenzklausel sagt
 * „exact likeness" — bei GPT Image 2 „low" gewinnt dann das Foto samt
 * seinem fotografischen Licht und seinem Hintergrund (Lampe und Fenster aus
 * dem Referenzfoto tauchten in den Kacheln auf).
 * Deshalb hier: der Look ZUERST als Regieanweisung, und ausdrücklich, dass
 * ein Foto nur sagt, WER jemand ist — nie, wie das Bild aussieht.
 * Der Film-Weg (buildGridPrompt allein) bleibt unberührt. */
export function buildSketchGridPrompt({ beats, styleId, clauses = [] }) {
  const style = styleById(styleId);
  const lead =
    `ART DIRECTION — the most important instruction: every tile is rendered in this look, ` +
    `and nothing in the image may look like an ordinary photograph unless the look asks for it: ${style.prompt}\n` +
    (clauses.length
      ? `The reference images ONLY tell you WHO the characters are (face, hair, build). Re-create those people ` +
        `inside this look — same identity, but drawn/lit/rendered exactly like everything else in the tile. ` +
        `Never copy a reference photo's lighting, colours, camera, background, room, furniture, lamp or window, ` +
        `and never paste the photo itself into a tile.\n`
      : "");
  return lead + buildGridPrompt({ beats, styleId, clauses, cols: 2, rows: 2, tile: "1:1" });
}
