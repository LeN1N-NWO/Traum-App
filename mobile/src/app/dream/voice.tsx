import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyVoice from "@/legacy/legacy-voice";
import { patchWizard } from "@/store/wizard-store";

/* Das Gespräch (Web-Baustein), voll­bild. Der Traumtext kommt zurück und
   die Lesung startet auf dem Erzähl-Bildschirm von selbst. */
export default function DreamVoiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <LegacyVoice
        safeTop={insets.top} safeBottom={insets.bottom}
        onDone={async (text: string) => { patchWizard({ text, pendingRead: !!text }); router.back(); }}
        onCancel={async () => { router.back(); }}
        dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }}
      />
    </>
  );
}
