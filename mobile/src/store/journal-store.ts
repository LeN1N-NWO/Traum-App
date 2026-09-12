import { useSyncExternalStore } from "react";

/* Das Journal, nativ vorgehalten — gespeist von der Web-Brücke
   (legacy/journal-bridge.jsx). Ein Modul-Speicher statt Context, weil Liste
   und Traum-Seite in verschiedenen Stack-Screens leben und beide lesen. */
export type Take = { url: string; at: string | null; label: string };
export type DreamItem = {
  id: string; createdAt: string; title: string; tagline: string; text: string;
  media: { kind: "film" | "image"; url: string } | null; pending: boolean; rendering: boolean; failReason: string | null; audio: string | null; poster: string | null; analysis: any | null; styleId: string | null; moon: MoonInfo;
  films: Take[]; images: string[]; reflection: string | null; originalText: string | null;
  cast: { tag: string; img: string | null }[];
};
export type Labels = Record<string, string>;
export type MoonInfo = { phase: string; illum: number; waxing: boolean; label: string; lit: string };
export type MoonStripDay = { key: string; day: number; weekday: number; today: boolean; phase: string; illum: number; waxing: boolean; label: string };
export type MoonData = { title: string; tonight: string; weekdays: string[]; strip: MoonStripDay[] };
export type HomeData = {
  streak: number; atRisk: boolean; rendering: boolean; nightMarked: boolean; checkin: number | null;
  lastId: string | null; streakLine: string; streakNote: string;
  checkinLevels: { level: number; label: string; emoji: string }[];
  board: { title: string; nights: string; lede: string; rungs: { nights: number; title: string; reward: string; gift: string | null; state: "done" | "next" | "far" }[]; shieldTitle: string; shieldText: string };
};
export type SoundMix = { volumes: Record<string, number>; timer: number; autoStart: boolean };
export type SoundsData = { lede: string; names: Record<string, string>; descs: Record<string, string>; timer: string; timerOff: string; timerMin: Record<number, string>; autoStart: string; background: string; mix: SoundMix | null };
export type ChecklistData = { lede: string; hint: string; progressLabel: string; today: string; done: string[]; items: { id: string; title: string; text: string }[]; remaining: string[] };
export type LucidMethod = { id: string; name: string; rate: string | null; summary: string; steps: string[]; note: string };
export type LucidData = {
  lede: string; leversTitle: string; levers: { title: string; text: string }[]; methodsTitle: string; methods: LucidMethod[]; sourceNote: string;
  reminderAsk: string; reminderPerDay: string; reminderWhy: string; reminderSoon: string; reminderActive: Record<number, string>; maxPerDay: number;
  reminder: { on: boolean; perDay: number };
};
export type SleepData = { title: string; subtitle: string; free: string; tiles: { id: string; title: string; text: string }[]; sounds: SoundsData; checklist: ChecklistData; lucid: LucidData };
export type ProfileData = {
  title: string; name: string; img: string | null; hint: string; credits: number; creditsWord: string;
  dreams: number; streak: number; statDreams: string; statStreak: string; settings: string;
  surveyDone: boolean; paywallSeen: boolean; surveyTitle: string; surveyHint: string;
  dreamer: { title: string; retake: string; sign: { glyph: string; name: string } | null; facts: [string, string][]; themesLabel: string; themes: string[] } | null;
  settingsPage: SettingsData;
};
export type LegalDoc = { title: string; sections: { h: string; p: string }[] };
export type SettingsData = {
  voiceSetting: string; voiceSettingHint: string; withdrawConsent: string; withdrawConsentHint: string; done: string;
  voice: string; voices: { id: string; trait: string }[]; pickTitle: string; pickHint: string; pickGo: string; cancel: string; sampleBase: string;
  legal: { close: string; updated: string; draftNote: string; terms: LegalDoc; privacy: LegalDoc };
};
export type WizardPreset = { id: string; styleId: string; pace: string | null; wide: boolean; emoji: string; label: string; clip: string | null; featured: boolean };
export type WizardModel = { id: string; name: string; hint: string; min: number; max: number; step: number; preset: number; preferred: string; qualities: { id: string; name: string }[] };
export type WizardData = {
  title: string; next: string; read: string; reading: string; tooShort: string; previewTitle: string; previewLede: string;
  yours: string; improved: string; keepMine: string; useImproved: string; styleTitle: string; styleLabel: string; useStyle: string; moreStyles: string;
  lengthLabel: string; qualityLabel: string; modelLabel: string; paceLabel: string; generate: string; credit1: string; creditN: string; readPrice: number; noCredits: string;
  record: string; recordHint: string; recording: string; recordStop: string; recordDiscard: string; recordTranscribing: string; recordTooShort: string; recordFailed: string; recordAgain: string; yourRecording: string; transcribeUrl: string; panelUrl: string;
  cutOneShot: string; cutAll: string; cutSome: string; cutMoreAt: string; cutTwoParter: string; flowAll: string; flowFast: string; cutAllIn: string; cutRecommend: string;
  loading: string[]; queuedNote: string; step6Title: string; rendering: string; renderingHint: string; failedTitle: string; failedNote: string; failedHome: string;
  presets: WizardPreset[]; models: WizardModel[]; paces: { id: string; name: string; hint: string }[];
};
export type JournalMeta = { view: "deck" | "list"; blankKeys: string[]; castCount: number; creatures: number; realDreams: number; moon: MoonData; labels: Record<string, any> };
export type PaywallPlan = { id: string; price: string; per: string; name: string; badge: string | null; sub: string; films: number; filmsLine: string; filmsWord: string; featured: boolean; yearly: boolean };
export type PaywallData = {
  title: string; close: string; brand: string; plus: string;
  headlineFor: Record<string, string>; ledeFor: Record<string, string>;
  tabSub: string; tabPack: string; packNote: string; yieldYearNote: string; included: string; chips: string[]; freeNote: string; cta: string; notYet: string; upTo: string;
  balance: string; credits: number; subs: PaywallPlan[]; packs: PaywallPlan[]; films: string[]; filmsBackup: string[];
};
export type SymbolEntry = { id: string; label: string; meaning: string; count: number; countLine: string; occurrences: { entryId: string; date: string; title: string }[] };
export type SymbolsData = { title: string; subtitle: string; empty: string; close: string; disclaimer: string; groups: { key: string; label: string; symbols: SymbolEntry[] }[] };
export type LibraryData = { title: string; lede: string; newLabel: string; empty: string; never: string; groups: { category: string; label: string; rows: { id: string; tag: string; img: string | null; initial: string; count: number; countWord: string }[] }[] };
export type MenagerieData = { title: string; lede: string; empty: string; creatures: { id: string; e: string; name: string; rare: string; rareClass: string; date: string }[] };
export type OnboardValues = { order: string[]; labels: Record<string, string> };
export type OnboardData = {
  skip: string; next: string; back: string;
  introKicker: string; introText: string; introCta: string; featuresTitle: string;
  features: { title: string; text: string }[];
  askTitle: string; askText: string; askMic: string; askMicWhy: string; askPhotos: string; askPhotosWhy: string; askGranted: string; askDenied: string; askGo: string;
  sleepTitle: string; sleepAsleep: string; sleepNote: string; sleepYears: (y: number) => string; sleepDream: (y: number) => string;
  doneTitle: string; doneText: string; doneCta: string;
  formName: string; formNamePlaceholder: string; formGoal: string; formRecall: string; formLucid: string; formSleep: string; formTime: string;
  formThemes: string; formThemesPlaceholder: string;
  values: { goal: OnboardValues; recall: OnboardValues; lucid: OnboardValues; sleepHours: OnboardValues; timeBudget: OnboardValues };
};
export type ConsentData = { needed: boolean; title: string; intro: string; termsPre: string; termsLink: string; termsMid: string; privacyLink: string; termsPost: string; processing: string; adult: string; more: string; details: string[]; cta: string };
export type JournalSnapshot = { language: string; items: DreamItem[]; labels: Labels; home: HomeData; sleep: SleepData; profile: ProfileData; wizard: WizardData & Record<string, any>; journal: JournalMeta; paywall: PaywallData; symbols: SymbolsData; library: LibraryData; menagerie: MenagerieData; consent: ConsentData; onboard: Omit<OnboardData, "sleepYears" | "sleepDream"> & { sleepYearsTpl: string; sleepDreamTpl: string } };
export type BridgeCommand = { n: number; type: "blankNight" | "checkin" | "refreshStreak" | "analyze" | "cast" | "journalView" | "saveDream" | "soundMix" | "sleepCheck" | "reminders" | "voice" | "withdraw" | "deleteDream" | "paywallSeen" | "consent" | "attachAudio" | "pendingAudio" | "reflect" | "onboarded"; id?: string; audioUrl?: string; answers?: Record<string, unknown>; mix?: SoundMix; date?: string; done?: string[]; wants?: boolean; perDay?: number; level?: number; text?: string; originalText?: string; title?: string; tagline?: string; analysis?: any; value?: string };
export type BridgeResult = { n: number; result?: any; error?: string; toast?: string; haptic?: "success" | "error" | null };

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
