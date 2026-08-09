# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-09 (19:37) — Branch `session/2026-08-07-anton`, PR #9

## Woran wird gearbeitet

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI macht
daraus eine Bildstrecke und optional einen kurzen Film. **Vier Tabs**, der
Wizard öffnet sich über der Tab-Leiste; vor allem anderen entscheidet gerade
ein **Startmenü**, ob man das Onboarding sieht oder direkt in die App springt
(siehe „⚠ Übergangslösung" unten — wichtigster Punkt dieser Datei).

| Tab | Inhalt |
|---|---|
| Home | Begrüßung nach Tageszeit, letzter Traum als Himmel, Menagerie |
| Journal | Träume als Kartenstapel **oder** Liste, Kalender, Detail mit Film+Bildern nebeneinander |
| **⊕** | Der Wizard: Traum → Ausgabe → Personen → Orte → Style → Ergebnis |
| Sleep | **Alles gratis:** Einschlaf-Checkliste, Sound-Mixer, Lucid-Guide, Symbole |
| Profil | Porträt, Credits-Pille (öffnet Paywall), Umfrage-Karte falls offen |

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter), `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini Live). Zustand in
`localStorage`, Schlüssel `dreamrushes_v1`.

**Sprache:** Oberfläche **englisch**, alle Texte in `src/i18n/en.js` und nirgends
sonst. Doku und Commits deutsch.

## ⚠ Übergangslösung, die vor echter Nutzung raus muss

`src/App.jsx`s `Gate()` zeigt bei **jedem** App-Start ein `StartMenu`
(„Show onboarding" / „Skip to app") statt einfach auf `state.onboarded` zu
prüfen. Absichtlich so gebaut, solange am Onboarding gearbeitet wird — sonst
wäre der Flow nach dem ersten Anschauen praktisch unerreichbar, weil das Flag
einmal kippt und dann für immer kippt. **Vor jeder echten Nutzung:**
`src/screens/Onboarding/StartMenu.jsx` löschen, `Gate()` wieder auf
`!state.onboarded` gaten lassen (im Kommentar dort genau beschrieben).

## Der Sprachassistent (Gemini Live)

Zwei Modi über denselben Relay in `server.js` (`/api/voice`, WebSocket):

- **`dream`** — Trauminterview, `VOICE_TOOLS` (`setDreamText`, `addPerson`,
  `addPlace`, `finish`), Briefing kennt Name aus dem Profil und bekannte
  Cast-Mitglieder, damit genannte Figuren als bestehende `@tag`s erkannt
  werden statt neu erfunden zu werden.
- **`onboarding`** — Willkommens-Umfrage, `ONBOARDING_TOOLS` (`setName`,
  `setBirthday`, `setDreamRecall`, `setLucidLevel`, `addTheme`, `setGoal`,
  `finish`), jede Frage überspringbar.

**Zwei nicht offensichtliche technische Punkte, falls daran gearbeitet wird:**

- Die Verbindung geht **direkt an den API-Port** (`__API_PORT__` aus
  `vite.config.js`), nicht über den Vite-Dev-Proxy — der reicht WebSockets
  unter Bun nicht durch (`node:http` meldet die 101-Antwort als gewöhnliche
  Antwort statt als `upgrade`-Ereignis).
- Gemini antwortet **ausschließlich in Binärframes**, auch das
  `setupComplete`-Handshake-Signal. Wer neue Steuer-Logik auf Frame-Inhalt
  ergänzt: mit `TextDecoder` dekodieren, nicht auf `typeof data === "string"`
  prüfen.

## Journal — Struktur

Ein Eintrag kann **Film und Bildstrecke gleichzeitig** besitzen — zwei
unabhängige Felder, `entry.media` (Bilder) und `entry.film` (Clip), nie eines
das andere überschreibend. `src/lib/entryMedia.js` (`filmOf`, `imagesOf`,
`allMediaOf`) ist die einzige Stelle, die beide liest; alte Einträge mit Film
in `media.type === "video"` werden per Fallback weiter gefunden. **Wer neue
Medien-Lesestellen baut: über `entryMedia.js`, nie `entry.media` direkt.**

Reihenfolge auf der Detailseite: warmer Haupt-Knopf (Bilder/Film machen) ganz
oben, darunter die Aktionsleiste (Remix/Rewrite/Edit/Share), darunter Film
(falls vorhanden), darunter Text und Bilderstrecke.

**Ein „nur gespeicherter" Traum lässt sich fortsetzen** — der Wizard startet
dann direkt bei der Besetzung (Schritt 3), nicht bei der Analyse, weil der
Text schon da ist. **Remix** öffnet denselben Text zum Ändern und erzeugt neu
daraus; die alte Analyse wird dabei verworfen (beschreibt sonst einen Text,
den es so nicht mehr gibt).

**Ein Film kann eines der eigenen Bilder des Traums animieren** statt immer
ein neues Keyframe zu rendern — spart ein Credit. Das Bild geht als Data-URI
an fal; `resolveMedia()` in `server.js` lässt nur Pfade durch, die auf echte,
selbst geschriebene Dateien zeigen.

## Grid-Bilder — ein Aufruf, drei Bilder

Für die 3-Bilder-Stufe **ohne Poster** generiert `buildGridPrompt()`
(`promptBuilder.js`) ein einzelnes 16:9-Bild mit drei Panels, `splitGrid.js`
schneidet es im Browser per `<canvas>`. **Das Modell malt trotz Verbot einen
Letterbox-Rahmen ins Bild** — der Zuschnitt entfernt ihn, erkannt am
**hellsten** Pixel jeder Randzeile (nicht am Durchschnitt: gemalte Balken
max. 5/255, eine dunkle Wasserszene trägt trotzdem Glanzpunkte ab 19). Preis
bleibt bei 3 Credits, die Ersparnis (~$0,08 statt ~$0,24) geht bewusst in die
Marge — Entscheidung vom 09.08., dokumentiert in `pricing.js`. Nur für genau
diese eine Kombination (3 Bilder, kein Poster) gebaut; ein Poster+2-Panel-Grid
oder ein 9-Panel-Grid sind unbewiesen und bewusst nicht gebaut.

## Onboarding

`src/screens/Onboarding/`: Animation (`DreamScape`, Platzhalter bis ein
gerendertes Video sie ersetzt) → drei Folien → Sprach-Umfrage → optionaler
Selfie-Schritt über `AvatarDialog`. Maskottchen (`Mascot.jsx`) ist bewusst
simpel gehalten, austauschbar. Die Willkommens-Credits sind jetzt die
**Belohnung** fürs Abschließen der Umfrage, nicht mehr ein stilles Geschenk
bei Installation (`welcomeGrant()` bleibt idempotent). Wer überspringt,
findet Angebot und Credits als Karte im Profil wieder
(`ProfileScreen.jsx`, `p-survey`).

`src/lib/zodiac.js` leitet aus dem Geburtsdatum das Sternzeichen ab
(clientseitig, getestet) — Vorarbeit für eine spätere Traumdeutungs-Funktion,
noch nicht angebunden.

## Farben und Gestaltung

Tiefes Blau mit warmem Gegenpol. Der Hintergrund existiert genau **einmal**
als `--bg-rgb` in `src/styles/tokens.css`; jeder Schleier und Verlauf leitet
seine Deckkraft davon ab (`rgb(var(--bg-rgb) / .x)`).

- **Warm ist selten und bedeutet „Weg nach vorn":** Hauptknöpfe, Plus-Knopf,
  Paywall-Akzente, der „Make it"-Knopf im Journal tragen `--warm-grad` (drei
  Stopps, Gold → Bernstein → Glut). ⚠ **Immer mit `color: var(--bg)`** — Weiß
  auf Bernstein reißt den Kontrast.
- Icons kommen aus **einem** SVG-Satz (`src/components/icons.jsx`), 24px-Box,
  gestrichelt, `currentColor` — kein Emoji mehr irgendwo in Bedienelementen.
- Native Formularelemente, die sich nicht stylen lassen (Datei-Input,
  `<input type=range>`), werden unsichtbar gemacht und durch eigene
  Bedienelemente im App-Stil ersetzt, die sie per Klick/Wert-Sync ansteuern
  — siehe `AvatarDialog.jsx` (Foto) und `SleepScreen.jsx` (Klangregler).
- `scripts/test-contrast.mjs` prüft 16 Paarungen gegen WCAG AA und läuft in
  `bun run test` mit.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 77 Unit + 50 Freigabe + Hygiene + 16 Kontrast

⚠️ Die Oberfläche liegt im Dev-Modus auf **5173**, nicht 8100 — dort läuft nur
die API. **5173 und 8100 sind für den Browser verschiedene Herkünfte mit
getrenntem `localStorage`.**

⚠️ **Die `.claude/launch.json` im Hauptrepo-Ordner** (nicht im Worktree)
startet nur `bun server.js`, nie Vite — ein frischer `main`-Checkout zeigt in
der Vorschau ein altes `dist/` ohne Oberfläche. Noch nicht angeglichen; siehe
Worklog-Eintrag 09.08. für Details.

## Provider und Preise (Stand 09.08., minimax-Dauer neu gemessen)

| | Modell | Kosten |
|---|---|---|
| Bild | `fal-ai/nano-banana-2` (1K) | **$0,08** je Bild |
| Bild mit Referenz | `.../edit` — Pflicht, sonst werden `image_urls` ignoriert | $0,08 |
| Video Standard | `minimax/h3/image-to-video` (768P) | **$0,08 je Sekunde**, **5–15 s** |
| Video Premium | `bytedance/seedance-2.5` (720p) | **$0,473 je Sekunde**, bis 30 s am Stück |
| Diktat | `fal-ai/wizper` | $0,0005 je Minute |
| Analyse | `deepseek-v4-flash` | **$0,00026** je Traum |

⚠ **`minimax/h3` verlangt jetzt mindestens 5 Sekunden**, nicht 2 wie am
08.08. notiert — nachgemessen am 09.08. gegen die echte Validierungsantwort
(`"ge: 5"`). Die Queue prüft das erst beim **Rendern**, nicht beim
Einreichen: ein zu kurzer Wert verbrennt Credits und kommt Minuten später als
gescheiterter Job zurück. `clampSeconds()` in `lib/video.js` fängt das ab.

**Die Credit-Skala:** 1 Credit = 1 Bild = $0,08. Textarbeit gratis. Die
3-Bilder-Grid-Stufe kostet real nur ~$0,08 (siehe oben), Preis bleibt trotzdem
bei 3 Credits — bewusste Margen-Entscheidung. Ein Film, der ein eigenes Bild
animiert statt ein neues Keyframe zu rendern, spart ein Credit automatisch.

Verkaufsseite in `src/lib/plans.js`: Preis = Kosten × Aufschlag ÷ (1 − Provision).
Bei Apples 30 % und 1,75× Aufschlag sind das **$0,200 je Credit**.

## Sicherheit

- **Vertraulichkeit:** Web-Wurzel ist `dist/`, nicht das Repo. `/media/` hat
  eine eigene, enge Prüfung (`resolveMedia()`, nur Hash-plus-Endung — auch
  Grundlage dafür, dass ein Film nur eigene, selbst gespeicherte Bilder
  animieren kann, nie einen beliebigen Pfad). 50 Prüfungen in
  `scripts/test-static.mjs`.
- **Prompt-Eingabe:** unsichtbare Zeichen werden serverseitig entfernt,
  `sanitizePromptText()` in `server.js` ist die verbindliche Stelle.
- **`/api/transcribe` und `/api/panel` (Grid-Upload) nehmen nur Base64-Data-URIs
  bzw. rohe Bild-Bytes mit geprüftem Content-Type**, niemals beliebige URLs.
- **Offen — `/api/generate` hat keine Authentifizierung und kein Rate-Limit.**
  Nur an localhost binden. Löst sich erst mit dem Backend.
- **Offen — Credits sind Buchhaltung, keine Zugangskontrolle.** Der Stand
  liegt im `localStorage` und ist frei editierbar.
- **Offen — Datenschutz:** hochgeladene Referenzfotos, Sprachaufnahmen und
  jetzt auch die Onboarding-Umfrage (Geburtsdatum, wiederkehrende Themen)
  gehen an fal.ai bzw. Google. Vor einer Veröffentlichung braucht es
  Datenschutzhinweis, Einwilligung und Klärung der Speicherdauer.

## Bekannte Baustellen

- **⚠ StartMenu ist eine Übergangslösung** (siehe oben) — höchste Priorität
  vor jeder echten Nutzung.
- **Der synchrone `fal.run` reicht nur für Bilder**, Filme laufen über
  `queue.fal.run`. `falSubmitVideo()` speichert `status_url`/`response_url`
  jetzt wörtlich aus fals eigener Antwort — **wer diesen Code anfasst: nicht
  wieder aus dem Modell-Slug rekonstruieren**, das war der Fehler, der
  fertige Filme unabholbar machte (siehe Worklog 09.08.).
- **Grid-Bilder nur für „3, kein Poster"** — andere Kombinationen (Poster+2,
  9er-Grid) sind unbewiesen.
- **Kein Charakter bleibt beim Filmen aus eigenem Bild garantiert konsistent**
  — der Film animiert das gewählte Bild direkt, es gibt keinen zweiten
  Referenz-Abgleich an dieser Stelle.
- **Die Bilderstrecke im Journal teilt nach Sätzen**, gleichmäßig auf die
  Bilder — die Beats liegen nur in der (ggf. verworfenen) Analyse, nicht am
  Eintrag gespeichert.
- **Symbolerkennung nur auf Englisch** (`src/lib/symbols.js`).
- Tagebuch wächst unbegrenzt, keine Pagination; base64-Referenzfotos plus
  wachsende Medien-Liste machen das localStorage-Kontingent (~5 MB) zum
  eigentlichen Limit.
- Kein `npm run lint` / `bun run lint` — weiterhin keine Konfiguration dafür.

## Nächste Schritte

1. **StartMenu entfernen**, sobald das Onboarding als fertig gilt (siehe oben).
2. **`.claude/launch.json` im Hauptrepo angleichen** (auf `bun run dev`,
   Port 5173) — noch nicht gemacht, siehe Worklog 09.08.
3. **Empfehlungsprogramm.** Prämie erst nach der ersten erfolgreichen
   Abbuchung gutschreiben. Braucht das Konten-Backend.
4. **Character-Sheets** für beschriebene Figuren ohne Foto (Seedream, siehe
   Modellvergleich vom 08.08.).
5. Vor jeder öffentlichen Nutzung: **Auth + Rate-Limit** für `/api/generate`.
6. **Supabase-Projekt** (Produktbesitzer) → ADR für Accounts/DB/Credits.
7. Apple-/Google-Developer-Accounts → ADR für Capacitor.
8. **`lib/zodiac.js` ist noch nicht an eine Traumdeutungs-Funktion
   angebunden** — die Umfrage sammelt Sternzeichen und wiederkehrende Themen
   bereits, es passiert nur noch nichts damit.

## Offene Zahlen, die nur die Wirklichkeit beantworten kann

- **Umwandlungsquote und Haltedauer.** Das Geschenk trägt sich ab **3,8 %**
  bei drei Monaten mittlerer Haltedauer. Ob die erreicht werden, weiß
  niemand, bevor es Konten gibt.
- **Echte Rechnungsbeträge** stehen im fal.ai-Dashboard. Diese und die
  letzte Sitzung haben dort reale Läufe hinterlassen (Bilder, mehrere
  5–15-Sekunden-Videos) — ein Blick darauf bestätigt oder korrigiert die
  hier genannten Preise.
