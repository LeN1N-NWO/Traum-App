import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import LegacyDream from "@/legacy/legacy-dream";

/* Die Web-Traumseite mit ALLEN Aktionen (Film machen, Umschreiben,
   Bearbeiten, Teilen, Fassungen) — erreichbar aus der nativen Traumseite,
   bis die Aktionen nativ sind. Kein nativer Kopf: die Seite bringt ihren
   Pfeil mit, die Zurück-Geste liefert der Stack. */
export default function WebDreamScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyDream
        safeTop={insets.top} safeBottom={insets.bottom}
        entryId={String(id)}
        onClose={async () => { router.back(); }}
        dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }}
      />
    </>
  );
}
