import { test, expect } from "bun:test";
import { buildReferences, buildImagePrompt, buildCharacterPrompt } from "./promptBuilder.js";

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

/* Der Charakterbogen muss langweilig sein — das ist seine Aufgabe. Alles,
   was das Bild interessant macht (Stimmung, Handlung, Schatten), wandert
   später in jedes Bild der Strecke mit, weil es als Referenz dient. */
test("the character sheet asks for a reference, not a scene", () => {
  const p = buildCharacterPrompt({ desc: "eine große Frau mit silbernem Haar", category: "person" });
  expect(p).toContain("eine große Frau mit silbernem Haar");
  expect(p.toLowerCase()).toContain("neutral");
  expect(p.toLowerCase()).toContain("reference");
  expect(p.toLowerCase()).toContain("not a scene");
});

test("each category gets its own framing", () => {
  const person = buildCharacterPrompt({ desc: "x", category: "person" });
  const pet = buildCharacterPrompt({ desc: "x", category: "pet" });
  const place = buildCharacterPrompt({ desc: "x", category: "place" });
  expect(person).not.toBe(pet);
  expect(pet).not.toBe(place);
  // Ein Ort hat kein Gesicht — „facing the camera" wäre dort Unsinn.
  expect(place.toLowerCase()).toContain("no people");
});

test("an unknown category still yields a usable prompt", () => {
  expect(buildCharacterPrompt({ desc: "x", category: "spaceship" })).toContain("x");
});

/* Der Bogen aus einem FOTO — der Wortlaut ist der bezahlte Prüfstein vom
   20.08. (Plan charakterbogen-pflicht §7: Segelboot weg, Ähnlichkeit hält).
   Was hier festgenagelt wird, sind die Eigenschaften, an denen der Test
   hing: geteiltes Bild, grauer Grund, keine Szene. */
import { buildSheetFromPhotoPrompt } from "./promptBuilder.js";

test("the photo sheet asks for two panels on grey, not a scene", () => {
  const p = buildSheetFromPhotoPrompt({ category: "person" });
  expect(p).toContain("reference image 1");
  expect(p).toContain("two panels");
  expect(p.toLowerCase()).toContain("full body");
  expect(p.toLowerCase()).toContain("head-and-shoulders");
  expect(p.toLowerCase()).toContain("mid-grey background");
  expect(p.toLowerCase()).toContain("not a scene");
});

test("the photo sheet fixes wardrobe once, from the description", () => {
  const p = buildSheetFromPhotoPrompt({ desc: "wearing a red coat", category: "person" });
  expect(p).toContain("wearing a red coat");
  // Ohne Beschreibung keine leere Garderoben-Floskel.
  expect(buildSheetFromPhotoPrompt({ category: "person" }).includes("Look and wardrobe")).toBe(false);
});

test("pets get their own panel framing", () => {
  const p = buildSheetFromPhotoPrompt({ category: "pet" });
  expect(p.toLowerCase()).toContain("whole animal");
  expect(p.toLowerCase()).toContain("head");
});

/* Der Bildprompt dient dem Regisseur als Beschreibung des Startbilds — aber
   seine Referenzklauseln zählen anders als das Videomodell (@Image1 ist dort
   IMMER das Startbild). Ungefiltert nebeneinander vertauschen die beiden
   Zählungen Gesichter, eine Stufe später als der Fall im Dateikopf. */
import { stripReferenceClauses } from "./promptBuilder.js";

test("the still handed to the director carries no reference clauses", () => {
  const { clauses } = buildReferences([
    { name: "Anton", kind: "person", avatar: { tag: "anton", img: "d1" } },
    { name: "der Alligator", kind: "pet", free: true },
  ]);
  const prompt = buildImagePrompt({ beat: "A wide terminal at dusk.", styleId: "surreal", format: "9:16", clauses });

  expect(prompt).toContain("Reference image 1 shows");
  const stripped = stripReferenceClauses(prompt);
  expect(stripped).not.toContain("Reference image 1 shows");
  expect(stripped).not.toContain("Invent the appearance of");
  // Die Bildbeschreibung selbst muss bleiben — sie ist der ganze Zweck.
  expect(stripped).toContain("A wide terminal at dusk.");
  expect(stripped).toContain("Surrealist composition");
});

