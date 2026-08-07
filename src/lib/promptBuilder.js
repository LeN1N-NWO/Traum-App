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
