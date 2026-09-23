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
import { totalCredits, spend, applyAllowanceGrant } from "../../../src/lib/credits.js";
import { analyze, reflect, refine, characterSheet, generate, photoCheck } from "../../../src/lib/api.js";
import { quoteFor } from "../../../src/lib/quote.js";
import { buildReferences, buildImagePrompt } from "../../../src/lib/promptBuilder.js";
import { renderRef, needsSheet, sheetFingerprint } from "../../../src/lib/sheets.js";
import { selectBeats, shotPlan } from "../../../src/lib/cut.js";
import { beatBudget, filmPace, clampSeconds, filmQuality, videoModel, DEFAULT_PACE } from "../../../src/lib/video.js";
import { startsFree } from "../../../src/wizard/useWizard.js";
import { beatsForCount } from "../../../src/lib/beats.js";
import { reflectionContext } from "../../../src/lib/atlas.js";
import { PRICES } from "../../../src/lib/pricing.js";
import { VIDEO_MODELS, PACE_IDS } from "../../../src/lib/video.js";
import { PRESETS, DREAMFLOW } from "../../../src/lib/presets.js";
import { styleById } from "../../../src/lib/styles.js";
import { autoMatch } from "../../../src/wizard/useWizard.js";
import { blankDays, localDateKey } from "../../../src/lib/dreamDays.js";
import { moonForNight, moonStrip } from "../../../src/lib/moon.js";
import { compactDataUrl } from "../../../src/lib/sheets.js";
import { reminderWish, reminderState, reminderPlan, reminderAnswered, setReminder, MAX_PER_DAY, DEFAULT_PER_DAY } from "../../../src/lib/reminders.js";
import { VOICES, DEFAULT_VOICE, isVoice } from "../../../src/lib/voices.js";
import { withdrawPatch, consentPatch, needsConsent } from "../../../src/lib/consent.js";
import { backupPayload, mergeShared } from "../../../src/lib/journalBackup.js";
import { FORM_FIELDS, profileFromAnswers } from "../../../src/lib/onboardingForm.js";
import { MASCOTS, DEFAULT_MASCOT } from "../../../src/lib/mascots.js";
import { zodiacOf } from "../../../src/lib/zodiac.js";
import { SYMBOLS, SYMBOL_CATEGORIES, symbolOccurrences } from "../../../src/lib/symbols.js";
import { castByCategory, initialOf } from "../../../src/lib/castStats.js";
import { MILESTONES, nextMilestone, giftAt } from "../../../src/lib/streakBoard.js";
import { nextSnoozeIn } from "../../../src/lib/streak.js";
import { zodiacGlyph } from "../../../src/lib/zodiac.js";
import { genId } from "../../../src/lib/storage.js";
import { newCreature } from "../../../src/lib/creatures.js";
import { IMAGE_COUNTS, priceForImages } from "../../../src/lib/pricing.js";
import { priceForFilm } from "../../../src/lib/video.js";
import { SUBSCRIPTIONS, PACKS, allowanceGrant, dreamsFor, packBonus } from "../../../src/lib/plans.js";
import { showcaseFrom } from "../../../src/lib/showcase.js";
import { filmsOf, filmOf, imagesOf } from "../../../src/lib/entryMedia.js";
import { isBlank } from "../../../src/lib/blankNight.js";
import { mediaUrl } from "../../../src/lib/api.js";
import { t, setLanguage } from "../../../src/i18n/index.js";
import { LOCALES } from "../../../src/lib/locales.js";

/* Nativ braucht absolute Adressen. `/media/…` löst mediaUrl auf; alles andere
   Relative (`/clips/…` der Beispielträume, aus public/) liefert derselbe
   Server aus dem gebauten dist. */
const API_BASE = globalThis.__ExpoImportMetaRegistry?.env?.VITE_API_BASE || "";
const absolute = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("/media/") ? API_BASE + u : mediaUrl(u));

/* Die Vorzeige-Clips fürs Onboarding — die stärksten der 19, in der
   Reihenfolge, in der sie erscheinen: erst die vier Feature-Kacheln
   (Halbschlaf → Film → gratis → deiner), dann die Zwischenbilder. */
const SHOWREEL = ["romantic", "ink", "papercut", "oilpaint", "surreal", "fantasyanime", "adventurous", "marionette"];

