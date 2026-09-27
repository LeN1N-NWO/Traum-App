import { useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { NavigationContext } from "expo-router/react-navigation";

/* Ist dieser Bildschirm gerade zu sehen? (27.09., iOS meldete 56 % Dauerlast)
   Die Tabs bleiben montiert — ohne diese Abfrage liefen Leuchtrand und
   Glühwürmchen auf ALLEN Tabs weiter, jedes Bild neu gezeichnet. Außerhalb
   eines Navigators (Onboarding, Modals) gilt: sichtbar, solange die App im
   Vordergrund ist. `useIsFocused` von React Navigation wirft dort. */
export function useScreenActive() {
  const nav = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => (nav ? nav.isFocused() : true));
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    if (!nav) return;
    setFocused(nav.isFocused());
    const a = nav.addListener("focus", () => setFocused(true));
    const b = nav.addListener("blur", () => setFocused(false));
    return () => { a(); b(); };
  }, [nav]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setForeground(s === "active"));
    return () => sub.remove();
  }, []);
  return focused && foreground;
}
