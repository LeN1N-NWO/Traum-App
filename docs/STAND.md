# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-07

## Woran wird gearbeitet

- Die App ("Dream Rushes") deckt jetzt vier von fünf Kernfunktionen ab, die der
  Produktbesitzer (Hanni) für die Traum-App vorgesehen hat:
  1. Traum per Text/Sprache eingeben → KI-generierte Bildsequenz oder Video (fal.ai).
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
- Stack: Bun + `server.js` als API-Proxy (fal.ai + optional DeepSeek, siehe
  Provider-Wechsel unten — kein Higgsfield mehr, auch die Dependency ist raus),
  kein Login, kein Backend — Zustand lebt in `localStorage` (ADR-0002). Seit
  07.08. **zwei Seiten** (`index.html`, `symbole.html`) mit geteiltem
  `app.css` und `app.js` (ADR-0003); weiterhin kein Build-Schritt.
- **Design überarbeitet (07.08.)**: Leitbild ist die Traumdeutungs-App *Moonly*
  (violette Nacht, warm) — das bestätigt Antons Farbwelt, statt sie zu
  ersetzen. Vom Journaling-Vorbild *pillowtalk* wurde nur die Struktur
  übernommen: vollbreite Tagebucheinträge mit großer Datumstypografie.
  Konkret: wärmere Tokens, Typo-Skala als CSS-Variablen, Neon-Verläufe raus,
  ein Hauptknopf am Formularende statt nummerierter Blöcke, Menagerie
  zurückgenommen, Inhaltsbreite 680px (Handy-Format).

## Provider-Wechsel Higgsfield → fal.ai — abgeschlossen (Bild UND Video)

Higgsfield ist komplett raus — Code (`higgsfieldGenerateVideo()`,
`withStyleContext()`) und Dependency (`@higgsfield/client` aus `package.json`)
sind entfernt. Kompletter Ersatz, in zwei Schritten:

- **Bild:** `server.js` → fal.ai, Modell-Slug `fal-ai/nano-banana-2`
  (`FAL_MODEL_IMAGE` überschreibbar). **Modell-Slug und Response-Shape
  (`data.images[].url`) sind unverifiziert**, siehe „Bekannte Baustellen".
- **Video (08.08., Anton):** `server.js` → fal.ai, Modell-Slug
  `minimax/h3/image-to-video` (`FAL_MODEL_VIDEO` überschreibbar) — von Anton
  direkt vorgegeben, nicht geraten, aber ebenfalls unverifiziert (fal.ai-IDs
  sind sonst meist unter `fal-ai/...` genamespaced, ggf. beim Testen
  anpassen). Das Modell ist **image-to-video**, kein Text-to-Video mehr:
  `generateVideo()` erzeugt daher erst ein Standbild über den Bild-Pfad
  (Prompt + Referenzfotos) und animiert erst das Ergebnis. Der alte
  Seedance-Text-to-Video-Pfad existiert nicht mehr.
- **DeepSeek als Prompt-Schnittstelle (08.08., Anton):** neuer, optionaler
  Key `DEEPSEEK_KEY`. `craftPromptViaDeepseek()` schickt Traumtext + die
  Skill-Formel (Google's Nano-Banana-6-Elemente-Struktur, aus dem
  `nanobanana`-Skill übernommen) + Name/Kategorie/Kurzbeschreibung jedes
  benannten Referenzfotos an `deepseek-v4-flash` (`DEEPSEEK_MODEL`
  überschreibbar) und bekommt einen fertigen Bild-Prompt zurück, der jedes
  `@tag` explizit an sein Referenzfoto bindet. **DeepSeek sieht die Fotos
  selbst nicht** — die öffentliche API von DeepSeek-V4-Flash ist textbasiert,
  kein Bild-Input (verifiziert per Web-Recherche, offizielle Doku +
  DeepInfra/OpenRouter/AIML API, 07.08.). Die echten Fotos gehen weiterhin
  direkt an fal.ai/Nano Banana, das selbst Vision hat. Ohne `DEEPSEEK_KEY`
  oder bei einem fehlgeschlagenen Aufruf fällt `generateImages()` automatisch
  auf die lokale Prompt-Vorlage zurück (`buildFallbackPrompt()`, keine
  API — Bildgenerierung bleibt also auch ohne DeepSeek funktionsfähig).
- **Namentliche Referenzbilder:** Die App hat bereits ein `@tag`-System für
  Personen/Haustiere/Orte (`state.cast` in `index.html`). `tryBackend()`
  schickt nur noch die Cast-Einträge mit, deren `@tag` wörtlich im
  Traumtext vorkommt (`mentionsTag()`, Wortgrenzen-Regex, case-insensitive)
  — `@me` bleibt immer dabei. Anders als beim alten Higgsfield-Bildpfad gehen
  jetzt auch Haustier-/Ortsfotos als echte Bild-Referenzen mit, nicht nur als
  Text-Klausel.
