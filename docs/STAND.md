# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-17 (23:50) — Branch `session/2026-08-17-anton`, PR #13

## ⚠ Morgen geht es HIER weiter: der Film-Plan ist getestet, nicht umgesetzt

`docs/plans/2026-08-17-film-regie.md` — drei Videomodell-Stufen (Lebendig
1 Cr/s · Regie 4 Cr/s · Kino 6 Cr/s), ein destillierter CINEDANCE-Regisseur
über DeepSeek Flash, Referenzen bis ins Videomodell. Die Machbarkeit ist
**bewiesen** (Tests vom 17.08., zusammen ~$0,94):

- **T0:** Regisseur-Prompts halten Bauplan und @Tag-Disziplin (mechanisch
  geprüft). ⚠ DeepSeek OHNE `max_tokens` aufrufen — das Denkmodell schreibt
  erst ins Denkfeld, ein Deckel lässt die Antwort leer zurückkommen.
- **T1:** Seedance-R2V nimmt **data-URIs**; @Image-Zuordnung stimmt
  (Figur aus Bild 1 im Raum aus Bild 2); AAC-Ton kommt mit.
- **T4:** Ganze Produktkette (Charakterbogen → Regisseur → Mini-R2V 15 s):
  **Identität hält über zwei Ortswechsel.** Ergebnisdateien in
  `media/tests/` des Hauptrepos (ignoriert, gerätelokal).

