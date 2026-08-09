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
  entryId: null,       // set when an existing journal dream is being continued
  text: "",
  originalText: "",
  title: "",           // film title for the poster, editable in step 5
  tagline: "",         // poster tagline, editable in step 5
  analysis: null,
  mode: null,          // "save" | "images" | "film"
  imageCount: 5,
  assignments: {},     // name -> { name, kind, avatar?, free? }
  styleId: "dreamlike",
  format: "9:16",
  videoModel: "standard",
  seconds: 6,          // film length; see lib/video.js for each model's range
  urls: null,
  jobId: null,         // set while a film renders in fal's queue
  sourceUrls: null,    // the dream's existing images, when resumed for a film
  keyframe: null,      // which of them the film animates ("/media/…")
};

export function useWizard() {
  const { state } = useAppState();
  const [w, setW] = useState(EMPTY);

  const patch = useCallback((p) => setW((prev) => ({ ...prev, ...p })), []);
  const reset = useCallback(() => setW(EMPTY), []);

  /** Seed the character/place tiles from an analysis, auto-matching what we can.
   *  `people` entries are objects ({name, kind, desc}) since the analysis got
   *  structured; bare strings still work — the local no-LLM fallback sends
   *  those. The desc travels along as `hint` so creating a new avatar can
   *  pre-fill it. */
  const seedAssignments = useCallback((analysis) => {
    const build = (items, fallbackKind) =>
      (items || []).reduce((acc, item) => {
        const name = typeof item === "string" ? item : item?.name;
        if (!name) return acc;
        const kind = typeof item === "object" && item?.kind === "pet" ? "pet" : fallbackKind;
        const hint = (typeof item === "object" && item?.desc) || "";
        const avatar = autoMatch(name, state.cast, state.me);
        acc[name] = { name, kind, hint, ...(avatar ? { avatar } : {}) };
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

/** The assignments for a set of kinds, in the order the analysis produced them. */
export function assignmentsOfKinds(assignments, kinds) {
  return Object.values(assignments).filter((a) => kinds.includes(a.kind));
}
