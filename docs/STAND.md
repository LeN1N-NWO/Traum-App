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
     kostenpflichtig).
  6. **Symbolsammlung (07.08.)**: `symbole.html` zeigt wiederkehrende Motive aus
     den Traumtexten (20 Symbole in fünf Kategorien) mit einer gängigen Lesart,
     und erlaubt, sie mit Lebensereignissen zu verknüpfen. Erreichbar über die
     Menagerie-Überschrift.
- Stack: Bun + `server.js` als API-Proxy (aktuell Higgsfield, siehe
  Provider-Wechsel unten), kein Login, kein Backend — Zustand lebt in
  `localStorage` (ADR-0002). Seit 07.08. **zwei Seiten** (`index.html`,
  `symbole.html`) mit geteiltem `app.css` und `app.js` (ADR-0003); weiterhin
  kein Build-Schritt.
- **Design überarbeitet (07.08.)**: Leitbild ist die Traumdeutungs-App *Moonly*
  (violette Nacht, warm) — das bestätigt Antons Farbwelt, statt sie zu
  ersetzen. Vom Journaling-Vorbild *pillowtalk* wurde nur die Struktur
  übernommen: vollbreite Tagebucheinträge mit großer Datumstypografie.
  Konkret: wärmere Tokens, Typo-Skala als CSS-Variablen, Neon-Verläufe raus,
  ein Hauptknopf am Formularende statt nummerierter Blöcke, Menagerie
  zurückgenommen, Inhaltsbreite 680px (Handy-Format).

## Provider-Wechsel Higgsfield → fal.ai — Bildgenerierung erledigt

- **Bild:** `server.js` ruft für Bilder jetzt fal.ai (`falGenerateImage()`,
  Modell-Slug `fal-ai/nano-banana-2` via `FAL_MODEL_IMAGE` überschreibbar)
  statt Higgsfield. **Modell-Slug und Response-Shape (`data.images[].url`)
  sind unverifiziert** — analog zu den bisherigen Higgsfield-Slug-Annahmen,
  siehe „Bekannte Baustellen".
- **Video:** läuft weiterhin über Higgsfield/Seedance
  (`higgsfieldGenerateVideo()`) — Nano Banana ist bildbasiert, kein
  Video-Ersatz. Ein LLM-Anwendungsfall über fal.ai ist weiterhin nicht gebaut.
- **Namentliche Referenzbilder (07.08., Anton):** Die App hat bereits ein
  `@tag`-System für Personen/Haustiere/Orte (`state.cast` in `index.html`).
  Neu: `tryBackend()` schickt nur noch die Cast-Einträge mit, deren `@tag`
  wörtlich im Traumtext vorkommt (`mentionsTag()`, Wortgrenzen-Regex,
  case-insensitive) — `@me` bleibt immer dabei. Der Server baut daraus einen
  Nano-Banana-Prompt (`buildNanoBananaPrompt()` in `server.js`), der jedes
  Referenzbild explizit an seinen Namen bindet: „Reference image N shows
  @tag — depict them with this exact likeness whenever 'tag' appears."
  Damit werden — anders als beim alten Higgsfield-Pfad — auch Haustier-/
  Ortsfotos als echte Bild-Referenzen statt nur als Text-Klausel mitgeschickt.
- **Nicht end-to-end verifiziert:** Der reale fal.ai-Aufruf konnte in dieser
  Session nicht getestet werden — die Netzwerk-Policy der Sandbox blockt
  `fal.run` (`403 request rejected: host not permitted`, bestätigt über den
  Proxy-Status, keine Umgehung versucht). Verifiziert wurde stattdessen:
  Syntax (`bun build`), beide bestehenden Testsuiten weiterhin grün
  (`scripts/test-static.mjs`, `scripts/test-prompt-sanitize.mjs`), und der
  Fehlerfall — App fällt bei fehlgeschlagenem `/api/generate` sauber auf den
  Demo-Modus zurück, kein Absturz, geprüft per Playwright-Screenshot.
  **Nächster Schritt für wen immer Netzwerkzugriff auf fal.run hat:** einen
  echten Traum mit benanntem Cast-Mitglied durchlaufen lassen und prüfen, ob
  Modell-Slug, `image_urls`- und `images[].url`-Namen stimmen.
- Der fal.ai-Key liegt lokal in `.env` (git-ignoriert, nicht im Repo).
  `.env.example` dokumentiert `FAL_KEY` (aktiv) und `HF_CREDENTIALS`
  (weiterhin für Video nötig).
- Architekturvorgabe, auch mit Blick auf die geplante iPhone-App: der Key
  darf **nie in den Client** (weder `index.html` noch später ein
  kompiliertes App-Bundle) — beides ist extrahierbar. Client ruft
  ausschließlich den eigenen Server auf, der Server hält den Key gegenüber
  fal.ai. Das gilt identisch für lokales Testen und für Produktion.
- Wer den echten Key braucht: bekommt ihn außerhalb des Repos (Passwort-
  Manager/DM), nicht automatisch durch Repo-Zugriff — siehe AGENTS.md,
  keine Secrets im Repository.

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
  API-Guthaben (Higgsfield, künftig fal.ai) verbrauchen. Löst sich erst mit
  dem Accounts-Backend (siehe unten) — wird verbindlich zu lösen, **bevor**
  die geplante iPhone-App echte Nutzer auf einen gemeinsamen Server lässt.
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
  Wohnorte) gehen an den Generierungs-Provider. Gesichtsbilder sind
  biometrische Daten und damit besonders geschützt (DSGVO Art. 9). Vor einer
  Veröffentlichung braucht es Datenschutzhinweis/Einwilligung und eine
  Klärung, wie lange der jeweilige Provider die Bilder speichert (gilt für
  Higgsfield wie für fal.ai). Der UI-Hinweis benennt den Upload inzwischen
  ehrlich, das ersetzt aber keine Datenschutzerklärung.
