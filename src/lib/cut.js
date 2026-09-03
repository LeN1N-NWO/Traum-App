/* Der Schnitt: welche Szenen ein Film trägt, und wie lange jede zu sehen ist.
 *
 * Eigene Datei, nicht in beats.js: Dort wohnt die BILD-Rechnung (fünf
 * Quell-Beats, Raster, Kachel-Zuordnung), und die wird mit dem Rückbau des
 * Bildprodukts verschwinden (docs/plans/2026-08-31-nur-noch-film.md). Was
 * hier steht, bleibt — es ist die Regie.
 *
 * ── Warum es das gibt (Antons Ansage 03.09.2026) ─────────────────────────
 * „Da wir weg sind von den Bildern, haben wir kein Limit mehr mit diesen
 * fünf Szenen. Das System muss entscheiden, wie viele es sind."
 *
 * Vorher zerlegte die Analyse JEDEN Traum in exakt fünf Szenen und der
 * Client wählte daraus NACH POSITION (evenIndices: erste und letzte). An
 * fünf echten Traumprotokollen aus der DreamBank nachgemessen
 * (docs/plans/2026-09-03-regisseur-trockenlauf.md): Drei von fünf verloren
 * dabei genau das Ereignis, das den Traum ausmacht — ein Flugtraum bekam
 * ein Büro und einen Kuss, aber keinen Flug. Der Grund ist immer derselbe:
 * Der wichtigste Moment steht in der Mitte, und die Mitte fällt zuerst.
 *
 * Die Regeln hier stammen aus `.claude/skills/regisseur-schnitt/SKILL.md`
 * und sind an demselben fremden Material geprüft. Vier davon sind erst
 * durch diesen Test entstanden — sie waren an Antons eigenem Traum
 * unsichtbar.
 */

/* Die Beat-Typen der Analyse. `transit` (Wege, Abgänge) fliegt zuerst,
 * `climax` nie. Unbekanntes wird zu "build" — ein Sammelbecken, aber ein
 * ehrliches: Es sagt „Handlung, Gewicht unbekannt". */
export const HOOKS = [
  "setup", "build", "turn", "reveal", "reversal",
  "callback", "climax", "resolution", "transit",
];

/* Wie schwer ein Beat wiegt, wenn geworfen werden muss. Niedrig fliegt
 * zuerst. Die Reihenfolge ist die des Skills, in Zahlen: transit vor setup
 * vor build, und die Wendung immer nach dem Höhepunkt.
 *
 * ⚠ `resolution` steht ABSICHTLICH unter `reveal`: Vier von fünf geprüften
 * Träumen hörten einfach auf, statt aufzulösen. Die Analyse vergibt den
 * Typ deshalb nur noch, wenn der Schluss Ort oder Figuren mit dem Höhepunkt
 * teilt — aber wo sie sich irrt, soll der Irrtum billig sein. */
const GEWICHT = {
  climax: 90, turn: 80, reversal: 78, reveal: 76, resolution: 70,
  callback: 50, build: 30, setup: 20, transit: 10,
};

/* Die kürzeste lesbare Dauer je Typ, in Sekunden. Untergrenze für ALLES
 * ist 3: Eine Einstellung braucht Aufbau, Ereignis und Nachhall, und beide
 * Modelle liefern darunter Brei statt Handlung (Seedance-Doku: „excessive
 * cuts or omit parts of the plot"). */
const MIN_S = {
  climax: 5, turn: 4, reversal: 4, reveal: 4, resolution: 3,
  callback: 3, build: 3, setup: 3, transit: 3,
};

/* Wie viel BILDSCHIRMZEIT ein Typ verdient — bewusst eine andere Tabelle
 * als GEWICHT. Die entscheidet, WAS in den Film kommt; diese, wie lange es
 * zu sehen ist, und dafür streut GEWICHT viel zu eng: Höhepunkt 90 gegen
 * Wendung 80 ergibt bei fünfzehn Sekunden dreimal fünf, also genau die
 * gleichmäßige Verteilung, die abgeschafft werden sollte.
 *
 * Die Zahlen sind die Richtwerte des Skills in Sekunden: ein Weg trägt 3,
 * eine Handlung 3–4, eine Wendung 3–5, der Höhepunkt den längsten Block. */
