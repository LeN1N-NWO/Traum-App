import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";

/* Der Wizard-Kopf aus WizardShell.jsx: die Fortschrittspunkte sitzen als
   Titel in der nativen Kopfzeile — zwischen Zurück und „Abbrechen", wie im
   Web. Sechs Schritte. Zurück liefert der Stack, Abbrechen führt nach Hause.
   Auf Schritt 1 KEIN „Abbrechen" (Antons Befund 10.10.: der Knopf blitzte
   bei jedem Tipp auf den Traum-Tab auf): iOS setzt die Kopfzeilen-Knöpfe
   beim Tab-Wechsel neu, und der Glas-Knopf blendet dabei jedes Mal ein.
   Schritt 1 ist die Wurzel des Tabs — „nach Hause" macht dort die
   Tab-Leiste, verworfen wurde auch vorher nichts. `memo`: der Kopf zeichnet
   nur neu, wenn sich Schritt oder Beschriftung ändern. */
export const WizardHeader = memo(function WizardHeader({ step, cancel }: { step: number; cancel?: string }) {
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
      {step > 1 ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button onPress={() => { Haptics.selectionAsync(); router.navigate("/"); }}>{cancel ?? "Cancel"}</Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.panelLine },
  done: { backgroundColor: colors.accentDeep },
  now: { width: 20, backgroundColor: colors.accentSoft },
});
