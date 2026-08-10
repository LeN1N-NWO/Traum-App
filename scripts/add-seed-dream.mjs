#!/usr/bin/env bun
/* Adds one dream to the shared test journal that every checkout sees.
 *
 *   bun scripts/add-seed-dream.mjs seed-3-my-dream
 *
 * Edit DREAM below first, then run it. The whole round trip happens here:
 * render the 16:9 grid through the app's own /api/generate, cut it into
 * three panels, compress to WebP, write them to public/clips/, and print the
 * JavaScript block to paste into src/lib/seedJournal.js.
 *
 * Why a script and not "just generate one more by hand": every step has a
 * way to be subtly wrong. The prompt has to be the REAL buildGridPrompt (it
 * is imported here, never retyped). The cut has to match splitGrid.js. And
 * the output has to be WebP — see the size warning in seedJournal.js; PNGs
 * would have doubled the repository in a single commit.
 *
 * Needs: the dev server running (bun run dev), and Python with Pillow, which
 * does the image work — Bun has no image decoder and this is not worth a
 * native dependency for a script that runs a handful of times.
 */
import { buildGridPrompt } from "../src/lib/promptBuilder.js";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";

// ---- edit this, then run ----------------------------------------------
const DREAM = {
  // Shown in the journal. Keep the dreamer's own language.
  title: "Untitled dream",
  text: "The polished version of the dream, as the analysis would return it.",
  originalText: "What the person typed or said, before the AI touched it.",
  // How far back the entry is dated, so the journal and calendar look lived-in.
  daysAgo: 2,
  // One of the ids in src/lib/styles.js.
  styleId: "dreamlike",
  // Exactly three, left to right. One sentence each, describing what is SEEN.
  beats: [
    "First panel: what opens the dream.",
    "Second panel: the turn.",
    "Third panel: how it ends.",
  ],
};
// -----------------------------------------------------------------------

const API = process.env.API_BASE || "http://localhost:8100";
const slug = process.argv[2];

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Usage: bun scripts/add-seed-dream.mjs <slug>   (lowercase, digits, dashes)");
  process.exit(2);
}
if (DREAM.beats.length !== 3) {
  console.error("Exactly three beats — splitGrid and buildGridPrompt are proven for that shape only.");
  process.exit(2);
}

console.log(`Rendering the grid for "${slug}" …`);
const res = await fetch(`${API}/api/generate`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    dream: DREAM.text,
    mode: "image",
    prompt: buildGridPrompt({ beats: DREAM.beats, styleId: DREAM.styleId, clauses: [] }),
    aspectRatio: "16:9",
  }),
});
const data = await res.json().catch(() => null);
if (!res.ok || !data?.urls?.[0]) {
  console.error("Render failed:", data?.error || res.status, "— is `bun run dev` running?");
  process.exit(1);
}

// The server hands back its own /media/ path; fetch it back as bytes.
const gridUrl = data.urls[0].startsWith("/") ? `${API}${data.urls[0]}` : data.urls[0];
const grid = new Uint8Array(await (await fetch(gridUrl)).arrayBuffer());
const tmp = `seed-grid-tmp-${slug}.png`;
writeFileSync(tmp, grid);

// Faithful port of src/lib/splitGrid.js: same MAX_TRIM, same "brightest
// pixel" test for a dark line, same boundaries computed from zero. If that
// file's cropping ever changes, change it here too — or the seeded panels
// stop matching what the app itself would produce.
const PY = `
import sys
from PIL import Image
MAX_TRIM = 0.12
src, slug = sys.argv[1], sys.argv[2]

def dark(px, w, h, fixed, is_row):
    for i in range(w if is_row else h):
        r, g, b = (px[i, fixed] if is_row else px[fixed, i])[:3]
        if max(r, g, b) >= 12: return False
    return True

im = Image.open(src); w, h = im.size; px = im.convert("RGB").load()
top, bottom, left, right = 0, h - 1, 0, w - 1
my, mx = int(h * MAX_TRIM), int(w * MAX_TRIM)
while top < my and dark(px, w, h, top, True): top += 1
while (h - 1 - bottom) < my and dark(px, w, h, bottom, True): bottom -= 1
while left < mx and dark(px, w, h, left, False): left += 1
while (w - 1 - right) < mx and dark(px, w, h, right, False): right -= 1
bw, bh = right - left + 1, bottom - top + 1
bounds = [left + round(i * bw / 3) for i in range(4)]
for i in range(3):
    panel = im.crop((bounds[i], top, bounds[i + 1], top + bh)).convert("RGB")
    out = f"public/clips/{slug}-{i+1}.webp"
    panel.save(out, "WEBP", quality=82, method=6)
    print(out, panel.size[0], panel.size[1])
`;

const cut = spawnSync("python", ["-c", PY, tmp, slug], { encoding: "utf8" });
unlinkSync(tmp);
if (cut.status !== 0) {
  console.error("Cutting failed — is Python with Pillow installed?\n", cut.stderr);
  process.exit(1);
}
console.log(cut.stdout.trim());

const files = DREAM.beats.map((_, i) => `      "/clips/${slug}-${i + 1}.webp",`).join("\n");
console.log(`
Done. Paste this into RAW_DREAMS in src/lib/seedJournal.js:

  {
    text: ${JSON.stringify(DREAM.text)},
    originalText: ${JSON.stringify(DREAM.originalText)},
    title: ${JSON.stringify(DREAM.title)},
    daysAgo: ${DREAM.daysAgo},
    images: [
${files}
    ],
  },
`);
