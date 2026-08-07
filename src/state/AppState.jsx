import { createContext, useContext, useState, useCallback } from "react";
import { loadState, saveState } from "../lib/storage.js";

/* Der gesamte App-Zustand an einer Stelle. Jede Änderung geht durch update()
   und wird sofort gespeichert — es gibt keinen zweiten Weg in den Speicher.
   Das ist Absicht: zwei Schreibpfade würden mit der Zeit auseinanderlaufen. */
const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toastText, setToastText] = useState("");

  const toast = useCallback((text) => {
    setToastText(text);
    setTimeout(() => setToastText(""), 2600);
  }, []);

  // Immer eine neue Struktur erzeugen, nie den Bestand verändern — sonst
  // rendert React nicht neu und der Fehler ist später kaum auffindbar.
  const update = useCallback((teil) => {
    setState((alt) => {
      const neu = { ...alt, ...teil };
      if (!saveState(neu)) toast("⚠ Speicher voll — alte Einträge oder Fotos löschen.");
      return neu;
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
  if (!v) throw new Error("useAppState ausserhalb von AppStateProvider benutzt");
  return v;
}
