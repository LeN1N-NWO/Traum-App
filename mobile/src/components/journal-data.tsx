import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import JournalBridge from "@/legacy/journal-bridge";
import { setJournal, useJournalStore, type BridgeCommand, type JournalSnapshot } from "@/store/journal-store";

/* Bindet die Web-Brücke (journal-bridge.jsx) an den nativen Speicher. Der
   Brücken-Webview ist unsichtbar (matchContents, leerer Inhalt); bei jedem
   Fokus des Tabs liest er neu. `send` schickt einen Schreibbefehl hinüber. */
export function useJournal() {
  const data = useJournalStore();
  const [tick, setTick] = useState(0);
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  useFocusEffect(useCallback(() => { setTick((t) => t + 1); }, []));
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(snap); }, []);
  const send = useCallback((cmd: Omit<BridgeCommand, "n">) => { n.current += 1; setCommand({ ...cmd, n: n.current }); }, []);
  const bridge = (
    <JournalBridge onJournal={onJournal} refreshTick={tick} command={command} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
  );
  return { data, bridge, send };
}
