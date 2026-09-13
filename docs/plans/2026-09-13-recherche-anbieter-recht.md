# Recherche Anbieter, Recht, App Store — Dream Rushes

**Stand: 13.09.2026. Alle Fakten am 13.09.2026 gelesen**, sofern nicht anders vermerkt.
Kein Rechtsrat. „UNGEPRÜFT“ = nicht an einer Primärquelle bestätigt.

---

## 1. Preise (offizielle Modellseiten)

| Posten | Annahme im Projekt | Offiziell am 13.09.2026 | Abweichung |
|---|---|---|---|
| fal MiniMax H3 reference-to-video, 480p | $0,05/s | **$0,05/s** | keine |
| fal MiniMax H3, 768p | $0,06/s | **$0,06/s** (2K $0,13/s, 4K $0,16/s) | keine |
| fal H3 Referenzbilder | erste 5 gratis | **erste 5 gratis, jedes weitere $0,08** | Aufpreis jetzt bekannt |
| fal Seedance 2.5 reference-to-video, 480p | $0,2205/s | **~$0,2205/s** (nur Bild/Audio-Referenzen) | keine |
| fal Seedance 2.5, 720p | $0,473/s | **~$0,4730/s** | keine |
| fal Seedance 2.5 Referenzbilder | – | **„not billed“**; Video-Referenzen ×0,6, zählen aber als Eingabedauer mit (480p ~$0,1323/s, 720p ~$0,2838/s) | – |
| fal Seedance 2.5 Formel | – | Tokens = H×B×(Eingabevideo-s + Ausgabe-s)×24/1024, **$0,0214 je 1.000 Tokens** | – |
| Replicate Seedance 2.5, 480p (ohne Video-Eingang) | $0,1028/s | **$0,1028/s** | keine |
| Replicate Seedance 2.5, 720p (ohne Video-Eingang) | $0,2312/s | **$0,2312/s** | keine |
| Replicate Seedance 2.5 **mit** Video-Eingang | – | **480p $0,4304/s, 720p $0,9676/s** (nach Ausgabesekunden) | ⚠ viermal teurer, falls je Referenzvideos genutzt werden |
| fal wizper | $0,50 je 1.000 min (ADR-0007) | Modellseite und llms.txt zeigen nur **„$0 per compute second“** | **UNGEPRÜFT**: aktueller Preis nicht lesbar, im fal-Dashboard/Billing prüfen |

Weitere Punkte:
- Replicate Seedance 2.5: Feld `reference_images`, **bis 30 Bilder**, nur 480p/720p, Dauer 4–30 s (oder -1), `watermark` standardmäßig aus. Referenzbilder lassen sich nicht mit first/last frame kombinieren.
- Der Replicate-Preis ist **exakt gleich** dem BytePlus-ModelArk-Listenpreis ($0,1028/$0,2312, laut CellCog-Vergleich vom Aug. 2026). fal kostet genau das Doppelte pro Token. Daraus folgt nur als Vermutung (UNGEPRÜFT), dass Replicate direkt an BytePlus weiterleitet.

Quellen:
- https://fal.ai/models/minimax/h3/reference-to-video
- https://fal.ai/models/bytedance/seedance-2.5/reference-to-video
- https://replicate.com/bytedance/seedance-2.5 (Abschnitt Pricing + Input-Schema)
- https://fal.ai/models/fal-ai/wizper , https://fal.ai/models/fal-ai/wizper/llms.txt
- https://cellcog.ai/blog/seedance-2-5-pricing/ (Sekundärquelle, Plattformvergleich)

---

## 2. Datenschutz und Recht: fal.ai vs. Replicate

### 2a. fal.ai (Features & Labels, Inc., USA)

