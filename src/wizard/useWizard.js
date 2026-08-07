import { useState, useCallback } from "react";
import { useAppState } from "../state/AppState.jsx";

/* All wizard state in one hook, so each step component stays a pure view.
 *
 * `assignments` is the heart of it: one entry per character or place the
 * analysis found, keyed by the name the analysis used. Each is either bound to
 * an avatar, marked free (the model invents it), or still undecided.
 */

/** Words a first-person mention can take, mapped to the @me avatar. */
const SELF_WORDS = new Set(["i", "me", "myself", "the dreamer", "myself (the dreamer)"]);

function normalise(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Find an existing avatar whose tag matches the analysed name unambiguously. */
export function autoMatch(name, cast, me) {
  const plain = String(name || "").trim().toLowerCase();
  if (SELF_WORDS.has(plain) && me?.img) {
    return { tag: "me", img: me.img, desc: "", id: "me" };
  }
  const key = normalise(name);
  if (!key) return null;
  const hits = (cast || []).filter((c) => normalise(c.tag) === key);
  return hits.length === 1 ? hits[0] : null;
}

const EMPTY = {
  step: 1,
  text: "",
  originalText: "",
  analysis: null,
  mode: null,          // "save" | "images" | "film"
  imageCount: 5,
  assignments: {},     // name -> { name, kind, avatar?, free? }
  styleId: "dreamlike",
  format: "9:16",
  urls: null,
};

export function useWizard() {
  const { state } = useAppState();
  const [w, setW] = useState(EMPTY);

  const patch = useCallback((p) => setW((prev) => ({ ...prev, ...p })), []);
  const reset = useCallback(() => setW(EMPTY), []);

  /** Seed the character/place tiles from an analysis, auto-matching what we can. */
  const seedAssignments = useCallback((analysis) => {
    const build = (names, kind) =>
      (names || []).reduce((acc, name) => {
        const avatar = autoMatch(name, state.cast, state.me);
        acc[name] = { name, kind, ...(avatar ? { avatar } : {}) };
        return acc;
      }, {});
    setW((prev) => ({
      ...prev,
      assignments: { ...build(analysis.people, "person"), ...build(analysis.places, "place") },
    }));
  }, [state.cast, state.me]);

  const assign = useCallback((name, value) => {
    setW((prev) => ({
      ...prev,
      assignments: { ...prev.assignments, [name]: { ...prev.assignments[name], ...value } },
    }));
  }, []);

  const dropAssignment = useCallback((name) => {
    setW((prev) => {
      const next = { ...prev.assignments };
      delete next[name];
      return { ...prev, assignments: next };
    });
  }, []);

  return { w, patch, reset, seedAssignments, assign, dropAssignment };
}

/** The assignments for one kind, in the order the analysis produced them. */
export function assignmentsOfKind(assignments, kind) {
  return Object.values(assignments).filter((a) => a.kind === kind);
}
