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
import { totalCredits } from "../../../src/lib/credits.js";
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
  return { language: s.language || "en", items, labels, home, sleep, profile };
}

/* Befehle nativ → Web: Die Hülle kann den Web-Speicher nicht schreiben, also
   tut es die Brücke mit denselben Helfern wie die Web-Seite. `command` ist
   { n, type, … }; `n` steigt je Befehl, damit derselbe Befehl nicht zweimal
   läuft. */
function run(cmd) {
  const s = loadState();
  let patch = null;
  if (cmd.type === "blankNight") patch = { journal: [...(s.journal || []), blankNight()], ...bumpStreak(s) };
  else if (cmd.type === "checkin") patch = { checkins: setCheckin(s.checkins, cmd.level) };
  else if (cmd.type === "refreshStreak") { const f = refreshStreak(s); if (f.streak !== s.streak) patch = f; }
  if (patch) saveState({ ...s, ...patch });
}

export default function JournalBridge({ onJournal, refreshTick = 0, command, dom }) {
  useEffect(() => {
    const push = () => { try { onJournal(snapshot()); } catch (e) { console.warn("[bridge]", e); } };
    push();
    window.addEventListener("storage", push);
    return () => window.removeEventListener("storage", push);
  }, [onJournal, refreshTick]);
  useEffect(() => {
    if (!command) return;
    try { run(command); onJournal(snapshot()); } catch (e) { console.warn("[bridge] command", e); }
  }, [command?.n]);
  return null;
}