- **AVV/DPA: öffentlich und automatisch Vertragsbestandteil.** Der DPA ist „incorporated into and forms part of“ die ToS, man muss nichts unterschreiben. Stand 31.07.2026. Die ToS vom 08.09.2026 verweisen darauf.
- **Transfer:** SCCs **Modul 2 (Controller→Processor)**, irisches Recht und Gerichtsstand Irland, UK-IDTA. Das DPF nennt der DPA nur als Alternative („if Company notifies Client“). **fal steht nicht in der DPF-Liste** (Suche nach „Features“ und „fal“ auf dataprivacyframework.gov ohne Treffer).
- **Ort:** laut Datenschutzerklärung (22.07.2026) „United States and other countries“. Eine EU-Region wird nicht zugesagt.
- **Unterauftragsverarbeiter:** Liste unter trust.fal.ai/subprocessors (Inhalt war nicht maschinell lesbar, UNGEPRÜFT). Neue Unterauftragsverarbeiter werden **15 Tage vorher** angekündigt, Widerspruch ist binnen 10 Tagen möglich. SOC 2 Type II und ISO-27001-Berichte gibt es auf Anfrage.
- **Kein Training (API Services Terms):** „Company will not use Client Content to create, train, develop …“. **Ausnahme:** Modelle mit der Markierung „Pending Enterprise Ready“ („Excluded Models“). Für diese gelten **auch der DPA und die Sicherheitspflichten nicht**. Ob H3 oder Seedance 2.5 so markiert sind, war ohne Login nicht sichtbar (UNGEPRÜFT, im Dashboard prüfen).
- **Weitergabe an Modellhersteller: ausdrücklich geregelt.** „If Client uses any third-party AI model … Client Content will be transferred to such a third party.“ **H3 und Seedance 2.5 tragen auf fal beide das Abzeichen „Partner“**, laufen also über die API des Herstellers (MiniMax bzw. ByteDance). Das passt zu `partner_validation_failed` im eigenen Worklog (Seedream, 23.08.).
- **Aufbewahrung:** Request-JSON **30 Tage** standardmäßig. Mit dem Header `X-Fal-Store-IO: 0` wird kein JSON gespeichert, CDN-Dateien bleiben aber. Die CDN-Laufzeit steuert `X-Fal-Object-Lifecycle-Preference` (`expiration_duration_seconds`). `DELETE /v1/models/requests/{id}/payloads` löscht Payload und Output-Dateien, **nicht aber die Input-Dateien**. Konten: Löschung 30 Tage nach Schließung, nach 2 Jahren Inaktivität.
- **Eigentum:** Der Kunde behält alle Rechte am Input. fal erhält eine Lizenz nur „to provide the Services“. Für Outputs gibt fal keine Garantie auf Originalität oder Nichtverletzung.
- **Pflichten für uns als App-Betreiber (wichtig):**
  - Nutzer müssen **mindestens 18** sein, und dafür sind wir verantwortlich (ToS §1/§4b, AUP „Other Restrictions“, „legally required age-gating“).
  - Die fal-API darf Endnutzern nicht direkt offenliegen. Das erfüllt der eigene Server-Proxy.
  - Mit Endnutzern müssen wir Verträge schließen, die „as protective“ sind wie die fal-Bedingungen.
  - Wir stellen fal von Ansprüchen frei, falls Inputs Persönlichkeits- oder Datenschutzrechte verletzen.
- **AUP zu echten Personen:** verboten sind u. a. NCII („likeness … sexual … without their consent“), „deepfakes … without their consent to impersonate …“ und die Verarbeitung von „image, voice, or likeness in violation of their rights“ oder „Biometric data“. Die AUP-Klausel zu „collecting, processing … PII“ ist sehr weit formuliert. Ein Anwalt sollte klären, ob Fotos von Cast-Mitgliedern darunterfallen, wenn Einwilligungen vorliegen.

### 2b. Replicate (Replicate, LLC; Adresse 101 Townsend St., SF = Cloudflare-Zentrale; Übernahme durch Cloudflare angekündigt 11/2025)

