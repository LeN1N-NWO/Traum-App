# Foto-Prüfung beim Hochladen — was geht, was gebaut ist, was fehlt

Stand 13.09.2026 abends · Antons Frage: Higgsfield prüft ein hochgeladenes
Bild, bevor ein Video startet. Können wir das auch, am besten gratis, im
Moment des Hakens „Ich darf dieses Foto verwenden" — und bekommt dann
jemand, der Brad Pitt hochlädt, sofort die Meldung?

Recherche mit allen Quellen: `2026-09-13-recherche-bildpruefung-vertraege.md`.

## 1. Die Antwort in drei Sätzen

1. **Einen kostenlosen „nur prüfen"-Aufruf für Seedance gibt es bei keinem
   Anbieter** — weder bei fal, Replicate noch ByteDance (BytePlus) selbst.
2. **ByteDance filtert nicht nach Prominenten, sondern nach „echten
   Menschen"** — laut eigener Doku fällt ein Foto der Mutter genauso durch
   wie Brad Pitt. Der Promi-Abgleich läuft erst am fertigen Video. Eine
   Promi-Prüfung beim Upload würde den eigentlichen Fehler also nicht
   verhindern.
3. **Unser eigener Test sagt etwas anderes als die Doku:** Replicate hat ein
   fotorealistisches Gesicht angenommen und die Person im Film gut
   getroffen. Das Gesicht war KI-erzeugt, kein echter Mensch — ob echte
   Fotos durchgehen, ist damit **noch nicht** beantwortet.

## 2. Der Test (13.09., 18:34)

| | |
|---|---|
| Anbieter | Replicate, `bytedance/seedance-2.5` |
| Referenz | Standbild aus `public/clips/showcase-faces.mp4` (ältere Frau, von Higgsfield erzeugt, kein echter Mensch) |
| Auftrag | 4 s, 480p, 9:16, ohne Ton, Prompt „[Image1] … looks up and smiles" |
| Ergebnis | **angenommen**, gerendert in 205 s, Gesicht und Kleid getroffen |
| Kosten | 4 s × $0,1028 = **rund $0,41** |
| Befund nebenbei | Das Replicate-Log trägt eine BytePlus-Auftragsnummer (`cgt-…`) — Replicate reicht direkt an ByteDance weiter, der ByteDance-Filter lag also im Weg und hat dieses Gesicht durchgelassen |

Vorhersage aus der Doku war „abgelehnt". Mögliche Gründe: Der Filter
erkennt KI-Gesichter nicht als echt, oder er ist bei Replicate anders
eingestellt. Beides UNGEPRÜFT.

## 3. Was gebaut ist (Commit `ffe524c`)

Im Avatar-Dialog: **Haken setzen → Prüfung läuft im Hintergrund** →
grün „Foto geprüft — passt", rot mit Grund, oder grau „gerade nicht
prüfbar". Bei Rot ist Speichern gesperrt. Ein neues Foto setzt Haken und
Prüfung zurück; das Ergebnis wird am Eintrag gespeichert.

Geprüft wird **heute nur der Inhalt** (fal `imageutils/nsfw`, $0,001 je
Bild, 2–5 s). Die Übersetzung der Anbieter-Ablehnungen in verständliche
Gründe (echtes Gesicht, Promi, Kind, Nacktheit, kein Gesicht, mehrere
Gesichter) steht schon in `src/lib/photoCheck.js` mit Tests — sie greift,
sobald ein Anbieter solche Gründe liefert.

**Bewusst nicht gebaut:**
- **Promi-Erkennung** (AWS Rekognition $0,0012, Hive $0,0015): gleicht
  jedes Gesicht gegen eine Personendatenbank ab, auch das der Mutter. Das
  ist biometrische Identifizierung nach Art. 9 DSGVO; einwilligen müsste die
  abgebildete Person, der Haken des Hochladers reicht nicht. Nur nach
  Anwalt.
- **Probe-Auftrag je Foto**: kostet bei Erfolg einen ganzen kurzen Film
  (~$0,41 bei Replicate) — je Foto, das jemand hochlädt. Abbrechen hilft
  nicht: Ein abgebrochener Replicate-Lauf kann trotzdem berechnet werden.

## 4. Der Weg, der wirklich trägt

