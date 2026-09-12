import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import LegacyApp from "@/legacy/legacy-app";

/* Ein nativer Bildschirm, in dem ein Bildschirm der alten Oberfläche läuft.
   Bei jedem Fokus zählt `tick` hoch; der Webview liest daraufhin seinen
   Zustand neu aus dem localStorage (siehe legacy-app.jsx). `view` wählt
   einen Abschnitt darin (Schlaf: checklist/sounds/guide/symbols). */
export function LegacyTab({ screen, view }: { screen: "home" | "journal" | "dream" | "sleep" | "profile"; view?: string }) {
  const [tick, setTick] = useState(0);
  useFocusEffect(useCallback(() => { setTick((t) => t + 1); }, []));
  return (
    <LegacyApp
      screen={screen}
      view={view}
      focusTick={tick}
      dom={{
        style: { flex: 1, backgroundColor: "#0a0d16" },
        contentInsetAdjustmentBehavior: "never",
        scrollEnabled: true,
      }}
    />
  );
}
