/* Speicherschicht. Bewusst ohne React und ohne DOM — dadurch prüfbar.
 *
 * Der Schlüssel bleibt dreamrushes_v1. Alle Ergänzungen sind optionale Felder
 * mit Vorgabewert: ein Schema-Bruch wäre Datenverlust in echten
 * Traumtagebüchern, nicht bloß ein Migrationsaufwand.
 */
export const DB_KEY = "dreamrushes_v1";

export const DEFAULT_STATE = {
  creatures: [], lastDream: null, streak: 0,
  mode: "sequence", cons: "standard",
  me: null, cast: [], journal: [], events: [],
  credits: 0,   // Platzhalter — echtes Guthaben braucht ein Backend, siehe Spec
};

export function genId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultBackend() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function loadState(backend = defaultBackend()) {
  if (!backend) return structuredClone(DEFAULT_STATE);
  try {
    const roh = JSON.parse(backend.getItem(DB_KEY)) || {};
    const s = { ...DEFAULT_STATE, ...roh };
    // Zuerst spreizen, damit ein gespeichertes null/undefined die Vorgabe
    // nicht wieder herausschlägt.
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

// Referenzfotos liegen als base64 im Speicher, das ~5-MB-Kontingent ist
// erreichbar. Ein Wurf hier hat früher den Beschwören-Knopf dauerhaft
// gesperrt — deshalb: laut scheitern, aber bedienbar bleiben.
export function saveState(state, backend = defaultBackend()) {
  if (!backend) return false;
  try {
    backend.setItem(DB_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("[DreamRushes] Speichern fehlgeschlagen:", err);
    return false;
  }
}
