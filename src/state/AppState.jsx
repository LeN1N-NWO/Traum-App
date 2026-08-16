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
  /* Warum der Anlass mitwandert und nicht nur „auf/zu": Ein Kaufblatt, das
     jemand SELBST geöffnet hat, darf mit dem Angebot beginnen. Eines, das
     ihm gerade in den Weg gesprungen ist, muss zuerst erklären, warum — sonst
     liest es sich als Hinterhalt. Der Anlass steuert die Überschrift, siehe
     Paywall.jsx. */
  const [paywall, setPaywall] = useState(null);   // null | "browse" | "spent" | "first" 

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

  /* Eine Mechanik statt fünf Flicken. Vor dem 16.08.2026 endeten fünf
     Stellen im selben Toast „Aufladen kommt bald" — die teuersten Momente
     der App, jeder eine Sackgasse. Jetzt kann jeder Bildschirm das Kaufblatt
     öffnen, ohne es selbst einzuhängen. */
  const openPaywall = useCallback((reason = "browse") => setPaywall(reason), []);
  const closePaywall = useCallback(() => setPaywall(null), []);

  return (
    <Ctx.Provider value={{
      state, setState, update, toast, toastText,
      paywall, openPaywall, closePaywall,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState used outside AppStateProvider");
  return v;
}
