# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-19 (17:05) — Branch `claude/new-session-x9qv1w`
⚠ **sitzt auf PR #14 auf und enthält dessen Commits mit.**

## ⚠ Morgen geht es HIER weiter: messen, was nur der Rechner messen kann

Diese Sandbox erreicht **weder fal.ai noch api.deepseek.com** (Netzwerk-
Policy, 403). Alles unten ist deshalb gebaut, getestet und dokumentiert —
aber kein einziger echter Modellaufruf ist gelaufen. Drei Messungen warten:

1. **Der Trockenlauf mit echten Antworten** — der billigste erste Schritt:

       DEEPSEEK_KEY=… node scripts/dry-run-prompts.mjs --live

   Kostet ~$0,0005, rendert NICHTS. Zeigt, was DeepSeek aus dem neuen
   Material (Stil, Szenenbogen, Startbild, Zeitrechnung, Längenbudget)
   wirklich macht.

2. **Film-Endpoints** (`docs/plans/2026-08-17-film-regie.md` §10/§10a):
   Slugs, Feldnamen und echte Preise von `minimax/h3/reference-to-video`
   und `bytedance/seedance-2.5/reference-to-video`. Beide können
   Referenzen — unser Stufen-Zuschnitt war eine Endpoint-Wahl, kein
   Modelllimit.

3. **Bildmodelle** (`docs/plans/2026-08-19-bildmodelle-preise.md`):
   Hat fal einen `nano-banana-2-lite/edit`? Das Modell kostet **$0,0336
   statt $0,08** — aber ohne Referenz-Pfad taugt es nur für Träume ohne
   Besetzung.

**Hausregel seit dem nano-banana-Vorfall (07.08.): nie auf geratene
Feldnamen bezahlt rendern.** Deshalb ist nichts davon vorab umgebaut.

## Was der Film heute bekommt (Stand 19.08., alles neu)

Der Regisseur (`src/lib/director.js` + `server.js` `directFilm`) bekommt
jetzt, was seine eigene Anweisung immer verlangt hat — bis heute früh kam
nichts davon an:

| Zutat | Woher | War bis 19.08. |
|---|---|---|
| Stil-Anker | `styleId` → `styles.js` | **fehlte ganz** |
| Beschreibung des Startbilds | Bildprompt, ohne Referenzklauseln | fehlte bei „Regie" |
| Szenenbogen | Analyse, auf die Filmlänge zugeschnitten | fehlte ganz |
| Zeitrechnung je Szene | `beatsForSeconds` + Brief | Dauer stand nur als Gesamtzahl |
| Zeichenbudget | `promptMax` je Modell | pauschale Zahl, für kein Modell richtig |

**Die Filmlänge steuert die Erzählung:** 5 s → 2 Szenen, 9 s → 3, ab 15 s
alle fünf; längere Filme bekommen mehr Zeit je Szene statt mehr Szenen.
Erste und letzte Szene überleben jeden Zuschnitt (Anfang setzt den Ort,
Ende löst auf). Die Analyse **empfiehlt** eine Länge (`filmSeconds`, 5–30)
— der Regler startet dort, bis der Mensch ihn selbst bewegt.

**Zeichenlimits je Modell** (recherchiert 19.08.): H3 7 000 · Seedance 2.0
5 000 · Seedance 2.5 10 000. Eine Zahl, zwei Verwendungen — sie steht im
Brief als Budget UND ist die Notbremse im Server.

## Das Storyboard (neu 19.08.)

Die fünf Szenen als antippbare Leiste — im Filmmenü und im Traum-Detail.
Antippen öffnet ein Blatt mit Bild und Beat-Text. Im Filmmenü hängt die
Leiste am Sekunden-Regler: **wer von 15 auf 5 Sekunden zieht, sieht drei
Szenen verblassen, bevor er bezahlt.** Dieselbe Rechnung wie im Server,
nur sichtbar gemacht.

