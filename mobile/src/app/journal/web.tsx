import { Stack } from "expo-router";
import { LegacyTab } from "@/components/legacy-tab";

/* Übergang: das ganze Web-Journal mit seinen Nebenräumen (Besetzung, Atlas,
   Menagerie, Kalender), bis die nativ sind. */
export default function JournalWebScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "More", headerLargeTitle: false }} />
      <LegacyTab screen="journal" />
    </>
  );
}
