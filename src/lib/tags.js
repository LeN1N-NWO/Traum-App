/* Photo tags — ported from the pre-React app.
 *
 * An avatar carries a self-chosen tag ("anna", "island"). If the dream text
 * names that tag, the photo goes to image generation as a named reference.
 *
 * Word boundaries are mandatory: "anna" must not match inside "annals", nor
 * "ex" inside "exam". Same logic as the symbol detection.
 *
 * ⚠ From the wizard onwards this detection is only a SUGGESTION — the person
 * assigns each character explicitly. Today it is still the filter, which is
 * why "my sister" gets no reference photo even when one exists.
 */

export function mentionsTag(text, tag) {
  if (!tag) return false;
  const esc = String(tag).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(String(text || ""));
}

/** Where a tag occurs in the text: [{start,end,tag}], used for highlighting. */
export function findTagSpans(text, tags) {
  const spans = [];
  for (const tag of tags) {
    if (!tag) continue;
    const esc = String(tag).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])(${esc})([^a-z0-9]|$)`, "gi");
    let m;
    while ((m = re.exec(String(text || ""))) !== null) {
      const start = m.index + m[1].length;
      spans.push({ start, end: start + m[2].length, tag });
      re.lastIndex = start + m[2].length;   // allow overlapping matches
    }
  }
  // sort by position, drop overlaps (longest match wins)
  spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const clean = [];
  let last = -1;
  for (const s of spans) { if (s.start >= last) { clean.push(s); last = s.end; } }
  return clean;
}

/** Every avatar the text names (including @me).
 *  Takes state as a parameter — it used to read a global, which in React is
 *  neither testable nor traceable. */
export function taggedPhotosIn(state, text) {
  const out = [];
  if (state?.me?.img && mentionsTag(text, "me")) {
    out.push({ tag: "me", category: "person", img: state.me.img });
  }
  for (const p of state?.cast || []) {
    if (p.img && mentionsTag(text, p.tag)) out.push(p);
  }
  return out;
}
