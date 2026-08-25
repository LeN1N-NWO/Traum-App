/* Träume als Dateien — Antons Ansage vom 22.08.2026:
 * „Meine Testträume, die ich drinhab, bitte hier abspeichern, und alle
 * Träume, die ich jetzt in dieser App generiere, sollen mit rein und sollen
 * drinnen bleiben, bis ich ausdrücklich sage, dass man die Memory löschen
 * soll."
 *
 * Das Problem dahinter ist echt: Bis heute lebt ein Traum in localStorage —
 * an EINEM Browser auf EINEM Gerät. Ein geleerter Speicher, ein anderer
 * Browser, ein neues Handy, und er ist weg. Der Text ist dabei das
 * Unersetzliche: Bilder kann man neu rendern (für Geld), einen Traum von
 * vorletzter Woche nicht.
 *
 * Drei Regeln, die diese Datei ausmachen:
 *
 * 1. NUR ANHÄNGEN, NIE LÖSCHEN. Verschwindet ein Traum aus der App (gelöscht,
 *    Speicher geleert, anderes Gerät), bleibt seine Datei stehen. Genau das
 *    hat Anton verlangt — die Sicherung ist kein Spiegel, sie ist ein Archiv.
 *    Aufgeräumt wird ausschließlich auf sein ausdrückliches Wort.
 * 2. KEINE FOTOS. Referenzbilder liegen als data-URL in `state.cast` und
 *    `state.me` — sie sind biometrische Daten, teils von ANDEREN Menschen
 *    (wer Anton ein Foto gibt, gibt es ihm, nicht einem Dateisystem).
 *    Gesichert werden Träume, nicht Gesichter. Was vom Ensemble bleibt, ist
 *    der @tag, also ein Name.
 * 3. EINE DATEI JE TRAUM, nach Datum benannt. Kein großes Sammel-JSON: Das
 *    wächst, wird bei jedem Schreiben komplett ersetzt und ist bei einem
 *    Abbruch mitten im Schreiben ganz weg. Einzelne Dateien lassen sich
 *    außerdem lesen, durchsuchen und von Hand retten.
 */
import { isBlank } from "./blankNight.js";

/** Dateiname eines Traums: sortierbar, eindeutig, ohne Überraschungen.
 *  Datum zuerst, damit der Ordner chronologisch liest; die Id dahinter,
 *  weil zwei Träume in derselben Nacht keine Seltenheit sind. */
export function backupName(entry) {
  const tag = String(entry?.createdAt || "").slice(0, 10) || "ohne-datum";
  const id = String(entry?.id || "unbekannt").replace(/[^a-zA-Z0-9_-]/g, "");
  return `${tag}-${id}.json`;
}

/** Was von einem Eintrag gesichert wird.
 *
 *  Bewusst eine ERLAUBTE Liste statt „alles außer": Kommt morgen ein Feld
 *  dazu, das ein Foto enthält, wandert es sonst still mit. Eine Sicherung,
 *  die man nicht mehr überblickt, ist ein Datenleck mit Zeitzünder. */
export function backupEntry(entry) {
  if (!entry?.id) return null;
  const sicher = {
    id: entry.id,
    createdAt: entry.createdAt,
    kind: entry.kind || "dream",
    title: entry.title || "",
    tagline: entry.tagline || "",
    text: entry.text || "",
    originalText: entry.originalText || "",
    editedAt: entry.editedAt || undefined,
    analysis: entry.analysis || undefined,
    reflection: entry.reflection || undefined,
    style: entry.style || undefined,
    format: entry.format || undefined,
    mode: entry.mode || undefined,
    imageCount: entry.imageCount ?? undefined,
    creatureId: entry.creatureId || undefined,
    // Nur die Namen, nie die Bilder dahinter.
    references: (entry.references || []).map((r) => ({ tag: r.tag, category: r.category })),
    // Pfade, keine Daten: die Dateien liegen in /media auf diesem Gerät.
    medien: {
      bilder: entry.media?.urls || [],
      film: entry.film?.urls || [],
      szenen: entry.sceneImages || undefined,
    },
  };
  for (const [k, v] of Object.entries(sicher)) if (v === undefined) delete sicher[k];
  return sicher;
}

/** Alles, was gesichert werden soll — leere Nächte inklusive, weil sie
 *  Teil der Serie sind, aber ohne die Beispielträume: die stammen nicht von
 *  diesem Menschen und stehen ohnehin im Code (seedJournal.js). */
