import { useState, useCallback } from "react";
import { useAppState } from "../state/AppState.jsx";
import { IMAGE_COUNTS } from "../lib/pricing.js";

/* All wizard state in one hook, so each step component stays a pure view.
 *
 * `assignments` is the heart of it: one entry per character or place the
 * analysis found, keyed by the name the analysis used. Each is either bound to
 * an avatar, marked free (the model invents it), or still undecided.
 */

/* Wörter, hinter denen der Träumer selbst steckt — sie führen aufs eigene
 * Profilbild (@me).
 *
 * ⚠ Die Liste war bis zum 22.08.2026 rein englisch, die Analyse antwortet
 * aber in der SPRACHE DES TRAUMS: Ein deutsch erzählter Traum liefert „Ich",
 * und „Ich" stand nicht drin — Anton bekam für sich selbst eine Fremdfigur
 * angeboten, obwohl sein Porträt längst hinterlegt war („damit er sofort
 * weiß: das bist du"). Deutsch und Englisch werden gepflegt (Übersetzungs-
 * Stopp, AGENTS.md); kommen weitere Sprachen dazu, kommen ihre Selbstwörter
 * hierher.
 *
 * Verglichen wird über normalise(), also ohne Satzzeichen und Leerraum —
 * „Ich (der Träumer)" trifft damit genauso wie „ich". */
const SELF_WORDS = new Set([
  // Englisch
  "i", "me", "myself", "thedreamer", "myselfthedreamer", "ithedreamer",
  // Deutsch
  "ich", "mich", "mir", "ichselbst", "dertraumer", "dietraumerin",
  "ichdertraumer", "ichdietraumerin", "dertraeumer", "dietraeumerin",
]);

