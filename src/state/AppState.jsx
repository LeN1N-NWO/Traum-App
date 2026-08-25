import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { loadState, saveState, DB_KEY } from "../lib/storage.js";
import { buildSeedJournal } from "../lib/seedJournal.js";
import { collectTick, pendingFingerprint } from "../lib/collector.js";
import { failureTextKey } from "../lib/falError.js";
import { giftFor } from "../lib/streakBoard.js";
import { snoozeCheck } from "../lib/streak.js";
import { jobStatus, backupJournal, sharedDreams, generate, uploadPanel, mediaUrl } from "../lib/api.js";
import { splitIntoTiles } from "../lib/splitGrid.js";
import { GRID_COLS, GRID_ROWS } from "../lib/gridLayout.js";
import { spend } from "../lib/credits.js";
import { chainStep, chainFingerprint, buildChainSubmission } from "../lib/imageChain.js";
import { backupPayload, backupFingerprint, mergeShared } from "../lib/journalBackup.js";
import { t } from "../i18n/index.js";

/* The whole app state in one place. Every change goes through update() and is
   saved immediately — there is no second path into storage. That is
   deliberate: two write paths would drift apart over time. */
const Ctx = createContext(null);

// ⚠️ TEMPORARY (10.08.2026, Anton) — see seedJournal.js for why and how to
// remove. Only fires when nothing was EVER saved for this browser (the raw
// key is null, not just an empty journal), so it can never overwrite a
// journal someone actually built or deliberately emptied.
function loadInitialState() {
  const s = clearStalePending(loadState());
  const fresh = typeof localStorage !== "undefined" && localStorage.getItem(DB_KEY) === null;
  if (!fresh || s.journal.length > 0) return s;
  const seed = buildSeedJournal();
  return { ...s, journal: seed.journal, creatures: [...(s.creatures || []), ...seed.creatures] };
}

/* `pending` heißt „der Wizard gibt gerade Aufträge ab". Beim Start läuft kein
   Wizard — was hier noch steht, stammt also aus einer Sitzung, die mitten im
   Abgeben abgebrochen wurde (Neuladen, Absturz, geschlossener Tab). Die Marke
   wird geräumt, der Traum selbst bleibt: Er hat seinen Text, seine Analyse und
   sein Wesen, und im Journal steht wieder „Bilder machen" statt einer Kachel,
   die bis in alle Ewigkeit behauptet, sie arbeite noch.

   Bezahlt ist dabei nichts verloren: Abgerechnet wird je abgegebenem Auftrag,
   und abgegebene Aufträge hängen als imageJobs/jobId am Eintrag — die holt der
   Collector auch nach dem Neustart noch ab. */
