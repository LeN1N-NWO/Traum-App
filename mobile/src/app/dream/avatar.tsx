import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyPage from "@/legacy/legacy-page";

/* Neue Person/Ort mit Foto — IM Traum-Stapel, damit Zurück wieder in die
   Besetzung führt (Antons Befund: landete im Profil-Tab). */
export default function DreamAvatarScreen() {
  const { category, tag } = useLocalSearchParams<{ category?: string; tag?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyPage page="avatar" category={category ? String(category) : "person"} tag={tag ? String(tag) : undefined} safeTop={insets.top} safeBottom={insets.bottom}
        onClose={async () => { router.back(); }} dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }} />
    </>
  );
}