⚠ **Ein Thumbnail erscheint nur, wenn die Zuordnung SICHER ist.**
`imageIndexForBeat` antwortet sonst `null` → Nummern-Kachel. Grund:
Ob `urls[0]` ein Poster ist, war am Eintrag nicht ablesbar (ein
Preview-Eintrag hat auch Titel und drei urls, Panel 1 ist aber eine
Szene). Neue Einträge speichern `media.poster` als Wahrheit; ältere
bekommen Textkacheln statt geratener Bilder.

## ⚠ Ein Geld-Bug, der 19.08. starb — und was er lehrt

`beatsForCount` kannte nur 3/5/10; jeder andere Wert fiel auf „alle fünf"
durch. Das Poster ERSETZT das erste Bild (`sceneCount = count - 1`), also
bestellte „3 Bilder mit Poster" intern `beatsForCount(_, 2)`, bekam fünf
Szenen und renderte **6 bezahlte Generierungen bei 3 kassierten Credits.**
Jetzt generisch über eine geteilte `evenIndices`-Formel; Zuordnung und
Erzeugung teilen EINE Formel und können nicht auseinanderlaufen.

## ⚠ Was Tests hier NICHT fangen (zweimal an einem Tag gelernt)

**Ein Unit-Test der Funktion sieht die Lücke ZWISCHEN Dateien nicht.**
`buildDirectorBrief` war immer korrekt — nur rief sie niemand richtig auf.
Deshalb prüft `director.test.js` jetzt die **Verdrahtung**: Signatur gegen
Aufruf in `server.js`, generisch, damit auch der nächste vergessene
Parameter anschlägt.

**Anwesenheit ist nicht Aufbereitung.** Beim Szenenbogen war derselbe Test
mit einem blossen `beats,` zufrieden — die Rot-Probe lief durch. Wer einen
Test schreibt, fahre die Rot-Probe wirklich; ein Test, der nie rot war,
beweist nichts.

**Und `check-i18n-shape.mjs` prüft Gleichheit, nicht Richtigkeit.** Ein
Einfüge-Anker `"  errors: {"` traf als Substring die tiefer eingerückte
`voice.errors`-Zeile; der Block sass in allen sieben Sprachen konsistent
falsch und der Test blieb grün. Gefunden erst im Browser. **Blöcke per
Skript immer am Zeilenanfang verankern.**

## Woran wird gearbeitet

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI macht
daraus eine Bildstrecke und optional einen kurzen Film. **Vier Tabs**, der
Wizard öffnet sich über der Tab-Leiste.

| Tab | Inhalt |
|---|---|
| Home | Begrüßung, Faultier-Film als Posterkarte, Serien-Zeile, letzter Traum, Menagerie |
| Journal | Kartenstapel **oder** Liste, Kalender, Detail mit Film+Bildern, Besetzung |
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
(Anton, 10.08.2026) — es bleibt, bis er ausdrücklich etwas anderes sagt.

**Das Seed-Journal bleibt** (`src/lib/seedJournal.js`, eingehängt in
`state/AppState.jsx:15`). Zwei Träume mit echten Bildern in jedem frischen
Install. Vor einem Release zu entfernen; Anleitung im Kopf der Datei.
Wer „hat der Nutzer schon Träume?" fragt: nach `e_seed`-Präfix filtern
(siehe `Step6Result.jsx:138`).

## ⚠ Verloren am 16.08.: der Ordner `media/`

`.mov`-Originale und der gesamte Render-Cache sind weg; alte
`/media/<hash>`-Verweise laufen ins Leere. Ursache: `.gitignore` sagte
`media/` — mit Schrägstrich, passt nur auf Verzeichnisse; ein committeter
Symlink ersetzte beim Checkout den echten Ordner. Jetzt `/media` und
`node_modules` (`.gitignore:2`, `:41`). **Wer eine der Zeilen wieder auf
die Schrägstrich-Form kürzt, stellt die Falle erneut.** Was unter einem
ignorierten Pfad liegt und nicht ersetzbar ist, gehört woandershin.

## Die Besetzung — eine Rollenliste

