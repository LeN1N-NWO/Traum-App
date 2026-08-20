# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-20 (23:35) — Branch `session/2026-08-19-anton` (PR #16, freigegeben)

## Was diese Session verändert hat: gemessen, dann alles neu zugeschnitten

Die Messaufträge aus PR #15 sind erledigt (fal-OpenAPI-Schemata + bezahlte
Syntax-Beweise, ~$2 gesamt) und der Umbau ist GEBAUT:

| | Modell (heute) | Einkauf | Verkauf |
|---|---|---|---|
| Bild (alle Pfade) | `google/nano-banana-2-lite` (fest 1K) | **~$0,042** | 1 Credit |
| Film Lebendig | `minimax/h3/reference-to-video` 768P | **$0,06/s** | 1 Cr/s · 5–15 s · bis 4 Cast-Refs GRATIS |
| Film Regie | `bytedance/seedance-2.0/fast/reference-to-video` 720p | $0,2419/s | 4 Cr/s · 5–15 s · 8 Cast-Refs |
| Film Kino | `bytedance/seedance-2.5/reference-to-video` 720p | $0,473/s | 6 Cr/s · 5–30 s · 8 Cast-Refs |
| Diktat | `fal-ai/wizper` | $0,0005/min | gratis |
| Analyse/Regisseur | `deepseek-v4-flash` | $0,00026 | gratis · **ohne max_tokens!** |

**Jede Stufe ist ein EIGENES Modell** (Antons Bedingung) und ALLE tragen
Referenzen — die Besetzung ist in jedem Film sie selbst. Preise für Kunden
unverändert; die Lite-Ersparnis finanziert die Gratis-Charakterbögen
(Antons Entscheidung).

### Die Modelltabelle trägt jetzt das ganze Modellwissen (`src/lib/video.js`)

`refsField` (H3: `reference_image_urls`, Seedance: `image_urls` — keins
versteht das andere) · `refStyle` (drei Adress-Syntaxen: `@Image1` /
`[Image1]` / „Image 1"; Brief, Anweisung und `checkDirectedPrompt`
sprechen die des bestellten Modells, die Prüfung liest ALLE drei) ·
`aspect` (nur wo das Schema 9:16 bestätigt; 2.0 bewusst ohne) ·
`noExpand` (H3 formuliert sonst fremd um!).
⚠ Zwei H3-Geldfallen, im Code verriegelt: Auflösungs-Vorgabe ist „2K"
($0,13/s statt $0,06) und `enable_prompt_expansion` steht AN.

### Die Bogen-Pflicht (neu, `src/lib/sheets.js` + Step5Style + /api/character)

Fotos von Personen/Tieren werden beim ERSTEN bezahlten Render zu einem
Charakterbogen normalisiert (grau, geteilt: Ganzkörper + Gesicht) — ab da
referenziert der Bogen. **Bezahlt bewiesen (Plan charakterbogen-pflicht
§7): der Umgebungs-Bleed folgt dem FOTO, nicht dem Modell** (Lenas
Segelboot; Kontrolltest). Die drei Regeln: **träge** (nie beim Anlegen —
1000 angelegte Figuren kosten $0, nichts farmbar), **gratis** (aus der
Lite-Ersparnis; keine versteckte Abrechnung — Hausregel), **veraltbar**
(Fingerabdruck über Foto+Beschreibung; Änderung ⇒ neuer Bogen beim
nächsten Render). Orte ausgenommen (ein Ort IST seine Umgebung). Wie der
Regisseur: Kür, nie Pflicht — Fehler ⇒ rohes Foto.
⚠ Cast-Einträge haben jetzt `sheet` + `sheetOf`; als Referenz gilt
`renderRef()` (nie ein veralteter Bogen).

### Das Einwilligungs-Tor (neu, `src/components/ConsentGate.jsx`)

