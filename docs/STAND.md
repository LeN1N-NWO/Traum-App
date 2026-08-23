# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-23 (15:49) — Ende der Cloud-Sitzung
`claude/new-session-x9qv1w`, aufgesetzt auf `fceabc5`.
340 Tests grün, Shape-Check grün, Build sauber.
Laufende Sitzung: `session/2026-08-23-anton`, aufgesetzt auf `0960bb4`.

## Wo wir stehen

Die App selbst ist unverändert stark: Bilder und Filme rendern im
Hintergrund (`collector.js`), die Bildstrecke ist eine Kette
(`imageChain.js`), das Bildmodell ist **Seedream 5 Lite** ($0,035 bei
1440×2560), Mehrwert P1/P2a/P2b/P3b stehen.

Diese Sitzung war eine **Denk- und Rechensitzung**: Was kostet uns was,
wo lässt sich sparen, was machen die Wettbewerber. Dazu ein gebauter
Teil im Onboarding.

**⏰ ERINNERUNG AN ANTON (er hat ausdrücklich darum gebeten):
Die 28 Klang-Kandidaten durchhören.** Er wählt 2–3 aus, holt die
Originale über sein Freesound-Konto; danach `public/sounds/<preset>.m4a`
und ein zweiter Puffer-Lieferant in `src/lib/noise.js`.
**Das gehört beim nächsten Start als Erstes angesprochen.**

## Nächste Schritte

1. **Antons Messrunde am eigenen Rechner** (die Cloud erreicht fal nicht),
   zusammen unter $5:
   - **Raster:** `node scripts/raster-prompt.mjs 5`, Prompt kopieren, EIN
     Bild rendern ($0,035), von Hand in sechs Kacheln schneiden. Frage:
     Halten Gesichter und Hände bei 864×1536?
   - **Atlas Cloud** (Seedance 2.5 zu $0,134/s?): ein 5-Sekünder (~$0,67),
     die fünf Prüfpunkte aus `2026-08-23-guenstiger-anbieten.md` §6.
   - **fal-Slugs** für Seedream 5 Pro und Nano Banana Pro abschreiben —
     dann trage ich sie in `imageModel.js` ein, vorher nicht.
2. **Preisentscheidung** — jetzt auf aktueller Grundlage:
   Weg A/B/C plus die Rabattleiter (Jahr auf 50 Credits?).
