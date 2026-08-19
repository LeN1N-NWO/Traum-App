import { test, expect } from "bun:test";
import { beatsForCount } from "./beats.js";

const five = ["one", "two", "three", "four", "five"];

test("five beats pass through unchanged", () => {
  expect(beatsForCount(five, 5)).toEqual(five);
});

test("three images take first, middle and last", () => {
  expect(beatsForCount(five, 3)).toEqual(["one", "three", "five"]);
});

test("ten images split every beat in two", () => {
  const out = beatsForCount(five, 10);
  expect(out).toHaveLength(10);
  expect(out[0]).toContain("one");
  expect(out[1]).toContain("one");
  expect(out[9]).toContain("five");
});

test("fewer than five beats are stretched, not dropped", () => {
  const out = beatsForCount(["a", "b"], 5);
  expect(out).toHaveLength(5);
  expect(new Set(out)).toEqual(new Set(["a", "b"]));
});

test("empty input yields nothing rather than throwing", () => {
  expect(beatsForCount([], 5)).toEqual([]);
  expect(beatsForCount(null, 5)).toEqual([]);
});

test("blank strings are ignored", () => {
  expect(beatsForCount(["a", "   ", "b"], 3)).toHaveLength(3);
});

/* Der Bogen und die Filmlänge.
 *
 * Für eine Bildstrecke sind fünf Szenen immer richtig — jedes Bild wird
 * beliebig lange betrachtet. Ein Film hat diese Freiheit nicht: Bis
 * 19.08.2026 bekam der Regisseur fünf Szenen auch für einen Fünf-Sekünder,
 * also eine Sekunde je Szene. */
import { beatsForSeconds } from "./beats.js";

const ARC = ["waiting", "rabbits", "alligator", "running", "takeoff"];

test("a short film gets fewer beats, a long one keeps all five", () => {
  expect(beatsForSeconds(ARC, 5).length).toBe(2);   // 5/3 = 1 → Untergrenze 2
  expect(beatsForSeconds(ARC, 9).length).toBe(3);
  expect(beatsForSeconds(ARC, 15).length).toBe(5);
  expect(beatsForSeconds(ARC, 30).length).toBe(5);  // mehr Zeit je Szene, nicht mehr Szenen
});

test("the first and last beat always survive the cut", () => {
  // Der Anfang setzt den Ort, das Ende löst auf. Ein Film ohne Ankunft ist
  // schlimmer als einer, dem eine Zwischenstufe fehlt.
  for (const s of [5, 6, 9, 12, 15, 30]) {
    const got = beatsForSeconds(ARC, s);
    expect(got[0]).toBe("waiting");
    expect(got[got.length - 1]).toBe("takeoff");
  }
});

test("three beats out of five pick the same ones as the image path", () => {
  // Bildstrecke und Film sollen nicht verschiedene Geschichten erzählen.
  expect(beatsForSeconds(ARC, 9)).toEqual(beatsForCount(ARC, 3));
});

test("no beat is ever repeated when shortening", () => {
  for (const s of [5, 6, 7, 8, 9, 10, 12, 15, 20, 30]) {
    const got = beatsForSeconds(ARC, s);
    expect(new Set(got).size).toBe(got.length);
  }
});

test("garbage in, empty out — never a crash", () => {
  expect(beatsForSeconds([], 10)).toEqual([]);
  expect(beatsForSeconds(null, 10)).toEqual([]);
  expect(beatsForSeconds(ARC, 0).length).toBe(2);
  expect(beatsForSeconds(ARC, undefined).length).toBe(2);
  // Weniger Szenen als Plätze: nimm, was da ist.
  expect(beatsForSeconds(["only one"], 30)).toEqual(["only one"]);
});

/* ⚠ Der Geld-Bug vom 19.08.: beatsForCount kannte nur 3/5/10, jeder andere
   Wert fiel auf „alle fünf" durch. Das Poster ERSETZT aber das erste Bild
   (Step5: sceneCount = count - 1) — „3 Bilder mit Poster" bestellte also
   beatsForCount(_, 2), bekam 5 Szenen, und renderte 1 Poster + 5 Szenen =
   6 bezahlte Generierungen bei 3 kassierten Credits. */