test("stripping is safe on a prompt that never had clauses", () => {
  const plain = buildImagePrompt({ beat: "Rain on a window.", styleId: "noir", format: "9:16" });
  expect(stripReferenceClauses(plain)).toBe(plain.trim());
  expect(stripReferenceClauses("")).toBe("");
  expect(stripReferenceClauses(undefined)).toBe("");
});

/* — das echte Raster (rows > 1), Antons Test vom 23.08. —
   Der Streifen bleibt, wie er war; hier wird nur der zweite Zweig geprüft.
   Das Wichtigste zuerst: Die Plätze müssen in LESEREIHENFOLGE stehen, weil
   tileBoxes() genau so schneidet. Läuft das auseinander, bekommt jeder Beat
   das Bild seines Nachbarn — derselbe Schaden, vor dem der Dateikopf warnt,
   nur eine Ebene höher. */
test("the grid names every tile in reading order", () => {
  const prompt = buildGridPrompt({
    beats: ["Eins.", "Zwei.", "Drei.", "Vier."],
    styleId: "dark", cols: 2, rows: 2,
  });
  const pos = (s) => prompt.indexOf(s);
  expect(pos("top left tile: Eins.")).toBeGreaterThan(-1);
  expect(pos("top right tile: Zwei.")).toBeGreaterThan(pos("top left tile: Eins."));
  expect(pos("bottom left tile: Drei.")).toBeGreaterThan(pos("top right tile: Zwei."));
  expect(pos("bottom right tile: Vier.")).toBeGreaterThan(pos("bottom left tile: Drei."));
});

test("the grid demands vertical tiles — a sideways tile makes the cut worthless", () => {
  const prompt = buildGridPrompt({ beats: ["a", "b", "c", "d"], styleId: "dark", cols: 2, rows: 2 });
  expect(prompt).toContain("VERTICAL 9:16");
  expect(prompt).toContain("2×2 grid");
  expect(prompt).toContain("no bleed");
});

/* Fünf Beats auf sechs Plätzen: Der freie Platz muss BENANNT werden. Ohne
   Ansage füllt das Modell ihn mit Schwarz, einem Muster oder — am
   schlimmsten — einer sechsten erfundenen Szene, die dann jemand für einen
   Beat hält. */
test("a spare tile gets an explicit job, never silence", () => {
  const prompt = buildGridPrompt({
    beats: ["a", "b", "c", "d", "e"], styleId: "dreamlike", cols: 3, rows: 2,
  });
  expect(prompt).toContain("3×2 grid");
  expect(prompt).toContain("The remaining tile");
  expect(prompt).toContain("Never leave a tile blank");
});

test("a full grid says nothing about spare tiles", () => {
  const prompt = buildGridPrompt({ beats: ["a", "b", "c", "d"], styleId: "dark", cols: 2, rows: 2 });
  expect(prompt).not.toContain("remaining");
});

/* Der bewährte Dreier-Streifen darf sich durch den Umbau NICHT verändert
   haben — er ist an echten Renders belegt und splitIntoPanels() schneidet
   genau seine Formulierung. */
test("the proven three-panel strip is untouched by the grid branch", () => {
  const prompt = buildGridPrompt({ beats: ["a", "b", "c"], styleId: "dark" });
  expect(prompt).toContain("exactly THREE equal vertical panels");
  expect(prompt).toContain("Panel 1 (leftmost third)");
  expect(prompt).not.toContain("grid of");
});

test("grid reference clauses ride along in the 2D branch too", () => {
  const { clauses } = buildReferences([anton]);
  const prompt = buildGridPrompt({ beats: ["a", "b", "c", "d"], styleId: "ultrareal", clauses, cols: 2, rows: 2 });
  expect(prompt).toContain("Reference image 1");
  expect(prompt).toContain("@anton");
});
