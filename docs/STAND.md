# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-22 (17:50) — Ende `session/2026-08-22-anton-3`,
PR #22 freigegeben, wartet auf Antons Merge-Klick.
⚠ Nach dem Merge: `git checkout main && git pull` — die Sitzung lief ohne
Worktree, die Dev-Server servieren dieses Checkout.

## Wo wir stehen

Antons vier offene Entscheidungen sind beantwortet und abgearbeitet.

**Die Serie bestraft keine Biologie mehr.** Die Schlummernacht
(`src/lib/streak.js:61`) springt beim App-Start ein: je sieben Nächte
verdient man eine, höchstens zwei auf Vorrat, eine fehlende Nacht wird
überbrückt. Und „Nichts hängengeblieben" (`src/lib/blankNight.js`) hält
die Serie mit einem Tipp, ohne einen Traum zu erfinden.

**Die Preislinie ist durchgerechnet, aber nicht entschieden.** Die
Wolken-Vorlage ist in diesen Branch gemergt und um den Store-Anteil
ergänzt. Antons Wahl steht aus — sie ist der einzige echte Blocker.

Dazu: 28 CC0-Klangkandidaten liegen zum Anhören bereit, das wandernde
Licht wohnt jetzt an einem Ort statt in drei Kopien, und
`scripts/marge-bei-umsatz.mjs` beantwortet „was bleibt bei X Umsatz".

## Nächste Schritte

1. **Antons Preisentscheidung** — Weg C + Paket XL ($29,99, bemessen am
   30-%-Fall) ODER Kino ehrlich auf 10 Sekunden begrenzen. Danach:
   `plans.js`, `video.js` und die Paywall-Texte in einem Zug.
2. **Klang-Presets:** Anton hört durch, wählt 2–3, holt die Originale
   über sein Freesound-Konto. Danach `public/sounds/<preset>.m4a` und
   ein zweiter Puffer-Lieferant in `src/lib/noise.js` — `soundMixer.js`
   kann das schon.
3. **Traumzeichen-Karten** (`2026-08-22-traumzeichen-karten.md`): 20
   Bilder von Anton, dann Bild statt Emoji auf Symbolseite und Atlas.
   Vertagt auf sein Wort.

## Bekannte Baustellen

- **Preislinie** (`2026-08-22-preislinie-durchreichen.md`, Abschnitt 8):
  Kino ist in voller Länge mit keinem Angebot in einem Kauf erreichbar —
  unabhängig von A/B/C. Regie dagegen schon; der frühere Gegenbefund war
  eine Folge der Credit-Stückelung.
- **Streak §5 offen:** das garantierte Sonderwesen je Meilenstein. Die
  Leiter nennt bisher nur Raritätsschwellen, die `creatures.js` kennt.
- **Mehrwert-Plan:** P1, P2a, P2b, P3b gebaut. Offen: P2c (Traumzeichen,
  s. o.), P3a Albtraum-Umschreiben (Wortlaut mit dem Rechtsplan
  abstimmen).
- **Recht** (Plan recht-einwilligung §4): Punkt 1 gebaut; offen
  Upload-Zusicherung im AvatarDialog (2) · KI-Kennzeichnung/C2PA (3) ·
  Speicherfristen /media (4, server.js speichert unbegrenzt) ·
  DeepSeek-China-Entscheidung (5) · Klang-Lizenzliste (6, neu). Eine
  Cloud-Sitzung hat `docs/legal/` als nächstes angekündigt.
- **Faultier-Assets:** vertagt, Einbaustellen stehen im Plan.
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx`).

## Fallen, die man nur einmal sieht

- **Eine leere Nacht ist KEIN TRAUM** (`src/lib/blankNight.js:27`). Die
  Erkennung hängt an EINEM Feld, alle Filter lesen `isBlank()`. Wer das
  aufweicht, verwässert Atlas, Menagerie, Showcase und Statistik
  gleichzeitig.
- **Keine Teilrettung bei der Schlummernacht** (`streak.js:61`): Zwei
  Lücken mit einem Vorrat verbrauchen ihn nicht. Ihn zu opfern und die
  Serie trotzdem zu verlieren wäre der schlechteste Ausgang.
- **Das wandernde Licht steht EINMAL** in `src/styles/orbit.css` (Klasse
  `orbit`, global in main.jsx geladen). Der Winkel MUSS `@property`
  bleiben — ein gewöhnliches Custom Property interpoliert nicht.
- `update()` (`src/state/AppState.jsx`) nimmt auch Funktionen:
  `(prev) => patch`. Wer in Schritten arbeitet, MUSS das benutzen.
- `clearStalePending()` räumt beim Start hängende „wird erstellt"-Marken.
- `recurrenceFor()` (`src/lib/atlas.js`) zählt ALLE anderen Träume, nicht
  nur ältere — die Oberfläche sagt deshalb „weitere Träume".
- `key={open.id}` am JournalDetail ist Pflicht (JournalScreen.jsx).
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree (`src/lib/mediaRoot.js`, AGENTS.md).
- **Warum die Sitzungen trotz AGENTS.md ohne Worktree laufen:** Die
  Browser-Vorschau startet den Dev-Server immer aus dem HAUPT-Checkout
  (`.claude/launch.json` liegt dort). Aus einem Worktree heraus würde sie
  fremden Code servieren, und die Live-Prüfung — das Werkzeug, mit dem
  hier jeder Befund entstanden ist — wäre blind. Wer ohne Live-Prüfung
  arbeitet, legt den Worktree wie vorgesehen an.

## Klickbare Wolken-Vorschau (aus #18)

**https://claude.ai/code/artifact/7a42cf64-fe13-49f2-a31e-46b67afb5616**
Alles Lokale funktioniert, Erzeugen nicht (braucht den Server). Zum
Auffrischen: `bun run build` + Bündelskript, denselben Pfad erneut
veröffentlichen. Bewusst NICHT im Repo. Stand: 22.08. vormittags.
