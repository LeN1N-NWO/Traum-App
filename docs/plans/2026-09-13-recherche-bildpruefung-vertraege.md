# Recherche: Bildprüfung beim Cast-Upload (Seedance 2.5)

**Stand: 13.09.2026. Alle Quellen am 13.09.2026 gelesen**, sofern nicht anders vermerkt.
Kein Rechtsrat. „UNGEPRÜFT" = nicht an einer Primärquelle belegt oder eigene Schlussfolgerung.
Nur gelesen: nichts registriert, kein Login, kein Formular abgeschickt.

---

## 0. Kurzfazit (das Wichtigste zuerst)

1. **Der BytePlus-Filter sucht nicht nach Promis, sondern nach echten Menschen.** Der Eingangsfilter
   lehnt jedes Referenzbild ab, das „may contain real person" ist
   (`InputImageSensitiveContentDetected.PrivacyInformation`, HTTP 400). Ein Foto von Brad Pitt fällt
   dort genauso durch wie ein Foto von Antons Freund. Der Abgleich mit Personen des öffentlichen
   Lebens läuft laut BytePlus-FAQ **auf den OUTPUTS**. Eine eigene Promi-Prüfung beim Upload
   verhindert deshalb den Hauptfehler nicht. Sie ist nur für fal sinnvoll, falls fal echte Gesichter
   durchlässt (UNGEPRÜFT).
2. **Eine kostenlose Vorab-Prüfung „nimmt Seedance dieses Foto?" gibt es nirgends als eigenen Endpunkt.**
   Weder BytePlus, Replicate noch fal bieten ein „validate only".
   Am nächsten dran sind:
   - **BytePlus Assets-API** (`CreateAsset` → `GetAsset.Status` = `Active`/`Failed`), kostenlos.
     Das ist aber ein Bibliotheks-Upload mit Auflagen, kein Prüf-Endpunkt (Details §1.3).
   - **BytePlus Video-Task anlegen und sofort per `DELETE` stornieren**, solange er `queued` ist.
     Abgelehnte oder fehlgeschlagene Tasks kosten laut Preisseite nichts. Ob die Eingangsprüfung schon
     beim Anlegen greift (synchroner 400) oder erst später als `failed`, ist UNGEPRÜFT.
3. **Echte Cast-Gesichter gehen bei BytePlus offiziell nur über Liveness pro Person.** Der Weg ist
   **per API baubar**: `CreateVisualValidateSession` liefert einen H5-Link, die Person macht darin
   selbst den Liveness-Check, danach folgt `CreateAsset` mit Gesichtsabgleich. Die Hürden:
   - „invited users only",
   - Firmenverifizierung,
   - H5-Seite nur auf zh/en/zh-Hant,
   - Nutzungsregeln verlangen Freischaltung **pro End User**,
   - läuft nur in der Region Johor (Malaysia), die EU-Region hat kein Video.
4. **Scheitern kostet bei BytePlus und Replicate nichts, bei fal ist es unklar.**
   - BytePlus: „No fee is charged if generation fails due to reasons such as content moderation."
   - Replicate: „if a run fails, we don't charge you". Ein **abgebrochener** Lauf eines Official-Modells
     kann aber berechnet werden.
   - fal: 5xx-Fehler kosten nichts, 422 (dazu gehört `content_policy_violation`) „may still be charged".
5. **Higgsfield zeigt vor der Generierung „checking → eligible / not eligible"** am hochgeladenen Element.
   Das belegen nur Drittblogs (UNGEPRÜFT). Laut eigener Hilfe baut Higgsfield echte Personen über
   Soul ID: erst Porträts erzeugen, dann daraus das Element. Das Foto geht also nicht direkt an Seedance.
6. **Eigene Promi-Erkennung (AWS Rekognition, Hive) ist billig, aber rechtlich heikel.** Das
   Durchsuchen jedes Gesichts gegen eine Personendatenbank ist biometrische Verarbeitung nach Art. 9
   DSGVO, und zwar auch für Nicht-Promis. Einwilligen müsste die abgebildete Person, nicht der
   Hochlader. Google hat seine Promi-Erkennung am 16.09.2025 abgeschaltet.

---

## 1. BytePlus ModelArk

### 1.1 Die Regel und ihre drei Wege
Quelle: „Create portrait videos with Dreamina Seedance models", zuletzt aktualisiert 08.09.2026.

Wörtlich: „Seedance 2.5 and Seedance 2.0 series models do not support directly uploading reference
images/videos that contain real human faces."

**Weg 1: Trusted outputs.** Nur Originalausgaben **desselben Kontos**, höchstens 30 Tage alt, ohne
Nachbearbeitung. Plattform- und kontoübergreifend geht nicht. Komprimieren oder Weiterleiten kann
den Trust brechen. Vertraut werden:
- Videos mit Gesichtern aus Seedance 2.5/2.0 (seit 11.03.2026),
- deren Last-Frames (seit 16.04.2026),
- **Bilder mit Gesichtern aus Seedream 5.0 lite text-to-image** (seit 16.04.2026).
  Genannt ist nur text-to-image, Edit/image-to-image nicht. Ein Nutzerfoto lässt sich darüber
  also nicht „waschen" (Schlussfolgerung).