Nach der Sprachwahl, vor Onboarding UND App (auch das Stimm-Interview
sendet Daten): drei eigene Häkchen — AGB/Datenschutz · Datenverarbeitung
durch benannte Anbieter · **18+** (Selbsterklärung, Antons Entscheidung).
Aufklapp-Teil nennt Anbieter UND Trainingslage. `state.consent {v, at}`;
`CONSENT_VERSION` (consent.js) öffnet das Tor bei Textänderungen erneut.
**AI-Act Art. 50 gilt seit 02.08.2026** — Kennzeichnungspflicht trifft
UNS, nicht private Nutzer. Plan: `2026-08-20-recht-einwilligung.md`
(KEIN Rechtsrat; vor Launch anwaltlich redigieren).

## ⚠ Der Schlussstein steht weiter aus

**Kein echter Film ist seit dem Neuzuschnitt gerendert.** Die Verdrahtung
ist per Nullkosten-Probe bewiesen (ungültiger FAL_KEY ⇒ 401 nennt das
richtige Modell; alle drei Slugs existieren; Regisseur-Ausfall bleibt
Kür-nie-Pflicht), aber der Beweis mit Geld fehlt: je ein Film pro Stufe
durch die App-UI (Lebendig 5 s ≈ $0,34 · Regie 5 s ≈ $1,25 · Kino kurz),
T3 (Abspann) gleich mit.

## Bekannte Baustellen

- **Recht** (Plan recht-einwilligung §4, Punkte 2–6): Upload-Zusicherung
  im AvatarDialog · KI-Kennzeichnung/C2PA (Abspann als Pflichtteil,
  Metadaten-Erhalt durch ffmpeg/Canvas prüfen) · Speicherfristen für
  /media (heute: unbegrenzt, auch Uploads) · **DeepSeek-China-Entscheidung**
  (Traumtexte gehen nach China; EU-gehostete offene Gewichte wären ein
  Slug-Wechsel) · docs/legal/ + Widerrufsweg im Profil.
- **Kein Zahlungsanbieter.** Der Kaufknopf sagt es ehrlich.
- Dummy-Film im Kaufblatt (`Paywall.jsx:25`), Austausch = eine Zeile (Anton).
- Schnellvorschau 448-px-Panels (Bildmodelle-Plan §3) — mit Lite jetzt
  fast gratis im Einkauf; 2K-Variante bleibt eine Option.
- Bilderstrecke teilt nach Sätzen; Symbolerkennung nur Englisch;
  localStorage ~5 MB; kein `bun run lint`.
- Direktanbieter (Plan direktanbieter-preise §5): heute bleiben; Schwellen —
  Kino-Nutzung ⇒ BytePlus messen (2 Mio. Gratis-Tokens; Kino könnte 3
  statt 6 Cr/s kosten) · >$200 fal/Monat ⇒ Bilder zu Google direkt ·
  **H3 nie direkt** (fal ist billiger als der Hersteller).

## Woran wird gearbeitet

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI
macht daraus eine Bildstrecke und optional einen kurzen Film. **Vier
Tabs**, der Wizard öffnet über der Tab-Leiste.

| Tab | Inhalt |
|---|---|
| Home | Begrüßung, Faultier-Film, Serien-Zeile, letzter Traum, Menagerie |
| Journal | Kartenstapel/Liste, Kalender, Detail mit Film+Bildern, Besetzung (Abspann-Form) |
| **⊕** | Wizard: Traum → Ausgabe → Personen → Orte → Style → Ergebnis |
| Sleep | Alles gratis: Checkliste, Sound-Mixer, Klartraum-Leitfaden, Symbole |
| Profil | Porträt, Guthaben-Pille, Einstellungen, „Was du mir erzählt hast" |

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter);
`server.js` als schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini).
Zustand in `localStorage` (`dreamrushes_v1`). **Sieben Sprachen**, alle
Texte in `src/i18n/<id>.js`, `check-i18n-shape.mjs` erzwingt Form+Arität.
Doku und Commits deutsch.

## ⚠ Stehende Entscheidungen und Fallen

