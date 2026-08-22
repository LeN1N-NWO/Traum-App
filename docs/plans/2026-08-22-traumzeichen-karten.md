# Traumzeichen-Karten (Mehrwert-Plan P2c) — Bilder vorab statt pro Nutzer

**Stand:** 2026-08-22 · Anlass: Antons Frage („Vielleicht werde ich die
Symbole davor generieren. Wie viele sind es denn? Ich könnte das davor
generieren und einfach in die App einpflegen.")

## Die Zahl: 20

`src/lib/symbols.js` kennt **20 Traumsymbole**, verteilt auf fünf
Kategorien. Die Liste ist seit dem Port aus der alten App unverändert;
sie wächst nur, wenn wir sie erweitern.

## Was sich dadurch ändert — und warum es die bessere Fassung ist

Der ursprüngliche Plan sah vor, dass jeder Mensch sein Traumzeichen für
**1 Credit** rendern lässt. Vorab generierte Bilder drehen das um:

| | pro Nutzer erzeugt | vorab erzeugt und mitgeliefert |
|---|---|---|
| Kosten je Karte | ~$0,08 (1 Credit) | einmalig, deine Rechnung |
| Wartezeit | Warteschlange, Collector, Fehlerfall | keine |
| Offline | nein | ja |
| Aussehen | schwankt je Modelltag | eine Handschrift, von dir kuratiert |
| Rechtslage | KI-Bild, Kennzeichnungsfrage je Nutzer | EIN Satz Bilder, einmal geprüft |

Der Preis dafür: ~20 Dateien im Repo (bei 400 KB je Bild rund 8 MB —
vertretbar; bei 1,5 MB wie unsere aktuellen Renders wären es 30 MB, das
ist zu viel fürs Repo und fürs App-Bundle). **Also: vor dem Einpflegen
verkleinern** — 768 × 1152 reicht für eine Karte, WebP statt PNG.

## Wohin die Dateien gehören

    public/symbols/<id>.webp

Der Dateiname IST die Symbol-ID aus der Tabelle unten — kein Register,
keine Zuordnungsdatei, die auseinanderlaufen kann. Fehlt eine Datei,
zeigt die Karte weiter das Emoji; das ist der eingebaute Rückfall.

⚠ `public/` (nicht `media/`): Diese Bilder sind Teil der App, keine
erzeugten Nutzerdaten. Sie gehören ins Repo und ins Bundle — anders als
alles unter `/media`, das bewusst NICHT eingecheckt wird.

## Die 20 Symbole

Deutsche Bezeichnungen stehen in `src/i18n/de.js` unter `symbols.byId`.
Die Prompt-Spalte ist ein Vorschlag zum Kopieren — gemeint als
*Traumzeichen-Karte*, nicht als Illustration einer Szene: ein einzelnes
Motiv, viel Raum, dieselbe Nacht-Palette wie die App (tiefes Blau,
warmer Akzent), niemals Text im Bild.

| # | id | Label (en) | Kategorie | Prompt-Vorschlag |
|---|---|---|---|---|
| 1 | `water` | Water | Ort | dark water surface at night, moonlit ripples, endless, calm and deep |
| 2 | `home` | House & home | Ort | a single lit window of an old house at night, seen from outside |
| 3 | `city` | City & streets | Ort | empty night street, wet asphalt, distant neon, no people |
| 4 | `forest` | Forest & wilderness | Ort | tall dark pines under starlight, one path leading in |
| 5 | `sky` | Sky & space | Ort | vast night sky, slow clouds, one bright star, nothing else |
| 6 | `falling` | Falling | Szenario | a figure seen from far above, falling through dark air |
| 7 | `flying` | Flying | Szenario | a silhouette gliding over a sleeping landscape at night |
| 8 | `chase` | Being chased | Szenario | long shadow stretching down a corridor behind a running figure |
| 9 | `missing` | Missing something | Szenario | a departing train's tail lights, empty platform at night |
| 10 | `lost` | Being lost | Szenario | a compass with a spinning needle, fog around it |
| 11 | `exposed` | Exposed | Szenario | a single spotlight on an empty stage, dark auditorium |
| 12 | `teeth` | Teeth falling out | Szenario | a hand holding a small white pebble over dark water |
| 13 | `animal` | Animals | Wesen | a wolf's silhouette at the treeline, eyes catching moonlight |
| 14 | `monster` | Monsters & shadows | Wesen | a shapeless shadow in a doorway, nothing visible inside it |
| 15 | `family` | Family | Person | three empty chairs around a table, warm lamp above |
| 16 | `stranger` | Strangers | Person | a faceless figure at the far end of a night street |
| 17 | `partner` | Love & partners | Person | two shadows overlapping on a wall, warm light |
| 18 | `fear` | Fear | Gefühl | a door left slightly open into darkness |
| 19 | `joy` | Joy & warmth | Gefühl | warm golden light breaking over a dark horizon |
| 20 | `grief` | Grief & loss | Gefühl | rain on a window at night, one lit room behind it |

## Was danach zu bauen ist (klein)

1. `src/lib/symbols.js`: je Symbol ein optionales `card: "/symbols/<id>.webp"`
   — oder schlicht per Konvention aus der ID gebildet, das spart die
   zwanzig Zeilen.
2. Symbolseite und Atlas: statt des Emojis das Bild zeigen, wenn es lädt.
3. Traumzeichen-Karte teilbar machen (share.js kann das schon) — DAS ist
   der Reality-Check-Trigger aus dem Luzid-Guide.
4. Kein Credit, kein Server, keine Warteschlange. Der Plan-Punkt „1 Credit
   je Zeichen-Karte" entfällt damit.

## Offen für Anton

- Stil: dieselbe Handschrift wie die Traumbilder oder bewusst anders
  (ruhiger, plakativer — es sind Karten, keine Szenen)?
- Ob die 20 reichen oder ob beim Durchsehen Symbole fehlen, die du
  selbst oft träumst. Erweitern ist billig, solange es VOR dem Erzeugen
  passiert.
