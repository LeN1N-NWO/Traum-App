import { test, expect } from "bun:test";
import { toRow, fromRow, safeReferences, safeMedia } from "./dreamRow.js";
import { backupEntry } from "./journalBackup.js";

/* ── ⚠⚠ Die Tests, um die es hier wirklich geht ───────────────────────────
   Referenzfotos sind biometrische Daten, teils von anderen Menschen. Das
   Schema sagt „never the pictures behind them" — diese vier Tests sind der
   Teil davon, der etwas aufhält. */

test("a reference keeps its tag and category and loses everything else", () => {
  const refs = safeReferences([
    { tag: "@Anna", category: "person", image: "data:image/png;base64,AAAA", dataUrl: "…", photo: {} },
  ]);
  expect(refs).toEqual([{ tag: "@Anna", category: "person" }]);
  expect(JSON.stringify(refs)).not.toContain("base64");
});

test("a photo disguised as a media path does not get through", () => {
  const media = safeMedia({
    bilder: ["/media/abc.png", "data:image/png;base64,AAAA", "  DATA:image/jpeg;base64,BBBB"],
    film: ["/media/film.mp4"],
  });
  expect(media.bilder).toEqual(["/media/abc.png"]);
  expect(media.film).toEqual(["/media/film.mp4"]);
});

test("references that are not references are dropped, not stored as junk", () => {
  expect(safeReferences(null)).toEqual([]);
  expect(safeReferences("nope")).toEqual([]);
  expect(safeReferences([null, 42, {}, { category: "person" }])).toEqual([]);
});

test("unbounded input is bounded before it reaches a column", () => {
  const row = toRow({
    id: "x".repeat(500),
    title: "t".repeat(5000),
    text: "d".repeat(50_000),
    references: Array.from({ length: 100 }, (_, i) => ({ tag: `@p${i}`, category: "person" })),
    medien: { bilder: Array.from({ length: 500 }, (_, i) => `/media/${i}.png`) },
  });
  expect(row.client_id.length).toBe(128);
  expect(row.title.length).toBe(500);
  expect(row.text.length).toBe(20_000);
  expect(row.references.length).toBe(24);
  expect(row.media.bilder.length).toBe(64);
});

/* ── client_id: der Schlüssel, an dem die Wiederholbarkeit hängt ────────── */

test("without the client's own id there is no row", () => {
  // unique (user_id, client_id) ist das, was ein zweites Hochladen
  // desselben Tagebuchs zu einer Aktualisierung statt zu Dubletten macht.
  for (const bad of [undefined, null, {}, { id: "" }, { id: "   " }, { id: 42 }]) {
    expect(toRow(bad)).toBe(null);
  }
  expect(toRow({ id: "e_abc" }).client_id).toBe("e_abc");
});

/* ── Die Feldliste ist dieselbe wie die der Dateisicherung ─────────────── */

test("what backupEntry() produces is exactly what toRow() understands", () => {
  const eintrag = {
    id: "e_mtvpt7c4qiu4mq",
    createdAt: "2026-09-12T21:30:00.000Z",
    editedAt: "2026-09-12T22:00:00.000Z",
    kind: "dream", title: "Der Fuchs", tagline: "Ein Waldweg",
    text: "Ich lief durch den Wald.", originalText: "ich lief durch den wald",
    analysis: { symbols: ["Wald"] }, reflection: { note: "ruhig" },
    style: "ultrareal", format: "9:16", mode: "film",
    imageCount: 3, creatureId: "fuchs",
    references: [{ tag: "@Anna", category: "person", bild: "data:image/png;base64,AAAA" }],
    media: { urls: ["/media/a.png"] },
    film: { urls: ["/media/a.mp4"] },
    sceneImages: ["/media/s1.png"],
  };
  const row = toRow(backupEntry(eintrag));

  expect(row.client_id).toBe("e_mtvpt7c4qiu4mq");
  expect(row.original_text).toBe("ich lief durch den wald");
  expect(row.image_count).toBe(3);
  expect(row.creature_id).toBe("fuchs");
  expect(row.created_at).toBe("2026-09-12T21:30:00.000Z");
  expect(row.edited_at).toBe("2026-09-12T22:00:00.000Z");
  expect(row.references).toEqual([{ tag: "@Anna", category: "person" }]);
  expect(row.media).toEqual({ bilder: ["/media/a.png"], film: ["/media/a.mp4"], szenen: ["/media/s1.png"] });
});

test("a dream survives the round trip with the field names it arrived with", () => {
  const traum = backupEntry({
    id: "e_abc", createdAt: "2026-09-12T21:30:00.000Z",
    title: "Der Fuchs", text: "Ich lief.", imageCount: 2,
    references: [{ tag: "@Anna", category: "person" }],
    media: { urls: ["/media/a.png"] },
  });
  const zurueck = fromRow({ ...toRow(traum), created_at: new Date(traum.createdAt) });
  expect(zurueck.id).toBe("e_abc");
  expect(zurueck.title).toBe("Der Fuchs");
  expect(zurueck.imageCount).toBe(2);
  expect(zurueck.references).toEqual([{ tag: "@Anna", category: "person" }]);
  expect(zurueck.medien.bilder).toEqual(["/media/a.png"]);
});

/* ── Kleinkram, der sonst still falsch wird ─────────────────────────────── */

test("an unreadable date is 'unknown', not a crash and not 1970", () => {
  expect(toRow({ id: "e_1", createdAt: "gestern" }).created_at).toBe(null);
  expect(toRow({ id: "e_1" }).created_at).toBe(null);
  expect(toRow({ id: "e_1", createdAt: "2026-09-12T21:30:00.000Z" }).created_at).toBe("2026-09-12T21:30:00.000Z");
});

test("a huge analysis is left out rather than stored half", () => {
  const riesig = { text: "x".repeat(70_000) };
  expect(toRow({ id: "e_1", analysis: riesig }).analysis).toBe(null);
  expect(toRow({ id: "e_1", analysis: { ok: true } }).analysis).toEqual({ ok: true });
});

test("imageCount takes whole numbers only", () => {
  expect(toRow({ id: "e_1", imageCount: 3 }).image_count).toBe(3);
  expect(toRow({ id: "e_1", imageCount: -1 }).image_count).toBe(null);
  expect(toRow({ id: "e_1", imageCount: 2.5 }).image_count).toBe(null);
  expect(toRow({ id: "e_1", imageCount: "3" }).image_count).toBe(null);
});
