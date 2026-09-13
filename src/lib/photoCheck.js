/* Die Foto-Prüfung — was eine Antwort des Filmdienstes für den Menschen heißt.
 *
 * Antons Idee (13.09.2026): „Wenn ich meine Mutter hochlade und das Häkchen
 * setze, wird das Bild im Hintergrund geprüft und freigegeben. Somit wissen
 * wir, dass es funktioniert — und wenn jemand Brad Pitt hochlädt, kommt in
 * diesem Moment die Fehlermeldung."
 *
 * Diese Datei ist rein: Sie bekommt, was ein Anbieter zurückgab (Fehlertext,
 * Fehlercode, Status), und macht daraus EIN Ergebnis mit EINEM Grund. Welcher
 * Anbieter prüft, entscheidet server.js; wie eine Ablehnung heißt, steht hier —
 * getestet, weil ein falsch einsortierter Grund dem Menschen das Falsche rät
 * („nimm eine Nahaufnahme", wenn in Wahrheit ein Prominenter erkannt wurde).
 *
 * Drei Ergebnisse:
 *   ok           der Dienst hat das Foto angenommen
 *   blocked      der Dienst lehnt es ab — mit Grund (siehe REASONS)
 *   unavailable  nicht prüfbar (Netz, Schlüssel fehlt, Dienst down) —
 *                NIE als Ablehnung zeigen, sonst sperrt ein Funkloch ein
 *                gutes Foto. Geprüft wird dann beim Erzeugen.
 */
export const REASONS = ["celebrity", "minor", "explicit", "noface", "manyfaces", "realface", "provider"];

/* Reihenfolge ist Absicht: das SPEZIFISCHSTE Muster zuerst. „sensitive
   content … privacy information" ist bei ByteDance die Gesichtsregel, nicht
   ein Nacktfilter — deshalb steht realface vor explicit. */
const PATTERNS = [
  ["realface", /PrivacyInformation|real[\s_-]*(human|person)[\s_-]*face|human face|portrait (asset|authori)|face.*not (supported|allowed)/i],
  ["celebrity", /celebrit|public figure|famous|well[\s-]known person|prominent/i],
  ["minor", /\bminor|child|underage|under[\s-]?18|kid\b/i],
  ["manyfaces", /multiple (faces|people|persons)|more than one (face|person)/i],
  ["noface", /no face|face not (found|detected)|without (a )?face/i],
  ["explicit", /nsfw|sexual|nudity|explicit|violen|gore|SensitiveContent|content[\s_-]*(policy|moderation|filter)|safety/i],
];

/** Übersetzt eine Anbieter-Ablehnung in einen Grund. Unbekanntes → "provider". */
export function reasonOf(message, code) {
  const text = `${code || ""} ${message || ""}`;
  for (const [reason, re] of PATTERNS) if (re.test(text)) return reason;
  return "provider";
}

/** Netz- und Konfigurationsfehler sind KEINE Ablehnung. */
const UNAVAILABLE = /timeout|timed out|ECONN|ENOTFOUND|fetch failed|network|NO_[A-Z_]*(KEY|TOKEN)|unauthori[sz]ed|\b(401|402|403|429|5\d\d)\b|rate limit|service unavailable|insufficient (credit|balance)|payment required/i;

/** Aus einem Anbieter-Ergebnis das Ergebnis für die App.
 *  @param {{accepted?: boolean, error?: string, code?: string, status?: number}} r */
export function checkResult(r) {
  if (!r) return { status: "unavailable", reason: null };
  if (r.accepted === true) return { status: "ok", reason: null };
  const text = `${r.code || ""} ${r.error || ""} ${r.status || ""}`;
  if (!r.code && UNAVAILABLE.test(text)) return { status: "unavailable", reason: null };
  if (r.accepted === false || r.error || r.code) return { status: "blocked", reason: reasonOf(r.error, r.code) };
  return { status: "unavailable", reason: null };
}
