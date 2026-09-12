import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyPage from "@/legacy/legacy-page";
import { LegacyTab } from "@/components/legacy-tab";

/* Web-Blätter des Profils: settings, avatar, paywall — und `survey`, das
   heute noch das ganze Web-Profil braucht (Sprach- und Formularumfrage). */
export default function ProfilePageScreen() {
  const { page, category, tag } = useLocalSearchParams<{ page: string; category?: string; tag?: string }>();
  const router = useRouter();
  const p = String(page);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {p === "survey"
        ? <LegacyTab screen="profile" />
        : <LegacyPage page={p} safeTop={insets.top} safeBottom={insets.bottom} category={category ? String(category) : undefined} tag={tag ? String(tag) : undefined} onClose={async () => { router.back(); }} dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }} />}
    </>
  );
}
