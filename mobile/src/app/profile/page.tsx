import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegacyPage from "@/legacy/legacy-page";
import { View } from "react-native";
import { useCallback, useRef, useState } from "react";
import JournalBridge from "@/legacy/journal-bridge";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { showToast } from "@/store/toast-store";
import { setJournal, useJournalStore, type BridgeCommand, type JournalSnapshot, type OnboardData } from "@/store/journal-store";
import { colors } from "@/theme";
import { AvatarEditor } from "@/components/avatar-editor";
import { getAccessToken } from "@/lib/auth";
import { useMediaKey } from "@/lib/media-key";

/* Die Blätter des Profils: `avatar` (eigenes Porträt) und `survey` sind
   seit 13.09. nativ; `settings` und `paywall` laufen hier noch als
   Web-Rückfall, werden aber nativ längst direkt geöffnet
   (profile/settings.tsx, profile/paywall.tsx). */
export default function ProfilePageScreen() {
  const mediaKey = useMediaKey();   // S2: signierte Medienadressen in der Web-Ansicht
  const { page, category, tag } = useLocalSearchParams<{ page: string; category?: string; tag?: string }>();
  const router = useRouter();
  const p = String(page);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {p === "avatar"
        /* Das eigene Porträt, seit 13.09. nativ (components/avatar-editor.tsx). */
        ? <AvatarEditor mode="me" onDone={() => router.back()} />
        : p === "survey"
        /* Die Umfrage, seit 13.09. nativ: dieselben Fragen wie das
           Onboarding (nur die Fragen), Antworten über `onboarded` in
           dasselbe Profil. Die Web-Umfrage (Sprache/Formular) wird nicht
           mehr geladen. */
        ? <SurveyRoom onClose={() => router.back()} />
        /* S2: `key` lädt neu bei Kontowechsel / erstem Schlüssel —
           Begründung in components/legacy-tab.tsx. */
        : <LegacyPage key={mediaKey?.uid ?? "ohne"} getToken={getAccessToken} mediaKey={mediaKey} page={p} safeTop={insets.top} safeBottom={insets.bottom} category={category ? String(category) : undefined} tag={tag ? String(tag) : undefined} onClose={async () => { router.back(); }} dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }} />}
    </>
  );
}

/* Die Umfrage: der Onboarding-Fluss im Fragen-Modus. Eine eigene Brücke
   wie im Onboarding-Tor — der Befehl muss den Bildschirm überleben, der
   sich beim Abschluss schließt, deshalb schließt er erst NACH der Antwort. */
function SurveyRoom({ onClose }: { onClose: () => void }) {
  const mediaKey = useMediaKey();   // S2: signierte Medienadressen in der Web-Ansicht
  const data = useJournalStore();
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  const closing = useRef(false);
  /* Die Brücke meldet nach JEDEM Befehl einen neuen Stand — erst dann ist
     die Antwort gespeichert und der Bildschirm darf zu (sonst stirbt der
     Webview mit dem Befehl). */
  const onJournal = useCallback(async (snap: JournalSnapshot) => {
    setJournal(snap);
    if (closing.current) { closing.current = false; onClose(); }
  }, [onClose]);
  const raw = data?.onboard;
  const O: OnboardData | null = raw ? {
    ...raw,
    sleepYears: (y: number) => raw.sleepYearsTpl.replace("1000", String(y)),
    sleepDream: (y: number) => raw.sleepDreamTpl.replace("1000", String(y)),
  } : null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {O ? (
        <OnboardingFlow
          O={O}
          questionsOnly
          onExit={onClose}
          onDone={(answers) => {
            n.current += 1;
            closing.current = true;
            setCommand({ type: "onboarded", n: n.current, answers });
            showToast(O.doneText);
          }}
        />
      ) : null}
      <View style={{ height: 0, overflow: "hidden" }}>
        <JournalBridge getToken={getAccessToken} mediaKey={mediaKey} onJournal={onJournal} onResult={async () => {}} refreshTick={0} command={command} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
      </View>
    </View>
  );
}