**Reihenfolge für morgen steht im Plan §9 — Schritt 1 ist der Bugfix:**
Die Modellwahl erreicht den Server nicht (`Step5Style.jsx:100` schickt
`videoModel` nicht mit, der Server liest kein `body.model`) — **Premium
wird heute berechnet, minimax geliefert und auf 15 s geklemmt.** Außerdem
bekommt der Film heute wörtlich einen STANDBILD-Prompt
(`Step5Style.jsx:105`, „photoreal film still").

**Offen, auf Antons Go:** T2 (Fast/Normal-Qualitätsvergleich, ~$2,20) —
das Mini-Tier war so gut, dass „Regie" womöglich billiger geht als die
geplanten 4 Cr/s. Und die vier Fragen in Plan §8.

## Woran wird gearbeitet

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI macht
daraus eine Bildstrecke und optional einen kurzen Film. **Vier Tabs**, der
Wizard öffnet sich über der Tab-Leiste.

| Tab | Inhalt |
|---|---|
| Home | Begrüßung, Faultier-Film als Posterkarte, Serien-Zeile, letzter Traum, Menagerie |
| Journal | Kartenstapel **oder** Liste, Kalender, Detail mit Film+Bildern, **Besetzung** |
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
Render-Cache** sind weg. Träume im Browser-Tagebuch, die auf `/media/<hash>`
zeigen, laufen ins Leere. Kein Backup vorhanden (keine Time Machine).

**Ursache, damit es sich nicht wiederholt:** `.gitignore` sagte `media/` —
mit Schrägstrich, das passt **nur auf Verzeichnisse**. Ein Symlink dieses
Namens war nicht ignoriert, wurde committet, und der nächste Checkout
ersetzte den echten Ordner durch den Link. Jetzt `/media` und
`node_modules`, beide ohne Schrägstrich (`.gitignore:2` und `:41`). **Wer
eine dieser Zeilen wieder kürzt, stellt die Falle erneut.** Und allgemeiner:
Was unter einem ignorierten Pfad liegt und nicht ersetzbar ist, gehört
woandershin.

## Die Besetzung — eine Rollenliste (neu 17.08.)

`Journal → Deine Besetzung`: Abspann-Form statt dreier Kachelraster. Name
in Serife links, **Häufigkeit rechts, sortiert nach Häufigkeit** — die
Zählung kommt aus `src/lib/castStats.js` und liest `entry.references`.
Anzeige: `CastGroup.jsx`; `AvatarList.jsx` ist entfallen.

Vier Regeln mit Begründung im Code:
- **Ein Traum zählt einmal**, auch wenn die Figur doppelt drinsteht.
- **Seed-Träume zählen nicht** — ohne Sonderfall, sie tragen `references: []`.
- **Löschen sitzt im Dialog** (`AvatarDialog`), nicht an der Zeile — und die
  Träume BEHALTEN ihre `references`: dass eine Figur vorkam, bleibt wahr.
- **Die Gattungswahl** erscheint im Dialog, wenn KEINE `category` übergeben
  wird — das Fehlen ist das Signal; der Wizard übergibt seine weiter.

Ohne Foto steht der **Anfangsbuchstabe** (über den Zeichenpunkt gelesen,
Emoji-sicher), nie ein Fragezeichen.

**Das Muster dahinter, zweimal bestätigt (Kaufblatt, Besetzung):** Die App
speichert mehr, als sie zeigt. Wer eine Ansicht anfasst, frage zuerst:
Welche gespeicherte Information fehlt hier noch?

## Das Kaufblatt — was es zeigt und woher

**Zwei Kacheln statt zweier Strichsymbole** (`Paywall.jsx:144`): links
laufende Standbilder, rechts ein Film, Zahl als Bildunterschrift. Auswahl
dreistufig in `src/lib/showcase.js`: eigene Träume → Seed/Dummy → Glyph.

⚠ **Stufe 2 greift auch, wenn Stufe 1 existiert, aber nicht LÄDT**
(`stillsBackup`/`filmsBackup`) — sonst wäre die Kaufseite eines
Vielträumers ärmer als die eines neuen Nutzers.

⚠ **Der Dummy-Film ist ein Platzhalter** (`Paywall.jsx:25`,
`home-faultier.mp4`). Austausch = eine Zeile; Anforderungen im Kommentar.

⚠ **Die gefüllten Glyphen stehen NICHT in `icons.jsx`** (dessen Satz ist
ungefüllt — Ausnahmen bekommen eine eigene Datei: `ShowcaseGlyph.jsx`).

## Geld — Preise, Töpfe, Kaufwege

**Es kassiert weiterhin niemand.** Kein Zahlungsanbieter, kein Store-Konto,
kein serverseitiges Guthaben.

**Preisliste** (`src/lib/plans.js`):

| | Preis | Credits | je Credit |
|---|---|---|---|
| Woche | $4,99 | 12 / Woche | $0,416 |
| Monat ★ | $9,99 | 45 / Monat | $0,222 |
| Jahr | $79,99 | 45 / Monat | $0,148 |
| Paket S | $2,99 | 6, bleiben | $0,498 |
| Paket M | $7,99 | 18, bleiben | $0,444 |
| Paket L | $14,99 | 32, bleiben | $0,468 |

**Zwei Regeln in `plans.test.js`:** kein Paket teilt einen Preispunkt mit
einem Abo, jedes Paket ist je Credit teurer als jedes Abo. **Zwei
Guthaben-Töpfe** (`credits.js`): `credits` bleibt, `allowance` wird je
Periode GESETZT; ausgegeben wird zuerst das Verfallende. **Das Kaufblatt
öffnet von überall** über `openPaywall(reason)`; Anlässe `browse`/`spent`/
`first`. Der Aha-Moment liegt bewusst NICHT am Onboarding-Ende („Dein
erster Traum geht auf uns" — direkt danach Geld zu fordern wäre der
Widerspruch).

## Schranke vor den teuren Endpunkten

`src/lib/gatekeeper.js`, oben in `server.js`s `fetch`: Mengenbegrenzung je
Absender (`generate` 20/min, `text` 40/min, `cheap` 120/min) plus
optionales `API_TOKEN`. ⚠ **Voreinstellung ist die strengste:** alles
unter `/api/` ist begrenzt, sofern nicht in `UNLIMITED` (`/api/job`,
`/api/voice`). Eine Liste kann einen vergessenen Endpunkt nicht verhindern
— eine Voreinstellung schon. Bleibt trotzdem KEINE Benutzerverwaltung.

## Die Persona — eine Stimme, überall dieselbe

„Der coole Nachtportier", ein `PERSONA`-Block in `server.js` speist beide
Briefings. **Zwei Regeln, die Blut gekostet haben:** keine Beispielsätze im
Prompt (verbiegen die Sprache), und Verbote allein erzeugen Neutralität.
Der Charakter fällt als Erstes weg, wenn ein Traum bedrückend wird.
**Dieselben zwei Regeln gelten für den kommenden `DIRECTOR`-Block.**

## Der Sprachassistent (Gemini Live)

Zwei Modi über denselben Relay (`/api/voice`): `dream` und `onboarding`.
Stimme wird genau einmal gewählt, danach Profil → Zahnrad; sechs Stimmen in
`voices.js`, gespiegelt in `server.js`. Vorhören über `/api/voice-sample`
(Gemini TTS, gleicher Katalog, je Stimme+Sprache gecacht). ⚠ Verbindung
**direkt an den API-Port** (Vite-Proxy reicht WebSockets unter Bun nicht
durch); Gemini antwortet **ausschließlich in Binärframes**.

## Bilder, Filme, Teilen

**Schnellvorschau** (`Step5Style.jsx:37`): 3 Panels aus EINEM Rendering,
1 Credit, ein Drittel der Auflösung — der Gratis-Traum rendert voll.

**Charakterbögen** (`/api/character`, 2 Credits): neutrales Referenzporträt
ohne `styleId` — sonst wäre die Figur nicht stilübergreifend nutzbar.
**T4 hat bewiesen, dass ein solcher Bogen als Videoreferenz trägt.**

**Abspann beim Teilen** (`/api/film-outro`): Karte im Browser gezeichnet,
zusammengefügt serverseitig. ⚠ **ffmpeg ist ein Systemprogramm** — fehlt es
→ 501, und geteilt wird unverändert.

**`dreamsFor` berechnet den Filmpreis aus `video.js`**, nie hart
hinschreiben. **Traum-Medien liest man über `entryMedia.js`** (`filmOf`,
`imagesOf`), nie `entry.media` direkt.

## Die Serie belohnt, sie bestraft nie

`streak.js`: Seltenheitsverschiebung, gedeckelt bei 14 Nächten. ⚠ Keine
Countdowns, nichts Eingefrorenes, keine Verlustdrohung — Begründung im
Kopf der Datei.

## Farben, Gestaltung, Sprache

- Hintergrund existiert **einmal** als `--bg-rgb` in `tokens.css`.
- **Warm ist selten und heißt „Weg nach vorn".** Immer mit `color: var(--bg)`.
- Icons aus **einem** ungefüllten SVG-Satz; Ausnahmen in eigene Dateien.
- **Videos nie per `filter` dimmen**, immer Verlaufs-Scrim; per Vite-Import.
- **RTL:** logische Eigenschaften, `test-rtl.mjs` erzwingt es; `[data-flip]`
  für richtungstragende Zeichen. ⚠ `transform` kennt keine logischen
  Achsen — zentrieren mit `inset-inline: 0` + `margin-inline: auto`.
- **Plural:** Zahl neben Wort ⇒ Funktion (`creditsN`, `yieldImages`,
  `yieldFilms`, `castDreamsN`). Arabisch: Einzahl, Zweizahl, 3–10, Einzahl.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 133 Unit + 50 Freigabe + Hygiene + Kontrast + i18n + RTL

⚠️ 5173/8100/5174 sind **verschiedene Herkünfte mit getrenntem
`localStorage`**. `preview_start` bedient das **Hauptrepo**; im Worktree
`bun install` (nicht verlinken!) und `bunx vite --port 5174`.

## Provider und Preise

| | Modell | Kosten |
|---|---|---|
| Bild | `fal-ai/nano-banana-2` (1K) | **$0,08** je Bild |
| Bild mit Referenz | `.../edit` — Pflicht | $0,08 |
| Video heute | `minimax/h3/image-to-video` (768P) | **$0,08/s**, 5–15 s |
| Video geplant | `bytedance/seedance-2.0/…/reference-to-video` | Mini $0,0433/s · Fast $0,2419/s, 4–15 s, 9 Refs, Ton |
| Video geplant | `bytedance/seedance-2.5/image-to-video` | $0,473/s, 4–30 s, 1 Startbild, Ton |
| Diktat | `fal-ai/wizper` | $0,0005 je Minute |
| Analyse/Regie | `deepseek-v4-flash` | $0,00026 je Aufruf, **ohne max_tokens!** |
| Stimmproben | `gemini-3.1-flash-tts-preview` | einmalig je Stimme+Sprache |

⚠ Die Queue prüft Mindestdauern erst beim RENDERN — ein zu kurzer Wert
verbrennt Credits. `clampSeconds()` fängt es clientseitig ab; die
serverseitige Klemme je Modell kommt mit der Umsetzung.
⚠ Renderzeiten der Queue schwanken stark (gemessen: 4 s → 6 min,
15 s → 3,5 min) — die UI muss Wartezeit ehrlich behandeln.

## Geschäftsmodell

MwSt. geht in der EU VOR der Store-Provision ab; mit Gratis-Credits je
Install ist der 30-%-Schnitt defizitär — **Small Business Program (15 %)
ist Voraussetzung.** Break-even-Conversion ~4,5–5 %, Deckungsbeitrag Monat
$4,44. **Conversion ist die erste Kennzahl nach Launch.**

## Sicherheit

- Web-Wurzel `dist/`; `/media/` nur über `resolveMedia()` (Hash+Endung).
- **Allowlisten statt Interpolation:** `voice`, `mode`, `lang`,
  `aspectRatio`, `category` — und künftig `model` für den Film.
- Auch der Regisseur-Ausgang läuft durch `sanitizePromptText` plus eine
  mechanische @Tag-Prüfung — Modellausgabe ist so untrusted wie Nutzereingabe.
- **Offen — Datenschutz:** Referenzfotos, Sprachaufnahmen, Umfrage gehen an
  fal.ai/Google; vor Veröffentlichung Hinweis + Einwilligung nötig.
- **Offen — Credits sind Buchhaltung, keine Zugangskontrolle.**

## Bekannte Baustellen

- ⚠ **Premium-Film wird berechnet, minimax geliefert** — Befund 2 des
  Film-Plans, Fix ist morgen Schritt 1 (siehe ganz oben).
- **Kein Zahlungsanbieter.** Der Kaufknopf sagt es ehrlich.
- **Dummy-Film im Kaufblatt** (`Paywall.jsx:25`).
- `status_url`/`response_url` **wörtlich speichern**, nie rekonstruieren.
- Bilderstrecke teilt nach Sätzen; Symbolerkennung nur Englisch;
  localStorage ~5 MB als Limit; kein `bun run lint`.

## Nächste Schritte

1. **Film-Regie umsetzen** — Reihenfolge in Plan §9, Bugfix zuerst.
   Danach T2 auf Antons Go.
2. **Capacitor + StoreKit + RevenueCat** — der Hebel, der alles multipliziert.
3. **Dummy-Film ersetzen** (Anton), eine Zeile.
4. Small Business Program · Push · Web-Funnel + Stripe · Datenschutz
   (Liste in `2026-08-16-positionierung-und-store.md`).
5. **Startmenü und Seed-Journal entfernen** — beides auf Antons Wort.

## Pläne

- `docs/plans/2026-08-17-film-regie.md` — **aktiv, morgen dran.**
- `docs/plans/2026-08-16-wachstumsplan.md` — umgesetzt: 2, 3, 6, 7, 9.
- `docs/plans/2026-08-16-positionierung-und-store.md` — Store-Texte, offen.