const ZEIT = {
  climax: 6, turn: 4.5, reversal: 4.5, reveal: 4.5, resolution: 4,
  callback: 3.5, build: 3.5, setup: 3.5, transit: 3,
};

export const MIN_SHOT_SECONDS = 3;

/* Wörter, die keine Verbindung zwischen zwei Szenen stiften. Absichtlich
 * kurz gehalten: Der Test ist „teilen sie ein Inhaltswort", nicht „sind sie
 * dasselbe" — und die Beats sind immer Englisch (Analyse-Regel). */
const STOPP = new Set([
  "the", "and", "with", "from", "into", "onto", "over", "under", "through",
  "that", "this", "then", "they", "them", "their", "there", "here", "when",
  "while", "where", "which", "what", "who", "her", "his", "its", "our",
  "for", "are", "was", "were", "has", "have", "had", "not", "but", "out",
  "one", "two", "all", "some", "more", "very", "just", "now", "still",
  "front", "back", "side", "left", "right", "next", "same", "other",
  "camera", "shot", "scene", "frame", "screen", "picture", "light",
]);

/* Unregelmäßige Mehrzahlformen, die kein Suffixschnitt einfängt. Kurz
 * gehalten und nach Bedarf gewachsen: „tooth" und „teeth" mussten drin
 * sein — bei einem Zahntraum entscheidet ausgerechnet dieses Wortpaar, ob
 * zwei Szenen als verwandt gelten. */
const UNREGELMAESSIG = {
  teeth: "tooth", feet: "foot", men: "man", women: "woman", children: "child",
  mice: "mouse", geese: "goose", people: "person", lives: "life", knives: "knife",
  wolves: "wolf", leaves: "leaf", halves: "half", selves: "self",
};

/* Ein sehr kleiner Stammschnitt. Er muss nicht sprachwissenschaftlich
 * stimmen — er muss „loose" und „loosen" auf denselben Stamm bringen, ohne
 * unverwandte Wörter zusammenzuwerfen. Deshalb nur die häufigsten Endungen
 * und nie unter vier Zeichen. */
function stamm(w) {
  if (UNREGELMAESSIG[w]) return UNREGELMAESSIG[w];
  for (const suf of ["ing", "ed", "en", "es", "s", "e"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) return w.slice(0, -suf.length);
  }
  return w;
}

function woerter(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .split(/[^a-zà-ÿ]+/)
      .filter((w) => w.length > 3 && !STOPP.has(w))
      .map(stamm)
  );
}

/** Teilen zwei Szenen mindestens ein Inhaltswort? Der Näherungstest für
 *  „gehört zum selben Traum" — ohne Semantik, aber am geprüften Material
 *  belastbar: Ein Zahntraum, der mit Bangkok und einer Ausstellung
 *  beginnt, teilt mit „my teeth fall into my hand" kein einziges Wort. */
export function beruehrt(a, b) {
  const wa = woerter(a);
  for (const w of woerter(b)) if (wa.has(w)) return true;
  return false;
}

/** Die Zusatzangaben je Szene, aufgefüllt und geklemmt.
 *
 *  ⚠ Alte Träume haben KEINE Meta (die Analyse lieferte bis 03.09.2026 nur
 *  Text). Sie bekommen "build"/3 und laufen damit durch denselben Weg wie
 *  neue — kein Migrationszwang, keine zweite Codebahn. */
export function beatMeta(analysis) {
  const beats = (analysis?.beats || []).filter((b) => typeof b === "string" && b.trim());
  const roh = Array.isArray(analysis?.beatMeta) ? analysis.beatMeta : [];
  return beats.map((text, i) => {
    const m = roh[i] || {};
    const hook = HOOKS.includes(m.hook) ? m.hook : "build";
    const min = Number(m.min_s);
    return {
      text,
      hook,
      min_s: Number.isFinite(min) ? Math.max(MIN_SHOT_SECONDS, Math.min(10, Math.round(min))) : MIN_S[hook],
    };
  });
}

