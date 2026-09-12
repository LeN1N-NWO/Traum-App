import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";

/* Der Wizard-Kopf aus WizardShell.jsx: die Fortschrittspunkte sitzen als
   Titel in der nativen Kopfzeile — zwischen Zurück und „Abbrechen", wie im
   Web. Sechs Schritte. Zurück liefert der Stack, Abbrechen führt nach Hause. */
export function WizardHeader({ step, cancel }: { step: number; cancel?: string }) {
  const router = useRouter();
  return (
    <>
      <Stack.Screen.Title asChild>
        <View style={styles.dots} accessibilityLabel={`Step ${step} of 6`}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={[styles.dot, i + 1 === step && styles.now, i + 1 < step && styles.done]} />
          ))}
        </View>
      </Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => { Haptics.selectionAsync(); router.navigate("/"); }}>{cancel ?? "Cancel"}</Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.panelLine },
  done: { backgroundColor: colors.accentDeep },
  now: { width: 20, backgroundColor: colors.accentSoft },
});
