import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function SleepLayout() {
  return (
    <Stack screenOptions={{ headerLargeTitle: true, headerTransparent: true, headerTintColor: colors.accentSoft, headerTitleStyle: { color: colors.text }, headerLargeTitleStyle: { color: colors.text }, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