Außerdem: „Trust applies only to input assets. Output may still fail due to ModelArk security moderation."

**Weg 2: Digital character library.** Vorgefertigte, kostenlose Figuren, eingebunden über `asset://<id>`.

**Weg 3: Autorisierte Real-Person-Assets** (Details in §1.4).

Quellen:
- https://docs.byteplus.com/en/docs/ModelArk/2608626
- https://docs.byteplus.com/en/docs/ModelArk/2223965

### 1.2 Fehlercodes (Error codes, zuletzt aktualisiert 11.09.2026)

| HTTP | Code | Bedeutung (BytePlus) |
|---|---|---|
| 400 | `InputImageSensitiveContentDetected.PrivacyInformation` | „The input image may contain a real person." |
| 400 | `InputVideoSensitiveContentDetected.PrivacyInformation` | dasselbe für Video |
| 400 | `InputImageSensitiveContentDetected` | Bild enthält „sensitive information" |
| 400 | `InputImageSensitiveContentDetected.PolicyViolation` | „may be related to copyright restrictions" |
| 400 | `OutputVideoSensitiveContentDetected` / `.PolicyViolation` | Output-Filter bzw. Urheberrecht |
| 400 | `OutputImageSensitiveContentDetected.DeepFake` | „counterfeit documents or credentials" |

Quelle: https://docs.byteplus.com/en/docs/ModelArk/1299023

**Wie der Promi-Abgleich funktioniert** (Content filter FAQ, 10.09.2026):
- Er „analyzes AI-generated **outputs** to determine whether a detected face or voice is similar to that
  of a public figure included in the feature's reference set".
- Er ist ausdrücklich kein vollständiger Schutz.
- Streichung oder Aufnahme von Personen per E-Mail an privacy@byteplus.com.

**Wie der Filter allgemein aufgebaut ist** (Content filter overview, 10.09.2026):
- Zwei Schichten: Eingangsfilter und Output-Moderation.
- Pro Endpoint abschaltbar, aber „baseline content safety policies" bleiben immer an.
- Gefilterte Inhalte und Logs werden „for a limited period" auf Servern in **Malaysia oder Singapur** gespeichert.

Quellen:
- https://docs.byteplus.com/en/docs/ModelArk/content_pre_filter_faq
- https://docs.byteplus.com/en/docs/ModelArk/Content_Pre-filter
- https://ai.byteplus.com/en/help/article/why-was-my-request-rejected-for-sensitive-or-non-compliant-content-and-how-do-i-reduce-false-rejections (18.08.2026)

**Eigenständige Moderations-API bei BytePlus:** Keine gefunden. Der Content-Filter ist nur als
Schalter am Inference-Endpoint dokumentiert, nicht als eigener Prüf-Endpunkt (UNGEPRÜFT, dass es keinen gibt).

### 1.3 Assets-API: Virtuelle Porträts (Gruppentyp `AIGC`)
Quelle: „Private virtual portrait library", zuletzt aktualisiert 31.08.2026.

**Grundsätzliches:**
- Aufrufe über OpenAPI mit **AK/SK-Signatur**, nicht mit dem ARK-API-Key.
- Service `ark`, Version `2024-01-01`, Region `ap-southeast-1`.

**Endpunkte:**
- `CreateAssetGroup`
  - Body: `Name`, `Description`, `GroupType` (nur `AIGC`), `ProjectName`
  - Antwort: `{"Id":"group-…"}`
  - Beim ersten Mal muss man in der Konsole ein „authorization letter" unterschreiben.
- `CreateAsset`
  - Body: `GroupId`, `URL`, `AssetType` (`Image|Video|Audio`), `Name`,
    `Moderation: {"Strategy":"Skip"}` (optional), `ProjectName`
  - Antwort: `{"Id":"asset-…"}`
  - **Asynchron**, ohne SLA.
- `GetAsset`
  - Antwort: `Status` (`Processing|Active|Failed`), `Moderation.Strategy`, `URL`, `LastInferenceTime` …
  - Laut Doku wird bis `Active` gepollt. **Einen Fehlergrund-Text im Beispiel gibt es nicht.**
    Laut Drittanbieter-Doku liefert `GetAsset` ein Feld `Error` (UNGEPRÜFT).
- Außerdem: `ListAssets`, `ListAssetGroups`, `GetAssetGroup`, `UpdateAsset(Group)`, `DeleteAsset(Group)`.

**Prüfung beim Upload:**
- „ModelArk will conduct a security review of the assets you upload."
- Standardmäßig läuft der „Content Pre-filter review". `Strategy: Skip` überspringt „most non-baseline
  content security review policies". Dafür muss der Pre-filter vorher in der Konsole abgeschaltet sein.
- **Auflage:** Das Asset „must not resemble any real human person's portrait". Echte Fotos gehören
  also ausdrücklich NICHT hierher. Diesen Weg als Echtfoto-Vorprüfung zu missbrauchen, verstieße
  gegen die Upload-Zusage (Commitment Letter).

**Limits pro Konto (QPS):**
- `CreateAssetGroup` 10
- `GetAsset` 100
- `ListAssets` 10
- `DeleteAssetGroup` 5
- `CreateAsset`: abhängig vom Rechte-Paket (siehe Tabelle unten)