function normalise(name) {
  return String(name || "")
    .toLowerCase()
    // Umlaute zusammenfalten, damit „Träumer" und „Traeumer" denselben
    // Schlüssel ergeben — sonst hinge die Erkennung an der Schreibweise,
    // die das Modell gerade wählt.
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

/** Find an existing avatar whose tag matches the analysed name unambiguously. */
export function autoMatch(name, cast, me) {
  if (SELF_WORDS.has(normalise(name)) && me?.img) {
    return { tag: "me", img: me.img, desc: "", id: "me" };
  }
  const key = normalise(name);
  if (!key) return null;
  const hits = (cast || []).filter((c) => normalise(c.tag) === key);
  return hits.length === 1 ? hits[0] : null;
}

const EMPTY = {
  step: 1,
  entryId: null,       // set when an existing journal dream is being continued
  text: "",
  originalText: "",
  title: "",           // film title for the poster, editable in step 5
  tagline: "",         // poster tagline, editable in step 5
  analysis: null,
  mode: null,          // "save" | "images" | "film"
  /* ⚠ ABGELEITET, nicht hingeschrieben. Bis zum 25.08.2026 stand hier eine
     blanke `5` — eine Zahl, die es seit der Umstellung auf 4/8 (23.08.) im
     Angebot gar nicht mehr gibt. Der Fehler war komplett stumm und kostete
     doppelt:
       · Der Knopf versprach „4 Credits", weil `priceForImages(5)` auf die
         kleinste angebotene Zahl zurückfällt — dieser Rückfall ist als Netz
         für ALTE Journaleinträge gedacht und hat hier einen LEBENDEN Fehler
         zugedeckt. Abgerechnet wurden dann 5.
       · Und fünf Szenen brauchen ZWEI Rasteraufrufe: $0,226 statt $0,113,
         also 60 % mehr je Szene. Genau davor warnt pricing.js beim Eintrag
         `IMAGE_COUNTS` — nur konnte es das niemandem sagen, weil die Vorgabe
         die Warnung nicht las.
     Aus der Liste gelesen kann die Vorgabe nie wieder danebenliegen. */
  imageCount: IMAGE_COUNTS[0],
  preview: false,      // the cheap look: one render cut into three, see pricing.js
  assignments: {},     // name -> { name, kind, avatar?, free? }
  /* ⚠ Seit 24.08. `ultrareal` statt `dreamlike`. Der alte Vorgabewert war
     ausgerechnet der Stil, der den Malerei-Look WÖRTLICH bestellt
     („shapes dissolving") — wer nie einen Stil wählte, bekam garantiert
     gemalte Bilder und hielt das für das Können des Modells. */
  styleId: "ultrareal",
  format: "9:16",
  videoModel: "standard",
  quality: null,       // 480p/720p; null = die Vorgabe des Modells (video.js `preferred`)
  seconds: 6,          // film length; see lib/video.js for each model's range
  urls: null,
  jobId: null,         // set while a film renders in fal's queue
  sourceUrls: null,    // the dream's existing images, when resumed for a film
  /* Plan B: mit dem Ausweichmodell rendern statt mit dem Hauptmodell.
     Wird NUR aus dem Journal gesetzt, nachdem ein Traum an der
     Inhaltsprüfung gescheitert ist — es gibt keinen Knopf dafür im
     normalen Ablauf, und das ist Absicht: Plan B ist teurer und liefert
     kleinere Kacheln (pricing.js). Er ist ein Ausweg, kein Angebot. */
  fallback: false,
  keyframe: null,      // which of them the film animates ("/media/…")
};

export function useWizard() {
  const { state } = useAppState();
  const [w, setW] = useState(EMPTY);

  const patch = useCallback((p) => setW((prev) => ({ ...prev, ...p })), []);
  const reset = useCallback(() => setW(EMPTY), []);

  /** Seed the character/place tiles from an analysis, auto-matching what we can.
   *  `people` entries are objects ({name, kind, desc}) since the analysis got
   *  structured; bare strings still work — the local no-LLM fallback sends
   *  those. The desc travels along as `hint` so creating a new avatar can
   *  pre-fill it. */
  const seedAssignments = useCallback((analysis) => {
    const build = (items, fallbackKind) =>
      (items || []).reduce((acc, item) => {
        const name = typeof item === "string" ? item : item?.name;
        if (!name) return acc;
        const kind = typeof item === "object" && item?.kind === "pet" ? "pet" : fallbackKind;
        const hint = (typeof item === "object" && item?.desc) || "";
        /* Die Garderobe reist als `wardrobe` weiter, weil buildReferences()
           sie so nennt. ⚠ Der Namenswechsel ist Absicht und kein Schlamperei:
           Was aus dem Traum kommt, heisst `wearing` (die Analyse und das
           Sprachwerkzeug sagen so), was in den Prompt geht, heisst
           `wardrobe`. Wer beide gleich benennt, verliert die Stelle, an der
           man sieht, dass hier uebersetzt wird. */
        const wardrobe = (typeof item === "object" && item?.wearing) || "";
        const avatar = autoMatch(name, state.cast, state.me);
        /* ⚠ ORTE starten auf „die KI erfindet es" (Björns Hinweis, von Anton
           weitergegeben 31.08.). Ein Club, eine Straße, eine Wohnung — dafür
           legt niemand ein Foto an, und „unentschieden" zwang trotzdem zu
           einem Tipp je Ort, nur um zu sagen, was ohnehin passiert. Bei
           MENSCHEN bleibt es bei unentschieden: Dort ist das Zuordnen der
           eigentliche Zweck des Schritts, und eine Vorauswahl würde jemanden
           still durch den Schritt tragen, in dem er sein Gesicht setzen
           wollte.
           Ein per autoMatch gefundener Ort aus der Bibliothek gewinnt —
           wer ihn einmal angelegt hat, meint ihn. */
        const frei = startsFree(kind, avatar);
        acc[name] = { name, kind, hint,
          ...(wardrobe ? { wardrobe } : {}),
          ...(avatar ? { avatar } : {}),
          ...(frei ? { free: true } : {}) };
        return acc;
      }, {});
    setW((prev) => ({
      ...prev,
      assignments: { ...build(analysis.people, "person"), ...build(analysis.places, "place") },
    }));
  }, [state.cast, state.me]);

  const assign = useCallback((name, value) => {
    setW((prev) => ({
      ...prev,
      assignments: { ...prev.assignments, [name]: { ...prev.assignments[name], ...value } },
    }));
  }, []);

  const dropAssignment = useCallback((name) => {
    setW((prev) => {
      const next = { ...prev.assignments };
      delete next[name];
      return { ...prev, assignments: next };
    });
  }, []);

  return { w, patch, reset, seedAssignments, assign, dropAssignment };
}

/** Startet dieser Eintrag auf „die KI erfindet es"?
 *
 *  ⚠ ORTE ja, MENSCHEN nein (Björns Hinweis, von Anton weitergegeben
 *  31.08.). Für einen Club, eine Straße, eine Wohnung legt niemand ein Foto
 *  an — „unentschieden" verlangte trotzdem einen Tipp je Ort, nur um zu
 *  sagen, was ohnehin passiert wäre. Bei Menschen ist das Zuordnen der
 *  ZWECK des Schritts; eine Vorauswahl trüge jemanden still an der Stelle
 *  vorbei, an der er sein Gesicht setzen wollte.
 *
 *  Ein gefundener Eintrag aus der Bibliothek gewinnt immer: Wer einen Ort
 *  einmal angelegt hat, meint ihn.
 *
 *  Eigene Funktion und nicht drei Zeichen im Effekt oben, damit die Regel
 *  eine Prüfung haben kann — sie ist eine Produktentscheidung, keine
 *  Formsache. */
export function startsFree(kind, avatar) {
  return kind === "place" && !avatar;
}

/** The assignments for a set of kinds, in the order the analysis produced them. */
export function assignmentsOfKinds(assignments, kinds) {
  return Object.values(assignments).filter((a) => kinds.includes(a.kind));
}
