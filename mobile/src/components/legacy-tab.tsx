import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyApp from "@/legacy/legacy-app";
import { getAccessToken } from "@/lib/auth";
import { useMediaKey } from "@/lib/media-key";

/* Ein nativer Bildschirm, in dem ein Bildschirm der alten Oberfläche läuft.
   Bei jedem Fokus zählt `tick` hoch; der Webview liest daraufhin seinen
   Zustand neu aus dem localStorage (siehe legacy-app.jsx). `view` wählt
   einen Abschnitt darin (Schlaf: checklist/sounds/guide/symbols). */
export function LegacyTab({ screen, view }: { screen: "home" | "journal" | "dream" | "sleep" | "profile"; view?: string }) {
  const mediaKey = useMediaKey();   // S2: signierte Medienadressen in der Web-Ansicht
  const [tick, setTick] = useState(0);
  const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { setTick((t) => t + 1); }, []));
  /* S2: `key` lädt die Web-Ansicht neu, wenn das Konto wechselt oder der
     erste Schlüssel ankommt. Der React Compiler merkt sich Darstellungen
     nach Props und Zustand — mediaUrl() liest den Schlüssel aber aus einer
     Modulvariable, die er nicht sieht. Ohne Neuladen blieben vorher
     unsigniert berechnete Bildadressen stehen. Ein normales Erneuern
     (gleiches Konto) lädt nicht neu. */
  return (
    <LegacyApp
      key={mediaKey?.uid ?? "ohne"}
      getToken={getAccessToken} mediaKey={mediaKey}
      screen={screen}
      view={view}
      focusTick={tick}
      safeTop={insets.top}
      safeBottom={insets.bottom}
      dom={{
        style: { flex: 1, backgroundColor: "#0a0d16" },
        contentInsetAdjustmentBehavior: "never",
        scrollEnabled: true,
      }}
    />
  );
}
