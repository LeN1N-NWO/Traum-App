# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-07

## Woran wird gearbeitet

- Die App ("Dream Rushes") deckt jetzt vier von fünf Kernfunktionen ab, die der
  Produktbesitzer (Hanni) für die Traum-App vorgesehen hat:
  1. Traum per Text/Sprache eingeben → KI-generierte Bildsequenz oder Video (Higgsfield).
  2. Echtes Traumtagebuch (Text + Medien + verwendete Referenzfotos pro Eintrag,
     durchsuchbar/durchblätterbar über eine Karten-Ansicht mit Detail-Modal).
  3. Lucid-Dreaming-Guide (Reality Checks, MILD, WBTB, Journaling-Tipp) als eigene Sektion.
  4. Eigene Referenzfotos — jetzt mit Kategorien Person/Pet/Place statt nur Gesichter.
  5. **Fehlt noch:** Bezahlmodell (Credits gegen Euro/Dollar, Video-Generierung
     kostenpflichtig). Bewusst nicht Teil dieser Session — siehe unten.
  6. **Symbolsammlung (07.08.)**: `symbole.html` zeigt wiederkehrende Motive aus
     den Traumtexten (20 Symbole in fünf Kategorien) mit einer gängigen Lesart,
     und erlaubt, sie mit Lebensereignissen zu verknüpfen. Erreichbar über die
     Menagerie-Überschrift.
- Stack: Bun + `server.js` als Higgsfield-Proxy, kein Login, kein Backend —
  Zustand lebt in `localStorage` (ADR-0002). Seit 07.08. **zwei Seiten**
  (`index.html`, `symbole.html`) mit geteiltem `app.css` und `app.js`
  (ADR-0003); weiterhin kein Build-Schritt.
- **Design überarbeitet (07.08.)**: Leitbild ist die Traumdeutungs-App *Moonly*
  (violette Nacht, warm) — das bestätigt Antons Farbwelt, statt sie zu
  ersetzen. Vom Journaling-Vorbild *pillowtalk* wurde nur die Struktur
  übernommen: vollbreite Tagebucheinträge mit großer Datumstypografie.
  Konkret: wärmere Tokens, Typo-Skala als CSS-Variablen, Neon-Verläufe raus,
  ein Hauptknopf am Formularende statt nummerierter Blöcke, Menagerie
  zurückgenommen, Inhaltsbreite 680px (Handy-Format).

## Sicherheit — Stand der Schutzziele

- **Vertraulichkeit:** `server.js` liefert nur `/index.html`, `/symbole.html`,
  `/app.css`, `/app.js` und `/clips/*` aus (deny-by-default in
  `resolveStatic()`). Vorher war das gesamte App-Verzeichnis abrufbar,
  inklusive `.env` mit dem Higgsfield-Key. Abgesichert durch
  `scripts/test-static.mjs` (31 Prüfungen). Wer ein neues öffentliches Asset
  braucht: `PUBLIC_FILES`/`PUBLIC_DIRS` in `server.js` erweitern, sonst 404.
- **Integrität:** Alle Fremddaten (API-URLs, Traumtexte, Titel) werden vor dem
  Einsetzen ins DOM escaped. Ohne das wurde eine bösartige API-Antwort durch
  das Tagebuch dauerhaft gespeichert und bei jedem Seitenaufruf erneut
  ausgeführt.
- **Verfügbarkeit:** `save()` fängt volles localStorage ab (sperrte sonst den
  Summon-Button dauerhaft), `/api/generate` begrenzt Body-Größe und
  Array-Längen.
- **Statische Vorschau:** `python3 -m http.server` (in `README.md` und
  `.claude/launch.json`) hat **keine** Freigabeliste und liefert alles im Ordner
  aus — die Absicherung in `server.js` greift auf diesem Weg nicht. Beide
  Stellen binden jetzt an `127.0.0.1`; die Vorschau darf nicht laufen, sobald
  `.env` existiert. Ungetestet automatisierbar — `scripts/test-static.mjs` deckt
  nur `server.js` ab.
- **Offen — `/api/generate` hat keine Authentifizierung und kein Rate-Limit.**
  Nur an localhost binden. Öffentlich erreichbar könnte jeder das
  Higgsfield-Guthaben verbrauchen. Löst sich erst mit dem Accounts-Backend
  (siehe unten).
