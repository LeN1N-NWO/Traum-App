import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { STYLES, styleById, photorealFor, featuredStyles, moreStyles, filmStyleAnchor } from "./styles.js";
import { buildGridPrompt, buildImagePrompt, buildReferences } from "./promptBuilder.js";
import { PHOTOREAL } from "./cinematography.js";
import en from "../i18n/en.js";
import de from "../i18n/de.js";

/* Die Stilbibliothek ist eine Tabelle, und Tabellen gehen auf drei Arten
   still kaputt: ein Eintrag ohne Text, zwei Einträge mit derselben ID, und
   ein Eintrag, den die Sprachdateien nicht kennen — dann steht englisch
   „Puppet Theatre" in der deutschen App, und niemand merkt es, weil es
   ja ein Wort ist. */

test("jeder Stil hat ID, Name, Emoji und einen Prompt", () => {
  for (const s of STYLES) {
    expect(s.id).toMatch(/^[a-z0-9]+$/);
    expect(s.label.length).toBeGreaterThan(0);
    expect(s.emoji.length).toBeGreaterThan(0);
    expect(s.prompt.length).toBeGreaterThan(80);
  }
});

test("keine ID doppelt", () => {
  const ids = STYLES.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("en und de kennen jeden Stil — Name UND Info", () => {
  for (const s of STYLES) {
    for (const [name, lang] of [["en", en], ["de", de]]) {
      const eintrag = lang.styles.byId[s.id];
      expect(eintrag, `${name}: ${s.id}`).toBeDefined();
      expect(eintrag.label.length, `${name}: ${s.id} label`).toBeGreaterThan(0);
      expect(eintrag.info.length, `${name}: ${s.id} info`).toBeGreaterThan(40);
    }
  }
});

/* Die erste Reihe: acht Stimmungs-Stile plus die zwei Handwerksstile, die
   am weitesten von ihnen weg liegen. „Top 10 oder so" (Anton, 08.09.). */
test("zehn Stile in der ersten Reihe, der Rest dahinter", () => {
  expect(featuredStyles().length).toBe(10);
  expect(featuredStyles().length + moreStyles().length).toBe(STYLES.length);
  expect(moreStyles().length).toBeGreaterThan(0);
});

/* Der Foto-Anker bestellt Poren. Jeder Stil, dessen Prompt ein Material
   nennt, das keine hat, MUSS ihn abgeschaltet haben — sonst widerspricht
   sich der Prompt, und ein widersprüchlicher Prompt ist schlechter als ein
   schweigender. Rot-Probe: `painterly` bei „clay" entfernt → rot. */
test("kein Handwerksstil bekommt den Foto-Anker", () => {
  const material = /gouache|ink-wash|rice paper|hand-painted|painterly|marker pen|felt-tip|clay|paper|marionette|plastic|screen-print|anime/i;
  for (const s of STYLES) {
    if (material.test(s.prompt)) {
      expect(photorealFor(s.id), `${s.id} nennt ein Material und hätte trotzdem den Anker`).toBe(false);
    }
  }
});

test("die Stimmungs-Stile, die Fotografie bestellen, behalten den Anker", () => {
  for (const id of ["ultrareal", "noir", "romantic", "dark", "nostalgic", "adventurous"]) {
    expect(photorealFor(id)).toBe(true);
  }
});

/* Bis zum 08.09. sagte JEDE Kachel „cinematic photoreal film still" —
   auch bei Knete. Rot-Probe: stillNoun() auf die alte Konstante
   zurückgesetzt → beide Tests rot. */
test("ein Handwerksstil bekommt keine photoreal-Kachel und keinen Anker", () => {
  const raster = buildGridPrompt({ beats: ["a", "b", "c", "d"], styleId: "clay", cols: 2, rows: 2 });
  expect(raster).not.toMatch(/photoreal/i);
  expect(raster).not.toContain(PHOTOREAL);
  expect(raster).toContain("modelling clay");
  const einzel = buildImagePrompt({ beat: "a", styleId: "clay", format: "9:16" });
  expect(einzel).not.toMatch(/photoreal/i);
});

test("ein fotografischer Stil bekommt beides weiterhin", () => {
  const raster = buildGridPrompt({ beats: ["a", "b", "c", "d"], styleId: "ultrareal", cols: 2, rows: 2 });
  expect(raster).toContain("cinematic photoreal film still");
  expect(raster).toContain(PHOTOREAL);
});

/* Die Bewegung gehört dem Film, nie dem Bild. Ein Raster, das „animate on
   twos" liest, ist ein verschwendeter Satz — der Regisseur braucht ihn. */
test("motion landet beim Regisseur, nicht im Raster", () => {
  const clay = styleById("clay");
  expect(clay.motion).toBeDefined();
  const raster = buildGridPrompt({ beats: ["a"], styleId: "clay", cols: 2, rows: 2 });
  expect(raster).not.toContain(clay.motion);
  expect(filmStyleAnchor("clay")).toContain(clay.motion);
  expect(filmStyleAnchor("clay")).toContain(clay.prompt);
  // Und ohne motion ist der Anker einfach der Prompt — kein "undefined".
  expect(filmStyleAnchor("ultrareal")).toBe(styleById("ultrareal").prompt);
});

/* Die Verdrahtung in server.js: Die Analyse rät nur aus der ersten Reihe,
   und die Liste ist ABGELEITET, nicht hingeschrieben — sie stand zweimal
   dort (Konstante und Schema-Kommentar) und wäre beim ersten neuen Stil
   auseinandergelaufen. Und der Regisseur bekommt Look UND Bewegung. */
const server = readFileSync(new URL("../../server.js", import.meta.url), "utf8");

test("server.js leitet die Rate-Liste ab und gibt dem Regisseur die Bewegung", () => {
  expect(server).toMatch(/const ANALYSIS_STYLES = featuredStyles\(\)/);
  expect(server).toMatch(/one of: \$\{ANALYSIS_STYLES\.join/);
  expect(server).not.toMatch(/one of: ultrareal, noir/);
  expect(server).toMatch(/filmStyleAnchor\(body\.styleId\)/);
});

/* ⚠ Der Geldfehler vom 08.09.: MAX_CRAFTED_PROMPT stand auf 3000, und jeder
   2×2-Rasterprompt war länger — der Server kappte still den Stil, den
   Foto-Anker und alle Referenzklauseln. Dieser Test bindet die Grenze an
   den SCHLIMMSTEN Fall: längster Stil, vier Szenen in voller Länge
   (MAX_BEAT), acht Referenzen (MAX_ANALYSIS_ITEMS) mit Garderobe.
   Rot-Probe: Grenze auf 3000 zurück → rot. */
test("kein Rasterprompt erreicht die Serverkappung", () => {
  const cap = Number(server.match(/const MAX_CRAFTED_PROMPT = (\d+)/)?.[1]);
  const fragment = Number(server.match(/const MAX_FRAGMENT = (\d+)/)?.[1]);
  const beat = Number(server.match(/const MAX_BEAT = (\d+)/)?.[1]);
  const items = Number(server.match(/const MAX_ANALYSIS_ITEMS = (\d+)/)?.[1]);
  expect(cap).toBeGreaterThan(0);
  expect(fragment).toBeGreaterThan(0);
  expect(beat).toBeGreaterThan(0);
  expect(items).toBeGreaterThan(0);

  // Seit 03.09. ist eine Szene bis MAX_BEAT lang (200), nicht MAX_FRAGMENT.
  const beats = Array(4).fill("x".repeat(beat));
  const cast = Array.from({ length: items }, (_, i) => ({
    name: `Person ${i}`, kind: "person", wardrobe: "w".repeat(fragment),
    avatar: { tag: `p${i}`, img: "x", desc: "d".repeat(fragment) },
  }));
  const { clauses } = buildReferences(cast);
  let laengster = 0;
  for (const s of STYLES) {
    const p = buildGridPrompt({ beats, styleId: s.id, clauses, cols: 2, rows: 2 });
    laengster = Math.max(laengster, p.length);
    expect(p.length, `${s.id}: ${p.length} > ${cap}`).toBeLessThan(cap);
  }
  // Und nicht nur knapp: ein Viertel Luft, damit der nächste Stil Platz hat.
  expect(laengster * 1.25).toBeLessThan(cap);
});
