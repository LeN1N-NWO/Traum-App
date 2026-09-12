/* Seitenweise Listen — und zwar per Cursor, nicht per OFFSET.
 *
 * Eigene Datei, damit sie ohne laufenden Server prüfbar ist, und weil der
 * nächste Listen-Endpunkt (das Guthaben-Ledger) dieselbe Mechanik braucht.
 *
 * ── Warum Cursor und nicht OFFSET ────────────────────────────────────────
 * `offset 10000` lässt die Datenbank zehntausend Zeilen lesen und wegwerfen,
 * bevor die erste interessante kommt — die letzte Seite ist also immer die
 * teuerste. Schlimmer ist der stille Fehler: Wird während des Blätterns ein
 * Traum gelöscht, rutscht alles eine Position hoch, und genau ein Eintrag
 * wird nie ausgeliefert. Ein Cursor sagt „weiter ab GENAU hier" und kennt
 * dieses Problem nicht.
 *
 * ── Warum der Cursor undurchsichtig ist ──────────────────────────────────
 * Er trägt Sortierwerte, keine Kennungen zum Weiterzählen. Undurchsichtig
 * heißt: niemand baut sich daraus eine Abfrage zusammen, auf die wir uns
 * später festgelegt hätten. Er ist NICHT verschlüsselt und soll es nicht
 * sein — ein Cursor ist kein Geheimnis, er ist eine Lesezeichenposition.
 * Genau deshalb wird alles, was aus ihm herauskommt, unten wieder geprüft:
 * Was von draußen kommt, ist Eingabe, auch wenn wir es selbst geschrieben
 * haben.
 */

/** Vorgabe und Obergrenze für `limit`. Hundert Träume sind mehr, als ein
 *  Mensch auf einmal ansieht; zweihundert ist die Grenze, ab der eine
 *  Antwort mit Analyse-Feldern spürbar groß wird. */
export const STANDARD_LIMIT = 100;
export const MAX_LIMIT = 200;

/**
 * `?limit=` aus einer Anfrage — immer eine brauchbare Zahl.
 *
 * Fehlt der Wert oder ist er Unsinn, gilt die Vorgabe. Zu groß wird
 * gedeckelt statt abgelehnt: Wer 10 000 anfragt, will viel, und ihm eine
 * Fehlermeldung statt zweihundert Träumen zu geben hilft niemandem.
 */
export function parseLimit(roh, { standard = STANDARD_LIMIT, max = MAX_LIMIT } = {}) {
  /* Number() statt parseInt(): parseInt liest von vorne, so weit es kann,
     und macht aus "1e9999" die Zahl 1 und aus "25abc" die Zahl 25 — der
     Client bekäme dann eine Seite, die er nie angefragt hat. Number() nimmt
     die Zeichenkette als Ganzes oder gar nicht. */
  const n = Number(String(roh ?? "").trim());
  if (!Number.isFinite(n) || n < 1) return standard;
  return Math.min(Math.floor(n), max);
}

/**
 * Lesezeichen auf die zuletzt gelieferte Zeile.
 *
 * ⚠ Zwei Werte, nicht einer: `created_at` allein reicht nicht. Zwei Träume
 *   in derselben Nacht können denselben Zeitstempel tragen (die
 *   Dateinamen-Funktion in journalBackup.js sagt das ausdrücklich: „zwei
 *   Träume in derselben Nacht sind keine Seltenheit"). Ein Cursor nur auf
 *   der Zeit würde bei einem solchen Paar entweder einen überspringen oder
 *   einen doppelt liefern — und zwar lautlos.
 */
export function encodeCursor(zeile) {
  const t = zeile?.created_at instanceof Date
    ? zeile.created_at.toISOString()
    : zeile?.created_at;
  const id = zeile?.client_id;
  if (!t || !id) return null;
  return Buffer.from(`${t}|${id}`, "utf8").toString("base64url");
}

/**
 * Zurück zu den zwei Sortierwerten — oder `null`.
 *
 * `null` bei allem Unlesbaren, und der Aufrufer behandelt das wie „kein
 * Cursor": lieber die erste Seite noch einmal als eine Fehlermeldung für
 * etwas, das der Mensch nie eingetippt hat. Was hier geprüft wird, ist
 * nicht Einschleusung (die Werte reisen gebunden), sondern die Form: ein
 * kaputter Zeitstempel in einer Abfrage ergibt einen Datenbankfehler an
 * einer Stelle, an der niemand ihn erwartet.
 */
export function decodeCursor(roh) {
  if (typeof roh !== "string" || !roh || roh.length > 512) return null;
  let text;
  try {
    text = Buffer.from(roh, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const trenner = text.indexOf("|");
  if (trenner < 1) return null;
  const t = text.slice(0, trenner);
  const id = text.slice(trenner + 1);
  if (!id || id.length > 128) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return { createdAt: d.toISOString(), clientId: id };
}

/**
 * Eine Seite aus den gelesenen Zeilen bauen.
 *
 * Der Aufrufer liest bewusst EINE Zeile mehr als angefragt (`limit + 1`) —
 * das ist der billigste bekannte Weg, „gibt es noch mehr?" zu beantworten,
 * ohne ein zweites `count(*)` über die ganze Tabelle laufen zu lassen. Die
 * überzählige Zeile wird hier abgeschnitten und nur als Antwort auf diese
 * Frage verwendet.
 */
export function buildPage(zeilen, limit) {
  const mehr = zeilen.length > limit;
  const seite = mehr ? zeilen.slice(0, limit) : zeilen;
  return {
    seite,
    /* Kein Cursor, wenn es nichts mehr gibt: Ein Cursor, der auf eine leere
       Seite zeigt, lädt zu einer überflüssigen Anfrage ein. */
    next: mehr ? encodeCursor(seite[seite.length - 1]) : null,
  };
}
