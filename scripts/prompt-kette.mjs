#!/usr/bin/env bun
/* Die ganze Prompt-Kette eines Traums zum LESEN (Antons Frage 22.08.:
 * „Ich würde gerne mal sehen, beim letzten Traum, welche Prompts aneinander
 * übergeben wurden, diese Struktur und wie weit diese Struktur auch cool ist
 * und immer gleichbleibend ist. Die will ich mal lesen.").
 *
 * Zeigt für einen Traum jede Stufe in der Reihenfolge, in der sie wirklich
 * passiert — und zwar aus DEN Funktionen, die die App auch benutzt. Ein
 * Dokument, das die Prompts abschreibt, veraltet still; dieses Skript kann
 * es nicht, weil es importiert.
 *
 *   bun scripts/prompt-kette.mjs                    # letzter gesicherter Traum
 *   bun scripts/prompt-kette.mjs data/traeume/<datei>.json
 */
import { resolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { buildImagePrompt, buildReferences, buildCharacterPrompt } from "../src/lib/promptBuilder.js";
import { styleById } from "../src/lib/styles.js";

const BACKUP = resolve(import.meta.dir, "..", "data", "traeume");

function traumLaden() {
  const arg = process.argv[2];
  if (arg) return JSON.parse(readFileSync(arg, "utf8"));
  const dateien = readdirSync(BACKUP).filter((f) => f.endsWith(".json")).sort();
  if (!dateien.length) {
    console.error("Kein gesicherter Traum in data/traeume/ — App einmal öffnen, dann erneut.");
    process.exit(1);
  }
  return JSON.parse(readFileSync(resolve(BACKUP, dateien[dateien.length - 1]), "utf8"));
}

const linie = (titel) => console.log(`\n${"─".repeat(72)}\n${titel}\n${"─".repeat(72)}`);

const t = traumLaden();
const beats = t.analysis?.beats || [];
const stil = t.style || t.analysis?.style || "dreamlike";
const format = t.format || "9:16";

console.log(`\n╔══ ${t.title || "Ohne Titel"} ══`);
console.log(`║ ${t.createdAt} · Stil ${stil} · Format ${format} · ${beats.length} Szenen`);
console.log("╚" + "═".repeat(60));

linie("STUFE 1 — Was die Analyse geliefert hat (EIN DeepSeek-Aufruf)");
console.log(`Text (Sprache des Traums, wird ANGEZEIGT):\n  ${(t.text || "").slice(0, 300)}`);
console.log(`\nFiguren:  ${(t.references || []).map((r) => `${r.tag} (${r.category})`).join(" · ") || "—"}`);
console.log(`Stimmung: ${t.analysis?.mood || "—"}`);
console.log(`\nSzenen (IMMER ENGLISCH — sie sind Anweisungen ans Bildmodell):`);
beats.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));

linie("STUFE 2 — Der Charakterbogen je Figur (einmalig, vor dem ersten Bild)");
console.log("Ohne Foto erfindet das Bildmodell die Figur in JEDEM Bild neu. Der Bogen");
console.log("macht daraus eine Referenz. Bewusst ohne Stil und ohne Handlung:\n");
console.log(buildCharacterPrompt({ desc: "eine Ärztin mit Brille", category: "person" }));

linie("STUFE 3 — Die Referenz-Klauseln (lokal gebaut, kein Modell)");
const beispiel = (t.references || []).map((r) => ({
  kind: r.category || "person",
  avatar: { tag: r.tag, desc: "", img: "(Bogen oder Foto)" },
}));
const { clauses } = buildReferences(beispiel);
console.log(clauses.length ? clauses.join("\n") : "— (dieser Traum hatte keine Figuren mit Bild)");

linie("STUFE 4 — Der Bildauftrag, Szene für Szene");
console.log(`Stilblock (styles.js → ${stil}):\n  ${styleById(stil).prompt}\n`);
beats.forEach((beat, i) => {
  console.log(`┌─ Szene ${i + 1} von ${beats.length} ` + "─".repeat(40));
  console.log(buildImagePrompt({ beat, styleId: stil, format, clauses, index: i + 1, total: beats.length })
    .split("\n").map((z) => "│ " + z).join("\n"));
  console.log("└" + "─".repeat(60) + "\n");
});

linie("WAS DARAN GLEICH BLEIBT — und was nicht");
console.log(`Gleich in jedem Bild:  Stilblock, Format, Referenz-Klauseln, der Satz
                        „image N of ${beats.length} in one continuous dream sequence"
Unterschiedlich:        nur die Szene selbst (Stufe 1, Zeile ${1}–${beats.length})

⚠ Was FEHLT (Antons Befund 22.08.): Jedes Bild geht einzeln raus und kennt
   die vorherigen nicht. Die Konsistenz hängt allein an den Worten oben und
   an den Figuren-Referenzen — Licht, Palette und Ort werden jedes Mal neu
   erfunden. Die Reihe soll stattdessen verkettet werden: Bild 1 wird zur
   Referenz für Bild 2 und so weiter. Siehe docs/plans/.`);