function clearStalePending(s) {
  const journal = s.journal || [];
  if (!journal.some((e) => e && e.pending)) return s;
  return { ...s, journal: journal.map(({ pending, ...e }) => e) };
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadInitialState);
  const [toastText, setToastText] = useState("");
  /* Warum der Anlass mitwandert und nicht nur „auf/zu": Ein Kaufblatt, das
     jemand SELBST geöffnet hat, darf mit dem Angebot beginnen. Eines, das
     ihm gerade in den Weg gesprungen ist, muss zuerst erklären, warum — sonst
     liest es sich als Hinterhalt. Der Anlass steuert die Überschrift, siehe
     Paywall.jsx. */
  const [paywall, setPaywall] = useState(null);   // null | "browse" | "spent" | "first" 

  const toast = useCallback((text) => {
    setToastText(text);
    setTimeout(() => setToastText(""), 2600);
  }, []);

  /* Always build a new object, never mutate the existing one — otherwise
     React skips the re-render and the bug becomes near-impossible to find.

     `patch` darf auch eine FUNKTION sein: (prev) => patch. Das ist kein
     Zuckerguss, sondern die Rettung für alles, was in Schritten arbeitet.
     Ein Wizard, der ein Bild nach dem anderen abgibt, hält `state` aus dem
     Renderzeitpunkt fest — sein zweiter Patch rechnete sonst über die
     VERALTETE Journalliste und löschte den ersten stillschweigend wieder.
     Genau daran ist am 22.08.2026 ein ganzer Traum verschwunden. */
  const update = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      if (!saveState(next)) toast(t.errors.storageFull);
      return next;
    });
  }, [toast]);

  /* No silent grant on mount anymore: the welcome credits are the reward for
   * the onboarding survey (Onboarding.jsx / ProfileScreen.jsx). A gift with
   * a face converts; a balance that was always there is furniture. People
   * from before the survey keep what they were given — welcomeGrant() stays
   * idempotent via its flag. */

  /* Eine Mechanik statt fünf Flicken. Vor dem 16.08.2026 endeten fünf
     Stellen im selben Toast „Aufladen kommt bald" — die teuersten Momente
     der App, jeder eine Sackgasse. Jetzt kann jeder Bildschirm das Kaufblatt
     öffnen, ohne es selbst einzuhängen. */
  const openPaywall = useCallback((reason = "browse") => setPaywall(reason), []);
  const closePaywall = useCallback(() => setPaywall(null), []);

  /* Der Abholer (collector.js) — läuft HIER, damit er überall läuft:
     Antons Ansage 21.08. war ausdrücklich „weiter die App benutzen
     können", also darf das Abholen nicht am offenen Traum-Detail hängen
     (dort hing es beim Film bis heute). Solange irgendein Eintrag einen
     offenen Auftrag trägt, fragt alle drei Sekunden eine Runde nach;
     gibt es nichts Offenes, tickt auch nichts. */
  const stateRef = useRef(state);
  stateRef.current = state;
  const fingerprint = pendingFingerprint(state.journal);
  useEffect(() => {
    if (!fingerprint) return;
    let alive = true, busy = false;
    const tick = async () => {
      if (!alive || busy) return;
      busy = true;
      try {
        const res = await collectTick(stateRef.current.journal, jobStatus);
        if (!alive || !res) return;
        const patch = { journal: res.journal };
        if (res.refund > 0) {
          // Erstattung ins Kauf-Töpfchen: was nicht geliefert wurde,
          // wird nicht bezahlt — die Auftrags-Fassung von „es wurde
          // nichts abgebucht".
          patch.credits = (stateRef.current.credits ?? 0) + res.refund;
        }
        update(patch);
        for (const [kind, extra] of res.messages) {
          if (kind === "dreamReady") toast(t.journal.dreamReady(extra || ""));
          else if (kind === "filmArrived") toast(t.journal.filmArrived);
          else if (kind === "sceneReady") toast(t.journal.sceneReady(extra));
          else if (kind === "refunded") toast(t.journal.imagesRefunded(extra));
          /* ⚠ `extra` ist hier der GRUND (falError.js), nicht die Anzahl.
             Vor dem 24.08.2026 stand hier ein fester Satz, der auf „versuch
             es noch mal" endete — bei einem Policy-Verstoß der einzige Rat,
             der garantiert nicht funktioniert. Der Grund kommt vom Server
             durch bis hierher; die Zuordnung zum Text macht falError.js,
             damit Toast und Journal denselben Satz zeigen. */
          else if (kind === "renderFailed") toast(`⚠ ${t.errors[failureTextKey(extra)]}`);
        }
      } finally {
        busy = false;
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
    // Der Fingerabdruck ändert sich nur, wenn Aufträge dazukommen oder
    // fertig werden — nicht bei jedem Tastendruck irgendwo im State.
  }, [fingerprint, update, toast]);

  /* Der Ketten-Läufer (Antons Ansage 22.08.: das fertige Bild wird zur
     Referenz des nächsten). Die andere Hälfte des Abholers: Der Collector
     holt Bilder AB, der Läufer reicht die nächste Szene EIN, sobald ihr
     Vorgänger entschieden ist — mit dem jüngsten gelungenen Bild als
     Weltanker (imageChain.js).

     HIER und nicht im Wizard, aus demselben Grund wie alles andere in
     dieser Datei: Die Kette muss weiterlaufen, egal wo man gerade ist —
     und sie überlebt so auch einen Neustart, weil sie am Journal-Eintrag
     hängt und nicht an einem offenen Bildschirm.

     Scheitert die EINREICHUNG (nicht das Rendern — das erstattet der
     Collector), bricht die Kette ehrlich ab: Marke weg, Meldung, die
     fertigen Szenen bleiben, der Rest ist über „Bild erzeugen" im
     Storyboard einzeln nachholbar. Endlos stumm neu versuchen hieße, im
     Funkloch unbemerkt Kosten anzuhäufen, sobald es wiederkommt. */
  /* ── Der Schnitt: ein Rasterbild wird zu vier Traumbildern ──────────────
   *
   * Warum HIER und nicht im Collector: Der Collector ist bewusst DOM-frei
   * und ohne Browser testbar. Schneiden ist Canvas-Arbeit — sie gehört in
   * die Schicht, die ohnehin einen Browser voraussetzt.
   *
   * ⚠ ABBRUCHSICHER, und das ist der ganze Punkt. Zwischen „Rasterbild da"
   * und „vier Kacheln hochgeladen" liegen Sekunden. Wer die App genau dann
   * schließt, darf beim nächsten Start kein Rasterbild als Traumbild sehen:
   * Der Auftrag trägt `tiles` und noch kein `tileUrls`, gilt dem Collector
   * damit als unentschieden, und dieser Effekt macht weiter. Dieselbe Lehre
   * wie bei clearStalePending().
   *
   * ⚠ Und deshalb wird der Fingerabdruck aus den AUFTRÄGEN gebildet, nicht
   * aus einem Zähler: Solange etwas ungeschnitten ist, steht es drin — auch
   * nach einem Neustart, an dem kein Effekt „noch lief".
   */
  const schnittPrint = (state.journal || [])
    .flatMap((e) => (e.imageJobs || [])
      /* ⚠ Am Merkmal `grid`, NICHT an `tiles > 1`. Der letzte Block eines
         Fünf-Szenen-Traums ist ein Raster mit nur EINER echten Szene darin —
         an der Kachelzahl erkannt, bliebe er ungeschnitten, und das ganze
         Raster stünde als Traumbild da. */
      .filter((j) => j.url && j.grid && !j.tileUrls)
      /* ⚠ Der Zähler gehört IN den Fingerabdruck. Ohne ihn ändert sich nach
         einem Fehlversuch nichts an dieser Zeichenkette, der Effekt läuft
         nie wieder an, und der Traum bliebe für immer halb fertig. */
      .map((j) => `${e.id}:${j.id}:${j.cutTries || 0}`))
    .join(",");

  useEffect(() => {
    if (!schnittPrint) return;
    let alive = true;
    (async () => {
      const [entryId, jobId] = schnittPrint.split(",")[0].split(":");
      /* ⚠ Kurz warten, bevor der erste Schnitt versucht wird. Der Server hat
         das Bild gerade erst geschrieben; es sofort zu laden trifft im
         bezahlten Lauf vom 25.08. eine Datei, die noch nicht da ist. */
      await new Promise((r) => setTimeout(r, 700));
      if (!alive) return;
      const entry = (stateRef.current.journal || []).find((e) => e.id === entryId);
      const job = (entry?.imageJobs || []).find((j) => j.id === jobId);
      if (!job?.url) return;

      let tileUrls;
      try {
        const blobs = await splitIntoTiles(mediaUrl(job.url), GRID_COLS, GRID_ROWS);
        if (!alive) return;
        /* ⚠ Nur so viele Kacheln behalten, wie echte Szenen bestellt waren.
           Ein Raster hat immer vier Plätze; beim letzten Block können drei
           davon Füllmaterial sein. Sie mit hochzuladen hieße, dem Menschen
           acht Bilder für einen Fünf-Szenen-Traum zu zeigen — drei davon
           erfunden. In LESEREIHENFOLGE, wie buildGridPrompt sie füllt. */
        tileUrls = [];
        for (const blob of blobs.slice(0, Math.max(1, job.tiles || blobs.length))) {
          tileUrls.push(await uploadPanel(blob));
        }
      } catch (err) {
        /* ⚠⚠ NICHT beim ersten Fehlschlag aufgeben. Am 25.08.2026 im
           bezahlten Lauf gemessen: Der häufigste Fehler ist gar keiner —
           das Bild war beim ersten Versuch noch nicht fertig auf der Platte,
           und Sekunden später ließ es sich einwandfrei in vier Kacheln
           schneiden. Die erste Fassung machte daraus einen DAUERHAFTEN
           Schaden: Sie schrieb das ganze Raster als einziges Traumbild fort,
           und der Traum war „fertig" — mit einem 2160×3840-Bild, in dem
           vier Szenen stecken.

           Also zählen statt raten. Drei Anläufe, dann erst der Notausgang.
           Der Zähler steht AM AUFTRAG, nicht in einer Variable: So überlebt
           er einen Neustart, und niemand versucht nach jedem Öffnen der App
           wieder von vorn. */
        const versuche = (job.cutTries || 0) + 1;
        console.error(`[DreamRushes] Rasterschnitt fehlgeschlagen (${versuche}/3):`, err);
        if (versuche < 3) {
          update((prev) => ({
            journal: (prev.journal || []).map((e) => (e.id === entryId ? {
              ...e,
              imageJobs: (e.imageJobs || []).map((j) => (j.id === jobId ? { ...j, cutTries: versuche } : j)),
            } : e)),
          }));
          return;
        }
        /* Aufgegeben. Das Rasterbild selbst als EIN Bild stehen lassen:
           sichtbar falsch, aber sichtbar und abgeschlossen — der Mensch kann
           Szenen einzeln nachbestellen, statt ewig „wird erstellt" zu lesen. */
        tileUrls = [job.url];
      }
      if (!alive || !tileUrls?.length) return;
      update((prev) => ({
        journal: (prev.journal || []).map((e) => (e.id === entryId ? {
          ...e,
          imageJobs: (e.imageJobs || []).map((j) => (j.id === jobId ? { ...j, tileUrls } : j)),
        } : e)),
      }));
    })();
    return () => { alive = false; };
  }, [schnittPrint, update]);

  const chainPrint = chainFingerprint(state.journal);
  useEffect(() => {
    if (!chainPrint) return;
    let alive = true;
    (async () => {
      const s = stateRef.current;
      const entry = (s.journal || []).find((e) => chainStep(e));
      if (!entry) return;
      const sub = buildChainSubmission(entry, { cast: s.cast, me: s.me });
      if (!sub) {
        // Kette ohne Szenentext — kann nur ein alter/kaputter Eintrag sein.
        update((prev) => ({
          journal: (prev.journal || []).map((e) => (e.id === entry.id ? { ...e, chain: undefined } : e)),
        }));
        return;
      }
      try {
        const res = await generate({
          dream: entry.text, mode: "image", cast: sub.cast, prompt: sub.prompt,
          sequenceRef: sub.sequenceRef || undefined,
          /* ⚠ `grid` ist Pflicht, nicht Feinschliff: Erst daran setzt der
             Server das Pixelmaß aus appGrid(). Ohne es käme der Preset-Name
             zurück — `portrait_16_9` ist 576×1024, und ein 2×2 daraus hat
             Kacheln von 288×512. Bezahlt und unbrauchbar. */
          grid: sub.slots > 1,
          fallback: entry.fallback === true,
        });
        if (!alive) return;
        update((prev) => ({
          /* ⚠ Nach den ECHTEN Szenen, nicht nach den Rasterplätzen. Der
             letzte Block eines Fünf-Szenen-Traums ist ein voller Aufruf mit
             EINER Szene darin — vier Credits dafür zu nehmen wäre, dem
             Menschen unseren Verschnitt in Rechnung zu stellen. */
          ...(spend(prev, sub.tiles) || {}),
          journal: (prev.journal || []).map((e) => (e.id === entry.id ? {
            ...e,
            imageJobs: [
              ...(e.imageJobs || []),
              // Alt-Server antwortet sofort: als bereits entschiedener
              // Auftrag einreihen, dann bleibt die Mechanik eine.
              res.jobId
                ? { id: res.jobId, tiles: sub.tiles, grid: sub.slots > 1 }
                : { id: `sync${sub.beatIndex}`, url: res.urls?.[0], tiles: sub.tiles, grid: sub.slots > 1 },
            ],
            /* ⚠ `next` zählt SZENEN, springt beim Raster also um bis zu vier
               — aber nie über `total` hinaus. Um eins zu erhöhen hieße,
               denselben Vierer-Block gleich noch dreimal zu bestellen. */
            chain: { ...e.chain, next: e.chain.next + sub.tiles },
          } : e)),
        }));
      } catch (err) {
        if (!alive) return;
        console.error("[DreamRushes] chain submit failed:", err);
        /* Auch der Einreichungs-Fehler trägt seinen Grund: fal lehnt manches
           schon beim Einreichen ab, und dann gibt es nie einen Auftrag, den
           der Collector nachfassen könnte. `err.reason` kommt aus dem Server
           (imageFailure) durch api.js hierher. */
        const grund = err?.reason || null;
        update((prev) => ({
          journal: (prev.journal || []).map((e) => (e.id === entry.id
            ? { ...e, chain: undefined, failReason: grund } : e)),
        }));
        toast(`⚠ ${t.errors[failureTextKey(grund)]}`);
      }
    })();
    return () => { alive = false; };
  }, [chainPrint, update, toast]);

  /* Die Mini-Geschenke der Serie (Antons Ja 22.08., Plan §5) — HIER, aus
     demselben Grund wie der Abholer: Die Serie wächst an drei Stellen
     (Wizard-Schritt 2, 5 und 6), und drei Kopien derselben Vergabe wären
     drei Gelegenheiten, sie falsch zu machen. Eine Mechanik, ein Ort.

     giftFor() ist idempotent (die vergebenen Schwellen stehen im State),
     also kann dieser Effekt gefahrlos bei jeder Serienänderung laufen —
     nach dem Patch findet er nichts mehr. */
  useEffect(() => {
    const gift = giftFor(stateRef.current);
    if (!gift) return;
    update(gift.patch);
    toast(t.streakBoard.gift(gift.nights, gift.credits));
  }, [state.streak, state.streakGifts, update, toast]);

  /* Die Schlummernacht springt beim Start ein (Antons Ja 22.08., Plan §6) —
     hier und nirgends sonst: Es ist der einzige Moment, in dem die App
     merkt, dass eine Nacht fehlt, und der Mensch soll es als Erstes
     erfahren, nicht beim nächsten Traum. snoozeCheck() ist idempotent
     (danach ist die Lücke geschlossen), der Effekt darf also gefahrlos bei
     jedem Datumswechsel erneut laufen. */
  useEffect(() => {
    const saved = snoozeCheck(stateRef.current);
    if (!saved) return;
    update(saved.patch);
    toast(t.streakBoard.snoozeUsed(saved.used));
  }, [state.lastDream, state.snoozes, update, toast]);

  /* Die geteilten Testträume laden — Antons Ansage vom 22.08.: „Ich möchte,
     dass alle, die jetzt an der App entwickeln, diese Träume sehen."

     ⚠ NUR IM ENTWICKLUNGSMODUS. Ein ausgelieferter Build zieht sich keine
     fremden Träume ins Tagebuch — das wäre aus Testdaten plötzlich der
     Traum eines anderen Menschen im eigenen Journal. `import.meta.env.DEV`
     ist in einem Produktionsbau `false`, der ganze Block fällt beim Bauen
     heraus. Wer die App veröffentlicht, entfernt ihn trotzdem ganz, samt
     Ordner (siehe .gitignore).

     Gemergt wird nur, was das Gerät noch nicht kennt: Der lokale Stand ist
     immer der neuere, die Sicherung ist das Archiv. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let alive = true;
    sharedDreams().then((gesicherte) => {
      if (!alive || !gesicherte.length) return;
      const journal = mergeShared(stateRef.current.journal, gesicherte);
      if (journal) update({ journal });
    });
    return () => { alive = false; };
    // Einmal beim Start, nicht bei jeder Änderung — sonst kämen gelöschte
    // Träume beim nächsten Tastendruck wieder zurück.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Die Traum-Sicherung (Antons Ansage 22.08.: „Meine Testträume bitte hier
     abspeichern … und drinnen bleiben"). Sie läuft still: Ändert sich etwas
     am INHALT der Träume, wandern sie als Dateien zum Server. Der
     Fingerabdruck sorgt dafür, dass ein Tastendruck irgendwo im State nicht
     schon eine Runde auslöst.

     Kein Zustand, keine Meldung, kein Fehlerfall: Scheitert die Sicherung
     (Server aus, kein Netz), passiert nichts weiter — beim nächsten Start
     wird es nachgeholt. Ein Tagebuch, das wegen seiner Sicherung stockt,
     wäre die schlechtere Krankheit. */
  const backupPrint = backupFingerprint(state.journal);
  useEffect(() => {
    if (!backupPrint) return;
    const id = setTimeout(() => backupJournal(backupPayload(stateRef.current.journal)), 1200);
    return () => clearTimeout(id);
  }, [backupPrint]);

  return (
    <Ctx.Provider value={{
      state, setState, update, toast, toastText,
      paywall, openPaywall, closePaywall,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState used outside AppStateProvider");
  return v;
}
