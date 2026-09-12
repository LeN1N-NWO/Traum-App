import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyPage from "@/legacy/legacy-page";

/* Der Avatar-Dialog (Web) im Journal-Stapel: anlegen (category "any" →
   Gattung im Dialog) oder bearbeiten (edit = id). Zurück landet wieder in
   der Besetzung, nicht in einem anderen Tab. */
export default function JournalAvatarScreen() {
  const { category, edit } = useLocalSearchParams<{ category?: string; edit?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyPage page="avatar" category={category ? String(category) : undefined} editId={edit ? String(edit) : undefined} safeTop={insets.top} safeBottom={insets.bottom}
        onClose={async () => { router.back(); }} dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }} />
    </>
  );
}
