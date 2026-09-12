import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerLargeTitle: true, headerTransparent: true, headerTintColor: colors.accentSoft, headerTitleStyle: { color: colors.text }, headerLargeTitleStyle: { color: colors.text }, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="paywall" options={{ presentation: "modal", headerShown: false, headerLargeTitle: false }} />
    </Stack>
  );
}