- **Startmenü bleibt** (fragt jeden Start „Onboarding oder App?") und
  **Seed-Journal bleibt** — beides bis Anton ausdrücklich anderes sagt.
  Seed-Träume erkennt man am `e_seed`-Präfix.
- **`.gitignore`: `/media` und `node_modules` NIE wieder mit
  Schrägstrich-Suffix** — die Verzeichnis-Form hat am 16.08. den echten
  media-Ordner gekostet (Symlink-Falle).
- Filme über `queue.fal.run`: `status_url`/`response_url` WÖRTLICH
  speichern, nie aus dem Slug bauen. Renderzeiten 2–6 min.
- Traum-Medien nur über `entryMedia.js`; `media.poster` ist die Wahrheit
  über das erste Bild.
- Gatekeeper (`gatekeeper.js`): alles unter /api/ gebremst (generate
  20/min), Voreinstellung strengste Klasse; optionales API_TOKEN. Credits
  sind Buchhaltung, KEINE Zugangskontrolle.
- Hausregel seit 07.08.: **nie auf geratene Feldnamen bezahlt rendern** —
  Schemas lesen (`fal.ai/api/openapi/queue/openapi.json?endpoint_id=…`),
  Nullkosten-Probe mit ungültigem Schlüssel, dann erst Geld.
- DeepSeek IMMER ohne `max_tokens` (Denkmodell) und mit `stream:false`.

## Geld

Preisliste (`plans.js`): Woche $4,99/12 · Monat ★ $9,99/45 · Jahr
$79,99/45 p.M. · Pakete $2,99/6 · $7,99/18 · $14,99/32. Zwei Töpfe
(`credits.js`): `allowance` je Periode GESETZT, Verfallendes zuerst.
1 Credit = 1 Bild = $0,08 Verkaufsbasis — die Kopfrechenregel steht.
MwSt. vor Store-Provision; Small Business Program ist Voraussetzung.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 200 Unit + Freigabe + Hygiene + Kontrast + i18n + RTL

⚠️ `preview_start` bedient das HAUPTREPO — wer den Worktree sehen will,
startet dort `bun run dev:web` von Hand (heute wäre sonst fast der falsche
Stand verifiziert worden). 5173/8100/5174 sind getrennte
localStorage-Herkünfte. Vor API-Debugging: prüfen, WESSEN Prozess auf
8100 liegt.

## Nächste Schritte

1. **Schlussstein:** je ein echter Film pro Stufe durch die App-UI
   (~$2–5), T3 (Abspann) gleich mit.
2. **Recht, Punkte 2–6** (Plan recht-einwilligung §4) — vor allem
   DeepSeek-Entscheidung und Speicherfristen.
3. **Capacitor + StoreKit + RevenueCat** — der Hebel, der alles
   multipliziert; die App ist feature-seitig bereit.
4. Dummy-Film ersetzen (Anton) · Store-Texte (Plan Positionierung).
5. Startmenü und Seed-Journal entfernen — auf Antons Wort.

## Pläne

- `2026-08-17-film-regie.md` — **umgesetzt inkl. §10d** (Neuzuschnitt).
- `2026-08-19-bildmodelle-preise.md` — **umgesetzt** (Lite überall).
- `2026-08-20-charakterbogen-pflicht.md` — **umgesetzt**; Prüfstein §7.
- `2026-08-20-direktanbieter-preise.md` — Recherche; Schwellen in §5.
- `2026-08-20-recht-einwilligung.md` — Punkt 1 gebaut (Tor); 2–6 offen.
- `2026-08-19-storyboard-vor-dem-film.md` — Stufe A umgesetzt; B auf Eis.
- `2026-08-16-positionierung-und-store.md` — Store-Texte, offen.

## Werkzeuge

- `node scripts/dry-run-prompts.mjs [--live]` — der ganze Weg vom Traum
  zum fal-Auftrag, jeder Prompt im Volltext; `--live` = zwei
  DeepSeek-Aufrufe (~$0,0005), rendert NIE.
- Testartefakte in `media/tests/` (gerätelokal, gitignored): Bögen,
  Strecken, Filme aller bezahlten Tests vom 17.–20.08.
