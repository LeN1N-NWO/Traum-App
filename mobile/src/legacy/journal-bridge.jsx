"use dom";
/* Die Datenbrücke Web → nativ (12.09.2026, ADR-0006 Schritt 4).
 *
 * Das Journal lebt bis zum Umzug der Datenschicht im localStorage der
 * Webviews; nativ kommt niemand dort hinein. Dieser unsichtbare Webview
 * (Höhe 0) liest ihn und reicht eine schlanke Liste an die Hülle — über die
 * async-Funktion `onJournal`, die Expo als Prop hinüberträgt. Er liest neu,
 * wenn `refreshTick` steigt (Tab-Fokus) oder ein anderer Webview speichert.
 *
 * Die Leser (filmOf, imagesOf, isBlank, mediaUrl) sind die der Web-App —
 * eine Wahrheit über die Form eines Eintrags, nicht zwei. */
import "./vite-env.js";                       // ⚠ zuerst, API_BASE
import { useEffect } from "react";
import { loadState } from "../../../src/lib/storage.js";
import { filmOf, imagesOf } from "../../../src/lib/entryMedia.js";
import { isBlank } from "../../../src/lib/blankNight.js";
import { mediaUrl } from "../../../src/lib/api.js";

/* Nativ braucht absolute Adressen. `/media/…` löst mediaUrl auf; alles andere
   Relative (`/clips/…` der Beispielträume, aus public/) liefert derselbe
   Server aus dem gebauten dist. */
const API_BASE = globalThis.__ExpoImportMetaRegistry?.env?.VITE_API_BASE || "";
const absolute = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("/media/") ? API_BASE + u : mediaUrl(u));

function snapshot() {
  const s = loadState();
  const items = (s.journal || [])
    .filter((e) => !isBlank(e))
    .map((e) => {
      const film = filmOf(e);
      const image = imagesOf(e)[0] || null;
      const pending = !!e.pending || (e.imageJobs || []).length > 0 || (!film && !!e.jobId);
      return {
        id: e.id,
        createdAt: e.createdAt,
        title: e.title || "",
        tagline: e.tagline || "",
        text: (e.text || "").slice(0, 160),
        media: film ? { kind: "film", url: absolute(film) } : image ? { kind: "image", url: absolute(image) } : null,
        pending,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { language: s.language || "en", items };
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
