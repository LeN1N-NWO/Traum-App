# WORKLOG — Historie, nur anhängend, neue Einträge OBEN

> Alte Einträge werden NIE geändert. Richtigstellungen kommen als neuer Eintrag dazu.
> Pro Eintrag: Datum, Uhrzeit, Name, Branch, Commits, was, warum, was der Nächste wissen muss.

## 2026-08-06 17:10 — Hanni — Branch `session/2026-08-06-hanni`

**Was:** Review der drei Features aus dem Eintrag unten, mit Fokus auf
Korrektheit und die IT-Schutzziele. Sieben Befunde gefunden und behoben:

*Vertraulichkeit*
- **`serveStatic` lieferte das gesamte App-Verzeichnis aus** — inklusive `.env`
  mit dem Higgsfield-Key, `.git/`, `package.json`, `scripts/`, `docs/`. Genau
  das, was der Server laut eigenem Header-Kommentar verhindern sollte. Ersetzt
  durch deny-by-default: nur `/index.html` und `/clips/*` mit bekannter
  Endung, plus Dotfile-Sperre und ROOT-Containment-Prüfung.
  (Klassisches Path-Traversal war *nicht* ausnutzbar — `new URL()` normalisiert
  `../` weg; geprüft und dokumentiert, damit es niemand erneut untersucht.)
- Fehler-Antwort von `/api/generate` echote `e.message` an den Client — jetzt
  generisch, Details nur noch ins Server-Log.
- Der UI-Hinweis behauptete „Nothing leaves your device except the render
  request", obwohl hochgeladene Fotos von Gesichtern/Haustieren/Wohnorten an
  Higgsfield gehen. Text korrigiert.

*Integrität*
- **DOM-XSS über API-URLs**: `renderUrls`/`renderJournal` interpolierten URLs
  ungeprüft in `src="…"`. Durch das neue Tagebuch wurde daraus eine
  *persistente* Lücke (URL landet in localStorage, feuert bei jedem Laden neu).
  Belegt: mit dem alten Code führte `x" onerror="…` Angreifer-JS aus, mit dem
  neuen bleibt es inerter Text. Jetzt escaped.
- Tagebuch zeigte Demo-Material (Antons Showcase-Clips) ohne Kennzeichnung als
  „dein Traum" — jetzt „demo"-Badge in Karte und Detailansicht.
- `references`-Schnappschuss listete auch Cast-Einträge ohne Foto, die gar nicht
  gesendet wurden. Migration in `load()` konnte einen gespeicherten `null`-Wert
  über den Default zurückschreiben (Spread-Reihenfolge).

*Verfügbarkeit*
- **`save()` konnte den Summon-Button dauerhaft sperren**: Referenzfotos liegen
  base64 in localStorage, das ~5-MB-Quota ist erreichbar; der
  `QuotaExceededError` flog ungefangen aus `summon()` und `btn.disabled=false`
  wurde nie erreicht. `save()` fängt jetzt ab und meldet per Toast, plus
  `.catch()` als Auffangnetz in `summon()`.
- `/api/generate` nahm unbegrenzte Bodies und beliebig geformte Arrays an —
  jetzt Größen-/Anzahl-/Typ-Limits (12 MB, 6 Referenzen, 5 styleContext, 2000
  Zeichen Traumtext).
- Video-Thumbnails im Tagebuch luden den vollen Clip pro Karte —
  `preload="metadata"` + `loading="lazy"`.

