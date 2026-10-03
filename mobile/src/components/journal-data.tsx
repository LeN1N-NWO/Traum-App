import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { showToast } from "@/store/toast-store";
import JournalBridge from "@/legacy/journal-bridge";
import { resolveSketchesDeep } from "../../modules/dream-sketch";
import { setJournal, useJournalStore, type BridgeCommand, type BridgeResult, type JournalSnapshot } from "@/store/journal-store";

/* Bindet die Web-Brücke (journal-bridge.jsx) an den nativen Speicher. Der
   Brücken-Webview ist unsichtbar (matchContents, leerer Inhalt); bei jedem
   Fokus des Tabs liest er neu. `send` schickt einen Schreibbefehl hinüber,
   `ask` einen Befehl mit Antwort (Promise). */
export function useJournal() {
  const data = useJournalStore();
  const [tick, setTick] = useState(0);
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  const waiting = useRef(new Map<number, (r: BridgeResult) => void>());
  useFocusEffect(useCallback(() => { setTick((t) => t + 1); }, []));
  // `sketch:`-Adressen (Traum-Skizze, auf dem Gerät gerendert) werden hier
  // EINMAL zu spielbaren Dateipfaden — alle Bildschirme dahinter bleiben ahnungslos.
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(resolveSketchesDeep(snap)); }, []);
  const onResult = useCallback(async (r: BridgeResult) => {
    // n = -1: kein Befehl, sondern eine Meldung des Abholers (Film da, Erstattung, Fehler).
    if (r.n === -1) {
      if (r.toast) showToast(r.toast);
      if (r.haptic === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (r.haptic === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    waiting.current.get(r.n)?.(r); waiting.current.delete(r.n);
  }, []);
  const send = useCallback((cmd: Omit<BridgeCommand, "n">) => { n.current += 1; setCommand({ ...cmd, n: n.current }); }, []);
  const ask = useCallback((cmd: Omit<BridgeCommand, "n">) => new Promise<BridgeResult>((resolve) => {
    n.current += 1; waiting.current.set(n.current, resolve); setCommand({ ...cmd, n: n.current });
  }), []);
  const bridge = (
    // Test-Guthaben, solange kein Konto dahinter ist (Antons Ansage 12.09.;
    // seit 18.09. auch im Release-Bau mit 500 — er testet auf dem iPhone).
    // ⚠ Vor der Veröffentlichung zurück auf `__DEV__ ? 100 : 0`.
    <JournalBridge onJournal={onJournal} onResult={onResult} refreshTick={tick} command={command} devCredits={500} streakChores dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
  );
  return { data, bridge, send, ask };
}
