# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-19 (00:00) — Branch `session/2026-08-18-anton`, PR #14

## Die Filmstufen sind LIVE — es fehlt nur der Schlussstein

Der Film-Plan (`docs/plans/2026-08-17-film-regie.md`) ist umgesetzt,
§9 Schritte 1–4. Drei Stufen, wählbar im Wizard, in sieben Sprachen:

| Stufe | dahinter | Credits/s | Dauer | kann |
|---|---|---|---|---|
| **Lebendig** | minimax/h3 (768P) | 1 | 5–15 s | 1 Bild animieren, Ton |
| **Regie** | seedance-2.0 **Fast** R2V (720p) | 4 | 5–15 s | **bis 9 Referenzen** — die Besetzung ist IM Film sie selbst, Ton |
| **Kino** | seedance-2.5 (720p) | 6 | 5–30 s | lange Einstellung, 1 Startbild, Ton |

**Jeder Film bekommt einen Regisseur:** `deepseek-v4-flash` schreibt aus
Traum + Startbild (+ Referenzen) einen Bewegungs-Prompt nach dem
destillierten CINEDANCE-Bauplan (`src/lib/director.js`, getestet). Kür,
nie Pflicht — jeder Fehler fällt auf den alten Zustand zurück.
⚠ KEIN `max_tokens` am DeepSeek-Aufruf (Denkmodell — Antwort käme leer).

**Die Reihenfolge-Invariante lebt jetzt zweistufig:** `filmReferences()`
wählt und ordnet (Personen vor Tieren vor Orten, Startbild fest auf
@Image1); Materialliste des Regisseurs und `image_urls` an fal entstehen
aus DERSELBEN Auswahl. Wer sie auseinanderlaufen lässt, gibt Menschen die
Gesichter der anderen (siehe promptBuilder.js-Kopf).

**Bestellwissen wohnt in EINER Tabelle** (`videoSubmitBody`,
`src/lib/video.js`): Slug, Dauerklemme je Modell, Auflösung, ob
`generate_audio` existiert (minimax kennt es nicht — unbekanntes Feld
kann den bezahlten Auftrag kosten). Preis, UI und Server lesen dieselbe
Tabelle; `video.test.js` nagelt fest, dass Preis und Bestellung dieselben
Sekunden klemmen. Eintrag [0] muss `standard` bleiben (Rückfallziel für
unbekannte IDs — der falsche BILLIGE Film ist der harmlosere Fehler).

**Was fehlt:**
- **Der Schlussstein: ein echter bezahlter Film durch die App-Oberfläche**
  (Lebendig 5 s ≈ $0,48 · Regie 5 s ≈ $1,45). Auf Antons Go.
- T3 (Abspann an Seedance-Film): risikoarm — gleiche Codecs (h264+AAC)
  wie der verifizierte minimax-Fall — aber ungefahren.
- T5: „30 s MIT Referenzen" per Video-Verkettung. Bis dahin ist Kino
  ehrlich ein Ein-Bild-Angebot.

**Teststand:** T0/T1/T2/T4 erledigt (zusammen ~$3,10, Ergebnisse in
`media/tests/` des Hauptrepos — gerätelokal, ignoriert). T2-Urteil:
Fast und Normal gleichwertig, 720p klar über Mini → Regie bleibt Fast.

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
- Bilderstrecke teilt nach Sätzen; Symbolerkennung nur Englisch;
  localStorage ~5 MB als Limit; kein `bun run lint`.

## Nächste Schritte

1. **Schlusstest:** ein echter Film je Stufe durch die App (~$2 gesamt),
   dabei T3 (Abspann) gleich mit.
2. **Capacitor + StoreKit + RevenueCat** — der Hebel, der alles
   multipliziert. Ab hier ist die App feature-seitig bereit dafür.
3. Dummy-Film ersetzen (Anton) · T5 (30 s mit Referenzen, verkettet) ·
   T6 (hailuo-02 als billigerer Lebendig-Unterbau).
4. Small Business Program · Push · Web-Funnel + Stripe · Datenschutz
   (Liste in `2026-08-16-positionierung-und-store.md`).
5. Startmenü und Seed-Journal entfernen — beides auf Antons Wort.

## Pläne

- `docs/plans/2026-08-17-film-regie.md` — **umgesetzt** bis auf
  Schlusstest/T3/T5/T6; Teststand im Dokument nachgeführt.
- `docs/plans/2026-08-16-wachstumsplan.md` — umgesetzt: 2, 3, 6, 7, 9.
- `docs/plans/2026-08-16-positionierung-und-store.md` — Store-Texte, offen.
