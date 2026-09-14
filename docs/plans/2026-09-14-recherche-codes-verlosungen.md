# Promo-Codes, Einladungen, Gewinnspiele — Regeln für Dream Rushes

Recherche vom 14.09.2026. Keine Rechts- oder Steuerberatung.

**Kennzeichnung:**
- **[GESETZ]**: Rechtsnorm oder Rechtsprechung
- **[PLATTFORM]**: Regel von Apple, Google oder Meta. Das ist kein Gesetz, entscheidet aber über die Zulassung.
- **[BEST PRACTICE]**: Empfehlung ohne Pflicht
- **[UNGEPRÜFT]**: Nicht in einer Primärquelle bestätigt oder nur aus Sekundärquellen

Zitate sind kurz gehalten, sonst stehen Paraphrasen mit Klauselnummer.

---

## 1. Apple App Review Guidelines: eigene Codes für Gratis-Credits in der App

### Stand der Guidelines
- Die Guidelines unter https://developer.apple.com/app-store/review/guidelines/ wurden am 14.09.2026 abgerufen. Letzte Änderungen:
  - **09.06.2025**: 3.2.2(x) wurde neu gefasst. Der Satz aus 3.1.2(a) wurde dorthin verschoben und erlaubt ausdrücklich, Nutzer für Handlungen *in der App* zu belohnen. Quelle: https://developer.apple.com/news/?id=r9dcmrvs
  - **06.02.2026**: Zufalls- und Anonym-Chats fallen jetzt unter 1.2. Quelle: https://developer.apple.com/news/?id=d75yllv4
  - **08.06.2026**: Änderungen an 1.2, 4.3(a/b), 4.5.3 und am Einleitungsteil zu Kindern und Jugendlichen. 3.1.x, 3.2.2, 5.3 und 5.6 wurden laut Ankündigung nicht geändert. Quelle: https://developer.apple.com/news/?id=a233fmpw