- **Prompt-Eingabe:** unsichtbare Zeichen (Zero-Width, Bidi-Overrides, Unicode-
  TAG-Block) werden aus dem Traumtext entfernt — relevant für *eingefügten*
  Text, der versteckte Anweisungen mitbringen kann. Freitext-Fragmente
  (Haustier/Ort) werden einzeilig gemacht und in eine feste Klausel gesperrt,
  können die Prompt-Struktur also nicht aufbrechen. `sanitizePromptText()` in
  `server.js` ist die verbindliche Stelle, `index.html` putzt beim Einfügen
  zusätzlich und meldet dem Nutzer, wie viele Zeichen entfernt wurden.
  Abgesichert durch `node scripts/test-prompt-sanitize.mjs` (20 Prüfungen).
  Bewusst **keine** Blockliste für anweisungsartige Formulierungen: der
  Traumtext ist der eigene Prompt des Nutzers, es gibt keine Rechtegrenze zu
  schützen, und eine Blockliste wäre umgehbar und fehlalarmanfällig.
- **Offen — Datenschutz:** hochgeladene Referenzfotos (Gesichter, Haustiere,
  Wohnorte) gehen an Higgsfield. Gesichtsbilder sind biometrische Daten und
  damit besonders geschützt (DSGVO Art. 9). Vor einer Veröffentlichung braucht
  es Datenschutzhinweis/Einwilligung und eine Klärung, wie lange Higgsfield die
  Bilder speichert. Der UI-Hinweis benennt den Upload inzwischen ehrlich, das
  ersetzt aber keine Datenschutzerklärung.
- **Offen — Missbrauch der Generierung.** Das größere Risiko in diesem Umfeld
  ist nicht Prompt Injection, sondern was jemand absichtlich erzeugen lässt:
  Referenzfoto einer realen Person plus entsprechender Traumtext ergibt einen
  Deepfake. Rechtlich (Persönlichkeitsrecht) und für den Higgsfield-Account
  (ToS) haftet der Betreiber. Es gibt aktuell keine Inhaltsprüfung, keine
  Bestätigung, dass abgebildete Personen eingewilligt haben, und kein Logging,
  wer was erzeugt hat. Vor einer Veröffentlichung zu entscheiden — braucht
  vermutlich eine Moderationsstufe und ist damit an das Backend-ADR gekoppelt.

## Bekannte Baustellen

- **Credits/Bezahlmodell fehlt komplett.** Braucht laut Diskussion mit dem
  Produktbesitzer eine echte, fälschungssichere Datenhaltung (client-seitiges
  `localStorage` reicht für echtes Geld nicht) — tentativ Supabase (Accounts,
  DB, Storage). Braucht ein eigenes Supabase-Projekt vom Produktbesitzer und
  ein eigenes ADR, das ADR-0002 in diesem einen Punkt ersetzt (von ADR-0002
  selbst als Trigger für eine Ablösung vorgesehen).
- **App-/Play-Store-Vertrieb fehlt.** Für In-App-Käufe (Credits) muss die
  Web-App später gewrappt werden (tentativ Capacitor), plus Apple/Google
  Developer Accounts, die der Produktbesitzer noch nicht hat. Eigenes ADR,
  eigene Session, erst sinnvoll sobald das Backend oben steht.
- `server.js`s `withStyleContext()` (Pet/Place-Referenzfotos fließen als Text
  statt als `image_references` in den Prompt) ist eine unverifizierte Annahme
  über die Higgsfield-API-Semantik — noch nicht gegen den echten Katalog/Docs
  geprüft, gleiche Art Lücke wie die Model-Slugs unten.
- Model-Slugs in `server.js` (`nano-banana-2/text-to-image`,
  `seedance-2/text-to-video`) sind weiterhin Annahmen aus der SDK-Doku, nicht
  am eigenen Higgsfield-Katalog verifiziert.
- `server.js` reicht den rohen Traumtext weiterhin unverändert an das Modell
  weiter (jetzt ergänzt um die Pet/Place-Style-Context-Klausel). Für wirklich
  gute, Deakins-gerahmte Frames fehlt noch die Anbindung an den Prompt-Aufbau,
  der andernorts als Skill existiert (10-Beat-Bogen, Shot-Ladder,
  Identity-Locks) — unverändert offen seit der letzten Session.