/* Die Schlafstufe eines Kalendertags (Schlüssel wie localDateKey), oder null. */
function sleepOn(checkins, key) {
  const c = (checkins || []).find((x) => x && x.date === key);
  return c && SLEEP_LEVELS.includes(c.sleep) ? c.sleep : null;
}

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
        // Fuer „Nochmal, anders" (native Fassung): Analyse und Stil des Traums.
        analysis: e.analysis || null, styleId: e.style || null,
        /* Die Mondphase der Nacht (moon.js). Alte Traeume haben keine
           gespeicherte — fuer die wird sie aus dem Datum nachgerechnet,
           dasselbe Ergebnis, nur nicht festgeschrieben. */
        moon: (() => { const m = e.moon || moonForNight(new Date(e.createdAt)); return { phase: m.phase, illum: m.illum, waxing: m.waxing, label: t.moon.phases[m.phase] || m.phase, lit: t.moon.lit(Math.round((m.illum ?? 0) * 100)) }; })(),
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
    /* Die native Tab-Leiste (app/_layout.tsx) — bis hierher stand sie fest
       auf Englisch, der Sprachwechsel erreichte sie nie (Test 23.09.). */
    tabHome: t.tabs.home, tabJournal: t.tabs.journal, tabDream: t.tabs.dream, tabSleep: t.tabs.sleep, tabProfile: t.tabs.profile,
    greetingNight: t.home.greeting.night, greetingMorning: t.home.greeting.morning,
    greetingAfternoon: t.home.greeting.afternoon, greetingEvening: t.home.greeting.evening,
    homeTitle: t.home.title, homeLede: t.home.lede, homeCta: t.home.cta, renderingLine: t.home.renderingLine, quickRecord: t.home.quickRecord,
    lastHeading: t.home.lastHeading, blankCta: t.home.blankCta, blankHint: t.home.blankHint, blankDone: t.home.blankDone,
    soundsShortcut: t.home.soundsShortcut, checkinQuestion: t.checkin.question, checkinThanks: t.checkin.thanks,
    untitled: t.journal.untitled, takes: t.journal.takesLabel, reflectTitle: t.journal.reflectTitle,
    reflectNote: t.journal.reflectNote, reflectCta: t.journal.reflectCta, original: t.journal.original, rendering: t.journal.filmRendering,
    share: t.journal.actShare, recordingTitle: t.journal.recordingTitle, recordingHint: t.journal.recordingHint, shareCard: t.journal.shareCard, shareCardCta: t.journal.shareCardCta, shareCardFooter: t.journal.shareCardFooter, more: t.journal.menu, makeFilm: t.journal.makeFilm, anotherTake: t.journal.makeFilmAgain,
    dreams: t.journal.title,
    /* Das „…"-Menü der Traum-Seite (EntryMenu.jsx) als natives Aktionsblatt. */
    menuEdit: t.journal.edit, menuCorrect: t.journal.correct, menuRewrite: t.journal.rewrite, menuElaborate: t.journal.elaborate,
    menuDelete: t.journal.delete, deleted: t.journal.deleted, cancel: t.wizard.cancel,
    /* Bearbeiten und Umschreiben, nativ seit 13.09. (journal/edit.tsx) —
       dieselben Texte wie JournalDetail.jsx, RefineSheet.jsx, RefineProposal. */
    menuOriginal: t.journal.showOriginal, editing: t.journal.editing, save: t.journal.save, cancelEdit: t.journal.cancelEdit,
    edited: t.journal.edited, working: t.journal.working, tooShort: t.wizard.tooShort,
    refineTitle: t.journal.refineTitle, refineLede: t.journal.refineLede, before: t.journal.before, after: t.journal.after,
    keep: t.journal.keep, accept: t.journal.accept,
    refineHints: { correct: t.journal.correctHint, rewrite: t.journal.rewriteHint, elaborate: t.journal.elaborateHint },
  };
  const sleep = {
    title: t.sleep.title, subtitle: t.sleep.subtitle, free: t.sleep.free,
    tiles: ["breathe", "checklist", "sounds", "guide", "knowledge", "symbols"].map((id) => ({ id, title: t.sleep.tiles[id].title, text: t.sleep.tiles[id].text })),
    breathe: t.breathe,
    /* Das Wissen (13.09.2026): Karten aus src/i18n, neueste zuerst. */
    knowledge: t.knowledge,
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
        /* Tutorial-Strecke (13.09.): Trailer oben — PLATZHALTER ist der
           Vorschau-Clip eines Stils, bis Antons Video da ist. */
        tutorialKicker: l.tutorialKicker, tutorialSteps: [1, 2, 3].map((n) => l.tutorialStep(n)), mediaSoon: l.mediaSoon, methodsLede: l.methodsLede, sourceTitle: l.sourceTitle,
        heroClip: (() => { const c = PRESETS.find((p) => p.id === "fantasyanime"); return c?.clip ? absolute(c.clip) : null; })(),
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
      account: t.profile.account, accountNone: t.profile.accountNone, accountSignedIn: t.profile.accountSignedIn, accountSignedInNoEmail: t.profile.accountSignedInNoEmail, signIn: t.profile.signIn, signOut: t.profile.signOut,
      voice: isVoice(s.voice) ? s.voice : DEFAULT_VOICE,
      voices: VOICES.map((v) => ({ id: v.id, trait: t.voice.traits[v.trait] || v.trait })),
      /* Face-ID-Schalter und Sprachwahl (22.09.2026). Die Sprachnamen
         stehen absichtlich in ihrer eigenen Sprache (locales.js) —
         wer die Oberfläche nicht lesen kann, muss seine Sprache trotzdem
         erkennen. */
      privacy: { title: t.profile.privacyLock, hint: t.profile.privacyLockHint, noBio: t.profile.privacyLockNoBio, unlock: t.profile.privacyUnlock, locked: t.profile.privacyLocked },
      deleteAccount: { title: t.profile.deleteAccount, hint: t.profile.deleteAccountHint, confirmTitle: t.profile.deleteAccountConfirmTitle, confirmText: t.profile.deleteAccountConfirmText, go: t.profile.deleteAccountGo, done: t.profile.deleteAccountDone, failed: t.profile.deleteAccountFailed },
      languageSetting: t.profile.languageSetting, languageSettingHint: t.profile.languageSettingHint,
      languages: LOCALES.map((l) => ({ id: l.id, label: l.label })),
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
    celebrateFirst: t.wizard.step6.celebrateFirst, celebrateN: t.wizard.step6.celebrateN("{n}"), celebrateText: t.wizard.step6.celebrateText, celebrateHint: t.wizard.step6.celebrateHint,
    failedTitle: t.wizard.step5.failedTitle, failedNote: t.wizard.step5.failedNote, failedHome: t.wizard.step5.failedHome,
    presets: PRESETS.map((p) => ({
      id: p.id, styleId: p.styleId, pace: p.pace || null, wide: !!p.wide, emoji: p.emoji || "",
      label: p.id === DREAMFLOW ? w5.presets.dreamflow : (t.styles.byId[p.styleId]?.label || p.styleId),
      clip: p.clip ? absolute(p.clip) : null, featured: p.id === DREAMFLOW || !!styleById(p.styleId)?.featured,
    })),
    models: VIDEO_MODELS.map((m) => ({
      id: m.id, name: w5.filmModels[m.id]?.name || m.id, hint: w5.filmModels[m.id]?.hint || "",
      /* Kleines Abzeichen am Modell („Beste Qualität" am Kino — Antons
         Ansage 23.09.); Text aus der Sprachdatei, nie hart. */
      badge: w5.filmModels[m.id]?.badge || null,
      min: m.min, max: m.max, step: m.step, preset: m.preset, preferred: m.preferred,
      /* Klartext statt Marketing-Namen (Antons Ansage 23.09.: „einfach
         480p, 768p, 1080p schreiben"): Name = Auflösung, dazu die Credits
         je Sekunde — beides aus der Modelltabelle, nie aus Sprachdateien,
         damit ein Preiswechsel nirgends nachgepflegt werden muss. */
      qualities: Object.entries(m.qualities).map(([q, k]) => ({
        id: q,
        name: k.resolution.toLowerCase(),
        perSec: `${k.creditsPerSecond} ${t.wizard.creditsN(k.creditsPerSecond)}/s`,
      })),
    })),
    paces: PACE_IDS.map((id) => ({ id, name: w5.paceNames?.[id] || id, hint: w5.paceHints?.[id] || "" })),
  };
  const realDreams = items.filter((e) => !String(e.id).startsWith("e_seed")).length;
  const journal = {
    view: s.journalView === "list" ? "list" : "deck",
    blankKeys: [...blankDays(s.journal)],
    castCount: (s.cast?.length || 0) + (s.me ? 1 : 0), creatures: (s.creatures || []).length, realDreams,
    /* Der Mond-Streifen (Antons Wunsch 12.09.): fuenf Naechte um heute,
       gerechnet aus dem Datum — kein Standort, keine Erlaubnis. */
    /* Wie geschlafen, je Kalendertag (Antons Wunsch 13.09.): der Check-in
       vom Home-Bildschirm gehört in den Kalender und an den Mond-Streifen —
       auch an Tagen ohne Traum. Stufe 1..3, Farbe entscheidet die Hülle. */
    sleep: Object.fromEntries((s.checkins || []).filter((c) => c && SLEEP_LEVELS.includes(c.sleep)).map((c) => [c.date, c.sleep])),
    sleepLevels: SLEEP_LEVELS.map((l) => ({ level: l, label: t.checkin.levels[l] })),
    moon: {
      title: t.moon.title, tonight: t.moon.tonight, weekdays: t.moon.weekdays,
      strip: moonStrip(new Date()).map((d) => ({ ...d, label: t.moon.phases[d.phase] || d.phase, sleep: sleepOn(s.checkins, d.key) })),
    },
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
    recordTranscribing: t.dream.recordTranscribing, recordTooShort: t.dream.recordTooShort, recordFailed: t.dream.recordFailed, recordDiscard: t.dream.recordDiscard,
    recordAgain: t.dream.recordAgain, yourRecording: t.dream.yourRecording,
    reviewTitle: t.dream.reviewTitle, reviewHint: t.dream.reviewHint, recordListen: t.dream.recordListen, recordPause: t.dream.recordPause, recordTranscribe: t.dream.recordTranscribe, recordRetake: t.dream.recordRetake,
    typeInstead: t.dream.typeInstead, textTitle: t.dream.textTitle, textLede: t.dream.textLede, tellMore: t.dream.tellMore, rewriteAll: t.dream.rewriteAll, transcribeUrl: API_BASE + "/api/transcribe", panelUrl: API_BASE + "/api/panel",
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
    included: pw.included, chips: pw.chips, freeNote: pw.freeNote, cta: pw.cta, notYet: pw.notYet, purchaseThanks: pw.purchaseThanks, purchaseFailed: pw.purchaseFailed, upTo: pw.upTo,
    balance: pw.balance(totalCredits(s)), credits: totalCredits(s),
    subs: SUBSCRIPTIONS.map((p) => {
      const films = dreamsFor(p.credits * (p.period === "year" ? 12 : 1)).films;
      /* Startguthaben (14.09.2026): Das Jahresabo nennt, was am Kauftag
         landet, und was danach jeden Monat dazukommt — beides aus
         allowanceGrant(), also aus derselben Regel, die der Server bucht. */
      const topUp = p.startCredits ? allowanceGrant(p, 1).amount : null;
      return { id: p.id, price: p.price, per: pw.per[p.period], name: pw.periodName[p.period], badge: p.saveHint ? pw.save(p.saveHint) : null,
        extraLine: p.startCredits ? pw.startLine(p.startCredits, dreamsFor(p.startCredits).films) : null,
        sub: topUp ? pw.thenEvery(topUp) : pw.creditsPer(p.credits, pw.periodUnit[p.period]), films, filmsLine: filmsLine(films), filmsWord: pw.yieldFilms(films), featured: !!p.featured, yearly: p.period === "year" };
    }),
    packs: PACKS.map((p) => {
      const films = dreamsFor(p.credits).films;
      /* Extras sichtbar (13.09.2026): „150 Credits" liest sich als
         „130 + 20 Extra", Bezug ist das kleinste Paket (plans.js). */
      const bonus = packBonus(p);
      return { id: p.id, price: p.price, per: pw.oneTime, name: pw.packName(p.credits), badge: bonus.extra > 0 ? pw.packExtra(bonus.percent) : null, extraLine: bonus.extra > 0 ? pw.packExtraLine(bonus.base, bonus.extra) : null, sub: filmsLine(films) || pw.packNote, films, filmsLine: filmsLine(films), filmsWord: pw.yieldFilms(films), featured: p.id === "pack-m", yearly: false };
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
    title: t.journal.library, lede: t.journal.libraryLede, why: t.journal.libraryWhy, newLabel: t.journal.castNew, empty: t.journal.libraryCount(0), never: t.journal.castNever,
    total: (s.cast || []).length + (s.me?.img ? 1 : 0),
    /* Alle vier Gattungen, auch leere (13.09.2026): Die Liste zeigt, was
       hineingehört, statt nur, was schon da ist. */
    groups: [["person", t.profile.people], ["pet", t.profile.pets], ["place", t.profile.places], ["object", t.profile.objects]].map(([category, label]) => ({
      category, label, addLabel: t.avatarDialog.titleFor[category],
      rows: castByCategory(s.cast, s.journal, category).map((e) => ({ id: e.id, tag: e.tag, img: e.img ? mediaUrl(e.img) : null, initial: initialOf(e.tag), count: e.count, countWord: t.journal.castDreamsN(e.count) })),
    })),
  };
  const menagerie = {
    title: t.home.menagerieHeading, lede: t.journal.menagerieLede, empty: t.home.menagerieEmpty,
    creatures: [...(s.creatures || [])].reverse().map((c) => ({ id: c.id, e: c.e || "", name: c.name, rare: c.rare, rareClass: c.rareClass || "", date: c.date || "" })),
  };
  /* Das Einwilligungs-Tor (ConsentGate.jsx): steht, solange keine
     Zustimmung in der aktuellen Version vorliegt — nativ als Vollbild über
     den Tabs. Drei eigene Häkchen, nichts vorangekreuzt (DSGVO Art. 7). */
  /* Das native Onboarding (13.09.): eine Frage je Bildschirm. Werte und
     Reihenfolge kommen aus FORM_FIELDS — eine zweite Aufzaehlung waere die
     Stelle, an der die Wege auseinanderlaufen. */
  const feld = Object.fromEntries(FORM_FIELDS.map((f) => [f.key, f]));
  const werte = (key, labels) => ({ order: feld[key]?.values || [], labels });
  const onb = t.onboard;
  const onboard = {
    ...Object.fromEntries(["skip", "next", "back", "introKicker", "introText", "introCta", "featuresTitle",
      "askTitle", "askText", "askMic", "askMicWhy", "askPhotos", "askPhotosWhy", "askGranted", "askDenied", "askGo",
      "sleepTitle", "sleepAsleep", "sleepNote", "doneTitle", "doneText", "doneCta",
      "accountTitle", "accountText", "accountEmail", "accountPassword", "accountCta", "accountLater", "accountSignedIn", "accountSignedInNoEmail",
      "accountWrong", "accountBusy", "accountUnavailable", "accountOffline", "accountApple"].map((k) => [k, onb[k]])),
    features: onb.features, showcase: onb.showcase, featuresLede: onb.featuresLede, proof: onb.proof, sleepLegend: onb.sleepLegend,
    mascotTitle: onb.mascotTitle, mascotText: onb.mascotText, mascotSoon: onb.mascotSoon,
    meTitle: onb.meTitle, meText: onb.meText, mePick: onb.mePick, meCamera: onb.meCamera, meChange: onb.meChange, meLater: onb.meLater, meDone: onb.meDone, meConsent: onb.meConsent,
    /* Die drei Maskottchen (mascots.js) — zwei noch Platzhalter. Das Video
       kommt als Modulpfad nicht durch die Brücke; nativ liegen dieselben
       Dateien, deshalb reicht die id samt Name und Marke. */
    mascots: MASCOTS.map((m) => ({ id: m.id, name: onb.mascotNames[m.id] || m.name, placeholder: !!m.placeholder })),
    mascot: s.mascot || DEFAULT_MASCOT,
    formName: t.onboarding.formName, formNamePlaceholder: t.onboarding.formNamePlaceholder,
    formGoal: t.onboarding.formGoal, formRecall: t.onboarding.formRecall, formLucid: t.onboarding.formLucid,
    formSleep: t.onboarding.formSleep, formTime: t.onboarding.formTime,
    formThemes: t.onboarding.formThemes, formThemesPlaceholder: t.onboarding.formThemesPlaceholder,
    /* Die Saetze mit Zahl werden nativ gefuellt: Platzhalter 1000. */
    sleepYearsTpl: onb.sleepYears(1000), sleepDreamTpl: onb.sleepDream(1000),
    /* Bewegte Kacheln im Onboarding (Antons Wunsch 13.09., Moonly-Vorbild):
       die stärksten Stil-Clips, von Hand gereiht (Antons Ansage 13.09.:
       „nicht mehr diese alten Träume von mir"). Reihenfolge = Feature-Kacheln
       1–4, danach die Zwischenbilder. */
    clips: SHOWREEL.map((id) => PRESETS.find((p) => p.id === id)).filter((p) => p && p.clip).map((p) => absolute(p.clip)),
    /* Das Zwischenbild „Neunzehn Blicke": ALLE Stile im Sekundenschnitt
       (Antons Wunsch 13.09.) — jeder Stil einmal, Dreamflow nicht doppelt. */
    reel: PRESETS.filter((p) => p.clip && p.id !== DREAMFLOW).map((p) => absolute(p.clip)),
    /* Das Zwischenbild „Die Menschen darin sind deine": Antons Spot (13.09.,
       Seedance 15 s, 9:16, Topaz auf 720p) — der Cursor legt ein Foto auf
       den Barhocker, und die Person wechselt im Sekundentakt. */
    peopleClip: absolute("/clips/showcase-faces.mp4"),
    values: {
      goal: werte("goal", t.dreamer.goalValues), recall: werte("recall", t.dreamer.recallValues),
      lucid: werte("lucid", t.dreamer.lucidValues), sleepHours: werte("sleepHours", t.dreamer.sleepValues),
      timeBudget: werte("timeBudget", t.dreamer.timeValues),
    },
  };
  const consent = { needed: needsConsent(s), ...Object.fromEntries(["title", "intro", "termsPre", "termsLink", "termsMid", "privacyLink", "termsPost", "processing", "adult", "more", "cta"].map((k) => [k, t.consent[k]])), details: t.consent.details, facts: t.consent.facts };
  /* Erinnerungen (13.09.2026): der Plan aus reminders.js, der Stand der
     Erlaubnis und die Texte — auch die der Benachrichtigungen selbst, die
     die native Schicht plant (lib/notifications.ts). */
  const rm = t.reminders; const rs = s.reminders || null;
  const reminders = {
    plan: reminderPlan(rs), granted: rs?.granted ?? null, askedAt: rs?.askedAt ?? null, homeAskDismissed: !!rs?.homeAskDismissed, lastAutoOpen: rs?.lastAutoOpen ?? null,
    labels: {
      title: rm.title, lede: rm.lede, settingsHint: rm.settingsHint, morning: rm.morning, morningHint: rm.morningHint, evening: rm.evening, eveningHint: rm.eveningHint,
      reality: rm.reality, realityHint: rm.realityHint, perDay: Object.fromEntries(Array.from({ length: MAX_PER_DAY }, (_, i) => [i + 1, rm.perDay(i + 1)])),
      autoRecord: rm.autoRecord, autoRecordHint: rm.autoRecordHint, denied: rm.denied, openSettings: rm.openSettings,
      homeAskTitle: rm.homeAskTitle, homeAskText: rm.homeAskText, homeAskYes: rm.homeAskYes, homeAskNo: rm.homeAskNo,
    },
    texts: { morningTitle: rm.morningTitle, morningBody: rm.morningBody, eveningTitle: rm.eveningTitle, eveningBody: rm.eveningBody, realityTitle: rm.realityTitle, realityBodies: rm.realityBodies },
  };
  return { language: s.language || "en", items, labels, home, sleep, profile, wizard: { ...wizard, ...dream }, journal, paywall, symbols, library, menagerie, consent, onboard, reminders };
}

/* Befehle nativ → Web: Die Hülle kann den Web-Speicher nicht schreiben, also
   tut es die Brücke mit denselben Helfern wie die Web-Seite. `command` ist
   { n, type, … }; `n` steigt je Befehl, damit derselbe Befehl nicht zweimal
   läuft. */
/* Die Traumlesung (Analyse): kostet PRICES.improve, wie im Web — Kassen-
   prüfung vorher, abgebucht erst nach gelungenem Aufruf. Antwort geht per
   `onResult` zurück. */
/* ── Der Avatar-Dialog, nativ (13.09.2026) ──────────────────────────────
   Dieselben Regeln wie AvatarDialog.jsx, nur ohne Oberfläche: der Name
   wird zum Tag ([a-z0-9], 12 Zeichen, wie sanitizeTag in server.js), ohne
   Foto UND ohne Beschreibung wird nicht gespeichert, ein Tag darf nur mit
   dem eigenen Eintrag kollidieren, Umbenennen zieht die `references` der
   Träume mit, Löschen lässt alte Träume unangetastet, das eigene Porträt
   (`me`) wird geändert, nie gelöscht. Die Oberfläche ist
   components/avatar-editor.tsx. */
const cleanTag = (raw) => String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
function avatarLabels() {
  const a = t.avatarDialog;
  return {
    titleFor: a.titleFor, editTitleFor: a.editTitleFor, meTitle: a.meTitle, kindLabel: a.kindLabel, kindFor: a.kindFor,
    nameTpl: a.nameLabel("{tag}"), photoHint: a.photoHint, photoLabelClose: a.photoLabelClose, photoLabel: a.photoLabel,
    photoLabelBody: a.photoLabelBody, photoBodyAdd: a.photoBodyAdd, photoBodyWhy: a.photoBodyWhy, photoAdd: a.photoAdd,
    photoTake: a.photoTake, photoReplace: a.photoReplace, photoRemove: a.photoRemove, descLabel: a.descLabel,
    descLabelOptional: a.descLabelOptional, descLabelMe: a.descLabelMe, descLabelMeOptional: a.descLabelMeOptional, descPlaceholder: a.descPlaceholder, privacy: a.privacy, cancel: a.cancel,
    save: a.save, saveChanges: a.saveChanges, needPhotoOrDescHint: a.needPhotoOrDescHint, delete: a.delete,
    drawFromDesc: a.drawFromDesc, drawingNow: a.drawingNow, drawHint: a.drawHint,
    creditsWord: t.wizard.creditsN(PRICES.characterSheet),
    consentFor: a.consentFor, consentSmall: a.consentSmall, needConsent: a.needConsent,
    checking: a.checking, checkOk: a.checkOk, checkUnavailable: a.checkUnavailable, checkBlockedSave: a.checkBlockedSave,
  };
}

/* Die Bestätigung je Foto (Antons Ansage 13.09.2026): Wer ein Foto
   hochlädt, sagt bei JEDEM Foto ausdrücklich, dass er es verwenden darf.
   Gespeichert wird, WANN und FÜR WELCHE Fotos — ein neues Foto braucht eine
   neue Bestätigung, deshalb der Fingerabdruck über beide Bilder. Das ist der
   Nachweis, dass die Verantwortung beim Hochladenden liegt. */
const PHOTO_CONSENT_VERSION = 1;
function photoPrint(e) {
  const src = `${e?.img || ""}\0${e?.img2 || ""}`;
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h * 33) ^ src.charCodeAt(i)) >>> 0;
  return `${src.length.toString(36)}.${h.toString(36)}`;
}
function photoConsentFor(a) {
  return a.img || a.img2 ? { v: PHOTO_CONSENT_VERSION, at: new Date().toISOString(), of: photoPrint(a) } : undefined;
}
function hasPhotoConsent(e) {
  return Boolean(e?.photoConsent && e.photoConsent.of === photoPrint(e));
}
async function runAvatar(cmd, onResult) {
  const s = loadState();
  if (cmd.type === "avatarLoad") {
    const existing = cmd.mode === "me" ? (s.me || null) : cmd.mode === "edit" ? (s.cast || []).find((c) => c.id === cmd.id) || null : null;
    if (cmd.mode === "edit" && !existing) { onResult({ n: cmd.n, error: "notfound" }); return true; }
    onResult({ n: cmd.n, result: {
      labels: avatarLabels(), price: PRICES.characterSheet,
      entry: { tag: cleanTag(existing?.tag || cmd.tag || ""), desc: existing?.desc || "", img: existing?.img || "", img2: existing?.img2 || "", category: existing?.category || null, photoConsent: hasPhotoConsent(existing) },
    } });
    return true;
  }
  if (cmd.type === "avatarSave") {
    const a = cmd.avatar || {};
    const clean = cleanTag(a.tag);
    const desc = String(a.desc || "").trim().slice(0, 120);
    if (!clean) { onResult({ n: cmd.n, error: t.avatarDialog.needName }); return true; }
    if (!a.img && !desc) { onResult({ n: cmd.n, error: t.avatarDialog.needPhotoOrDesc }); return true; }
    if ((a.img || a.img2) && a.consent !== true) { onResult({ n: cmd.n, error: t.avatarDialog.needConsent }); return true; }
    const photoConsent = photoConsentFor(a);
    // Das Ergebnis der Foto-Prüfung reist mit, am selben Fingerabdruck wie der Haken.
    const photoCheck = a.check && photoConsent ? { status: a.check, at: photoConsent.at, of: photoConsent.of } : undefined;
    if (cmd.mode === "me") {
      saveState({ ...s, me: { ...(s.me || {}), tag: clean, desc, img: a.img || "", img2: a.img2 || "", photoConsent, photoCheck } });
      onResult({ n: cmd.n, result: { toast: t.avatarDialog.saved(clean) } });
      return true;
    }
    if ((s.cast || []).some((p) => p.tag === clean && p.id !== cmd.id)) { onResult({ n: cmd.n, error: t.avatarDialog.exists(clean) }); return true; }
    if (cmd.mode === "edit") {
      const old = (s.cast || []).find((p) => p.id === cmd.id);
      if (!old) { onResult({ n: cmd.n, error: "notfound" }); return true; }
      const saved = { ...old, tag: clean, desc, img: a.img || "", img2: a.img2 || "", photoConsent, photoCheck };
      const patch = { cast: (s.cast || []).map((p) => (p.id === old.id ? saved : p)) };
      if (old.tag !== clean) {
        patch.journal = (s.journal || []).map((e) => ({ ...e, references: (e.references || []).map((r) => (r.tag === old.tag ? { ...r, tag: clean } : r)) }));
      }
      saveState({ ...s, ...patch });
      onResult({ n: cmd.n, result: { toast: t.avatarDialog.saved(clean), id: saved.id } });
      return true;
    }
    const kind = ["person", "pet", "place", "object"].includes(a.category) ? a.category : "person";
    const avatar = { id: genId("c"), tag: clean, category: kind, desc, img: a.img || "", img2: a.img2 || "", photoConsent, photoCheck };
    saveState({ ...s, cast: [...(s.cast || []), avatar] });
    onResult({ n: cmd.n, result: { toast: t.avatarDialog.created(clean), id: avatar.id } });
    return true;
  }
  /* Die Foto-Prüfung im Hintergrund (13.09.2026): Der Dialog fragt, sobald
     ein Foto mit Haken dasteht. Ein Netz- oder Serverfehler ist „nicht
     prüfbar", nie „abgelehnt" — sonst sperrte ein Funkloch ein gutes Foto. */
  if (cmd.type === "avatarCheck") {
    const img = String(cmd.photo || "");
    if (!img.startsWith("data:")) { onResult({ n: cmd.n, result: { status: "unavailable", reason: "nophoto" } }); return true; }
    try {
      const small = await compactDataUrl(img);
      const r = await photoCheck({ image: small, category: cmd.category || "person" });
      const reason = r?.reason || null;
      const message = r?.status === "blocked" ? (t.avatarDialog.checkReasons[reason] || t.avatarDialog.checkReasons.provider) : null;
      onResult({ n: cmd.n, result: { status: r?.status || "unavailable", reason, message } });
    } catch (e) {
      onResult({ n: cmd.n, result: { status: "unavailable", reason: "network" } });
    }
    return true;
  }
  if (cmd.type === "avatarDelete") {
    const old = (s.cast || []).find((p) => p.id === cmd.id);
    if (old) saveState({ ...s, cast: (s.cast || []).filter((p) => p.id !== cmd.id) });
    onResult({ n: cmd.n, result: { toast: old ? t.profile.removed(old.tag) : null } });
    return true;
  }
  if (cmd.type === "avatarDraw") {
    /* Der Charakterbogen: erst rendern, DANN abbuchen — ein Fehlschlag
       kostet nichts (wie überall). Als data:-URI, weil fal einen
       /media/-Pfad dieses Rechners nicht laden kann (Befund 20.08.). */
    if (!spend(s, PRICES.characterSheet)) { onResult({ n: cmd.n, error: "nocredits" }); return true; }
    try {
      const url = await characterSheet({ desc: String(cmd.text || "").trim(), category: cmd.category || "person" });
      const img = await compactDataUrl(mediaUrl(url));
      const now = loadState();
      const paid = spend(now, PRICES.characterSheet);
      if (paid) saveState({ ...now, ...paid });
      onResult({ n: cmd.n, result: { img } });
    } catch (e) {
      onResult({ n: cmd.n, error: e?.message || String(e) });
    }
    return true;
  }
  return false;
}

