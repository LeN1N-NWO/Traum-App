import { test, expect } from "bun:test";
import { packedSize, checkPackable, MAX_SIDE } from "./alphaPack.js";

test("die Packung verdoppelt die Hoehe, nie die Breite", () => {
  expect(packedSize(720, 1280)).toEqual({ width: 720, height: 2560 });
});

test("die ueblichen Hochkantmasse gehen durch", () => {
  for (const [w, h] of [[720, 1280], [1080, 1920], [576, 1024]]) {
    expect(checkPackable(w, h).ok).toBe(true);
  }
});

/* ⚠ Der Fall, um den es geht: 4K hochkant. ffmpeg schreibt die Datei
   klaglos, und erst auf einem fremden Telefon ist der Effekt eine schwarze
   Flaeche. Ohne diese Pruefung faende man das nie im Buero. */
test("4K hochkant faellt durch — und bekommt einen Vorschlag, kein blosses Nein", () => {
  const r = checkPackable(2160, 3840);
  expect(r.ok).toBe(false);
  expect(r.height).toBe(7680);
  expect(r.vorschlag.height * 2).toBeLessThanOrEqual(MAX_SIDE);
  expect(r.vorschlag.width).toBeLessThanOrEqual(MAX_SIDE);
});

/* H.264 in 4:2:0 kann keine ungeraden Kantenlaengen — ein Vorschlag mit
   1153 Pixeln waere ein Vorschlag, der beim Kodieren abbricht. */
test("der Vorschlag ist immer gerade", () => {
  for (const [w, h] of [[2160, 3840], [1999, 3333], [3000, 3000]]) {
    const v = checkPackable(w, h).vorschlag;
    if (!v) continue;
    expect(v.width % 2).toBe(0);
    expect(v.height % 2).toBe(0);
  }
});

test("das Seitenverhaeltnis ueberlebt den Vorschlag", () => {
  const v = checkPackable(2160, 3840).vorschlag;
  expect(Math.abs(v.width / v.height - 2160 / 3840)).toBeLessThan(0.01);
});
