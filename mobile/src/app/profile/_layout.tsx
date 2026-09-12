import { Stack } from "expo-router";
import { colors } from "@/theme";

/* ⚠ Keine <Stack.Screen>-Kinder im Layout: Das erste deklarierte Kind wird
   zur Startroute (Antons Befund 12.09.: „in jedem Tab Credits kaufen"), und
   die Optionen aus den Bildschirmen selbst greifen dann nicht mehr (Kopf
   „voice" trotz headerShown:false). Blätter, die als Karte kommen, stehen
   hier in der Funktion — je Routenname. */
export const unstable_settings = { initialRouteName: "index" };

const CARDS = new Set(["paywall", "voice"]);
const SMALL = new Set(["settings", "legal"]);

export default function ProfileLayout() {
  return (
    <Stack screenOptions={({ route }) => ({
      headerLargeTitle: !SMALL.has(route.name) && !CARDS.has(route.name), headerTransparent: true, headerTintColor: colors.accentSoft,
      headerTitleStyle: { color: colors.text }, headerLargeTitleStyle: { color: colors.text }, contentStyle: { backgroundColor: colors.bg },
      ...(CARDS.has(route.name) ? { presentation: "modal" as const, headerShown: false } : {}),
    })} />
  );
}
