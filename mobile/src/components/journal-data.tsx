import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { useCallback, useRef, useState } from "react";
import { showToast } from "@/store/toast-store";
import JournalBridge from "@/legacy/journal-bridge";
import { resolveSketchesDeep } from "../../modules/dream-sketch";
import { setJournal, useJournalStore, type BridgeCommand, type BridgeResult, type JournalSnapshot } from "@/store/journal-store";
import { getAccessToken, useBridgeAccount } from "@/lib/auth";
import { useMediaKey } from "@/lib/media-key";

/* Bindet die Web-Brücke (journal-bridge.jsx) an den nativen Speicher. Der
   Brücken-Webview ist unsichtbar (matchContents, leerer Inhalt); bei jedem
   Fokus des Tabs liest er neu. `send` schickt einen Schreibbefehl hinüber,
   `ask` einen Befehl mit Antwort (Promise). */

/* Meldungen der Abholer, schon gezeigt — für ALLE Brücken gemeinsam, denn
   jede Brücke ist ein eigener Webview, die native Seite aber nur eine.
   Zehn Minuten reichen weit über jede Abholrunde hinaus. */
const shown = new Map<string, number>();
const SHOWN_MS = 10 * 60_000;
function firstShowing(key: string) {
  const now = Date.now();
  for (const [k, at] of shown) if (now - at > SHOWN_MS) shown.delete(k);
  if (shown.has(key)) return false;
  shown.set(key, now);
  return true;
}

export function useJournal() {
  const mediaKey = useMediaKey();   // S2: signierte Medienadressen in der Web-Ansicht
  const bridgeAccount = useBridgeAccount();   // ADR-0009: Bereich je Konto
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
      // Derselbe fertige Auftrag aus einer zweiten Brücke: schon gemeldet.
      if (r.key && !firstShowing(r.key)) return;
      if (r.toast) showToast(r.toast);
      /* Film fertig, App im Hintergrund (z. B. Einschlafklänge halten sie
         wach): eine echte Mitteilung, Tipp öffnet das Journal. Vorn reicht
         der Toast. ⚠ Ist die App ganz eingeschlafen, fragt niemand nach —
         dann braucht es Push vom Server (APNs), siehe STAND. */
      if (r.notify && AppState.currentState !== "active") {
        Notifications.scheduleNotificationAsync({ content: { title: r.notify.title, data: { glimpse: "/journal" } }, trigger: null }).catch(() => {});
      }
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
    <JournalBridge getToken={getAccessToken} mediaKey={mediaKey} account={bridgeAccount} onJournal={onJournal} onResult={onResult} refreshTick={tick} command={command} devCredits={500} streakChores dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
  );
  return { data, bridge, send, ask };
}
