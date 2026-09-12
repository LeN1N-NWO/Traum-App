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
  };
  const profile = {
    title: t.profile.title, name: s.me?.tag || t.profile.you, img: s.me?.img || null,
    hint: s.me?.img ? t.profile.meSet : t.profile.meEmpty,
    credits: totalCredits(s), creditsWord: t.profile.credits,
    dreams: (s.journal || []).length, streak, statDreams: t.profile.statDreams, statStreak: t.profile.statStreak,
    settings: t.profile.settings, surveyDone: !!s.surveyDone,
    surveyTitle: t.onboarding.profileCard, surveyHint: t.onboarding.profileCardHint,
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
  return { language: s.language || "en", items, labels, home, sleep, profile, wizard };
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
                free: t.wizard.cast.freeSet, undecided: t.wizard.cast.undecided, choose: t.wizard.cast.choose, change: t.wizard.cast.change },
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
