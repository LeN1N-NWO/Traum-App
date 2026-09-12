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
import { hasPendingJobs, collectTick } from "../../../src/lib/collector.js";
import { failureTextKey } from "../../../src/lib/falError.js";
import { jobStatus } from "../../../src/lib/api.js";
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
import { withdrawPatch, consentPatch, needsConsent } from "../../../src/lib/consent.js";
import { SYMBOLS, SYMBOL_CATEGORIES, symbolOccurrences } from "../../../src/lib/symbols.js";
import { castByCategory, initialOf } from "../../../src/lib/castStats.js";
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
        /* Die Kachel: das Poster (nach dem Film, Antons Ablauf 12.09.), sonst
           der Film als Standbild, sonst das erste Bild. */
        media: e.poster ? { kind: "image", url: absolute(e.poster) } : film ? { kind: "film", url: absolute(film) } : images[0] ? { kind: "image", url: images[0] } : null,
        poster: e.poster ? absolute(e.poster) : null,
        pending,
        /* Für die native Auftragsseite: Auftrag abgegeben (Nummer hängt am
           Traum) bzw. gescheitert (Grund aus falError.js, als Satz). */
        rendering: !!e.jobId || (e.imageJobs || []).length > 0,
        // Die eigene Aufnahme (ADR-0007), wenn der Traum eingesprochen wurde.
        audio: e.audio?.url ? absolute(e.audio.url) : null,
        failReason: e.failReason ? (t.errors[failureTextKey(e.failReason)] || t.errors.unexpected) : null,
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
    /* Das „…"-Menü der Traum-Seite (EntryMenu.jsx) als natives Aktionsblatt. */
    menuEdit: t.journal.edit, menuCorrect: t.journal.correct, menuRewrite: t.journal.rewrite, menuElaborate: t.journal.elaborate,
    menuDelete: t.journal.delete, deleted: t.journal.deleted, cancel: t.wizard.cancel,
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
    settings: t.profile.settings, surveyDone: !!s.surveyDone, paywallSeen: !!s.paywallSeen,
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
    styleTitle: w5.title, styleLabel: w5.styleLabel, useStyle: w5.useStyle, moreStyles: w5.moreStyles(PRESETS.filter((p) => p.id !== DREAMFLOW && !styleById(p.styleId)?.featured).length),
    /* Die Szenen-Empfehlung (Step5Style: recommendation aus cut.js) — im
       Web stand sie unter dem Regler, nativ fehlte sie: Anton bestellte
       10 s H3 fuer sechs Szenen und bekam zwei (12.09.). Vorlagen mit
       Platzhaltern 1000/2000, nativ ersetzt. */
    cutOneShot: w5.cutOneShot, cutAll: w5.cutAll(1000), cutSome: w5.cutSome(1000, 2000), cutMoreAt: w5.cutMoreAt(1000, 2000),
    cutTwoParter: w5.cutTwoParter, flowAll: w5.flowAll(1000), flowFast: w5.flowFast(1000),
    cutAllIn: w5.cutAllIn(1000, 2000, 3000), cutRecommend: w5.cutRecommend(1000),
    lengthLabel: w5.lengthLabel, qualityLabel: w5.qualityLabel, modelLabel: w5.filmModelLabel || "Model", paceLabel: w5.paceLabel || "Pace", generate: w5.generate, credit1: t.wizard.creditsN(1), creditN: t.wizard.creditsN(2),
    readPrice: PRICES.improve, noCredits: t.wizard.noCreditsCta,
    /* Die native Auftragsseite (dream/order.tsx): Sätze fürs Abgeben,
       die Bestätigung und den Fehlerfall — Web-Texte, nichts Neues. */
    loading: t.dream.loading, queuedNote: t.wizard.step5.queuedNote,
    step6Title: t.wizard.step6.title, rendering: t.wizard.step6.rendering, renderingHint: t.wizard.step6.renderingHint,
    failedTitle: t.wizard.step5.failedTitle, failedNote: t.wizard.step5.failedNote, failedHome: t.wizard.step5.failedHome,
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
    record: t.dream.record, recordHint: t.dream.recordHint, recording: t.dream.recording, recordStop: t.dream.recordStop,
    recordTranscribing: t.dream.recordTranscribing, recordTooShort: t.dream.recordTooShort, recordFailed: t.dream.recordFailed,
    recordAgain: t.dream.recordAgain, yourRecording: t.dream.yourRecording, transcribeUrl: API_BASE + "/api/transcribe", panelUrl: API_BASE + "/api/panel",
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
  /* Der Symbol-Atlas (SymbolsScreen.jsx + SymbolDetail.jsx): Gruppen nach
     Kategorie, nur Symbole, die im Tagebuch vorkommen; Vorkommen je Symbol,
     neueste zuerst. Wird bei jedem Stand neu abgeleitet — ein später
     ergänztes Symbol reichert alte Träume rückwirkend an. */
  const symbols = (() => {
    const occ = symbolOccurrences(s.journal); const ts = t.symbols;
    const groups = Object.entries(SYMBOL_CATEGORIES).map(([key, cat]) => ({
      key, label: ts.categories[key] || cat.label,
      symbols: SYMBOLS.filter((x) => x.category === key && occ.has(x.id)).map((x) => {
        const list = occ.get(x.id) || [];
        return { id: x.id, label: ts.byId[x.id]?.label || x.label, meaning: ts.byId[x.id]?.meaning || x.meaning, count: list.length,
          countLine: ts.occurrences(list.length),
          occurrences: list.map((o) => ({ entryId: o.entryId, date: new Date(o.createdAt).toLocaleDateString(s.language === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short" }), title: o.title || ts.untitled })) };
      }),
    })).filter((g) => g.symbols.length > 0);
    return { title: ts.title, subtitle: ts.subtitle, empty: ts.empty, close: ts.close, disclaimer: ts.disclaimer, groups };
  })();
  /* Die Besetzung (CastLibrary.jsx + CastGroup.jsx): Rollenliste je
     Gattung, nach Häufigkeit sortiert (castStats.js) — und die Menagerie
     (Menagerie.jsx): ein Wesen je aufgeschriebenem Traum, neueste zuerst. */
  const library = {
    title: t.journal.library, lede: t.journal.libraryLede, newLabel: t.journal.castNew, empty: t.journal.libraryCount(0), never: t.journal.castNever,
    groups: [["person", t.profile.people], ["pet", t.profile.pets], ["place", t.profile.places]].map(([category, label]) => ({
      category, label,
      rows: castByCategory(s.cast, s.journal, category).map((e) => ({ id: e.id, tag: e.tag, img: e.img ? mediaUrl(e.img) : null, initial: initialOf(e.tag), count: e.count, countWord: t.journal.castDreamsN(e.count) })),
    })).filter((g) => g.rows.length > 0),
  };
  const menagerie = {
    title: t.home.menagerieHeading, lede: t.journal.menagerieLede, empty: t.home.menagerieEmpty,
    creatures: [...(s.creatures || [])].reverse().map((c) => ({ id: c.id, e: c.e || "", name: c.name, rare: c.rare, rareClass: c.rareClass || "", date: c.date || "" })),
  };
  /* Das Einwilligungs-Tor (ConsentGate.jsx): steht, solange keine
     Zustimmung in der aktuellen Version vorliegt — nativ als Vollbild über
     den Tabs. Drei eigene Häkchen, nichts vorangekreuzt (DSGVO Art. 7). */
  const consent = { needed: needsConsent(s), ...Object.fromEntries(["title", "intro", "termsPre", "termsLink", "termsMid", "privacyLink", "termsPost", "processing", "adult", "more", "cta"].map((k) => [k, t.consent[k]])), details: t.consent.details };
  return { language: s.language || "en", items, labels, home, sleep, profile, wizard: { ...wizard, ...dream }, journal, paywall, symbols, library, menagerie, consent };
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
  else if (cmd.type === "attachAudio") {
    const j = s.journal || [];
    const target = cmd.id || (j.length ? j[j.length - 1].id : null);   // ohne id: der juengste Traum
    patch = { journal: j.map((e) => (e.id === target ? { ...e, audio: { url: cmd.audioUrl } } : e)) };
  }
  else if (cmd.type === "consent") patch = consentPatch();
  else if (cmd.type === "paywallSeen") patch = { paywallSeen: true };
  else if (cmd.type === "deleteDream") patch = { journal: (s.journal || []).filter((e) => e.id !== cmd.id) };
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
      ...(cmd.audioUrl ? { audio: { url: cmd.audioUrl } } : {}),
    };
    patch = { journal: [...(s.journal || []), entry], creatures: [...(s.creatures || []), creature], ...bumpStreak(s) };
  }
  if (patch) saveState({ ...s, ...patch });
}

/* Der Abholer (collector.js), nativ verdrahtet: Im Web tickt er in
   AppState — die Hülle montiert AppState aber nur noch in Web-Räumen, also
   holte niemand einen Film ab, solange man nativ unterwegs war. Jetzt tickt
   die Brücke, sobald ein Auftrag offen ist (Antons Ansage 21.08.: kein
   Wartebildschirm, die App bleibt benutzbar, ein Toast meldet sich).
   Mehrere Brücken teilen sich einen localStorage: eine Pacht-Marke sorgt
   dafür, dass nur EINE fragt, sonst würde derselbe Auftrag doppelt
   abgeholt und doppelt getoastet. */
const LEASE = "dr_collector_lease";
const me = Math.random().toString(36).slice(2);
function holdLease() {
  try {
    const raw = localStorage.getItem(LEASE); const [owner, at] = raw ? raw.split(":") : [null, 0];
    if (owner && owner !== me && Date.now() - Number(at) < 8000) return false;
    localStorage.setItem(LEASE, `${me}:${Date.now()}`); return true;
  } catch { return true; }
}
async function collectOnce(onJournal, onResult) {
  const s = loadState();
  if (!hasPendingJobs(s.journal) || !holdLease()) return;
  const res = await collectTick(s.journal, jobStatus);
  if (!res) return;
  const now = loadState();
  saveState({ ...now, journal: res.journal, ...(res.refund > 0 ? { credits: (now.credits ?? 0) + res.refund } : {}) });
  onJournal(snapshot());
  for (const [kind, extra] of res.messages) {
    const text = kind === "dreamReady" ? t.journal.dreamReady(extra || "") : kind === "filmArrived" ? t.journal.filmArrived
      : kind === "sceneReady" ? t.journal.sceneReady(extra) : kind === "refunded" ? t.journal.imagesRefunded(extra)
      : kind === "renderFailed" ? `⚠ ${t.errors[failureTextKey(extra)]}` : null;
    if (text) onResult({ n: -1, toast: text, haptic: kind === "filmArrived" || kind === "dreamReady" ? "success" : kind === "renderFailed" ? "error" : null });
  }
}

/* Test-Guthaben (Antons Ansage 12.09.: „so tun, als hätten wir immer 100
   Credits, solange kein Konto und kein Supabase dahinter ist"): Die Hülle
   gibt `devCredits` nur im Entwicklungsbau herein; dann füllt die Brücke
   das Kauf-Töpfchen bei jedem Lesen auf mindestens diesen Stand — dieselbe
   Stelle wie der „+100 test credits"-Knopf des Web-Startmenüs (StartMenu.jsx),
   das die Hülle nicht zeigt. Im Produktionsbau passiert hier nichts. */
function devTopUp(min) {
  if (!min) return;
  const s = loadState();
  if (totalCredits(s) >= min) return;
  saveState({ ...s, credits: (s.credits ?? 0) + (min - totalCredits(s)) });
}

export default function JournalBridge({ onJournal, onResult, refreshTick = 0, command, devCredits = 0, dom }) {
  useEffect(() => {
    const push = () => { try { devTopUp(devCredits); onJournal(snapshot()); } catch (e) { console.warn("[bridge]", e); } };
    push();
    window.addEventListener("storage", push);
    return () => window.removeEventListener("storage", push);
  }, [onJournal, refreshTick, devCredits]);
  useEffect(() => {
    let busy = false;
    const id = setInterval(async () => {
      if (busy) return; busy = true;
      try { await collectOnce(onJournal, onResult || (() => {})); } catch (e) { console.warn("[bridge] collect", e); } finally { busy = false; }
    }, 3000);
    return () => clearInterval(id);
  }, [onJournal, onResult]);
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
