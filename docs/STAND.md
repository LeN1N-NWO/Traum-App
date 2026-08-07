# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-07 (20:30)

## Woran wird gearbeitet

Die App ("Dream Rushes") ist seit dem 07.08. eine **React-SPA mit Tabs** statt
drei loser HTML-Seiten — Phase 1 des Umbaus aus
`docs/specs/2026-08-07-app-umbau-design.md` ist abgeschlossen.

**Fünf Tabs**, der Wizard öffnet sich später über der Tab-Leiste:

| Tab | Inhalt |
|---|---|
| Start | Begrüßung, Serie, letzter Traum, Menagerie |
| Tagebuch | Kartenansicht mit Suche, Detail-Modal, Löschen |
| **⊕** | Der sechsstufige Wizard: Traum → Analyse → Personen → Orte → Style → Ergebnis |
| Symbole | 20 Symbole in fünf Kategorien, Vorkommen je Traum |
| Profil | Personen/Tiere/Orte, Lucid-Guide, Credit-Anzeige |

Kernfunktionen für die Traum-App:

1. Traum eingeben → KI-generierte Bildsequenz oder Video (fal.ai). ✅
2. Traumtagebuch mit Medien und verwendeten Referenzfotos. ✅
3. Lucid-Dreaming-Guide (Reality Checks, MILD, WBTB, Journaling). ✅
4. Eigene Referenzfotos mit Kategorien Person/Tier/Ort. ✅
5. Symbolsammlung mit gängiger Lesart. ✅
6. Credits werden gezählt und abgebucht. **Fehlt noch:** echtes Geld dafür.

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter), `server.js`
als schlüsselhaltender Proxy. **Mit Build-Schritt** (ADR-0004 löst ADR-0003 ab
und ersetzt den Vanilla-Teil von ADR-0002). Zustand lebt weiter in
`localStorage`, Schlüssel unverändert `dreamrushes_v1`.

**Sprache:** Die Oberfläche ist **englisch**; Deutsch ist als zweite Sprache
geplant, nicht als Ersatz. Alle sichtbaren Texte liegen in `src/i18n/en.js`
und nirgends sonst — die zweite Sprache ist damit eine neue Datei, kein Umbau.
`AGENTS.md` unterschied früher nicht zwischen Oberfläche (englisch) und
Doku/Commits (deutsch) und war deshalb missverständlich; die Regel ist jetzt
präzisiert.

## Der Wizard (Phase 2, fertig)

Der ⊕-Knopf öffnet einen Vollbild-Flow über der Tab-Leiste:

1. **Traum schreiben oder sprechen.** „Improve with AI" (1 Credit) löst den
   **einzigen LLM-Aufruf pro Traum** aus (`/api/analyze`): geglätteter Text,
   Personen, Orte, fünf Beats und ein Style-Vorschlag, alles als striktes
   JSON. Vorschau mit „Keep my words" oder „Use this version"; die erste
   Niederschrift bleibt immer als `originalText`. Überspringbar — dann greift
   eine lokale Erkennung ohne Kosten.
2. **Was daraus werden soll:** nur speichern (gratis), Fotostrecke (3, 5 oder
   10 Bilder, 2/3/5 Credits) oder Film (9 Credits).
3. **„Who is in it?"** — eine Kachel je erkannter Person. Vorhandene Avatare
   werden automatisch zugeordnet (Tag-Vergleich; „I"/„me" trifft `@me`).
   Sonst: aus der Bibliothek wählen, neu anlegen (Foto und/oder Beschreibung,
   Name vorausgefüllt) oder der KI überlassen.
4. **Dasselbe für Orte.** Ein Traum, der irgendwohin fliegt, hat zwei.
5. **Style und Format**, Style aus der Analyse vorausgewählt, 9:16 Standard.
6. **Ergebnis**, dann ins Tagebuch.

