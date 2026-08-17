# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-17 (00:03) — Branch `session/2026-08-16-anton`, PR #12

## Woran wird gearbeitet

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI macht
daraus eine Bildstrecke und optional einen kurzen Film. **Vier Tabs**, der
Wizard öffnet sich über der Tab-Leiste.

| Tab | Inhalt |
|---|---|
| Home | Begrüßung, Faultier-Film als Posterkarte, Serien-Zeile, letzter Traum, Menagerie |
| Journal | Kartenstapel **oder** Liste, Kalender, Detail mit Film+Bildern |
| **⊕** | Der Wizard: Traum → Ausgabe → Personen → Orte → Style → Ergebnis |
| Sleep | **Alles gratis:** Checkliste, Sound-Mixer, Klartraum-Leitfaden, Symbole |
| Profil | Porträt, Guthaben-Pille (Kaufblatt), Zahnrad → Einstellungen, „Was du mir erzählt hast" |

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter), `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini Live + Gemini TTS). Zustand
in `localStorage`, Schlüssel `dreamrushes_v1`.

**Sprache:** Oberfläche in **sieben Sprachen** (en, de, es, fr, zh, hi, ar),
alle Texte in `src/i18n/<id>.js`; `en.js` ist die Vorlage,
`scripts/check-i18n-shape.mjs` erzwingt gleiche Form **und gleiche Arität**.
Doku und Commits deutsch.

## ⚠ Zwei Dinge, die absichtlich drin sind

**Das Startmenü bleibt** (`src/App.jsx:15`, `screens/Onboarding/StartMenu.jsx`).
Es fragt bei **jedem** Start „Onboarding oder App?". Stehende Entscheidung
(Anton, 10.08.2026) — es bleibt, bis er ausdrücklich etwas anderes sagt. Es
sieht wie ein Versehen aus; genau deshalb steht das hier.

**Das Seed-Journal bleibt** (`src/lib/seedJournal.js`, eingehängt in
`state/AppState.jsx:15`). Zwei Träume mit echten Bildern in jedem frischen
Install. Vor einem Release zu entfernen; Anleitung im Kopf der Datei.
Wer Code schreibt, der „hat der Nutzer schon Träume?" fragt: nach
`e_seed`-Präfix filtern, sonst zählen die mit (siehe `Step6Result.jsx:138`).

## ⚠ Verloren am 16.08.: der Ordner `media/`

Die `.mov`-Originale der Faultier-Videos und der **gesamte lokale
Render-Cache** sind weg — jedes Bild und jeder Film, den die App bis dahin
erzeugt hatte. Träume im Browser-Tagebuch, die auf `/media/<hash>` zeigen,
laufen ins Leere. Kein Backup vorhanden (keine Time Machine eingerichtet).

**Nicht betroffen und weiterhin da:** `src/assets/home-faultier.mp4` und
`intro-faultier.mp4` (was die App wirklich benutzt), Seed-Journal unter
`public/clips/`.

**Ursache, damit es sich nicht wiederholt:** `.gitignore` sagte `media/` —
mit Schrägstrich, und das passt **nur auf Verzeichnisse**. Ein Symlink
dieses Namens war damit nicht ignoriert, wurde committet, und der nächste
Checkout ersetzte den echten Ordner durch den Link. Ignorierte Dateien
räumt git dabei kommentarlos weg.

Jetzt `/media` und `node_modules`, beide ohne Schrägstrich (`.gitignore:2`
und `:41`). **Wer eine dieser Zeilen wieder auf die Schrägstrich-Form kürzt,
stellt die Falle erneut.** Und allgemeiner: Was unter einem ignorierten Pfad
liegt und nicht ersetzbar ist, gehört woandershin.

## Das Kaufblatt — was es zeigt und woher

**Zwei Kacheln statt zweier Strichsymbole** (`src/screens/Profile/Paywall.jsx:144`).
Links laufen Standbilder im Wechsel mit langsamer Zufahrt, rechts ein Film,
die Zahl sitzt unten als Bildunterschrift.

Der Grund für den Umbau: Das Problem waren nicht die Zeichnungen, sondern die
**Gattung**. Strichsymbole sind Bedienoberfläche — sie sagen „hier kannst du
tippen", nicht „das bekommst du".

**Die Auswahl steckt in `src/lib/showcase.js`, nicht in der Komponente**, und
ist dreistufig:

1. **Eigene Träume**, neuestes zuerst — das Blatt geht meist auf, WEIL das
   Guthaben leer ist; wer dort ankommt, hat also schon geträumt
2. **Seed-Bilder bzw. Dummy-Film** — liegen im Auslieferungsstand
3. **Der gefüllte Glyph** (`ShowcaseGlyph.jsx`) — erst wenn gar nichts lädt

⚠ **Stufe 2 greift auch dann, wenn Stufe 1 EXISTIERT, sich aber nicht laden
lässt** — dafür gibt es `stillsBackup`/`filmsBackup` neben `stills`/`films`.
Ohne das sähe die Kaufseite eines langjährigen Nutzers ärmer aus als die eines
neuen, und zwar deshalb, WEIL er viel geträumt hat.

⚠ **Der Dummy-Film ist ein Platzhalter** (`Paywall.jsx:25`, derzeit
`home-faultier.mp4`). Austausch = eine Zeile; was hineingehört, steht im
Kommentar darüber.

⚠ **Die gefüllten Glyphen stehen NICHT in `icons.jsx`.** Dessen Kopf sagt
„nothing filled", und genau das lässt eine Reihe davon als eine Familie lesen.

**Das „oder" trägt Bedeutung**, keine Zierde: Das Guthaben gibt das eine ODER
das andere her. Zentriert über `inset-inline: 0` plus automatische Ränder —
nicht über `translate(-50%)`, das im Arabischen die falsche Kante verankert.

## Geld — Preise, Töpfe, Kaufwege

**Es kassiert weiterhin niemand.** Kein Zahlungsanbieter, kein Store-Konto,
kein serverseitiges Guthaben. Alles unten ist Fluss und Zahlenwerk, bereit
zum Anschließen.

**Preisliste** (`src/lib/plans.js`):

| | Preis | Credits | je Credit |
|---|---|---|---|
| Woche | $4,99 | 12 / Woche | $0,416 |
| Monat ★ | $9,99 | 45 / Monat | $0,222 |
| Jahr | $79,99 | 45 / Monat | $0,148 |
| Paket S | $2,99 | 6, bleiben | $0,498 |
| Paket M | $7,99 | 18, bleiben | $0,444 |
| Paket L | $14,99 | 32, bleiben | $0,468 |

**Zwei Regeln, in `plans.test.js` festgenagelt:** Kein Paket teilt einen
Preispunkt mit einem Abo, und jedes Paket ist je Credit teurer als jedes Abo.
Beides gibt es, weil genau das schon einmal kaputt war — `pack-s` bot bei
identischem Preis mehr Credits als das Wochen-Abo, und die damalige Prüfung
ließ es durch, weil sie monatlich normierte statt den Kaufmoment zu messen.

**Zwei Guthaben-Töpfe** (`src/lib/credits.js`):
`credits` (Pakete + Willkommensgeschenk — bleiben) und `allowance` (Abo — wird
zum Periodenbeginn **gesetzt**, nicht addiert). Ausgegeben wird **immer zuerst
das Verfallende**; andersherum verlöre ein Abonnent bei jeder Abrechnung seine
dazugekauften Credits. Angezeigt wird die Summe über `totalCredits()`.

**Das Kaufblatt öffnet sich von überall** über `openPaywall(reason)` aus dem
AppState, eingehängt einmal in `App.jsx`. Drei Anlässe: `browse` (selbst
getippt), `spent` (Guthaben leer, an fünf Stellen) und `first` (genau einmal,
wenn der erste **selbst gemachte** Traum fertig ist).

⚠ Der Aha-Moment liegt bewusst NICHT am Ende des Onboardings, obwohl die
Konversionszahlen das nahelegen: Dort verspricht die App „Dein erster Traum
geht auf uns". Direkt danach nach Geld zu fragen wäre der Widerspruch, den
man einer App nicht verzeiht.

## Schranke vor den teuren Endpunkten

`src/lib/gatekeeper.js`, eingehängt ganz oben in `server.js`s `fetch`:

- **Mengenbegrenzung je Absender**, greift immer. `generate` 20/min,
  `text` 40/min, `cheap` 120/min.
- **Optionales `API_TOKEN`.** Ohne gesetzte Variable bleibt alles offen —
  eine Sicherung, die alle als Erstes abschalten, sichert nichts.

⚠ **Die Voreinstellung ist die strengste:** Alles unter `/api/` wird begrenzt,
sofern es nicht ausdrücklich in `UNLIMITED` steht (`/api/job`, `/api/voice`).
Grund: Eine Liste kann einen vergessenen Endpunkt nicht verhindern — genau das
passierte am 16.08. mit `/api/character`. Wer einen neuen Endpunkt baut,
bekommt die Bremse geschenkt.

**Bleibt trotzdem KEINE Benutzerverwaltung:** keine Konten, kein
serverseitiges Guthaben, keine Zuordnung wer was ausgegeben hat.

## Die Persona — eine Stimme, überall dieselbe

„Der coole Nachtportier": ruhig, trocken-warm, unaufgeregt. Ein `PERSONA`-Block
in `server.js` speist **beide** Briefings.

**Zwei Regeln, die Blut gekostet haben:**
1. **Keine Beispielsätze im Prompt.** Zweimal hat das die Sprache verbogen.
   Beschrieben wird die *Bewegung*, nie der Wortlaut.
2. **Verbote allein erzeugen Neutralität.** Eine Fassung aus lauter „erwähne
   nie…" lieferte farblose Begrüßungen.

Der Charakter fällt als Erstes weg, wenn ein Traum bedrückend wird.

## Der Sprachassistent (Gemini Live)

Zwei Modi über denselben Relay (`/api/voice`): `dream` und `onboarding`.
**Die Stimme wird genau einmal gewählt**, danach unter Profil → Zahnrad.
Sechs Stimmen in `src/lib/voices.js`, gespiegelt als `VOICE_NAMES` in
`server.js`.

**Vorhören:** Die API bietet keine fertigen Proben. `/api/voice-sample` erzeugt
sie per Gemini TTS — derselbe Stimmkatalog wie die Live-API, also ist die Probe
exakt die spätere Stimme. Je (Stimme, Sprache) einmal, als WAV gecacht.

**Zwei nicht offensichtliche Punkte:** Die Verbindung geht **direkt an den
API-Port** (der Vite-Proxy reicht WebSockets unter Bun nicht durch), und Gemini
antwortet **ausschließlich in Binärframes**, auch `setupComplete`.

## Bilder, Filme, Teilen

**Schnellvorschau** (`Step5Style.jsx:37`, `isPreview`): 3 Panels aus EINEM
Rendering, **1 Credit**, sichtbare Kachel. Kostet ein Drittel der Auflösung
(gemessen: 459×768 gegen 768×1376) — deshalb rendert der Gratis-Traum weiter
in voller Größe.

**Charakterbögen** (`/api/character`, 2 Credits): aus einer Beschreibung ein
neutrales Referenzporträt, das ab da wie ein Foto wirkt. Ausdrücklich kein
Szenenbild und ohne `styleId` — sonst ließe sich die Figur nicht in einem
zweiten Traum mit anderem Stil verwenden.

**Abspann beim Teilen** (`/api/film-outro`): zwei Sekunden Mond und Wortmarke
an das Filmende. Karte im **Browser** gezeichnet (dort leben Schrift und
Palette), zusammengefügt auf dem **Server** mit ffmpeg.
⚠ **ffmpeg ist ein Systemprogramm, keine npm-Abhängigkeit.** Fehlt es → 501,
und `share.js` teilt den Film unverändert.

**`dreamsFor` berechnet den Filmpreis aus `video.js`**, statt ihn zu
wiederholen. Vorher stand dort `credits / 5`, während ein Film 7 kostet — die
Paywall versprach 9 Filme, wo 6 drin sind.

**Wer Traum-Medien liest, nimmt `entryMedia.js`** (`filmOf`, `imagesOf`),
niemals `entry.media` direkt: Vor dem 09.08. lag ein Film im `media`-Feld,
seither daneben in `film`. Die zwei Leser verdecken die Naht.

## Die Serie belohnt, sie bestraft nie

`streak.js`: Eine längere Serie verschiebt die Seltenheit der Wesen
(ohne Serie 55/25/12/6/2, bei 14 Nächten 25/41,7/20/10/3,3), gedeckelt bei 14.

⚠ **Wer daran weiterbaut:** keine Countdowns, nichts Eingefrorenes, keine
Verlustdrohung. Es geht nie etwas verloren — wer eine Woche aussetzt, findet
alles unverändert vor. Begründung im Kopf der Datei.

## Farben, Gestaltung, Sprache

- Der Hintergrund existiert **einmal** als `--bg-rgb` in `tokens.css`.
- **Warm ist selten und heißt „Weg nach vorn".** Immer mit `color: var(--bg)`.
- Icons aus **einem** SVG-Satz, kein Emoji in Bedienelementen. Der Satz ist
  ungefüllt — Ausnahmen bekommen eine eigene Datei, nicht eine Zeile in
  `icons.jsx`.
- **Videos nie per `filter` dimmen**, immer Verlaufs-Scrim; per Vite-Import
  einbinden, nicht als `/public`-Pfad.
- **RTL:** logische Eigenschaften überall, `scripts/test-rtl.mjs` erzwingt es.
  Zeichen, die eine Richtung MEINEN, tragen `[data-flip]`.
  ⚠ **`transform` kennt keine logischen Achsen.** Wer mit `translate(-50%)`
  zentriert, verankert im Arabischen die andere Kante — dann lieber
  `inset-inline: 0` plus `margin-inline: auto`.
- **Plural:** Wer eine Zahl neben ein Wort setzt, nimmt eine Funktion
  (`creditsN`, `yieldImages`, `yieldFilms`). Zweimal stand „1 Credits" bzw.
  „1 Filme" im Bild. Arabisch hat Einzahl, Zweizahl, Mehrzahl 3–10, dann
  wieder Einzahl.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 124 Unit + 50 Freigabe + Hygiene + Kontrast + i18n + RTL

⚠️ 5173 und 8100 sind für den Browser **verschiedene Herkünfte mit getrenntem
`localStorage`**.

⚠️ `preview_start` bedient das **Hauptrepo**, nicht den Worktree. Im Worktree
zusätzlich `bunx vite --port 5174` starten — und vorher dort **`bun install`
laufen lassen**, nicht `node_modules` verlinken (siehe die Symlink-Falle oben).
5174 ist wieder eine eigene Herkunft, also ein frischer Install samt Sprachwahl.

## Provider und Preise

| | Modell | Kosten |
|---|---|---|
| Bild | `fal-ai/nano-banana-2` (1K) | **$0,08** je Bild |
| Bild mit Referenz | `.../edit` — Pflicht | $0,08 |
| Video | `minimax/h3/image-to-video` (768P) | **$0,08/s**, **5–15 s** |
| Diktat | `fal-ai/wizper` | $0,0005 je Minute |
| Analyse | `deepseek-v4-flash` | $0,00026 je Traum |
| Stimmproben | `gemini-3.1-flash-tts-preview` | einmalig je Stimme+Sprache |

⚠ `minimax/h3` verlangt **mindestens 5 Sekunden**; die Queue prüft das erst
beim Rendern, ein zu kurzer Wert verbrennt Credits. `clampSeconds()` fängt es ab.

## Geschäftsmodell

Die Rechnung in `plans.js` berücksichtigt **MwSt.** (geht in der EU vor der
Store-Provision ab) und **Gratis-Credits pro Installation**. Mit beiden ist der
30-%-Schnitt defizitär — **das Small Business Program (15 %) ist Voraussetzung,
nicht Optimierung.** Break-even-Conversion ~4,5–5 %.
Deckungsbeitrag Monat: **$4,44**.

**Die Conversion ist die erste Kennzahl, die nach Launch gemessen gehört.**

## Sicherheit

- Web-Wurzel ist `dist/`. `/media/` hat eine eigene enge Prüfung
  (`resolveMedia()`, nur Hash-plus-Endung) — Grundlage auch dafür, dass
  Film-Keyframe und Abspann nur eigene Dateien verwenden können.
- **Allowlisten statt Interpolation:** `voice`, `mode`, `lang`, `aspectRatio`
  und `category` kommen vom Client und werden gegen feste Listen geprüft.
- **Offen — Datenschutz:** Referenzfotos, Sprachaufnahmen und die Umfrage
  (Geburtsdatum) gehen an fal.ai bzw. Google. Vor Veröffentlichung braucht es
  Hinweis, Einwilligung und Speicherdauer.
- **Offen — Credits sind Buchhaltung, keine Zugangskontrolle.**

## Bekannte Baustellen

- **Kein Zahlungsanbieter.** Der Kaufknopf sagt es ehrlich.
- **Der Dummy-Film im Kaufblatt** ist noch das Faultier-Video (`Paywall.jsx:25`).
- **Filme laufen über `queue.fal.run`.** `falSubmitVideo()` speichert
  `status_url`/`response_url` **wörtlich** — nicht aus dem Slug rekonstruieren,
  das machte fertige Filme unabholbar.
- **Die Bilderstrecke im Journal teilt nach Sätzen** — Beats liegen nur in der
  (ggf. verworfenen) Analyse.
- **Symbolerkennung nur auf Englisch** (`src/lib/symbols.js`).
- Tagebuch wächst unbegrenzt; base64-Referenzfotos machen das
  localStorage-Kontingent (~5 MB) zum Limit.
- Kein `bun run lint`.

## Nächste Schritte

1. **Capacitor + StoreKit + RevenueCat** — Punkt 1 des Wachstumsplans. Alles
   andere multipliziert diesen.
2. **Dummy-Film ersetzen** (Anton), eine Zeile in `Paywall.jsx`.
3. **Small Business Program beantragen**, sobald es einen Entwickleraccount gibt.
4. **Push:** Morgen-Erinnerung und „Dein Film ist fertig" (braucht Capacitor).
5. **Web-Funnel + Stripe** — die Sprach-Umfrage ist bereits ein Quiz-Funnel in
   sieben Sprachen, sie steht nur am falschen Ort.
6. **Datenschutzerklärung und App-Privacy-Angaben** (Voraussetzung fürs
   Einreichen, Liste in `docs/plans/2026-08-16-positionierung-und-store.md`).
7. **Startmenü und Seed-Journal entfernen** — beides auf Antons Wort.
8. Empfehlungsprogramm · Preise lokalisieren · Churn-Werkzeuge.

## Pläne aus früheren Sitzungen

- `docs/plans/2026-08-16-wachstumsplan.md` — zehn Umsatzhebel nach
  Hebel÷Aufwand, mit Quellen und einer bewussten Nicht-Empfehlungs-Liste.
  Umgesetzt: Punkte 2, 3, 6, 7, 9.
- `docs/plans/2026-08-16-positionierung-und-store.md` — Store-Texte auf
  Englisch und Deutsch, Längen gegen Apples Grenzen geprüft, plus die Liste
  dessen, was vor einer Einreichung fehlt.
