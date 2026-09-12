import { useLocalSearchParams } from "expo-router";
import { PaywallSheet } from "@/components/paywall-sheet";

/* Das Kaufblatt in diesem Stapel — als Karte (presentation: modal, siehe
   _layout.tsx), damit Zurück wieder hierher führt und der Tab bleibt. */
export default function PaywallScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  return <PaywallSheet reason={reason ? String(reason) : "browse"} />;
}
