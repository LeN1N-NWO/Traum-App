import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";

/* Der Wizard-Kopf aus WizardShell.jsx: Fortschrittspunkte (sechs Schritte
   wie im Web) und „Abbrechen", das nach Hause führt. Zurück liefert der
   Stack. */
export function WizardHeader({ step, cancel }: { step: number; cancel?: string }) {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => { Haptics.selectionAsync(); router.navigate("/"); }}>{cancel ?? "Cancel"}</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View style={styles.dots} pointerEvents="none">
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.dot, i + 1 === step && styles.now, i + 1 < step && styles.done]} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 4 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.panelLine },
  done: { backgroundColor: colors.accentDeep },
  now: { width: 20, backgroundColor: colors.accentSoft },
});
