# H3 Max Turbo: Umstellung, Messungen, Prompt-Regeln (23.09.2026)

**Antons Entscheid:** H3 Max Turbo verwenden, die Ersparnis an die Kunden
weitergeben. Vorher die Referenzbild-Frage TESTEN, nicht Blogs glauben.

## Was gemessen wurde (fal-OpenAPI-Schemata + zwei bezahlte Renders, ~0,38 $)

- `minimax/h3-max-turbo/reference-to-video` **existiert nicht** (404).
  Turbo hat nur `text-to-video` und `image-to-video`.
- `minimax/h3-max-turbo/image-to-video`: EIN Startbild (`image_url`),
  optional `end_image_url`; **Frame 0 des Outputs ist pixelgenau das
  Startbild** (Frosch-Test). Kein `aspect_ratio` — das Format folgt dem
  Bild. Data-URIs werden angenommen.
- `minimax/h3-max/reference-to-video`: bis 9 Bilder
  (`reference_image_urls`), je 3 Video-/Audio-Referenzen; hielt im Test
  die Identität der Referenz (Haltung, Zeichnung, Augen) bei freiem
  Restyling. Data-URIs werden angenommen.
- Beide neuen Endpunkte: 5–15 s, 480P/768P/**1080P**, Prompt bis
  **50 000** Zeichen, natives synchrones Audio ohne Parameter, und das
  **Pflichtfeld `prompt_expansion_mode`** ("disabled" | "balanced" |
  "quality") — das alte `enable_prompt_expansion` gibt es nicht mehr.
- Einkauf (fal-Modellseite): Max 480P $0,05 · 768P $0,08 · 1080P $0,16;
  **Turbo exakt die Hälfte** ($0,025/$0,04/$0,08) bei ~35× Tempo
  (5-s-Clip in <3 s Rechenzeit).

## Was gebaut wurde

- **Die Turbo-Weiche** (`src/lib/video.js`): Standard hat zwei Endpunkte.
  Mit Besetzungs-Referenzen → H3 Max R2V (Preis wie bisher: 2/3 Cr je s);
  ohne → Turbo i2v mit dem Keyframe als Startbild zum **halben Satz**
  (480P: 1 Cr/s, 768P: 2 Cr/s — `solo` je Qualität, `filmRate()`).
  Dieselbe Bedingung („mehr als das Keyframe?") schaltet Route UND Preis;
  video.test.js rechnet die Paarung nach.
- **Preisweg:** `order.refs` in quote.js (fehlt das Feld, gilt der teurere
  Satz — Unbekanntes zieht den Preis nie nach unten); der Server zählt aus
  seiner eigenen Besetzungsliste. Wizard zeigt den Preis live, sobald
  Fotos zugewiesen werden.
- **Regie:** `NEGATIVE_RULES`-Block in director.js, zuschaltbar über
  `negatives` in der Modelltabelle (nur H3-Familie) — H3 nimmt explizite
  Negationen ungewöhnlich verlässlich als harte Sperren. Zeitcodierte
  Shots (timeFormat "ms") und Referenz-Rollen (refStyle "plain") gab es
  schon; Audio-Block gilt unverändert (Real-Klang, keine Musik).
- Architektur-Antwort auf Antons Frage: Der Regie-Prompt wird **weder
  vorab erzeugt noch nachträglich umgebaut** — er entsteht pro Auftrag,
  NACHDEM Modell/Qualität/Referenzlage feststehen (directFilm →
  buildDirectorBrief mit den Feldern des bestellten Modells).

## Lokale Option (Antons 5090): rechtlich nein

H3-Base (768p) hat offene Gewichte und läuft auf einer 5090 (~3 min je
5-s-Clip, ~32 GB), aber die **Community-Lizenz erlaubt lokale Nutzung in
der EU nicht** (auch USA/UK/Südkorea; inkl. lokal erzeugter Outputs).
Für Dream Rushes als deutsches Gewerbe keine Option — API bleibt der Weg.

## Prompt-Unterschiede H3 ↔ Seedance (Kern der Recherche)

- **Seedance 2.5:** erzählerische Beats mit Zeitspannen, explizite
  Invarianten; ⚠ Text in Anführungszeichen wird als GESPROCHENE Zeile
  gelesen (Titel im Bild → Stimme liest ihn vor).
- **H3:** jede Referenz braucht eine Job-Zuweisung („Image 1 = Person"),
  zeitcodierte Shot-Listen gegen Diashow-Gefühl, Audio als gestaltbarer
  Pflichtteil, Negativ-Regeln wirken ungewöhnlich stark, viel Platz
  (50 k Plattform-Cap; unser Regie-Budget: 10 000).

## Offen

1. **Erster bezahlter Kundenpfad-Film über beide neuen Endpunkte** (der
   Frosch-Test lief direkt gegen fal, nicht durch server.js) — bei der
   Gelegenheit prüfen, ob Turbos Identitätshaltung über 15 s reicht.
2. **Aufpreis je Extra-Referenzbild am neuen Max-Endpunkt messen** — bis
   dahin bleibt maxRefs bei 5 (die alte Gratis-Grenze).
3. **1080P als dritte Stufe?** Gäbe es zum Turbo-Satz von 3 Cr/s —
   Produktentscheidung, nicht Technik.
4. UI-Hinweis „mit Foto-Referenzen kostet der Film mehr" (heute sieht man
   nur die Preisänderung am Knopf) — Textfrage, ggf. mit Hanni.
