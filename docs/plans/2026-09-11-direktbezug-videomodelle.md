# Direktbezug der Videomodelle statt fal — Recherche vom 11.09.2026

**Anlass:** Antons Frage, ob weitere APIs direkt gebucht werden sollen,
„um das günstiger zu machen (direkt über Seedance oder direkt, wo H3
verkauft wird)". Stand heute läuft alles über fal.ai.

**Entscheidung Anton, 11.09.2026 abends:** Seedance 2.5 wird über Replicate
bezogen (Anton hat dort schon ein Konto), H3 bleibt bei fal. Umsetzung
folgt in einer eigenen Sitzung — Wirkungsradius unten.

## Die Antwort in einem Satz

**Die beiden Modelle verhalten sich gegensätzlich:** Bei MiniMax H3 ist fal
günstiger als der Hersteller selbst — bei Seedance 2.5 verlangt fal fast das
**Doppelte** des offiziellen Tokenpreises, und Replicate bietet denselben
Listenpreis wie BytePlus ohne Firmenverifizierung.

## Preise je Sekunde (Referenz-zu-Video, nur Bildreferenzen)

| Anbieter | Modell | 480p | 720p / 768p | Bedingungen |
|---|---|---|---|---|
| fal (heute) | H3 | $0,05 | $0,06 | ab 6. Referenzbild $0,08; Preise „subject to change at any time without notice" |
| MiniMax direkt | H3 | — (kein 480P) | $0,08 | ab 6. Bild $0,04; Daten im US-Rechenzentrum; ToS: Inhalte dürfen zur Verbesserung genutzt werden |
| MiniMax direkt | H3-Max | $0,05 | $0,08 | nur Text/Bild-zu-Video, **keine Referenzbilder** („coming soon") |
| fal (heute) | Seedance 2.5 | $0,2205 | $0,473 | $0,0214 je 1.000 Token |
| **BytePlus ModelArk direkt** | Seedance 2.5 | **$0,103** | **$0,231** | $10,70 je Mio. Token; nur erfolgreiche Videos berechnet; Verarbeitung Malaysia/Indonesien/EU, kein Training; Verifizierungspflicht für Firmen unklar; Konto 2 h nach Nullstand gesperrt |
| **Replicate** | Seedance 2.5 | **$0,1028** | **$0,2312** | identischer Listenpreis, bis 30 Referenzbilder, keine Firmenverifizierung; Feld `reference_images` statt `image_urls` |
| Runware | Seedance 2.5 | $0,1025 | $0,2304 | Referenzbilder ungeprüft |
| WaveSpeed | H3 / Seedance | teurer als fal | | |

## Was das für unsere Preise hieße (Credit = $0,0283, aufgerundet)

| Stufe | heute (fal) | mit Replicate/BytePlus |
|---|---|---|
| Seedance 480p | 8 Cr/s | **4 Cr/s** |
| Seedance 720p | 17 Cr/s | **9 Cr/s** |
| H3 480P / 768P | 2 / 3 Cr/s | unverändert (fal bleibt) |

Ein 15-s-Seedance-Film in 480p kostet heute 121 Credits, mit halbiertem Einkauf **rund 61**.
Bei 100 Seedance-Filmen à 20 s im Monat spart der Wechsel rund $480, bei
1.000 rund $4.800 (720p).

## Empfehlung

1. **H3 bleibt bei fal.** Der Hersteller ist teurer und sein günstiges
   Modell kann keine Referenzbilder.
2. **Seedance 2.5 über Replicate als zweiten Anbieter** im bestehenden
   Proxy: gleicher Listenpreis wie BytePlus, kein KYC, keine Nullstand-
   Sperre. BytePlus direkt erst, wenn die Verifizierungsfrage geklärt ist
   (Datenschutz wäre dort sogar besser als bei MiniMax).
3. **Ein zweiter Anbieter je Modell ist ohnehin sinnvoll:** fal ändert
   Preise laut ToS ohne Vorlauf und hat keinen Preis-Changelog; BytePlus
   kündigt Preisänderungen mit Datum an.
4. Das gehört in den **Preisentscheid**: Halbiert sich der Seedance-
   Einkauf, halbiert sich der Kundenpreis — oder die Marge verdoppelt sich.
   Antons Regel vom 20.08. sagt: Der Einkauf bestimmt die Marge, nicht den
   Preis. Das ist seine Entscheidung.

## Wirkungsradius eines Replicate-Anbieters

`video.js` (Modelltabelle: `provider`, `slug`, `refsField`), `server.js`
(`falSubmitVideo` → anbieterabhängiger Submit + Abholen; Replicate hat
eigene Warteschlange und Auth), `.env` (`REPLICATE_TOKEN`), Tests. Der
Regisseur-Brief bleibt gleich (Seedance-Format).

## Nicht belegt

MiniMax-Zahlungsmittel und Mindestaufladung · ob BytePlus für ein deutsches
Unternehmen zwingend Business-KYC verlangt · ob Runware/WaveSpeed
Bildreferenzen in gleicher Form nehmen · ob fal an diesen Endpunkten schon
einmal unangekündigt die Preise geändert hat (keine öffentliche Historie).

Quellen: fal.ai Modellseiten und ToS §9b · platform.minimax.io (Pricing,
Rate Limits, Privacy, ToS) · docs.byteplus.com ModelArk (Pricing, Data
Processing, Availability, Payment FAQ, KYC FAQ) · replicate.com/bytedance/
seedance-2.5 · runware.ai · wavespeed.ai · openrouter.ai.
