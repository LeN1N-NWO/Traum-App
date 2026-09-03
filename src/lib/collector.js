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
import { isHopeless } from "./falError.js";

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
 *   ["dreamReady", title] · ["filmArrived"] · ["renderFailed", reason?] ·
 *   ["refunded", n]
 *
 *   ⚠ `reason` ist das Neue vom 24.08.2026 und der eigentliche Punkt:
 *   `{ kind: "policy" | "unknown", where, msg }` aus falError.js. Ohne
 *   dieses Feld konnte die App nur „versuch es noch mal" sagen — bei einem
 *   Policy-Verstoß der einzige Rat, der garantiert nicht funktioniert.
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
        /* ⚠ ANHÄNGEN, nicht überschreiben (03.09.2026). Antons Ansage:
           „Es kann sein, dass eine Person so lange weitermacht, den Traum,
           bis er wirklich passt." Jede Fassung hat Geld gekostet; welche
           die beste ist, entscheidet der Mensch, nicht die zuletzt
           eingetroffene. `film` wird weiter mitgeschrieben, damit ein
           älterer Client (und jeder Leser, der die alte Form erwartet)
           denselben Film findet — entryMedia.js kennt beide Formen. */
        const fassung = {
          url: r.urls[0],
          at: new Date().toISOString(),
          ...(e.filmPlan || {}),
        };
        /* ⚠ Der Film aus der ALTEN Form muss beim ersten Anhängen mit in die
           Liste (gemessen 03.09.2026): Ein Traum, der vor heute einen Film
           bekam, trägt ihn in `film` — und wer hier nur `e.films` fortführt,
           überschreibt gleichzeitig `film` und lässt den ersten Film damit
           verschwinden. Bezahlt, gerendert, aus der Fassungsleiste raus. */
        const vorher = e.films?.length
          ? e.films
          : (e.film?.urls?.[0] ? [{ url: e.film.urls[0], at: e.createdAt || null }] : []);
        next.push({
          ...e,
          films: [...vorher, fassung],
          film: { urls: r.urls, source: "api" },
          jobId: undefined,
          filmPlan: undefined,
        });
        changed = true;
        messages.push(["filmArrived"]);
      } else if (r && (r.status === "failed" || r.status === "unknown")) {
        // Die Nummer fallen lassen statt ewig nach einem toten Auftrag zu
        // fragen — und es SAGEN: vorher verschwand der Zustand wortlos.
        next.push({ ...e, jobId: undefined, failReason: r.reason || null });
        changed = true;
        messages.push(["renderFailed", r.reason || null]);
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
          jobs[i] = { ...j, failed: true, reason: r.reason || null };
          dirty = true;
        }
      }

      /* ⚠ Ein Rasterauftrag ist erst entschieden, wenn er auch GESCHNITTEN
         ist. Ohne diese Bedingung schriebe der Collector das ganze Raster als
         Traumbild fort — ein Bild mit vier Szenen darin, und der Traum wäre
         „fertig". Der Schnitt selbst steht in AppState (Canvas); der
         Collector bleibt DOM-frei und wartet nur. */
      const geschnitten = (j) => !j.grid || !!j.tileUrls;
      const settled = jobs.every((j) => j.failed || (j.url && geschnitten(j)));

      /* ── ⚠ Der Abbruch bei chancenlosen Fehlern (24.08.2026) ───────────
         Antons Freddy-Krüger-Traum: Szene 1 wurde als
         `content_policy_violation` abgelehnt, weil der Traumtext eine
         geschützte Figur nennt. Die Kette lief trotzdem weiter — und
         Szene 2 bis 5 enthalten DENSELBEN Namen. Fünf garantierte
         Ablehnungen hintereinander, jede mit ihrer eigenen Wartezeit.

         Ein Policy-Verstoß hängt am TEXT, nicht am Zufall. Es gibt keine
         Szene dieses Traums, die durchkäme. Also: abbrechen und den Rest
         erstatten, statt die Enttäuschung in Raten auszuliefern.

         ⚠ Der Unterschied zu einem gewöhnlichen Fehlschlag ist wichtig
         genug für eine eigene Funktion (`isHopeless`): Ein Aussetzer bei
         fal SOLL die Kette weiterlaufen lassen — dafür ist sie gebaut
         („Scheitert eine Szene, läuft die Kette WEITER", imageChain.js).
         Nur der Policy-Fall ist anders, weil er sich beim Wiederholen
         reproduziert. */
      const chancenlos = jobs.find((j) => j.failed && isHopeless(j.reason)) || null;
      /* Bezahlt ist die GANZE Strecke, im Voraus (Step5Style: `spend(state,
         priceForImages(count))`). Was nie eingereicht wurde, ist deshalb
         genauso erstattungspflichtig wie ein gescheiterter Auftrag —
         sonst behielten wir Geld für Bilder, die wir bewusst nicht mehr
         bestellen. */
      const nieBestellt = chancenlos && chainRemaining(e)
        ? Math.max(0, (e.chain?.total || jobs.length) - jobs.length)
        : 0;

      /* ⚠ Eine Kette mit offenen Szenen ist NICHT fertig, auch wenn alle
         bisherigen Aufträge entschieden sind — der Läufer in AppState
         reicht die nächste Szene gleich nach. Ohne diesen Guard erklärte
         der Collector die Strecke nach Szene 1 für abgeschlossen, schrieb
         media.urls und meldete „dein Traum ist da" — mit einem Bild von
         fünf. */
      if (settled && (!chainRemaining(e) || chancenlos)) {
        /* ⚠ Die Kacheln, nicht das Rasterbild. `tileUrls` setzt der
           Schnitt-Effekt in AppState; bis dahin gilt der Auftrag als nicht
           entschieden (siehe `settled` oben). Bei Einzelbildern gibt es kein
           `tileUrls`, und `url` ist schon das fertige Bild. */
        const urls = jobs.flatMap((j) => j.tileUrls || (j.url ? [j.url] : []));

        /* ⚠ Erstattet wird in SZENEN, nicht in Aufträgen (seit dem Rasterweg,
           24.08.2026). Ein Rasterauftrag trägt vier Szenen und ist mit vier
           Credits bezahlt; ihn als EINEN zu erstatten hieße, drei Viertel
           des Geldes für ein Bild zu behalten, das es nie gab. Vor dem
           Raster war `tiles` überall 1 und die Rechnung dieselbe. */
        const szenen = (j) => Math.max(1, j.tiles || 1);
        const failed = jobs.filter((j) => !j.url).reduce((n, j) => n + szenen(j), 0);
        refund += failed + nieBestellt;


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
          failReason: chancenlos?.reason || jobs.find((j) => j.reason)?.reason || null,
        });
        changed = true;
        /* Der Grund reist mit der Meldung UND bleibt am Eintrag stehen:
           Ein Toast ist nach drei Sekunden weg, die Frage „warum ist mein
           Traum leer" bleibt. Erst dadurch kann das Journal später einen
           Ausweg anbieten, statt nur eine leere Fläche zu zeigen. */
        const grund = chancenlos?.reason || jobs.find((j) => j.reason)?.reason || null;
        if (urls.length) messages.push(["dreamReady", e.title]);
        else messages.push(["renderFailed", grund]);
        if (failed + nieBestellt > 0 && urls.length > 0) {
          messages.push(["refunded", failed + nieBestellt]);
        }
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
