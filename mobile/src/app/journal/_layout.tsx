import { Stack } from "expo-router";
import { colors } from "@/theme";

/* Das Journal ist ein Stapel: Liste → Traum. Große Titel, dunkler Grund. */
/* ⚠ Keine <Stack.Screen>-Kinder im Layout: Das erste deklarierte Kind wird
   zur Startroute (Antons Befund 12.09.: „in jedem Tab Credits kaufen"), und
   die Optionen aus den Bildschirmen selbst greifen dann nicht mehr (Kopf
   „voice" trotz headerShown:false). Blätter, die als Karte kommen, stehen
   hier in der Funktion — je Routenname. */
export const unstable_settings = { initialRouteName: "index" };

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerLargeTitle: route.name !== "paywall",
        headerTransparent: true,
        headerTintColor: colors.accentSoft,
        headerTitleStyle: { color: colors.text },
        headerLargeTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
        ...(route.name === "paywall" ? { presentation: "modal" as const, headerShown: false } : {}),
      })}
    />
  );
}
