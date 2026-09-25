import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import JournalBridge from "@/legacy/journal-bridge";
import { restoreSession, useAccount } from "@/lib/auth";
import { resetDreamSync, syncDreams } from "@/lib/dream-sync";
import { setJournal, useJournalStore, type BridgeCommand, type BridgeResult, type JournalSnapshot } from "@/store/journal-store";

/* Wann nach einer Änderung am Tagebuch gesichert wird. Nicht bei jedem
   Tastendruck — eine Aufnahme, ein Titel, ein fertiger Film kommen oft
   dicht hintereinander; ein Abgleich danach genügt. */
const DEBOUNCE_MS = 8000;

/* Die Konto-Sicherung der Träume (lib/dream-sync.ts), unsichtbar im
   Wurzel-Layout. Eigene Brücke wie das Einwilligungs-Tor: Das Wurzel-Layout
   hat keinen Bildschirm-Fokus. Läuft an, wenn jemand angemeldet ist oder
   sich anmeldet, und danach gebündelt nach jeder Änderung am Tagebuch. */
export function DreamSyncLayer() {
  const account = useAccount();
  const data = useJournalStore();
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  const waiting = useRef(new Map<number, (r: BridgeResult) => void>());
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(snap); }, []);
  const onResult = useCallback(async (r: BridgeResult) => {
    if (r.n === -1) return;          // Meldungen des Abholers zeigt die Tab-Brücke
    waiting.current.get(r.n)?.(r); waiting.current.delete(r.n);
  }, []);
  const ask = useCallback((cmd: Omit<BridgeCommand, "n">) => new Promise<BridgeResult>((resolve) => {
    n.current += 1; waiting.current.set(n.current, resolve); setCommand({ ...cmd, n: n.current } as BridgeCommand);
  }), []);

  useEffect(() => { restoreSession().catch(() => {}); }, []);

  /* ⚠ Nur mit gültiger Einwilligung (23.09.): Der Widerruf verspricht
     „Nichts verlässt dein Gerät, bis du erneut zustimmst" — das gilt auch
     für die eigene Sicherung. Solange der Stand unbekannt ist (noch kein
     Snapshot), gilt er als NICHT erteilt. */
  const consented = data?.consent ? !data.consent.needed : false;

  /* Wer sich an- oder ummeldet (oder zustimmt), bekommt sofort einen
     Abgleich; wer sich abmeldet, lässt kein „schon geschickt" für das
     nächste Konto zurück. */
  const who = account?.id || (account ? "signed-in" : null);
  useEffect(() => {
    if (!who) { resetDreamSync(); return; }
    if (!consented) return;
    syncDreams(ask).catch(() => {});
  }, [who, consented, ask]);

  /* Nach Änderungen: ein grober Fingerabdruck (Text, Bild/Film, Fassungen,
     Aufnahme) genügt, um „hat sich etwas getan?" zu beantworten — der genaue
     Vergleich steckt in syncDreams (was schon geschickt ist, geht nicht noch
     mal). Ein fertig gewordener Film löst so auch einen Abgleich aus. */
  const print = (data?.items || []).map((i) => `${i.id}:${i.text.length}:${i.media?.url ?? ""}:${i.films.length}:${i.audio ?? ""}`).join("|");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!who || !consented) return;
    const t = setTimeout(() => { syncDreams(ask).catch(() => {}); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [print, who, consented, ask]);

  /* ⚠ Außerhalb des Layout-Flusses: Im Wurzel-Layout stand die Brücke
     sonst NEBEN den Tabs und bekam die halbe Höhe — Tab-Leiste in der
     Mitte, untere Hälfte leer und tot (Simulator-Test 23.09.). Die Brücke
     des Einwilligungs-Tors sitzt in einem Modal und hat das Problem nicht. */
  return (
    <View style={styles.hidden} pointerEvents="none">
      <JournalBridge onJournal={onJournal} onResult={onResult} refreshTick={0} command={command} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0 },
});
