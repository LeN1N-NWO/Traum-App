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

/* Die drei Zutaten, die bis 19.08.2026 fehlten. Jede hat ihren eigenen
   Schadensfall, deshalb je ein Test statt eines Sammeltests. */
test("the style anchor reaches the brief, limited to colour and light", () => {
  const brief = buildDirectorBrief({ dream: "x", seconds: 6, style: "Kodak Vision3, deep shadows" });
  expect(brief).toContain("STYLE ANCHOR");
  expect(brief).toContain("Kodak Vision3, deep shadows");
  // Der Stiltext nennt teils Brennweiten in Millimetern; die Optik entscheidet
  // aber der Regisseur nach Inhalt. Ohne diese Einschränkung kollidiert der
  // Anker mit der Grad-Regel im Systemprompt.
  expect(brief).toMatch(/colour, light and texture only/i);
});

test("the arc is handed over as shape, not as a cut list", () => {
  const brief = buildDirectorBrief({
    dream: "x", seconds: 6,
    beats: ["He waits.", "Rabbits pour past.", "An alligator charges."],
  });
  expect(brief).toContain("1. He waits.");
  expect(brief).toContain("3. An alligator charges.");
  // Fünf Szenen dürfen nicht als fünf Schnitte gelesen werden — bei zehn
  // Sekunden Film wären das zwei Sekunden je Einstellung.
  expect(brief).toMatch(/not as a cut list/i);
});

/* Die Dauer stand bis 19.08.2026 nur als Gesamtzahl im Brief und blieb
   folgenlos: dieselben fünf Szenen wurden auf fünf wie auf dreißig Sekunden
   verteilt. Jetzt steht die Rechnung im Text. */
test("the brief does the arithmetic — seconds per beat, not just a total", () => {
  const b10 = buildDirectorBrief({ dream: "x", seconds: 10, beats: ["a", "b", "c", "d", "e"] });
  expect(b10).toContain("5 beats have to fill 10 seconds");
  expect(b10).toContain("about 2 seconds each");

  const b30 = buildDirectorBrief({ dream: "x", seconds: 30, beats: ["a", "b", "c", "d", "e"] });
  expect(b30).toContain("about 6 seconds each");

  // Krumme Teilung bleibt lesbar statt zu einer Zahlenwurst zu werden.
  const b7 = buildDirectorBrief({ dream: "x", seconds: 7, beats: ["a", "b", "c"] });
  expect(b7).toContain("about 2.3 seconds each");
});

test("the last beat must land — an unresolved ending is called out", () => {
  const brief = buildDirectorBrief({ dream: "x", seconds: 10, beats: ["a", "b"] });
  expect(brief).toMatch(/never leave the last beat unresolved/i);
});

test("with references, the still is declared as @Image1 rather than a second material", () => {
  const brief = buildDirectorBrief({
    dream: "x", seconds: 10, still: "a wide airport terminal at dusk",
    refs: [{ tag: "keyframe", kind: "opening still" }, { tag: "anton", kind: "person" }],
  });
  expect(brief).toContain("a wide airport terminal at dusk");
  expect(brief).toMatch(/@Image1/);
  expect(brief).toMatch(/same picture as the first reference/i);
});

/* ⚠ Der Test, der den eigentlichen Fehler gefunden hätte.
 *
 * `style` war von Anfang an in der Signatur, der Systemprompt wies
 * ausdrücklich an, den Anker einzuweben — und server.js übergab ihn nie. Ein
 * Test von buildDirectorBrief ALLEIN kann das nicht sehen: er ruft die
 * Funktion mit style auf und ist zufrieden, während in der App nichts
 * ankommt. Die Lücke sitzt zwischen den Dateien, also muss der Test dorthin.
 *
 * Absichtlich generisch statt einer Liste bekannter Felder: So schlägt er
 * auch beim NÄCHSTEN Parameter an, den jemand hinzufügt und zu verdrahten
 * vergisst — dieselbe Fehlerklasse, nicht derselbe Fehler. */