/* ── Der Auftrag, nativ (Vorarbeit 13.09.2026) ──────────────────────────
 * Step5Style.run() für den FILM, ohne Oberfläche — Schritt für Schritt
 * dieselbe Reihenfolge, damit der Geldweg nicht auseinanderläuft:
 *   1. Kassenprüfung (quoteFor, dieselbe Rechnung wie der Server; 409
 *      dort, wenn er teurer liegt), noch nicht abgebucht.
 *   2. Besetzung: Namen der Analyse, Auto-Treffer (autoMatch), Vorgaben
 *      aus dem nativen Besetzungs-Schritt (assignmentOverrides).
 *   3. Bogen-Pflicht: Fotos von Personen und Tieren werden VOR dem Render
 *      einmal zum grauen Bogen (characterSheet), am Tag festgeschrieben.
 *   4. Der Traum entsteht JETZT im Journal, mit Marke `pending` — ab hier
 *      überlebt er jeden Bildschirmwechsel (Antons Befund 22.08.).
 *   5. Schnittplan (selectBeats/shotPlan) und Auftrag (generate) — die
 *      Auftragsnummer hängt sofort am Traum, dann wird abgebucht.
 * Scheitert 5, bleibt der Traum mit `failReason`, wie im Web.
 * ⚠ Noch NICHT der Weg der App: dream/order.tsx nutzt weiter den
 * Web-Motor, bis dieser Befehl an einem echten Auftrag belegt ist
 * (NATIVE_ORDER dort). Bilder-Aufträge kennt er nicht — es gibt nur Film. */
