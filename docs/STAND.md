# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-06

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
- Stack unverändert: Bun + eine `index.html` (vanilla JS) + `server.js` als
  Higgsfield-Proxy, kein Login, kein Backend — Zustand lebt in `localStorage`
  (ADR-0002). Das trägt die App bis einschließlich Punkt 4 oben.

## Sicherheit — Stand der Schutzziele

- **Vertraulichkeit:** `server.js` liefert nur noch `/index.html` und `/clips/*`
  aus (deny-by-default in `resolveStatic()`). Vorher war das gesamte
  App-Verzeichnis abrufbar, inklusive `.env` mit dem Higgsfield-Key. Abgesichert
  durch `scripts/test-static.mjs` (28 Prüfungen, `node scripts/test-static.mjs`).
  Wer ein neues öffentliches Asset braucht: `PUBLIC_FILES`/`PUBLIC_DIRS` in
  `server.js` erweitern, sonst 404.
- **Integrität:** Alle Fremddaten (API-URLs, Traumtexte, Titel) werden vor dem
  Einsetzen ins DOM escaped. Ohne das wurde eine bösartige API-Antwort durch
  das Tagebuch dauerhaft gespeichert und bei jedem Seitenaufruf erneut
  ausgeführt.
- **Verfügbarkeit:** `save()` fängt volles localStorage ab (sperrte sonst den
  Summon-Button dauerhaft), `/api/generate` begrenzt Body-Größe und
  Array-Längen.
- **Offen — `/api/generate` hat keine Authentifizierung und kein Rate-Limit.**
  Nur an localhost binden. Öffentlich erreichbar könnte jeder das
  Higgsfield-Guthaben verbrauchen. Löst sich erst mit dem Accounts-Backend
  (siehe unten).
- **Offen — Datenschutz:** hochgeladene Referenzfotos (Gesichter, Haustiere,
  Wohnorte) gehen an Higgsfield. Gesichtsbilder sind biometrische Daten und
  damit besonders geschützt (DSGVO Art. 9). Vor einer Veröffentlichung braucht
  es Datenschutzhinweis/Einwilligung und eine Klärung, wie lange Higgsfield die
  Bilder speichert. Der UI-Hinweis benennt den Upload inzwischen ehrlich, das
  ersetzt aber keine Datenschutzerklärung.

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
- Kein Lint-Setup und keine Test-Suite. Einziger automatisierter Test ist
  `scripts/test-static.mjs` (Datei-Freigabe). Alles andere ist manuell geprüft.
  Bei jetzt ~640 Zeilen `index.html` zunehmend spürbar.
- Tagebuch wächst unbegrenzt und wird komplett gerendert — keine Pagination,
  kein Aufräumen. Zusammen mit den base64-Referenzfotos ist das localStorage-
  Quota (~5 MB) das eigentliche Limit; `save()` meldet es jetzt wenigstens,
  statt still zu scheitern.

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
