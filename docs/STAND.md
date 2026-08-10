# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-10 (12:40) — Branch `session/2026-08-10-anton-seed`

## Woran wird gearbeitet

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI macht
daraus eine Bildstrecke und optional einen kurzen Film. **Vier Tabs**, der
Wizard öffnet sich über der Tab-Leiste; vor allem anderen entscheidet gerade
ein **Startmenü**, ob man das Onboarding sieht oder direkt in die App springt
(siehe „⚠ Übergangslösung" unten — wichtigster Punkt dieser Datei).

| Tab | Inhalt |
|---|---|
| Home | Begrüßung nach Tageszeit, **Faultier-Film als Posterkarte**, letzter Traum, Menagerie |
| Journal | Träume als Kartenstapel **oder** Liste, Kalender, Detail mit Film+Bildern. Zwei **Seed-Träume** in jedem frischen Install (siehe unten) |
| **⊕** | Der Wizard: Traum → Ausgabe → Personen → Orte → Style → Ergebnis |
| Sleep | **Alles gratis:** Einschlaf-Checkliste, Sound-Mixer, Klartraum-Leitfaden, Symbole |
| Profil | Porträt, Credits-Pille (öffnet Paywall), **Zahnrad → Einstellungen**, Umfrage-Karte falls offen |

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter), `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini Live + Gemini TTS). Zustand
in `localStorage`, Schlüssel `dreamrushes_v1`.

**Sprache:** Oberfläche in **sieben Sprachen** (en, de, es, fr, zh, hi, ar),
alle Texte in `src/i18n/<id>.js` und nirgends sonst; `en.js` ist die Vorlage,
`scripts/check-i18n-shape.mjs` erzwingt gleiche Form. Doku und Commits deutsch.

## ⚠ Das Startmenü bleibt — nicht eigenmächtig entfernen

`src/App.jsx`s `Gate()` zeigt bei **jedem** App-Start ein `StartMenu`
(„Show onboarding" / „Skip to app") statt auf `state.onboarded` zu prüfen.

**Das ist eine stehende Entscheidung (Anton, 10.08.2026), keine Baustelle.**
Es bleibt, bis er ausdrücklich etwas anderes sagt. Es sieht wie ein
Versehen aus — einen wiederkehrenden Nutzer bei jedem Start zu fragen
„Onboarding oder App?" wäre für eine ausgelieferte App offensichtlich
falsch —, und genau deshalb stand es zweimal ganz oben auf der
Aufräumliste. Es ist keins: Am Onboarding wird noch gearbeitet, und hinter
`state.onboarded` versteckt wäre es ein Einmal-Erlebnis, unerreichbar,
sobald man es einmal gesehen hat.

Wenn das Wort kommt: `src/screens/Onboarding/StartMenu.jsx` löschen und
`Gate()` wieder auf `state.language`/`state.onboarded` verzweigen lassen —
beide werden auf dem normalen Weg längst gesetzt.

## Die Persona — eine Stimme, überall dieselbe

Der Assistent ist „der coole Nachtportier": ruhig, trocken-warm, spürbar
unaufgeregt. Ein einziger `PERSONA`-Block in `server.js` speist **beide**
Briefings, weil Trauminterview und Willkommensumfrage für den Nutzer eine
Person sind.

**Zwei Regeln, die beim Bauen Blut gekostet haben:**

1. **Keine Beispielsätze im Prompt.** Zweimal hat das die Sprache verbogen
   (ein „Guten Morgen" als Beispiel ließ den Assistenten überall Deutsch
   reden). Beschrieben wird die *Bewegung* — „bemerke etwas Wahres über den
   Moment, dann frag" —, nie der Wortlaut.
2. **Verbote allein erzeugen Neutralität.** Eine Fassung aus lauter „erwähne
   nie…" lieferte perfekt farblose Begrüßungen. Charakter entsteht nur durch
   positive, konkrete Anweisung.

Der Charakter fällt als Erstes weg, wenn ein Traum bedrückend wird — dann nur
noch leise und schlicht.

## Der Sprachassistent (Gemini Live)

Zwei Modi über denselben Relay in `server.js` (`/api/voice`, WebSocket):
**`dream`** (Trauminterview, `VOICE_TOOLS`) und **`onboarding`**
(Willkommens-Umfrage, `ONBOARDING_TOOLS`, jede Frage überspringbar).

**Die Stimme wird genau einmal gewählt** — beim allerersten Sprachgespräch,
danach nie wieder ungefragt. Geändert wird sie unter **Profil → Zahnrad →
Einstellungen** (`src/screens/Profile/Settings.jsx`, als Liste gebaut, weil
weitere Einstellungen kommen). Sechs Stimmen in `src/lib/voices.js`, gespiegelt
als Allowlist `VOICE_NAMES` in `server.js`.

**Vorhören:** Die Gemini-API bietet **keine** fertigen Hörproben (AI Studio
schon, die API nicht — geprüft 09.08.). `/api/voice-sample` erzeugt sie selbst
per **Gemini TTS**, das denselben Stimmkatalog nutzt wie die Live-API — was man
vorhört, ist exakt die Stimme, die dann spricht. Je (Stimme, Sprache) einmal
erzeugt, als WAV unter `media/` gecacht (frisch 4,7 s, gecacht <1 ms). TTS
liefert **kopfloses PCM**; der RIFF-Header wird selbst geschrieben, die
Abtastrate aus dem `mimeType` gelesen, nicht angenommen.

**Zwei nicht offensichtliche technische Punkte:**

- Die Verbindung geht **direkt an den API-Port** (`__API_PORT__` aus
  `vite.config.js`), nicht über den Vite-Dev-Proxy — der reicht WebSockets
  unter Bun nicht durch (`node:http` meldet die 101-Antwort als gewöhnliche
  Antwort statt als `upgrade`-Ereignis).
- Gemini antwortet **ausschließlich in Binärframes**, auch das
  `setupComplete`-Signal. Wer Steuer-Logik auf Frame-Inhalt ergänzt: mit
  `TextDecoder` dekodieren, nicht auf `typeof data === "string"` prüfen.

## Journal — Struktur

Ein Eintrag kann **Film und Bildstrecke gleichzeitig** besitzen — zwei
unabhängige Felder, `entry.media` (Bilder) und `entry.film` (Clip), nie eines
das andere überschreibend. `src/lib/entryMedia.js` (`filmOf`, `imagesOf`,
`allMediaOf`) ist die einzige Stelle, die beide liest. **Wer neue
Medien-Lesestellen baut: über `entryMedia.js`, nie `entry.media` direkt.**

Reihenfolge auf der Detailseite: warmer Haupt-Knopf ganz oben, darunter die
Aktionsleiste (Umschreiben/Bearbeiten/Teilen — sie **bricht um** statt seitlich
zu scrollen, sonst ragt „Teilen" bei langen Übersetzungen aus dem Bild),
darunter Film, darunter Text und Bilderstrecke.

**„Umschreiben"** öffnet ein Blatt mit drei Möglichkeiten (korrigieren /
umschreiben / ausarbeiten), Hintergrund unscharf. Die Modi liegen serverseitig
in `REFINE_MODES` mit einem gemeinsamen `REFINE_SHARED_RULES`-Block: gleiche
Sprache, gleiche Person, nichts erfinden, nicht umsortieren, nicht deuten.
**Remix gibt es nicht mehr** — damit fehlt auch der Weg „Text ändern und daraus
neu erzeugen"; falls er zurücksoll, wäre der Ort ein Knopf im
Vorschlags-Bildschirm.

## Grid-Bilder — ein Aufruf, drei Bilder

Für die 3-Bilder-Stufe **ohne Poster** erzeugt `buildGridPrompt()` ein
einzelnes 16:9-Bild mit drei Panels, `splitGrid.js` schneidet es per `<canvas>`.
Der Letterbox-Rahmen, den das Modell trotz Verbot malt, wird am **hellsten**
Pixel jeder Randzeile erkannt (nicht am Durchschnitt: gemalte Balken max.
5/255, eine dunkle Wasserszene trägt Glanzpunkte ab 19).

**Seit 10.08. ist das die „Schnellvorschau"** — eine sichtbare Kachel in
Schritt 5, **1 Credit**, mit dem Satz daneben, was man dafür aufgibt.
`useGrid` heißt jetzt schlicht `isPreview`; die Vorschau hat nie ein Poster
und blendet die Format-Wahl aus (der Grid ist bauartbedingt 16:9).

**Warum das eine Korrektur war, keine Erweiterung:** Vorher lautete die
Bedingung „3 Szenen UND kein Poster" — klingt gleichwertig, war es nicht.
Die Analyse füllt das Titelfeld automatisch, also war das Poster fast immer
an und der Grid lief fast nie. Wer ihn doch auslöste (durch Leeren eines
Textfelds), zahlte trotzdem 3 Credits für **ein** Rendering. Gemessen:
Panels **459×768** gegen **768×1376** bei einem normalen Bild — ein Drittel
der Pixel. Vollen Preis für ein Drittel der Auflösung zu nehmen war der
Teil, der Vertrauen gekostet hätte.

Der **Gratis-Traum rendert weiter in voller Größe** — die Ersparnis fiele
sonst ausgerechnet auf den einen Traum, der gut sein muss. Begründung in
`credits.js`.

## Onboarding

`src/screens/Onboarding/`: **Faultier-Film** (`assets/intro-faultier.mp4`,
vollflächig hinter einem Scrim) → drei Folien → Sprach-Umfrage → optionaler
Selfie-Schritt. Das Gate spricht in der **ersten Person** („Erzähl mir, wie du
träumst"), weil die App eine Persona hat.

**Das Willkommen ist ein Versprechen, keine Währung:** „Dein erster Traum geht
auf uns" statt „3 Credits gratis". Das stimmt genau — drei Credits kaufen
exakt einen kleinsten Traum —, und `credits.test.js` prüft diese **Gleichheit**,
weil die Zahlen in zwei Dateien und das Versprechen in sieben anderen stehen.
Zu wenig hieße: Bezahlschranke beim ersten Versuch. Zu viel hieße: Restcredits,
die allein nichts kaufen und wie ein Fehler aussehen.

Die Belohnungs-Pille trägt eine umlaufende, leicht glühende Linie
(`conic-gradient` auf dem `::before`, Maske auf 1,5 px, animiert wird nur der
Startwinkel — als `@property` registriert, sonst interpoliert er nicht).

`src/lib/zodiac.js` leitet aus dem Geburtsdatum das Sternzeichen ab — Vorarbeit
für eine Deutungs-Funktion, **noch nicht angebunden**.

## Klartraum-Leitfaden (Sleep → Luzides Träumen)

Neu aufgebaut aus der *International Lucid Dream Induction Study* (Aspy u. a.
2020, 355 Teilnehmende). Zwei Funde bestimmen den Aufbau:

- **Die Methode ist nicht der wichtigste Hebel.** Der größte Einzelfaktor war,
  ob jemand binnen zehn Minuten wieder einschlief (18,3 % gegen 11,1 %) —
  größer als der Abstand zwischen den Techniken. Deshalb stehen drei
  Zahlenkarten **vor** den Methoden.
- **Realitätschecks haben nicht geholfen.** Zu MILD dazugenommen schnitten sie
  schlechter ab als MILD allein (10,8 % / 13,4 % gegen 16,5 %). Sie bleiben
  drin, mit dem echten Ergebnis daneben.

Vier Methoden mit Schritt-für-Schritt-Protokollen (WBTB, SSILD 16,9 %, MILD
16,5 %, Realitätschecks), Erfolgsquote schon auf der zugeklappten Karte.
Bewusst **keine** Checkliste — hier wird nichts abgehakt.

## Farben und Gestaltung

Tiefes Blau mit warmem Gegenpol. Der Hintergrund existiert genau **einmal** als
`--bg-rgb` in `src/styles/tokens.css`; jeder Schleier leitet seine Deckkraft
davon ab (`rgb(var(--bg-rgb) / .x)`).

- **Warm ist selten und bedeutet „Weg nach vorn":** Hauptknöpfe, Plus-Knopf,
  Paywall-Akzente tragen `--warm-grad`. ⚠ **Immer mit `color: var(--bg)`** —
  Weiß auf Bernstein reißt den Kontrast.
- Icons kommen aus **einem** SVG-Satz (`src/components/icons.jsx`), 24px-Box,
  gestrichelt, `currentColor` — kein Emoji in Bedienelementen.
- **Videos werden nie per `filter` gedimmt**, immer über einen Verlaufs-Scrim:
  ein Filter kostet auf dem Telefon jede Sekunde Rechenzeit, ein Verlauf wird
  einmal gezeichnet.
- Videos werden **per Vite-Import** eingebunden, nicht als `/public`-Pfad — so
  überlebt die Referenz jede `base`-Änderung (wichtig für Capacitor).
- `scripts/test-contrast.mjs` prüft 16 Paarungen gegen WCAG AA.

## Geteiltes Test-Journal (10.08.) — vor dem Release entfernen

Jeder frische Install zeigt zwei Träume mit echten Bildern statt eines leeren
Journals: `src/lib/seedJournal.js`, sechs WebP unter `public/clips/seed-*`,
eingehängt über `loadInitialState()` in `src/state/AppState.jsx:11`.

Greift **nur**, wenn für den Browser noch nie etwas gespeichert wurde (der
Schlüssel ist `null`, nicht bloß ein leeres Journal) — ein absichtlich
geleertes Journal wird also nie überschrieben.

**Weitere Träume ergänzen:** `bun scripts/add-seed-dream.mjs <slug>` — rendert
das 16:9-Grid über den echten `buildGridPrompt()`, schneidet es nach der
Logik aus `splitGrid.js`, komprimiert nach WebP und druckt den Block zum
Einfügen. **Nicht von Hand per curl generieren:** ohne `prompt` und
`aspectRatio: "16:9"` läuft der Aufruf in den alten Einzelbild-Pfad und das
Triptychon entsteht gar nicht (passiert am 10.08., siehe WORKLOG).

**WebP ist Pflicht.** Die sechs Panels als PNG wären 3,4 MB bei 3,6 MB
Git-Historie gewesen — ein Commit hätte das Repo verdoppelt, und Git gibt den
Platz beim Löschen nicht zurück. Als WebP: 0,27 MB.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 77 Unit + 50 Freigabe + Hygiene + Kontrast + i18n

⚠️ Die Oberfläche liegt im Dev-Modus auf **5173**, nicht 8100 — dort läuft nur
die API. **5173 und 8100 sind für den Browser verschiedene Herkünfte mit
getrenntem `localStorage`.**

⚠️ **Die `.claude/launch.json` im Hauptrepo-Ordner** (nicht im Worktree) steht
auf Attach-only und startet keinen Server. Noch nicht angeglichen.

## Provider und Preise (Stand 09.08.)

| | Modell | Kosten |
|---|---|---|
| Bild | `fal-ai/nano-banana-2` (1K) | **$0,08** je Bild |
| Bild mit Referenz | `.../edit` — Pflicht, sonst werden `image_urls` ignoriert | $0,08 |
| Video Standard | `minimax/h3/image-to-video` (768P) | **$0,08 je Sekunde**, **5–15 s** |
| Diktat | `fal-ai/wizper` | $0,0005 je Minute |
| Analyse | `deepseek-v4-flash` | **$0,00026** je Traum |
| Stimmproben | `gemini-3.1-flash-tts-preview` | einmalig je Stimme+Sprache, gecacht |

⚠ **`minimax/h3` verlangt mindestens 5 Sekunden.** Die Queue prüft das erst
beim **Rendern**: ein zu kurzer Wert verbrennt Credits und kommt Minuten später
als gescheiterter Job zurück. `clampSeconds()` in `lib/video.js` fängt das ab.

## Geschäftsmodell — korrigierte Rechnung (10.08.)

Die ursprüngliche Formel in `plans.js` ignorierte **zwei der größten Abzüge**;
beide sind jetzt dort und in `credits.js` dokumentiert:

1. **MwSt.** geht in der EU vom Listenpreis ab, *bevor* der Store seine
   Provision nimmt: $5,99 → ÷1,19 → ×0,70 → −$2,10 Credits = **$1,42**/Monat,
   nicht $2,09.
2. **Gratis-Credits fallen pro Installation an**, nicht pro Kunde. Bei einer
   Conversion c schleppt jeder Abonnent 1/c Installationen mit; bei 5 % und
   drei Monaten Haltedauer sind das **$1,60**/Abo/Monat — mehr, als das Abo
   einbringt.

**Folge: Mit dem Standard-Schnitt von 30 % ist das Modell defizitär.** Das
**Small Business Program (15 %) ist Voraussetzung, nicht Optimierung.**
Break-even-Conversion real **~4,5–5 %** (bisher notiert: 3,8 %). Für 5.000 €
Gewinn/Monat grob **2.500–5.000 aktive Abos**, für 10.000 € etwa das Doppelte.
**Die Conversion ist die erste Kennzahl, die nach Launch gemessen gehört** —
alles andere hängt an ihr.

## Sicherheit

- **Vertraulichkeit:** Web-Wurzel ist `dist/`, nicht das Repo. `/media/` hat
  eine eigene, enge Prüfung (`resolveMedia()`, nur Hash-plus-Endung). 50
  Prüfungen in `scripts/test-static.mjs`.
- **Prompt-Eingabe:** unsichtbare Zeichen werden serverseitig entfernt,
  `sanitizePromptText()` in `server.js` ist die verbindliche Stelle.
- **Allowlisten statt Interpolation:** `voice`, `mode`, `lang` und
  `aspectRatio` kommen vom Client und landen in Prompts bzw. in Geminis Setup —
  alle vier werden gegen feste Listen geprüft, nie durchgereicht.
- **Offen — `/api/generate` hat keine Authentifizierung und kein Rate-Limit.**
  Nur an localhost binden. Löst sich erst mit dem Backend.
- **Offen — Credits sind Buchhaltung, keine Zugangskontrolle.** Der Stand liegt
  im `localStorage` und ist frei editierbar.
- **Offen — Datenschutz:** Referenzfotos, Sprachaufnahmen und die
  Onboarding-Umfrage (Geburtsdatum, wiederkehrende Themen) gehen an fal.ai bzw.
  Google. Vor Veröffentlichung braucht es Hinweis, Einwilligung und Klärung der
  Speicherdauer.

## Bekannte Baustellen

- **RTL (Arabisch) ist nicht einzeln geprüft.** `dir="rtl"` steht am
  Dokument, was der Browser daraus macht, ist ungeprüft; eigene
  Flex-/Absolut-Layouts über ~35 CSS-Dateien wurden nicht durchgesehen.
- **Filme laufen über `queue.fal.run`.** `falSubmitVideo()` speichert
  `status_url`/`response_url` **wörtlich** aus fals Antwort — **nicht wieder
  aus dem Modell-Slug rekonstruieren**, das machte fertige Filme unabholbar.
- **Die Bilderstrecke im Journal teilt nach Sätzen** — die Beats liegen nur in
  der (ggf. verworfenen) Analyse, nicht am Eintrag gespeichert.
- **Symbolerkennung nur auf Englisch** (`src/lib/symbols.js`).
- Tagebuch wächst unbegrenzt, keine Pagination; base64-Referenzfotos machen das
  localStorage-Kontingent (~5 MB) zum eigentlichen Limit.
- **Das Seed-Journal erscheint bei JEDEM frischen Install**, auch bei echten
  Nutzern (`src/state/AppState.jsx:11`). Als Testzugang gewollt; vor einem
  Release zu entfernen — Anleitung im Kopfkommentar von
  `src/lib/seedJournal.js`.
- **Der Zuschneide-Code im Seed-Skript ist ein PORT**, keine gemeinsame
  Quelle: `scripts/add-seed-dream.mjs` enthält Python, das `splitGrid.js`
  nachbildet (Bun hat keinen Bilddecoder). Ändert sich dort MAX_TRIM, der
  „hellster Pixel"-Test oder die Rundung der Grenzen, muss das Skript
  mitgezogen werden.
- Kein `bun run lint` — weiterhin keine Konfiguration dafür.

## Nächste Schritte

1. **Small Business Program beantragen**, sobald es einen Entwickleraccount
   gibt — ohne ist die Preisliste defizitär.
2. **RTL-Durchsicht** für Arabisch.
3. **Empfehlungsprogramm.** Prämie erst nach der ersten erfolgreichen
   Abbuchung. Braucht das Konten-Backend.
4. **Character-Sheets** für beschriebene Figuren ohne Foto.
5. Vor jeder öffentlichen Nutzung: **Auth + Rate-Limit** für `/api/generate`.
6. **Supabase-Projekt** (Produktbesitzer) → ADR für Accounts/DB/Credits.
7. Apple-/Google-Developer-Accounts → ADR für Capacitor.
8. **`lib/zodiac.js` anbinden** — die Umfrage sammelt Sternzeichen und Themen
   bereits, es passiert nur noch nichts damit.

**Nicht auf dieser Liste, mit Absicht:** das Startmenü (siehe oben — bleibt,
bis Anton es ausdrücklich sagt).

## Offene Zahlen, die nur die Wirklichkeit beantworten kann

- **Conversion und Haltedauer.** Siehe Geschäftsmodell oben: unter ~4,5 % trägt
  sich das Geschenk nicht. Niemand weiß es, bevor es Konten gibt.
- **Echte Rechnungsbeträge** stehen im fal.ai-Dashboard. Die letzten Sitzungen
  haben dort reale Läufe hinterlassen — ein Blick darauf bestätigt oder
  korrigiert die hier genannten Preise.
