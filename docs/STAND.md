# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-22 (01:07) — Ende `session/2026-08-22-anton` (PR #20,
freigegeben, wartet auf Antons Merge-Klick).
⚠ Session lief ohne Worktree direkt im Hauptrepo — nach dem Merge:
`git checkout main && git pull`, sonst servieren die Dev-Server einen
toten Branch.

## Wo wir stehen

Antons große Live-Testrunde ist eingearbeitet. Die App rendert jetzt
**alles im Hintergrund**: Bilder und Filme gehen als Aufträge in fals
Warteschlange, der Traum steht sofort als Journal-Kachel („wird gerade
erstellt"), ein App-weiter Collector (`src/lib/collector.js`, verdrahtet
in `AppState.jsx`) holt ab, meldet per Toast und erstattet Gescheitertes.
Kein Wartebildschirm mehr, keine gehaltene Verbindung — und damit auch
kein 10-Sekunden-Bun-Timeout mehr (Notbremse `idleTimeout: 255` in
server.js, festgenagelt in `src/lib/timeouts.test.js`).

Dazu aus derselben Runde: Poster abgeschafft (Titel ist wieder
App-Typografie; `media.poster` wird nur noch GELESEN), Storyboard
Stufe B (Szenen an-/abwählbar, leere Szenen für 1 Credit nachfüllbar →
`sceneJobs`/`sceneImages`), Rechtstexte als lesbare Seiten hinter den
Consent-Links (CONSENT_VERSION 2, Widerruf im Profil), Übersetzungs-Stopp
als Projektregel (nur noch en+de pflegen, Rest fällt auf Englisch
zurück — AGENTS.md), Journal aufgeräumt (Suche als Lupe, Träume oben,
Besetzung/Atlas/Menagerie darunter), Ortsregel im Analyse-Prompt
repariert (Schauplatz statt „Himmel über X"), Kamera-Knopf im
AvatarDialog, Test-Credits im Dev-Startmenü.

Aus der Cloud (#18) ist der **Mehrwert-P2-Rechenteil** da und getestet:

- `src/lib/checkin.js` — Morgen-Check-in („Wie hast du geschlafen?",
  drei Stufen): `checkinOn` · `setCheckin` (kappt bei 400) ·
  `sleepAverage` · `sleepByMood`. ⚠ Nur EINE Frage (Antons
  Entscheidung): die Stimmung kommt aus `analysis.mood`.
- `src/lib/atlas.js:137` — `recurrenceFor(journal, entry)`: was an
  DIESEM Traum schon einmal da war, mit `entryIds` zum Antippen.
- `package.json` — Tests laufen unter `TZ=Europe/Berlin`.

## Nächste Schritte

1. **P2 fertigstellen:** Atlas-Kachel zur Schlaf-Auswertung
   (`sleepAverage`/`sleepByMood` warten in checkin.js) und der
   Wiederkehr-Hinweis (`recurrenceFor`) im Traum-Detail ÜBER der
   Reflection · `components/Recurrence.jsx` fehlt noch.
2. **Streak-Board Stufe 2** erst nach Antons Ja/Nein: Mini-Credit-
   Geschenke (7→1, 30→3) · Schlummernacht · „Nichts hängengeblieben"-
   Eintrag (Plan §3/§5/§6).
3. **Schlussstein:** je ein echter bezahlter Film pro Stufe durch die
   App-UI (~$4; Lebendig/Regie/Kino + Abspann T3). Nur von Antons
   Rechner möglich (Cloud erreicht fal nicht).

## Klickbare Wolken-Vorschau (aus #18)

Der Build als eigenständige HTML-Datei, veröffentlicht als Artifact:
**https://claude.ai/code/artifact/7a42cf64-fe13-49f2-a31e-46b67afb5616**
Alles Lokale funktioniert, Erzeugen nicht (braucht den Server). Zum
Auffrischen: `bun run build` + Bündelskript, denselben Pfad erneut
veröffentlichen. Bewusst NICHT im Repo.

## Bekannte Baustellen

- **Mehrwert-Plan** (`2026-08-21-mehrwert-inhalte.md`): P1 gebaut; P2a/b
  halb (Rechnung ja, Oberfläche nein); offen P2c Traumzeichen-Karten ·
  P3a Albtraum-Umschreiben (Wortlaut mit Rechtsplan abstimmen) · P3b
  Einschlaf-Timer.
- **Recht** (Plan recht-einwilligung §4): Punkt 1 gebaut; offen
  Upload-Zusicherung im AvatarDialog (2) · KI-Kennzeichnung/C2PA (3) ·
  Speicherfristen /media (4, server.js speichert unbegrenzt) ·
  DeepSeek-China-Entscheidung (5). Anwalt vor Store-Launch.
- **Antons offene Antworten:** „Guten Abend"-Gruß ersetzen? ·
  Faultier-Easter-Egg: ersetzt oder begleitet echte Figuren?
  (`faultier-assets.md`) · Preislinie (85 % Marge halten vs.
  Modellpreise durchreichen — seine Linie ist Durchreichen, die
  Preisliste ist noch nicht danach gerechnet).
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx`).
- Symbol-ERKENNUNG weiter nur englische Stichwörter (`symbols.js`) —
  abgefedert über die englischen Beats; ein deutscher Traum OHNE Analyse
  liefert im Atlas nichts. Deutsche Stichwortlisten wären der Vollausbau.
- Direktanbieter-Schwellen (Plan direktanbieter-preise §5): Kino-Nutzung
  ⇒ BytePlus messen (2 Mio. Gratis-Tokens) · >$200 fal/Monat ⇒ Bilder zu
  Google direkt · H3 nie direkt.
- Bilderstrecke teilt nach Sätzen; localStorage ~5 MB; kein `bun run lint`.
- Dev-Umgebung: `preview_start`/launch.json servt das HAUPTREPO — im
  Worktree `bun run dev:web` von Hand; Server auf 8100 mit
  .env-Variablen aus dem Hauptrepo starten (Datei NICHT kopieren,
  Vite-Watch-Falle).

## Was die App ist

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI
macht daraus Bildstrecke, optional Film, Reflection und Muster. **Vier
Tabs**, Wizard über der Tab-Leiste.

| Tab | Inhalt |
|---|---|
| Home | Begrüßung, Faultier-Film, Serien-Zeile, letzter Traum |
| Journal | Kartenstapel/Liste, Kalender, Kino-Detail mit Storyboard + Reflection, Besetzung + Traumatlas + Menagerie |
| **⊕** | Wizard: Traum → Ausgabe → Personen → Orte → Style → Auftrag ins Journal |
| Sleep | Alles gratis: Checkliste, Sound-Mixer, Klartraum-Leitfaden, Symbole |
| Profil | Porträt, Guthaben-Pille, Einstellungen (Stimme · Rechtstexte · Widerruf), „Was du mir erzählt hast" |

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter);
`server.js` als schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini).
Zustand in `localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt
werden **en+de** (`check-i18n-shape.mjs`: de streng, Rest zählt Lücken).
Doku und Commits deutsch.

## ⚠ Stehende Entscheidungen und Fallen

- **Startmenü bleibt** (fragt jeden Start) und **Seed-Journal bleibt** —
  beides fliegt nur auf Antons ausdrückliches Wort.
- Modellwissen lebt in `video.js` (`refsField`/`refStyle`/`aspect`/
  `noExpand`); der Regisseur spricht je Modell die richtige Syntax,
  `checkDirectedPrompt` liest alle drei. H3-Geldfallen verriegelt
  („768P" ausdrücklich, `enable_prompt_expansion:false`).
- **Bogen-Pflicht** (`lib/sheets.js`): Fotos werden beim ersten BEZAHLTEN
  Render zum Charakterbogen normalisiert (träge · gratis · veraltbar;
  Orte ausgenommen; Fallback rohes Foto).
- Capacitor + StoreKit + RevenueCat vor Launch · DeepSeek immer ohne
  max_tokens, stream:false · nie auf geratene Feldnamen bezahlt rendern.
