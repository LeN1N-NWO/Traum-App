import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AvatarEditor } from "@/components/avatar-editor";

/* Neue Person/Ort mit Foto — IM Traum-Stapel, damit Zurück wieder in die
   Besetzung führt (Antons Befund: landete im Profil-Tab). Seit 13.09.
   nativ (components/avatar-editor.tsx); die Besetzung fragt beim Fokus
   neu und findet den neuen Eintrag über seinen Namen. */
export default function DreamAvatarScreen() {
  const { category, tag } = useLocalSearchParams<{ category?: string; tag?: string }>();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AvatarEditor mode="new" category={category ? String(category) : "person"} tag={tag ? String(tag) : undefined} onDone={() => router.back()} />
    </>
  );
}