Bildvorgaben: jpeg/png/webp/bmp/tiff/gif/heic, Seitenverhältnis 0,4–2,5, 300–6000 px, < 30 MB.

Quelle: https://docs.byteplus.com/en/docs/ModelArk/2333565

**Preis der Asset-Bibliothek** („Dreamina Seedance Advanced Creation Rights purchase guide", 31.08.2026):

| Paket | Preis | Real-Person per Konsole | Real-Person per API | Virtuelle Porträts (Konsole+API) | Kontingent | `CreateAsset` |
|---|---|---|---|---|---|---|
| Basic (Free tier) | kostenlos | ✅ | ❌ | ❌ | 50 Assets / 50 Gruppen | 3 QPM |
| Advanced (Entry) | kostenlos | ✅ | ✅ | ✅ | 50 / 50 | 3 QPM |
| Advanced | $1.400/Monat oder $14.000/Jahr | ✅ | ✅ | ✅ | 1 Mio. / 1 Mio. | 120 QPM |
| Advanced Premium | $4.200/Monat oder $42.000/Jahr | ✅ | ✅ | ✅ | 5 Mio. / 5 Mio. | 300 QPM |

Weitere Punkte:
- **Voraussetzung für die Pakete:** BytePlus-Konto mit **Enterprise-Verifizierung** und
  „Organization real-name authentication" mit Kopie des Handelsregisterauszugs. Ob das auch für
  „Entry" gilt, ist nicht getrennt ausgewiesen (UNGEPRÜFT).
- Das Paket ist ausdrücklich „a value-added subscription service for enterprise users".
- Keine Erstattung. Nach Ablauf 15 Tage Karenz, dann werden die im Abo angelegten Assets gelöscht.
- **Einzelne Asset-Operationen sind nicht bepreist.** Kosten entstehen nur über das Paket und die Videogenerierung.
- Für eine App mit vielen Nutzern reichen 50 Assets nicht, praktisch braucht es mindestens **$1.400/Monat**.
- Zu akzeptierende Regeln: Terms of Use for Asset Library, Commitment Letter for Virtual Avatar
  Assets, Real Person Verification H5/API Usage Rules, Customer Code of Conduct.

Quellen:
- https://docs.byteplus.com/en/docs/modelark/2377608
- https://docs.byteplus.com/en/docs/ModelArk/2275639
- https://docs.byteplus.com/en/docs/ModelArk/2275638
- https://docs.byteplus.com/en/docs/ModelArk/2353368

### 1.4 Real-Person-Assets per API (Gruppentyp `LivenessFace`)
Quelle: „Private real-human asset library guide (**invited users only**)", zuletzt aktualisiert 31.08.2026.

**Ablauf per API:**
1. `CreateVisualValidateSession` (3 QPS)
   - Body: `CallbackURL` (Pflicht), `ProjectName`
   - Antwort: `BytedToken`, `H5Link`, `CallbackURL`
   - Der AK/SK-Account braucht `ArkFullAccess`.
2. Die **abgebildete Person** öffnet den H5-Link, zum Beispiel aus unserer App oder per Nachricht an den Freund.
   - Sie bestätigt, wer anfragt, stimmt der Verarbeitung zu und macht den **Liveness-Check**.
   - Sprache über `lng`: **nur `zh` (Standard), `en`, `zh-Hant`**, kein Deutsch.
   - Schlägt der Check fehl, braucht es eine neue Session. Der Link verfällt dann.
3. Weiterleitung auf `CallbackURL?bytedToken=…&resultCode=10000&algorithmBaseRespCode=0&reqMeasureInfoValue=0|1&verify_type=real_time`
   - `resultCode=10000` bedeutet bestanden.
   - `reqMeasureInfoValue` zeigt, ob die Prüfung berechnet wurde. Laut Doku ist sie
     „currently free for a limited time".
4. `GetVisualValidateResult` (3 QPS)
   - Body: `BytedToken` (gilt 30 min), `ProjectName`
   - Antwort: `{"GroupId":"group-…"}`
5. `CreateAsset` in diese Gruppe:
   - Das System vergleicht das hochgeladene Bild mit dem Referenzbild aus dem Liveness-Check.
     Ist es eine andere Person, schlägt der Upload fehl.
   - Bei **mehreren Gesichtern im Bild** ist kein Upload möglich.
   - Status über `GetAsset`.
6. Generierung mit `asset://<asset_id>` als `reference_image`.

**Konsolen-Variante** (Seite „Add real-human assets", 04.09.2026):
- QR-Code in der Playground-Konsole, Gültigkeitsdauer der Autorisierung einstellbar.
- Die Person scannt den Code, **loggt sich mit einem eigenen BytePlus-Konto ein**, macht den
  Liveness-Check und lädt ihre Bilder selbst hoch.
- Der Auftraggeber muss die Assets per „Accept" annehmen.
- Das Konto braucht „real-human or enterprise authentication".
- Der API-Weg (H5) erwähnt kein Login der Person. Ob sie dort ein BytePlus-Konto braucht, ist UNGEPRÜFT.

**Nutzungsregeln Real Person Verification H5/API.** Was für uns daraus folgt:
- **Ausdrückliche Einwilligung** der Person vor dem Aufruf: aktiv, nicht vorangekreuzt, nicht gebündelt.
  Einwilligungsnachweis mit Zeitstempel und Version aufbewahren.
- Die **Datenschutzerklärung** braucht einen eigenen Abschnitt zu Gesichtsdaten. Speicherdauer und
  Löschung der Referenzbilder legt **der Kunde** fest (also wir). Betroffenenrechte laufen über uns.
- **DSFA** (Datenschutz-Folgenabschätzung) regelmäßig durchführen.
- ⚠ **§5.2 „Per-End-User … Review Exemption"**: Die Freistellung von der Echtmensch-Prüfung gilt nur
  für Anfragen, die der verifizierte End User selbst „under their unique account" stellt. Ein
  Verifizierungsergebnis darf keinen anderen End User freistellen.
  **Lesart (UNGEPRÜFT, rechtlich klären):** Ein Freund verifiziert sich, und ein anderer Nutzer
  (der Träumer) verwendet ihn dann im eigenen Video. Das ist vom Wortlaut eher **nicht** gedeckt.
  Unstrittig gedeckt ist der Nutzer selbst („Me"-Cast).
- §5.3: keine Weitergabe, kein Profiling, nach Widerruf Verarbeitung sofort stoppen.

**Regionen** („Region availability"):
- ModelArk hat Johor (`ap-southeast-1`) und Dublin (`eu-west-1`).
- **Die EU-Region unterstützt derzeit nur `seed-2-0-lite` sowie die Chat- und Image-API**, keine
  Videogenerierung.
- Requests können zwischen AP und EU „spill over".
- Seedance 2.5 und die Assets laufen also in Johor, Malaysia.

Quellen:
- https://docs.byteplus.com/en/docs/ModelArk/2333589
- https://docs.byteplus.com/en/docs/ModelArk/2315856
- https://docs.byteplus.com/en/docs/ModelArk/BytePlus_Real_Person_Verification_H5_and_API_Usage_Rules
- https://docs.byteplus.com/en/docs/ModelArk/2191806

### 1.5 Kosten, Scheitern, Stornieren

**Preisseite** („Pricing", zuletzt aktualisiert 11.09.2026):
- `dreamina-seedance-2-5-260628`, 480p/720p ohne Video-Input: **$10,70 je 1 Mio. Tokens**.
  Mit Video-Input $6,40 je 1 Mio. Tokens; dann zählt aber die Input-Dauer mit und es gilt ein Mindestverbrauch.
- 1080p: $11,70 bzw. $7,00, bis 17.09.2026 mit 28 % Rabatt.
- Tokens ≈ (Input-Video-s + Output-s) × Breite × Höhe × fps / 1024.
- Beispiel 480p, 16:9, 5 s: **$0,514 je Video, $0,103 je Sekunde**. 720p: $1,156 bzw. $0,231 je Sekunde.
- Wörtlich: **„You are only charged for successfully generated videos. No fee is charged if generation
  fails due to reasons such as content moderation."**

**Stornieren:** `DELETE /api/v3/contents/generations/tasks/{id}` bricht nur Tasks im Status
`queued` ab. `running` lässt sich nicht stornieren.

**Idee für eine Vorprüfung (UNGEPRÜFT):**
- Kürzesten 480p-Task mit dem Referenzbild anlegen. Bei `400 …PrivacyInformation` kostet es nichts.
- Wird der Task angenommen, sofort `DELETE`, solange er `queued` ist.
- Offen:
  - ob die Eingangsmoderation synchron beim Anlegen greift,
  - wie lange Tasks in `queued` bleiben,
  - ob BytePlus das als Missbrauch wertet.
- Die Output-Moderation (Promi-Ähnlichkeit) testet das ohnehin nicht.

Quellen:
- https://docs.byteplus.com/en/docs/ModelArk/1099320
- https://docs.byteplus.com/en/docs/ModelArk/1521720

---

## 2. Replicate (`bytedance/seedance-2.5`)

**Gesichtsregel auf der Modellseite:** Keine erwähnt.
- Die Modellseite hat Stand „Model updated 2 weeks, 5 days ago", 139,5 Tsd. Läufe, Label „Official".
- Das Input-Schema nennt nur `reference_images` (bis 30), `reference_videos`, `reference_audios`.
- Kein Hinweis auf echte Gesichter, Moderation oder Asset-IDs. Auch `bytedance/seedance-2.0` hat keinen.
- Keine GitHub-Issues oder Community-Berichte gefunden, ob Replicate den BytePlus-Filter weiterreicht.
- Da der Replicate-Preis exakt dem BytePlus-Listenpreis entspricht ($0,1028/s 480p), liegt nahe,
  dass Replicate BytePlus direkt nutzt und damit auch dessen Filter greift (UNGEPRÜFT, **mit echtem
  Cast-Foto testen**).

Quellen:
- https://replicate.com/bytedance/seedance-2.5
- https://replicate.com/bytedance/seedance-2.0

**Abrechnung:**
- „For all models, if a run fails, we don't charge you."
- „If you cancel a run for an official model, you may still be charged."
- Official-Modelle werden „by output (or in some cases, input)" berechnet.
- **Einen Validierungs-Endpunkt oder Dry-Run gibt es nicht.** Ein fehlschlagender Lauf ist
  gratis, ein abgebrochener nicht sicher.

Quellen:
- https://replicate.com/docs/topics/billing
- https://replicate.com/docs/topics/models/official-models

**Neu entdeckt (nicht gefragt, aber relevant):** Seedance 2.5 gibt es auch als „Third-party"-Modell bei **Cloudflare AI**.
- Aufruf: `env.AI.run('bytedance/seedance-2.5', …)`.
- Parameter **`use_virtual_avatar`**: „Route image reference inputs … through ByteDance's trusted
  virtual avatar asset library before generation. Intended for AI-generated/virtual character avatars
  that would otherwise be blocked by face or deepfake detection".
- Das bestätigt, dass Cloudflare und Replicate (gleicher Konzern) auf BytePlus aufsetzen und dort
  echte Gesichter blocken. Es hilft aber **nicht** bei echten Fotos, denn die AIGC-Bibliothek
  verbietet echte Personen.
- Preis und die Frage, ob Cloudflares DPA Third-party-Modelle abdeckt: UNGEPRÜFT.
- Quelle: https://developers.cloudflare.com/ai/models/bytedance/seedance-2.5/

---

## 3. fal.ai (`bytedance/seedance-2.5/reference-to-video`)

**Modellseite und API-Seite:**
- Keine Aussage zu echten Gesichtern, Moderation oder Abrechnung von Fehlern.
- Abzeichen „Partner", Preis ~$0,4730/s (720p).

Quellen:
- https://fal.ai/models/bytedance/seedance-2.5/reference-to-video
- https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api

**Fehlertypen:**
- `content_policy_violation` (422, nicht wiederholbar): „The content may have been flagged by either
  fal's filter or one of our partners'. Sensitivity levels can vary between partner APIs."
- `partner_validation_failed` ist **nicht öffentlich dokumentiert**. Im eigenen Projekt kam er als
  `reason` innerhalb von `content_policy_violation` bei Seedream (ByteDance) vor:
  - 23.08.2026: bei wortgleichen Aufträgen 8 von 12 abgelehnt, also nicht deterministisch.
  - Siehe `src/lib/imageModel.js` und `docs/WORKLOG.md`.
- Auch `face_detection_error` ist dokumentiert („Could not detect face in the image").

Quellen:
- https://fal.ai/docs/errors
- https://fal.ai/docs/model-apis/errors

**Abrechnung (fal FAQ):**
- „Server errors (HTTP 500+) are never charged."
- „Client-side errors like invalid inputs (HTTP 422) may still be charged if a runner spent GPU time
  processing the request before the error was detected."
- Ob Partner-Ablehnungen berechnet werden: **UNGEPRÜFT**, im fal-Billing gegen konkrete Request-IDs prüfen.
- Die „Kein Geld verloren"-Notiz im Worklog betrifft die **App-eigenen** Credits, nicht fal.
- Quelle: https://fal.ai/docs/documentation/model-apis/faq

**Prüf-Endpunkte bei fal:**
- `fal-ai/imageutils/nsfw`: **$0,001 je Bild**, liefert eine NSFW-Wahrscheinlichkeit.
- **Einen Gesichts- oder Promi-Erkennungsendpunkt fand ich im Katalog nicht**. SAM 3 segmentiert
  Objekte, ist aber kein Promi-Check.

Quellen:
- https://fal.ai/models/fal-ai/imageutils/nsfw
- https://fal.ai/docs/model-api-reference/vision-api/imageutils

---

## 4. Verträge

### 4a. Replicate

**DPA:**
- Kein öffentlicher DPA gefunden.
- Die Enterprise-Seite sagt nur „Stay compliant with data processing agreements" und „Include indemnity coverage".
- **Kontaktweg:** Formular „Talk to us" auf https://replicate.com/enterprise#contact-form
  (Felder: Name, Firmen-E-Mail, Firma, Replicate-Username, Nachricht).
- Eine Vertriebs-E-Mail steht dort nicht. Nur in der Datenschutzerklärung (01.04.2026) steht **privacy@replicate.com**.
- Die Adresse sales@replicate.com nannte nur eine Such-Zusammenfassung (UNGEPRÜFT).

**Trust Center / SOC 2:** Nichts Öffentliches gefunden (UNGEPRÜFT, beim Vertrieb erfragen).

**Cloudflare:**
- Die Übernahme von Replicate, Inc. wurde laut Cloudflare-10-Q am **01.12.2025** vollzogen
  (Kaufpreis $57,4 Mio., laut Such-Zusammenfassung des 10-Q, nicht selbst im Dokument gelesen).
- Der **Cloudflare Customer DPA v6.4 (03.04.2026) erwähnt „Replicate" nicht** (17 Seiten, Volltext durchsucht).
  Er gilt für „Services provided by Cloudflare" unter einem Cloudflare-Vertrag. Replicate hat weiter
  eigene ToS.
- Die Einstiegsseite zu Cloudflares Unterauftragsverarbeitern nennt Replicate nicht.
- **Ergebnis:** Der Cloudflare-DPA deckt Replicate derzeit nicht erkennbar ab.

Quellen:
- https://replicate.com/enterprise
- https://replicate.com/privacy
- https://www.cloudflare.com/cloudflare-customer-dpa/
- https://cf-assets.www.cloudflare.com/slt3lc6tev37/1TTgT35GoUNlKZYGuKWBFy/4e7dfc8cf402419a9b1cf624291fc69f/cloudflare_customer_dpa-v6.4_april_3_2026.pdf
- https://www.cloudflare.com/gdpr/subprocessors/
- https://www.sec.gov/Archives/edgar/data/0001477333/000147733326000054/cloud-20260630.htm (nur Suchtreffer)

### 4b. BytePlus ModelArk: Verträge zum Lesen

- **Customer Agreement** (31.08.2026): https://docs.byteplus.com/en/docs/legal/docs-customer-agreement
  - Vertragspartner: „BytePlus Pte. Ltd. or another Affiliate … designated as the contracting entity".
  - **Recht Singapur, Schiedsverfahren SIAC mit Sitz in Singapur**.
  - Der DPA ist per Verweis einbezogen.
  - Kündigung ohne Grund mit 30 Tagen Frist.
- **Data Processing Addendum** (15.05.2026, gilt für Verträge ab 01.06.2026):
  - https://docs.byteplus.com/en/docs/legal/docs-data-processing-addendum
  - Alternative URL: https://docs.byteplus.com/legal/docs/data-processing-addendum
  - BytePlus handelt als Auftragsverarbeiter.
  - EU-SCCs Modul 1/2/3, Klausel 9 Option 2 (allgemeine Genehmigung), **irisches Recht und irische
    Gerichte**, UK-Addendum.
  - ⚠ **§4.2:** „Customer shall not use, configure or deploy any of the Services in a way that will
    result in BytePlus collecting any Special Category Data". Das steht in Spannung zur
    Liveness-/Gesichtsabgleich-Funktion (biometrische Daten nach Art. 9 DSGVO). **Anwalt oder
    BytePlus schriftlich klären.**
- **Unterauftragsverarbeiter:** https://docs.byteplus.com/en/docs/legal/sub-processors-list
- **Terms of Service:** https://docs.byteplus.com/en/docs/legal/docs-terms-of-service
- **Service Specific Terms (Model Services):** https://docs.byteplus.com/en/docs/legal/docs-service-specific-terms#s-specific-terms-for-the-byteplus-model-services
  - Die früheren „Specific Terms for Video Generation Model Services" sind dort eingegangen (Hinweis vom 08.09.2026).
- **Copyright and Portrait Feature Usage Rules** (04.08.2026): https://docs.byteplus.com/en/docs/modelark/copyright_and_portrait_feature_usage_rules
- **Asset-Bibliothek:** https://docs.byteplus.com/en/docs/ModelArk/2275639 (Terms of Use),
  https://docs.byteplus.com/en/docs/ModelArk/2275638 (Commitment Letter),
  https://docs.byteplus.com/en/docs/ModelArk/BytePlus_Real_Person_Verification_H5_and_API_Usage_Rules
- **Datenverarbeitung ModelArk** (aus früherer Recherche, 10.09.2026): https://docs.byteplus.com/en/docs/ModelArk/BytePlus_ModelArk_Data_Processing

**Konto, KYC, Zahlung:**
- **Kontotypen** (13.09. gelesen, Seite vom 15.07.2026):
  - **Personal** (vereinfachtes Profil) hat Zugriff auf eine Teilmenge, darunter ausdrücklich **ModelArk, Seedream, Seedance**.
  - **Business** hat den vollen Katalog.
  - Kontotyp und Land sind **nicht änderbar**.
  - „Real-Name Authentication" gibt es nur für Business und ist nur für Ressourcen in Festland-China nötig.
  - Einzelpersonen können Seedance also grundsätzlich nutzen.
- **Die Asset-Bibliothek und Advanced Creation Rights brauchen dagegen Enterprise-Verifizierung plus
  „Organization real-name authentication"** mit Handelsregisterdokument. Die Real-Person-API ist zusätzlich „invited users only".
- Eine KYC-FAQ nennt keine Deutschland-spezifischen Regeln: „some regions or individual users may not be
  eligible for self-service verification".
- **Zahlung:** Kredit-/Debitkarte (Visa, MasterCard, Amex, Maestro), PayPal für ausgewählte Produkte,
  oder Kreditlinie (Postpaid, auf Antrag). Karteninhaber werden nicht geprüft.
- **Mindestumsatz:** Für Pay-as-you-go nicht gefunden.
  - Seedance-2.0-Ressourcenpakete gibt es ab $4,30 (1 Mio. Tokens).
  - Die Parallelität hängt vom aufgeladenen Betrag ab (Fehlertext: „maximum concurrency limit for your current recharge amount").
  - Genaue Stufen: UNGEPRÜFT.

Quellen:
- https://docs.byteplus.com/en/docs/Account/Introduction_to_Byteplus_account_type
- https://docs.byteplus.com/en/docs/byteplus-platform/docs-signing-up-your-account
- https://ai.byteplus.com/en/help/article/what-identity-verification-real-name-kyc-is-required-and-what-documents-do-i-need
- https://ai.byteplus.com/en/help/article/what-payment-methods-does-byteplus-support
- https://docs.byteplus.com/en/docs/ModelArk/2191775 (Ressourcenpakete, nur Suchtreffer)
- Preisseite: https://docs.byteplus.com/en/docs/ModelArk/1099320

---

## 5. Higgsfield

**Belegt (Primärquellen Higgsfield):**
- **Wann Sicherheitsfilter laufen:** „during prompt processing and during image upload or reference input".
  Externe Anbieter haben eigene Filter, deren Regeln Higgsfield nicht kennt. Credits für NSFW-Fehlschläge
  werden „for most models" automatisch erstattet.
  Quelle: https://higgsfield.ai/creator-hub/help-center/troubleshooting/content-flagged-as-nsfw (dateModified 01.09.2026)
- **Soul ID:**
  - 20 oder mehr Fotos einer Person (bis 80), gut ausgeleuchtet, ohne Sonnenbrille, mindestens ein Ganzkörperbild.
  - Hinweis „Only upload photos of yourself, or of someone who has given you permission".
  - Automatische Prüfungen beim Upload werden dort **nicht** beschrieben.
  - Quelle: https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-create-and-use-a-soul-id-character (02.09.2026)
- **Seedance auf Higgsfield:** „If the character is a real person, train a Soul ID first and create the
  Element from its portraits." Echte Personen gehen also über **von Higgsfield erzeugte Porträts**, nicht
  über das Originalfoto. Das entspricht dem BytePlus-Weg „KI-Porträt statt Echtfoto".
  - Quelle: https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-seedance
  - Auf welchem BytePlus-Weg das technisch läuft (Virtual-Avatar-Bibliothek, Sondervertrag): UNGEPRÜFT.

**UNGEPRÜFT (nur Drittquellen):**
- clipdance.ai (16.06.2026, nicht mit Higgsfield verbunden): Hochgeladene Referenzbilder bekommen einen
  **„element eligibility"-Status**, erst „checking", dann „eligible" oder „not eligible". Das
  „misidentifies AI-generated or original characters as known public figures or celebrities"
  gelegentlich, meist wegen fotorealistischer Gesichter.
- creativepadmedia.com (03.04.2026): Eine „Face Eligibility"-Funktion „pre-analyzes uploaded portrait
  images … notifying users beforehand if an image is ineligible", um Credits zu sparen.
- seedance2pro.io (25.06.2026): Die Fehlerbezeichnung „Visual Restriction" stamme vor allem von Higgsfield.

Quellen:
- https://clipdance.ai/blog/seedance-2-not-eligible
- https://www.creativepadmedia.com/seedance-2-0-on-higgsfield-is-the-best-complete-review/
- https://seedance2pro.io/blog/how-to-fix-seedance-2-not-eligible

**Einordnung (Schlussfolgerung, UNGEPRÜFT):** Wie Higgsfield intern prüft, ist öffentlich nicht beschrieben.
Denkbar ist:
- ein eigener Klassifikator (Gesicht, fotorealistisch, Promi),
- oder ein vorgeschalteter `CreateAsset` in die BytePlus-Bibliothek. Dessen `Processing`→`Active/Failed`
  würde genau zu „checking → eligible/not eligible" passen.

---

## 6. Eigene Promi-/Gesichtsprüfung: Optionen

| Anbieter | Funktion | Preis je Bild | EU | Datenschutz-Hinweise |
|---|---|---|---|---|
| **AWS Rekognition** `RecognizeCelebrities` | Promi-Erkennung („tens of thousands"), bis 64 größte Gesichter. Liefert `CelebrityFaces` (Name, ID, `MatchConfidence`) und `UnrecognizedFaces`. Nur JPEG/PNG. | Group 2: **Frankfurt $0,0012** (0–1 Mio.), $0,00096 (1–5 Mio.). US-Ost $0,0010. Free Tier 1.000 Bilder/Monat für 12 Monate. | Endpunkte in eu-central-1, eu-west-1, eu-west-2, eu-south-2. Frankfurt ohne ausgewiesene Einschränkung. TPS Frankfurt 5, Irland 50. | AWS-KI-Dienste dürfen Inhalte zur Verbesserung speichern und nutzen, **auch außerhalb der Region**. Abschalten per AWS-Organizations-Opt-out-Policy. Die „Biometric Notice and Consent Terms" (14.11.2024) verpflichten zu Hinweisen und Einwilligung „where required", u. a. nach GDPR. Rekognition speichert nicht, in welchen Bildern ein Promi erkannt wurde. Zweck laut AWS: Medien-Tagging, „exclusively in cases where you expect there may be a known celebrity". |
| **AWS Rekognition** `DetectFaces` / `DetectModerationLabels` | Gesichtserkennung ohne Identifizierung bzw. Moderation | wie oben (Group 2) | wie oben | Gesichtsdetektion ohne Abgleich ist in der Regel keine Identifizierung (Einordnung UNGEPRÜFT). |
| **Google Cloud Vision** | Promi-Erkennung **abgeschaltet**: deprecated 16.09.2024, „no longer be available … after September 16, 2025". War vorher nur für geprüfte Medienunternehmen. | – | – | – |
| **Hive** Celebrity Recognition | über 50.000 Personen (Politik, Sport, Religion, Promi), Bounding Box, Name, Konfidenz | **$1,50 je 1.000 Requests** ($0,0015). Visual Moderation $3/1.000. KI-Bild-Erkennung $6/1.000. $50+ Startguthaben mit Zahlungsmittel. | EU-Hosting nicht gefunden (UNGEPRÜFT) | Keine Aussagen zu Speicherdauer in der Modell-Doku |
| **Sightengine** (Paris) | **Aktuell kein Promi-Modell im Katalog.** Vorhanden: Gesichtserkennung, Minderjährigen-/Altersschätzung, Liveness, Deepfake- und KI-Bild-Erkennung | Free: 2.000 Operationen/Monat. Starter $29 für 10.000, Pro $99 für 40.000, darüber $0,002 je Operation. Fehlerhafte Requests kosten nichts. | Server in der EU (Paris), Datenresidenz möglich (Suchtreffer/Security-Seite) | DPA vorhanden (PDF vom 07.04.2026), EU-Kunden sollen ihn unterschreiben. Sofortige Löschung nach Verarbeitung möglich. |
| **fal** `imageutils/nsfw` | nur NSFW | $0,001 | USA | siehe fal-DPA (frühere Recherche) |

Quellen:
- https://aws.amazon.com/rekognition/pricing/
- https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRekognition/current/eu-central-1/index.json (Preisliste, veröffentlicht 11.09.2026)
- https://docs.aws.amazon.com/general/latest/gr/rekognition.html
- https://docs.aws.amazon.com/rekognition/latest/dg/celebrities.html
- https://docs.aws.amazon.com/rekognition/latest/APIReference/API_RecognizeCelebrities.html
- https://aws.amazon.com/legal/biometric-notice-and-consent-terms/
- https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html (nur Suchtreffer)
- https://aws.amazon.com/rekognition/faqs/ (nur Suchtreffer)
- https://docs.cloud.google.com/vision/docs/deprecations
- https://thehive.ai/pricing
- https://docs.thehive.ai/docs/celebrity-recognition
- https://sightengine.com/pricing
- https://sightengine.com/docs/models
- https://sightengine.com/security
- https://s3-eu-west-1.amazonaws.com/static.sightengine.com/legal/20260407-dpa.pdf (nur Suchtreffer)

**Datenschutz-Einordnung (kein Rechtsrat):**
- **Promi-Erkennung ist 1:N-Identifizierung.** Jedes Gesicht, auch das eines Nicht-Promis, wird in ein
  Merkmalsmuster umgerechnet und gegen eine Datenbank abgeglichen. Das ist „biometrische Daten zur
  eindeutigen Identifizierung" nach Art. 4 Nr. 14 und Art. 9 Abs. 1 DSGVO (vgl. ErwGr. 51).
  - Rechtsgrundlage wäre praktisch nur die **ausdrückliche Einwilligung der abgebildeten Person**
    (Art. 9 Abs. 2 lit. a). Die Checkbox des Hochladers („ich habe das Recht") genügt dafür nicht.
  - Dazu kommen DSFA-Pflicht (Art. 35) und Drittlandtransfer (AWS/Hive USA).
- **Reine Gesichtsdetektion oder ein „fotorealistisch ja/nein"-Klassifikator ohne Abgleich** ist
  deutlich weniger heikel. Er beantwortet genau die Frage, an der Seedance scheitert („echter Mensch?"),
  besser als eine Promi-Liste.
- **AWS Opt-out setzen,** sonst dürfen Bilder für das Training genutzt und außerhalb der EU gespeichert werden.

---

## 7. Was daraus für die Produktidee folgt (Einordnung, UNGEPRÜFT)

1. **Zuerst messen, wo der Filter sitzt:** Je 3–5 echte Cast-Fotos (mit Einwilligung) und 2 KI-Porträts
   an fal Seedance 2.5, Replicate Seedance 2.5 und gegebenenfalls BytePlus direkt schicken. Dabei
   Fehlertext, Zeitpunkt (synchron beim Anlegen oder später) und Abrechnung je Request-ID notieren.
   Wiederholen, denn Seedream war nicht deterministisch.
2. **Blockt der Anbieter echte Gesichter** (bei BytePlus und Cloudflare belegt, bei Replicate
   wahrscheinlich): Eine Upload-Prüfung kann nur „dieses Foto wird abgelehnt" melden, also praktisch
   „jedes echte Foto". Brauchbare Produktwege:
   - (a) Cast über **KI-Porträts** (Soul-ID-artig: aus dem Foto ein Porträt erzeugen und das als
     Referenz nutzen; ob BytePlus das als „real person" erkennt, ist unklar, Seedream-text-to-image-Outputs
     sind „trusted", Edit-Outputs nicht belegt),
   - (b) **Liveness pro Person** über die BytePlus-API. Hürden: Einladung, Enterprise-KYC, mindestens
     $1.400/Monat für mehr als 50 Assets, H5 ohne Deutsch, §5.2-Frage beim Einsatz fremder Cast-Mitglieder.
3. **Lässt fal echte Gesichter durch:** Dann lohnt die Upload-Prüfung für die verbleibenden Ablehnungen
   (Promi-Output, NSFW). Günstig und EU-freundlich ist eine Kombination aus Sightengine (Gesicht,
   Minderjährige, NSFW, EU) und `fal-ai/imageutils/nsfw`. Eine Promi-Liste (Rekognition $0,0012, Hive
   $0,0015) nur nach juristischer Prüfung der Art.-9-Frage einsetzen.