export function backupPayload(journal) {
  return (journal || [])
    .filter((e) => e?.id && !String(e.id).startsWith("e_seed"))
    .map((e) => ({ datei: backupName(e), traum: backupEntry(e), leer: isBlank(e) }))
    .filter((x) => x.traum);
}

/** Fingerabdruck über das, was gesichert würde — damit die App nicht bei
 *  jedem Tastendruck schreibt, sondern nur, wenn sich wirklich etwas an den
 *  Träumen geändert hat. */
export function backupFingerprint(journal) {
  return backupPayload(journal)
    .map((x) => `${x.datei}:${(x.traum.text || "").length}:${x.traum.editedAt || ""}` +
      `:${(x.traum.medien?.bilder || []).length}:${x.traum.reflection ? 1 : 0}`)
    .join("|");
}

/** Aus einem gesicherten Traum wieder einen Journal-Eintrag machen.
 *
 *  Die Umkehrung von backupEntry(), und bewusst NICHT symmetrisch: Was in
 *  der Sicherung fehlt, fehlt aus gutem Grund (Fotos) und darf hier nicht
 *  erfunden werden. Die Medienpfade zeigen auf /media dieses Rechners —
 *  fehlt die Datei, zeigt die App eine leere Kachel und bietet „Bilder
 *  machen" an. Das ist die ehrliche Anzeige, kein Fehler. */
export function restoreEntry(gesichert) {
  if (!gesichert?.id) return null;
  const e = {
    id: gesichert.id,
    createdAt: gesichert.createdAt,
    title: gesichert.title || "",
    tagline: gesichert.tagline || "",
    text: gesichert.text || "",
    originalText: gesichert.originalText || "",
    references: gesichert.references || [],
    media: { type: "image", urls: gesichert.medien?.bilder || [], source: "api", poster: false },
  };
  if (gesichert.kind && gesichert.kind !== "dream") e.kind = gesichert.kind;
  for (const feld of ["analysis", "reflection", "style", "format", "mode", "imageCount", "creatureId", "editedAt"]) {
    if (gesichert[feld] !== undefined) e[feld] = gesichert[feld];
  }
  if (gesichert.medien?.film?.length) e.film = { urls: gesichert.medien.film, source: "api" };
  if (gesichert.medien?.szenen) e.sceneImages = gesichert.medien.szenen;
  return e;
}

/** Welche geteilten Träume in ein bestehendes Journal gehören: die, die es
 *  noch nicht kennt — plus die Bilder zu denen, die es kennt, aber leer hat.
 *
 *  ⚠ Die zweite Hälfte kam am 25.08.2026 dazu, aus Antons Befund: „Die
 *  fehlen komplett in dem Traum. Da ist gar nichts drin." Er hatte recht,
 *  und es war kein Renderfehler.
 *
 *  Bis dahin galt nur „was ich noch nicht kenne". Wer denselben Traum in
 *  zwei Browsern offen hat — und das ist beim Entwickeln der Normalfall,
 *  einer rendert, der andere schaut zu — bekam die Bilder nie: Die ID war
 *  ja bekannt, also übersprang der Abgleich den Eintrag. Der Traum stand in
 *  der zweiten App für immer leer da, obwohl die Dateien auf der Platte
 *  lagen.
 *
 *  ⚠ Und deshalb ist die Ergänzung eng gefasst: NUR Bilder, NUR wenn der
 *  eigene Eintrag gar keine hat. Sobald lokal auch nur ein Bild steht,
 *  bleibt der Eintrag unangetastet. Alles andere wäre Überschreiben, und
 *  dann verlöre jemand seinen neueren Stand an ein Archiv — genau das,
 *  wogegen die alte Regel geschrieben war. */
export function mergeShared(journal, gesicherte) {
  const bekannt = new Set((journal || []).map((e) => e?.id));
  const neue = (gesicherte || [])
    .filter((g) => g?.id && !bekannt.has(g.id))
    .map(restoreEntry)
    .filter(Boolean);

  const bilderVon = new Map(
    (gesicherte || [])
      .filter((g) => g?.id && g.medien?.bilder?.length)
      .map((g) => [g.id, g.medien.bilder]),
  );
  let ergaenzt = 0;
  const gefuellt = (journal || []).map((e) => {
    if ((e?.media?.urls || []).length > 0) return e;
    const bilder = bilderVon.get(e?.id);
    if (!bilder?.length) return e;
    ergaenzt++;
    return { ...e, media: { ...(e.media || {}), type: "image", urls: bilder, source: "api" } };
  });

  if (!neue.length && !ergaenzt) return null;
  return [...gefuellt, ...neue]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}