**Nach Schritt 1 fällt kein weiterer LLM-Aufruf an.** `beats.js` leitet die
Bildanzahl lokal aus den fünf Beats ab, `styles.js` sind Konstanten,
`promptBuilder.js` setzt den Master-Prompt zusammen. `/api/generate` nimmt
diesen fertigen Prompt entgegen (weiterhin sanitisiert — ein client-gebauter
Prompt ist nicht vertrauenswürdiger als ein modellgebauter).

Gerendert wird **drei parallel** (`parallel.js`); sequenziell brauchten drei
Bilder über eine Minute.

## Tagebuch-Eintrag: Drei-Punkte-Menü

- **Bearbeiten** — Textfeld, kostenlos, ohne LLM.
- **Korrigieren** (1) · **Neu schreiben** (1) · **Ausarbeiten** (2) — alle
  über eine Route `/api/refine` mit `mode`-Parameter, alle mit Vorschau
  („jetzt" gegen „überarbeitet") und Übernehmen oder Verwerfen.
- **Teilen** — Web Share API, also das native Teilen-Blatt des Geräts. Kein
  Schlüssel, kein OAuth, kein Entwickler-Account je Plattform, und es
  funktioniert in Capacitor. Wo Datei-Teilen fehlt, wird heruntergeladen.
- **Löschen.**

Der zuerst geschriebene Text bleibt über beliebig viele Überarbeitungen als
`originalText` erhalten und ist im Eintrag aufklappbar.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 50 Unit-Tests + 33 Freigabe-Prüfungen + Prompt-Hygiene

⚠️ `bun server.js` allein genügt nicht mehr — ohne `dist/` antwortet alles 404.

## Provider — fal.ai und DeepSeek, live verifiziert

- **Bild:** fal.ai `fal-ai/nano-banana-2` (`FAL_MODEL_IMAGE` überschreibbar).
- **Video:** fal.ai `minimax/h3/image-to-video` (`FAL_MODEL_VIDEO`). Es ist
  **image-to-video**: `generateVideo()` erzeugt erst ein Standbild über den
  Bild-Pfad und animiert das Ergebnis. Kein Text-to-Video-Pfad mehr.
- **DeepSeek (optional):** `craftPromptViaDeepseek()` schickt Traumtext +
  Nano-Banana-6-Elemente-Formel + Metadaten der benannten Referenzfotos an
  `deepseek-v4-flash` und bekommt einen fertigen Bild-Prompt. **DeepSeek sieht
  die Fotos selbst nicht** — die öffentliche API ist textbasiert. Die echten
  Fotos gehen direkt an fal.ai/Nano Banana, das selbst Vision hat. Ohne
  `DEEPSEEK_KEY` greift die lokale Vorlage (`buildFallbackPrompt()`).
- **End-to-end verifiziert (07.08.):** echte Schlüssel eingetragen, Bild- UND
  Film-Modus real durchlaufen, beide `200 OK` mit echten
  `https://v3b.fal.media/...`-URLs. Nach dem React-Umbau erneut geprüft: Traum
  über die neue Oberfläche eingegeben, echtes Bild kam zurück, landete im
  Tagebuch, Wesen und Serie wurden mitgeschrieben.
- Beide Schlüssel liegen lokal in `.env` (git-ignoriert). `.env.example`
  dokumentiert beide.
- Architekturvorgabe, auch für die geplante iPhone-App: Schlüssel dürfen **nie
  in den Client**. Der Client kennt nur `API_BASE` (in `src/lib/api.js`,
  konfigurierbar über `VITE_API_BASE` — nötig, weil ein Capacitor-Bundle nicht
  auf demselben Ursprung läuft).

## Sicherheit — Stand der Schutzziele

- **Vertraulichkeit, zwei unabhängige Schranken.** Die Web-Wurzel ist seit dem
  Vite-Umbau `dist/`, nicht das Repository: `.env`, `.git/`, `docs/`, `src/`
  und `server.js` sind damit **strukturell** außer Reichweite. Zusätzlich gilt
  weiter deny-by-default in `resolveStatic()` — erlaubt sind nur
  `/index.html`, `/assets/*` und `/clips/*`. Abgesichert durch
  `scripts/test-static.mjs` (33 Prüfungen).
