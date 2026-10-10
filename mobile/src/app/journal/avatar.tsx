import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AvatarEditor } from "@/components/avatar-editor";

/* Der Avatar-Dialog im Journal-Stapel: anlegen (category "any" → Gattung
   im Dialog) oder bearbeiten (edit = id). Zurück landet wieder in der
   Besetzung. Seit 13.09. nativ (components/avatar-editor.tsx). `tag`
   (10.10., Casting): ein Name aus den Träumen ist schon eingetragen. */
export default function JournalAvatarScreen() {
  const { category, edit, tag } = useLocalSearchParams<{ category?: string; edit?: string; tag?: string }>();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AvatarEditor mode={edit ? "edit" : "new"} id={edit ? String(edit) : undefined} category={category ? String(category) : undefined} tag={tag ? String(tag) : undefined} onDone={() => router.back()} />
    </>
  );
}
