import { useState, useCallback } from "react";
import { useAppState } from "../state/AppState.jsx";

/* All wizard state in one hook, so each step component stays a pure view.
 *
 * `assignments` is the heart of it: one entry per character or place the
 * analysis found, keyed by the name the analysis used. Each is either bound to
 * an avatar, marked free (the model invents it), or still undecided.
 */

/* Wörter, hinter denen der Träumer selbst steckt — sie führen aufs eigene
 * Profilbild (@me).
 *
 * ⚠ Die Liste war bis zum 22.08.2026 rein englisch, die Analyse antwortet
 * aber in der SPRACHE DES TRAUMS: Ein deutsch erzählter Traum liefert „Ich",
 * und „Ich" stand nicht drin — Anton bekam für sich selbst eine Fremdfigur
 * angeboten, obwohl sein Porträt längst hinterlegt war („damit er sofort
 * weiß: das bist du"). Deutsch und Englisch werden gepflegt (Übersetzungs-
 * Stopp, AGENTS.md); kommen weitere Sprachen dazu, kommen ihre Selbstwörter
 * hierher.
 *
 * Verglichen wird über normalise(), also ohne Satzzeichen und Leerraum —
 * „Ich (der Träumer)" trifft damit genauso wie „ich". */
const SELF_WORDS = new Set([
  // Englisch
  "i", "me", "myself", "thedreamer", "myselfthedreamer", "ithedreamer",
  // Deutsch
  "ich", "mich", "mir", "ichselbst", "dertraumer", "dietraumerin",
  "ichdertraumer", "ichdietraumerin", "dertraeumer", "dietraeumerin",
]);

function normalise(name) {
  return String(name || "")
    .toLowerCase()
    // Umlaute zusammenfalten, damit „Träumer" und „Traeumer" denselben
    // Schlüssel ergeben — sonst hinge die Erkennung an der Schreibweise,
    // die das Modell gerade wählt.
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

/** Find an existing avatar whose tag matches the analysed name unambiguously. */
export function autoMatch(name, cast, me) {
  if (SELF_WORDS.has(normalise(name)) && me?.img) {
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
  preview: false,      // the cheap look: one render cut into three, see pricing.js
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
