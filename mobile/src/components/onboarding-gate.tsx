import { useCallback, useRef, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import JournalBridge from "@/legacy/journal-bridge";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { onboardingSeen, setOnboardingSeen } from "@/store/dev-store";
import { setJournal, useJournalStore, type BridgeCommand, type JournalSnapshot, type OnboardData } from "@/store/journal-store";
import { colors } from "@/theme";

/* Das Onboarding, vollbild über allem — bei JEDEM Start im
   Entwicklungsbau (Antons Wunsch 12.09.: „ich möchte den Onboarding-Screen
   jetzt erst mal immer sehen, weil ich in der Entwicklung bin").
 *
 * ⚠ Als Modal im Wurzel-Layout, NICHT als Route: Die Wurzel ist die
 * NativeTabs-Leiste; eine Datei daneben (`app/onboarding.tsx`) hat keinen
 * Navigator, der sie aufschieben könnte — `router.push` lief ins Leere.
 * Dasselbe Muster wie das Consent-Tor.
 *
 * Eigene Brücke, weil das Wurzel-Layout keinen Bildschirm-Fokus hat: Texte
 * kommen aus ihr, die Antworten gehen als Befehl `onboarded` zurück (dort
 * rechnet `profileFromAnswers` sie ins Profil, wie im Web). */
export function OnboardingGate() {
  const data = useJournalStore();
  const [open, setOpen] = useState(() => __DEV__ && !onboardingSeen());
  // ⚠ Pruefhilfe: mit `__ONB_STEP__` (global, nur __DEV__) startet der Fluss
  // bei einem bestimmten Schritt — so lassen sich alle Bildschirme ohne
  // Tippen fotografieren (Redirect-Trick fuer Bildschirme ohne Route).
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(snap); }, []);
  const raw = data?.onboard;
  if (!__DEV__) return null;

  /* Die Sätze mit Zahl kommen als Vorlage mit Platzhalter 1000 an — die
     Sprachdateien halten die Zahlwörter, nicht dieser Bildschirm. */
  const O: OnboardData | null = raw ? {
    ...raw,
    sleepYears: (y: number) => raw.sleepYearsTpl.replace("1000", String(y)),
    sleepDream: (y: number) => raw.sleepDreamTpl.replace("1000", String(y)),
  } : null;

  return (
    <Modal visible={open} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
      <View style={styles.screen}>
        {O ? (
          <OnboardingFlow
            O={O}
            onDone={(answers) => {
              n.current += 1;
              setCommand({ type: "onboarded", n: n.current, answers });
              setOnboardingSeen();
              setOpen(false);
            }}
          />
        ) : null}
        <View style={styles.bridge}>
          <JournalBridge onJournal={onJournal} onResult={async () => {}} refreshTick={0} command={command} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bridge: { height: 0, overflow: "hidden" },
});