test("every count means what it says — the poster money bug stays dead", () => {
  expect(beatsForCount(ARC, 2).length).toBe(2);   // 3 Bilder mit Poster
  expect(beatsForCount(ARC, 4).length).toBe(4);   // 5 Bilder mit Poster
  expect(beatsForCount(ARC, 9).length).toBe(9);   // 10 Bilder mit Poster
  // Erzählregel auch hier: Anfang und Auflösung überleben jede Verdichtung.
  expect(beatsForCount(ARC, 2)).toEqual(["waiting", "takeoff"]);
  expect(beatsForCount(ARC, 4)[0]).toBe("waiting");
  expect(beatsForCount(ARC, 4)[3]).toBe("takeoff");
});

/* Die Storyboard-Zuordnung: welches gespeicherte Bild zeigt Beat i?
   null ist eine absichtliche Antwort („Textkachel, nicht raten") — eine
   falsche Zuordnung legte das Alligator-Bild auf die Abflug-Szene, dieselbe
   Fehlerklasse wie der Gesichtertausch im promptBuilder, eine Ebene höher. */
import { imageIndexForBeat, beatOfSceneImage } from "./beats.js";

test("5 scene images map 1:1, a poster shifts everything by one", () => {
  for (let b = 0; b < 5; b++) {
    expect(imageIndexForBeat(b, { imageCount: 5, poster: false, urlCount: 5 })).toBe(b);
    expect(imageIndexForBeat(b, { imageCount: 6, poster: true, urlCount: 6 })).toBe(b + 1);
  }
});

test("3 images cover beats 1/3/5; the beats between get text tiles", () => {
  const p = { imageCount: 3, poster: false, urlCount: 3 };
  expect(imageIndexForBeat(0, p)).toBe(0);
  expect(imageIndexForBeat(2, p)).toBe(1);
  expect(imageIndexForBeat(4, p)).toBe(2);
  expect(imageIndexForBeat(1, p)).toBe(null);
  expect(imageIndexForBeat(3, p)).toBe(null);
});

test("10 images: each beat answers with the FIRST of its two moments", () => {
  const p = { imageCount: 10, poster: false, urlCount: 10 };
  expect(imageIndexForBeat(0, p)).toBe(0);
  expect(imageIndexForBeat(1, p)).toBe(2);
  expect(imageIndexForBeat(4, p)).toBe(8);
});

test("unknown poster truth or a shape mismatch answers null, never a guess", () => {
  // Einträge von vor dem 19.08. tragen kein poster-Feld — und es ist NICHT
  // rekonstruierbar (ein Preview-Eintrag hat auch Titel + 3 urls, aber
  // Panel 1 ist eine Szene, kein Plakat).
  expect(imageIndexForBeat(0, { imageCount: 5, poster: undefined, urlCount: 5 })).toBe(null);
  // Film-first: bestellt 5, gespeichert 0 urls.
  expect(imageIndexForBeat(0, { imageCount: 5, poster: false, urlCount: 0 })).toBe(null);
  // Halb gescheiterter Render: 5 bestellt, 4 angekommen.
  expect(imageIndexForBeat(0, { imageCount: 5, poster: false, urlCount: 4 })).toBe(null);
});

test("mapping and generation share one formula and cannot disagree", () => {
  // Für jede Szenenzahl: Bild j entstand aus Beat beatOfSceneImage(j, n) —
  // geprüft gegen die tatsächliche beatsForCount-Ausgabe.
  for (const n of [2, 3, 4, 5]) {
    const scenes = beatsForCount(ARC, n);
    for (let j = 0; j < n; j++) {
      expect(scenes[j]).toBe(ARC[beatOfSceneImage(j, n)]);
    }
  }
  // Über 5: Bild j ist ein Moment VON Beat beatOfSceneImage(j, n).
  for (const n of [9, 10]) {
    const scenes = beatsForCount(ARC, n);
    for (let j = 0; j < n; j++) {
      expect(scenes[j].startsWith(ARC[beatOfSceneImage(j, n)])).toBe(true);
    }
  }
});