- **AVV/DPA: kein öffentlicher Self-Serve-DPA gefunden.** ToS (01.04.2026), Datenschutzerklärung (01.04.2026) und AUP erwähnen weder DPA noch GDPR, SCCs oder DPF. Nur die Enterprise-Seite sagt „Stay compliant with data processing agreements“ und verweist auf den Vertrieb. Ein DPA gibt es also vermutlich **nur per Enterprise-Vertrag** (UNGEPRÜFT, beim Sales anfragen).
  - ⚠ Das Suchergebnis „replicatelabs.ai/dpa“ gehört **nicht** zu Replicate, sondern zu Handle Technologies Ltd (UK). Nicht verwechseln.
- **DPF:** Replicate steht **nicht** in der DPF-Liste. Cloudflare, Inc. ist aktiv zertifiziert (EU/CH/UK), ohne sichtbare „Covered Entities“. Ob Replicate darunterfällt: UNGEPRÜFT, nach der Suche eher nein.
- **Ort:** Alle 17 gelisteten Unterauftragsverarbeiter sitzen in den **USA** (AWS, GCP, CoreWeave, Cloudflare, Fly.io, Crunchy Bridge, Sentry, Honeycomb, Stripe …). **ByteDance/BytePlus steht nicht auf der Liste.** Seedance 2.5 ist aber ein „Official“-Modell eines Drittherstellers. Wohin die Referenzbilder tatsächlich gehen, legt Replicate nirgends offen. Das ist eine **Transparenzlücke** (Art. 28 Abs. 2/4 DSGVO).
- **Aufbewahrung: die beste der beiden.** API-Predictions: „All input parameters, output values, output files, and logs are automatically removed after an hour“. Per Web erzeugte Predictions bleiben unbegrenzt gespeichert. Das gilt nur für Replicates eigene Systeme, nicht für einen eventuellen Upstream-Anbieter.
- **Training:** Die ToS-Lizenz (§5.2) reicht nur, soweit nötig, um Output zu liefern, *Customer Derivative Models* (eigene Fine-Tunes) zu bauen, den Dienst zu erbringen und anonymisierte „Resultant Data“ zu erstellen. Ein allgemeines Recht, auf Kundendaten zu trainieren, gibt es nicht. Eine ausdrückliche Zusage wie bei fal fehlt ebenfalls.
- **Eigentum:** Der Kunde besitzt Inputs und Outputs, auch zur kommerziellen Nutzung, „subject to any Third Party Terms“ des Modells.
- **Pflichten für uns:**
  - Wir versichern, „all disclosures, … notices, and … consents“ eingeholt zu haben (§3.1).
  - Nutzer müssen 18 sein oder die Eltern stimmen zu.
  - Nicht erlaubt ist, Services per SaaS „make available … to any person“ (§2.7(c)(iii)). Ob eine Endkunden-App darunterfällt, ist unklar (vermutlich ist Weiterverkauf gemeint). Vor dem Wechsel schriftlich klären.
  - Recht: Kalifornien, Schiedsverfahren.
- **AUP/ToS zu echten Personen:** Verboten ist, „impersonating another individual without consent“, „non-consensual nudity“ zu erzeugen, „harass … stalk“ sowie Rechte Dritter einschließlich Datenschutz zu verletzen.

### 2c. Hersteller dahinter

- **BytePlus ModelArk (Seedance, BytePlus Pte. Ltd., Singapur), Datenverarbeitungsseite vom 10.09.2026:**
  - Verarbeitung in **Malaysia, Indonesien und/oder EU/EEA**, als Auftragsverarbeiter.
  - Kein eigenes Training „without the customer's prior authorization“.
  - ⚠ **Inputs und Outputs, die den Filter auslösen, werden 180 Tage in Malaysia gespeichert.**
