import { test, expect } from "bun:test";
import { buildReferences, buildImagePrompt } from "./promptBuilder.js";

const anton = { name: "Anton", kind: "person", avatar: { tag: "anton", img: "a.png", desc: "" } };
const rex = { name: "Rex", kind: "pet", avatar: { tag: "rex", img: "r.png", desc: "" } };
const stranger = { name: "a stranger in a red coat", kind: "person", free: true };

test("reference numbers match the image array positions", () => {
  const { references, clauses } = buildReferences([anton, rex]);
  expect(references.map((r) => r.tag)).toEqual(["anton", "rex"]);
  expect(clauses[0]).toContain("Reference image 1");
  expect(clauses[0]).toContain("@anton");
  expect(clauses[1]).toContain("Reference image 2");
  expect(clauses[1]).toContain("@rex");
});

// The failure this whole module exists to prevent: a character with no photo
// must not consume an index, or every later reference points at the wrong face.
test("a free character does not consume a reference index", () => {
  const { references, clauses } = buildReferences([anton, stranger, rex]);
  expect(references.map((r) => r.tag)).toEqual(["anton", "rex"]);
  expect(clauses.find((c) => c.includes("@rex"))).toContain("Reference image 2");
});

test("free characters are named as inventable", () => {
  const { clauses } = buildReferences([anton, stranger]);
  const freeClause = clauses.find((c) => c.startsWith("Invent"));
  expect(freeClause).toContain("a stranger in a red coat");
});

test("an unassigned character contributes nothing at all", () => {
  const { references, clauses } = buildReferences([{ name: "Nobody", kind: "person" }]);
  expect(references).toEqual([]);
  expect(clauses).toEqual([]);
});

test("no assignments produce no clauses", () => {
  expect(buildReferences([])).toEqual({ references: [], clauses: [] });
  expect(buildReferences()).toEqual({ references: [], clauses: [] });
});

test("a description is woven into the clause", () => {
  const withDesc = { name: "Rex", kind: "pet", avatar: { tag: "rex", img: "r.png", desc: "a black labrador" } };
  const { clauses } = buildReferences([withDesc]);
  expect(clauses[0]).toContain("a black labrador");
});

test("the prompt carries beat, style, framing and clauses", () => {
  const { clauses } = buildReferences([anton]);
  const prompt = buildImagePrompt({
    beat: "Anton sits on the windowsill.",
    styleId: "dark", format: "9:16", clauses, index: 2, total: 5,
  });
  expect(prompt).toContain("Anton sits on the windowsill.");
  expect(prompt).toContain("low-key lighting");     // the dark template
  expect(prompt).toContain("9:16 vertical framing");
  expect(prompt).toContain("image 2 of 5");
  expect(prompt).toContain("Reference image 1");
});

test("a single image gets no sequence clause", () => {
  const prompt = buildImagePrompt({ beat: "A door.", styleId: "dreamlike", format: "16:9", total: 1 });
  expect(prompt).not.toContain("image 1 of 1");
  expect(prompt).toContain("16:9 widescreen framing");
});

test("an unknown style falls back rather than breaking", () => {
  const prompt = buildImagePrompt({ beat: "A door.", styleId: "nonsense", format: "9:16" });
  expect(prompt).toContain("dreamlike realism");
});

// — the poster —

import { buildPosterPrompt } from "./promptBuilder.js";
import { STYLES } from "./styles.js";

test("the poster carries title, tagline, essence and the style's archetype", () => {
  const prompt = buildPosterPrompt({
    title: "Der lila Ozean", tagline: "Manche Träume tragen dich.",
    essence: "Anton flies over a purple ocean.", styleId: "romantic", format: "9:16",
  });
  expect(prompt).toContain('the title "Der lila Ozean"');
  expect(prompt).toContain('the tagline "Manche Träume tragen dich."');
  expect(prompt).toContain("Anton flies over a purple ocean.");
  expect(prompt).toContain("overlapping montage");        // romantic archetype
  expect(prompt).toContain("billing block");
  expect(prompt).toContain("9:16 vertical one-sheet");
});

test("an empty tagline drops the tagline line entirely", () => {
  const prompt = buildPosterPrompt({
    title: "Falling", tagline: "", essence: "x", styleId: "dark", format: "9:16",
  });
  expect(prompt).not.toContain("tagline");
  expect(prompt).toContain('the title "Falling"');
});

test("poster reference clauses ride along so faces match the avatars", () => {
  const { clauses } = buildReferences([anton]);
  const prompt = buildPosterPrompt({
    title: "T", tagline: "", essence: "x", styleId: "ultrareal", format: "9:16", clauses,
  });
  expect(prompt).toContain("Reference image 1");
  expect(prompt).toContain("@anton");
});

test("every style declares a complete poster spec", () => {
  for (const s of STYLES) {
    expect(s.poster?.archetype?.length).toBeGreaterThan(0);
    expect(s.poster?.lettering?.length).toBeGreaterThan(0);
    expect(s.poster?.palette?.length).toBeGreaterThan(0);
  }
});

// — the grid: one generation, three panels —

import { buildGridPrompt } from "./promptBuilder.js";

test("the grid names all three beats, one per panel, in order", () => {
  const prompt = buildGridPrompt({
    beats: ["A flooded hallway.", "A dog at a window.", "Stairs into a dark basement."],
    styleId: "dark",
  });
  const iHallway = prompt.indexOf("A flooded hallway.");
  const iDog = prompt.indexOf("A dog at a window.");
  const iStairs = prompt.indexOf("Stairs into a dark basement.");
  expect(iHallway).toBeGreaterThan(-1);
  // Panels must stay left-to-right in prompt order — a splitIntoPanels()
  // crop has no other way to know which piece is which beat.
  expect(iHallway).toBeLessThan(iDog);
  expect(iDog).toBeLessThan(iStairs);
  expect(prompt).toContain("Panel 1 (leftmost third)");
  expect(prompt).toContain("Panel 2 (middle third)");
  expect(prompt).toContain("Panel 3 (rightmost third)");
});

test("the grid asks for a wide canvas with a hard divider, never a collage", () => {
  const prompt = buildGridPrompt({ beats: ["a", "b", "c"], styleId: "dreamlike" });
  expect(prompt).toContain("16:9");
  expect(prompt).toContain("divider line");
  expect(prompt).toContain("no bleed");
});

test("grid reference clauses ride along so faces match the avatars", () => {
  const { clauses } = buildReferences([anton]);
  const prompt = buildGridPrompt({ beats: ["a", "b", "c"], styleId: "ultrareal", clauses });
  expect(prompt).toContain("Reference image 1");
  expect(prompt).toContain("@anton");
});
