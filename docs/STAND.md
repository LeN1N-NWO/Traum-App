# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-22 (00:18) — Ende `session/2026-08-21-anton` (PR #19, Entwurf, merge-bereit nach #18)

## Wo wir stehen

Antons große Live-Testrunde ist eingearbeitet. Die App rendert jetzt
**alles im Hintergrund**: Bilder und Filme gehen als Aufträge in fals
Warteschlange, der Traum steht sofort als Journal-Kachel („wird gerade
erstellt"), ein App-weiter Collector (`src/lib/collector.js`, verdrahtet
in `AppState.jsx`) holt ab, meldet per Toast und erstattet Gescheitertes.
Kein Wartebildschirm mehr, keine gehaltene Verbindung — und damit auch
kein 10-Sekunden-Bun-Timeout mehr (Notbremse `idleTimeout: 255` in
server.js, festgenagelt in `src/lib/timeouts.test.js`).

Dazu: Poster abgeschafft (Titel ist wieder App-Typografie), Storyboard
Stufe B (Szenen an-/abwählbar, leere Szenen für 1 Credit nachfüllbar →
`sceneJobs`/`sceneImages`), Rechtstexte als lesbare Seiten hinter den
Consent-Links (CONSENT_VERSION 2, Widerruf im Profil), Übersetzungs-Stopp
als Projektregel (nur noch en+de pflegen, Rest fällt auf Englisch
zurück), Journal aufgeräumt (Suche als Lupe, Träume oben, Besetzung/
Atlas/Menagerie darunter), Ortsregel im Analyse-Prompt repariert
(Schauplatz statt „Himmel über X"), Kamera-Knopf im AvatarDialog.

216 Unit-Tests grün, Build sauber. 100 Test-Credits gibt es im
Dev-Startmenü (Knopf stirbt mit StartMenu.jsx beim Launch).

## Das EINE, das jetzt ansteht: der Doppel-Merge

Anton will #18 (Cloud: Mehrwert-P2-Rechenteil — checkin.js, atlas.js)
und #19 (diese Session) „zu einem Ding" mergen. `gh pr merge` ist für
Agenten gesperrt — **Anton klickt selbst**, Reihenfolge:

1. PR #18 mergen (stand zuletzt auf MERGEABLE).
2. Dann in `../Traum-App-anton`: `git merge origin/main` — Konflikte in
   `src/i18n/en.js` + `de.js` sind sicher (beide Seiten fügen nur
   hinzu; beides behalten), danach `bun scripts/check-i18n-shape.mjs`
   und `bun test`.
3. PR #19 mergen, Worktree entfernen (`git worktree remove
   ../Traum-App-anton && git worktree prune`).

## Bekannte Baustellen

- **Streak-Board** (Plan `docs/plans/2026-08-21-streak-board-gamification.md`):
  wartet ABSICHTLICH auf den P2-Merge (sonst zwei Morgen-Rituale).
  Offen: Antons Ja/Nein zu den zwei Mini-Credit-Geschenken (7→1, 30→3).
- **Schlussstein weiter offen:** je ein echter bezahlter Film pro Stufe
  durch die App-UI (~$4; Lebendig/Regie/Kino + Abspann T3). Nur von
  diesem Rechner möglich (Cloud erreicht fal nicht).
- **Recht** (Plan 2026-08-20-recht-einwilligung.md, §4): Punkt 1 gebaut;
  offen: Upload-Zusicherung im AvatarDialog (Punkt 2), C2PA/Kennzeichnung
  (3), Speicherfristen /media (4, server.js speichert unbegrenzt),
  DeepSeek-China-Entscheid (5), Anwalt vor Store-Launch.
- **Antons offene Antworten:** „Guten Abend"-Gruß ersetzen?
  Faultier-Easter-Egg: ersetzt oder begleitet echte Figuren?
  (`docs/plans/2026-08-21-faultier-assets.md`).
- **Mehrwert-Plan:** P2 (Cloud) nach Merge ins UI bringen; P2c
  Traumzeichen-Karten, P3a Albtraum-Umschreiben, P3b Einschlaf-Timer
  ungebaut.
- Dev-Umgebung: `preview_start`/launch.json servt das HAUPTREPO —
  im Worktree immer `bun run dev:web` von Hand; Server auf 8100 mit
  .env-Variablen aus dem Hauptrepo starten (Datei NICHT kopieren,
  Vite-Watch-Falle).

## Standing (unverändert)

Capacitor + StoreKit + RevenueCat vor Launch · Dummy-Film ersetzt Anton
(Paywall.jsx) · Startmenü + Seed-Journal fliegen nur auf Antons Wort ·
Direktanbieter-Schwellen (Kino→BytePlus messen, >$200/Monat→Google
direkt, H3 nie direkt) · DeepSeek immer ohne max_tokens, stream:false ·
nie auf geratene Feldnamen bezahlt rendern.
