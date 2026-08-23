import { test, expect } from "bun:test";
import { shotFor, shotClause, shotPlan, SHOTS } from "./cinematography.js";
import { STYLES } from "./styles.js";

test("das erste Bild etabliert — man muss wissen, wo man ist", () => {
  for (const n of [2, 4, 5, 8, 10]) {
    expect(shotFor(1, n).id).toBe("establish");
  }
});

test("eine Strecke wiederholt nicht dieselbe Einstellung hintereinander", () => {
  for (const n of [4, 5, 8, 10]) {
    const ids = shotPlan(n).map((s) => s.id);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).not.toBe(ids[i - 1]);
    }
  }
});

/* Der Befund vom 23.08.: vier Bilder, viermal dieselbe Aufnahme. Bei vier
   Szenen muss jede Einstellung genau einmal vorkommen — sonst ist es wieder
   ein Fotoshooting an vier Orten. */
test("vier Szenen ergeben vier VERSCHIEDENE Einstellungen", () => {
  const ids = shotPlan(4).map((s) => s.id);
  expect(new Set(ids).size).toBe(4);
});

test("acht Szenen decken jede Einstellung zweimal ab, gleichmaessig", () => {
  const ids = shotPlan(8).map((s) => s.id);
  for (const s of SHOTS) {
    expect(ids.filter((x) => x === s.id)).toHaveLength(2);
  }
});

test("ein einzelnes Bild bekommt keine etablierende Weite", () => {
  // Ein Einzelbild hat nichts zu etablieren — es IST die Szene.
  expect(shotFor(1, 1).id).toBe("medium");
});

test("derselbe Platz ergibt immer dieselbe Einstellung", () => {
  expect(shotFor(3, 5).id).toBe(shotFor(3, 5).id);
  expect(shotPlan(5).map((s) => s.id)).toEqual(shotPlan(5).map((s) => s.id));
});

/* ⚠ Der Kern der Arbeitsteilung. Diese Datei darf NICHTS ueber Optik sagen,
   weil die Stile es tun — und sich darin widersprechen ("dreamlike" 50 mm,
   "adventure" 24 mm, "noir" 35 mm). Zwei Brennweiten in einem Prompt sind
   schlechter als eine, denn dann waehlt das Modell. */
test("die Einstellung nennt kein Objektiv, keine Blende, keine Lichtfarbe", () => {
  /* Gemeint ist die ZAHL, nicht das Wort: „away from the lens" beschreibt
     einen Blick, keine Optik, und muss erlaubt bleiben. Verboten ist alles,
     was mit der Angabe eines Stils kollidieren KANN — eine Brennweite, eine
     Blende, eine Lichtfarbe, ein Filmkorn. */
  const verboten = [/\d+\s?mm/i, /\bT\d/i, /\bf\/\d/i, /\d+\s?K\b/, /tungsten/i, /daylight/i,
                    /focal/i, /aperture/i, /grain/i, /colou?r grade/i, /film stock/i];
  for (const n of [1, 4, 8]) {
    for (let i = 1; i <= n; i++) {
      const satz = shotClause(i, n);
      for (const muster of verboten) expect(satz).not.toMatch(muster);
    }
  }
});

test("die Stile nennen weiterhin ihre Optik — sonst haette niemand eine", () => {
  // Gegenprobe zum Test darueber: die Trennung ist nur sinnvoll, wenn die
  // andere Seite ihren Teil auch wirklich traegt.
  const mitOptik = STYLES.filter((s) => /\d+\s?mm/i.test(s.prompt));
  expect(mitOptik.length).toBeGreaterThan(0);
});

test("jeder Satz verbietet Mitte, Frontale und Plakat", () => {
  const satz = shotClause(2, 4);
  expect(satz).toContain("not centred");
  expect(satz).toContain("not a poster");
  expect(satz).toContain("does not look into the lens");
});