- Einen offiziellen Redline-Vergleich gibt es nicht (MacObserver, https://www.macobserver.com/news/apple-app-review-guidelines-2026-changes-explained/).

### Was die Regeln sagen [PLATTFORM]

**3.1.1**
- Wer Funktionen oder Inhalte freischalten will, muss In-App-Kauf nutzen.
- Eigene Freischalt-Mechanismen sind verboten. Apple zählt Lizenzschlüssel, AR-Marker, QR-Codes und Krypto auf: „Apps may not use their own mechanisms to unlock content or functionality“.
- Digitale Geschenkkarten, Gutscheine, Vouchers und Coupons für digitale Güter dürfen *in der App* nur per IAP **verkauft** werden.
- Per IAP gekaufte Credits dürfen nicht verfallen.
- Das Verschenken von IAP-fähigen Artikeln an andere ist erlaubt.

**3.1.3**
- Ausnahmen (a) bis (g): Reader-Apps, Multiplatform, Enterprise, Person-zu-Person, physische Güter, Companion-Apps, Ad-Management.
- **Keine davon passt** auf „Gratis-Credits per Code“.
- 3.1.3(b) erlaubt Konsumgüter, die auf anderen Plattformen oder im Web erworben wurden. Voraussetzung: Sie sind auch als IAP in der App erhältlich.

**3.2.2(x)** (seit 06/2025)
- Nutzer dürfen nicht gezwungen werden, zu bewerten, zu rezensieren, andere Apps zu laden oder andere Store-Aktionen auszuführen.
- Anreize für Handlungen *innerhalb* der App sind erlaubt, etwa ein Level abschließen oder Werbung ansehen.

### Prüfpraxis (Forum-Fälle)
- **10/2018, Thread 109627**: Kostenlose „Lesson IDs“ wurden unter 3.1.1 abgelehnt. Die Standard-Begründung nennt ausdrücklich *promo codes, data transfer codes, license keys …*. Ausgang offen. https://developer.apple.com/forums/thread/109627
- **09/2024, Thread 764715**: Referral-Codes schalteten einen Gratis-Scan in einer Consumable-App frei. Abgelehnt unter 3.1.1 mit der Begründung „uses Referral codes to unlock or enable Face scans“. **Dieser Fall ist Dream Rushes am ähnlichsten.** https://developer.apple.com/forums/thread/764715
- **01/2025, Thread 771781**: Eigene Promo-Codes schalteten günstigere IAP-Produkte frei. Abgelehnt unter 3.1.1, Apple verwies auf Offer Codes. https://developer.apple.com/forums/thread/771781
- **09–10/2025, Thread 802352**: Eigene Business-Codes neben Apple Offer Codes, abgelehnt unter 3.1.1. Laut Entwickler war das Setup vorher fast ein Jahr lang durchgegangen. https://developer.apple.com/forums/thread/802352
- **Pokémon GO und Genshin Impact**: Codes lassen sich auf iOS nicht im Spiel einlösen, nur auf der Website des Herstellers. Nutzer melden sich dort an, die Belohnung erscheint dann im Spiel. Das Muster ist also: Einlösung außerhalb der App, Nutzung in der App.
  - iMore: https://www.imore.com/pokemon-go-players-can-now-redeem-promo-codes-online
  - Nintendo Life: https://www.nintendolife.com/guides/how-to-redeem-pokemon-go-promo-codes
  - Genshin (Game8): https://game8.co/games/Genshin-Impact/archives/304759
  - Dass Apple das ausdrücklich verlangt, ist **[UNGEPRÜFT]**. Es ist aber die gelebte Praxis großer Anbieter.

### Einordnung
| Variante | Bewertung |
|---|---|
| **Gutscheine verkaufen** (Code gegen Geld, egal wo gekauft, Einlösung in der App) | Klar unzulässig. Verkauf in der App nur per IAP (3.1.1). In der App eingelöste, außerhalb gekaufte Codes umgehen IAP. |
| **Gratis-Credits per eigenem Code in der App** (nichts verkauft) | Der Wortlaut verbietet es nicht ausdrücklich. Die Prüfpraxis wendet 3.1.1 aber regelmäßig auch auf kostenlose Codes an, weil Credits sonst IAP-Inhalt sind. → **Graubereich mit hohem Ablehnungsrisiko**, besonders beim ersten Review. Die Einstufung ist Ermessenssache des Prüfers. |
| **Gratis-Credits per Code auf eigener Website** (Login mit demselben Konto, Gutschrift im Server-Ledger), in der App kein Code-Feld und kein Hinweis | Die Praxis großer Apps. Deutlich geringeres Risiko. Offen bleibt, ob ein Link aus der App zur Einlöse-Seite als Umgehung gilt. **[UNGEPRÜFT]** Sicherer ohne Link. |
| **Apple Offer Code auf ein Consumable** (Gratis-Angebot) | Voll konform, siehe Abschnitt 2. |

---

## 2. Apple Offer Codes (Stand 2026) [PLATTFORM]

### Zeitleiste
- **29.10.2025**: Offer Codes gelten für **alle IAP-Typen**: Consumable, Non-Consumable, Non-Renewing und Auto-Renewable. https://developer.apple.com/news/?id=gf6mgrs6
  - Angekündigt wurde das im Umfeld der WWDC 2025 (9to5Mac, 16.06.2025): https://9to5mac.com/2025/06/16/apple-let-iphone-games-offer-promo-codes-for-in-app-purchases/
- **Seit 26.03.2026** lassen sich **keine neuen Promo-Codes für IAPs** mehr erstellen. Bestehende Codes bleiben bis zum Ablauf gültig. Promo-Codes für Gratis-App-Downloads gibt es weiter. Quelle: dieselbe Apple-News.

### Offer Codes für Consumables
Quelle: App Store Connect Help, https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-offer-codes-for-in-app-purchases

- **Code-Arten:**
  - *One-time-use*: zufällig und einmalig. Einlösbar per URL, im App Store oder in der App.
  - *Custom*: eigener Name bis 64 Zeichen, z. B. „DREAMFRIENDS“. Mehrfach einlösbar bis zu einem Limit. Nur per URL oder in der App einlösbar.
- **Grenzen:**
  - höchstens 10 aktive Angebote pro App
  - **1 Mio. Codes pro App und Quartal**, geteilt über alle IAPs
  - höchstens 25.000 pro Batch bzw. Custom-Einlöselimit
  - Sandbox: 10.000 pro Quartal
  - Pro Kunde **ein Code je Angebot**
- **Eligibility:**
  - nie in der App gekauft
  - Kauf in den letzten 30 Tagen
  - Kauf vor mehr als 30 Tagen
  - Alle drei gewählt heißt: für jeden
- **Preis:** „Paid Offer“ oder **„Free Offer“**. Preise werden automatisch für 175 Länder umgerechnet, einzelne Storefronts sind anpassbar.
- **Laufzeit:** One-time-Codes höchstens 6 Monate. Custom-Codes optional ohne Enddatum. Ablauf um 0:00 Uhr PT.
- **Voraussetzungen:**
  - Code-Generierung erst, wenn die App „Ready for Distribution“ und der IAP „Approved“ ist
  - Rolle Account Holder, Admin, App Manager oder Marketing
- **iOS-Version:** In-App-Einlöse-Sheet für Consumables ab **iOS 16.3**, für Abos ab 14.2. https://developer.apple.com/documentation/storekit/supporting-offer-codes-in-your-app
- **Regionale Einschränkungen:** In der Doku keine genannt. **[UNGEPRÜFT]**

### Wie ein Gratis-Code auf ein Consumable den Server erreicht
1. **In der App:** StoreKit `offerCodeRedemption(isPresented:)` (SwiftUI) oder `AppStore.presentOfferCodeRedeemSheet` (UIKit).
   - Heraus kommt eine normale `Transaction` mit `offer.type == .code`.
   - Die App schickt die signierte Transaktion (JWS) samt eigener User-ID an den Server.
   - Der Server prüft und schreibt die Credits ins Ledger. Danach ruft die App `finish()` auf.
   - In Expo/React Native gibt es entsprechende Wrapper, z. B. RevenueCat `presentCodeRedemptionSheet`. Ob diese Consumable-Offer-Codes voll unterstützen: **[UNGEPRÜFT]**
2. **Außerhalb der App** (Einlöse-URL oder App Store):
   - Die Transaktion kommt beim nächsten App-Start über `Transaction.updates` bzw. `Transaction.unfinished`.
   - Deshalb gleich beim Start einen Listener registrieren.
3. **Server-seitig:**
   - App Store Server Notifications V2 schicken den Typ **`ONE_TIME_CHARGE`**, auch bei eingelösten Offer Codes auf Consumables. `OFFER_REDEEMED` gilt nur für Abos.
   - Im `JWSTransactionDecodedPayload` stehen `offerType = 3` (Offer Code), `offerIdentifier` (Name des Angebots) und `offerDiscountType = ONE_TIME`.
   - Quellen:
     - https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
     - https://developer.apple.com/documentation/appstoreserverapi/offertype
     - https://developer.apple.com/documentation/appstoreserverapi/offerdiscounttype
   - **Wichtig:** Eine Notification allein kennt den App-Nutzer nur, wenn `appAccountToken` gesetzt ist. Bei Einlösung außerhalb der App fehlt der Token. **[UNGEPRÜFT]**
   - Die Zuordnung zum Konto sollte daher über die App laufen: Transaktion an den Server schicken und `originalTransactionId` dem Konto zuordnen. Die Notification dient als Abgleich bzw. Idempotenz-Schlüssel.

### Kosten und Erlöse
- In der Doku sind keine Gebühren für Offer Codes genannt.
- Ein „Free Offer“ bringt keinen Erlös, also auch keine Provision.
- Für das Small Business Program zählen nur Erlöse (Proceeds). Gratis-Einlösungen beeinflussen die 1-Mio.-Schwelle daher nicht (logische Folgerung). **[UNGEPRÜFT]** https://developer.apple.com/app-store/small-business-program/

---

## 3. Apple: Einladungsprämien („Freund einladen, beide bekommen Credits“) [PLATTFORM]

**Einschlägige Regeln**
- **3.2.2(x)**: Keine erzwungenen Store-Aktionen. Anreize für Handlungen *in der App* sind erlaubt.
- **5.6.3 Discovery Fraud**: Charts, Suche, Bewertungen oder *Empfehlungen/Referrals zur App* dürfen nicht manipuliert werden.
  - Den genauen Wortlaut ließ der Abruf abgeschnitten nicht vollständig anzeigen, laut Sekundärquellen nennt er „referrals to your app“. **[UNGEPRÜFT: Wortlaut]**
  - Quellen: Guidelines-Seite; TechCrunch vom 07.06.2021, https://techcrunch.com/2021/06/07/apples-new-app-store-guidelines-aim-to-crack-down-on-fraud-and-scams
- **3.1.2(a)**: Wer für ein Abo bezahlt hat, muss es ohne Zusatzaufgaben bekommen, etwa ohne Social-Media-Post oder Kontakte-Upload.
- **5.6.1**: Bewertungen nur über die Apple-API einholen. Keine Belohnung für Bewertungen.

**Prüfpraxis**
- **02/2021, Thread 674832**: Punkte für den **Eingeladenen** fürs Registrieren wurden unter 3.2.2 abgelehnt.
  - App Review schrieb sinngemäß: Belohnung für den Einladenden ist in Ordnung. Der Eingeladene soll nichts fürs Herunterladen oder Registrieren bekommen, weil das Rankings beeinflusst.
  - Nach Entfernen des Bonus für den Eingeladenen wurde die App zugelassen.
  - Andere Entwickler verweisen auf Lyft und Robinhood, die beiden Seiten etwas geben. Deren Prämien sind aber keine digitalen IAP-Güter.
  - https://developer.apple.com/forums/thread/674832
- **09/2024, Thread 764715**: Referral-Code schaltet Gratis-Nutzung frei, abgelehnt unter **3.1.1**. Siehe Abschnitt 1.

**Einordnung**
- Credits nur für den **Einladenden** und erst nach einer echten Handlung des Eingeladenen, z. B. erster Traum aufgenommen: Graubereich mit mittlerem Risiko.
  - Die Referral-Logik läuft rein serverseitig, ohne Code-Eingabe (Deep Link oder automatische Zuordnung).
- **Beide belohnen** bzw. Bonus fürs Installieren oder Registrieren: laut dokumentierter Prüfpraxis **hohes Risiko**.
- **Keine Belohnung** für Bewertungen, Downloads oder Sterne. Das ist [PLATTFORM], in den USA zusätzlich [GESETZ] nach FTC 16 CFR 465 (siehe Abschnitt 8).

---

## 4. Apple: Gewinnspiele und Verlosungen (5.3) [PLATTFORM]

Quelle: Guidelines 5.3.1–5.3.4.

- **5.3.1**: Sweepstakes und Contests muss **der Entwickler selbst** veranstalten.
- **5.3.2**: **Offizielle Teilnahmebedingungen in der App** anzeigen. Klarstellen, dass Apple weder Sponsor noch beteiligt ist. Zitat: „make clear that Apple is not a sponsor“.
- **5.3.3**: Kein IAP für Guthaben, das bei Echtgeld-Spielen eingesetzt wird.
- **5.3.4**: Echtgeld-Glücksspiel und Lotterien brauchen Lizenz und Geo-Sperre.
- **Prämie als In-App-Credits**: In 5.3 nicht verboten.
  - Risiko: Kollision mit 3.1.1, wenn Gewinner einen Code in der App eingeben. Besser serverseitige Gutschrift ohne Code-Eingabe oder ein Apple Offer Code.
  - Zulässigkeit der Credits als Preis: **[UNGEPRÜFT]**
- **Teilnahme gegen IAP-Kauf** macht die Aktion zur Lotterie (Einsatz + Zufall + Preis) und fällt dann unter 5.3.4. Nicht machen.

---

## 5. Google Play (kurz, für später) [PLATTFORM]

### Promo-Codes
Quelle: https://support.google.com/googleplay/android-developer/answer/6321495

- One-time- und Custom-Codes für bezahlte Apps, **Einmalkäufe (In-App-Produkte)** und Abos.
- Einmalkauf- und App-Promotions: **500 Codes pro Quartal** über alle Apps.
- Abos: bis 10.000 One-time-Codes pro Abo und Quartal.
- Custom-Codes nur für Abos und nur für Neukunden.
- Promo-Code-Bedingungen: kein Barwert, kein Verkauf, Konditionen transparent machen. https://play.google/promo-code-developer-terms/

### Payments-Richtlinie
Quelle: https://support.google.com/googleplay/android-developer/answer/9858738

- Bezahlte digitale Güter wie virtuelle Währung laufen über Play Billing.
- Kostenlose Werbe-Credits werden nicht ausdrücklich geregelt.
- Einschätzung: geringeres Risiko als bei Apple. **[UNGEPRÜFT]**

### Gewinnspiele
Quelle: „Real-Money Gambling, Games, and Contests“, https://support.google.com/googleplay/android-developer/answer/9877032

- Offizielle Regeln in der App.
- Feste Gewinnerzahl, Einsendeschluss und Termin der Gewinnvergabe.
- Keine Teilnahme per In-App Billing.

### Bewertungen und Installationen
Quelle: https://support.google.com/googleplay/android-developer/answer/9898684

- Anreize für Bewertungen, Rezensionen oder Installationen sind verboten (Geld, Waren oder Gleichwertiges gegen die Handlung).
- Ein Referral-Bonus fürs *Installieren* ist deshalb riskant. Ein Bonus für Handlungen in der App ist weniger kritisch. **[UNGEPRÜFT]**

---

## 6. Deutsches und EU-Recht

### a) Promo-Codes und Gratis-Credits
- **[GESETZ] § 6 Abs. 1 Nr. 3 DDG** (früher § 6 TMG): Preisnachlässe, Zugaben und Geschenke müssen als solche erkennbar sein. Ihre **Bedingungen müssen leicht zugänglich sowie klar und unzweideutig** angegeben werden. Dazu gehören Laufzeit/Ablauf, wer teilnehmen darf, eine Einlösung pro Konto und die Credit-Menge. https://www.gesetze-im-internet.de/ddg/__6.html
- **[GESETZ] § 5a UWG**: Es ist unlauter, wesentliche Informationen vorzuenthalten. Nicht genannte Einschränkungen wie Mindestkauf, Ablauf oder Neukunden-only sind abmahnfähig.
- **[GESETZ] UWG-Anhang**: https://www.gesetze-im-internet.de/uwg_2004/anhang.html
  - **Nr. 7**: keine falsche „nur kurze Zeit“-Verknappung
  - **Nr. 20**: „gratis“ nur, wenn wirklich keine Kosten entstehen
  - **Nr. 31**: kein falscher Eindruck, man habe gewonnen, wenn dafür Kosten anfallen
  - **Nr. 28**: keine direkte Kaufaufforderung an Kinder
- **[GESETZ] PAngV § 11** (30-Tage-Bestpreis): gilt nur für **Waren**, nicht für digitale Dienstleistungen. Bei Rabatt-Werbung auf Credit-Pakete trotzdem sauber kommunizieren. **[UNGEPRÜFT: Anwendbarkeit auf Credits]**
- **Ablauf**:
  - Gratis-Credits dürfen verfallen, wenn das vorher klar genannt wird.
  - **Gekaufte** Credits dürfen laut Apple 3.1.1 nicht verfallen [PLATTFORM].
  - Kurze Verfallsfristen für bezahltes Guthaben sind in AGB auch zivilrechtlich riskant (§ 307 BGB). **[UNGEPRÜFT im Detail]**
  - → Im Ledger **bezahlte und geschenkte Credits getrennt** führen [BEST PRACTICE].

### b) Gewinnspiele und Verlosungen
- **[GESETZ] § 3 Abs. 1 GlüStV 2021**: Glücksspiel setzt ein **Entgelt** für die Gewinnchance voraus. Ist die Teilnahme kostenlos, ist es kein Glücksspiel und braucht keine Erlaubnis. https://lxgesetze.de/gl%C3%BCstv-2021/3
  - Nur übliche Porto- oder Übermittlungskosten sind unschädlich (e-recht24, Stand 25.08.2026: https://www.e-recht24.de/datenschutz/13065-gesetzliche-vorgaben-bei-gewinnspielen.html).
  - Teilnahme nur mit Kauf oder mit Credits-Einsatz ist **riskant**, weil ein Einsatz vorliegen kann.
- **[GESETZ] § 6 Abs. 1 Nr. 4 DDG**: Preisausschreiben und Gewinnspiele mit Werbecharakter müssen erkennbar sein. **Teilnahmebedingungen leicht zugänglich, klar und eindeutig.**
- **[GESETZ] Kopplung an einen Kauf**:
  - Das Per-se-Verbot (§ 4 Nr. 6 UWG a. F.) ist seit dem EuGH-Urteil C-304/08 „Plus“ (14.01.2010) und BGH I ZR 4/06 „Millionen-Chance II“ (05.10.2010) überholt und wurde 2015 gestrichen.
  - Heute gilt: zulässig, wenn transparent (§§ 5, 5a UWG) und ohne unangemessenen Druck (§ 4a UWG).
  - Gegenüber Kindern und Jugendlichen gelten strengere Maßstäbe (§ 3 Abs. 4 UWG, Anhang Nr. 28).
  - Quelle: IT-Recht Kanzlei, 26.05.2020, https://www.it-recht-kanzlei.de/kopplung-warenabsatz-gewinnspiel.html
- **Minderjährige**: Ausschluss ist erlaubt. Credits als Gewinn sind rechtlich lediglich vorteilhaft (§ 107 BGB). [BEST PRACTICE] Wegen der Werbeeinwilligung und Meta-Regeln trotzdem „ab 18“ oder „ab 16 mit Einverständnis“ festlegen.
- **[GESETZ] DSGVO**:
  - Für die Durchführung und Gewinnbenachrichtigung reicht Art. 6 Abs. 1 lit. b.
  - Für Newsletter und Werbung ist eine **gesonderte freiwillige Einwilligung** nötig (Art. 7 Abs. 4, Kopplungsverbot).
  - Gewinner nur mit Einwilligung namentlich veröffentlichen. Löschfrist nennen. Datenschutzhinweise gehören in die Teilnahmebedingungen.
  - Bei Instagram-Aktionen kann Meta für Page-Insights gemeinsam Verantwortlicher sein. **[UNGEPRÜFT für Gewinnspiele im Detail]**
- **[GESETZ] Einladungen**: **Tell-a-friend-E-Mails oder -SMS, die über das System des Unternehmens verschickt werden, gelten als unerlaubte Werbung** (BGH 12.09.2013, I ZR 208/12, § 7 Abs. 2 UWG). https://www.rechtsindex.de/internetrecht/3818-bgh-urteil-i-zr-208-12-tell-a-friend-funktion-ist-spam
  - → Einladung **nur als Link, den der Nutzer selbst über das iOS-Teilen-Menü verschickt**. Kein Versand durch unseren Server, kein Adressbuch-Upload.

### c) Steuer (nur Hinweis)
- **[GESETZ] § 3 Abs. 13–15 UStG und UStAE 3.17** (BMF-Schreiben vom 02.11.2020):
  - Ein Gutschein im Sinne des UStG ist ein Instrument, das als **Gegenleistung** statt Geld angenommen werden muss.
  - Reine Preisnachlass-Instrumente sind keine Gutscheine.
  - Quellen:
    - https://datenbank.nwb.de/Dokument/840033/
    - https://www.haufe.de/steuern/finanzverwaltung/einzweck-und-mehrzweck-gutscheine-umsatzsteuer_164_529480.html
- **Einschätzung**:
  - Unentgeltlich ausgegebene Werbe-Credits sind kein verkaufter Einzweck- oder Mehrzweck-Gutschein. Die Ausgabe löst keine Umsatzsteuer aus.
  - Die Einlösung ist eine unentgeltliche Leistung für unternehmerische Zwecke (Werbung). Das ist nach § 3 Abs. 9a Nr. 2 UStG regelmäßig nicht steuerbar.
  - **[UNGEPRÜFT, Steuerberater fragen]**
- **Sonderfälle** [UNGEPRÜFT]:
  - Referral-Prämien können Entgelt für eine Vermittlungsleistung sein.
  - Beim Empfänger kann § 22 Nr. 3 EStG greifen (Freigrenze 256 €/Jahr).
  - IAP-Umsätze: In der EU tritt Apple als Kommissionär bzw. Wiederverkäufer auf und führt die Umsatzsteuer ab. Das betrifft die Verbuchung bezahlter Credits.

---

## 7. Instagram und Meta [PLATTFORM]

- **Instagram-Promotion-Richtlinien**: help.instagram.com/179379842258600. Die Seite ließ sich nicht maschinell auslesen, Inhalt aus Sekundärquellen. **[UNGEPRÜFT: Wortlaut]**
  - Veranstalter ist allein verantwortlich, dass die Aktion rechtmäßig läuft.
  - Nötig sind offizielle Regeln, Bedingungen und Teilnahmevoraussetzungen (Alter, Land).
  - **Vollständige Freistellung von Instagram/Meta durch jeden Teilnehmer**.
  - **Hinweis, dass die Aktion nicht von Instagram gesponsert, unterstützt, organisiert oder damit verbunden ist**.
  - **Keine falschen Markierungen**, z. B. sich selbst auf einem Bild markieren, auf dem man nicht ist.
  - Meta hilft bei der Durchführung nicht.
  - Quelle: KickoffLabs, 07.05.2026, https://kickofflabs.com/blog/instagram-giveaway-rules-2026/
- **„Kommentiere und markiere einen Freund“**: Auf Instagram laut übereinstimmenden Sekundärquellen **erlaubt**, solange die Markierung korrekt ist, also echte Personen im Kommentar.
  - [BEST PRACTICE] Nur 1–2 Markierungen verlangen. Keine Mehrfach-Lose für massenhaftes Markieren (sonst Spam-Signale).
  - Quelle: Woobox, https://woobox.com/articles/instagram-giveaway-rules-and-compliance
- **Achtung, Facebook ist strenger**: Die Richtlinien für Seiten, Gruppen und Veranstaltungen verbieten, zum Teilen, Reposten oder **Markieren anderer** als Teilnahmebedingung aufzufordern. Aktionen über persönliche Profile sind ebenfalls verboten. Freistellung und Hinweis auf Meta sind auch dort Pflicht. Quelle: https://www.facebook.com/policies_center/pages_groups_events
  - → Cross-Posts auf Facebook ohne „Freund markieren“.
- [GESETZ, DE] Das Posting muss als Werbung erkennbar sein (§ 6 DDG, § 5a Abs. 4 UWG). Das gilt auch für Influencer-Kooperationen („Anzeige“).

---

## 8. USA (kurz)

- **[GESETZ] Einstufung**: Preis + Zufall + Gegenleistung ergibt eine verbotene private Lotterie. Für ein legales Sweepstake daher **„No purchase necessary“**. Wird ein Kauf verlangt, braucht es einen gleichwertigen kostenlosen Teilnahmeweg (AMOE).
- **[GESETZ] Official Rules** sollten enthalten:
  - Sponsor
  - Teilnahmeberechtigung (Alter, meist 18+; volljährig in AL/NE ab 19, MS ab 21)
  - Zeitraum (Zeitzone)
  - Preis und ungefährer Wert
  - Gewinnchancen
  - Auswahlverfahren
  - „Void where prohibited“
  - Freistellung von Apple/Meta
- **[GESETZ] Registrierung und Sicherheitsleistung** ab einem Gesamtpreiswert **über 5.000 $**:
  - **New York** (GBL § 369-e): 30 Tage vorher, 100 $ Gebühr, Bond
  - **Florida** (§ 849.094): 7 Tage vorher, Bond oder Treuhandkonto
  - Credits-Preise liegen typischerweise weit darunter.
  - Quellen:
    - https://www.fdacs.gov/Business-Services/Game-Promotions-Sweepstakes
    - https://kleinmoynihan.com/sweepstakes-registration-and-bonding-requirements-2/
- **[GESETZ] FTC Consumer Review Rule 16 CFR 465** (seit 21.10.2024): Keine Anreize, die an eine bestimmte Tendenz der Bewertung geknüpft sind. https://www.ftc.gov/legal-library/browse/federal-register-notices/16-cfr-part-465-trade-regulation-rule-use-consumer-reviews-testimonials-final-rule
- **[GESETZ]** Bei Sachpreisen ab 600 $ Steuermeldung (1099) nötig. Bei Credits praktisch nicht relevant. **[UNGEPRÜFT]**

---

## 9. Fazit und empfohlenes Setup für den iOS-Launch

### Sicher
1. **Apple Offer Codes auf ein Consumable als „Free Offer“**:
   - Eigenen IAP anlegen, z. B. „Starter Credits 50“. Alternativ ein vorhandenes Paket verwenden.
   - **One-time-Codes** für Freunde und erste Tester.
   - **Custom-Code** mit Einlöselimit und Enddatum für Instagram oder Werbung.
   - Einlösung in der App über das StoreKit-Sheet (ab iOS 16.3) oder per Link.
   - Serverseitig über `ONE_TIME_CHARGE` bzw. die Transaktion mit `offerType=3` und `offerIdentifier` Credits gutschreiben.
   - Grenzen: pro Kunde ein Code je Angebot, höchstens 10 aktive Angebote, Codes höchstens 6 Monate gültig, Generierung erst nach Freigabe von App und IAP.
   - Einschränkung: Offer Codes gibt es nur über das Apple-Konto, nicht für Android oder Web.
2. **Abo-Offer-Codes** (z. B. erster Monat gratis) für Abo-Tests.
3. **TestFlight** für die allerersten Tester vor dem Launch. Käufe laufen dort in der Sandbox und kosten nichts. Credits lassen sich serverseitig direkt ins Test-Konto buchen, ohne Code in der App. [BEST PRACTICE]
4. **Automatische Credits für Handlungen in der App** ohne Code-Eingabe, z. B. Willkommensbonus beim ersten Traum. Deckt 3.2.2(x) ab.
5. **Verlosung auf Instagram** mit kostenloser Teilnahme (Kommentar, Freund markieren). Gutschrift an Gewinner als Apple One-time-Offer-Code per DM. Dazu Teilnahmebedingungen, Meta-Freistellung und DSGVO-Hinweise.

### Graubereich
6. **Eigenes Code-Feld in der App für Gratis-Credits vom Server**: Ablehnung unter 3.1.1 ist wahrscheinlich (Präzedenzfälle 2018, 2024, 2025, 2025). **Nicht zum ersten Review.** Wenn überhaupt: Einlösung auf eigener Website mit Login, ohne Link aus der App (Muster Niantic/HoYoverse). **[UNGEPRÜFT, ob Apple das duldet]**
7. **Referral nur für den Einladenden**, ausgelöst durch eine echte Handlung des Eingeladenen, zugeordnet per Deep Link statt Code-Feld: mittleres Risiko nach 5.6.3 und 3.1.1. Eher nach dem Launch in einem eigenen Update einführen, damit eine Ablehnung nicht den Launch trifft.
8. **Verlosung in der App** (5.3): möglich mit Teilnahmebedingungen in der App und Apple-Disclaimer. Die Teilnahme darf nichts kosten, auch keine Credits.

### Nicht machen
9. Codes oder Gutscheine außerhalb von Apple **verkaufen** und in der App einlösen (3.1.1).
10. Bonus für den **Eingeladenen** fürs Installieren oder Registrieren (3.2.2/5.6.3-Praxis). Das verbietet auch Google Play.
11. Credits für Bewertungen, Sterne oder Rezensionen: 5.6.1, FTC 465, UWG-Anhang Nr. 23b/c.
12. Einladungs-E-Mails oder -SMS über unseren Server (BGH I ZR 208/12). Adressbuch hochladen.
13. Teilnahme an Verlosungen gegen Kauf oder Credits (Glücksspiel-Risiko nach GlüStV, Apple 5.3.4).
14. Bei Facebook-Posts „Markiere Freunde / teile, um teilzunehmen“ verlangen.

---

## 10. Checkliste Pflichttexte

### A) Code- und Aktionsbedingungen
[GESETZ: § 6 Abs. 1 Nr. 3 DDG, § 5a UWG, UWG-Anhang Nr. 20; Rest BEST PRACTICE]

- [ ] Veranstalter mit Name, Anschrift und Kontakt (Impressum-Link)
- [ ] Was es gibt: Anzahl Credits, wofür nutzbar
- [ ] **Gültigkeit**: Einlösezeitraum *und* Verfall der gutgeschriebenen Gratis-Credits (Datum oder „X Tage nach Gutschrift“)
- [ ] **Eine Einlösung pro Konto / Apple-ID**, nicht mit anderen Aktionen kombinierbar (falls gewollt)
- [ ] Wer teilnehmen darf: Neukunden oder alle, Land/Storefront, Mindestalter
- [ ] **Kein Barwert**, keine Auszahlung, nicht übertragbar, kein Weiterverkauf
- [ ] Reihenfolge des Verbrauchs: Gratis-Credits vor gekauften oder umgekehrt
- [ ] Missbrauchsvorbehalt: Mehrfachkonten, Weitergabe öffentlicher Codes über das Limit hinaus
- [ ] Hinweis, dass die Einlösung über Apple erfolgt (bei Offer Codes) und Apple-Bedingungen gelten
- [ ] Bei Einladungen:
  - [ ] wer die Prämie wann bekommt
  - [ ] Obergrenze pro Monat
  - [ ] keine Prämie für Selbsteinladung
  - [ ] Einladungen nur an Menschen, die der Nutzer kennt, und nur über eigene Kanäle

### B) Teilnahmebedingungen Gewinnspiel/Verlosung
[GESETZ: § 6 Abs. 1 Nr. 4 DDG, DSGVO Art. 13; PLATTFORM: Apple 5.3.2, Meta/Instagram; US: Official Rules]

- [ ] Veranstalter mit Kontakt
- [ ] Zeitraum mit Uhrzeit und Zeitzone
- [ ] Teilnahme **kostenlos**, kein Kauf nötig („No purchase necessary“)
- [ ] Teilnahmeweg: Kommentar, Markierung von 1–2 echten Personen, Formular
- [ ] Wer teilnehmen darf: Mindestalter, Länder, Ausschluss von Mitarbeitenden
- [ ] Preis: Anzahl Credits, Anzahl Gewinner, ungefährer Wert
- [ ] Auswahl per Zufallsverfahren, Termin der Auslosung
- [ ] Benachrichtigung per DM, Frist zur Rückmeldung, danach Nachziehung
- [ ] Übergabe als Gutschrift oder Apple Offer Code mit Gültigkeit, kein Barwert, keine Barauszahlung
- [ ] **Freistellung von Instagram/Meta**, Satz „nicht gesponsert, unterstützt oder organisiert von Instagram/Meta“
- [ ] **In der App: „Apple ist kein Sponsor und in keiner Weise beteiligt“** (5.3.2)
- [ ] Datenschutz: Verantwortlicher, Zweck, Rechtsgrundlage (Art. 6 Abs. 1 lit. b), Speicherdauer/Löschung, Rechte, keine Werbenutzung ohne gesonderte Einwilligung
- [ ] Veröffentlichung von Gewinnern nur mit Einwilligung (sonst nur Vorname und Initial nach Zustimmung)
- [ ] Recht zum Abbruch aus wichtigem Grund, Ausschluss bei Manipulation
- [ ] USA: „Void where prohibited“, anwendbares Recht; ab Gesamtwert über 5.000 $ NY/FL-Registrierung prüfen
- [ ] Posting als Werbung kennzeichnen (§ 6 Abs. 1 Nr. 1 DDG)

### C) AGB und Kaufseite
- [ ] Gekaufte Credits verfallen nicht (Apple 3.1.1) und werden getrennt von Gratis-Credits geführt
- [ ] Restore-Mechanismus bzw. Kontobindung erklärt