- ⚠⚠ **Wichtigster Fund, Stand 13.09.2026:** Laut BytePlus unterstützen „Seedance 2.5 and Seedance 2.0 series models do not support directly uploading reference images/videos that contain real human faces“. BytePlus bietet dafür drei offizielle Wege:
  1. Outputs derselben Plattform und desselben Kontos (höchstens 30 Tage alt) als „trusted“ Input verwenden,
  2. Digital-Character-Bibliothek,
  3. **autorisierte Real-Person-Assets**: Die abgebildete Person verifiziert sich selbst per QR-Code und Gesichts-Liveness-Check und erteilt die Freigabe.

  **UNGEPRÜFT:** Ob fal oder Replicate diesen Gesichtsfilter für ihre Kunden anders konfigurieren. Vor der Umstellung auf Replicate **mit echten Cast-Fotos testen** (Fehlerbild bei BytePlus: `InputImageSensitiveContentDetected.PrivacyInformation`, laut Sekundärquellen).
- **MiniMax API (Nanonoble Pte. Ltd., Singapur), Datenschutzerklärung vom 30.03.2026:** Daten liegen „in the data center located in the United States“. Transfers laufen über SCCs. Sie sagen „do not … use personal data for training to profile or target consumers“, eine generelle Zusage gegen Training gibt es nicht. Diese Erklärung gilt für Direktkunden. Was bei Weiterleitung über fal gilt, ist UNGEPRÜFT.

### 2d. Empfehlung (kein Rechtsrat)

**fal.ai ist heute rechtlich der sicherere Weg für Aufträge mit Fotos echter Menschen.** Gründe:
1. **Art. 28 DSGVO verlangt einen AVV.** fal hat ihn öffentlich, automatisch einbezogen und mit SCCs Modul 2. Bei Replicate ist keiner öffentlich auffindbar. Ohne AVV fehlt dem deutschen Verantwortlichen eine Pflichtgrundlage, und das Problem bleibt, egal wie kurz Replicate speichert.
2. **Transparenz über die Weitergabe an ByteDance/MiniMax.** fal nennt den Transfer an Partner-Modelle vertraglich und markiert die betroffenen Modelle. Replicate listet ByteDance nicht als Unterauftragsverarbeiter.
3. Bei fal gibt es eine **ausdrückliche Zusage gegen Training**, Audit-Berichte (SOC 2/ISO) und eine 15-Tage-Frist für neue Unterauftragsverarbeiter.

Einschränkungen:
- **Beide sind nicht DPF-zertifiziert.** Es bleibt bei SCCs plus Transfer-Impact-Assessment. Der Weiterfluss nach Singapur/Malaysia/USA (ByteDance, MiniMax) muss in Datenschutzerklärung und Einwilligungstext stehen.
- fal speichert Request-JSON standardmäßig 30 Tage. Deshalb **`X-Fal-Store-IO: 0` setzen, eine kurze Lifecycle-Ablaufzeit setzen und Input-Uploads selbst verwalten**.
- Die fal-Pflicht zu **18+** muss in AGB und App (Age-Gate) umgesetzt werden.
- Die Ersparnis mit Replicate (Seedance ~53 % günstiger) ist groß. Sie ist rechtlich erst vertretbar, wenn (a) ein Enterprise-DPA mit SCCs unterschrieben ist, (b) Replicate schriftlich bestätigt, wohin Seedance-Inputs fließen (BytePlus? Region?), (c) §2.7(c)(iii) für Endkunden-Apps geklärt ist und (d) der Gesichtsfilter-Test besteht.
- Als Alternative gibt es BytePlus ModelArk direkt: gleicher Preis wie Replicate, EU/EEA-Rechenzentren möglich, Rolle als Auftragsverarbeiter. Echte Gesichter gehen dort aber **nur über den Verifizierungsweg pro Person**. Der ist rechtlich am stärksten, bedeutet aber schwere UX.

