import { expect, test } from "bun:test";
import { normaliseSketch, sketchFallback, sketchUserMessage, pickParticles, PARTICLES, buildSketchGridPrompt } from "./sketchPrompt.js";
import { styleById } from "./styles.js";

test("normaliseSketch: nimmt saubere Szenen, auch in Zaun-Blöcken", () => {
  const raw = '```json\n{"cast":{"Anna":"a woman"},"scenes":["a woman in red, forest, dusk, wide shot","a lone figure, rooftop, night"],"particles":"fireflies"}\n```';
  expect(normaliseSketch(raw, 2)).toEqual({
    scenes: ["a woman in red, forest, dusk, wide shot", "a lone figure, rooftop, night"],
    particles: "fireflies",
  });
});

test("normaliseSketch: falsche Anzahl oder Unsinn → Fehler (App nimmt dann den Ersatzweg)", () => {
  expect(() => normaliseSketch('{"scenes":["one"]}', 2)).toThrow("SKETCH_FAILED");
  expect(() => normaliseSketch("kein json", 1)).toThrow("SKETCH_FAILED");
});

test("normaliseSketch: unbekannte Teilchen → Staub, Steuerzeichen und Klammern raus, Länge gedeckelt", () => {
  const long = "x".repeat(500);
  const out = normaliseSketch(JSON.stringify({ scenes: [`a {cat}\n"here"`, long], particles: "lasers" }), 2);
  expect(out.particles).toBe("dust");
  expect(out.scenes[0]).toBe("a cat here");
  expect(out.scenes[1].length).toBe(300);
  expect(PARTICLES).toContain(out.particles);
});

test("sketchFallback: keine Namen mehr, der Träumer wird zur Figur von hinten", () => {
  const { scenes } = sketchFallback(
    ["Anton opens my door and I see Rex.", "Anna's car floats over the city."],
    [{ name: "Anton" }, { name: "Rex", kind: "pet" }, { name: "Anna" }],
  );
  expect(scenes[0]).toBe("a figure opens the door and a lone figure see an animal.");
  expect(scenes[1]).toBe("a figure car floats over the city.");
  expect(scenes.join(" ")).not.toMatch(/Anton|Rex|Anna/);
});

test("pickParticles: ganze Wörter, keine Zufallstreffer", () => {
  expect(pickParticles("I start to stare at the office")).toBe("dust");
  expect(pickParticles("I see Rex")).toBe("dust");
  expect(pickParticles("a burning house")).toBe("embers");
  expect(pickParticles("we swim in the lake")).toBe("bubbles");
  expect(pickParticles("Schnee auf dem Dach")).toBe("snow");
  expect(pickParticles("in the forest at night")).toBe("fireflies");
});

test("sketchUserMessage: Figuren mit Beschreibung, Szenen nummeriert", () => {
  const msg = sketchUserMessage({
    beats: ["Anna runs.", "The sea rises."],
    people: [{ name: "Anna", desc: "tall, red hair", wearing: "a yellow coat" }, { name: "Rex", kind: "pet" }],
    mood: "eerie",
  });
  expect(msg).toContain("- Anna: person, tall, red hair, wearing a yellow coat");
  expect(msg).toContain("- Rex: animal");
  expect(msg).toContain("1. Anna runs.\n2. The sea rises.");
});


test("buildSketchGridPrompt: der Look steht ZUERST, das Foto nur für die Identität", () => {
  const p = buildSketchGridPrompt({ beats: ["a", "b", "c", "d"], styleId: "clay", clauses: ["Reference image 1 shows @me (person) — x"] });
  expect(p.startsWith("ART DIRECTION")).toBe(true);
  expect(p.indexOf(styleById("clay").prompt)).toBeLessThan(p.indexOf("A single wide image"));
  expect(p).toContain("ONLY tell you WHO");
  expect(p).toContain("Never copy a reference photo's lighting");
  expect(p).toContain("FOUR equal VERTICAL panels");
  expect(p).toContain("Panel 4 (far right)");
});

test("buildSketchGridPrompt: ohne Fotos keine Foto-Regeln", () => {
  const p = buildSketchGridPrompt({ beats: ["a", "b", "c", "d"], styleId: "surreal", clauses: [] });
  expect(p).not.toContain("reference");
});

test("buildSketchGridPrompt: weniger als vier Szenen → das freie Feld wird eine ruhige Totale", () => {
  const p = buildSketchGridPrompt({ beats: ["a", "b"], styleId: "surreal" });
  expect(p).toContain("Panel 3 (second from right): a quiet establishing shot");
  expect(p).toContain("Panel 4 (far right): a quiet establishing shot");
});
