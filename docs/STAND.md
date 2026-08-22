# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-22 (10:30) — Ende `session/2026-08-22-anton-2`,
PR #21 freigegeben, wartet auf Antons Merge-Klick.
⚠ Session lief ohne Worktree direkt im Hauptrepo — nach dem Merge:
`git checkout main && git pull`, sonst servieren die Dev-Server einen
toten Branch.

## Wo wir stehen

Zwei Datenverluste aus Antons Testrunde sind an der Wurzel repariert,
und der Mehrwert-Plan ist bis P2 fertig plus P3b.

**Der Traum entsteht beim Druck auf Erzeugen** (`src/wizard/Step5Style.jsx`),
nicht mehr erst wenn die Bilder da sind. Er trägt die Marke `pending`,
die Aufträge hängen sich einzeln an, abgerechnet wird je abgegebenem
Auftrag, und der Collector holt überall in der App ab. Wer mittendrin
wegklickt, verliert nichts mehr.

**Bilder liegen immer im Hauptrepo** (`src/lib/mediaRoot.js`): Aus einem
Worktree heraus biegt der Server MEDIA_DIR auf die Hauptwurzel um. Die
Bilder vom 21.08. sind trotzdem verloren — sie lagen im entfernten
Worktree, die Auftragsnummern gleich mit.

Dazu fertig: Schlafkachel und Wiederkehr-Hinweis (Mehrwert P2),
Einschlaf-Timer (P3b), Szenentext vor dem Erzeugen anpassbar,
Mini-Credit-Geschenke der Serie, „ich"/„I" verknüpft automatisch das
eigene Profilbild, Stimmproben liegen als 516 KB AAC im Repo.

## Nächste Schritte

1. **Antons Entscheidungen abwarten** (siehe unten) — ohne sie ist der
   Streak-Ausbau und die Preset-Frage blockiert.
2. **Traumzeichen-Karten:** Anton erzeugt die 20 Symbolbilder selbst
   (Liste und Prompts: `docs/plans/2026-08-22-traumzeichen-karten.md`).
   Danach zu bauen: Bild statt Emoji auf Symbolseite und Atlas, Karte
   teilbar. Ablage `public/symbols/<id>.webp`, Dateiname IST die ID.
3. **Schlussstein** (je ein bezahlter Film pro Stufe) — von Anton
   ausdrücklich vertagt: „noch nicht machen".

## Bekannte Baustellen

- **Streak-Board Stufe 2** (`docs/plans/2026-08-21-streak-board-gamification.md`):
  Schlummernacht (§6) und „Nichts hängengeblieben"-Eintrag (§3) warten
  auf Antons Ja/Nein. Das garantierte Sonderwesen je Meilenstein (§5)
  ist ebenfalls offen.
- **Klang-Presets** (P3b-Rest): „Regennacht"/„Zugfahrt" brauchen
  lizenzierte Audiodateien. Nur CC0 nehmen — Pixabay und Mixkit
  verbieten die Weitergabe der Datei „as standalone", und ein Mixer ist
  genau dieser Grenzfall. Quelle + Lizenz gehören dann ins Repo.
- **Mehrwert-Plan** (`2026-08-21-mehrwert-inhalte.md`): P1, P2a, P2b und
  P3b gebaut. Offen: P2c (Traumzeichen, s. o.), P3a Albtraum-Umschreiben
  (Wortlaut mit dem Rechtsplan abstimmen).
- **Recht** (Plan recht-einwilligung §4): Punkt 1 gebaut; offen
  Upload-Zusicherung im AvatarDialog (2) · KI-Kennzeichnung/C2PA (3) ·
  Speicherfristen /media (4, server.js speichert unbegrenzt) ·
  DeepSeek-China-Entscheidung (5). Anwalt vor Store-Launch.
- **Antons offene Antworten:** Faultier-Easter-Egg — ersetzt oder
  begleitet echte Figuren? (`faultier-assets.md`) · Preislinie (85 %
  Marge halten vs. Modellpreise durchreichen; seine Linie ist
  Durchreichen, die Preisliste ist noch nicht danach gerechnet) ·
  Stil der Traumzeichen-Karten.
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx`).

## Fallen, die man nur einmal sieht

- `update()` in `src/state/AppState.jsx:50` nimmt auch Funktionen:
  `(prev) => patch`. Wer in Schritten arbeitet (Wizard, Schleifen), MUSS
  das benutzen — die veraltete Journalliste aus dem Renderzeitpunkt hat
  am 22.08. einen ganzen Traum gelöscht.
- `clearStalePending()` (`AppState.jsx:36`) räumt beim Start hängende
  „wird erstellt"-Marken. Beim Start läuft kein Wizard, also ist jede
  gefundene Marke ein Abbruch.
- `recurrenceFor()` (`src/lib/atlas.js:142`) zählt ALLE anderen Träume,
  nicht nur ältere — die Oberfläche sagt deshalb „weitere Träume".
- `key={open.id}` am JournalDetail (`JournalScreen.jsx`) ist Pflicht:
  ohne ihn trägt der Bearbeiten-Entwurf beim Sprung in einen anderen
  Traum den alten Wortlaut mit und überschreibt ihn beim Speichern.
- `PORT` gehört der Oberfläche, `API_PORT` der API (`scripts/dev.mjs`,
  `vite.config.js`). Beide auf `PORT` zu hören band die API an Vites
  Port — IPv4 gegen IPv6, Oberfläche mal aus Vite, mal aus altem dist/.
- Erzeugte Medien NIE im Worktree (`src/lib/mediaRoot.js`, AGENTS.md).

## Klickbare Wolken-Vorschau (aus #18)

Der Build als eigenständige HTML-Datei, veröffentlicht als Artifact:
**https://claude.ai/code/artifact/7a42cf64-fe13-49f2-a31e-46b67afb5616**
Alles Lokale funktioniert, Erzeugen nicht (braucht den Server). Zum
Auffrischen: `bun run build` + Bündelskript, denselben Pfad erneut
veröffentlichen. Bewusst NICHT im Repo. Stand: vor dieser Sitzung.
