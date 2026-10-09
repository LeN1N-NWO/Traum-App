import { Stack } from "expo-router";
import { colors } from "@/theme";

/* Die Startseite als eigener Stapel (Antons Befund 10.10.): Ein Traum, den
 * man im Traumfänger antippt, öffnet sich HIER — „Zurück" führt wieder zur
 * Startseite, nicht ins Journal. Die Traum-Seite selbst ist dieselbe wie im
 * Journal (night/[id].tsx reicht journal/[id].tsx durch).
 * ⚠ Keine <Stack.Screen>-Kinder im Layout (siehe journal/_layout.tsx) —
 * Optionen je Routenname in der Funktion. */
export const unstable_settings = { initialRouteName: "index" };

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerShown: route.name !== "index",
        headerLargeTitle: false,
        headerTransparent: true,
        headerTintColor: colors.accentSoft,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      })}
    />
  );
}