`Journal → Deine Besetzung`: Abspann-Form, sortiert nach Häufigkeit
(`castStats.js` liest `entry.references`, Anzeige `CastGroup.jsx`).
Ein Traum zählt einmal; Seed-Träume zählen nicht (references leer);
Löschen sitzt im Dialog und die Träume BEHALTEN ihre references;
Gattungswahl erscheint, wenn KEINE `category` übergeben wird.

**Das Muster dahinter, dreimal bestätigt (Kaufblatt, Besetzung, Filme):**
Die App speichert mehr, als sie zeigt. Wer eine Ansicht anfasst, frage
zuerst: Welche gespeicherte Information fehlt hier noch?

## Das Kaufblatt

Zwei Kacheln mit der Ware selbst (`Paywall.jsx:144`), Auswahl dreistufig
in `src/lib/showcase.js` (eigene Träume → Seed/Dummy → Glyph), mit
Rückhand `stillsBackup`/`filmsBackup` falls Eigenes nicht LÄDT.
⚠ Dummy-Film ist Platzhalter (`Paywall.jsx:25`), Austausch = eine Zeile.
⚠ Gefüllte Glyphen NICHT in `icons.jsx` (dessen Satz bleibt ungefüllt).

## Geld — Preise, Töpfe, Kaufwege

**Es kassiert weiterhin niemand.** Preisliste (`src/lib/plans.js`):
Woche $4,99/12 · Monat ★ $9,99/45 · Jahr $79,99/45 p.M. · Pakete
$2,99/6, $7,99/18, $14,99/32 (bleiben). Regeln in `plans.test.js`:
kein geteilter Preispunkt, jedes Paket je Credit teurer als jedes Abo.
Zwei Töpfe (`credits.js`): `allowance` wird je Periode GESETZT,
ausgegeben wird zuerst das Verfallende. Kaufblatt öffnet von überall
(`openPaywall(reason)`; browse/spent/first) — bewusst NICHT am
Onboarding-Ende.

## Schranke vor den teuren Endpunkten

`src/lib/gatekeeper.js`, oben in `server.js`s `fetch`: Mengenbegrenzung
je Absender (generate 20/min, text 40/min, cheap 120/min), optionales
`API_TOKEN`. ⚠ Voreinstellung ist die strengste: alles unter `/api/`
begrenzt, außer `UNLIMITED` (`/api/job`, `/api/voice`). KEINE
Benutzerverwaltung.

## Die Persona — und der Regisseur

„Der coole Nachtportier" (`PERSONA`-Block in `server.js`) speist beide
Gesprächs-Briefings. **Dieselben zwei Regeln tragen den `DIRECTOR`:**
keine Beispielsätze (verbiegen die Sprache), Verbote allein erzeugen
Neutralität. Der Regisseur hat drei eigene Anti-Drift-Regeln aus echten
T0-Abdriften — `director.test.js` schlägt an, wenn eine verloren geht.

## Der Sprachassistent (Gemini Live)

Zwei Modi über `/api/voice` (dream/onboarding), Stimme wird einmal
gewählt, sechs Stimmen in `voices.js` (gespiegelt in `server.js`),
Proben über `/api/voice-sample` (Gemini TTS, gecacht). ⚠ Verbindung
direkt an den API-Port (Vite-Proxy reicht WebSockets unter Bun nicht
durch); Gemini antwortet ausschließlich in Binärframes.

## Bilder, Filme, Teilen

- **Schnellvorschau** (`Step5Style.jsx`, `isPreview`): 3 Panels aus EINEM
  Rendering, 1 Credit, ein Drittel der Auflösung.
- **Charakterbögen** (`/api/character`, 2 Credits): neutrales
  Referenzporträt ohne styleId. T4 bewies: trägt als Videoreferenz.
- **Abspann** (`/api/film-outro`): Karte im Browser, ffmpeg auf dem
  Server. ⚠ ffmpeg ist ein Systemprogramm; fehlt es → 501.
- **`dreamsFor` berechnet den Filmpreis aus `video.js`** (Standard-Satz).
- **Traum-Medien nur über `entryMedia.js`** lesen, nie `entry.media`.
- **Filme über `queue.fal.run`:** `status_url`/`response_url` WÖRTLICH
  speichern, nie aus dem Slug rekonstruieren.
