import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { castName, castEntry, castPayload, castFingerprint, mergeCast } from "./castBackup.js";
import { backupEntry } from "./journalBackup.js";

/* ⚠ Diese Datei sichert ABSICHTLICH Fotos — Antons ausdrueckliche Anweisung
   vom 25.08.2026 fuer seine Testumgebung. Die Traum-Sicherung tut weiter
   das Gegenteil. Der erste Test haelt genau diese Trennung fest: Wer sie
   spaeter zusammenlegt, macht aus Antons Testkomfort ein Datenleck. */

const anton = {
  tag: "ich", id: "c1", name: "Anton", category: "person",
  desc: "kurze Haare, Dreitagebart", img: "data:image/jpeg;base64,AAA",
  img2: "data:image/jpeg;base64,BBB", sheet: "data:image/jpeg;base64,CCC",
  sheetOf: "k3f9", wardrobe: "roter Mantel",
};

test("die Figur wird MIT Fotos gesichert — das ist der ganze Zweck", () => {
  const g = castEntry(anton);
  expect(g.img).toBe(anton.img);
  expect(g.img2).toBe(anton.img2);
  expect(g.sheet).toBe(anton.sheet);
});

/* ⚠ Ohne `sheetOf` haelt die App den mitgesicherten Bogen fuer veraltet und
   rendert ihn beim ersten bezahlten Bild neu — die Sicherung haette dann
   nichts gespart, sondern nur Platz belegt. */
test("der Fingerabdruck des Bogens reist mit, sonst war alles umsonst", () => {
  expect(castEntry(anton).sheetOf).toBe("k3f9");
});

/* ⚠ Der Waechter ueber der Trennung: Die TRAUM-Sicherung darf weiterhin
   kein Foto tragen. Beide Dateien nebeneinander zu haben ist nur solange
   ungefaehrlich, wie ihre Regeln gegensaetzlich BLEIBEN. */
test("die Traum-Sicherung traegt weiterhin KEINE Fotos", () => {
  const traum = backupEntry({
    id: "e1", createdAt: "2026-08-25T00:00:00.000Z", text: "T",
    references: [{ tag: "ich", category: "person", img: "data:image/jpeg;base64,GEHEIM" }],
  });
  expect(JSON.stringify(traum)).not.toContain("GEHEIM");
});

/* ⚠ Und der zweite Waechter: Das Ziel liegt unter /media und damit
   ausserhalb von Git. Eine Datei kann man loeschen, einen Commit praktisch
   nicht — und die Gesichter gehoeren teils anderen Menschen. */
test("der Ordner liegt unter /media, also ausserhalb von Git", () => {
  const srv = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
  const zeile = srv.match(/^const CAST_DIR = .*$/m)?.[0] || "";
  expect(zeile).toContain("MEDIA_DIR");
  const ignore = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");
  expect(ignore).toMatch(/^\/media$/m);
});

test("der Dateiname kommt vom @tag und bleibt harmlos", () => {
  expect(castName(anton)).toBe("ich.json");
  expect(castName({ tag: "../../etc/passwd" })).toBe("etcpasswd.json");
  expect(castName({})).toBe("ohne-tag.json");
});

test("das eigene Portraet wird als solches markiert und kehrt dorthin zurueck", () => {
  const nutzlast = castPayload([{ tag: "lena", img: "d" }], anton);
  expect(nutzlast.find((x) => x.figur.tag === "ich").figur.self).toBe(true);
  expect(nutzlast.find((x) => x.figur.tag === "lena").figur.self).toBeUndefined();

  const res = mergeCast([], null, nutzlast.map((x) => x.figur));
  expect(res.me.tag).toBe("ich");
  expect(res.me.self).toBeUndefined();          // die Marke bleibt in der Sicherung
  expect(res.cast.map((c) => c.tag)).toEqual(["lena"]);
});

/* ⚠ Ergaenzen, nie ueberschreiben — dieselbe Regel wie bei den Traeumen.
   Wer eine Figur im Geraet geaendert hat, hat den neueren Stand. */
test("eine bekannte Figur wird nicht ueberschrieben", () => {
  const lokal = [{ tag: "lena", desc: "NEU" }];
  expect(mergeCast(lokal, null, [{ tag: "lena", desc: "ALT" }])).toBe(null);
  const res = mergeCast(lokal, { tag: "ich", desc: "meins" }, [
    { tag: "ich", self: true, desc: "alt" }, { tag: "neu", desc: "dazu" },
  ]);
  expect(res.me.desc).toBe("meins");
  expect(res.cast.map((c) => c.tag)).toEqual(["lena", "neu"]);
});

/* Der Fingerabdruck laeuft bei JEDEM Render — er darf die Megabytes nicht
   anfassen, nur ihre Laengen. */
test("der Fingerabdruck reagiert auf ein neues Foto, ohne es zu lesen", () => {
  const a = castFingerprint([], anton);
  expect(a).not.toContain("AAA");
  expect(castFingerprint([], { ...anton, img: "data:image/jpeg;base64,AAAA" })).not.toBe(a);
  expect(castFingerprint([], anton)).toBe(a);
});
