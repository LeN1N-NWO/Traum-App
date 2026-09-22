/* Wer darf wie oft Geld ausgeben.
 *
 * Bis zum 10.08.2026 stand über `/api/generate` nur ein Kommentar: „⚠ LOCALHOST
 * ONLY". Ein Kommentar hält niemanden auf. Wer den Port erreicht, konnte
 * beliebig oft Bilder rendern lassen — jeder Aufruf $0,08 bis $1,20 von Antons
 * fal.ai-Guthaben, in einer Schleife also unbegrenzt.
 *
 * Was hier NICHT steht, ist genauso wichtig: Das ist keine Benutzerverwaltung.
 * Es gibt keine Konten, kein serverseitiges Guthaben, keine Zuordnung „wer war
 * das". Das braucht das Backend aus ADR-Sicht (siehe STAND.md) und kommt
 * später. Was hier steht, ist die Schranke, die man OHNE Backend bauen kann,
 * und sie schließt die Lücke, die real weh tut:
 *
 *   1. Ein Geheimnis, falls eines gesetzt ist. Ohne API_TOKEN läuft alles wie
 *      bisher — sonst wäre jede Entwicklungsumgebung mit einem Schlag kaputt,
 *      und eine Sicherung, die alle sofort abschalten, sichert nichts.
 *   2. Eine Obergrenze pro Absender und Zeitfenster. Sie greift IMMER, auch
 *      ohne Token: Der teuerste Fehler ist nicht der Fremde, der den Port
 *      findet, sondern die eigene Schleife, die niemand bemerkt hat.
 *
 * Absichtlich im Speicher und ohne Abhängigkeit: ein Neustart vergisst alles,
 * und mehrere Instanzen zählen getrennt. Für einen Server, der noch auf einem
 * Rechner läuft, ist das richtig — Redis dafür einzuführen wäre Infrastruktur
 * für ein Problem, das wir nicht haben.
 */

/** Fenstergröße und Obergrenze je Endpunkt-Klasse. Die Zahlen kommen aus dem,
 *  was ein Mensch tatsächlich tut: Ein Traum sind bis zu zehn Bilder in einer
 *  Minute, also darf `generate` das auch — aber keine hundert. */
export const LIMITS = {
  // teuer: geht an fal.ai, kostet je Aufruf Geld
  generate: { windowMs: 60_000, max: 20 },
  // billig, aber nicht gratis: DeepSeek, ~$0,00026
  text: { windowMs: 60_000, max: 40 },
  // kostenlos und lokal, trotzdem gedeckelt gegen Endlosschleifen
  cheap: { windowMs: 60_000, max: 120 },
  /* Anmelden kostet uns nichts — hier bremst nicht das Geld, sondern das
     Raten. Zehn Versuche je Minute und Absender reichen für jeden Menschen,
     der sich vertippt, und machen das Durchprobieren von Passwörtern
     aussichtslos langsam. Bewusst die strengste Zahl der Tabelle. */
  auth: { windowMs: 60_000, max: 10 },
};

/* Endpunkte, die AUSDRÜCKLICH ohne Grenze laufen. Kurze Liste, jeder Eintrag
   mit Grund — denn alles, was hier nicht steht, wird begrenzt. */
const UNLIMITED = new Set([
  "/api/job",     // Abholen eines laufenden Films: Warten, kein Ausgeben. Ein
                  // Film rendert Minuten, und die App fragt im Sekundentakt.
  "/api/voice",   // WebSocket-Aufwertung; die Sitzung selbst ist EIN Aufruf.
]);

/** Welcher Pfad in welche Klasse fällt.
 *
 *  ⚠ Die Voreinstellung ist ABSICHTLICH die strengste, nicht „unbegrenzt".
 *  Die erste Fassung dieser Tabelle zählte nur benannte Pfade, und exakt eine
 *  Stunde später kam `/api/character` dazu — ein Endpunkt, der bei fal.ai
 *  rendert und damit ungebremst gewesen wäre, weil niemand daran gedacht
 *  hätte, ihn hier einzutragen. Genau diesen Fehler kann eine Liste nicht
 *  verhindern, eine Voreinstellung schon: Wer einen neuen API-Endpunkt baut,
 *  bekommt die Bremse geschenkt und muss sie bewusst lockern, statt sich an
 *  eine Datei erinnern zu müssen, die er nie gesehen hat.
 *
 *  Alles außerhalb von /api/ bleibt unberührt — das ist die Oberfläche. */
