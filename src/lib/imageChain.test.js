import { test, expect } from "bun:test";
import { chainRemaining, chainStep, chainFingerprint, buildChainSubmission } from "./imageChain.js";

/* Die Bildkette läuft im Hintergrund, unbeaufsichtigt und bezahlt — jede
   Regel hier bewacht echtes Geld oder eine Strecke, die sonst still
   stehen bliebe oder doppelt einreichte. */

const kette = (over = {}) => ({
  id: "e1", text: "Ich schwamm im Fluss.",
  style: "dreamlike", format: "9:16", references: [],
  analysis: { beats: ["a", "b", "c", "d", "e"] },
  chain: { next: 1, total: 3, beats: ["Szene A", "Szene B", "Szene C"] },
  imageJobs: [{ id: "j1", url: "/media/a.png" }],
  ...over,
});

test("fällig ist der nächste Schritt erst, wenn der Vorgänger entschieden ist", () => {
  expect(chainStep(kette())).toEqual({ beatIndex: 1, sequenceRef: "/media/a.png", step: 1 });
  // Vorgänger rendert noch: warten — genau das ist der Sinn der Kette.
  expect(chainStep(kette({ imageJobs: [{ id: "j1" }] }))).toBe(null);
});

/* ⚠ Der Doppel-Einreich-Schutz: Ist Szene 2 schon eingereicht (jobs.length
   === next+1), darf der Läufer sie nicht noch einmal schicken — das wäre
   ein zweiter bezahlter Auftrag für dieselbe Szene. */
test("eine bereits eingereichte Szene wird nie doppelt eingereicht", () => {
  expect(chainStep(kette({
    imageJobs: [{ id: "j1", url: "/media/a.png" }, { id: "j2" }],
    chain: { next: 2, total: 3, beats: ["A", "B", "C"] },
  }))).toEqual(null);   // j2 noch offen
  expect(chainStep(kette({
    imageJobs: [{ id: "j1", url: "/media/a.png" }, { id: "j2" }],
  }))).toBe(null);      // next=1, aber 2 Jobs: Einreichung läuft schon
});

test("eine gescheiterte Szene bricht die Kette nicht — der Anker rückt zurück", () => {
  const s = chainStep(kette({
    imageJobs: [{ id: "j1", url: "/media/a.png" }, { id: "j2", failed: true }],
    chain: { next: 2, total: 3, beats: ["A", "B", "C"] },
  }));
  expect(s).toEqual({ beatIndex: 2, sequenceRef: "/media/a.png", step: 1 });
});

test("scheitert sogar die erste Szene, läuft die Kette ohne Anker weiter", () => {
  const s = chainStep(kette({ imageJobs: [{ id: "j1", failed: true }] }));
  expect(s).toEqual({ beatIndex: 1, sequenceRef: null, step: 1 });
});

test("eine fertige oder fehlende Kette ist nie fällig", () => {
  expect(chainRemaining(kette({ chain: { next: 3, total: 3, beats: ["A", "B", "C"] } }))).toBe(false);
  expect(chainRemaining(kette({ chain: undefined }))).toBe(false);
  expect(chainStep({ id: "x" })).toBe(null);
});

/* Die Szene kommt aus der KETTE, nicht aus der Analyse: Wer 3 von 5
   bestellt, rendert eine Auswahl — analysis.beats[1] wäre die falsche. */
test("die Kette rendert ihre eigene Szenenliste, nicht die der Analyse", () => {
  const sub = buildChainSubmission(kette(), {});
  expect(sub.prompt).toContain("Szene B");
  expect(sub.prompt).not.toContain(": b\n");
  expect(sub.prompt).toContain("image 2 of 3");
});

test("mit Anker trägt der Prompt die Weltanker-Klausel, ohne nicht", () => {
  const mit = buildChainSubmission(kette(), {});
  expect(mit.sequenceRef).toBe("/media/a.png");
  expect(mit.prompt).toContain("The LAST reference image is the previous frame");
  /* ⚠ Antons Befund 22.08.: „das sieht aus wie Photoshop, wenn die Person
     aus dem Bild davor übernommen worden ist." Der Anker darf Welt und
     Garderobe vorgeben, aber die Figur muss für JEDE Szene neu gestellt und
     neu ausgeleuchtet werden — sonst wird aus einem Film eine Montage. */
  expect(mit.prompt).toContain("never cut out, paste");
  expect(mit.prompt).toContain("re-photographed from scratch");
  const ohne = buildChainSubmission(kette({ imageJobs: [{ id: "j1", failed: true }] }), {});
  expect(ohne.prompt).not.toContain("previous frame");
});

