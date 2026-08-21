# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-21 (12:01) — Branch `claude/new-session-x9qv1w`
(PR #18, **Entwurf** — die Oberfläche zu P2 fehlt noch)

## Woran gerade gearbeitet wird

**Mehrwert-Plan P2** (`docs/plans/2026-08-21-mehrwert-inhalte.md`).
Der Rechenteil steht und ist getestet, **die Oberfläche fehlt**:

- `src/lib/checkin.js` — Morgen-Check-in („Wie hast du geschlafen?",
  drei Stufen). `checkinOn` · `setCheckin` (kappt bei 400) ·
  `sleepAverage` · `sleepByMood`. 12 Tests.
  ⚠ Nur EINE Frage, nicht zwei wie im Plan (Antons Entscheidung
  21.08.): die Stimmung kommt aus `analysis.mood`.
- `src/lib/atlas.js:137` — `recurrenceFor(journal, entry)`: was an
  DIESEM Traum schon einmal da war, mit `entryIds` zum Antippen.
  `minCount` bewusst 1. 6 Tests.
- `package.json:12` — Tests laufen unter `TZ=Europe/Berlin`.

**Der nächste Schritt ist genau dieser Wirkungsradius:**
`components/MorningCheckin.jsx` (+CSS) · `components/Recurrence.jsx`
(+CSS) · `screens/Home/HomeScreen.jsx` + `home.css` ·
`screens/Journal/JournalDetail.jsx` (Hinweis ÜBER der Reflection) ·
`lib/storage.js` (neues Feld `checkins: []`) · `i18n/*.js` (alle
sieben) · `docs/`.

## Klickbare Wolken-Vorschau

Der Build als eine eigenständige HTML-Datei, veröffentlicht als
Artifact: **https://claude.ai/code/artifact/7a42cf64-fe13-49f2-a31e-46b67afb5616**
Alles Lokale funktioniert (Journal, Traumatlas, Storyboard, Filmmenü,
Sleep, Consent-Tor, sieben Sprachen), **Erzeugen nicht** — dafür braucht
es den schlüsselhaltenden Server. Zum Auffrischen: `bun run build`, dann
das Bündelskript im Scratchpad neu laufen lassen und denselben Dateipfad
erneut veröffentlichen (gleiche URL). Bewusst NICHT im Repo: es ist ein
Vorschau-Werkzeug, kein Produkt.

## Die Filmstufen und Bildpfade (Neuzuschnitt vom 20.08., unverändert)

| | Modell | Einkauf | Verkauf |
|---|---|---|---|
| Bild (alle Pfade) | `google/nano-banana-2-lite` (fest 1K) | ~$0,042 | 1 Credit |
| Film Lebendig | `minimax/h3/reference-to-video` 768P | $0,06/s | 1 Cr/s · 5–15 s · 4 Cast-Refs gratis |
| Film Regie | `bytedance/seedance-2.0/fast/reference-to-video` 720p | $0,2419/s | 4 Cr/s · 5–15 s |
| Film Kino | `bytedance/seedance-2.5/reference-to-video` 720p | $0,473/s | 6 Cr/s · 5–30 s |
| Analyse/Regisseur/Reflection | `deepseek-v4-flash` | ~$0,0003 | gratis · **ohne max_tokens!** |

Modellwissen lebt in `video.js` (`refsField`/`refStyle`/`aspect`/
`noExpand`); der Regisseur spricht je Modell die richtige Syntax
(@Image1 / [Image1] / „Image 1"), `checkDirectedPrompt` liest alle drei.
⚠ H3-Geldfallen bleiben verriegelt: „768P" ausdrücklich (Vorgabe 2K),
`enable_prompt_expansion:false`. Jede Renderer-Kachel nennt ihr Modell
und trägt ein ⓘ mit Stärken/Grenzen — keine künstliche Verknappung,
Referenzbilder gibt es auf allen drei Stufen.

**Bogen-Pflicht** (`lib/sheets.js` + Step5Style + /api/character): Fotos
von Personen/Tieren werden beim ersten BEZAHLTEN Render zum Charakterbogen
normalisiert (träge · gratis · veraltbar per Fingerabdruck; Orte
ausgenommen; Fallback rohes Foto).

**Consent-Gate** (`components/ConsentGate.jsx`): drei Häkchen (AGB/
Datenschutz · Datenverarbeitung · 18+) nach Sprachwahl, vor Onboarding
UND App; `state.consent {v, at}`, CONSENT_VERSION öffnet bei
Textänderung erneut. AI-Act Art. 50 gilt seit 02.08.2026.

## ⚠ Der Schlussstein steht weiter aus

Kein echter Film seit dem Neuzuschnitt gerendert. Verdrahtung per
Nullkosten-Probe bewiesen (401 nennt das richtige Modell), der Beweis
mit Geld fehlt: je ein Film pro Stufe durch die App-UI (~$2–5), T3
(Abspann) gleich mit.

## Bekannte Baustellen

- **Mehrwert-Plan** (`2026-08-21-mehrwert-inhalte.md`): P1 gebaut; P2a
  und P2b halb (Rechnung ja, Oberfläche nein); offen P2c
  Traumzeichen-Karten · P3a Albtraum-Umschreiben (Wortlaut mit
  Rechtsplan abstimmen) · P3b Einschlaf-Timer.
- **Recht** (Plan recht-einwilligung §4, Punkte 2–6): Upload-Zusicherung
  im AvatarDialog · KI-Kennzeichnung/C2PA · Speicherfristen für /media
  (heute unbegrenzt) · **DeepSeek-China-Entscheidung** · docs/legal/ +
  Widerrufsweg. Anwalt vor Store-Launch.
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx:25`).
- **Antons Preisentscheidung offen:** 85 % Marge halten oder
  Modellpreise durchreichen. Seine Linie ist Durchreichen — die
  Preisliste ist noch nicht danach gerechnet.
- Symbol-ERKENNUNG weiter nur englische Stichwörter (`symbols.js`) —
  abgefedert, weil Atlas/Symbole/`recurrenceFor` zusätzlich auf den
  immer englischen Beats der Analyse erkennen. Ein deutscher Traum OHNE
  Analyse liefert dort nichts. Deutsche Stichwortlisten wären der
  Vollausbau.
- Direktanbieter-Schwellen (Plan direktanbieter-preise §5): Kino-Nutzung
  ⇒ BytePlus messen (2 Mio. Gratis-Tokens) · >$200 fal/Monat ⇒ Bilder zu
  Google direkt · H3 nie direkt (fal ist billiger als der Hersteller).
- Bilderstrecke teilt nach Sätzen; localStorage ~5 MB; kein `bun run lint`.

## Was die App ist

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI
macht daraus Bildstrecke, optional Film, Reflection und Muster. **Vier
Tabs**, Wizard über der Tab-Leiste.

| Tab | Inhalt |
|---|---|
| Home | Begrüßung, Faultier-Film, Serien-Zeile, letzter Traum, Menagerie |
| Journal | Kartenstapel/Liste, Kalender, Kino-Detail mit Storyboard + Reflection, Besetzung + Traumatlas |
| **⊕** | Wizard: Traum → Ausgabe → Personen → Orte → Style → Ergebnis |
| Sleep | Alles gratis: Checkliste, Sound-Mixer, Klartraum-Leitfaden, Symbole |
| Profil | Porträt, Guthaben-Pille, Einstellungen, „Was du mir erzählt hast" |

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter);
`server.js` als schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini).
Zustand in `localStorage` (`dreamrushes_v1`). **Sieben Sprachen**, alle
Texte in `src/i18n/<id>.js`, `check-i18n-shape.mjs` erzwingt Form+Arität.
Doku und Commits deutsch.

## ⚠ Stehende Entscheidungen und Fallen

- **Startmenü bleibt** (fragt jeden Start) und **Seed-Journal bleibt** —
  bis Anton ausdrücklich anderes sagt. Seeds erkennt man am
  `e_seed`-Präfix; Atlas, `recurrenceFor` und castStats zählen sie nicht.
- **i18n-Blöcke zeilenverankert (`^`) einfügen.** `"  errors: {"` trifft
  als Teilzeichenkette das tiefer eingerückte `voice.errors` —
  `check-i18n-shape.mjs` bleibt dabei GRÜN, weil es Gleichheit prüft,
  nicht Richtigkeit. Der Fehler zeigt sich erst zur Laufzeit im Browser.
- **Ein Test, der nur auf manchen Maschinen etwas bewacht, bewacht
  nichts.** Zeit- und Ortsabhängiges als Invariante prüfen; die Testzeile
  in `package.json` setzt deshalb `TZ=Europe/Berlin`.
- **`.gitignore`: `/media` und `node_modules` NIE mit Schrägstrich-Suffix**
  (Symlink-Falle vom 16.08. hat den echten media-Ordner gekostet).
- Filme über `queue.fal.run`: `status_url`/`response_url` WÖRTLICH
  speichern. Renderzeiten 2–6 min.
- Traum-Medien nur über `entryMedia.js`; `media.poster` ist die Wahrheit.
- Gatekeeper: alles unter /api/ gebremst; `/api/reflect` ist text-Klasse.
  Credits sind Buchhaltung, KEINE Zugangskontrolle.
- Hausregel: **nie auf geratene Feldnamen bezahlt rendern** — OpenAPI
  lesen, Nullkosten-Probe mit ungültigem Schlüssel, dann Geld.
- DeepSeek IMMER ohne `max_tokens`, mit `stream:false`.
- Journal-CSS: Klassennamen VOR Gebrauch grep-en (`.j-deck` gehörte
  schon dem Kartenstapel — die Detail-Strecke heißt `j-cine-*`).
- Keine Secrets ins Repository. Schlüssel bleiben serverseitig — auch in
  der späteren iPhone-App nie im Client-Bündel.
- fal.ai und api.deepseek.com sind aus der Cloud-Sandbox gesperrt (403).
  Nie umgehen; dort strukturell prüfen, bezahlt auf Antons Rechner.

## Geld

Preisliste (`plans.js`): Woche $4,99/12 · Monat ★ $9,99/45 · Jahr
$79,99/45 p.M. · Pakete $2,99/6 · $7,99/18 · $14,99/32. Zwei Töpfe
(`credits.js`), Verfallendes zuerst. 1 Credit = 1 Bild = $0,08
Verkaufsbasis. Verstehen ist gratis (Analyse, Reflection, Atlas),
bezahlt wird das Sehen — das ist die Preislinie des Mehrwert-Plans.
MwSt. vor Store-Provision; Small Business Program ist Voraussetzung.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 225 Unit + Freigabe + Hygiene + Kontrast + i18n + RTL

⚠️ 5173/8100/5174 sind getrennte localStorage-Herkünfte. Vor
API-Debugging prüfen, WESSEN Prozess auf 8100 liegt.

## Nächste Schritte

1. **Oberfläche zu P2a/P2b** — Wirkungsradius steht oben, die Rechnung
   ist fertig und getestet.
2. **Schlussstein:** je ein echter Film pro Stufe durch die App-UI.
3. **Recht 2–6** — vor allem DeepSeek-Entscheidung und Speicherfristen.
4. **Capacitor + StoreKit + RevenueCat** — der Hebel, der alles
   multipliziert.
5. Preisentscheidung (durchreichen) · Dummy-Film ersetzen · Store-Texte ·
   Startmenü/Seed-Journal entfernen auf Antons Wort.

## Pläne

- `2026-08-21-mehrwert-inhalte.md` — P1 umgesetzt, P2 halb, P3 offen.
- `2026-08-20-recht-einwilligung.md` — Punkt 1 gebaut (Tor); 2–6 offen.
- `2026-08-20-charakterbogen-pflicht.md` — umgesetzt; Prüfstein §7.
- `2026-08-20-direktanbieter-preise.md` — Recherche; Schwellen §5.
- `2026-08-19-storyboard-vor-dem-film.md` — umgesetzt.
- `2026-08-19-bildmodelle-preise.md` — umgesetzt (Lite überall).
- `2026-08-17-film-regie.md` — umgesetzt inkl. §10d (Neuzuschnitt).
- `2026-08-16-positionierung-und-store.md` — Store-Texte, offen.

## Werkzeuge

- `node scripts/dry-run-prompts.mjs [--live]` — der ganze Weg vom Traum
  zum fal-Auftrag, jeder Prompt im Volltext; rendert NIE.
- Testartefakte in `media/tests/` (gerätelokal, gitignored).