- **Integrität:** React escaped Textinhalte von sich aus; es gibt kein
  `innerHTML` mehr im Anwendungscode. Der frühere Weg, über eine bösartige
  API-Antwort dauerhaft Skript ins Tagebuch zu schreiben, ist damit zu.
- **Verfügbarkeit:** `saveState()` fängt vollen `localStorage` ab und meldet es
  sichtbar, statt den Knopf dauerhaft zu sperren. `/api/generate` begrenzt
  Body-Größe und Array-Längen.
- **Prompt-Eingabe:** unsichtbare Zeichen (Zero-Width, Bidi-Overrides,
  Unicode-TAG-Block) werden serverseitig entfernt; `sanitizePromptText()` in
  `server.js` ist die verbindliche Stelle. Auch DeepSeeks Rückgabetext läuft
  dort durch — er wird zum Prompt für einen weiteren bezahlten Aufruf und
  verdient dasselbe Misstrauen wie Nutzereingaben. Abgesichert durch
  `scripts/test-prompt-sanitize.mjs`. Bewusst **keine** Blockliste für
  anweisungsartige Formulierungen: der Traumtext ist der eigene Prompt des
  Nutzers, es gibt keine Rechtegrenze zu schützen.
- **Offen — `/api/generate` hat keine Authentifizierung und kein Rate-Limit.**
  Nur an localhost binden. Öffentlich erreichbar könnte jeder das Guthaben
  verbrauchen. Löst sich erst mit dem Accounts-Backend — verbindlich zu lösen,
  **bevor** die iPhone-App echte Nutzer auf einen gemeinsamen Server lässt.
- **Offen — Credits sind Buchhaltung, keine Zugangskontrolle.** Sie werden
  seit 07.08. tatsächlich abgebucht (erst nach erfolgreichem Aufruf, damit ein
  Fehlschlag nichts kostet), und neue Installationen bekommen einmalig 25
  Stück. Aber der Stand liegt im `localStorage` und ist frei editierbar — wer
  will, verschafft sich unbegrenzt Generierungen. Echte Durchsetzung gehört
  auf den Server, neben die Accounts.
- **Offen — Datenschutz:** hochgeladene Referenzfotos (Gesichter, Tiere,
  Wohnorte) gehen an den Generierungs-Provider. Gesichtsbilder sind
  biometrische Daten (DSGVO Art. 9). Vor einer Veröffentlichung braucht es
  Datenschutzhinweis, Einwilligung und eine Klärung der Speicherdauer bei
  fal.ai. Der UI-Hinweis benennt den Upload ehrlich, ersetzt aber keine
  Datenschutzerklärung.
- **Offen — Missbrauch der Generierung.** Referenzfoto einer realen Person plus
  entsprechender Traumtext ergibt einen Deepfake. Rechtlich
  (Persönlichkeitsrecht) und für den Provider-Account (ToS) haftet der
  Betreiber. Es gibt keine Inhaltsprüfung, keine Einwilligungsbestätigung und
  kein Logging. Braucht vermutlich eine Moderationsstufe und ist damit an das
  Backend-ADR gekoppelt.

## Bekannte Baustellen

- **Screens sind nur manuell geprüft.** Getestet ist die Logikschicht:
  `storage.js`, `symbols.js`, `tags.js`, `streak.js`, `beats.js`,
  `promptBuilder.js`, `parallel.js`, `credits.js` (50 Unit-Tests via
  `bun test`) plus Server-Freigabe und Prompt-Hygiene. Für die React-Screens
  gibt es keine automatisierten Tests — dafür bräuchte es eine DOM-Umgebung.
