import { Stack, useLocalSearchParams } from "expo-router";
import { LegacyTab } from "@/components/legacy-tab";

/* Ein Schlaf-Raum als Web-Seite (Checkliste, Klänge, Guide, Symbole). Der
   Web-Bildschirm bringt seinen eigenen Rückweg mit; der native Kopf bleibt
   aus, die Zurück-Geste liefert der Stack. */
export default function SleepSectionScreen() {
  const { view } = useLocalSearchParams<{ view: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyTab screen="sleep" view={String(view)} />
    </>
  );
}
