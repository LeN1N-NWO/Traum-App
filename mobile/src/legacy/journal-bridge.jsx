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
import { loadState } from "../../../src/lib/storage.js";
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
  const labels = {
    untitled: t.journal.untitled, takes: t.journal.takesLabel, reflectTitle: t.journal.reflectTitle,
    reflectNote: t.journal.reflectNote, original: t.journal.original, rendering: t.journal.filmRendering,
    share: t.journal.actShare, more: t.journal.menu, makeFilm: t.journal.makeFilm, anotherTake: t.journal.makeFilmAgain,
    dreams: t.journal.title,
  };
  return { language: s.language || "en", items, labels };
}

export default function JournalBridge({ onJournal, refreshTick = 0, dom }) {
  useEffect(() => {
    const push = () => { try { onJournal(snapshot()); } catch (e) { console.warn("[bridge]", e); } };
    push();
    window.addEventListener("storage", push);
    return () => window.removeEventListener("storage", push);
  }, [onJournal, refreshTick]);
  return null;
}