- **Die riskanteste Stelle ist `promptBuilder.js`.** Referenzklauseln sagen
  „Reference image 2 shows @anton", und diese Nummer muss zur Position im
  Bild-Array passen. Eine Figur ohne Foto darf deshalb keinen Index
  verbrauchen — sonst bekommen Menschen fremde Gesichter. Dafür gibt es
  eigene Tests; wer dort etwas ändert, führt sie aus.
- **Generierte Medien werden nicht lokal gespeichert.** `/api/generate` reicht
  nur die fal.ai-Hosting-URL durch, die App speichert diese URL im
  Tagebuch-Eintrag. Anton möchte sie zusätzlich lokal ablegen. Angedacht:
  Server lädt die Datei nach der Generierung herunter und liefert einen
  lokalen Pfad neben der Original-URL zurück — Speicherort, Dateibenennung und
  Aufräumen sind ungeklärt.
- `mentionsTag()` ist im Wizard nur noch **Vorschlag**, nicht mehr Filter —
  die Zuordnung passiert ausdrücklich in Schritt 3 und 4. Die alte Regel
  greift nur noch, wenn jemand „Improve with AI" überspringt.
- **Credits/Bezahlmodell fehlt.** Braucht eine fälschungssichere Datenhaltung
  (client-seitiges `localStorage` reicht für echtes Geld nicht) — tentativ
  Supabase. Braucht ein eigenes Projekt vom Produktbesitzer und ein eigenes
  ADR, das ADR-0002 in diesem Punkt ersetzt.
- **App-/Play-Store-Vertrieb fehlt.** Für In-App-Käufe muss die Web-App
  gewrappt werden (tentativ Capacitor), plus Apple/Google Developer Accounts,
  die der Produktbesitzer noch nicht hat. Eigenes ADR, eigene Session.
- Der 10-Beat-Traum-Bogen/Shot-Ladder/Identity-Locks-Skill ist weiterhin nicht
  angebunden. `craftPromptViaDeepseek()` nutzt bereits die
  Nano-Banana-6-Elemente-Formel; der Ausbau wäre dort.
- Responsives Verhalten ist am Rechner geprüft, nicht auf einem echten Gerät.
  Vor einer Veröffentlichung am Telefon gegenprüfen.
- **Symbolerkennung nur auf Englisch.** Die Stichwortlisten in
  `src/lib/symbols.js` sind rein englisch (bewusst entschieden) — nur die
  Kategorienamen sind deutsch. Deutsche Traumeinträge liefern keine Symbole.
  Erweiterbar ohne Umbau: deutsche Begriffe in `SYMBOLS` ergänzen. **Wird
  spätestens mit der deutschen Oberfläche fällig** — sonst liefert ein deutsch
  geschriebener Traum gar keine Symbole.
- Symbolerkennung ist Stichwortabgleich, kein Sprachverständnis. „I was *not*
  afraid" zählt als *Fear*. Für mehr bräuchte es ein Sprachmodell.
- Tagebuch wächst unbegrenzt und wird komplett gerendert — keine Pagination.
  Zusammen mit den base64-Referenzfotos ist das localStorage-Kontingent
  (~5 MB) das eigentliche Limit; `saveState()` meldet es wenigstens.

## Nächste Schritte

1. Generierte Bilder/Videos zusätzlich lokal speichern (Antons Wunsch).
2. **Character-Sheets**: eine beschriebene Figur ohne Foto bekommt bisher nur
   eine Textklausel. Die Spec sieht vor, daraus einmalig ein Referenzbild
   erzeugen zu lassen (2 Credits), das am Avatar hängt und wiederverwendbar
   ist. Noch nicht gebaut.
3. Vor jeder öffentlichen/iPhone-Nutzung: Auth + Rate-Limit für
   `/api/generate`.
4. Supabase-Projekt anlegen (Produktbesitzer) → ADR für Accounts/DB/Credits.
5. Darauf aufbauend: Credits-Kauf + Gating der Video-Generierung.
6. Apple-/Google-Developer-Accounts (Produktbesitzer) → ADR für Capacitor.