- `.env` fehlt lokal noch — ohne sie liefert `/api/generate` einen klaren 503
  und die App fällt auf Beispiel-Inhalte zurück. Live-Generierung im Repo
  selbst weiterhin nicht verifiziert (in dieser Session: `bun` war in der
  Arbeitsumgebung nicht verfügbar, verifiziert wurde daher nur der
  no-backend-Demopfad über `python3 -m http.server`, keine Regressionen).
- **Sprachwiderspruch:** `AGENTS.md` schreibt Deutsch für die UI vor, die
  gesamte App-Oberfläche (Antons Original plus die neuen Sektionen dieser
  Session) ist Englisch. Ungelöst — entweder Regel anpassen oder UI später
  übersetzen.
- Kein Lint-Setup und keine Test-Suite für die UI. Automatisiert getestet sind
  nur `scripts/test-static.mjs` (Datei-Freigabe) und
  `scripts/test-prompt-sanitize.mjs` (Prompt-Hygiene) — beide betreffen
  `server.js`. Das gesamte Design und alle DOM-Funktionen in `index.html` sind
  ausschließlich manuell geprüft. Bei jetzt ~730 Zeilen zunehmend spürbar.
- Responsives Verhalten ist nur rechnerisch verifiziert (Container verengt,
  Überlauf gemessen), nicht auf einem echten Gerät. Die Fenster-Größenänderung
  im Browser-Werkzeug hat in dieser Umgebung nicht gegriffen. Vor einer
  Veröffentlichung an einem echten Telefon gegenprüfen.
- **Barrierefreiheit teilweise offen.** Tagebuchkarten sind seit 07.08. per
  Tastatur bedienbar (Fokus, Enter/Space, sichtbarer Rahmen), die Cast-Kacheln
  aber nicht: deren Löschknopf ist weiterhin ein `<div>` ohne Fokus. Kontraste
  sind für Text geprüft und bestehen WCAG AA (≥4,79:1); ungeprüft sind
  Fokus-Indikatoren auf allen Flächen und die Bedienbarkeit mit Screenreader.
  Maßgeblicher Härtefall für künftige Farbänderungen: `--faint` auf
  `rgba(11,7,24,.55)` über `#2a1d5e`.
- Tagebuch wächst unbegrenzt und wird komplett gerendert — keine Pagination,
  kein Aufräumen. Zusammen mit den base64-Referenzfotos ist das localStorage-
  Quota (~5 MB) das eigentliche Limit; `save()` meldet es jetzt wenigstens,
  statt still zu scheitern.

- **Symbolerkennung nur auf Englisch.** Die Stichwortlisten in `app.js` sind
  rein englisch (bewusst entschieden). Deutsche Traumeinträge liefern keine
  Symbole. Erweiterbar ohne Umbau: deutsche Begriffe in `SYMBOLS` ergänzen.
- Symbolerkennung ist Stichwortabgleich, kein Sprachverständnis. „I was *not*
  afraid" zählt als *Fear*; Umschreibungen ohne die Stichwörter werden nicht
  erkannt. Für mehr bräuchte es ein Sprachmodell — also das Backend.

## Nächste Schritte

1. Higgsfield-Key besorgen, `.env` lokal anlegen, echte Generierung end-to-end
   verifizieren (Model-Slugs UND die neue `withStyleContext()`-Annahme für
   Pet/Place-Referenzen gegen den echten Katalog prüfen).
2. Supabase-Projekt anlegen (Produktbesitzer) → ADR für Accounts/DB/Credits-
   Ledger, ersetzt den "kein Backend"-Teil von ADR-0002.
3. Darauf aufbauend: Credits-Kauf + Gating der Video-Generierung hinter
   Guthaben.
4. Apple-/Google-Developer-Accounts anlegen (Produktbesitzer) → ADR für
   Capacitor-Wrapping + In-App-Käufe.
5. Den Prompt-Aufbau (10-Beat-Traum-Bogen, Deakins-Shot-Ladder, Gesichts-Locks)
   in `server.js` einbauen, statt rohen Text durchzureichen.
6. Sprachwiderspruch AGENTS.md vs. UI klären.