Quellen:
- https://fal.ai/legal/terms-of-service (08.09.2026)
- https://fal.ai/legal/api-services
- https://fal.ai/legal/data-processing-addendum (31.07.2026)
- https://fal.ai/legal/privacy-policy (22.07.2026)
- https://fal.ai/legal/acceptable-use-policy
- https://fal.ai/docs/documentation/model-apis/media-expiration
- https://docs.fal.ai/platform-apis/v1/models/requests/payloads
- https://replicate.com/terms (01.04.2026)
- https://replicate.com/privacy (01.04.2026)
- https://replicate.com/acceptable-use-policy
- https://replicate.com/enterprise
- https://replicate.com/docs/topics/site-policy/subprocessors
- https://replicate.com/docs/topics/predictions/data-retention
- https://www.dataprivacyframework.gov/list (Suche „Features“, „fal“, „Replicate“, „Cloudflare“)
- https://www.cloudflare.com/press/press-releases/2025/cloudflare-to-acquire-replicate-to-build-the-most-seamless-ai-cloud-for-developers/
- https://docs.byteplus.com/en/docs/ModelArk/BytePlus_ModelArk_Data_Processing (10.09.2026)
- https://docs.byteplus.com/en/docs/ModelArk/2608626 (Portrait-Videos, Gesichtsregel)
- https://docs.byteplus.com/en/docs/ModelArk/2315856 (Real-Human-Assets)
- https://platform.minimax.io/protocol/privacy-policy (30.03.2026)

---

## 3. Vergleichbare Plattformen: Uploads mit fremden Personen

| Plattform | ToS/AUP-Klausel (kurz) | Checkbox pro Upload im Produkt? |
|---|---|---|
| **Higgsfield** (ToS 26.07.2026) | §4.2: Nutzer hat „all necessary rights, releases, and consents from such individual“ für „name, likeness, voice“. §5.3 (Biometrie): Einwilligungen für Fotos oder Videos mit Gesichtern. Inputs dürfen fürs Training genutzt werden (außer Enterprise). | Hilfeartikel Soul ID (02.09.2026) nur als Hinweis: „Only upload photos of yourself, or of someone who has given you permission“. Eine Pflicht-Checkbox belegen nur Drittblogs, **UNGEPRÜFT**. |
| **Runway** (ToS 11.05.2026, Usage Policy 06.03.2026) | ToS §3.1: „all rights, licenses, and permissions needed to provide Your Content“. Usage Policy verbietet „image, video, or audio of another person without their permission“ und Characters mit Gesicht oder Stimme unter 18. Inputs dürfen fürs Training genutzt werden (§4.4). | Keine belegt (UNGEPRÜFT). Laut Policy technische Sperren gegen bekannte Persönlichkeiten. |
| **Pika** (ToS „Last modified: 02/11/2026“, also 11.02.2026) | Verboten: „images or likenesses of individuals without their consent or legal right“, AI Self einer anderen Person nur „with explicit written permission“. | Keine belegt (UNGEPRÜFT). |
| **Kling** (ToS 21.04.2026) | §4.3: Nutzer hält Rechte oder „legal authorization“, u. a. „personality rights, personal data rights“. Verbot „impersonate any person“. §4.7.3(f): Training auf Inhalten erlaubt. | Keine belegt (UNGEPRÜFT). |
| **Hedra** (AUP 31.07.2024) | Am strengsten: verboten ist Output mit „media containing individuals other than yourself“ (Ausnahme: Personen, die seit 100+ Jahren tot sind). Dazu ein Deepfake-Verbot „without consent or legal right“. | Keine belegt (UNGEPRÜFT). |
| **Viggle** (ToS 26.08.2026, Community Rules) | „Do not use photos of your friends, family, or anyone else without consent.“ Inhalte mit Prominenten-Likeness dürfen gelöscht werden. Kein Training auf Inhalten zahlender Nutzer ohne Zustimmung. | Keine belegt (UNGEPRÜFT). |