async function runOrder(cmd, onResult) {
  const o = cmd.order || {};
  const s0 = loadState();
  if ((o.mode || "film") !== "film") { onResult({ n: cmd.n, error: "unsupported" }); return true; }
  const modelId = o.videoModel || "standard";
  const seconds = clampSeconds(modelId, o.seconds);
  const quality = filmQuality(modelId, o.quality).id;
  const pace = o.pace || DEFAULT_PACE;
  const price = quoteFor({ mode: "film", model: modelId, seconds, quality, keyframe: false });
  if (!spend(s0, price)) { onResult({ n: cmd.n, error: "nocredits", price }); return true; }
  const analysis = o.analysis || null;

  /* 2. Besetzung — wie seedAssignments in useWizard.js, dann die Vorgaben. */
  const build = (items, fallbackKind) => (items || []).reduce((acc, item) => {
    const name = typeof item === "string" ? item : item?.name;
    if (!name) return acc;
    const kind = typeof item === "object" && item?.kind === "pet" ? "pet" : fallbackKind;
    const wardrobe = (typeof item === "object" && item?.wearing) || "";
    const avatar = autoMatch(name, s0.cast, s0.me);
    acc[name] = { name, kind, ...(wardrobe ? { wardrobe } : {}), ...(avatar ? { avatar } : {}), ...(startsFree(kind, avatar) ? { free: true } : {}) };
    return acc;
  }, {});
  const assignments = { ...build(analysis?.people, "person"), ...build(analysis?.places, "place"), ...build(analysis?.objects, "object") };
  const byId = (id) => (id === "me" ? (s0.me ? { ...s0.me, id: "me", category: "person" } : null) : (s0.cast || []).find((c) => c.id === id) || null);
  for (const [name, ov] of Object.entries(o.assignmentOverrides || {})) {
    if (!assignments[name] || !ov) continue;
    if (ov.free) assignments[name] = { ...assignments[name], avatar: undefined, free: true };
    else if (ov.avatarId) { const av = byId(ov.avatarId); if (av) assignments[name] = { ...assignments[name], avatar: av, free: false }; }
  }
  const list = Object.values(assignments);
  const { clauses } = buildReferences(list);

  /* 3. Bogen-Pflicht — Arbeitskopien, über den TAG festgeschrieben (25.08.). */
  let workingCast = s0.cast || [];
  let workingMe = s0.me;
  const members = list.filter((a) => a.avatar?.img).map((a) => ({
    tag: a.avatar.tag, category: ["pet", "place", "object"].includes(a.kind) ? a.kind : "person",
    desc: a.avatar.desc || "", img: a.avatar.img, img2: a.avatar.img2, sheet: a.avatar.sheet, sheetOf: a.avatar.sheetOf,
  }));
  for (const member of members) {
    if (!needsSheet(member)) continue;
    try {
      const url = await characterSheet({ photo: member.img, photo2: member.img2, desc: member.desc, category: member.category });
      member.sheet = await compactDataUrl(mediaUrl(url));
      member.sheetOf = sheetFingerprint(member);
      const bogen = { sheet: member.sheet, sheetOf: member.sheetOf };
      if (workingCast.some((p) => p?.tag === member.tag)) workingCast = workingCast.map((p) => (p?.tag === member.tag ? { ...p, ...bogen } : p));
      if (workingMe?.tag === member.tag) workingMe = { ...workingMe, ...bogen };
      saveState({ ...loadState(), cast: workingCast, me: workingMe });
    } catch (e) {
      console.warn("[bridge] Bogen übersprungen:", e?.message || e);   // Kür, nie Pflicht im Fehlerfall
    }
  }
  const castForApi = members.map((m) => ({ tag: m.tag, category: m.category, desc: m.desc, img: renderRef(m) }));

  /* 4. Der Traum entsteht jetzt. */
  const s1 = loadState();
  const entryId = o.entryId || genId("e");
  const isNew = !o.entryId || !(s1.journal || []).some((e) => e.id === entryId);
  const entryRefs = list.filter((a) => a.avatar?.tag).map((a) => ({ tag: a.avatar.tag, category: a.kind }));
  const common = {
    mode: "film", style: o.styleId, format: "9:16", imageCount: 0, analysis, references: entryRefs,
    pending: { kind: "film", n: 1 }, fallback: undefined, failReason: undefined,
  };
  if (isNew) {
    const creature = newCreature(o.text, refreshStreak(s1).streak);
    const entry = {
      id: entryId, createdAt: new Date().toISOString(), text: o.text, originalText: o.originalText || o.text,
      title: String(o.title || analysis?.title || "").trim() || creature.title, tagline: String(o.tagline || analysis?.tagline || "").trim(),
      media: { type: "image", urls: [], source: "none" }, creatureId: creature.id, moon: moonForNight(),
      ...(s1.pendingAudioUrl ? { audio: { url: s1.pendingAudioUrl } } : {}),
      ...common,
    };
    saveState({ ...s1, journal: [...(s1.journal || []), entry], pendingAudioUrl: null });
  } else {
    saveState({ ...s1, journal: (s1.journal || []).map((e) => (e.id === entryId ? { ...e, ...common } : e)) });
  }
  onJournalTick?.();

  /* 5. Schnitt und Auftrag. */
  const arc = analysis?.beats || [];
  const cap = Math.max(1, Math.min(beatBudget(modelId, seconds, pace), arc.length || 1));
  const order = arc.length ? selectBeats(analysis, cap) : [];
  const shots = arc.length ? shotPlan(analysis, order, seconds, filmPace(pace).minShot) : undefined;
  const beats = arc.length ? order.map((i) => arc[i]) : [o.text];
  try {
    const { jobId } = await generate({
      dream: o.text, mode: "film", seconds, title: String(o.title || analysis?.title || "").trim(), tagline: String(o.tagline || analysis?.tagline || "").trim(),
      model: modelId, quality, quoted: price, cast: castForApi, styleId: o.styleId, beats, shots, pace,
      prompt: buildImagePrompt({ beat: beatsForCount(arc.length ? arc : [o.text], 1)[0] || o.text, styleId: o.styleId, format: "9:16", clauses, index: 1, total: 1 }),
    });
    const s2 = loadState();
    saveState({
      ...s2, ...(spend(s2, price) || {}),
      journal: (s2.journal || []).map((e) => (e.id === entryId
        ? { ...e, jobId, pending: undefined, filmPlan: { model: modelId, quality, seconds, pace, scenes: order.length } }
        : e)),
    });
    onResult({ n: cmd.n, result: { entryId, jobId, price } });
  } catch (e) {
    const s2 = loadState();
    saveState({ ...s2, journal: (s2.journal || []).map((x) => (x.id === entryId ? { ...x, pending: undefined, failReason: e?.message || String(e) } : x)) });
    onResult({ n: cmd.n, error: e?.message || String(e), entryId });
  }
  return true;
}
let onJournalTick = null;