export function classOf(pathname) {
  if (!pathname.startsWith("/api/")) return null;
  if (UNLIMITED.has(pathname)) return null;
  if (pathname === "/api/analyze" || pathname === "/api/refine"
      || pathname === "/api/reflect") return "text";
  if (pathname === "/api/transcribe" || pathname === "/api/panel"
      || pathname === "/api/voice-sample") return "cheap";
  /* Anmelden und Sitzung erneuern: eigene, strengere Klasse gegen das Raten
     von Passwörtern. Abmelden gehört NICHT dazu — wer abmelden will, soll das
     immer können, auch nach zehn Fehlversuchen. */
  if (pathname === "/api/auth/login" || pathname === "/api/auth/apple"
      || pathname === "/api/auth/refresh") return "auth";
  /* Konto und Träume gehen an unsere eigene Datenbank, nicht an fal: keine
     Kosten je Aufruf, aber gedeckelt, damit eine Schleife im Client den
     Server nicht beschäftigt. Ohne diese Zeile fielen sie unter „generate"
     (20/Minute) — zu knapp für ein Tagebuch, das beim Öffnen synchronisiert. */
  if (pathname === "/api/account" || pathname.startsWith("/api/dreams")
      || pathname === "/api/auth/logout") return "cheap";
  return "generate";   // /api/generate, /api/character und alles Künftige
}

/* Zähler je (Absender, Klasse). Ein einfaches festes Fenster, kein gleitendes:
   an der Fenstergrenze sind kurzzeitig bis zu 2× max möglich — bei diesen
   Grenzen bedeutet das 40 Bilder statt 20 in einem ungünstigen Moment, und
   das ist der Ungenauigkeit einer Datenstruktur weniger wert. */
const buckets = new Map();

/* Ohne Aufräumen wächst die Map mit jedem neuen Absender für immer. Bei jedem
   Prüflauf ein paar alte Einträge wegzuwerfen kostet nichts und braucht keinen
   Timer, der den Prozess am Leben hält. */
function sweep(now) {
  if (buckets.size < 1000) return;
  for (const [key, b] of buckets) {
    if (b.until <= now) buckets.delete(key);
  }
}

/**
 * @returns {{ok: true} | {ok: false, status: number, error: string, retryAfter?: number}}
 */
export function checkLimit(sender, kind, now = Date.now()) {
  const limit = LIMITS[kind];
  if (!limit) return { ok: true };
  sweep(now);

  /* Trenner als Escape `\0`, nicht als echtes Byte: Ein NUL im Quelltext
     lässt Git die Datei für binär halten, und `git diff` zeigt dann nur
     noch „Binary files differ". Zur Laufzeit identisch. (24.08.2026) */
  const key = `${sender}\0${kind}`;
  const b = buckets.get(key);
  if (!b || b.until <= now) {
    buckets.set(key, { count: 1, until: now + limit.windowMs });
    return { ok: true };
  }
  if (b.count >= limit.max) {
    return {
      ok: false, status: 429,
      error: "Too many requests. Wait a moment and try again.",
      retryAfter: Math.ceil((b.until - now) / 1000),
    };
  }
  b.count++;
  return { ok: true };
}

/** Nur für Tests: den Zählerstand vergessen. */
export function resetLimits() {
  buckets.clear();
}

/* Der Token-Vergleich läuft in konstanter Zeit. Bei einem Geheimnis, das über
   das Netz geraten werden müsste, ist ein Timing-Angriff zwar unrealistisch —
   aber `===` auf Strings bricht beim ersten falschen Zeichen ab, und diese
   Funktion einmal richtig zu schreiben ist billiger als die Diskussion, ob es
   hier ausnahmsweise egal ist. */
export function tokenMatches(expected, given) {
  if (!expected) return true;              // kein Geheimnis gesetzt → offen
  const a = String(expected), b = String(given || "");
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Die eine Entscheidung, die server.js trifft, bevor irgendetwas Geld kostet.
 * @param {string} pathname
 * @param {string} sender     stabile Kennung des Absenders (IP)
 * @param {string|null} token aus dem Anfragekopf
 * @param {string|undefined} expected  API_TOKEN aus der Umgebung
 */
export function guard(pathname, sender, token, expected, now = Date.now()) {
  const kind = classOf(pathname);
  if (!kind) return { ok: true };

  if (!tokenMatches(expected, token)) {
    return { ok: false, status: 401, error: "Not authorised." };
  }
  return checkLimit(sender, kind, now);
}
