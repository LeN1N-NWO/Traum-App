import { useSyncExternalStore } from "react";

/* Das Journal, nativ vorgehalten — gespeist von der Web-Brücke
   (legacy/journal-bridge.jsx). Ein Modul-Speicher statt Context, weil Liste
   und Traum-Seite in verschiedenen Stack-Screens leben und beide lesen. */
export type Take = { url: string; at: string | null; label: string };
export type DreamItem = {
  id: string; createdAt: string; title: string; tagline: string; text: string;
  media: { kind: "film" | "image"; url: string } | null; pending: boolean;
  films: Take[]; images: string[]; reflection: string | null; originalText: string | null;
  cast: { tag: string; img: string | null }[];
};
export type Labels = Record<string, string>;
export type HomeData = {
  streak: number; atRisk: boolean; rendering: boolean; nightMarked: boolean; checkin: number | null;
  lastId: string | null; streakLine: string; streakNote: string;
  checkinLevels: { level: number; label: string; emoji: string }[];
  board: { title: string; nights: string; lede: string; rungs: { nights: number; title: string; reward: string; gift: string | null; state: "done" | "next" | "far" }[]; shieldTitle: string; shieldText: string };
};
export type SleepData = { title: string; subtitle: string; free: string; tiles: { id: string; title: string; text: string }[] };
export type ProfileData = {
  title: string; name: string; img: string | null; hint: string; credits: number; creditsWord: string;
  dreams: number; streak: number; statDreams: string; statStreak: string; settings: string;
  surveyDone: boolean; surveyTitle: string; surveyHint: string;
  dreamer: { title: string; retake: string; sign: { glyph: string; name: string } | null; facts: [string, string][]; themesLabel: string; themes: string[] } | null;
};
export type WizardPreset = { id: string; styleId: string; pace: string | null; wide: boolean; emoji: string; label: string; clip: string | null; featured: boolean };
export type WizardModel = { id: string; name: string; hint: string; min: number; max: number; step: number; preset: number; preferred: string; qualities: { id: string; name: string }[] };
export type WizardData = {
  title: string; next: string; read: string; reading: string; tooShort: string; previewTitle: string; previewLede: string;
  yours: string; improved: string; keepMine: string; useImproved: string; styleTitle: string; styleLabel: string; moreStyles: string;
  lengthLabel: string; qualityLabel: string; modelLabel: string; paceLabel: string; generate: string; credit1: string; creditN: string; readPrice: number; noCredits: string;
  presets: WizardPreset[]; models: WizardModel[]; paces: { id: string; name: string; hint: string }[];
};
export type JournalMeta = { view: "deck" | "list"; blankKeys: string[]; castCount: number; creatures: number; realDreams: number; labels: Record<string, any> };
export type JournalSnapshot = { language: string; items: DreamItem[]; labels: Labels; home: HomeData; sleep: SleepData; profile: ProfileData; wizard: WizardData & Record<string, any>; journal: JournalMeta };
export type BridgeCommand = { n: number; type: "blankNight" | "checkin" | "refreshStreak" | "analyze" | "cast" | "journalView"; level?: number; text?: string; analysis?: any; value?: string };
export type BridgeResult = { n: number; result?: any; error?: string };

let snapshot: JournalSnapshot | null = null;
const listeners = new Set<() => void>();

export function setJournal(next: JournalSnapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}
export function useJournalStore() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => snapshot,
    () => snapshot,
  );
}