- ⚠ Renderzeiten schwanken stark (gemessen 4 s → 6 min, 15 s → 3,5 min).

## Die Serie belohnt, sie bestraft nie

`streak.js`: Seltenheitsverschiebung, Deckel 14 Nächte. Keine Countdowns,
nichts Eingefrorenes, keine Verlustdrohung.

## Farben, Gestaltung, Sprache

- Hintergrund einmal als `--bg-rgb` in `tokens.css`; Warm ist selten und
  heißt „Weg nach vorn" (immer mit `color: var(--bg)`).
- Icons aus einem ungefüllten SVG-Satz; Ausnahmen in eigene Dateien.
- Videos nie per `filter` dimmen; per Vite-Import einbinden.
- RTL: logische Eigenschaften, `test-rtl.mjs` erzwingt es; `[data-flip]`
  für richtungstragende Zeichen; zentrieren mit `inset-inline: 0` +
  `margin-inline: auto`, nie `translate(-50%)`.
- Plural: Zahl neben Wort ⇒ Funktion (`creditsN`, `yieldImages`,
  `yieldFilms`, `castDreamsN`).

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 153 Unit + 50 Freigabe + Hygiene + Kontrast + i18n + RTL

⚠️ 5173/8100/5174 sind verschiedene Herkünfte mit getrenntem
`localStorage`. `preview_start` bedient das Hauptrepo; im Worktree
`bun install` (nie verlinken) und `bunx vite --port 5174`.
⚠️ Vor dem Debuggen von „API antwortet komisch": prüfen, WESSEN Prozess
auf 8100 liegt — am 18.08. lief dort ein tagealter Server mit altem Code.

## Provider und Preise

| | Modell | Kosten |
|---|---|---|
| Bild | `fal-ai/nano-banana-2` (1K) | **$0,08** je Bild |
| Bild mit Referenz | `.../edit` — Pflicht | $0,08 |
| Film Lebendig | `minimax/h3/image-to-video` 768P | $0,08/s · 5–15 s |
| Film Regie | `bytedance/seedance-2.0/fast/reference-to-video` 720p | $0,2419/s · 4–15 s · 9 Refs · Ton |
| Film Kino | `bytedance/seedance-2.5/image-to-video` 720p | $0,473/s · 4–30 s · Ton |
| Diktat | `fal-ai/wizper` | $0,0005 je Minute |
| Analyse/Regie | `deepseek-v4-flash` | $0,00026 je Aufruf, **ohne max_tokens!** |
| Stimmproben | `gemini-3.1-flash-tts-preview` | einmalig je Stimme+Sprache |

⚠ Die Queue prüft Dauern erst beim RENDERN — die Klemme läuft
serverseitig durch `videoSubmitBody` (dieselbe Tabelle wie der Preis).

**Zeichenlimit je Modell** (`promptMax`, recherchiert 19.08.): H3 7 000 ·
Seedance 2.0 5 000 · Seedance 2.5 10 000.

⚠ **Die obige Zuordnung Stufe↔Endpoint ist unsere WAHL, kein Modelllimit**
(19.08.). Es gibt auch `minimax/h3/reference-to-video` (9 Refs, $0,06/s
@768p, erste 5 Refs gratis — **billiger als unser jetziger Lebendig-Pfad,
MIT Referenzen**) und `seedance-2.5/reference-to-video` (30 Refs). H3
adressiert dabei anders als Seedance: `<Picture N>` + `subject_definitions`
statt `@ImageN`. Messen, dann neu zuschneiden — Plan §10/§10a.

**Billigere Bildmodelle** (19.08.): `nano-banana-2-lite` $0,0336 statt
$0,08 (nur 1K, für 9:16 ausreichend) — ob fal einen edit-/Referenz-Pfad
dafür hat, ist UNGEPRÜFT. Plan `2026-08-19-bildmodelle-preise.md`.

## Geschäftsmodell

MwSt. geht in der EU VOR der Store-Provision ab; **Small Business
Program (15 %) ist Voraussetzung.** Break-even-Conversion ~4,5–5 %,
Deckungsbeitrag Monat $4,44. Conversion ist die erste Kennzahl nach
Launch.

