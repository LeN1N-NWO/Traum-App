import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyOrder from "@/legacy/legacy-order";
import { useWizardStore } from "@/store/wizard-store";

/* Der Auftrag im Web-Motor: WizardShell springt an Schritt 5, startet genau
   einmal, Schritt 6 zeigt das Warten und legt den Traum ins Journal. Der
   Geldweg bleibt der des Web (Step5Style.run). */
export default function DreamOrderScreen() {
  const insets = useSafeAreaInsets();
  const w = useWizardStore();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <LegacyOrder safeTop={insets.top} safeBottom={insets.bottom} order={{ text: w.text, originalText: w.originalText, analysis: w.analysis, styleId: w.styleId, pace: w.pace, videoModel: w.videoModel, quality: w.quality, seconds: w.seconds, orderId: w.orderId, assignmentOverrides: w.assignmentOverrides, mode: w.mode }} dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }} />
    </>
  );
}