Befund:
- **Branchenstandard ist die Garantie in den AGB** („ich habe die Einwilligung“). Eine nachweisbare Checkbox pro Upload war bei keinem der sechs an einer Primärquelle belegbar. Das ließ sich ohne Konto nicht prüfen.
- Strengere Vorbilder:
  - **OpenAI Sora „Cameos“**: Die Person verifiziert sich selbst per Video, legt fest, wer sie verwenden darf, sieht alle Videos mit ihr und kann widerrufen. Sekundärquellen, UNGEPRÜFT; eine Quelle behauptet, Sora sei seit 26.04.2026 eingestellt.
  - **BytePlus Real-Person-Assets**: Verifizierung und Freigabe per QR-Code durch die abgebildete Person.
- Für ein EU-Unternehmen heißt das: Eine eigene Bestätigung pro Cast-Person (nicht vorangekreuzt, mit Zeitstempel protokolliert) liegt über dem Branchenüblichen und ist als Nachweis sinnvoll. Sie ersetzt aber nicht die Einwilligung der abgebildeten Person selbst (Art. 6/7 DSGVO, § 22 KUG). Einwilligungen für Minderjährige vermeiden oder ausschließen.

Quellen:
- https://higgsfield.ai/terms-of-use-agreement
- https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-create-and-use-a-soul-id-character
- https://runway.com/terms-of-use
- https://runway.com/safety/usage-policy
- https://pika.art/terms-of-service
- https://kling.ai/docs/user-policy
- https://www.hedra.com/acceptable-use
- https://viggle.ai/terms-of-use
- https://viggle.ai/community-rules
- https://openai.com/index/launching-sora-responsibly/ (nicht geöffnet, nur Suchtreffer)

---

## 4. Apple App Store Review Guidelines (Stand „Last Updated: June 8, 2026“)

Konkret gefordert für eine App, die Fotos echter Menschen zu KI-Videos macht:

**5.1.2(i) Weitergabe an Dritt-KI (seit 13.11.2025 ausdrücklich):**
- Wörtlich: „clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so“.
- In der Praxis (Ablehnung im Apple-Forum, Feb. 2026) prüft Apple drei Dinge:
  1. **welche Daten** gesendet werden (Fotos von dir und deinem Cast, Sprachaufnahme, Traumtext),
  2. **an wen**, mit Namen (fal.ai / Replicate und die Hersteller ByteDance, MiniMax, OpenAI),
  3. **Erlaubnis vor dem ersten Senden**: aktiver Opt-in-Dialog, kein Hinweis im Kleingedruckten.
- Dazu passt der Forenfall: Apple lehnte trotz Einwilligungsschaltern mehrfach ohne Detailbegründung ab. Formulierung und Zeitpunkt deshalb sehr explizit machen.

**5.1.1 Datenerhebung:**
- (i) Datenschutzerklärung in App Store Connect **und** in der App. Sie nennt alle Daten, Zwecke und Dritte, bestätigt deren gleichwertigen Schutz, erklärt Aufbewahrung und Löschung und wie man die Einwilligung widerruft.
- (ii) Einwilligung einholen und leicht widerrufbar machen. Bezahlfunktionen dürfen nicht an Datenfreigaben hängen.
- (iii) Datensparsamkeit: **Out-of-process-Picker (PHPicker)** statt vollem Fotozugriff.
- (v) Gibt es Konten, muss man sein **Konto in der App löschen** können.
- (viii) Keine personenbezogenen Daten aus Quellen, die nicht direkt vom Nutzer stammen, ohne ausdrückliche Einwilligung. Bei Cast-Fotos Dritter ein Graubereich, daher Einwilligungsnachweis.

**5.1.2(vi):** Daten aus Kamera- oder Foto-APIs mit Gesichtsbezug nie für Marketing oder Data-Mining verwenden, auch nicht durch Dritte.

