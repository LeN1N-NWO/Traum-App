"use dom";
/* Die Datenbrücke Web → nativ (12.09.2026, ADR-0006 Schritt 4).
 *
 * Das Journal lebt bis zum Umzug der Datenschicht im localStorage der
 * Webviews; nativ kommt niemand dort hinein. Dieser unsichtbare Webview
 * (Höhe 0) liest ihn und reicht eine schlanke Liste an die Hülle — über die
 * async-Funktion `onJournal`, die Expo als Prop hinüberträgt. Er liest neu,
 * wenn `refreshTick` steigt (Tab-Fokus) oder ein anderer Webview speichert.
 *
 * Die Leser (filmsOf, imagesOf, isBlank, mediaUrl) und die Texte (`t`) sind
 * die der Web-App — eine Wahrheit über Form und Sprache, nicht zwei. */
import "./vite-env.js";                       // ⚠ zuerst, API_BASE
import { useEffect } from "react";
import { loadState, saveState } from "../../../src/lib/storage.js";
import { refreshStreak, streakAtRisk, bumpStreak, STREAK_CAP } from "../../../src/lib/streak.js";
import { hasPendingJobs } from "../../../src/lib/collector.js";
import { blankNight, nightMarked } from "../../../src/lib/blankNight.js";
import { checkinOn, setCheckin, SLEEP_LEVELS } from "../../../src/lib/checkin.js";
import { totalCredits, spend } from "../../../src/lib/credits.js";
import { analyze } from "../../../src/lib/api.js";
import { PRICES } from "../../../src/lib/pricing.js";
import { VIDEO_MODELS, PACE_IDS } from "../../../src/lib/video.js";
import { PRESETS, DREAMFLOW } from "../../../src/lib/presets.js";
import { styleById } from "../../../src/lib/styles.js";
import { autoMatch } from "../../../src/wizard/useWizard.js";
import { blankDays, localDateKey } from "../../../src/lib/dreamDays.js";
import { reminderWish, reminderState, MAX_PER_DAY, DEFAULT_PER_DAY } from "../../../src/lib/reminders.js";
import { VOICES, DEFAULT_VOICE, isVoice } from "../../../src/lib/voices.js";
import { withdrawPatch } from "../../../src/lib/consent.js";
import { MILESTONES, nextMilestone, giftAt } from "../../../src/lib/streakBoard.js";
import { nextSnoozeIn } from "../../../src/lib/streak.js";
import { zodiacGlyph } from "../../../src/lib/zodiac.js";
import { genId } from "../../../src/lib/storage.js";
import { newCreature } from "../../../src/lib/creatures.js";
import { IMAGE_COUNTS, priceForImages } from "../../../src/lib/pricing.js";
import { priceForFilm } from "../../../src/lib/video.js";
import { SUBSCRIPTIONS, PACKS, dreamsFor } from "../../../src/lib/plans.js";
import { showcaseFrom } from "../../../src/lib/showcase.js";
import { filmsOf, filmOf, imagesOf } from "../../../src/lib/entryMedia.js";
import { isBlank } from "../../../src/lib/blankNight.js";
import { mediaUrl } from "../../../src/lib/api.js";
import { t } from "../../../src/i18n/index.js";

/* Nativ braucht absolute Adressen. `/media/…` löst mediaUrl auf; alles andere
   Relative (`/clips/…` der Beispielträume, aus public/) liefert derselbe
   Server aus dem gebauten dist. */
const API_BASE = globalThis.__ExpoImportMetaRegistry?.env?.VITE_API_BASE || "";
const absolute = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("/media/") ? API_BASE + u : mediaUrl(u));

function takeLabel(f) {
  const pace = f.pace ? t.wizard.step5.paceNames?.[f.pace] || f.pace : t.journal.takeUnknown;
  return pace + (f.seconds ? ` · ${f.seconds}s` : "");
}