**Die Prüfung ist der erste Film.** Bei Replicate und BytePlus kostet eine
Ablehnung nichts („if a run fails, we don't charge you" / „No fee is charged
if generation fails due to reasons such as content moderation"). Also:

1. Seedance über Replicate anbinden (steht seit 11.09. aus).
2. Lehnt Seedance ein Besetzungsfoto ab, merkt die App das **am Eintrag**
   (`photoCheck.premium = "blocked"`, Grund `realface`), bucht die Credits
   zurück und bietet an: „Mit Standard (H3) drehen" — H3 nimmt echte
   Gesichter, das ist an unseren eigenen Filmen belegt.
3. Ab dann zeigt der Avatar-Dialog bei diesem Foto „Für Seedance nicht
   möglich", und der Besetzungs-Schritt sagt es vor dem Kauf.

So kommt die Meldung beim zweiten Mal sofort und beim ersten Mal ohne
Kosten — ehrlicher geht es mit den heutigen Schnittstellen nicht.

**Offizieller Weg für echte Gesichter bei ByteDance:** Die abgebildete
Person verifiziert sich selbst per Lebend-Check (API
`CreateVisualValidateSession`). Hürden: nur für eingeladene Firmenkunden,
ab 50 Personen mindestens $1.400 im Monat, Seite ohne Deutsch, Video nur in
Malaysia — und die Nutzungsregeln decken eher nicht, dass ein Nutzer einen
verifizierten Freund in SEIN Video setzt. Für später, nicht jetzt.

## 5. Verträge — wo sie liegen

**Replicate:** Es gibt **keinen öffentlichen Auftragsverarbeitungsvertrag**,
kein Trust Center. Weg: Formular unter
https://replicate.com/enterprise#contact-form (oder privacy@replicate.com).
Cloudflare hat Replicate am 01.12.2025 gekauft, aber Cloudflares
Datenschutzvertrag (v6.4, April 2026) erwähnt Replicate nicht.
**Zu fragen:** AVV mit EU-Standardklauseln · wohin Seedance-Daten fließen
(das Log zeigt: an BytePlus) · ob eine Endkunden-App gegen §2.7(c)(iii)
verstößt · ob echte Gesichter geblockt werden.

**BytePlus (ByteDance direkt):** Alles öffentlich lesbar.
- Customer Agreement: https://docs.byteplus.com/en/docs/legal/docs-customer-agreement (Recht Singapur, Schiedsgericht dort)
- Datenschutzvertrag: https://docs.byteplus.com/en/docs/legal/docs-data-processing-addendum (EU-Standardklauseln, irisches Recht) — ⚠ §4.2 verbietet, BytePlus besondere Datenkategorien zu liefern; das beißt sich mit Gesichtsdaten → Anwalt
- Unterauftragsverarbeiter: https://docs.byteplus.com/en/docs/legal/sub-processors-list
- Preise: https://docs.byteplus.com/en/docs/ModelArk/1099320 — Seedance 2.5 $10,70 je 1 Mio. Token ≈ $0,103/s bei 480p, **derselbe Preis wie Replicate**
- Konto: Seedance geht auch mit Privatkonto; Karte oder PayPal; kein Mindestumsatz gefunden

**Folgerung:** Replicate und BytePlus kosten dasselbe. BytePlus hat den
öffentlichen Vertrag, Replicate den einfacheren Zugang ohne Firmenprüfung.
Für ein deutsches Unternehmen mit Gesichtern ist BytePlus direkt
vertraglich sauberer — sobald die Gesichtsfrage (§4.2) geklärt ist.

## 6. Nächster Test — braucht Antons Ja

Ein **echtes Foto mit Einwilligung** (am einfachsten Antons eigenes) einmal
an Replicate-Seedance (Ablehnung gratis, Erfolg ~$0,41) und einmal an
fal-Seedance (heutiger Weg; bei fal kann auch eine Ablehnung kosten,
Erfolg ~$1,10 für 5 s). Das entscheidet, ob Seedance mit echter Besetzung
überhaupt ein Produkt ist — und damit, ob sich die Replicate-Anbindung
lohnt. Das Skript liegt bereit: `bun scripts/seedance-gesicht-probe.mjs <bild.jpg>`.
