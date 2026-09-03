# Nur noch Film — der Rückbau des Bildprodukts

**Stand:** 2026-08-31 · Anlass: Antons Entscheidung („wir entfernen diese
Bilder und alles, was mit diesen Bildern dazugehört. Wir konzentrieren uns
jetzt auf die Videomodelle.")
**Status: PLAN. Phase 1 umgesetzt (`e4e3ea6`). Aus Phase 3 ist am
03.09.2026 das VIDEOFELD vorgezogen (Antons Ansage: „den Videoplayer dann
einbauen bei den Träumen statt dieser Kacheln") — der Film steht im Journal
jetzt ganz oben in voller Breite, mit dem schlafenden Frosch solange er
rendert, und das Storyboard weicht, sobald es einen Film gibt. Phase 2
(Geld) und der Rest von Phase 3 sind offen.**

⚠ Dabei fiel eine Sackgasse auf, die mit dem Rückbau zum Normalfall würde:
Ein Traum, der als Film angelegt wurde und dessen Render scheitert, hat
keine Bilder — und bekam deshalb im Journal nur „Bilder machen" angeboten,
also genau das, was er nie wollte. `offerFilm` prüft jetzt auch
`entry.mode === "film"`.

## 0. Die Entscheidung, in einem Satz

Dream Rushes ist ein Videoprodukt. Bilder werden nicht mehr verkauft und
nicht mehr gezeigt — sie existieren nur noch als **Handwerk hinter dem
Film**: Keyframe, Charakterbogen, Referenzen.

## 1. Warum das kein Löschen ist, sondern ein Umbau

Ein Film entsteht aus Bildern. Jeder Auftrag rendert ein Startbild
(`startVideo` → `generateImages`, server.js), jede Person reist als
Charakterbogen mit (`sheets.js`, `/api/character`), und der Regisseur
liest Szenen aus der Analyse. **Nichts davon darf weg.** Was weg darf, ist
das, was der Mensch davon SIEHT und KAUFT.

⚠ Die Falle: `imageCount`, `priceForImages`, `IMAGE_COUNTS`, das Raster,
der Schnitt, der Collector für `imageJobs`, die Storyboard-Kacheln, die
Paywall-Bilder-Kachel, `packYield`, `dreamsFor().images` — das ist EIN
zusammenhängendes Geflecht. Wer es an einer Stelle kappt, ohne den Rest zu
sehen, bekommt genau die stummen Fehler, die diese Woche vier bezahlte
Läufe gekostet haben.

## 2. Was bleibt, was geht

| Bleibt (Handwerk) | Geht (Produkt) |
|---|---|
| Keyframe-Render im Filmweg | Modus „Bilder" im Wizard (Step2Output) |
| Charakterbogen + `/api/character` | Bilderzahl 4/8, Raster, Schnitt, `uploadPanel` |
| Analyse mit fünf Beats (Regisseur) | Storyboard als Produkt, Szene nachfüllen (1 Cr) |
| `media/` als Ablage | „Bilder machen"-Knopf, Plan B für Bilder, `unname` NUR für Bilder |
| Traum-Kachel mit einem STANDBILD | Paywall-Kachel „Bilder", `packYield` mit Bildern |
| | `imageJobs`-Collector, Ketten-Läufer, Schnitt-Effekt in AppState |

**Die Traum-Kachel braucht weiter ein Standbild** — für Journal-Stapel und
Kalender. Kandidat: das erste Frame des Films (ffmpeg, der Abspann-Weg
existiert) oder der Keyframe. Ohne Bild wäre das Journal eine Textliste.

## 3. Die Geldfrage — sie ist NICHT nebensächlich

Der Credit ist heute als Bild definiert (`creditCostUsd()` = ein Bild im
2×2-Raster = $0,0283). Fällt das Bild als Produkt, bleibt der Credit als
Recheneinheit — das ist in Ordnung, ein Credit ist Geld, kein Bild. Aber
drei Dinge hängen daran:

1. **Willkommensgeschenk (4 Cr) kauft nichts mehr.** Der billigste Film
   (H3 480P, 5 s) kostet 11 Credits mit Keyframe. Das Geschenk muss
   steigen — und es ist der größte Einzelkostenposten je Installation
   (credits.js). 11 Cr ≈ $0,25 statt $0,113. **Antons Entscheidung.**
2. **Das kleinste Paket (13 Cr)** kauft genau einen 5-Sekunden-H3-Film in
   480P. Das ist knapp. Vermutlich gehören die Paketgrößen neu geschnitten.
3. **`dreamsFor()` und die Paywall** rechnen in Bildern. Künftig nur noch
   „bis zu N Filme" — und die Zahl hängt jetzt an Modell UND Qualität.

Das ist derselbe Entscheid wie `docs/plans/2026-08-26-preisentscheid.md`,
nur mit einer Variablen weniger. Beide gehören zusammen entschieden.

## 4. Was NEU gebaut wird

- **Ein Videofeld im Traum** statt der Bildkacheln — der Film ganz oben,
  groß, mit Standbild solange er rendert (JournalDetail).
- **Charakterbögen werden sichtbar.** Antons Ansage: „dass man in diesem
  System die Character Sheets, die man bis jetzt hat, sehr dominant
  auswählen kann und sichtbar ist." Heute entsteht der Bogen im
  Hintergrund beim ersten Render. Künftig: beim Anlegen einer Person
  gleich rendern (1 Cr, sichtbar), in der Besetzung als Bogen zeigen, im
  Wizard als das, was man auswählt.
- **Qualitätsschalter** — ✅ Phase 1, umgesetzt.

## 5. Reihenfolge

1. **Phase 1 — Fundament (✅ 31.08.):** zwei Modelle, zwei Qualitäten,
   Seedance 2.0 raus, Preise verifiziert, `preis-durchreichen.mjs` rechnet
   alle vier Stufen.
2. **Phase 2 — Geld:** Willkommensgeschenk, Paketgrößen, Paywall-Texte,
   `dreamsFor` in Filmen. Zusammen mit dem Preisentscheid. **Braucht
   Antons Ja.**
3. **Phase 3 — Oberfläche:** Modus „Bilder" aus dem Wizard, Videofeld im
   Journal, Standbild aus dem Film, Bögen sichtbar. Erst DANN den toten
   Code (Raster, Schnitt, Panel-Upload, imageJobs) entfernen — und die
   Tests dazu bewusst, nicht mit.
4. **Phase 4 — Aufräumen:** `pricing.js` ohne Bilder, `gridLayout.js`
   nur noch für den Keyframe, STAND und Fallen nachziehen.

## 6. Was diese Entscheidung NICHT rückgängig macht

Die Raster-Erkenntnisse (slots ≠ tiles, Schnitt mit drei Anläufen) bleiben
als Fallen dokumentiert — der Keyframe läuft weiter über denselben
Bildweg, nur ohne Raster. Und die Policy-Selbstheilung (`recovery.js`,
`unname`) gilt für Filme genauso: Ein abgelehnter Prompt ist ein
abgelehnter Prompt.
