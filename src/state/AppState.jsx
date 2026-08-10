import { createContext, useContext, useState, useCallback } from "react";
import { loadState, saveState, DB_KEY } from "../lib/storage.js";
import { buildSeedJournal } from "../lib/seedJournal.js";
import { t } from "../i18n/index.js";

/* The whole app state in one place. Every change goes through update() and is
   saved immediately — there is no second path into storage. That is
   deliberate: two write paths would drift apart over time. */
const Ctx = createContext(null);

// ⚠️ TEMPORARY (10.08.2026, Anton) — see seedJournal.js for why and how to
// remove. Only fires when nothing was EVER saved for this browser (the raw
// key is null, not just an empty journal), so it can never overwrite a
// journal someone actually built or deliberately emptied.
function loadInitialState() {
  const s = loadState();
  const fresh = typeof localStorage !== "undefined" && localStorage.getItem(DB_KEY) === null;
  if (!fresh || s.journal.length > 0) return s;
  const seed = buildSeedJournal();
  return { ...s, journal: seed.journal, creatures: [...(s.creatures || []), ...seed.creatures] };
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadInitialState);
  const [toastText, setToastText] = useState("");

  const toast = useCallback((text) => {
    setToastText(text);
    setTimeout(() => setToastText(""), 2600);
  }, []);

  // Always build a new object, never mutate the existing one — otherwise
  // React skips the re-render and the bug becomes near-impossible to find.
  const update = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (!saveState(next)) toast(t.errors.storageFull);
      return next;
    });
  }, [toast]);

  /* No silent grant on mount anymore: the welcome credits are the reward for
   * the onboarding survey (Onboarding.jsx / ProfileScreen.jsx). A gift with
   * a face converts; a balance that was always there is furniture. People
   * from before the survey keep what they were given — welcomeGrant() stays
   * idempotent via its flag. */

  return (
    <Ctx.Provider value={{ state, setState, update, toast, toastText }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState used outside AppStateProvider");
  return v;
}
