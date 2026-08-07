import { createContext, useContext, useState, useCallback } from "react";
import { loadState, saveState } from "../lib/storage.js";
import { t } from "../i18n/index.js";

/* The whole app state in one place. Every change goes through update() and is
   saved immediately — there is no second path into storage. That is
   deliberate: two write paths would drift apart over time. */
const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadState);
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
