import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import JournalBridge from "@/legacy/journal-bridge";
import { setJournal, useJournalStore, type JournalSnapshot } from "@/store/journal-store";

/* Bindet die Web-Brücke (journal-bridge.jsx) an den nativen Speicher. Der
   Brücken-Webview ist unsichtbar (matchContents, leerer Inhalt); bei jedem
   Fokus des Tabs liest er neu. */
export function useJournal() {
  const data = useJournalStore();
  const [tick, setTick] = useState(0);
  useFocusEffect(useCallback(() => { setTick((t) => t + 1); }, []));
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(snap); }, []);
  const bridge = <JournalBridge onJournal={onJournal} refreshTick={tick} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />;
  return { data, bridge };
}