3. **Capacitor/Xcode** — und dabei ⚠ die Vorab-Frage zur Benachrichtigung
   (siehe „Fallen"). Nach dem Start nicht mehr nachholbar.
4. **P3a Albtraum-Umschreiben** — das Ziel ist jetzt im Fragebogen
   wählbar, die Antwort darauf fehlt noch.
5. **Schlussstein:** je ein echter bezahlter Film pro Stufe.

## Was diese Sitzung gebracht hat

**Rechnung (Pläne, nichts umgesetzt):**
- `2026-08-22-preislinie-durchreichen.md` — auf Seedream nachgezogen. Ein
  Kino-Credit kostet uns **125 % mehr** als ein Bild-Credit.
- `2026-08-23-guenstiger-anbieten.md` — Sparhebel nach Größe; der größte
  ist der Kino-EINKAUF, nicht das Bild. Rabattleiter: 72 % des Rabatts
  liegen schon im Monat.
- `2026-08-23-raster-test.md` — Geometrie, Kosten, Messauftrag.
- `2026-08-23-lucid-inhalte-dreamwithin.md`, `2026-08-23-shape-auswertung.md`,
  `2026-08-23-traumziele-und-einstiegspreis.md` — Wettbewerb.

**Gebaut:**
- `src/lib/gridLayout.js` + `buildGridPrompt({cols, rows})` +
  `scripts/raster-prompt.mjs` — fünf Szenen in EINEM Bild, 16 Tests.
- `src/lib/reminders.js` — Wunsch ≠ Erlaubnis, 9 Tests.
- Onboarding: **Albträume als Ziel**, Ziel an zweiter Stelle,
  Schlafdauer, Zeitbudget, Erinnerungswunsch (`server.js`,
  `OnboardingSurvey.jsx`, `DreamerCard.jsx`, en+de).
- Der **Traumatlas kündigt sich an** („Ab deinem 2. Traum").

## Bekannte Baustellen

- **Preislinie nicht entschieden** — weiter der einzige echte Blocker.
  Neu dazu: Jahresabo × Kino ist bei 30 % Store-Anteil ein Nullgeschäft;
  Regie 15 s (61 Cr) und Kino 30 s (181 Cr) sind mit KEINEM Einzelkauf
  erreichbar (bester: 45).
- **Das Raster ist ungemessen.** Es kauft den Preis mit Auflösung
  (864×1536 statt 1440×2560); der Vorbehalt vom 19.08. — Gesichter und
  Hände zerfallen zuerst — ist nicht widerlegt, nur billiger geworden.
- **Der zweidimensionale Schnitt fehlt.** `splitIntoPanels()` kann nur
  senkrechte Streifen; die Rechnung steht fertig in `tileBoxes()`,
  verdrahtet wird sie erst nach der Messung.
- **Seedream 5 Pro und Nano Banana Pro sind NICHT in `imageModel.js`** —
  mir fehlen die bestätigten fal-Slugs. Ein geratener Slug ist der
  07.08.-Fehler.
- **Die Einführungsumfrage ist nur gesprochen.** Ohne `GEMINI_KEY`, ohne
  Mikrofon oder ohne stabile Verbindung gibt es GAR KEIN Profil — kein
  Ziel, keine Themen, nichts, worauf das Spätere aufbaut. Ein getippter
  Rückfallweg (vier, fünf Fragen) schließt ein echtes Loch.
- **P3a Albtraum-Umschreiben:** Das Ziel ist wählbar, die Antwort fehlt.
- **Recht** (Plan §4): Upload-Zusicherung (2) · KI-Kennzeichnung (3) ·
  Speicherfristen /media (4) · DeepSeek-China (5) · Klang-Lizenzen (6).
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx`).
- **`data/traeume/` muss vor Veröffentlichung raus** — Ordner UND
  Ladepfad in `AppState.jsx`.
- Vorhandene Charakterbögen überleben einen Modellwechsel
  (`sheets.js:31`) — Antons Bogen stammt noch von Nano Banana Lite.
- Symbol-Erkennung nur englische Stichwörter; abgefedert über die Beats.

## Fallen, die man nur einmal sieht

- **⚠ iOS gibt für die Benachrichtigungs-Erlaubnis genau EINEN Versuch.**
  Wer den Systemdialog kalt zeigt, verliert jeden, der im falschen Moment
  ablehnt — und darf nie wieder fragen. Deshalb: erst in der App fragen
  (`lib/reminders.js`), dann der Systemdialog, und **nie aus dem
  Sprachgespräch heraus** (verhörte Silbe = Funktion für immer weg).
  Nach dem Xcode-Start nicht mehr nachholbar.
- **Ein Test, der im Kommentar fündig wird, prüft den Kommentar.**
  `toolBlock.toContain("nightmares")` war grün, weil der Kommentar über
  `setGoal` das Wort enthält — der Wert selbst hätte fehlen dürfen
  (`onboardingTools.test.js`, 23.08.).
- **Der Bildpreis wird IMPORTIERT, nie abgeschrieben.** Als Konstante war
  er nach einem Tag falsch (`preis-durchreichen.mjs`).
- **Ein falscher Feldname wirft bei fal keinen Fehler** — er liefert still
  das Falsche. `imageModel.js` entscheidet über Endpunkt und Format, nie
  der Aufrufer. `scripts/raster-prompt.mjs` verweigert deshalb die
  Ausgabe, wenn das Seitenverhältnis nicht zum Modell passt.
- **Der bewährte Dreier-Streifen in `buildGridPrompt` ist unantastbar** —
  er ist an echten Renders belegt und `splitIntoPanels()` schneidet genau
  seine Formulierung. Das Raster ist ein eigener Zweig.
- **Der Weltanker der Bildkette steht als LETZTES Bild.**
- **Eine leere Nacht ist KEIN TRAUM** (`blankNight.js:27`).
- **Keine Teilrettung bei der Schlummernacht** (`streak.js:61`).
- `update()` (`AppState.jsx`) nimmt auch Funktionen: `(prev) => patch`.
- `key={open.id}` am JournalDetail ist Pflicht.
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree (`mediaRoot.js`, AGENTS.md).
- **`scripts/modell-ab.mjs` rendert echt und kostet Geld.**
- DeepSeek immer ohne `max_tokens`, mit `stream:false`.
- fal.ai und api.deepseek.com sind aus der Cloud gesperrt (403). Nie
  umgehen; dort strukturell prüfen, bezahlt auf Antons Rechner.

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI macht Bildstrecke,
optional Film, Reflection und Muster. Vier Tabs (Home · Journal · ⊕ ·
Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt werden
**en+de**. Doku und Commits deutsch.

## Geld

Preisliste (`plans.js`): Woche $4,99/12 · Monat ★ $9,99/45 · Jahr
$79,99/45 p.M. · Pakete $2,99/6 · $7,99/18 · $14,99/32.
**Pro Tag:** Jahr $0,219 · Monat $0,328 · Woche $0,713 (nur Abos).
Einkauf: Bild $0,035 · Lebendig $0,06/s · Regie $0,2419/s · Kino
$0,473/s · DeepSeek ~$0,0003.
Alles nachrechenbar: `node scripts/preis-durchreichen.mjs`.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 340 Unit + Hygiene + Kontrast + i18n + RTL

## Werkzeuge

- `node scripts/preis-durchreichen.mjs` — Einkauf, Marge, Rabattleiter,
  Tagespreis. Verkaufsseite und Bildpreis importiert, kann nicht driften.
- `node scripts/raster-geometrie.mjs` — Rasterformate und Kachelgrößen.
- `node scripts/raster-prompt.mjs [n] [modell]` — fertiger Raster-Prompt,
  fal-Parameter, Schnittkoordinaten. Ruft nichts auf.
- `node scripts/dry-run-prompts.mjs [--live]` — der ganze Weg vom Traum
  zum fal-Auftrag; rendert NIE.

## Pläne

- `2026-08-23-guenstiger-anbieten.md` · `2026-08-23-raster-test.md` ·
  `2026-08-23-shape-auswertung.md` ·
  `2026-08-23-lucid-inhalte-dreamwithin.md` ·
  `2026-08-23-traumziele-und-einstiegspreis.md` — alle offen, alle
  Entscheidungsvorlagen.
- `2026-08-22-preislinie-durchreichen.md` — offen, Antons Entscheidung.
- `2026-08-21-mehrwert-inhalte.md` — P1/P2a/P2b/P3b gebaut; P2c und P3a offen.
- `2026-08-20-recht-einwilligung.md` — Punkt 1 gebaut; 2–6 offen.
