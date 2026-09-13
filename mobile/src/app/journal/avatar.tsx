import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AvatarEditor } from "@/components/avatar-editor";

/* Der Avatar-Dialog im Journal-Stapel: anlegen (category "any" → Gattung
   im Dialog) oder bearbeiten (edit = id). Zurück landet wieder in der
   Besetzung. Seit 13.09. nativ (components/avatar-editor.tsx). */
export default function JournalAvatarScreen() {
  const { category, edit } = useLocalSearchParams<{ category?: string; edit?: string }>();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AvatarEditor mode={edit ? "edit" : "new"} id={edit ? String(edit) : undefined} category={category ? String(category) : undefined} onDone={() => router.back()} />
    </>
  );
}
