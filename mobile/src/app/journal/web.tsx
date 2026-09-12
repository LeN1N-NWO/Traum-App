import { Stack, useLocalSearchParams } from "expo-router";
import { LegacyTab } from "@/components/legacy-tab";

/* Die Nebenräume des Journals als Web-Seite (Besetzung, Atlas, Menagerie),
   bis sie nativ sind; `view` reist wie im Web im Router-Zustand. */
export default function JournalWebScreen() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyTab screen="journal" view={view ? String(view) : undefined} />
    </>
  );
}
