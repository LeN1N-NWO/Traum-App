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

/**
 * The title card that opens every dream: a theatrical film poster.
 *
 * The layout rules are reverse-engineered from seven classic one-sheets
 * (Titanic, Gladiator, E.T., Pulp Fiction, Léon, They Cloned Tyrone, Risky
 * Business). What they all share, and what AI posters usually get wrong:
 * ONE dominant motif (never a collage), a strict vertical hierarchy
 * (tagline top, motif middle, title in the lower third, billing block at the
 * bottom), a restricted palette, and typography that carries the genre.
 * Which archetype the motif follows comes from the style's `poster` field.
 *
 * @param {object} p
 * @param {string} p.title      exact title text, in the dream's language
 * @param {string} p.tagline    exact tagline text; empty skips the tagline line
 * @param {string} p.essence    what the dream is about, distilled (English)
 * @param {string} p.styleId
 * @param {string} p.format     "9:16" | "16:9"
 * @param {string[]} p.clauses  from buildReferences() — poster faces are the real avatars
 */
export function buildPosterPrompt({ title, tagline, essence, styleId, format, clauses = [] }) {
  const style = styleById(styleId);
  const p = style.poster;
  const framing = format === "16:9" ? "16:9 horizontal one-sheet" : "9:16 vertical one-sheet, standard theatrical poster proportions";
  const taglineLine = tagline
    ? `Near the top, in small widely-spaced capitals: the tagline "${tagline}". `
    : "";
  const refs = clauses.length ? `\n${clauses.join(" ")}` : "";

  return (
    `A theatrical film poster for an imaginary film, ${framing}.` +
    `\nThe film: ${essence}` +
    `\nCentral motif — commit to exactly ONE dominant visual idea, never a collage: ${p.archetype}.` +
    `\n${taglineLine}In the lower third, large and unmissable: the title "${title}" in ${p.lettering}. ` +
    `At the very bottom edge, a fine-print billing block of tiny illegible credit lines, like a real release poster.` +
    `\nRestricted palette: ${p.palette}.` +
    `\n${style.prompt}` +
    `\nRender the title${tagline ? " and tagline" : ""} EXACTLY as given, spelled correctly, as crisp printed typography. No other text, no logos, no watermarks.${refs}`
  );
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
export function buildImagePrompt({ beat, styleId, format, clauses = [], index = 1, total = 1 }) {
  const style = styleById(styleId);
  const framing = format === "16:9" ? "16:9 widescreen framing" : "9:16 vertical framing";
  const place = total > 1 ? ` This is image ${index} of ${total} in one continuous dream sequence; keep characters, wardrobe and palette consistent across all of them.` : "";
  const refs = clauses.length ? `\n${clauses.join(" ")}` : "";

  return (
    `A cinematic, photoreal film still: ${beat}` +
    `\n${style.prompt}` +
    `\n${framing}, ultra-detailed, accurate hands and faces.${place}${refs}`
  );
}
