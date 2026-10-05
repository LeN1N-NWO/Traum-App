import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import JournalBridge from "@/legacy/journal-bridge";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { pushProfile, restoreSession, getAccessToken, useBridgeAccount } from "@/lib/auth";
import { useMediaKey } from "@/lib/media-key";
import { setOnboardingGone, setOnboardingSeen } from "@/store/dev-store";
import { setJournal, useJournalStore, type BridgeCommand, type JournalSnapshot, type OnboardData } from "@/store/journal-store";
import { colors } from "@/theme";

/* Das Onboarding, vollbild über allem — EINMAL (B4b, Hanni 05.10.2026, vor
   TestFlight). Ob es schon durchlaufen ist, weiß die Brücke dauerhaft
   (`state.onboarded`, gesetzt vom Befehl `onboarded`) und meldet es im
   ersten Stand (`snapshot().onboarded`). Erst dann entscheidet das Tor —
   vorher zeigt es nichts, damit Wiederkehrende nichts aufblitzen sehen.
 *
 * Bewusst die Brücke und nicht der Schlüsselbund: der überlebt auf iOS eine
 * Neuinstallation — wer die App neu installiert, hat ein leeres Journal und
 * soll das Onboarding wieder sehen. Die Brücke vergisst mit der App.
 *
 * Antons Wunsch vom 13./18.09. („immer beim Start den Onboarding-Screen",
 * zum Prüfen auf dem iPhone) bleibt als Schalter: EXPO_PUBLIC_ONBOARDING_
 * ALWAYS=1 in mobile/.env. Der Wert wird beim Bündeln eingebacken — ein
 * TestFlight-Bau darf ihn nicht tragen; der Preflight (B4b) prüft das.
 *
 * ⚠ Als Modal im Wurzel-Layout, NICHT als Route: Die Wurzel ist die
 * NativeTabs-Leiste; eine Datei daneben (`app/onboarding.tsx`) hat keinen
 * Navigator, der sie aufschieben könnte — `router.push` lief ins Leere.
 * Dasselbe Muster wie das Consent-Tor.
 *
 * Eigene Brücke, weil das Wurzel-Layout keinen Bildschirm-Fokus hat: Texte
 * kommen aus ihr, die Antworten gehen als Befehl `onboarded` zurück (dort
 * rechnet `profileFromAnswers` sie ins Profil, wie im Web). Sie liegt
 * AUSSERHALB des Modals: ein geschlossenes Modal rendert nichts, und die
 * Brücke muss melden, bevor es überhaupt aufgeht. */
const ALWAYS = process.env.EXPO_PUBLIC_ONBOARDING_ALWAYS === "1";

export function OnboardingGate() {
  const mediaKey = useMediaKey();   // S2: signierte Medienadressen in der Web-Ansicht
  const bridgeAccount = useBridgeAccount();   // ADR-0009: Bereich je Konto
  const data = useJournalStore();
  /* checking: erster Stand der Brücke steht aus · open: Onboarding läuft ·
     done: nicht (mehr) nötig. */
  const [phase, setPhase] = useState<"checking" | "open" | "done">("checking");
  /* Nach dem Abschluss bleibt die Brücke, bis sie `onboarded` bestätigt —
     sonst stürbe der Befehl mit ihr. */
  const [saving, setSaving] = useState(false);
  const decided = useRef(false);
  // ⚠ Pruefhilfe: mit `__ONB_STEP__` (global, nur __DEV__) startet der Fluss
  // bei einem bestimmten Schritt — so lassen sich alle Bildschirme ohne
  // Tippen fotografieren (Redirect-Trick fuer Bildschirme ohne Route).
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  const onJournal = useCallback(async (snap: JournalSnapshot) => {
    setJournal(snap);
    if (!decided.current) {
      decided.current = true;
      if (ALWAYS || !snap.onboarded) setPhase("open");
      else {
        /* Schon durch: nichts zeigen, Einwilligungs-Tor und Erinnerungen
           sofort freigeben (beide warten auf diese Marken). */
        setOnboardingSeen();
        setOnboardingGone();
        setPhase("done");
      }
    }
    if (snap.onboarded) setSaving(false);
  }, []);
  const raw = data?.onboard;
  // Wer schon angemeldet ist, sieht im Anmelde-Schritt sein Konto statt der Felder.
  useEffect(() => { restoreSession().catch(() => {}); }, []);

  /* Die Sätze mit Zahl kommen als Vorlage mit Platzhalter 1000 an — die
     Sprachdateien halten die Zahlwörter, nicht dieser Bildschirm. */
  const O: OnboardData | null = raw ? {
    ...raw,
    sleepYears: (y: number) => raw.sleepYearsTpl.replace("1000", String(y)),
    sleepDream: (y: number) => raw.sleepDreamTpl.replace("1000", String(y)),
  } : null;

  return (
    <>
      <Modal visible={phase === "open"} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}} onDismiss={setOnboardingGone}>
        {/* Eigene Gesten-Wurzel: Ein Modal liegt außerhalb der des Layouts —
            ohne sie zieht sich der Mond-Regler (SleepScale) nicht. */}
        <GestureHandlerRootView style={styles.screen}>
          {O ? (
            <OnboardingFlow
              O={O}
              onPhoto={(photo) => { n.current += 1; setCommand({ type: "mePhoto", n: n.current, photo }); }}
              onDone={(answers) => {
                n.current += 1;
                setCommand({ type: "onboarded", n: n.current, answers });
                /* Mit Konto folgt das Profil in die Datenbank (PATCH
                   /api/account) — ohne Konto passiert nichts, das Gerät
                   bleibt die Wahrheit (Hannis Übergabe). */
                pushProfile({ display_name: answers.name || undefined, language: data?.language, onboarded: true, survey_done: true, survey: answers }).catch(() => {});
                setOnboardingSeen();
                setSaving(true);
                setPhase("done");
              }}
            />
          ) : null}
        </GestureHandlerRootView>
      </Modal>
      {phase !== "done" || saving ? (
        <View style={styles.bridge}>
          <JournalBridge getToken={getAccessToken} mediaKey={mediaKey} account={bridgeAccount} onJournal={onJournal} onResult={async () => {}} refreshTick={0} command={command} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bridge: { height: 0, overflow: "hidden" },
});
