import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import JournalBridge from "@/legacy/journal-bridge";
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
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(snap); }, []);
  const onResult = useCallback(async (r: BridgeResult) => { waiting.current.get(r.n)?.(r); waiting.current.delete(r.n); }, []);
  const send = useCallback((cmd: Omit<BridgeCommand, "n">) => { n.current += 1; setCommand({ ...cmd, n: n.current }); }, []);
  const ask = useCallback((cmd: Omit<BridgeCommand, "n">) => new Promise<BridgeResult>((resolve) => {
    n.current += 1; waiting.current.set(n.current, resolve); setCommand({ ...cmd, n: n.current });
  }), []);
  const bridge = (
    <JournalBridge onJournal={onJournal} onResult={onResult} refreshTick={tick} command={command} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
  );
  return { data, bridge, send, ask };
}