/** Der Signatur-Beat: die eine Szene, die der Träumende nennen würde, wenn
 *  er nur einen Satz hätte. Die Analyse benennt ihn; fehlt die Angabe
 *  (alte Träume), fällt die Wahl auf den schwersten Typ, bei Gleichstand
 *  auf den früheren — der erste Höhepunkt ist der, den der Traum meint.
 *
 *  Ohne ihn bricht die Auswahl bei fünf Sekunden: Dort trägt ein Clip einen
 *  Shot, geschützt wären aber drei bis fünf Szenen. */
export function signatureIndex(analysis) {
  const meta = beatMeta(analysis);
  if (meta.length === 0) return -1;
  const s = Number(analysis?.signature);
  if (Number.isInteger(s) && s >= 0 && s < meta.length) return s;
  let best = 0;
  for (let i = 1; i < meta.length; i++) {
    if (GEWICHT[meta[i].hook] > GEWICHT[meta[best].hook]) best = i;
  }
  return best;
}

/** Wie viel Zeit der Kern des Traums braucht — die Zahl, die dem Menschen
 *  genannt wird.
 *
 *  ⚠ NICHT die Summe aller Szenen. Genau das war der Fehler bis zum
 *  03.09.2026: Über zehn Szenen summiert landet jeder ausführlich erzählte
 *  Traum bei 33 bis 40 Sekunden, also über dem Maximum beider Modelle — der
 *  Rat wäre bei fünf von fünf geprüften Träumen „das ist ein Zweiteiler"
 *  gewesen. Eine Empfehlung, die immer dasselbe sagt, ist keine. */
export function minKern(analysis) {
  const meta = beatMeta(analysis);
  const sig = signatureIndex(analysis);
  return meta.reduce((s, b, i) => (i === sig || GEWICHT[b.hook] >= GEWICHT.resolution ? s + b.min_s : s), 0);
}

/** Wie viele Szenen dieser Traum überhaupt hat, mit allem Beiwerk. Eine
 *  Auskunft, keine Empfehlung — siehe minKern. */
export function minAlles(analysis) {
  return beatMeta(analysis).reduce((s, b) => s + b.min_s, 0);
}

/**
 * Welche Szenen in den Film kommen — nach Gewicht, nicht nach Position.
 *
 * @param {object} analysis  der Analyse-Block des Traums
 * @param {number} budget    wie viele Shots Dauer und Modell tragen (video.js)
 * @returns {number[]} Indizes, chronologisch sortiert
 */
