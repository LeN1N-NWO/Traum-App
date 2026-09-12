import { Stack } from "expo-router";
import { colors } from "@/theme";

/* Der Wizard als Stapel: Erzählen → Stil → Länge → Auftrag. */
/* ⚠ Keine <Stack.Screen>-Kinder im Layout: Das erste deklarierte Kind wird
   zur Startroute (Antons Befund 12.09.: „in jedem Tab Credits kaufen"), und
   die Optionen aus den Bildschirmen selbst greifen dann nicht mehr (Kopf
   „voice" trotz headerShown:false). Blätter, die als Karte kommen, stehen
   hier in der Funktion — je Routenname. */
export const unstable_settings = { initialRouteName: "index" };

export default function DreamLayout() {
  return (
    <Stack screenOptions={({ route }) => ({
      headerTransparent: true, headerTintColor: colors.accentSoft, headerTitleStyle: { color: colors.text }, headerBackButtonDisplayMode: "minimal" as const, contentStyle: { backgroundColor: colors.bg },
      ...(route.name === "paywall" ? { presentation: "modal" as const, headerShown: false } : {}),
    })} />
  );
}
