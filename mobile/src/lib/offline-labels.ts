import de from "../../../src/i18n/de.js";
import en from "../../../src/i18n/en.js";
import { useJournalStore } from "@/store/journal-store";

/* Texte für den Fall, dass die Brücke NICHT antwortet — dann gibt es auch
   keine Beschriftungen aus ihr. Die Sprache kommt aus dem letzten Stand,
   sonst aus dem Gerät. Die Texte selbst stehen wie alle in src/i18n. */
type Offline = { title: string; hint: string; devHint: string; retry: string; close: string };
export function useOfflineLabels(): Offline {
  const lang = useJournalStore()?.language ?? Intl.DateTimeFormat().resolvedOptions().locale;
  const pick = String(lang).toLowerCase().startsWith("de") ? de : en;
  return (pick as unknown as { offline: Offline }).offline;
}