## Sicherheit

- Web-Wurzel `dist/`; `/media/` nur über `resolveMedia()`.
- Allowlisten statt Interpolation: `voice`, `mode`, `lang`,
  `aspectRatio`, `category`, **`model`** (unbekannt → standard).
- Regisseur-Ausgang: `sanitizePromptText` + mechanische @Tag-Prüfung —
  Modellausgabe ist so untrusted wie Nutzereingabe.
- Offen: Datenschutz (Referenzfotos/Sprachaufnahmen/Umfrage an
  fal.ai/Google) · Credits sind Buchhaltung, keine Zugangskontrolle.

## Bekannte Baustellen

- **Kein Zahlungsanbieter.** Der Kaufknopf sagt es ehrlich.
- **Kein echter bezahlter Film durch die UI gefahren** (der Schlussstein).
- Dummy-Film im Kaufblatt (`Paywall.jsx:25`).
- **Schnellvorschau liefert 448 px breite Panels** — Nebenprodukt der
  1K-Vorgabe, nie entschieden. Bei 2K wären es 896 px für $0,12 statt
  $0,08 (Plan Bildmodelle §3).
- **Kein einziger echter Modellaufruf ist gelaufen** — die Sandbox blockt
  fal.ai und api.deepseek.com. Alles unten ist gebaut und getestet, nichts
  ist live bestätigt.
- Bilderstrecke teilt nach Sätzen; Symbolerkennung nur Englisch;
  localStorage ~5 MB als Limit; kein `bun run lint`.

## Nächste Schritte

1. **Trockenlauf `--live`** (~$0,0005, rendert nichts) — der billigste
   erste Schritt: zeigt die echten DeepSeek-Antworten auf das neue
   Material.
2. **Schlusstest:** ein echter Film je Stufe durch die App (~$2 gesamt),
   dabei T3 (Abspann) gleich mit.
3. **Die zwei Messungen** aus Plan §10 (Film-Endpoints) und Plan
   Bildmodelle §4 (nano-banana-2-lite) — danach Stufen und Bildpreise neu
   zuschneiden. Antons Linie: Modellpreise weitergeben, nicht künstlich
   verknappen.
4. **Capacitor + StoreKit + RevenueCat** — der Hebel, der alles
   multipliziert. Ab hier ist die App feature-seitig bereit dafür.
5. Dummy-Film ersetzen (Anton) · T5 (30 s mit Referenzen, verkettet).
6. Small Business Program · Push · Web-Funnel + Stripe · Datenschutz
   (Liste in `2026-08-16-positionierung-und-store.md`).
7. Startmenü und Seed-Journal entfernen — beides auf Antons Wort.

## Pläne

- `docs/plans/2026-08-17-film-regie.md` — umgesetzt; **§10/§10a sind der
  offene Messauftrag** (Referenz-Endpoints, Adressierung je Modellfamilie).
- `docs/plans/2026-08-19-bildmodelle-preise.md` — **neu, offen:**
  Lite-Messung und die 448-px-Vorschau.
- `docs/plans/2026-08-19-storyboard-vor-dem-film.md` — Stufe A umgesetzt;
  Stufe B (Beats abwählen) liegt bewusst auf Eis, bis Stufe A benutzt wurde.
- `docs/plans/2026-08-16-wachstumsplan.md` — umgesetzt: 2, 3, 6, 7, 9.
- `docs/plans/2026-08-16-positionierung-und-store.md` — Store-Texte, offen.

## Werkzeuge

- `node scripts/dry-run-prompts.mjs [--live]` — der ganze Weg vom Traum
  zum fal-Auftrag, jeder Prompt im Volltext. Ohne `--live` kostenlos und
  ohne Netz; mit `--live` zwei echte DeepSeek-Aufrufe (~$0,0005). Bild und
  Video werden NIE ausgelöst. **Vier der fünf Fehler vom 19.08. sind beim
  Lesen dieser Ausgabe aufgefallen, nicht beim Lesen des Codes.**
