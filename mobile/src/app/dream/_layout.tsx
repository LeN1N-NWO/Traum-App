import { Stack } from "expo-router";
import { colors } from "@/theme";

/* Der Wizard als Stapel: Erzählen → Stil → Länge → Auftrag. */
export default function DreamLayout() {
  return (
    <Stack screenOptions={{ headerTransparent: true, headerTintColor: colors.accentSoft, headerTitleStyle: { color: colors.text }, headerBackButtonDisplayMode: "minimal", contentStyle: { backgroundColor: colors.bg } }} />
  );
}
