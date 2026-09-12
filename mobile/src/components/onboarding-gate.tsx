import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyOnboarding from "@/legacy/legacy-onboarding";
import { onboardingSeen, setOnboardingSeen } from "@/store/dev-store";
import { colors } from "@/theme";

/* Das Onboarding, vollbild über allem — bei JEDEM Start im
   Entwicklungsbau (Antons Wunsch 13.09.: „ich möchte den Onboarding-Screen
   jetzt erst mal immer sehen, weil ich in der Entwicklung bin").
 *
 * ⚠ Als Modal im Wurzel-Layout, NICHT als Route: Die Wurzel ist die
 * NativeTabs-Leiste; eine Datei daneben (`app/onboarding.tsx`) hat keinen
 * Navigator, der sie aufschieben könnte — `router.push` lief ins Leere
 * (Befund 13.09.). Dasselbe Muster wie das Consent-Tor.
 *
 * Noch der Web-Baustein (legacy-onboarding.jsx): Ablauf, Umfrage und
 * Willkommens-Credits hängen an `Onboarding.jsx`. Anton geht ihn durch und
 * sagt, was bleibt; dann wird Bildschirm für Bildschirm nativ. */
export function OnboardingGate() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(() => __DEV__ && !onboardingSeen());
  if (!__DEV__) return null;
  return (
    <Modal visible={open} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
      <View style={styles.screen}>
        <LegacyOnboarding
          safeTop={insets.top} safeBottom={insets.bottom}
          onDone={async () => { setOnboardingSeen(); setOpen(false); }}
          dom={{ style: { flex: 1, backgroundColor: colors.bg }, contentInsetAdjustmentBehavior: "never" }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg } });
