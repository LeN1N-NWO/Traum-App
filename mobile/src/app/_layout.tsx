import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

/* Die Hülle. Heute EIN Bildschirm, in dem die alte Oberfläche läuft; die
   nativen Tabs kommen, sobald das steht (ADR-0006: fünf Tabs, Traum in der
   Mitte). Dunkles Schema und helle Statusleiste, wie die App es braucht. */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0a0d16" } }} />
    </>
  );
}