function snapshot() {
  const s = loadState();
  const items = (s.journal || [])
    .filter((e) => !isBlank(e))
    .map((e) => {
      const film = filmOf(e);
      const images = imagesOf(e).map(absolute);
      const pending = !!e.pending || (e.imageJobs || []).length > 0 || (!film && !!e.jobId);
      return {
        id: e.id,
        createdAt: e.createdAt,
        title: e.title || "",
        tagline: e.tagline || "",
        text: e.text || "",
        media: film ? { kind: "film", url: absolute(film) } : images[0] ? { kind: "image", url: images[0] } : null,
        pending,
        films: filmsOf(e).map((f) => ({ url: absolute(f.url), at: f.at || null, label: takeLabel(f) })),
        images,
        reflection: e.reflection?.text || null,
        originalText: e.originalText && e.originalText !== e.text ? e.originalText : null,
        /* Die Besetzung dieses Traums (CastChips): Fotos der Personen, die
           per @tag im Traum standen — aus Bibliothek und „me". */
        cast: (e.references || []).map((r) => {
          const c = r.tag === "me" ? (s.me?.img ? { tag: "me", img: s.me.img } : null) : (s.cast || []).find((x) => x.tag === r.tag);
          return c ? { tag: c.tag, img: c.img || null } : { tag: r.tag, img: null };
        }),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  /* Die Startseite: Serie, offene Aufträge, heutige Nacht, Check-in,
     letzter Traum — dieselben Regeln wie HomeScreen.jsx, nur als Daten. */
  const streak = refreshStreak(s).streak || 0;
  const last = items[0] || null;
  const today = checkinOn(s.checkins);
  const home = {
    streak,
    atRisk: streakAtRisk(s),
    rendering: hasPendingJobs(s.journal),
    nightMarked: nightMarked(s.journal),
    checkin: today ? today.sleep : null,
    lastId: last ? last.id : null,
    streakLine: streak > 0 ? t.home.streak(streak) : "",
    streakNote: streak > 0 ? (streakAtRisk(s) ? t.home.streakRisk : t.home.streakPerk(Math.min(streak, STREAK_CAP), STREAK_CAP)) : "",
    checkinLevels: SLEEP_LEVELS.map((l) => ({ level: l, label: t.checkin.levels[l], emoji: t.checkin.emoji[l] })),
    /* Die Meilenstein-Leiter hinter der Serien-Pille (StreakBoard.jsx). */
    board: (() => {
      const nxt = nextMilestone(streak);
      const snoozes = s.snoozes || 0, nextIn = nextSnoozeIn(s);
      return {
        title: t.streakBoard.title, nights: t.streakBoard.nights(streak),
        lede: nxt ? t.streakBoard.next(nxt.nights - streak) : t.streakBoard.done,
        rungs: MILESTONES.map((m) => ({
          nights: m.nights, title: t.streakBoard.rung(m.nights), reward: t.streakBoard.rewards[m.reward],
          gift: giftAt(m.nights) > 0 ? t.streakBoard.giftBadge(giftAt(m.nights)) : null,
          state: streak >= m.nights ? "done" : nxt && m.nights === nxt.nights ? "next" : "far",
        })),
        shieldTitle: t.streakBoard.snoozeTitle(snoozes),
        shieldText: nextIn == null ? t.streakBoard.snoozeFull : t.streakBoard.snoozeNext(nextIn),
      };
    })(),
  };
  const labels = {
    greetingNight: t.home.greeting.night, greetingMorning: t.home.greeting.morning,
    greetingAfternoon: t.home.greeting.afternoon, greetingEvening: t.home.greeting.evening,
    homeTitle: t.home.title, homeLede: t.home.lede, homeCta: t.home.cta, renderingLine: t.home.renderingLine,
    lastHeading: t.home.lastHeading, blankCta: t.home.blankCta, blankHint: t.home.blankHint, blankDone: t.home.blankDone,
    soundsShortcut: t.home.soundsShortcut, checkinQuestion: t.checkin.question, checkinThanks: t.checkin.thanks,
    untitled: t.journal.untitled, takes: t.journal.takesLabel, reflectTitle: t.journal.reflectTitle,
    reflectNote: t.journal.reflectNote, original: t.journal.original, rendering: t.journal.filmRendering,
    share: t.journal.actShare, more: t.journal.menu, makeFilm: t.journal.makeFilm, anotherTake: t.journal.makeFilmAgain,
    dreams: t.journal.title,
  };
  const sleep = {
    title: t.sleep.title, subtitle: t.sleep.subtitle, free: t.sleep.free,
    tiles: ["checklist", "sounds", "guide", "symbols"].map((id) => ({ id, title: t.sleep.tiles[id].title, text: t.sleep.tiles[id].text })),
    /* Das Mischpult (nativ, components/sound-mixer.tsx): Texte und die
       gespeicherte Mischung. Der Browser-Hinweis zum Autostart entfällt —
       nativ startet der Klang ohne Geste. */
    sounds: {
      lede: t.sleep.sounds.lede, names: t.sleep.sounds.names, descs: t.sleep.sounds.descs,
      timer: t.sleep.sounds.timer, timerOff: t.sleep.sounds.timerOff,
      timerMin: Object.fromEntries([15, 30, 60].map((m) => [m, t.sleep.sounds.timerMin(m)])),
      autoStart: t.sleep.sounds.autoStart, background: t.sleep.sounds.background,
      mix: s.soundMix ? { volumes: s.soundMix.volumes || {}, timer: s.soundMix.timer || 0, autoStart: !!s.soundMix.autoStart } : null,
    },
    /* Die Abend-Checkliste (SleepChecklist.jsx): Schritte aus i18n, die
       Haken gehören EINER Nacht (heutiges Datum, sonst leer). */
    checklist: (() => {
      const c = t.sleep.checklist; const today = localDateKey(new Date());
      const done = s.sleepCheck?.date === today ? (s.sleepCheck.done || []) : [];
      return { lede: c.lede, hint: c.hint, progressLabel: c.progressLabel, today, done,
        items: c.items.map((it) => ({ id: it.id, title: it.title, text: it.text })),
        remaining: c.items.map((_, i) => c.remaining(i)).concat([c.remaining(c.items.length)]) };
    })(),
    /* Der Luzid-Guide (LucidGuide.jsx): Hebel, Methoden, Quelle — und der
       Erinnerungs-Wunsch (reminders.js: Wunsch getrennt von Erlaubnis). */
    lucid: (() => {
      const l = t.lucid; const r = s.reminders || null;
      return { lede: l.lede, leversTitle: l.leversTitle, levers: l.levers, methodsTitle: l.methodsTitle,
        methods: l.methods.map((m) => ({ id: m.id, name: m.name, rate: m.rate || null, summary: m.summary, steps: m.steps, note: m.note })),
        sourceNote: l.sourceNote, reminderAsk: l.reminderAsk, reminderPerDay: l.reminderPerDay, reminderWhy: l.reminderWhy, reminderSoon: l.reminderSoon,
        reminderActive: Object.fromEntries(Array.from({ length: MAX_PER_DAY }, (_, i) => [i + 1, l.reminderActive(i + 1)])),
        maxPerDay: MAX_PER_DAY, reminder: { on: reminderState(r) !== "hidden", perDay: r?.perDay || DEFAULT_PER_DAY } };
    })(),
  };
  const profile = {
    title: t.profile.title, name: s.me?.tag || t.profile.you, img: s.me?.img || null,
    hint: s.me?.img ? t.profile.meSet : t.profile.meEmpty,
    credits: totalCredits(s), creditsWord: t.profile.credits,
    dreams: (s.journal || []).length, streak, statDreams: t.profile.statDreams, statStreak: t.profile.statStreak,
    settings: t.profile.settings, surveyDone: !!s.surveyDone,
    surveyTitle: t.onboarding.profileCard, surveyHint: t.onboarding.profileCardHint,
    /* Einstellungen (Settings.jsx) und Stimmwahl (VoicePicker.jsx), nativ:
       Zeilen, Stimmenliste mit Hörprobe vom Server (voice-sample, dieselbe
       Quelle wie die Live-Sitzung), die Rechtstexte. */
    settingsPage: {
      voiceSetting: t.profile.voiceSetting, voiceSettingHint: t.profile.voiceSettingHint,
      withdrawConsent: t.profile.withdrawConsent, withdrawConsentHint: t.profile.withdrawConsentHint, done: t.profile.done,
      voice: isVoice(s.voice) ? s.voice : DEFAULT_VOICE,
      voices: VOICES.map((v) => ({ id: v.id, trait: t.voice.traits[v.trait] || v.trait })),
      pickTitle: t.voice.pickTitle, pickHint: t.voice.pickHint, pickGo: t.voice.pickGo, cancel: t.voice.cancel,
      sampleBase: API_BASE + "/api/voice-sample",
      legal: {
        close: t.legal.close, updated: t.legal.updated, draftNote: t.legal.draftNote,
        terms: { title: t.legal.terms.title, sections: t.legal.terms.sections },
        privacy: { title: t.legal.privacy.title, sections: t.legal.privacy.sections },
      },
    },
    /* Die Träumer-Karte (DreamerCard.jsx): was die Person dem Assistenten
       erzählt hat — Zeichen, Fakten, wiederkehrende Themen. */
    dreamer: (() => {
      const p = s.profile; if (!p) return null;
      const facts = [
        p.recall && [t.dreamer.recall, t.dreamer.recallValues?.[p.recall] || p.recall],
        p.lucid && [t.dreamer.lucid, t.dreamer.lucidValues?.[p.lucid] || p.lucid],
        p.goal && [t.dreamer.goal, t.dreamer.goalValues?.[p.goal] || p.goal],
        p.sleepHours && [t.dreamer.sleep, t.dreamer.sleepValues?.[p.sleepHours] || p.sleepHours],
        p.timeBudget && [t.dreamer.time, t.dreamer.timeValues?.[p.timeBudget] || p.timeBudget],
      ].filter(Boolean);
      const themes = (p.themes || []).filter(Boolean);
      if (!p.zodiac && !themes.length && !facts.length) return null;
      return { title: t.dreamer.title, retake: t.dreamer.retake, sign: p.zodiac ? { glyph: zodiacGlyph(p.zodiac), name: t.dreamer.signs?.[p.zodiac] || p.zodiac } : null, facts, themesLabel: t.dreamer.themes, themes };
    })(),
  };
  const w5 = t.wizard.step5;
  const wizard = {
    title: t.wizard.step1.title, next: t.wizard.next, read: t.wizard.step1.improve, reading: t.wizard.step1.reading,
    tooShort: t.wizard.tooShort, previewTitle: t.wizard.step1.previewTitle, previewLede: t.wizard.step1.previewLede,
    yours: t.wizard.step1.yours, improved: t.wizard.step1.improved, keepMine: t.wizard.step1.keepMine, useImproved: t.wizard.step1.useImproved,
    styleTitle: w5.title, styleLabel: w5.styleLabel, moreStyles: w5.moreStyles(PRESETS.filter((p) => p.id !== DREAMFLOW && !styleById(p.styleId)?.featured).length),
    lengthLabel: w5.lengthLabel, qualityLabel: w5.qualityLabel, modelLabel: w5.filmModelLabel || "Model", paceLabel: w5.paceLabel || "Pace", generate: w5.generate, credit1: t.wizard.creditsN(1), creditN: t.wizard.creditsN(2),
    readPrice: PRICES.improve, noCredits: t.wizard.noCreditsCta,
    presets: PRESETS.map((p) => ({
      id: p.id, styleId: p.styleId, pace: p.pace || null, wide: !!p.wide, emoji: p.emoji || "",
      label: p.id === DREAMFLOW ? w5.presets.dreamflow : (t.styles.byId[p.styleId]?.label || p.styleId),
      clip: p.clip ? absolute(p.clip) : null, featured: p.id === DREAMFLOW || !!styleById(p.styleId)?.featured,
    })),
    models: VIDEO_MODELS.map((m) => ({
      id: m.id, name: w5.filmModels[m.id]?.name || m.id, hint: w5.filmModels[m.id]?.hint || "",
      min: m.min, max: m.max, step: m.step, preset: m.preset, preferred: m.preferred,
      qualities: Object.keys(m.qualities).map((q) => ({ id: q, name: w5.qualityNames?.[q] || q })),
    })),
    paces: PACE_IDS.map((id) => ({ id, name: w5.paceNames?.[id] || id, hint: w5.paceHints?.[id] || "" })),
  };
  const realDreams = items.filter((e) => !String(e.id).startsWith("e_seed")).length;
  const journal = {
    view: s.journalView === "list" ? "list" : "deck",
    blankKeys: [...blankDays(s.journal)],
    castCount: (s.cast?.length || 0) + (s.me ? 1 : 0), creatures: (s.creatures || []).length, realDreams,
    labels: {
      title: t.journal.title, count1: t.journal.count(1), countN: t.journal.count(2).replace("2", "{n}"),
      viewList: t.journal.viewList, viewDeck: t.journal.viewDeck, search: t.journal.search, empty: t.journal.empty, emptySearch: t.journal.emptySearch,
      library: t.journal.library, libraryCount1: t.journal.libraryCount(1), libraryCountN: t.journal.libraryCount(2).replace("2", "{n}"),
      atlas: t.journal.atlas, atlasShort: t.journal.atlasShort, atlasSoon: t.journal.atlasSoon,
      menagerie: t.home.menagerieHeading, menagerieCount1: t.journal.menagerieCount(1), menagerieCountN: t.journal.menagerieCount(2).replace("2", "{n}"),
      calendar: t.journal.calendar, calPrev: t.journal.calPrev, calNext: t.journal.calNext, calBlank: t.journal.calBlank,
      calSeveral: t.journal.calSeveral(2).replace("2", "{n}"), rendering: t.journal.renderingTile, untitled: t.journal.untitled,
      months: t.journal.months, calMonths: t.journal.calMonths, calWeekdays: t.journal.calWeekdays,
    },
  };
  const step2 = { outputTitle: t.wizard.step2.title, saveOnly: t.wizard.step2.saveOnly, saveOnlyHint: t.wizard.step2.saveOnlyHint,
    images: t.wizard.step2.images, imagesHint: t.wizard.step2.imagesHint, film: t.wizard.step2.film, filmHint: t.wizard.step2.filmHint,
    saved: t.wizard.step2.saved, from: t.wizard.from, cancel: t.wizard.cancel, back: t.wizard.back,
    imagesFrom: priceForImages(Math.min(...IMAGE_COUNTS)), filmFrom: priceForFilm("standard", 5), steps: 6 };
  const dream = { ...step2, interview: t.dream.interview, interviewHint: t.dream.interviewHint, or: t.dream.or, label: t.dream.label,
    placeholder: t.dream.placeholder, reading: t.dream.reading, readingHint: t.dream.readingHint, free: t.wizard.free, credit: t.wizard.credit, why: t.wizard.step1.why };
  /* Das Kaufblatt (Paywall.jsx), vorgerechnet: Texte sind im Web zum Teil
     Funktionen, über die Brücke gehen nur Strings. NUR Filme — Bilder sind
     seit dem 12.09. aus dem Angebot (Antons Ansage: „mit den Bildern die
     Rede… das haben wir komplett gekickt"). Ertrag je Tarif aus dreamsFor(),
     also aus derselben Quelle wie der Preis. */
  const pw = t.paywall;
  const filmsLine = (n) => (n > 0 ? `${pw.upTo} ${n} ${pw.yieldFilms(n)}` : "");
  const show = showcaseFrom(s.journal, null);
  const paywall = {
    title: pw.title, close: pw.close, brand: "Dream Rushes", plus: "PLUS",
    headlineFor: { browse: pw.headlineFor.browse, spent: pw.headlineFor.spent, first: pw.headlineFor.first },
    ledeFor: { browse: pw.lede, spent: pw.ledeFor.spent, first: pw.ledeFor.first },
    tabSub: pw.tabSub, tabPack: pw.tabPack, packNote: pw.packNote, yieldYearNote: pw.yieldYearNote,
    included: pw.included, chips: pw.chips, freeNote: pw.freeNote, cta: pw.cta, notYet: pw.notYet, upTo: pw.upTo,
    balance: pw.balance(totalCredits(s)), credits: totalCredits(s),
    subs: SUBSCRIPTIONS.map((p) => {
      const films = dreamsFor(p.credits * (p.period === "year" ? 12 : 1)).films;
      return { id: p.id, price: p.price, per: pw.per[p.period], name: pw.periodName[p.period], badge: p.saveHint ? pw.save(p.saveHint) : null,
        sub: pw.creditsPer(p.credits, pw.periodUnit[p.period]), films, filmsLine: filmsLine(films), filmsWord: pw.yieldFilms(films), featured: !!p.featured, yearly: p.period === "year" };
    }),
    packs: PACKS.map((p) => {
      const films = dreamsFor(p.credits).films;
      return { id: p.id, price: p.price, per: pw.oneTime, name: pw.packName(p.credits), badge: null, sub: filmsLine(films) || pw.packNote, films, filmsLine: filmsLine(films), filmsWord: pw.yieldFilms(films), featured: p.id === "pack-m", yearly: false };
    }),
    films: (show.films || []).map(absolute), filmsBackup: (show.filmsBackup || []).map(absolute),
  };
  return { language: s.language || "en", items, labels, home, sleep, profile, wizard: { ...wizard, ...dream }, journal, paywall };
}

/* Befehle nativ → Web: Die Hülle kann den Web-Speicher nicht schreiben, also
   tut es die Brücke mit denselben Helfern wie die Web-Seite. `command` ist
   { n, type, … }; `n` steigt je Befehl, damit derselbe Befehl nicht zweimal
   läuft. */
/* Die Traumlesung (Analyse): kostet PRICES.improve, wie im Web — Kassen-
   prüfung vorher, abgebucht erst nach gelungenem Aufruf. Antwort geht per
   `onResult` zurück. */
async function runAsync(cmd, onResult) {
  if (cmd.type === "cast") {
    /* Die Besetzung für die native Zuordnung: Namen aus der Analyse mit dem
       Auto-Treffer der Web-Logik (autoMatch) und die Bibliothek als Auswahl. */
    const s = loadState();
    const lib = [
      ...(s.me?.img ? [{ id: "me", tag: "me", img: s.me.img, category: "person" }] : []),
      ...(s.cast || []).map((c) => ({ id: c.id, tag: c.tag, img: c.img || null, category: c.category || "person" })),
    ];
    const row = (name, kind) => { const m = autoMatch(name, s.cast, s.me); return { name, kind, avatarId: m ? (m.id || null) : null }; };
    const a = cmd.analysis || {};
    onResult({ n: cmd.n, result: {
      people: (a.people || []).map((x) => row(typeof x === "string" ? x : x.name, "person")),
      places: (a.places || []).map((x) => row(typeof x === "string" ? x : x.name, "place")),
      library: lib,
      labels: { people: t.wizard.step3.title, peopleLede: t.wizard.step3.lede, peopleEmpty: t.wizard.step3.empty,
                places: t.wizard.step4.title, placesLede: t.wizard.step4.lede, placesEmpty: t.wizard.step4.empty,
                free: t.wizard.cast.freeSet, undecided: t.wizard.cast.undecided, choose: t.wizard.cast.choose, change: t.wizard.cast.change,
                createNew: t.wizard.cast.createNew },
    } });
    return true;
  }
  if (cmd.type !== "analyze") return false;
  const s = loadState();
  const paid = spend(s, PRICES.improve);
  if (!paid) { onResult({ n: cmd.n, error: "nocredits" }); return true; }
  try {
    const result = await analyze(cmd.text);
    saveState({ ...loadState(), ...paid });
    onResult({ n: cmd.n, result });
  } catch (e) {
    onResult({ n: cmd.n, error: e?.message || String(e) });
  }
  return true;
}

function run(cmd) {
  const s = loadState();
  let patch = null;
  if (cmd.type === "blankNight") patch = { journal: [...(s.journal || []), blankNight()], ...bumpStreak(s) };
  else if (cmd.type === "checkin") patch = { checkins: setCheckin(s.checkins, cmd.level) };
  else if (cmd.type === "refreshStreak") { const f = refreshStreak(s); if (f.streak !== s.streak) patch = f; }
  else if (cmd.type === "journalView") patch = { journalView: cmd.value === "list" ? "list" : "deck" };
  else if (cmd.type === "soundMix") patch = { soundMix: { ...(s.soundMix || {}), ...(cmd.mix || {}) } };
  else if (cmd.type === "sleepCheck") patch = { sleepCheck: { date: cmd.date, done: cmd.done || [] } };
  else if (cmd.type === "voice") { if (isVoice(cmd.value)) patch = { voice: cmd.value }; }
  else if (cmd.type === "withdraw") patch = withdrawPatch();
  else if (cmd.type === "reminders") patch = { reminders: { ...(s.reminders || {}), ...reminderWish(!!cmd.wants, cmd.perDay || DEFAULT_PER_DAY) } };
  else if (cmd.type === "saveDream") {
    /* Nur speichern (Step2Output.saveOnly): kein Render, keine Kosten, mit
       Wesen und Serie — dieselbe Reihenfolge wie im Web. */
    const creature = newCreature(cmd.text, refreshStreak(s).streak);
    const entry = {
      id: genId("e"), createdAt: new Date().toISOString(), text: cmd.text, originalText: cmd.originalText || cmd.text,
      title: (cmd.title || "").trim() || creature.title, tagline: (cmd.tagline || "").trim(), mode: "save",
      media: { type: "image", urls: [], source: "none" }, analysis: cmd.analysis || null, references: [], creatureId: creature.id,
    };
    patch = { journal: [...(s.journal || []), entry], creatures: [...(s.creatures || []), creature], ...bumpStreak(s) };
  }
  if (patch) saveState({ ...s, ...patch });
}

export default function JournalBridge({ onJournal, onResult, refreshTick = 0, command, dom }) {
  useEffect(() => {
    const push = () => { try { onJournal(snapshot()); } catch (e) { console.warn("[bridge]", e); } };
    push();
    window.addEventListener("storage", push);
    return () => window.removeEventListener("storage", push);
  }, [onJournal, refreshTick]);
  useEffect(() => {
    if (!command) return;
    (async () => {
      try {
        if (await runAsync(command, onResult || (() => {}))) { onJournal(snapshot()); return; }
        run(command); onJournal(snapshot());
      } catch (e) { console.warn("[bridge] command", e); }
    })();
  }, [command?.n]);
  return null;
}
