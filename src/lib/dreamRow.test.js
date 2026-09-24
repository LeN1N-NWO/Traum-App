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

/* ⚠⚠ Der Test, der am 12.09.2026 gefehlt hat.
   Bun.SQL gibt jsonb-Spalten als ZEICHENKETTE zurück, nicht als geparsten
   Wert. Jeder Test ohne Datenbank reicht Objekte hinein und bekommt Objekte
   heraus — also fiel nichts auf, bis der Ende-zu-Ende-Lauf eine Referenzliste
   fand, die keine Liste mehr war. Hier steht die Zeile jetzt so, wie der
   Treiber sie wirklich liefert. */
test("a row as the driver really hands it over: jsonb arrives as text", () => {
  const zurueck = fromRow({
    client_id: "e_abc", kind: "dream", title: "T", text: "x", original_text: "",
    created_at: "2026-09-12T21:30:00.000Z",
    references: '[{"tag":"@Anna","category":"person"}]',
    media: '{"bilder":["/media/a.png"],"film":[]}',
    analysis: '{"symbols":["Wald"]}',
    reflection: '{"note":"ruhig"}',
  });
  expect(Array.isArray(zurueck.references)).toBe(true);
  expect(zurueck.references).toEqual([{ tag: "@Anna", category: "person" }]);
  expect(zurueck.medien.bilder).toEqual(["/media/a.png"]);
  expect(zurueck.analysis).toEqual({ symbols: ["Wald"] });
  expect(zurueck.reflection).toEqual({ note: "ruhig" });
});

test("a driver that hands over parsed values is fine too", () => {
  // Ein künftiges Bun kann das ändern — dann darf nichts doppelt geparst werden.
  const zurueck = fromRow({
    client_id: "e_abc", references: [{ tag: "@A", category: "person" }],
    media: { bilder: [], film: [] }, analysis: { a: 1 },
  });
  expect(zurueck.references).toEqual([{ tag: "@A", category: "person" }]);
  expect(zurueck.analysis).toEqual({ a: 1 });
});

test("an empty journal entry still comes back usable, not half-null", () => {
  const zurueck = fromRow({ client_id: "e_leer", references: null, media: null });
  expect(zurueck.references).toEqual([]);
  expect(zurueck.medien).toEqual({ bilder: [], film: [] });
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

/* Die Sprachaufnahme (23.09.): ein Pfad, genau einer, nie Daten. */
test("the voice recording travels as one path, never as data", () => {
  expect(safeMedia({ audio: ["/media/v.m4a", "/media/zweite.m4a"] }).audio).toEqual(["/media/v.m4a"]);
  expect(safeMedia({ audio: ["data:audio/m4a;base64,AAAA"] }).audio).toBe(undefined);
  expect("audio" in safeMedia({ bilder: [] })).toBe(false);
  const traum = backupEntry({ id: "e_v", createdAt: "2026-09-23T06:00:00.000Z", text: "x", audio: { url: "/media/v.m4a" } });
  expect(fromRow({ ...toRow(traum), created_at: new Date(traum.createdAt) }).medien.audio).toEqual(["/media/v.m4a"]);
});

/* ── Versiegelte Träume (24.09.2026) ──────────────────────────────────── */
import { toSealedRow, MAX_SEALED } from "./dreamRow.js";

test("a sealed dream keeps id, dates, block and key id — nothing else", () => {
  const r = toSealedRow({ id: "e_x", createdAt: "2026-09-24T06:00:00.000Z", editedAt: null,
    sealed: "QUJDRA==", keyId: "0123456789abcdef", text: "Klartext, der hier nichts verloren hat" });
  expect(r).toEqual({ client_id: "e_x", created_at: "2026-09-24T06:00:00.000Z", edited_at: null, sealed: "QUJDRA==", key_id: "0123456789abcdef" });
  expect("text" in r).toBe(false);
});

/* ⚠ Klartext wird nicht mehr angenommen — sonst schickte ein alter Client
   ihn weiter, und die Verschlüsselung wäre nur eine Behauptung. */
test("a plaintext dream is refused, not stored unencrypted", () => {
  expect(toSealedRow({ id: "e_x", createdAt: "2026-09-24T06:00:00.000Z", text: "Ich flog." })).toBe(null);
  expect(toSealedRow({ id: "e_x", sealed: "QUJDRA==" })).toBe(null);                          // ohne Kennung
  expect(toSealedRow({ id: "e_x", sealed: "QUJDRA==", keyId: "NICHT-HEX-0000000" })).toBe(null);
  expect(toSealedRow({ id: "e_x", sealed: "kein base64!", keyId: "0123456789abcdef" })).toBe(null);
  expect(toSealedRow({ id: "e_x", sealed: "A".repeat(MAX_SEALED + 4), keyId: "0123456789abcdef" })).toBe(null);
  expect(toSealedRow({ sealed: "QUJDRA==", keyId: "0123456789abcdef" })).toBe(null);          // ohne Id
});

test("a sealed row comes back with its block, a plaintext row without", () => {
  const sealedRow = { client_id: "e_s", created_at: new Date("2026-09-24T06:00:00Z"), edited_at: null, text: "", sealed: "QUJDRA==", key_id: "0123456789abcdef" };
  expect(fromRow(sealedRow)).toMatchObject({ id: "e_s", sealed: "QUJDRA==", keyId: "0123456789abcdef", text: "" });
  expect("sealed" in fromRow({ client_id: "e_p", created_at: "2026-09-24T06:00:00Z", text: "alt" })).toBe(false);
});
