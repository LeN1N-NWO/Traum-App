import { test, expect } from "bun:test";
import { backupName, backupEntry, backupPayload, backupFingerprint } from "./journalBackup.js";

/* Diese Sicherung ist die einzige Kopie eines Traums außerhalb eines
   einzelnen Browsers. Was sie falsch macht, merkt niemand — bis der Speicher
   leer ist. Deshalb steht hier jede ihrer drei Regeln unter Aufsicht. */

const traum = {
  id: "e_abc", createdAt: "2026-08-22T06:30:00.000Z",
  title: "Der Fluss", text: "Ich schwamm im Fluss.",
  analysis: { mood: "ruhig", beats: ["im Fluss"] },
  references: [{ tag: "Mara", category: "person", img: "data:image/png;base64,AAAA" }],
  media: { type: "image", urls: ["/media/a.png"], source: "api" },
};

test("der Dateiname sortiert nach Datum und bleibt eindeutig", () => {
  expect(backupName(traum)).toBe("2026-08-22-e_abc.json");
  expect(backupName({ id: "e/../../böse", createdAt: "2026-08-22T00:00:00Z" }))
    .toBe("2026-08-22-e....böse.json".replace("....böse", "böse".replace(/[^a-zA-Z0-9_-]/g, "")));
});

/* ⚠ Die Regel, an der alles hängt: KEINE FOTOS. Referenzbilder sind
   biometrische Daten, teils von anderen Menschen. Wer Anton ein Foto gibt,
   gibt es ihm — nicht einem Dateisystem und schon gar keinem Repository. */
test("kein einziges Foto verlässt den Browser", () => {
  const gesichert = backupEntry(traum);
  const alsText = JSON.stringify(gesichert);
  expect(alsText).not.toContain("data:image");
  expect(alsText).not.toContain("base64");
  // Der Name bleibt, das Gesicht nicht.
  expect(gesichert.references).toEqual([{ tag: "Mara", category: "person" }]);
});

test("gesichert wird als erlaubte Liste, nicht als 'alles außer'", () => {
  const mitNeuemFeld = { ...traum, geheimesNeuesFeld: "data:image/png;base64,XXXX" };
  expect(JSON.stringify(backupEntry(mitNeuemFeld))).not.toContain("geheimesNeuesFeld");
});

test("Pfade statt Daten — die Bilder bleiben, wo sie liegen", () => {
  expect(backupEntry(traum).medien.bilder).toEqual(["/media/a.png"]);
});

test("Beispielträume werden nicht gesichert, leere Nächte schon", () => {
  const journal = [
    { id: "e_seed1", createdAt: "2026-08-19T07:00:00Z", text: "Beispiel" },
    traum,
    { id: "e_leer", createdAt: "2026-08-21T07:00:00Z", kind: "blank" },
  ];
  const namen = backupPayload(journal).map((x) => x.datei);
  expect(namen).toEqual(["2026-08-22-e_abc.json", "2026-08-21-e_leer.json"]);
  expect(backupPayload(journal).find((x) => x.leer)).toBeTruthy();
});

/* Der Fingerabdruck entscheidet, WANN geschrieben wird. Er muss auf jede
   inhaltliche Änderung anspringen und auf sonst nichts — sonst schreibt die
   App bei jedem Tastendruck oder gar nicht mehr. */
test("der Fingerabdruck reagiert auf Inhalt, nicht auf Beiwerk", () => {
  const a = backupFingerprint([traum]);
  expect(backupFingerprint([{ ...traum, title: "Anderer Titel" }])).toBe(a);   // Titel allein: egal
  expect(backupFingerprint([{ ...traum, text: traum.text + " Und dann." }])).not.toBe(a);
  expect(backupFingerprint([{ ...traum, media: { urls: ["/media/a.png", "/media/b.png"] } }])).not.toBe(a);
  expect(backupFingerprint([{ ...traum, reflection: { text: "..." } }])).not.toBe(a);
  expect(backupFingerprint([])).toBe("");
});

/* ── Die Rückrichtung: geteilte Träume ins Journal holen ────────────────
   Antons Ansage vom 22.08.: „Alle, die jetzt an der App entwickeln, sollen
   diese Träume sehen." Ohne diesen Weg wäre die Sicherung eine
   Einbahnstraße — geschrieben, eingecheckt, und ein frischer Checkout sähe
   trotzdem nichts. */
import { restoreEntry, mergeShared } from "./journalBackup.js";

test("gesichert und zurückgeholt ergibt wieder einen brauchbaren Traum", () => {
  const zurueck = restoreEntry(backupEntry(traum));
  expect(zurueck.id).toBe("e_abc");
  expect(zurueck.text).toBe(traum.text);
  expect(zurueck.analysis).toEqual(traum.analysis);
  expect(zurueck.media.urls).toEqual(["/media/a.png"]);
  // ⚠ Das Foto kommt NICHT zurück — es war nie in der Sicherung, und hier
  // wird nichts erfunden, was dort fehlt.
  expect(JSON.stringify(zurueck)).not.toContain("data:image");
});

test("eine leere Nacht bleibt eine leere Nacht", () => {
  const zurueck = restoreEntry(backupEntry({ id: "e_leer", createdAt: "2026-08-19T07:00:00Z", kind: "blank" }));
  expect(zurueck.kind).toBe("blank");
});

/* ⚠ Die Regel, ohne die das Feature zur Plage wird: Der lokale Stand ist
   der neuere. Ein Traum, den es im Gerät schon gibt, wird NIE überschrieben
   — sonst nähme die Sicherung beim nächsten Start die letzte Bearbeitung
   wieder zurück. */
test("bekannte Träume werden nicht überschrieben, nur unbekannte ergänzt", () => {
  const lokal = [{ id: "e_abc", text: "Frisch bearbeitet", createdAt: "2026-08-22T06:30:00.000Z" }];
  const geteilt = [backupEntry(traum), backupEntry({ ...traum, id: "e_neu", createdAt: "2026-08-18T06:00:00.000Z" })];
  const gemergt = mergeShared(lokal, geteilt);
  expect(gemergt.map((e) => e.id)).toEqual(["e_neu", "e_abc"]);      // chronologisch
  expect(gemergt.find((e) => e.id === "e_abc").text).toBe("Frisch bearbeitet");
});

test("gibt es nichts Neues, wird das Journal nicht angefasst", () => {
  const lokal = [{ id: "e_abc", createdAt: "2026-08-22T06:30:00.000Z" }];
  expect(mergeShared(lokal, [backupEntry(traum)])).toBe(null);
  expect(mergeShared(lokal, [])).toBe(null);
});
