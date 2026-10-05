/* Storage layer. Deliberately free of React and the DOM — that is what makes
 * it testable.
 *
 * The key stays dreamrushes_v1. Every addition is an optional field with a
 * default: breaking the schema would mean data loss in real dream journals,
 * not just migration work.
 */
export const DB_KEY = "dreamrushes_v1";

export const DEFAULT_STATE = {
  creatures: [], lastDream: null, streak: 0,
  mode: "sequence", cons: "standard",
  me: null, cast: [], journal: [], events: [],
  credits: 0, creditsGranted: false,   // gekauft/geschenkt — bleiben. Siehe credits.js
  allowance: 0,          // aus einem Abo — wird zum Periodenbeginn gesetzt, nicht addiert
  onboarded: false,      // first-run flow seen (slides + survey offer)
  surveyDone: false,     // welcome survey finished — that is what earns the grant
  /* Das ganze Umfrage-Ergebnis, so wie OnboardingSurvey es liefert:
     { name, birthday, zodiac, recall, lucid, themes, goal, sleepHours,
       timeBudget, reminders }
     ⚠ reminders ist ein WUNSCH, keine Erlaubnis — siehe lib/reminders.js.
     Neue Felder brauchen hier nichts: Das Objekt wird als Ganzes
     gespeichert, jedes fehlende Feld ist schlicht undefined. */
  profile: null,
  language: null,        // chosen once, before anything else — see LanguagePicker.jsx
  voice: null,           // the assistant's voice, chosen in VoicePicker — a Gemini voice id
  paywallSeen: false,    // das Kaufblatt kam einmal von selbst — siehe Step6Result.jsx
};

export function genId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultBackend() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

/* ── Ein Bereich je Konto (ADR-0009, Hanni 05.10.2026) ────────────────────
 * Die native App gibt jedem Konto auf dem Gerät seinen eigenen Eintrag.
 * Bereiche werden nie KOPIERT, nur ZUGEORDNET — das Verzeichnis unten sagt,
 * welcher Eintrag wem gehört. Kopieren hieße: Fotos als base64 doppelt im
 * ~5-MB-Kontingent, und Leeren nach dem Kopieren kann bei einem Webview mit
 * verspätetem Stand ein ganzes Tagebuch kosten.
 *
 * Ohne Verzeichnis (jedes Gerät bis heute, und die Web-App immer) ist der
 * Gast-Bereich der alte Eintrag DB_KEY — es ändert sich nichts.
 * Die Web-App ruft selectStateKey nie auf und bleibt bei DB_KEY. */
export const SLOTS_KEY = "dreamrushes_slots";
let activeKey = DB_KEY;

/** Ab jetzt lesen und schreiben loadState/saveState diesen Eintrag. */
export function selectStateKey(key) {
  activeKey = key || DB_KEY;
}
export function activeStateKey() {
  return activeKey;
}

function readSlots(backend) {
  try {
    const v = JSON.parse(backend.getItem(SLOTS_KEY));
    if (v && typeof v === "object") {
      return {
        owners: v.owners && typeof v.owners === "object" ? v.owners : {},
        guest: typeof v.guest === "string" && v.guest ? v.guest : DB_KEY,
      };
    }
  } catch { /* kaputt → wie ohne Verzeichnis */ }
  return { owners: {}, guest: DB_KEY };
}

/* Was zum GERÄT gehört, nicht zur Person: Sprache und die Marke „Onboarding
   gesehen" (B4b). Ein neuer Gast-Bereich startet damit, statt nach dem
   Abmelden auf Englisch das ganze Onboarding zu zeigen. Die Einwilligung
   gehört NICHT dazu — die nächste Person am Gerät stimmt selbst zu. */
function deviceSettings(key, backend) {
  try {
    const raw = JSON.parse(backend.getItem(key)) || {};
    return { language: raw.language ?? null, onboarded: !!raw.onboarded };
  } catch {
    return { language: null, onboarded: false };
  }
}

/**
 * Der Eintrag für dieses Konto (null = Gast). Hat das Konto noch keinen,
 * übernimmt es den AKTUELLEN Gast-Bereich so, wie er ist — das heutige
 * Geräte-Journal, oder was ein Gast vor dem Anmelden gespeichert hat.
 * Der Gast bekommt einen neuen, leeren Eintrag `<DB_KEY>@guest-<konto>`.
 *
 * Eindeutig: Jede Brücke, die vom selben Verzeichnis ausgeht, schreibt
 * dieselbe Zuordnung — darum dürfen mehrere zugleich fragen.
 * Scheitert das Schreiben (Kontingent), gilt der Gast-Eintrag weiter, also
 * das Verhalten von vor ADR-0009.
 */
export function slotFor(accountId, backend = defaultBackend()) {
  if (!backend) return DB_KEY;
  const slots = readSlots(backend);
  if (!accountId) return slots.guest;
  if (slots.owners[accountId]) return slots.owners[accountId];
  const claimed = slots.guest;
  const guest = `${DB_KEY}@guest-${accountId}`;
  try {
    backend.setItem(SLOTS_KEY, JSON.stringify({ owners: { ...slots.owners, [accountId]: claimed }, guest }));
  } catch {
    return claimed;
  }
  try {
    if (backend.getItem(guest) === null) backend.setItem(guest, JSON.stringify(deviceSettings(claimed, backend)));
  } catch { /* der Gast startet dann mit den Vorgaben */ }
  return claimed;
}

/**
 * Konto gelöscht: Sein Bereich wird wieder der Gast-Bereich — der
 * Löschdialog verspricht „Träume auf diesem Gerät bleiben". Der bisherige
 * Gast-Eintrag bleibt liegen (nicht löschen: er kann ungesicherte Texte
 * enthalten).
 */
export function releaseSlot(accountId, backend = defaultBackend()) {
  if (!backend || !accountId) return;
  const { owners } = readSlots(backend);
  const key = owners[accountId];
  if (!key) return;
  const rest = { ...owners };
  delete rest[accountId];
  try {
    backend.setItem(SLOTS_KEY, JSON.stringify({ owners: rest, guest: key }));
  } catch { /* Kontingent voll: der Bereich bleibt unsichtbar, nichts geht verloren */ }
}

export function loadState(backend = defaultBackend()) {
  if (!backend) return structuredClone(DEFAULT_STATE);
  try {
    const raw = JSON.parse(backend.getItem(activeKey)) || {};
    const s = { ...DEFAULT_STATE, ...raw };
    // Spread first so a stored null/undefined cannot knock the default back
    // out.
    s.cast = (s.cast || []).map((p) => ({
      ...p, id: p.id || genId("c"), category: p.category || "person",
    }));
    if (!Array.isArray(s.journal)) s.journal = [];
    if (!Array.isArray(s.events)) s.events = [];
    if (typeof s.credits !== "number") s.credits = 0;
    return s;
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

// Reference photos are base64 in localStorage, so the ~5 MB quota is
// reachable. A throw here used to disable the summon button forever — so:
// fail loudly, but stay usable.
export function saveState(state, backend = defaultBackend()) {
  if (!backend) return false;
  try {
    backend.setItem(activeKey, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("[DreamRushes] save failed:", err);
    return false;
  }
}
