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
  credits: 0,   // stand-in — real balance needs the backend, see the spec
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
    const raw = JSON.parse(backend.getItem(DB_KEY)) || {};
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
    backend.setItem(DB_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("[DreamRushes] save failed:", err);
    return false;
  }
}