**1.1 Anstößige Inhalte:**
- 1.1.1: Diffamierendes oder herabwürdigendes Material gegen Einzelne ist verboten. Relevant, weil man Freunde in Albtraum-Szenen setzen kann.
- 1.1.4: Sexuelles Material ist verboten.
- Nötig ist also ein Prompt- und Output-Filter, der über den Anbieterfilter hinausgeht.

**1.2 User-Generated Content:**
- Gilt, sobald erzeugte Videos in der App geteilt oder sichtbar werden (Feed, öffentliche Links, Freunde).
- Pflicht sind dann: **Filter** für anstößiges Material, **Meldefunktion** mit zeitnaher Reaktion, **Blockieren** missbräuchlicher Nutzer, **veröffentlichte Kontaktadresse**.
- „Objectification of real people“ ist ausdrücklich unzulässig.
- UNGEPRÜFT: ob Apple rein private KI-Generierung ohne Teilen schon als UGC behandelt. Vorsorglich Melden, Löschen und Kontakt einbauen.

**2.3.6 und Alterseinstufung:**
- Den neuen Fragebogen ehrlich beantworten (Stufen 4+/9+/13+/16+/18+).
- **Ab September 2026 Pflicht:** Fragen zu „social media capabilities“ („redistribute, amplify, or interact with user-generated content through a social feed“). Wer sie bejaht, bekommt mindestens 13+ und einen Social-Media-Hinweis.
- 1.2.1(a): Creator-Apps brauchen eine Altersbeschränkung.
- Zusammen mit der **18+-Pflicht aus den fal-ToS** ist ein Age-Gate in der App nötig.

**5.2.2 Drittanbieter-Dienste:** Die App muss die Dienste laut deren Bedingungen nutzen dürfen, und Apple kann einen Nachweis verlangen. fal-API-Terms erlauben eine „Client Solution“ für Endnutzer. Bei Replicate §2.7(c)(iii) klären.

**4.x:** Kaum direkt relevant.
- 4.1(c): Keine fremden Marken wie „Seedance“ oder „Kling“ in App-Name oder Icon ohne Erlaubnis.
- 4.2: Mindestfunktionalität ist unkritisch.

**Nicht in den Guidelines, aber verbunden:** App-Privacy-Label in App Store Connect (u. a. „Photos or Videos“, „Audio Data“, „User Content“ und deren Weitergabe).

Quellen:
- https://developer.apple.com/app-store/review/guidelines/ (Abschnitte 1.1, 1.2, 1.2.1, 2.3.6, 4.1, 5.1.1, 5.1.2, 5.2.2; Last Updated 08.06.2026)
- https://developer.apple.com/news/?id=ey6d8onl (Update Nov. 2025, nur Suchtreffer)
- https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai
- https://developer.apple.com/forums/thread/815109 (Ablehnung 5.1.1(i)/5.1.2(i), Feb. 2026)
- https://developer.apple.com/news/?id=tlur8uvi (Social-Media-Fragen, 09.07.2026)

---

## Offene Prüfpunkte (für Anton)

1. fal-Dashboard: Sind H3 oder Seedance 2.5 als „Pending Enterprise Ready“ markiert? Dann gelten DPA und Trainingsverbot NICHT.
2. Aktuellen wizper-Preis im fal-Billing ablesen.
3. Replicate-Sales:
   - Enterprise-DPA mit SCCs?
   - Wohin gehen Seedance-Inputs (BytePlus, Region)?
   - Ist §2.7(c)(iii) bei Endkunden-Apps unkritisch?
4. Testaufruf Replicate Seedance 2.5 mit echtem Cast-Foto: Greift der BytePlus-Gesichtsfilter?
5. Anwalt: AUP-Klausel von fal zu „PII/likeness/biometric“ gegen das Cast-Feature prüfen lassen, dazu die Einwilligung Dritter (DSGVO, § 22 KUG) und die KI-Kennzeichnung (EU AI Act Art. 50, nicht Teil dieser Recherche).