export function selectBeats(analysis, budget) {
  const meta = beatMeta(analysis);
  const n = meta.length;
  const platz = Math.max(1, Math.min(Number(budget) || 1, n));
  if (n === 0) return [];
  if (n <= platz) return meta.map((_, i) => i);

  const sig = signatureIndex(analysis);
  /* Der Anker für „gehört zum Traum": der Signatur-Beat UND der Höhepunkt.
     Der Signatur-Beat allein ist zu schmal — im geprüften Zahntraum steht
     im einen „the canine is gone", im anderen „teeth fall from his hand",
     und die Wortprüfung verbindet die beiden nicht. Zusammen genommen
     fangen sie den Hauptstrang zuverlässig ein; die Kulisse (Bangkok, eine
     Ausstellung, eine Parkplatzsuche) berührt weiterhin keinen von beiden. */
  const climaxIdx = meta.findIndex((b) => b.hook === "climax");
  const kernText = [meta[sig]?.text, climaxIdx >= 0 ? meta[climaxIdx].text : ""]
    .filter(Boolean).join(" ");

  /* Ein Punktwert je Szene, hoch bleibt. Drei Zutaten, in dieser Ordnung:
     der Typ trägt die Entscheidung, „berührt den Signatur-Beat" trennt
     Handlung von Kulisse, und die Mindestdauer bricht Gleichstände — ein
     Beat, dem die Analyse mehr Zeit zugesteht, wiegt schwerer. */
  const punkte = meta.map((b, i) => {
    if (i === sig) return Number.MAX_SAFE_INTEGER;
    let p = GEWICHT[b.hook] ?? GEWICHT.build;
    const kulisse = !beruehrt(b.text, kernText);
    /* ⚠ Der abbrechende Schluss (gemessen 03.09.2026): Die Analyse gab dem
       Flugtraum als Höhepunkt den Kuss mit einem Freund an einem Ort, der
       nie vorkam — er ist der gefühlvollste Moment, aber er gehört nicht zu
       DIESEM Traum. Ein geschützter Typ als LETZTER Beat, der mit dem
       Signatur-Beat nichts teilt, verliert deshalb seinen Vorrang: Sonst
       kostet ein Ausrutscher der Analyse den halben Film. Die Regel steht
       auch im Analyse-Prompt — das hier ist die Sicherung darunter, weil
       Modellausgabe untrusted ist. */
    if (kulisse && i === n - 1 && p > GEWICHT.callback && !beruehrt(b.text, meta[sig]?.text)) {
      p = GEWICHT.transit;
    } else if (kulisse && i !== climaxIdx) {
      /* Der Höhepunkt bekommt den Kulissen-Abschlag nie: Er IST der
         Hauptstrang, und die Wortprüfung ist zu grob, um ihn zu bewerten —
         im Zahntraum teilen „the canine is gone" und „he spits the teeth
         into his palm" kein einziges Wort und meinen dasselbe. Nur der
         Sonderfall darüber (Höhepunkt ganz am Schluss, ohne Bezug zum
         Signatur-Beat) entzieht ihm den Vorrang. */
      p -= 15;
    }
    return p + b.min_s / 10;
  });

  const gewaehlt = meta
    .map((_, i) => i)
    .sort((a, b) => punkte[b] - punkte[a] || a - b)
    .slice(0, platz);
  return gewaehlt.sort((a, b) => a - b);
}

/**
 * Die Zeitblöcke: welcher Shot wie lange zu sehen ist.
 *
 * Nie gleichmäßig — das war der zweite Teil des alten Fehlers (director.js
 * rechnete `seconds / scenes`). Der Höhepunkt bekommt den längsten Block,
 * ein Weg den kürzesten. Ganze Sekunden, lückenlos, und die Summe ist exakt
 * die bestellte Dauer: Seedance 2.5 verlangt eine geschlossene Timeline,
 * und H3 bekommt daraus seine Schnittzeitpunkte.
 *
 * @returns {{index:number,text:string,hook:string,from:number,to:number}[]}
 */