import { readFileSync } from "node:fs";
test("every parameter the brief accepts is actually passed by server.js", () => {
  const dir = new URL("./director.js", import.meta.url).pathname;
  const srv = new URL("../../server.js", import.meta.url).pathname;

  const sig = readFileSync(dir, "utf8")
    .match(/export function buildDirectorBrief\(\{([^}]*)\}/)?.[1];
  expect(sig).toBeTruthy();
  const params = sig.split(",").map((s) => s.trim().split(/[=:]/)[0].trim()).filter(Boolean);

  const call = readFileSync(srv, "utf8")
    .match(/buildDirectorBrief\(\{([\s\S]*?)\n\s*\}\)/)?.[1];
  expect(call).toBeTruthy();

  const missing = params.filter((p) => !new RegExp(`(^|[\\s,{])${p}\\s*[,:}]`).test(call));
  expect(missing).toEqual([]);
});

/* Der zweite Teil desselben Fehlers: `still` wurde zwar übergeben, aber bei
 * Referenz-Modellen auf undefined gesetzt — ausgerechnet dort, wo der
 * Systemprompt Bildpositionen in Metern verlangt. */
test("the still is passed unconditionally, not only for single-image models", () => {
  const call = readFileSync(new URL("../../server.js", import.meta.url).pathname, "utf8")
    .match(/buildDirectorBrief\(\{([\s\S]*?)\n\s*\}\)/)?.[1];
  expect(call).not.toMatch(/still:\s*\w+\s*\?/);
});

/* Ein Feld zu ÜBERGEBEN heisst nicht, es richtig zu übergeben. Der Test
 * darüber ist mit einem blossen `beats,` zufrieden — und genau so lief es
 * bis 19.08.: alle fünf Szenen, auch für einen Fünf-Sekunden-Film. Die
 * Rot-Probe deckte die Lücke auf, also prüft dieser Test die Aufbereitung
 * und nicht nur die Anwesenheit. */
test("the arc reaching the director is cut to the film's length", () => {
  const src = readFileSync(new URL("../../server.js", import.meta.url).pathname, "utf8");
  const call = src.match(/buildDirectorBrief\(\{([\s\S]*?)\n\s*\}\)/)?.[1];
  expect(call).toMatch(/beats:\s*beatsForSeconds\(/);
  // …und die Sekundenzahl im Zuschnitt muss dieselbe sein, die auch im Brief
  // steht und bei fal.ai bestellt wird. Zwei verschiedene Zahlen hier hiessen:
  // der Regisseur rechnet mit einer Länge, gerendert wird eine andere.
  const secs = call.match(/beats:\s*beatsForSeconds\([^,]+,\s*(\w+)\)/)?.[1];
  expect(secs).toBeTruthy();
  expect(call).toMatch(new RegExp(`seconds:\\s*${secs}\\b`));
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

/* Die vier Stellen, an denen CINEDANCE die eigentliche Arbeit leistet und
 * die Destillation vom 18.08. nur andeutete. Reine Textprüfung, aber sie
 * schlägt an, wenn jemand beim Umformulieren eine davon verliert. */
test("DIRECTOR_FULL carries the four CINEDANCE locks the distillation had dropped", () => {
  // Geographie VOR dem Blocking — ohne Bezugspunkt sind Meterangaben Behauptungen.
  expect(DIRECTOR_FULL).toContain("LOCATION MAP");
  // Der Satz, der das Gesicht hält.
  expect(DIRECTOR_FULL).toMatch(/matches its reference exactly/i);
  // Eine Brennweite zu WÄHLEN heißt nicht, sie zu HALTEN.
  expect(DIRECTOR_FULL).toMatch(/never from changing the lens/i);
  // „Enthält die Figuren" ist schwächer als der Ausschluss des Establishers.
  expect(DIRECTOR_FULL).toMatch(/no empty establishing frame/i);
});

test("both briefs ask for the style anchor without letting it override control", () => {
  for (const d of [DIRECTOR_MOTION, DIRECTOR_FULL]) {
    expect(d).toMatch(/style anchor/i);
    expect(d).toMatch(/never let it override/i);
  }
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
