import { useEffect, useRef } from "react";
import { Modal, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Account } from "@/components/onboarding-flow";
import { useAccount } from "@/lib/auth";
import { closeSignIn, useSignInPrompt } from "@/lib/signin-prompt";
import { useJournalStore, type OnboardData } from "@/store/journal-store";
import { colors } from "@/theme";

/* Das Anmelde-Blatt (S1 Schritt 3): derselbe Anmelde-Schritt wie am Ende
 * des Onboardings — Apple, E-Mail, „Angemeldet als" —, nur als Blatt und
 * ohne Fortschrittsbalken. Kein zweites Design: Wer den Schritt ändert,
 * ändert beide. „Later" schließt es; nach erfolgreicher Anmeldung geht es
 * von selbst zu (Hanni, 03.10.: kein zweiter Tipp auf „Continue").
 *
 * Geöffnet über requestSignIn() (lib/signin-prompt.ts): wenn der Server
 * einen Gast bei etwas Bezahltem abweist, oder aus den Einstellungen. Die
 * Texte kommen aus der Brücke wie im Onboarding; bevor der erste Stand da
 * ist, gibt es nichts zu zeigen. */
export function SignInSheet() {
  const open = useSignInPrompt();
  const raw = useJournalStore()?.onboard;
  const insets = useSafeAreaInsets();
  const account = useAccount();
  /* Wer beim Öffnen Gast war und jetzt ein Konto hat, hat sich gerade
     angemeldet — zurück zum Bildschirm, ohne „Continue". */
  const wasGuest = useRef(false);
  useEffect(() => { if (open) wasGuest.current = !account; }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open && account && wasGuest.current) closeSignIn(); }, [open, account]);
  if (!raw) return null;
  // Account braucht nur die Anmelde-Texte; die beiden Rechen-Vorlagen bleiben ungenutzt.
  const O = { ...raw, sleepYears: () => "", sleepDream: () => "" } as OnboardData;
  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeSignIn}>
      <GestureHandlerRootView style={styles.screen}>
        <Account O={O} insets={{ top: 8, bottom: insets.bottom }} step={0} total={0} onNext={closeSignIn} onBack={closeSignIn} />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