export function shotPlan(analysis, indices, seconds, minShot = MIN_SHOT_SECONDS) {
  const meta = beatMeta(analysis);
  const idx = (indices || []).filter((i) => meta[i]);
  const total = Math.max(1, Math.round(Number(seconds) || 0));
  if (idx.length === 0) return [];

  /* Die Untergrenze kommt vom TEMPO, nicht mehr als Konstante (03.09.2026):
     3 Sekunden beim ruhigen Schnitt, 2 beim schnellen. Passt sie nicht mehr
     in die Dauer, wird gleichmäßig geteilt, statt eine Regel zu erzwingen,
     die die Zeit nicht hergibt. */
  /* `minShot` 0 (der Fluss) ist ein echter Wert, kein fehlender: Dort gibt
     es keine Schnitte, also keine Untergrenze je Block — nur die eine
     Sekunde, unter der ein ganzzahliger Block nicht mehr existiert. */
  const gewuenscht = Number.isFinite(Number(minShot)) ? Number(minShot) : MIN_SHOT_SECONDS;
  const untergrenze = Math.max(1, gewuenscht);
  const min = idx.length * untergrenze <= total ? untergrenze : total / idx.length;
  const gewicht = idx.map((i) => ZEIT[meta[i].hook] ?? ZEIT.build);

  /* Die volle Dauer nach Gewicht verteilen — NICHT nur den Rest über der
     Untergrenze. Genau das war der Denkfehler der ersten Fassung: Wenn drei
     von fünfzehn Sekunden schon als Sockel vergeben sind, streiten sich die
     Typen nur noch um sechs, und aus 4,5 gegen 6 wird fünf gegen fünf.
     Wer unter die Untergrenze fiele, bekommt sie fest zugeteilt; die
     übrigen teilen die verbleibende Zeit erneut unter sich auf, bis niemand
     mehr darunter liegt. */
  const roh = gewicht.slice();
  const fest = new Array(idx.length).fill(false);
  for (let runde = 0; runde <= idx.length; runde++) {
    const offen = roh.map((_, k) => k).filter((k) => !fest[k]);
    if (offen.length === 0) break;
    const belegt = roh.reduce((s, v, k) => (fest[k] ? s + v : s), 0);
    const summe = offen.reduce((s, k) => s + gewicht[k], 0) || 1;
    let nachgezogen = false;
    for (const k of offen) {
      roh[k] = ((total - belegt) * gewicht[k]) / summe;
      if (roh[k] < min) { roh[k] = min; fest[k] = true; nachgezogen = true; }
    }
    if (!nachgezogen) break;
  }

  const ganz = roh.map(Math.floor);
  let luecke = total - ganz.reduce((s, v) => s + v, 0);
  /* Die übrigen Sekunden gehen an die Blöcke mit dem größten abgeschnittenen
     Rest — die übliche Sitzverteilung. Bei Gleichstand an den früheren, damit
     dieselbe Eingabe immer denselben Plan ergibt. */
  const reihe = roh
    .map((v, k) => [v - ganz[k], k])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; luecke > 0; k++, luecke--) ganz[reihe[k % reihe.length][1]]++;

  const plan = [];
  let t = 0;
  idx.forEach((i, k) => {
    plan.push({ index: i, text: meta[i].text, hook: meta[i].hook, from: t, to: t + ganz[k] });
    t += ganz[k];
  });
  return plan;
}

/**
 * Was dem Menschen über die Länge gesagt wird — als Satz mit Zahlen, nicht
 * als Nadel am Regler.
 *
 * Liefert die Bausteine, nicht den Text: Die Worte stehen in den
 * Sprachdateien (i18n), wie jeder sichtbare Text dieser App.
 *
 * @returns {{beats:number, kern:number, passt:number, alle:boolean, einBild:boolean, zweiteiler:boolean}}
 */
export function recommendation(analysis, budget, seconds, maxSeconds, budgetBeiMax) {
  const meta = beatMeta(analysis);
  const platz = Math.max(1, Math.min(Number(budget) || 1, meta.length || 1));
  const kern = minKern(analysis);
  const beiMax = Math.min(Math.max(1, Number(budgetBeiMax) || platz), meta.length || 1);
  return {
    beats: meta.length,
    kern,
    passt: Math.min(platz, meta.length),
    alle: meta.length > 0 && platz >= meta.length,
    einBild: platz <= 1,
    /* Wie viele Szenen die LÄNGSTE Einstellung dieses Modells trüge — und
       die Sekundenzahl dazu. Das ist die einzige zweite Zahl, die dem
       Menschen etwas nützt: Sie sagt, was mehr Länge wirklich brächte.
       ⚠ Nicht `kern` dafür verwenden. Die erste Fassung schrieb „bei
       {kern} Sekunden passen alle", und beim ersten echten Lauf stand da
       „2 von 11 Szenen passen … Bei 13 Sekunden passen alle" — bei 13
       Sekunden passten genau diese 2. Der Kern ist die Zeit, die der Kern
       braucht, nicht die, ab der jede Szene hineinpasst. */
    beiMax,
    mehrBei: beiMax > platz ? Number(maxSeconds) || 0 : null,
    /* Ein Zweiteiler ist es nur, wenn der KERN nicht mehr hineinpasst.
       Liegt bloß das Beiwerk darüber, ist es ein Traum mit viel Beiwerk. */
    zweiteiler: kern > (Number(maxSeconds) || 0),
  };
}