**Warum:** Die Features waren funktional, aber ungeprüft gegen Missbrauch. Der
`.env`-Befund ist der schwerwiegendste: er hätte den bezahlten API-Key an jeden
im Netzwerk ausgeliefert und damit die Kernbegründung von ADR-0002 („Key bleibt
serverseitig") ausgehebelt.

**Was der Nächste wissen muss:**
- Neuer Regressionstest für die Pfad-Freigabe: `scripts/test-static.mjs`
  (`node scripts/test-static.mjs`, 27 Assertions). Prüft den echten Quelltext
  aus `server.js`, keine Kopie. Beim Hinzufügen öffentlicher Assets muss
  `PUBLIC_FILES`/`PUBLIC_DIRS` in `server.js` bewusst erweitert werden.
- `/api/generate` hat weiterhin **keine Authentifizierung und kein Rate-Limit**
  — nur an localhost binden, bis das Backend/Accounts-ADR steht. Warnung steht
  jetzt im Header von `server.js`.
- Unverändert offen: Live-Verifikation gegen die echte Higgsfield-API
  (kein `bun`, kein Key in dieser Umgebung).

## 2026-08-06 16:30 — Hanni — Branch `session/2026-08-06-hanni`

**Was:** Drei additive Features in `index.html`/`server.js` ergänzt, ohne den
in ADR-0002 festgelegten Stack (Bun + Vanilla HTML/JS + Higgsfield) anzufassen:
1. **Traumtagebuch**: jeder Traum (Text, Titel, Modus, generierte Medien,
   verwendete Referenzfotos) wird jetzt als echter Eintrag in `state.journal`
   gespeichert — bisher überlebte nur die gamifizierte Kreatur-Zusammenfassung.
   Neue Sektion mit Karten-Grid, Detail-Modal (spielt Foto-Story oder Film ab),
   Lösch-Funktion.
2. **Lucid-Dreaming-Guide**: neue `#guide`-Sektion (Reality Checks, MILD, WBTB,
   Journaling-Tipp), verlinkt per Header-Pill.
3. **Cast um Pet/Place erweitert**: die bisherige "add person"-Funktion zeigt
   jetzt ein Kategorie-Popover (Person/Pet/Place). Personen-Fotos gehen wie
   bisher als `image_references` an Higgsfield; Pet/Place-Fotos werden NICHT
   als Bilddaten gesendet (Higgsfield-Semantik dafür unverifiziert), sondern
   ihre Kurzbeschreibung fließt über einen neuen `withStyleContext()`-Helper
   in `server.js` in den Prompt-Text ein.

**Warum:** Der Produktbesitzer (Hanni) wollte vier Kernfunktionen: Traumtagebuch,
KI-Bildgenerierung (existierte bereits), Lucid-Dreaming-Anleitung, eigene
Referenzfotos (Familie/Haustiere/Orte), sowie ein Bezahlmodell für Video-Credits.
Die ersten drei passen additiv in den bestehenden Stack. Die Credits/Bezahlung
sowie die dafür nötige echte Datenhaltung (Supabase o.ä., da Client-`localStorage`
für echtes Geld nicht fälschungssicher ist) und das App-/Play-Store-Wrapping
(Capacitor, für In-App-Käufe) sind bewusst NICHT Teil dieser Session — brauchen
externe Accounts (Supabase-Projekt, Apple/Google Developer), die der
Produktbesitzer erst noch anlegen muss. Eigene ADRs, eigene Session.

**Was der Nächste wissen muss:**
- `withStyleContext()`s Prompt-Anreicherung für Pet/Place ist eine unverifizierte
  Annahme (wie schon die Model-Slugs in `docs/STAND.md`) — gegen den echten
  Higgsfield-Katalog/Docs prüfen, sobald ein `HF_CREDENTIALS`-Key vorhanden ist.
- Die App-Sprache ist durchgängig Englisch (Antons Original-UI), obwohl
  `AGENTS.md` Deutsch vorschreibt — neue Texte bewusst auf Englisch gehalten,
  um keine gemischtsprachige UI zu erzeugen. Dieser Widerspruch zwischen Regel
  und Realität ist ungelöst, separat zu klären (Regel anpassen oder UI übersetzen).
- Manuell verifiziert (kein `bun`/Backend verfügbar in dieser Umgebung): Cast-
  Kategorien, Journal-Flow in beiden Modi inkl. Modal-Replay, Delete-Flows für
  Journal und Cast, Guide-Anker, App bootet und degradiert sauber ohne Backend.
  Kein automatisierter Test existiert (weiterhin offen, siehe unten).
- `scripts/shared-files.json` jetzt mit `index.html`/`server.js` befüllt statt
  Platzhalter — beide Dateien werden von praktisch jedem Feature angefasst.
- Nächste Schritte: Supabase-ADR + Accounts/DB/Credits-Ledger (eigene Session,
  braucht Supabase-Projekt vom Produktbesitzer); Capacitor-ADR + In-App-Käufe
  (eigene Session, braucht Apple/Google Developer Accounts).

## 2026-08-06 13:48 — Anton — Branch `session/2026-08-06-anton`

**Was:** Vorlage fertig eingerichtet (START-HIER.md abgearbeitet: Platzhalter in
`docs/SETUP.md`/`docs/ANLEITUNG.md` ersetzt, README neu geschrieben, ADR-0002 für
den Stack angelegt, `AGENTS.md`-Projektregeln aktualisiert, `START-HIER.md`
gelöscht). Danach die Traum-App (Dream Rushes) aus einem separaten Prototyp-Ordner
ins Repo überführt: `index.html`, `server.js`, `package.json`, `.env.example`,
`clips/` (leer, `.gitkeep`).

**Warum:** Anton hatte die App bereits in einer anderen Umgebung gebaut und
gegen die echte Higgsfield-API getestet (funktioniert: Nano-Banana-Bildsequenzen
mit Gesichts-Konsistenz per Referenzbild, Seedance-Video, beides nativ 9:16).
Ziel war, dieses Repo als dauerhaftes, versioniertes Zuhause für die App zu
nutzen statt in einem unversionierten `~/Documents`-Ordner weiterzuarbeiten.

**Was der Nächste wissen muss:**
- Kein Key im Repo — `.env` muss lokal selbst angelegt werden (siehe
  `.env.example` + `docs/SETUP.md`).
- Die Bildgenerierung, die als Beweis diente, lief über eine separate
  MCP-Verbindung außerhalb dieses Repos — im Repo selbst ist Live-Generierung
  noch nicht verifiziert, nur der Code-Pfad dafür steht (`server.js` →
  `/api/generate`).
- Details, offene Punkte, nächste Schritte: siehe `docs/STAND.md`.
