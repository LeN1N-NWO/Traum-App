/* Der Abholer — die App-weite Hälfte des Hintergrund-Renderns.
 *
 * Antons Ansage (21.08.2026): Kein Wartebildschirm. Ein Traum, dessen
 * Bilder gerade entstehen, steht SOFORT als Kachel im Journal („wird
 * gerade erstellt"), die App bleibt benutzbar, und wenn alles da ist,
 * meldet sich ein Toast. Diese Datei ist die Logik dahinter; verdrahtet
 * wird sie EINMAL in AppState.jsx — nicht je Bildschirm, sonst fragt
 * jede offene Ansicht denselben Auftrag doppelt ab.
 *
 * EINE Mechanik für beide Auftragsarten:
 *   entry.jobId      — ein Film (gab es schon; vorher holte ihn nur das
 *                      geöffnete Traum-Detail ab — wer im Startscreen
 *                      wartete, wartete umsonst)
 *   entry.imageJobs  — Bilder, seit dem 21.08.: [{ id, url?, failed? }]
 *                      in Anzeige-Reihenfolge (Poster zuerst, wenn eins
 *                      bestellt war)
 *
 * Ehrlichkeitsregeln:
 * - Ein Aussetzer ist kein Scheitern: wirft jobStatus (Funkloch), bleibt
 *   der Auftrag einfach offen und die nächste Runde fragt wieder.
 * - Gescheiterte Bilder werden ERSTATTET (1 Credit je Bild — dieselbe
 *   Zahl wie in pricing.js: 1 Credit = 1 Bild). „Es wurde nichts
 *   abgebucht" gilt im Auftragsmodell nicht mehr wörtlich, also muss
 *   Geld zurückfließen, wo nichts geliefert wurde.
 * - Fällt das Poster (Auftrag 1) aus, wird media.poster falsch — sonst
 *   läse das Storyboard das erste SZENENBILD als Titelkarte.
 */

import { chainRemaining } from "./imageChain.js";

/* Eine Kette mit offenen Szenen zählt als „steht aus", auch wenn gerade
   kein Auftrag läuft — zwischen „Bild n ist da" und „Szene n+1 ist
   eingereicht" liegt genau der Moment, in dem sonst alles einschliefe. */
const pending = (e) =>
  e.jobId || (e.imageJobs || []).length > 0 || (e.sceneJobs || []).length > 0 || chainRemaining(e);

/** Steht irgendwo noch etwas aus? (Steuert, ob AppState überhaupt tickt.) */
export function hasPendingJobs(journal) {
  return (journal || []).some(pending);
}

/** Fingerabdruck der offenen Aufträge — stabil über fremde Statewechsel,
 *  damit der Poll-Effekt nicht bei jedem Tippen neu startet. */
export function pendingFingerprint(journal) {
  return (journal || []).filter(pending).map((e) => e.id).join(",");
}

/**
 * Eine Abfragerunde über das ganze Journal.
 *
 * @param {Array} journal  der aktuelle Stand
 * @param {function} ask   (jobId) => Promise<{status, urls?}> — jobStatus,
 *                         hereingereicht statt importiert, damit der Test
 *                         ohne Server läuft
 * @returns {null | { journal, refund, messages }}
 *   null wenn nichts passiert ist; sonst der neue Journal-Stand, die
 *   Credits-Erstattung und Meldungen fürs Toasten:
 *   ["dreamReady", title] · ["filmArrived"] · ["renderFailed"] ·
 *   ["refunded", n]
 */
export async function collectTick(journal, ask) {
  let changed = false;
  let refund = 0;
  const messages = [];
  const next = [];

  for (const e of journal || []) {
    // ── Film ────────────────────────────────────────────────────────────
    if (e.jobId) {
      const r = await ask(e.jobId).catch(() => null);
      if (r?.status === "done" && r.urls?.length) {
        next.push({ ...e, film: { urls: r.urls, source: "api" }, jobId: undefined });
        changed = true;
        messages.push(["filmArrived"]);
      } else if (r && (r.status === "failed" || r.status === "unknown")) {
        // Die Nummer fallen lassen statt ewig nach einem toten Auftrag zu
        // fragen — und es SAGEN: vorher verschwand der Zustand wortlos.
        next.push({ ...e, jobId: undefined });
        changed = true;
        messages.push(["renderFailed"]);
      } else {
        next.push(e);
      }
      continue;
    }

    // ── Bilder ──────────────────────────────────────────────────────────
    if ((e.imageJobs || []).length > 0) {
      const jobs = [...e.imageJobs];
      let dirty = false;
      for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i];
        if (j.url || j.failed) continue;
        const r = await ask(j.id).catch(() => null);
        if (!r) continue;                                   // Aussetzer: nächste Runde
        if (r.status === "done" && r.urls?.length) {
          jobs[i] = { ...j, url: r.urls[0] };
          dirty = true;
        } else if (r.status === "failed" || r.status === "unknown") {
          jobs[i] = { ...j, failed: true };
          dirty = true;
        }
      }

      const settled = jobs.every((j) => j.url || j.failed);
      /* ⚠ Eine Kette mit offenen Szenen ist NICHT fertig, auch wenn alle
         bisherigen Aufträge entschieden sind — der Läufer in AppState
         reicht die nächste Szene gleich nach. Ohne diesen Guard erklärte
         der Collector die Strecke nach Szene 1 für abgeschlossen, schrieb
         media.urls und meldete „dein Traum ist da" — mit einem Bild von
         fünf. */
      if (settled && !chainRemaining(e)) {
        const urls = jobs.map((j) => j.url).filter(Boolean);
        const failed = jobs.length - urls.length;
        refund += failed;
        next.push({
          ...e,
          media: {
            ...(e.media || {}),
            type: "image",
            urls,
            source: "api",
            poster: e.media?.poster === true && !!jobs[0]?.url,
          },
          imageJobs: undefined,
          chain: undefined,
        });
        changed = true;
        if (urls.length) messages.push(["dreamReady", e.title]);
        else messages.push(["renderFailed"]);
        if (failed > 0 && urls.length > 0) messages.push(["refunded", failed]);
      } else if (dirty) {
        next.push({ ...e, imageJobs: jobs });
        changed = true;
      } else {
        next.push(e);
      }
      continue;
    }

    // ── Einzelne Szenenbilder (Storyboard: leere Kachel nachgefüllt) ────
    if ((e.sceneJobs || []).length > 0) {
      const scenes = { ...(e.sceneImages || {}) };
      const left = [];
      let dirty = false, fails = 0;
      for (const j of e.sceneJobs) {
        const r = await ask(j.id).catch(() => null);
        if (!r || (r.status !== "done" && r.status !== "failed" && r.status !== "unknown")) {
          left.push(j);
          continue;
        }
        dirty = true;
        if (r.status === "done" && r.urls?.length) {
          scenes[j.beat] = r.urls[0];
          messages.push(["sceneReady", j.beat + 1]);
        } else {
          fails++;
        }
      }
      if (dirty) {
        refund += fails;
        if (fails) messages.push(["renderFailed"]);
        next.push({ ...e, sceneImages: scenes, sceneJobs: left.length ? left : undefined });
        changed = true;
      } else {
        next.push(e);
      }
      continue;
    }

    next.push(e);
  }

  return changed || refund > 0 ? { journal: next, refund, messages } : null;
}
