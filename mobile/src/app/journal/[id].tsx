import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import LegacyDream from "@/legacy/legacy-dream";

/* Die Traum-Seite — heute noch die Web-Seite, per Stack aufgeschoben. Der
   native Kopf bleibt aus: die Seite bringt ihren Zurück-Pfeil mit, und die
   Zurück-Geste vom Rand liefert der Stack. */
export default function DreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LegacyDream
        entryId={String(id)}
        onClose={async () => { router.back(); }}
        dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }}
      />
    </>
  );
}
