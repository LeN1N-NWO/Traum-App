import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { buildReferences } from "./promptBuilder.js";

/* Die Garderobe ist eine KETTE über fünf Dateien, und jedes Glied ist für
   sich stumm, wenn es fehlt:

     server.js  ANALYSIS_SYSTEM   → das Modell soll „wearing" liefern
     server.js  Auswertung        → das Feld muss den Filter überleben
     server.js  addPerson         → die Stimme soll es melden dürfen
     server.js  Briefing          → sie muss auch danach fragen
     VoiceInterview.jsx           → es muss ankommen
     useWizard.js                 → es muss `wardrobe` heißen
     promptBuilder.js             → es muss im Prompt landen

   Fehlt EIN Glied, passiert genau nichts Sichtbares: Die App läuft, die
   Bilder kommen, und jede Figur trägt weiter das, was ihr Bogen zeigt.
   Es gibt keinen Fehler, den man suchen könnte — deshalb dieser Test.

   ⚠ Das ist der Grund, warum das Feld einen Tag lang unbenutzt herumlag:
   `wardrobe` existierte in buildReferences() und war bezahlt bewiesen
   (36 von 36 Kacheln zogen um), aber gefragt hat danach nichts. */

const server = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
const voice = readFileSync(new URL("../wizard/VoiceInterview.jsx", import.meta.url), "utf8");
const wizard = readFileSync(new URL("../wizard/useWizard.js", import.meta.url), "utf8");

test("die Analyse wird nach der Kleidung gefragt", () => {
  expect(server).toMatch(/"wearing": string/);
  expect(server).toMatch(/Rules for "wearing"/);
});

test("das Feld ueberlebt die Auswertung der Analyse", () => {
  const parse = server.match(/const people = \(Array\.isArray\(parsed\.people\)[\s\S]*?\.filter\(dedupePeople/)?.[0] || "";
  expect(parse).toMatch(/wearing: sanitizeFragment\(p\.wearing/);
});

test("die Stimme darf es melden und wird angewiesen, danach zu fragen", () => {
  const tool = server.match(/name: "addPerson"[\s\S]*?required: \["name", "kind"\]/)?.[0] || "";
  expect(tool).toMatch(/wearing:/);
  const briefing = server.match(/function voiceSystem\(([\s\S]*?)\n\}/)?.[1] || server;
  expect(briefing).toMatch(/wearing/);
  expect(briefing).toMatch(/ask ONCE/);
});

test("es kommt im Wizard an und heisst dort wardrobe", () => {
  expect(voice).toMatch(/wearing: args\.wearing/);
  expect(wizard).toMatch(/item\?\.wearing/);
  expect(wizard).toMatch(/wardrobe/);
});

/* Das Ende der Kette: der Satz im Prompt. Er MUSS sagen, dass er das
   Referenzbild schlägt — ohne das gewinnt das Bild, weil ein Modell eher
   glaubt, was es sieht, als was es liest (gemessen 23.08.). */
test("der Prompt zieht die Garderobe dem Referenzbild vor", () => {
  const { clauses } = buildReferences([{
    name: "Anton", kind: "person", wardrobe: "a soaked grey coat",
    avatar: { tag: "anton", img: "x", desc: "mid-30s" },
  }]);
  const satz = clauses.join(" ");
  expect(satz).toContain("a soaked grey coat");
  expect(satz).toMatch(/overrides the clothing visible in the reference image/);
  // Und er nennt zuerst, was BLEIBT — sonst liest sich „trägt etwas
  // anderes" wie „ist jemand anderes".
  expect(satz).toMatch(/keep the face, hair and build/);
});

test("ohne Garderobe steht auch kein Satz darueber", () => {
  const { clauses } = buildReferences([{
    name: "Anton", kind: "person", avatar: { tag: "anton", img: "x", desc: "mid-30s" },
  }]);
  expect(clauses.join(" ")).not.toMatch(/wearing/i);
});

/* ⚠ Die Verwechslung, die diese Trennung überhaupt nötig macht: `desc`
   gehört der Person für immer, `wardrobe` diesem einen Traum. Wer beides
   in ein Feld wirft, trägt die Badehose aus Traum 1 bis in Traum 40. */
test("Aussehen und Garderobe bleiben zwei Felder", () => {
  const { clauses } = buildReferences([{
    name: "Anton", kind: "person", wardrobe: "a tuxedo",
    avatar: { tag: "anton", img: "x", desc: "mid-30s, dark hair" },
  }]);
  const satz = clauses.join(" ");
  expect(satz).toContain("mid-30s, dark hair");
  expect(satz).toContain("a tuxedo");
  expect(satz.indexOf("mid-30s")).toBeLessThan(satz.indexOf("a tuxedo"));
});
