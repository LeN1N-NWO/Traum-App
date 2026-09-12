import { Stack } from "expo-router";
import { LegacyTab } from "@/components/legacy-tab";

/* Übergang: der Web-Wizard mit dem Stimm-Gespräch (Gemini Live), bis die
   Stimme nativ ist. */
export default function DreamVoiceScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyTab screen="dream" />
    </>
  );
}
