/* Ein Traum, wie ihn der Client kennt ⇄ eine Zeile, wie sie die Datenbank
 * kennt (ADR-0005).
 *
 * Eigene Datei, damit sie ohne laufenden Server und ohne Datenbank prüfbar
 * ist — dieselbe Begründung wie bei gatekeeper.js und mediaRoot.js.
 *
 * ── Die Feldliste ist NICHT neu erfunden ─────────────────────────────────
 * Sie ist dieselbe, die `backupEntry()` in journalBackup.js seit Langem
 * festlegt, und aus demselben Grund eine ERLAUBTE Liste statt „alles außer":
 * „Kommt morgen ein Feld dazu, das ein Foto enthält, wandert es sonst still
 * mit." Was dort für die Dateisicherung gilt, gilt hier für Postgres.
 *
 * ── ⚠⚠ Warum das hier noch einmal geprüft wird, obwohl der Client es tut ──
 * Weil der Client es NICHT tut, sobald jemand ihn umgeht. Die Referenzfotos
 * sind biometrische Daten, teils von anderen Menschen
 * (docs/plans/2026-08-20-recht-einwilligung.md), und das Schema sagt dazu:
 * „Only the @tags and their category — never the pictures behind them."
 * Ein Kommentar im Schema hält nichts auf; diese Datei tut es. Deshalb
 * werden Referenzen auf genau zwei Felder zusammengestrichen und aus den
 * Medienpfaden fliegt alles, was `data:` ist — das ist die Form, in der ein
 * Foto sich als „Pfad" ausgeben würde.
 */

import { fromJsonb } from "./db.js";

/* Obergrenzen. Nicht gegen Einschleusung — die Werte reisen als gebundene
   Parameter — sondern gegen Unfug: ein Feld, das niemand begrenzt, ist ein
   Feld, in das irgendwann ein Megabyte passt. Großzügig gewählt; ein
   abgeschnittener Traumtext wäre schlimmer als eine große Zeile. */
const MAX_CLIENT_ID = 128;
const MAX_SHORT = 500;        // title, tagline, style, format, mode, creatureId
const MAX_TEXT = 20_000;      // text, originalText
const MAX_REFS = 24;
const MAX_MEDIA_ITEMS = 64;
const MAX_PATH = 512;
const MAX_JSON = 64 * 1024;   // analysis, reflection — je Feld serialisiert

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

/** Ein Datum, das Postgres versteht, oder null. Ein unlesbares Datum ist
 *  hier kein Fehler, sondern „unbekannt": der Traum selbst ist wichtiger
 *  als sein Zeitstempel, und `created_at` hat eine Vorgabe. */
function isoOrNull(v) {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Nur die Namen, nie die Bilder dahinter — serverseitig erzwungen.
 *  Alles außer `tag` und `category` fällt weg, auch wenn es mitgeschickt
 *  wurde (und gerade dann). */
export function safeReferences(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((r) => r && typeof r === "object" && typeof r.tag === "string" && r.tag)
    .slice(0, MAX_REFS)
    .map((r) => ({ tag: r.tag.slice(0, 120), category: str(r.category, 60) }));
}

/** Pfade, keine Daten. `data:`-Adressen fliegen raus: so und nicht anders
 *  käme ein Foto als „Pfad" in die Datenbank. */
export function safeMedia(medien) {
  const liste = (v) => (Array.isArray(v) ? v : [])
    .filter((s) => typeof s === "string" && s && !/^data:/i.test(s.trim()))
    .slice(0, MAX_MEDIA_ITEMS)
    .map((s) => s.slice(0, MAX_PATH));
  const m = medien && typeof medien === "object" ? medien : {};
  const out = { bilder: liste(m.bilder), film: liste(m.film) };
  const szenen = liste(m.szenen);
  if (szenen.length) out.szenen = szenen;
  return out;
}

/** Ein jsonb-Feld, das vom Modell kommt: durchgereicht, aber gedeckelt.
 *  Zu groß heißt hier weglassen, nicht abschneiden — ein halbes JSON ist
 *  wertloser als gar keins. */
function safeJson(v) {
  if (v == null || typeof v !== "object") return null;
  try {
    return JSON.stringify(v).length > MAX_JSON ? null : v;
  } catch {
    return null;   // Zirkelbezug o. Ä. — nichts, was in eine Zeile gehört
  }
}

/**
 * Client-Traum → Spaltenwerte. `null`, wenn daraus keine Zeile werden kann.
 *
 * `client_id` ist der Schlüssel, an dem alles hängt: Er ist die lokale Id
 * des Traums (z. B. „e_mtvpt7c4qiu4mq"), und das Schema hat dafür
 * `unique (user_id, client_id)` — damit das Hochladen eines lokalen
 * Tagebuchs wiederholbar ist, ohne Träume zu verdoppeln. Ohne ihn gibt es
 * nichts, woran ein zweiter Lauf denselben Traum wiedererkennt.
 */
export function toRow(traum) {
  const clientId = str(traum?.id, MAX_CLIENT_ID).trim();
  if (!clientId) return null;

  return {
    client_id: clientId,
    kind: str(traum.kind, 60) || "dream",
    title: str(traum.title, MAX_SHORT),
    tagline: str(traum.tagline, MAX_SHORT),
    text: str(traum.text, MAX_TEXT),
    original_text: str(traum.originalText, MAX_TEXT),
    analysis: safeJson(traum.analysis),
    reflection: safeJson(traum.reflection),
    style: str(traum.style, MAX_SHORT) || null,
    format: str(traum.format, MAX_SHORT) || null,
    mode: str(traum.mode, MAX_SHORT) || null,
    image_count: Number.isInteger(traum.imageCount) && traum.imageCount >= 0 ? traum.imageCount : null,
    creature_id: str(traum.creatureId, MAX_SHORT) || null,
    references: safeReferences(traum.references),
    media: safeMedia(traum.medien),
    created_at: isoOrNull(traum.createdAt),
    edited_at: isoOrNull(traum.editedAt),
  };
}

/**
 * Datenbankzeile → Client-Traum, in exakt der Form, die der Client ohnehin
 * kennt (`backupEntry()`). Wer einen Traum hochlädt und wieder abholt,
 * bekommt dieselben Feldnamen zurück, die er geschickt hat — sonst bräuchte
 * jede Seite der App eine zweite Übersetzung.
 */
export function fromRow(row) {
  if (!row) return null;
  return {
    id: row.client_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    editedAt: row.edited_at instanceof Date ? row.edited_at.toISOString() : row.edited_at ?? undefined,
    kind: row.kind,
    title: row.title || "",
    tagline: row.tagline || "",
    text: row.text || "",
    originalText: row.original_text || "",
    /* ⚠ fromJsonb, nicht roh: Bun.SQL liefert jsonb als Text (db.js). Ohne
       das bekäme der Client eine Zeichenkette, wo eine Liste steht — und
       zwar erst im Betrieb, nicht im Test. */
    analysis: fromJsonb(row.analysis) ?? undefined,
    reflection: fromJsonb(row.reflection) ?? undefined,
    style: row.style ?? undefined,
    format: row.format ?? undefined,
    mode: row.mode ?? undefined,
    imageCount: row.image_count ?? undefined,
    creatureId: row.creature_id ?? undefined,
    references: fromJsonb(row.references, []) || [],
    medien: fromJsonb(row.media, null) || { bilder: [], film: [] },
  };
}
