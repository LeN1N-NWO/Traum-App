/* Shared test dreams — everyone who checks this repo out sees the same
 * journal on a fresh install, instead of an empty state.
 *
 * Anton asked for this on 10.08.2026, and for new dreams to keep landing
 * here. `bun scripts/add-seed-dream.mjs` does the whole round trip: render,
 * cut, compress, and print the block to paste below.
 *
 * The images are REAL renders made the way the app makes them: ONE 16:9 grid
 * render per dream via buildGridPrompt(), cut into three panels with
 * splitGrid.js's logic — the "Schnellvorschau" path from Step5Style.jsx.
 * Hence three panels at 459×768 per dream, not one 9:16 image.
 *
 * ⚠️ WebP, not PNG, and that is not cosmetic. These files are committed, and
 * git keeps every version forever: the six PNGs were 3.4 MB against a 3.6 MB
 * repo — one commit would have doubled it, and deleting them later would not
 * give the space back. The same six as WebP are 0.27 MB. Anything added here
 * goes through the script, which enforces that.
 *
 * They live in public/clips/ — already on the server's static allowlist and
 * git-tracked (see PUBLIC_DIRS in server.js) — rather than media/, which is
 * gitignored per-install generated content. No API calls happen from here.
 *
 * To remove entirely: delete this file, public/clips/seed-*.webp, the script,
 * the import in src/state/AppState.jsx, and the loadInitialState() wrapper
 * there (revert to `useState(loadState)`).
 */
import { newCreature } from "./creatures.js";

const RAW_DREAMS = [
  {
    text: "I was in my old bedroom, and Anton sat perched on the windowsill. Then the wall split open, and we drifted out over a dark, endless sea. Far below, my dog Rex ran across the water, his paws skimming its surface. I woke up falling.",
    originalText: "I was in my old bedroom and Anton was sitting on the windowsill. Then the wall opened and we flew out over a dark sea. My dog Rex was running on the water below us. I woke up falling.",
    title: "Weeping Old Bedroom",
    daysAgo: 3,
    images: [
      "/clips/seed-1-old-bedroom-1.webp",
      "/clips/seed-1-old-bedroom-2.webp",
      "/clips/seed-1-old-bedroom-3.webp",
    ],
  },
  {
    text: "Ich war in einem alten Bahnhof, und meine Katze Luna saß auf dem Gleis. Plötzlich fuhr ein gläserner Zug ein, und Anton stieg aus. Wir fuhren zusammen durch einen Wald aus Lichtern. Dann bin ich aufgewacht.",
    originalText: "Ich war in einem alten Bahnhof und meine Katze Luna sass auf dem Gleis. Plötzlich fuhr ein Zug aus Glas ein und Anton stieg aus. Wir fuhren zusammen durch einen Wald aus Lichtern. Dann bin ich aufgewacht.",
    title: "Der gläserne Zug",
    daysAgo: 1,
    images: [
      "/clips/seed-2-glass-train-1.webp",
      "/clips/seed-2-glass-train-2.webp",
      "/clips/seed-2-glass-train-3.webp",
    ],
  },
];

/** @returns {{journal: object[], creatures: object[]}} */
export function buildSeedJournal() {
  const journal = [];
  const creatures = [];

  RAW_DREAMS.forEach((d, i) => {
    // Deterministic ids: this is fixture data, not something that needs
    // genId()'s collision resistance, and stable ids make it obvious in
    // devtools that an entry came from the seed.
    const creature = { ...newCreature(d.text), id: `cr_seed${i}` };
    creatures.push(creature);

    journal.push({
      id: `e_seed${i}`,
      createdAt: new Date(Date.now() - d.daysAgo * 86400000).toISOString(),
      text: d.text,
      originalText: d.originalText,
      title: d.title,
      tagline: "",
      // "preview" is what a grid-cut dream is: the three panels ARE the
      // sequence, so the entry looks exactly like one made through the
      // wizard's quick-look path.
      mode: "preview",
      // Plain "/clips/…" paths, not "/media/…" — mediaUrl() only prefixes
      // API_BASE onto "/media/" paths (those live on the API origin); clips
      // ship inside the app bundle itself and are always same-origin.
      media: { type: "image", urls: d.images, source: "seed" },
      imageCount: d.images.length,
      analysis: null,
      references: [],
      creatureId: creature.id,
    });
  });

  return { journal, creatures };
}