- **Nicht end-to-end verifiziert:** Kein echter fal.ai- oder DeepSeek-Aufruf
  konnte in dieser Sandbox getestet werden — die Netzwerk-Policy blockt
  sowohl `fal.run` als auch vermutlich `api.deepseek.com` (`403 request
  rejected: host not permitted`, bestätigt über den Proxy-Status für fal.run,
  keine Umgehung versucht). Verifiziert wurde stattdessen: Syntax
  (`bun build`), beide bestehenden Testsuiten weiterhin grün
  (`scripts/test-static.mjs`, `scripts/test-prompt-sanitize.mjs`, letztere
  jetzt gegen `buildFallbackPrompt()`/`sanitizeTag()` statt der entfernten
  `withStyleContext()`), und der Fehlerfall für Bild UND Film — App fällt bei
  fehlgeschlagenem `/api/generate` sauber auf den Demo-Modus zurück, kein
  Absturz, geprüft per Playwright-Screenshot und curl.
  **Nächster Schritt für wen immer Netzwerkzugriff hat:** einen echten Traum
  mit benanntem Cast-Mitglied durchlaufen lassen (Bild- UND Film-Modus) und
  prüfen, ob die drei Modell-/Parameter-Annahmen stimmen (`FAL_MODEL_IMAGE`,
  `FAL_MODEL_VIDEO`, DeepSeek-Response-Shape `choices[0].message.content`).
- Beide Keys liegen lokal in `.env` (git-ignoriert, nicht im Repo) —
  `FAL_KEY` gesetzt, `DEEPSEEK_KEY` (optional) nicht. `.env.example`
  dokumentiert beide.
- Architekturvorgabe, auch mit Blick auf die geplante iPhone-App: Keys dürfen
  **nie in den Client** (weder `index.html` noch später ein kompiliertes
  App-Bundle) — beides ist extrahierbar. Client ruft ausschließlich den
  eigenen Server auf, der Server hält beide Keys. Das gilt identisch für
  lokales Testen und für Produktion.
- Wer echte Keys braucht: bekommt sie außerhalb des Repos (Passwort-
  Manager/DM), nicht automatisch durch Repo-Zugriff — siehe AGENTS.md,
  keine Secrets im Repository.

## Sicherheit — Stand der Schutzziele

- **Vertraulichkeit:** `server.js` liefert nur `/index.html`, `/symbole.html`,
  `/app.css`, `/app.js` und `/clips/*` aus (deny-by-default in
  `resolveStatic()`). Vorher war das gesamte App-Verzeichnis abrufbar,
  inklusive `.env` mit den API-Keys. Abgesichert durch
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
  API-Guthaben (fal.ai, DeepSeek) verbrauchen. Löst sich erst mit
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
  Klärung, wie lange fal.ai die Bilder speichert. Der UI-Hinweis benennt den
  Upload inzwischen ehrlich, das ersetzt aber keine Datenschutzerklärung.
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
- Drei Modell-/Parameter-Annahmen unverifiziert (siehe Provider-Wechsel oben):
  `FAL_MODEL_IMAGE`, `FAL_MODEL_VIDEO` (image-to-video-Parameter `image_url`/
  `prompt` geraten, nicht dokumentiert nachgeschlagen), und die
  DeepSeek-Response-Shape (`choices[0].message.content`, OpenAI-kompatibel
  laut offizieller Doku, aber nicht live getestet).
- Für wirklich gute, Deakins-gerahmte Frames nutzt `craftPromptViaDeepseek()`
  bereits die Nano-Banana-6-Elemente-Formel — der separat existierende
  10-Beat-Traum-Bogen/Shot-Ladder/Identity-Locks-Skill ist aber weiterhin
  nicht angebunden, wäre ein Ausbau von system/user-Prompt in
  `craftPromptViaDeepseek()`.
- `.env` existiert lokal mit `FAL_KEY`, ohne `DEEPSEEK_KEY` (optional) —
  Bildgenerierung ist damit konfiguriert (bis auf die fehlende
  Live-Verifikation oben), nutzt aber die lokale Fallback-Prompt-Vorlage
  statt DeepSeek. Video braucht denselben `FAL_KEY`, kein separater Key nötig.
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

1. fal.ai + DeepSeek end-to-end verifizieren (jemand mit Netzwerkzugriff):
   Bild- UND Film-Modus mit einem benannten Cast-Mitglied durchlaufen lassen,
   `FAL_MODEL_IMAGE`, `FAL_MODEL_VIDEO` und die DeepSeek-Response-Shape gegen
   die echten Kataloge/Docs prüfen.
2. Vor jeder öffentlichen/iPhone-Nutzung: Auth + Rate-Limit für
   `/api/generate`, sonst verbraucht jeder Zugriff das gemeinsame
   fal.ai-/DeepSeek-Guthaben ohne Begrenzung.
3. Supabase-Projekt anlegen (Produktbesitzer) → ADR für Accounts/DB/Credits-
   Ledger, ersetzt den "kein Backend"-Teil von ADR-0002.
4. Darauf aufbauend: Credits-Kauf + Gating der Video-Generierung hinter
   Guthaben.
5. Apple-/Google-Developer-Accounts anlegen (Produktbesitzer) → ADR für
   Capacitor-Wrapping + In-App-Käufe.
6. Den Prompt-Aufbau (10-Beat-Traum-Bogen, Deakins-Shot-Ladder, Gesichts-Locks)
   in `server.js` einbauen, statt rohen Text durchzureichen.
7. Sprachwiderspruch AGENTS.md vs. UI klären.