async function runAsync(cmd, onResult) {
  if (cmd.type === "order") return runOrder(cmd, onResult);
  /* Konto-Sicherung (23.09.2026, mobile/src/lib/dream-sync.ts): Die Brücke
     kennt das Tagebuch, die native Seite das Konto. Hinaus geht die
     Sicherungsform aus journalBackup.js — dieselbe erlaubte Liste wie für
     die Dateisicherung, also nie ein Foto. Herein kommt sie über
     mergeShared(): nur Unbekanntes ergänzen und leere Bilder/Filme
     nachfüllen, NIE einen vorhandenen Eintrag überschreiben oder löschen. */
  if (cmd.type === "syncExport") {
    onResult({ n: cmd.n, result: { dreams: backupPayload(loadState().journal).map((x) => x.traum) } });
    return true;
  }
  if (cmd.type === "syncImport") {
    const s = loadState();
    const merged = mergeShared(s.journal || [], Array.isArray(cmd.dreams) ? cmd.dreams : []);
    if (merged) saveState({ ...s, journal: merged });
    onResult({ n: cmd.n, result: { changed: Boolean(merged) } });
    return true;
  }
  if (String(cmd.type).startsWith("avatar")) return runAvatar(cmd, onResult);
  /* Sprachwechsel wie im Web (LanguagePicker.jsx): ERST t umschalten —
     für die fünf eingefrorenen Sprachen lädt das Modul erst nach, deshalb
     asynchron — DANN den Zustand schreiben; der Snapshot danach ist schon
     übersetzt. */
  if (cmd.type === "language") {
    const locale = await setLanguage(cmd.value);
    saveState({ ...loadState(), language: locale.id });
    return true;
  }
  /* Das eigene Foto aus dem Onboarding (13.09.): kommt nativ schon auf
     1600 px verkleinert als Data-URL, wird hier wie im Avatar-Dialog noch
     einmal durch compactDataUrl gezogen (JPEG, dieselbe Grenze) und liegt
     dann als `me.img` — genau dort, wo Besetzung und Prompts es lesen. */
  if (cmd.type === "mePhoto") {
    try {
      const img = typeof cmd.photo === "string" && cmd.photo.startsWith("data:") ? await compactDataUrl(cmd.photo) : "";
      const s = loadState();
      /* Das Onboarding sagt unter dem Knopf „Mit dem Foto bestätigst du: Das
         bist du." — die Wahl selbst ist die Bestätigung, also wird sie hier
         wie im Avatar-Dialog festgehalten (13.09.2026). */
      const me = { ...(s.me || {}), img };
      saveState({ ...s, me: { ...me, photoConsent: photoConsentFor(me) } });
      onResult({ n: cmd.n, result: { ok: true } });
    } catch (e) {
      onResult({ n: cmd.n, error: e?.message || String(e) });
    }
    return true;
  }
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
      people: (a.people || []).map((x) => row(typeof x === "string" ? x : x.name, typeof x === "object" && x?.kind === "pet" ? "pet" : "person")),
      places: (a.places || []).map((x) => row(typeof x === "string" ? x : x.name, "place")),
      objects: (a.objects || []).map((x) => row(typeof x === "string" ? x : x.name, "object")),
      library: lib,
      labels: { people: t.wizard.step3.title, peopleLede: t.wizard.step3.lede, peopleEmpty: t.wizard.step3.empty,
                places: t.wizard.step4.title, placesLede: t.wizard.step4.lede, placesEmpty: t.wizard.step4.empty,
                free: t.wizard.cast.freeSet, freeShort: t.wizard.cast.freeShort, newShort: t.wizard.cast.newShort, undecided: t.wizard.cast.undecided, choose: t.wizard.cast.choose, change: t.wizard.cast.change,
                createNew: t.wizard.cast.createNew,
                objects: t.wizard.cast.objectsTitle, objectsLede: t.wizard.cast.objectsLede, objectsEmpty: t.wizard.cast.objectsEmpty,
                textTitle: t.wizard.cast.textTitle, markHint: t.wizard.cast.markHint, addTitle: t.wizard.cast.addTitle, addName: t.wizard.cast.addName,
                addAs: t.wizard.cast.addAs, add: t.wizard.cast.add, removeFromCast: t.wizard.cast.removeFromCast, whoIs: t.wizard.cast.whoIs("{name}"), close: t.wizard.cast.close,
                kindFor: t.avatarDialog.kindFor },
    } });
    return true;
  }
  /* Umschreiben (correct/rewrite/elaborate) — REFINE_MODES in server.js,
     gratis wie jede Textarbeit (pricing.js). Die Brücke liefert nur den
     VORSCHLAG; übernommen wird er erst mit `dreamText` — es ist sein Traum,
     und nichts ersetzt ihn hinter seinem Rücken. */
  if (cmd.type === "refine") {
    const s = loadState();
    const e = (s.journal || []).find((x) => x.id === cmd.id);
    if (!e) { onResult({ n: cmd.n, error: "notfound" }); return true; }
    const mode = ["correct", "rewrite", "elaborate"].includes(cmd.value) ? cmd.value : "correct";
    const paid = spend(s, PRICES[mode] ?? 0);
    if (!paid) { onResult({ n: cmd.n, error: "nocredits" }); return true; }
    try {
      const text = await refine(e.text, mode);
      saveState({ ...loadState(), ...paid });
      onResult({ n: cmd.n, result: { text } });
    } catch (err) {
      onResult({ n: cmd.n, error: err?.message || String(err) });
    }
    return true;
  }
  if (cmd.type === "reflect") {
    const s = loadState();
    const e = (s.journal || []).find((x) => x.id === cmd.id);
    if (!e) { onResult({ n: cmd.n, error: "notfound" }); return true; }
    try {
      const text = await reflect(e.text, reflectionContext(s.journal, e), s.language);
      const now = loadState();
      saveState({ ...now, journal: (now.journal || []).map((x) => (x.id === e.id ? { ...x, reflection: { text, at: new Date().toISOString() } } : x)) });
      onResult({ n: cmd.n, result: { text } });
    } catch (err) {
      onResult({ n: cmd.n, error: err?.message || String(err) });
    }
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
    patch = { journal: j.map((e) => (e.id === target ? { ...e, audio: { url: cmd.audioUrl } } : e)), pendingAudioUrl: null };
  }
  else if (cmd.type === "consent") patch = consentPatch();
  else if (cmd.type === "onboarded") {
    /* Das Onboarding ist durch: Antworten in dasselbe Profil, das der
       Web-Weg schreibt (profileFromAnswers) — keine Willkommens-Credits
       mehr (Antons Ansage 12.09.). */
    const profile = profileFromAnswers(cmd.answers || {}, zodiacOf);   // nimmt `goals` ODER `goal`
    const mascotId = MASCOTS.some((m) => m.id === cmd.answers?.mascot) ? cmd.answers.mascot : null;
    patch = { onboarded: true, surveyDone: true, profile, ...(mascotId ? { mascot: mascotId } : {}), ...(profile.name ? { me: { ...(s.me || {}), tag: profile.name } } : {}) };
  }
  else if (cmd.type === "dreamText") {
    /* Neuer Wortlaut (Bearbeiten oder angenommener Vorschlag) — wie
       commitText in JournalDetail.jsx: der erste Wortlaut bleibt als
       `originalText`, die Reflection fällt weg (sie beschrieb den alten). */
    const clean = String(cmd.text || "").trim();
    if (clean.length >= 8) {
      patch = { journal: (s.journal || []).map((e) => (e.id === cmd.id
        ? { ...e, text: clean, reflection: undefined, originalText: e.originalText || e.text, editedAt: new Date().toISOString() }
        : e)) };
    }
  }
  else if (cmd.type === "paywallSeen") patch = { paywallSeen: true };
  else if (cmd.type === "deleteDream") patch = { journal: (s.journal || []).filter((e) => e.id !== cmd.id) };
  else if (cmd.type === "voice") { if (isVoice(cmd.value)) patch = { voice: cmd.value }; }
  /* Gutschrift nach bestätigtem Apple-Kauf (B1, 23.09.2026): Die Hülle
     meldet nur die plan-id — die MENGE steht hier, in plans.js, nie im
     Befehl (ein manipulierter Befehl könnte sonst beliebig gutschreiben).
     Pakete erhöhen das Kauf-Töpfchen, Abos setzen das Monatsguthaben
     (applyAllowanceGrant, wie im Web geplant). ⚠ Lokal, bis der Server
     Belege prüft — siehe mobile/src/lib/iap.ts. */
  else if (cmd.type === "purchase") {
    const pack = PACKS.find((p) => p.id === cmd.value);
    const sub = SUBSCRIPTIONS.find((p) => p.id === cmd.value);
    if (pack) patch = { credits: (s.credits ?? 0) + pack.credits };
    else if (sub) patch = applyAllowanceGrant(s, allowanceGrant(sub, 0));
  }
  else if (cmd.type === "withdraw") patch = withdrawPatch();
  else if (cmd.type === "reminders") patch = { reminders: { ...(s.reminders || {}), ...reminderWish(!!cmd.wants, cmd.perDay || DEFAULT_PER_DAY) } };
  else if (cmd.type === "reminderSet") patch = { reminders: setReminder(s.reminders, cmd.value, { on: cmd.wants, time: cmd.text }) };
  else if (cmd.type === "reminderAnswered") patch = { reminders: reminderAnswered(s.reminders, !!cmd.wants) };
  else if (cmd.type === "autoOpened") patch = { reminders: { ...(s.reminders || {}), lastAutoOpen: cmd.date } };
  else if (cmd.type === "saveDream") {
    /* Nur speichern (Step2Output.saveOnly): kein Render, keine Kosten, mit
       Wesen und Serie — dieselbe Reihenfolge wie im Web. */
    const creature = newCreature(cmd.text, refreshStreak(s).streak);
    const entry = {
      id: genId("e"), createdAt: new Date().toISOString(), text: cmd.text, originalText: cmd.originalText || cmd.text,
      title: (cmd.title || "").trim() || creature.title, tagline: (cmd.tagline || "").trim(), mode: "save",
      media: { type: "image", urls: [], source: "none" }, analysis: cmd.analysis || null, references: [], creatureId: creature.id,
      ...((cmd.audioUrl || s.pendingAudioUrl) ? { audio: { url: cmd.audioUrl || s.pendingAudioUrl } } : {}),
      moon: moonForNight(),          // die Mondphase dieser Nacht (moon.js)
    };
    patch = { journal: [...(s.journal || []), entry], creatures: [...(s.creatures || []), creature], ...bumpStreak(s), pendingAudioUrl: null };
  }
  else if (cmd.type === "pendingAudio") patch = { pendingAudioUrl: cmd.audioUrl || null };
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
   Credits, solange kein Konto und kein Supabase dahinter ist"): Die Brücke
   füllt das Kauf-Töpfchen bei jedem Lesen auf mindestens `devCredits` auf —
   dieselbe Stelle wie der „+100 test credits"-Knopf des Web-Startmenüs
   (StartMenu.jsx), das die Hülle nicht zeigt. Seit 18.09. gibt die Hülle
   500 in ALLEN Bauarten herein (Anton testet den Release-Bau auf dem
   iPhone, journal-data.tsx) — vor der Veröffentlichung dort zurückdrehen. */
