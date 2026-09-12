import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import JournalBridge from "@/legacy/journal-bridge";
import type { DreamItem } from "@/components/dream-poster";

/* Hält das Journal nativ vor, gespeist von der Web-Brücke (journal-bridge.jsx).
   Der Brücken-Webview ist unsichtbar (matchContents, leerer Inhalt). */
export function useJournal() {
  const [data, setData] = useState<{ language: string; items: DreamItem[] } | null>(null);
  const [tick, setTick] = useState(0);
  useFocusEffect(useCallback(() => { setTick((t) => t + 1); }, []));
  const onJournal = useCallback(async (snap: { language: string; items: DreamItem[] }) => { setData(snap); }, []);
  const bridge = <JournalBridge onJournal={onJournal} refreshTick={tick} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />;
  return { data, bridge };
}