- **Offen — Missbrauch der Generierung.** Das größere Risiko in diesem Umfeld
  ist nicht Prompt Injection, sondern was jemand absichtlich erzeugen lässt:
  Referenzfoto einer realen Person plus entsprechender Traumtext ergibt einen
  Deepfake. Rechtlich (Persönlichkeitsrecht) und für den Provider-Account
  (ToS) haftet der Betreiber. Es gibt aktuell keine Inhaltsprüfung, keine
  Bestätigung, dass abgebildete Personen eingewilligt haben, und kein Logging,
  wer was erzeugt hat. Vor einer Veröffentlichung zu entscheiden — braucht
  vermutlich eine Moderationsstufe und ist damit an das Backend-ADR gekoppelt.

## Bekannte Baustellen

- **fal.ai-Aufruf nicht end-to-end verifiziert** (siehe Provider-Wechsel
  oben) — Modell-Slug `fal-ai/nano-banana-2` und die erwartete
  Response-Form (`data.images[].url`) sind Annahmen, nicht gegen den echten
  fal.ai-Katalog geprüft. Diese Sandbox kann `fal.run` nicht erreichen
  (Netzwerk-Policy), also braucht es einen echten Testlauf von jemandem mit
  Zugriff.
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
- `server.js`s `withStyleContext()` (Pet/Place-Referenzfotos fließen für die
  **Video**-Generierung als Text statt als `image_references` in den Prompt)
  ist eine unverifizierte Annahme über die Higgsfield-API-Semantik — für Bild
  ist das seit dem fal.ai-Wechsel obsolet (Nano Banana bekommt Pet/Place-Fotos
  jetzt als echte Bild-Referenzen, siehe `buildNanoBananaPrompt()`).
- Model-Slug `seedance-2/text-to-video` (Video, Higgsfield) ist weiterhin eine
  Annahme aus der SDK-Doku, nicht am eigenen Higgsfield-Katalog verifiziert.
- `server.js` reicht den rohen Traumtext weiterhin unverändert an das Modell
  weiter (jetzt ergänzt um die Pet/Place-Style-Context-Klausel). Für wirklich
  gute, Deakins-gerahmte Frames fehlt noch die Anbindung an den Prompt-Aufbau,
  der andernorts als Skill existiert (10-Beat-Bogen, Shot-Ladder,
  Identity-Locks) — unverändert offen seit der letzten Session.
- `.env` existiert lokal mit `FAL_KEY`, aber **ohne** `HF_CREDENTIALS` —
  Bildgenerierung ist also konfiguriert (bis auf die fehlende
  Live-Verifikation oben), Video-Generierung liefert weiterhin einen klaren
  503, bis ein Higgsfield-Key ergänzt wird.
- **Sprachwiderspruch:** `AGENTS.md` schreibt Deutsch für die UI vor, die
  gesamte App-Oberfläche ist Englisch. Ungelöst — entweder Regel anpassen
  oder UI später übersetzen.
- Kein Lint-Setup und keine Test-Suite für die UI (`npm run lint` existiert
  nicht). Automatisiert getestet sind nur `scripts/test-static.mjs`
  (Datei-Freigabe) und `scripts/test-prompt-sanitize.mjs` (Prompt-Hygiene) —
  beide betreffen `server.js`. Das gesamte Design und alle DOM-Funktionen in
  `index.html` sind ausschließlich manuell geprüft. Bei jetzt ~730 Zeilen
  zunehmend spürbar.
- Responsives Verhalten ist nur rechnerisch verifiziert (Container verengt,
  Überlauf gemessen), nicht auf einem echten Gerät. Vor einer Veröffentlichung
  an einem echten Telefon gegenprüfen — relevant auch für die geplante
  iPhone-App.
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

1. fal.ai-Bildgenerierung end-to-end verifizieren (jemand mit Netzwerkzugriff
   auf `fal.run`): Modell-Slug `fal-ai/nano-banana-2` und Response-Shape
   gegen den echten Katalog prüfen, einen Traum mit benanntem Cast-Mitglied
   durchlaufen lassen. Danach: LLM-Funktion über fal.ai bauen (offen, noch
   niemand zugewiesen).
2. Vor jeder öffentlichen/iPhone-Nutzung: Auth + Rate-Limit für
   `/api/generate`, sonst verbraucht jeder Zugriff das gemeinsame
   fal.ai-Guthaben ohne Begrenzung.
3. Supabase-Projekt anlegen (Produktbesitzer) → ADR für Accounts/DB/Credits-
   Ledger, ersetzt den "kein Backend"-Teil von ADR-0002.
4. Darauf aufbauend: Credits-Kauf + Gating der Video-Generierung hinter
   Guthaben.
5. Apple-/Google-Developer-Accounts anlegen (Produktbesitzer) → ADR für
   Capacitor-Wrapping + In-App-Käufe.
6. Den Prompt-Aufbau (10-Beat-Traum-Bogen, Deakins-Shot-Ladder, Gesichts-Locks)
   in `server.js` einbauen, statt rohen Text durchzureichen.
7. Sprachwiderspruch AGENTS.md vs. UI klären.
