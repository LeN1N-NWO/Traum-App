import { test, expect } from "bun:test";
import { parseLimit, encodeCursor, decodeCursor, buildPage, STANDARD_LIMIT, MAX_LIMIT } from "./paging.js";

const zeile = (t, id) => ({ created_at: t, client_id: id });

/* ── parseLimit: aus allem wird eine brauchbare Zahl ───────────────────── */

test("a sensible limit passes through", () => {
  expect(parseLimit("25")).toBe(25);
  expect(parseLimit(25)).toBe(25);
});

test("nonsense falls back to the default instead of failing", () => {
  // Niemand tippt das ein — es kommt aus einem Fehler im Client, und dafür
  // ist eine leere Antwort schlechter als die erste Seite.
  for (const roh of [undefined, null, "", "viele", "0", "-5", "1e9999", {}, "abc"]) {
    expect(parseLimit(roh)).toBe(STANDARD_LIMIT);
  }
});

test("an enormous limit is capped, not refused", () => {
  expect(parseLimit("50000")).toBe(MAX_LIMIT);
  expect(parseLimit("201")).toBe(MAX_LIMIT);
  expect(parseLimit("200")).toBe(200);
});

/* ── Der Cursor ────────────────────────────────────────────────────────── */

test("a cursor survives the round trip", () => {
  const c = encodeCursor(zeile("2026-09-12T21:30:00.000Z", "e_abc"));
  expect(decodeCursor(c)).toEqual({ createdAt: "2026-09-12T21:30:00.000Z", clientId: "e_abc" });
});

test("a Date from the driver works as well as a string", () => {
  const c = encodeCursor(zeile(new Date("2026-09-12T21:30:00.000Z"), "e_abc"));
  expect(decodeCursor(c).createdAt).toBe("2026-09-12T21:30:00.000Z");
});

/* ⚠ Der Grund, warum der Cursor ZWEI Werte trägt: Zwei Träume in derselben
   Nacht können denselben Zeitstempel haben. Ein Cursor nur auf der Zeit
   verlöre einen davon — lautlos. */
test("two dreams at the same instant get different cursors", () => {
  const a = encodeCursor(zeile("2026-09-12T21:30:00.000Z", "e_eins"));
  const b = encodeCursor(zeile("2026-09-12T21:30:00.000Z", "e_zwei"));
  expect(a).not.toBe(b);
  expect(decodeCursor(a).clientId).toBe("e_eins");
  expect(decodeCursor(b).clientId).toBe("e_zwei");
});

test("a row that cannot be a bookmark yields no cursor", () => {
  expect(encodeCursor(null)).toBe(null);
  expect(encodeCursor({ client_id: "e_abc" })).toBe(null);
  expect(encodeCursor({ created_at: "2026-09-12T21:30:00.000Z" })).toBe(null);
});

/* Der Cursor kommt über das Netz zurück — also ist er Eingabe, auch wenn
   wir ihn selbst geschrieben haben. */
test("a damaged cursor is 'no cursor', not a database error later", () => {
  for (const bad of [undefined, null, 42, "", "nicht-base64!!", "x".repeat(600),
                     Buffer.from("ohne-trenner").toString("base64url"),
                     Buffer.from("|nur-id").toString("base64url"),
                     Buffer.from("gestern|e_abc").toString("base64url"),
                     Buffer.from(`2026-09-12T21:30:00.000Z|${"x".repeat(200)}`).toString("base64url")]) {
    expect(decodeCursor(bad)).toBe(null);
  }
});

/* ── buildPage: die eine Zeile mehr ────────────────────────────────────── */

test("a full page hands back a cursor to continue from", () => {
  // Der Aufrufer liest limit+1: hier drei Zeilen bei limit 2.
  const { seite, next } = buildPage(
    [zeile("2026-09-12T23:00:00.000Z", "e_1"),
     zeile("2026-09-12T22:00:00.000Z", "e_2"),
     zeile("2026-09-12T21:00:00.000Z", "e_3")], 2);
  expect(seite.map((z) => z.client_id)).toEqual(["e_1", "e_2"]);
  expect(decodeCursor(next)).toEqual({ createdAt: "2026-09-12T22:00:00.000Z", clientId: "e_2" });
});

/* Ein Cursor auf eine leere Seite lädt zu einer überflüssigen Anfrage ein —
   und lässt den Client glauben, es käme noch etwas. */
test("the last page says so by having no cursor", () => {
  expect(buildPage([zeile("2026-09-12T23:00:00.000Z", "e_1")], 2).next).toBe(null);
  expect(buildPage([], 2)).toEqual({ seite: [], next: null });
});

test("exactly limit rows is the last page, not a page with a dead end", () => {
  // Genau `limit` Zeilen heißt: es wurde keine (limit+1)-te gefunden.
  const { seite, next } = buildPage([zeile("2026-09-12T23:00:00.000Z", "e_1"),
                                     zeile("2026-09-12T22:00:00.000Z", "e_2")], 2);
  expect(seite.length).toBe(2);
  expect(next).toBe(null);
});