test("die Besetzung wird aus Referenzen und Bibliothek rekonstruiert", () => {
  const sub = buildChainSubmission(
    kette({ references: [{ tag: "Mara", category: "person" }] }),
    { cast: [{ id: "c1", tag: "Mara", img: "data:image/png;base64,AAA", desc: "" }] },
  );
  expect(sub.cast).toHaveLength(1);
  expect(sub.cast[0].tag).toBe("Mara");
  // Der Anker ersetzt keine Besetzung: beide Bindungen stehen im Prompt.
  expect(sub.prompt).toContain("@Mara");
  expect(sub.prompt).toContain("previous frame");
});

test("der Fingerabdruck nennt nur fällige Ketten", () => {
  expect(chainFingerprint([kette(), { id: "e2" }])).toBe("e1:1");
  expect(chainFingerprint([kette({ imageJobs: [{ id: "j1" }] })])).toBe("");
});


/* ── Der Rasterweg (24.08.2026) ───────────────────────────────────────────
   Ein Auftrag traegt jetzt VIER Szenen. `chain.next` zaehlt weiter Szenen,
   `chain.step` sagt, wie viele auf einen Auftrag gehen. Die Tests hier
   bewachen die drei Stellen, an denen ein Rechenfehler bezahlte Auftraege
   kostet: doppelt einreichen, zu frueh einreichen, falsch ankern. */

const raster = (over = {}) => ({
  id: "e1", text: "T", style: "ultrareal", format: "9:16", references: [],
  chain: { next: 4, total: 8, step: 4, beats: ["A", "B", "C", "D", "E", "F", "G", "H"] },
  /* ⚠ Der Schnitt haengt am AUFTRAG, nicht am Traum: `tileUrls`. Bei acht
     Szenen schreibt der Collector `media.urls` erst am ENDE — haette der
     Anker dort gestanden, haette Raster 2 nie eine Kachel gefunden. */
  imageJobs: [{
    id: "g1", url: "/media/raster1.png", tiles: 4,
    tileUrls: ["/media/t1.png", "/media/t2.png", "/media/t3.png", "/media/t4.png"],
  }],
  ...over,
});

test("beim Raster ist EIN Auftrag fuer vier Szenen genug", () => {
  const s = chainStep(raster());
  expect(s.beatIndex).toBe(4);
  expect(s.step).toBe(4);
  // ⚠ Der Anker ist die LETZTE KACHEL, nicht das ganze Rasterbild.
  expect(s.sequenceRef).toBe("/media/t4.png");
});

/* ⚠ Der teuerste Fehler, den es hier geben koennte: den zweiten Block
   einreichen, BEVOR der erste geschnitten ist. Der Anker waere dann ein
   Bild mit vier Szenen darin — das Modell baut ein Raster im Raster, und
   bezahlt ist es trotzdem. */
test("die Kette wartet auf den SCHNITT, nicht nur auf das Bild", () => {
  expect(chainStep(raster({
    imageJobs: [{ id: "g1", url: "/media/raster1.png", tiles: 4 }],   // ungeschnitten
  }))).toBe(null);
});

test("vier Szenen sind mit EINEM Rasterauftrag fertig — nichts steht mehr aus", () => {
  expect(chainRemaining(raster({
    chain: { next: 4, total: 4, step: 4, beats: ["A", "B", "C", "D"] },
  }))).toBe(false);
});

test("der Rasterauftrag traegt VIER Szenentexte, nicht einen", () => {
  const sub = buildChainSubmission(raster(), { cast: [], me: null });
  expect(sub.tiles).toBe(4);
  for (const b of ["E", "F", "G", "H"]) expect(sub.prompt).toContain(b);
  // Und es ist wirklich ein RASTER-Prompt, kein Einzelbild-Prompt.
  expect(sub.prompt.toLowerCase()).toContain("grid");
});

/* ⚠ Alte Eintraege, die beim Umstellen noch offen im Journal lagen, haben
   kein `step`. Sie muessen sich exakt wie vorher verhalten — sonst rechnet
   der Laeufer ihre Auftragszahl falsch und reicht doppelt ein. */
test("ohne `step` bleibt alles beim Alten", () => {
  const s = chainStep(kette());
  expect(s.step).toBe(1);
  expect(s.beatIndex).toBe(1);
});
