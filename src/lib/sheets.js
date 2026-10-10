/* Die Bogen-Pflicht: Welche Figur braucht vor einem bezahlten Render einen
 * Charakterbogen, und welches Bild geht dann als Referenz raus.
 *
 * Warum es Bögen gibt, steht im Plan (docs/plans/2026-08-20-charakterbogen-
 * pflicht.md) und ist bezahlt bewiesen: Ein hochgeladenes Foto mit Umgebung
 * blutet seine Umgebung in jede Szene (Lenas Segelboot). Der Bogen — grau,
 * geteilt: Ganzkörper + Gesicht — unterbindet das, und die Ähnlichkeit hält.
 *
 * Die drei Regeln, die diese Datei durchsetzt:
 *   TRÄGE   — ein Bogen entsteht nie beim Anlegen, nur aus einem bezahlten
 *             Render heraus. Anlegen kostet $0; niemand kann über Figuren
 *             Gratis-Bilder farmen (Antons 1000-Charaktere-Stresstest).
 *   GRATIS  — kein Credit, keine versteckte Abrechnung. Finanziert aus der
 *             Lite-Ersparnis; das erste Bild einer Figur spart ihren Bogen
 *             praktisch wieder ein.
 *   VERALTBAR — der Bogen merkt sich, WORAUS er entstand (Fingerabdruck über
 *             Foto + Beschreibung). Ändert sich eines, entsteht beim nächsten
 *             bezahlten Render ein neuer. So repariert „besseres Foto
 *             hochladen" einen missratenen Bogen von selbst.
 *
 * Orte sind ausgenommen: ein Ort IST seine Umgebung. Und der Bogen ist wie
 * der Regisseur Kür, nie Pflicht im Fehlerfall — wo keiner entsteht, geht
 * das rohe Foto raus, wie all die Monate zuvor.
 */

/* djb2 über Foto + Beschreibung. Kein kryptografischer Anspruch — der
 * Fingerabdruck muss nur erkennen, dass sich die QUELLE geändert hat, und
 * er läuft über Daten, die der Mensch selbst besitzt. Über die Basis-64-
 * Zeichen eines 1-MB-Fotos ist das eine einstellige Millisekunde. */
export function sheetFingerprint(member) {
  /* ⚠ Der Trenner ist ein NUL-ZEICHEN, geschrieben als Escape `\0` — nicht
     als echtes Byte. Beides ergibt zur Laufzeit dasselbe, aber ein echtes
     NUL im Quelltext lässt Git die Datei für BINÄR halten: `git diff` sagt
     dann nur noch „Binary files differ", und niemand kann eine Änderung an
     dieser Datei mehr prüfen. (Gefunden am 24.08.2026; dieselbe Falle stand
     in gatekeeper.js.)
     Warum überhaupt ein Trenner, den kein Bild und kein Text enthält:
     Sonst könnten Foto-Ende und Beschreibungs-Anfang ineinanderlaufen und
     zwei verschiedene Figuren denselben Fingerabdruck bekommen.
     ⚠ BEIDE Fotos gehen hinein. Sonst wäre „Ganzkörperbild nachgereicht"
     keine Änderung — der alte Bogen bliebe gültig, und das zweite Foto
     hätte nie gewirkt. */
  const src = `${member?.img || ""}\0${member?.img2 || ""}\0${member?.desc || ""}`;
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h * 33) ^ src.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Hat diese Figur einen GÜLTIGEN Bogen — einen, der aus dem heutigen Foto
 *  und der heutigen Beschreibung entstand? */
export function hasFreshSheet(member) {
  return Boolean(member?.sheet) && member?.sheetOf === sheetFingerprint(member);
}

/** Braucht diese Figur vor dem nächsten bezahlten Render einen Bogen?
 *  Nur Personen und Tiere MIT Foto — ohne Foto gibt es nichts zu
 *  normalisieren (der 2-Credit-Weg aus der Beschreibung bleibt eine
 *  sichtbare, eigene Entscheidung im AvatarDialog). */
export function needsSheet(member) {
  if (!member?.img) return false;
  if (member.category !== "person" && member.category !== "pet") return false;
  return !hasFreshSheet(member);
}

/** Die Fotos dieser Figur, in fester Reihenfolge: Nahaufnahme zuerst,
 *  Ganzkörper danach.
 *
 *  ⚠ Die REIHENFOLGE ist Vertrag mit buildSheetFromPhotoPrompt: Der Prompt
 *  sagt „reference image 1 is a close view of their face, reference image 2
 *  shows their whole body". Wer sie hier dreht, macht diesen Satz zur Lüge —
 *  und der Bogen bekäme die Statur aus dem Gesichtsfoto.
 *
 *  Das zweite Foto ist optional und bleibt es: Wer nur eines hochlädt,
 *  bekommt denselben Bogen wie bisher.
 */
export function photosOf(member) {
  return [member?.img, member?.img2].filter(Boolean);
}

/** Das Bild, das als Referenz in einen Render geht: der gültige Bogen,
 *  sonst das rohe Foto. NIE ein veralteter Bogen — der zeigte eine Fassung
 *  der Figur, die der Mensch bewusst geändert hat. */
export function renderRef(member) {
  /* Orte und Gegenstände nehmen IMMER das Foto. Bis 10.10.2026 bekamen
     Gegenstände im Film-Auftrag fälschlich einen Personen-Bogen (Step5Style
     machte aus "object" "person") — der liegt bei manchem Fahrrad noch im
     Speicher und darf nie wieder als Referenz rausgehen. */
  if (member?.category === "place" || member?.category === "object") return member?.img || "";
  return hasFreshSheet(member) ? member.sheet : member?.img || "";
}

/* Ein /media/-Bild als kompakter data:-URI, JPEG ~0.85.
 *
 * Warum überhaupt umwandeln: Cast-Bilder gehen vom Server WÖRTLICH als
 * image_urls zu fal — ein /media/-Pfad zeigt auf diesen Rechner und ist für
 * fal unerreichbar; nur data:-URIs funktionieren garantiert (so kommen auch
 * hochgeladene Fotos an). Und warum JPEG statt des PNG-Originals: der Bogen
 * liegt im localStorage neben dem Foto, und die Origin-Quota (~5 MB) ist mit
 * wenigen 1-MB-PNGs aufgebraucht. Fotografisches Material verliert bei 0.85
 * nichts, was eine Referenz braucht.
 *
 * Browser-only (Canvas) — die reinen Regeln oben bleiben ohne DOM testbar. */
export async function compactDataUrl(url, { maxWidth = 1600, quality = 0.85 } = {}) {
  const blob = await (await fetch(url)).blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}
