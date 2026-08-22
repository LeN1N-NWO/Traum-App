import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { loadState, saveState, DB_KEY } from "../lib/storage.js";
import { buildSeedJournal } from "../lib/seedJournal.js";
import { collectTick, pendingFingerprint } from "../lib/collector.js";
import { giftFor } from "../lib/streakBoard.js";
import { jobStatus } from "../lib/api.js";
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
          else if (kind === "renderFailed") toast(`⚠ ${t.errors.renderFailed}`);
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
