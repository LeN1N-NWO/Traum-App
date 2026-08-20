# Direkt beim Hersteller kaufen statt über fal.ai — was es sparte, was es kostete

**Stand:** 2026-08-20 · Anlass: Antons Frage („fal macht selbst eine Marge —
was sparen wir direkt beim Anbieter?")
**Status: RECHERCHE. Nichts umgesetzt, nichts empfohlen umzusetzen — die
Schwelle steht in §5.**

## 1. Die Preisvergleiche, recherchiert 20.08.2026

Web-Recherche, nicht am Validator gemessen — vor jedem echten Wechsel gilt
die Hausregel (nie auf geratene Preise/Felder bauen, erst messen).

| Baustein | über fal (heute) | direkt beim Hersteller | Differenz |
|---|---|---|---|
| Bild Lite @1K | ~$0,042 | Google Gemini API **$0,0336** | **−20 %** |
| Bild NB2 @1K | $0,08 | Google **$0,067** | −16 % |
| Lebendig · H3-R2V @768P | **$0,06/s** | MiniMax-Plattform **$0,08/s** | **fal ist 25 % BILLIGER** |
| Regie · Seedance 2.0 fast | $0,2419/s | BytePlus ModelArk ~$7/M Tokens ≈ **~$0,14/s @720p** (Schätzung) | ca. −40 % |
| Kino · Seedance 2.5 @720p | $0,473/s | BytePlus **$10,70/M Tokens** ≈ **~$0,21/s** (offizielles Beispiel: ¥7,56 für 5 s 720p) | **ca. −55 %** |
| Analyse/Regisseur (DeepSeek) | — | läuft SCHON direkt | — |
| Stimme (Gemini Live) | — | läuft SCHON direkt | — |

Nebenbefunde:
- Google-Batch-Tarif (nochmal −50 %) bleibt unbrauchbar: asynchron bis 24 h,
  der Mensch wartet vor dem Bildschirm (wie im Bildmodelle-Plan §1 notiert).
- MiniMax direkt: erste 5 Referenzbilder frei, danach $0,04 statt fals
  $0,08 — für uns egal, wir kappen bei 5.
- Seedance 2.5 ist seit ~07.08. wirklich auf BytePlus ModelArk verfügbar
  (Doku zuletzt 18.08. aktualisiert), mit 2 Mio. Gratis-Tokens je Konto —
  ein kostenloser Messlauf wäre also möglich.

## 2. Die Überraschung: fal ist nicht überall Zwischenhändler-Aufschlag

Bei **H3 verkauft fal UNTER dem Herstellerpreis** ($0,06 gegen $0,08 je
Sekunde) — vermutlich ein Volumendeal. Unsere neue Lebendig-Stufe steht
also bereits auf dem billigsten bekannten Kanal. Direktwechsel wäre hier
eine VERTEUERUNG.

Bei den Bildern ist fals Marge moderat (~20 %), bei Seedance ist sie
gewaltig: Kino kostet uns über fal mehr als das Doppelte des
ByteDance-Listenpreises.

## 3. Was der Wechsel wirklich kostete (die unsichtbare Rechnung)

- **Noch ein Anbieterkonto + Abrechnung** (BytePlus/ByteDance-Ökosystem,
  eigener Anmelde-/Freigabeprozess; Google haben wir immerhin schon —
  GEMINI_KEY liegt für die Stimme bereits in .env).
- **Andere API-Formen:** ModelArk nutzt ein eigenes Task-API und
  Token-Abrechnung (Auflösung × Dauer × fps), nicht fals Queue mit
  status_url/response_url. Der Server bräuchte je Anbieter einen eigenen
  Pfad.
- **Alle Messungen gelten für fal.** Unsere OpenAPI-Schemata, die bezahlten
  Syntax-Beweise (@Image1/[Image1]/„Image 1"), die 401/404-Proben — alles
  fal-spezifisch. Direktkanäle hießen: alles neu messen (Hausregel).
- **Ein Schlüssel, eine Rechnung, ein Ausfallverhalten** ist bei einem
  Ein-Personen-Betrieb selbst ein Wert.

## 4. Was es in App-Größen bedeutet

- Traum mit 3 Bildern: Ersparnis direkt bei Google: **2,5 Cent.**
- Lebendig-Film 6 s: Direktwechsel wäre 12 Cent TEURER.
- **Kino-Film 10 s: $4,73 → ~$2,10.** Das ist der einzige Posten, der
  wirklich trägt — und er eröffnet eine Produktoption: Antons Linie
  „Modellpreise weitergeben, wie sie sind" hieße direkt eingekauft
  **Kino für 3 statt 6 Credits je Sekunde** — der halbe Kundenpreis für
  dieselbe Stufe. (ceil(0,21/0,08) = 3.)

## 5. Empfehlung

**Jetzt: bleiben.** Vor nennenswertem Volumen sind die absoluten Beträge
Cents, und fal trägt gerade drei frisch bewiesene Modellpfade. Die
75–85-%-Margen der Preisliste hängen nicht an fals Aufschlag.

**Schwellen, an denen sich das dreht:**
1. **Kino wird benutzt** (mehr als vereinzelte Filme im Monat) → BytePlus-
   Konto anlegen, mit den 2 Mio. Gratis-Tokens Seedance 2.5 direkt messen
   (Felder, [Image1]-Syntax, echte $/s), dann Kino umhängen — und die
   Ersparnis nach Antons Linie als 3 Cr/s weitergeben oder als Marge
   behalten (dieselbe Entscheidung wie bei Lite, bewusst treffen).
2. **fal-Monatsrechnung überschreitet ~$200** → Bilder auf Google direkt
   (−20 %, Schlüssel existiert schon, Aufwand: ein neuer Serverpfad plus
   Referenzverhalten neu messen).
3. **H3: nie direkt** — fal ist dort der billigere Kanal; höchstens die
   Preise quartalsweise nachprüfen.

## 6. Quellen (20.08.2026)

- Google Gemini API Preise (NB2 $0,067/1K, Lite $0,0336/1K, Batch −50 %):
  coursiv.io/blog/nano-banana-2-lite · glbgpt.com (NB2-Preisführer)
- MiniMax-Plattformpreise H3 ($0,08/s 768P, $0,13/s 2K, Refs 1–5 frei):
  atlascloud.ai/blog/tips/minimax-h3-api-pricing ·
  wavespeed.ai/blog/ai-api-pricing/minimax-h3-pricing
- Seedance 2.5 BytePlus ($10,70/M bzw. $6,40/M mit Video-Input; ¥3,36/5s
  480p, ¥7,56/5s 720p; API seit ~07.08. verfügbar):
  kie.ai/blog/seedance-2-5-pricing · cometapi.com/seedance-2-5-api-pricing ·
  evolink.ai/blog/seedance-2-5-api-status · docs.byteplus.com (ModelArk
  2607688, aktualisiert 18.08.)
- Seedance 2.0 ~$7/M: apiframe.ai/blog/seedance-2.0-api-providers ·
  anikuku.com/blog/seedance-2-api-pricing-guide-2026
