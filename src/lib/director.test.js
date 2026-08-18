import { test, expect } from "bun:test";
import { buildDirectorBrief, checkDirectedPrompt, DIRECTOR_MOTION, DIRECTOR_FULL } from "./director.js";

/* Die Prüfung existiert, weil Modellausgabe so untrusted ist wie
   Nutzereingabe: Ein @ImageN über die Referenzzahl hinaus ist eine
   halluzinierte Referenz, und das Videomodell würde sie durch IRGENDEIN
   Bild füllen — dieselbe Fehlerklasse wie im promptBuilder („people get
   each other's faces"), nur eine Stufe später. */

test("a prompt using exactly the given references passes", () => {
  const got = checkDirectedPrompt("@Image1 stands left. @Image2 behind. @Image1 turns.", 2);
  expect(got.ok).toBe(true);
  expect(got.used).toEqual([1, 2]);
});

test("a hallucinated reference index fails, and says which", () => {
  const got = checkDirectedPrompt("@Image1 walks toward @Image4.", 3);
  expect(got.ok).toBe(false);
  expect(got.bad).toEqual([4]);
});

test("with zero references, any @Image mention fails", () => {
  // Ein-Bild-Modelle (Lebendig, Kino) haben kein image_urls-Array — jedes
  // @Image dort wäre eine Anweisung ins Leere.
  expect(checkDirectedPrompt("@Image1 appears.", 0).ok).toBe(false);
  expect(checkDirectedPrompt("The curtains move slowly.", 0).ok).toBe(true);
});

test("an empty answer never passes", () => {
  expect(checkDirectedPrompt("", 2).ok).toBe(false);
  expect(checkDirectedPrompt("   ", 0).ok).toBe(false);
  expect(checkDirectedPrompt(null, 0).ok).toBe(false);
});

test("unused references are allowed — the director may drop what the shot does not need", () => {
  // CINEDANCE-Regel: keine Referenz erzwingen, die im Shot nicht vorkommt.
  const got = checkDirectedPrompt("@Image1 sits alone.", 3);
  expect(got.ok).toBe(true);
  expect(got.used).toEqual([1]);
});

/* Die Nummerierung der Materialliste IST die Reihenfolge des
   image_urls-Arrays — Zeile N gehört zu @ImageN. */
test("the brief numbers references in array order", () => {
  const brief = buildDirectorBrief({
    dream: "Ich flog über die Stadt.",
    refs: [
      { tag: "anton", kind: "person", desc: "dark curly hair" },
      { tag: "bahnhof", kind: "place" },
    ],
    seconds: 10,
    audio: true,
  });
  expect(brief.indexOf('@Image1 — person "anton"')).toBeGreaterThan(-1);
  expect(brief.indexOf('@Image2 — place "bahnhof"')).toBeGreaterThan(-1);
  expect(brief.indexOf("@Image1")).toBeLessThan(brief.indexOf("@Image2"));
  expect(brief).toContain("DURATION: 10 seconds.");
});

test("a refless brief mentions no reference block at all", () => {
  const brief = buildDirectorBrief({ dream: "x", still: "a dark room", seconds: 6 });
  expect(brief.includes("REFERENCES")).toBe(false);
  expect(brief).toContain("THE STILL");
});

/* Beide Bauanleitungen tragen die drei Regeln, die aus echten T0-Abdriften
   stammen. Reine Textprüfung — aber sie schlägt an, wenn jemand die Regel
   beim Umformulieren verliert. */
test("both director briefs keep the three anti-drift rules", () => {
  for (const d of [DIRECTOR_MOTION, DIRECTOR_FULL]) {
    expect(/never quote the dream's original wording/i.test(d)).toBe(true);
    expect(/never (use )?millimeters/i.test(d)).toBe(true);
  }
  expect(DIRECTOR_FULL).toContain("no invented clothing");
});

/* filmReferences trägt die Reihenfolge-Invariante: Listenposition =
   @Image-Nummer minus eins. Diese Tests sind die Fortsetzung der
   promptBuilder-Tests eine Stufe später. */
import { filmReferences } from "./director.js";

test("people come before pets before places, stable within each kind", () => {
  const cast = [
    { tag: "bahnhof", category: "place", img: "d3" },
    { tag: "luna", category: "pet", img: "d2" },
    { tag: "anton", category: "person", img: "d1" },
    { tag: "mama", category: "person", img: "d4" },
  ];
  expect(filmReferences(cast).map((c) => c.tag)).toEqual(["anton", "mama", "luna", "bahnhof"]);
});

test("an entry without an image contributes no reference", () => {
  // Eine Beschreibung allein hat im image_urls-Array nichts beizutragen —
  // sie würde die Nummerierung verschieben und Gesichter vertauschen.
  const cast = [
    { tag: "rex", category: "pet", img: "" },
    { tag: "anton", category: "person", img: "d1" },
  ];
  expect(filmReferences(cast).map((c) => c.tag)).toEqual(["anton"]);
});

test("places fall off first when slots run out", () => {
  const cast = [
    { tag: "p1", category: "person", img: "a" },
    { tag: "ort1", category: "place", img: "b" },
    { tag: "tier1", category: "pet", img: "c" },
    { tag: "p2", category: "person", img: "d" },
  ];
  expect(filmReferences(cast, 3).map((c) => c.tag)).toEqual(["p1", "p2", "tier1"]);
});