function devTopUp(min) {
  if (!min) return;
  const s = loadState();
  if (totalCredits(s) >= min) return;
  saveState({ ...s, credits: (s.credits ?? 0) + (min - totalCredits(s)) });
}

/* Sprachabgleich vor jedem Snapshot (22.09.2026): Jeder Tab hat seinen
   eigenen Brücken-Webview, aber `t` schaltet nur dort um, wo der
   language-Befehl ankam — die anderen pushten weiter die alte Sprache,
   und der letzte Push gewann. Deshalb vergleicht jede Brücke vor dem
   Snapshot den Zustand mit der eigenen Sprache und zieht `t` nach.
   Für en/de füllt setLanguage synchron (i18n/index.js); bei den fünf
   nachgeladenen Sprachen ist der eine Push noch alt — der nächste Takt
   (3 s) trägt dann die Übersetzung. */
let bridgeLang = null;
function syncLanguage() {
  const want = loadState().language || "en";
  if (bridgeLang === want) return;
  bridgeLang = want;
  setLanguage(want);
}

export default function JournalBridge({ onJournal, onResult, refreshTick = 0, command, devCredits = 0, dom }) {
  useEffect(() => {
    const push = () => { try { syncLanguage(); devTopUp(devCredits); onJournal(snapshot()); } catch (e) { console.warn("[bridge]", e); } };
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
    /* Ein langer Befehl (Auftrag) meldet Zwischenstände — der Traum
       liegt im Journal, bevor die Auftragsnummer da ist. */
    onJournalTick = () => onJournal(snapshot());
    (async () => {
      try {
        if (await runAsync(command, onResult || (() => {}))) { onJournal(snapshot()); return; }
        run(command); onJournal(snapshot());
      } catch (e) { console.warn("[bridge] command", e); }
    })();
  }, [command?.n]);
  return null;
}
