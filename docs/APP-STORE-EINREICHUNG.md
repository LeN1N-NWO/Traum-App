# App-Store-Einreichung 101 — Dream Rushes

> Stand 23.09.2026, von Anton in Auftrag gegeben. Lebendes Dokument: Wer
> einen Blocker erledigt, hakt ihn hier ab. Quellen am Ende; Apple-Regeln
> sind nach Guideline-Nummer zitiert, damit man sie in Ablehnungs-Mails
> wiedererkennt.

## Teil 1 — Der Weg in zehn Schritten

1. **Apple-Developer-Konto klären.** Signieren kann heute NUR Hanni
   (`docs/plans/2026-09-22-apple-konto-einzelperson-organisation.md` — dort
   auch die Frage Einzelperson vs. Organisation). Antons kostenlose
   Signierung hält 7 Tage und kann NICHT einreichen. Entscheidung
   Einzelperson/Organisation VOR dem ersten Upload treffen, ein Wechsel
   danach ist zäh.
2. **App in App Store Connect anlegen:** Bundle-ID (heute `app.dreamrushes`
   bei Anton, `com.dreamrushes.app` bei Hanni — ⚠ EINE festlegen, sie ist
   nach dem ersten Upload unveränderlich), Name „Dream Rushes",
   Primärsprache, SKU.
3. **Build erzeugen:** Sauberster Weg für uns ist EAS Build/Submit (Expo),
   Alternative Xcode-Archive + Organizer. ⚠ Apple verlangt aktuelle
   Xcode/SDK-Stände (2025 wurden Uploads unterhalb Xcode 16/iOS-18-SDK
   abgelehnt) — mit Xcode 26.3 sind wir vorn dabei.
4. **TestFlight zuerst.** Jeder Build geht erst intern an uns beide (und
   Freunde per Link, bis 10 000 Tester). TestFlight-Builds durchlaufen
   bereits eine Kurz-Prüfung („Beta App Review") — der billigste Weg,
   Ablehnungsgründe früh zu sehen.
5. **Metadaten:** Screenshots (6,7"- und 6,1"-Pflichtgrößen), Beschreibung,
   Schlagworte, Support-URL, Datenschutz-URL. Keine Preise/„kostenlos"-
   Versprechen im Text, keine Plattform-Namen (Android) — klassische
   Metadaten-Ablehnungen (2.3).
6. **Privacy Nutrition Labels** in App Store Connect ausfüllen — muss zu
   dem passen, was das Einwilligungs-Tor sagt: Traumtexte/Fotos an fal.ai,
   Google, DeepSeek, MiniMax/ByteDance; Konto-E-Mail an Supabase; keine
   Werbe-Tracker.
7. **Altersfreigabe:** Seit 2026 gibt es gestufte 13+/16+/18+-Ratings. Wir
   deklarieren **18+** — deckt sich mit unserem Tor („Ich bin mindestens
   18") und nimmt Druck von der Inhalts-Moderation.
8. **Einreichen mit Review-Notes:** Dem Reviewer in 5 Sätzen erklären, was
   die App tut, dass Inhalte KI-erzeugt und gekennzeichnet sind, wie er
   OHNE Konto testen kann („Später" im Onboarding), und ein kurzes
   Demo-Video verlinken. Reviewer sind eilig — wer ihnen Arbeit spart,
   wird seltener missverstanden.
9. **Ablehnung lesen, nicht fürchten.** Antwort kommt meist in 24–48 h.
   Eine Ablehnung nennt die Guideline-Nummer; im Resolution Center kann
   man antworten und oft ohne neuen Build klären.
10. **Nach dem Launch:** Updates laufen denselben Weg (schneller);
    Preisänderungen/IAP-Anlagen haben eigene Prüfungen.

## Teil 2 — Was UNS heute konkret blockiert (Blocker-Liste)

| # | Blocker | Apple-Regel | Wo bei uns | Status |
|---|---------|-------------|------------|--------|
| B1 | **Credits müssen über Apple In-App-Kauf laufen.** Eigene Zahlwege für digitale Güter sind verboten; unser Kauf-Blatt ist heute Attrappe, das Guthaben ein Client-Zähler. StoreKit 2 + Server-Gutschrift bauen (Consumables je Paket, Auto-Renewable fürs Abo). | 3.1.1 | `src/lib/plans.js`, `mobile/src/app/profile/paywall.tsx`, Server-Ledger | ❌ offen (größter Brocken; Reihenfolge laut Übergabe `2026-09-14-hanni-codes-einladungen.md`: Apple-Sign-in ✓ → StoreKit+Server → Offer Codes) |
| B2 | **Konto-Löschung in der App.** Wer Konto-Erstellung anbietet, MUSS in der App auch löschen lassen — nicht nur abmelden. | 5.1.1(v) | `server.js` (Endpunkt fehlt), Einstellungen | ❌ offen (an Hanni: gehört zu ihrem Auth) |
| B3 | **Der Server muss aus dem Internet erreichbar sein** — der Reviewer sitzt nicht in Antons WLAN. Deployment inkl. HTTPS, `API_TOKEN`, CORS-`null`-Eintrag wieder raus (Kommentar in `server.js` corsHeaders), Foto-/Policy-Weg im Echtbetrieb. S6 („nie öffentlich mit http") wird damit Pflichtarbeit. | 2.1 App Completeness | `server.js`, Hosting-Entscheidung | ❌ offen |
| B4 | **Testphasen-Schalter zurückdrehen:** 500 Gratis-Credits in allen Bauarten (`journal-data.tsx`, Kommentar markiert), Onboarding bei jedem Start (`onboarding-gate.tsx`), Face-ID-los… alles was „nur für Anton" ist. | 2.1 / 2.3 (irreführend) | markierte Stellen, greppbar nach „vor der Veröffentlichung" | ❌ offen, aber trivial |
| B5 | **Systemtexte lokalisieren:** Mikrofon/Fotos/Face-ID-Begründungen sind nur englisch; bei deutscher Store-Präsenz erwartet Apple lokalisierte Purpose-Strings (`InfoPlist.strings` + `CFBundleLocalizations`). | 5.1.1 | `mobile/app.json` / `ios/DreamRushes/Info.plist` (Befund 10 der Onboarding-Übergabe) | ❌ offen |
| B6 | **Privacy Manifest prüfen.** `PrivacyInfo.xcprivacy` liegt im Bundle, aber: Required-Reason-APIs (UserDefaults, Datei-Zeitstempel …) müssen deklariert sein, und Apple liest Manifeste statischer Pods teils nicht — ggf. Einträge ins App-Manifest kopieren. Expo-Weg: `expo.ios.privacyManifests` in app.json (⚠ bei uns ohne prebuild: direkt in `ios/` pflegen). | Pflicht seit 2024 | `mobile/ios/DreamRushes/PrivacyInfo.xcprivacy` | ⚠ prüfen |
| B7 | **Export-Compliance-Flag setzen:** `ITSAppUsesNonExemptEncryption = NO` in die Info.plist, sonst fragt jeder Upload nach Verschlüsselungs-Doku. | — | `ios/DreamRushes/Info.plist` | ❌ offen, Einzeiler |
| B8 | **Medien-Speicherung klären:** Erzeugte Filme liegen auf unserem Server („werden gespeichert, damit die App sie zeigt" — steht im Tor ✓); Löschweg für den Nutzer dokumentieren/bauen (hängt an B2/B3). | 5.1.1 | `server.js`, media/ | ⚠ mit B3 |

**Nicht vergessen, kein Blocker, aber Review-Munition:** die
Erinnerungs-Zustellung real testen (2.1: „Feature tut nichts" fällt auf)
und die drei offenen Finger-Tests (Teilen-Karte, Schnellaktionen,
Atem-Raum).

## Teil 2b — B1 im Detail: StoreKit-Plan und Test-Strategie (23.09.)

**Arbeitsteilung (Vorschlag, von Anton abzusegnen):**
- **Claude/Antons Sessions bauen die Technik:** StoreKit-2-Anbindung im
  Client (Kaufblatt → echte Produkte), Server-Prüfung des Kaufbelegs
  (App-Store-Server-Belege verifizieren, dann `server_grant()` — die
  DB-Funktion existiert seit dem 11.09.), Sandbox-Belege in ein
  Test-Ledger statt ins echte (Übergabe 14.09.: „Sandbox nie ins echte
  Ledger").
- **Hanni macht, was das bezahlte Konto braucht:** Produkte in App Store
  Connect anlegen (Paket-IDs S/M/L/XL, Monats-/Jahresabo), Sandbox-Tester
  anlegen, signierte TestFlight-Builds.

**Und so testet Anton weiter, ohne dass je echtes Geld fließt:**
1. **Ohne jedes Apple-Konto:** Xcode-StoreKit-Konfigurationsdatei
   (`.storekit`) im Projekt — Simulator und Xcode-Geräte-Builds zeigen
   damit echte Kauf-Dialoge, komplett lokal simuliert. Der heutige
   Testweg bleibt also unverändert möglich.
2. **Echter Kauf-Dialog, null Euro:** Sandbox-Apple-ID (legt Hanni in App
   Store Connect an). Damit auf dem Gerät anmelden (nur unter
   Einstellungen → App Store → Sandbox-Konto, NICHT als iCloud-Konto) —
   jeder Kauf läuft durch Apples echte Kasse, wird aber nie berechnet.
3. **Wichtig zum Verständnis:** Das Guthaben liegt danach NICHT „am
   Apple-Konto", sondern wie geplant in unserem Ledger am
   Dream-Rushes-Konto — Apple liefert nur den Kaufbeleg, unser Server
   prüft ihn und bucht per `server_grant()` gut. Die heutigen
   500 Spielgeld-Credits verschwinden mit B4a.

## Teil 2c — Geld, Abrechnung, Buchführung (Antons Frage, 23.09.)

- **Apple ist der Händler (Merchant of Record):** Der Kunde kauft von
  Apple, nicht von uns. Apple stellt die Kundenquittung aus, führt die
  Umsatzsteuer weltweit ab und wickelt Rückerstattungen ab. Wir stellen
  Endkunden NIE Rechnungen und brauchen KEINEN Zahlungsanbieter (Stripe
  o. Ä. wäre für digitale Güter in der App sogar verboten).
- **Auszahlung:** Eine Sammelüberweisung pro Monat, ca. 30 Tage nach
  Monatsende, abzüglich Provision. Standard 30 % — mit dem **App Store
  Small Business Program nur 15 %** (unter 1 Mio. $ Jahresumsatz).
  Anmeldung kostenlos in App Store Connect, gehört zu Hannis
  Kontoeinrichtung (VOR den ersten Verkäufen erledigen).
- **Buchführung:** In den Büchern landet die monatliche Apple-Auszahlung
  als Umsatz (Belege: Finanzberichte aus App Store Connect + Kontoauszug);
  Higgsfield/Hosting/Developer-Konto sind normale Betriebsausgaben. Die
  Apple-Provision kommt aus Irland → Reverse-Charge (§ 13b UStG),
  Standardfall für jeden Steuerberater. Unser Credits-Ledger ist rein
  intern und steuerlich irrelevant.
- **RevenueCat & Co.** sind Technik-Dienste (Beleg-Prüfung, Abo-Status,
  Statistik), keine Buchhaltung. Für unser einfaches Modell (Kauf →
  Credits ins eigene Ledger) unnötig — Beleg-Prüfung bauen wir selbst
  über die App-Store-Server-API. Erst erwägen, wenn komplexe Abo-Logik
  oder Android dazukommt (kostenlos bis ~2 500 $ Monatsumsatz).
- **Offene Steuerfragen** (Kleinunternehmerregelung, Gewerbeform) hängen
  an der Einzelperson/Organisation-Entscheidung → einmal Steuerberater
  fragen, das ist keine Technikfrage.

## Teil 3 — Was wir SCHON richtig machen (nicht kaputtmachen)

- **Das Einwilligungs-Tor ist genau das, was Apple seit Nov. 2025 für
  KI-Apps verlangt:** Vor der ersten Datenübertragung ein Consent mit
  NAMENTLICH genannten Anbietern und Datenarten (fal.ai, Google, DeepSeek,
  MiniMax/ByteDance; Traumtexte + Fotos) — plus seit heute die
  Klartext-Kacheln. Viele KI-Apps scheitern exakt hier; wir nicht.
- **KI-Kennzeichnung:** „Alles KI-erzeugt und beim Teilen so markiert"
  steht im Tor und in den Details — deckt die Transparenz-Erwartung ab.
- **Kein eigenes Promo-Code-Feld** (3.1.1-Falle) — bewusst entschieden am
  14.09., Offer Codes statt dessen (`docs/uebergabe/2026-09-14-hanni-codes-einladungen.md`).
- **UGC-Moderation (1.2):** Träume sind privat, nichts wird zwischen
  Nutzern geteilt — die harten Report/Block-Pflichten greifen so nicht.
  Wenn je Teilen-in-die-App kommt, VORHER 1.2 lesen.
- **Face-ID-Purpose-String** vorhanden; Konto ist optional („Später") —
  Reviewer kommt ohne Zugangsdaten durch die App.
- **Kein Deepfake-Risiko-Blindflug:** Foto-Einwilligung je Gesicht (Haken,
  Einwilligung v3), Policy-Prüfung der Bilder — im Review-Notes-Text
  erwähnen, das ist ein Pluspunkt.

## Teil 4 — Werkzeuge, um Probleme SELBST vor Apple zu finden

| Werkzeug | Was es prüft | Wann |
|----------|--------------|------|
| **Xcode Organizer → Validate App** | Signierung, Entitlements, fehlende Icons/Plist-Pflichten, Privacy-Manifest-Grundfehler — ohne einzureichen | vor jedem Upload |
| **`fastlane precheck`** ([Doku](https://docs.fastlane.tools/actions/precheck/)) | App-Store-Connect-METADATEN auf Ablehnungsmuster (verbotene Wörter, Platzhalter, URLs); läuft in `deliver` automatisch mit | sobald Metadaten stehen |
| **`appstore-precheck`** ([GitHub](https://github.com/berkayturk/appstore-precheck)) | Read-only-Scan über ~52 Ablehnungs-Vektoren inkl. Guideline-Drift und „adversarial reviewer"-Pass; wrappt fastlane precheck | vor der Einreichung, als zweites Paar Augen |
| **`npx expo-doctor`** | Expo-Projektzustand, Paket-Kompatibilität | regelmäßig, kostet nichts |
| **TestFlight Beta Review** | Die echte Apple-Kurzprüfung am echten Build | jeder Meilenstein-Build |
| **EAS Submit / GitHub Actions** | Upload-Automatisierung; als CI-Gate mit expo-doctor + Tests davor (`.eas/workflows/`) | wenn der Weg steht |
| **App Store Connect API** | Status, Builds, Metadaten skriptbar — Basis für eigene Checks | später |

Praktische Reihenfolge für uns: erst B1–B7 abräumen, dann ein
TestFlight-Build über Hannis Konto als „Generalprobe", dann Metadaten +
`fastlane precheck`, dann einreichen.

## Teil 5 — Review-Notes-Vorlage (beim Einreichen einfügen)

> Dream Rushes is a private dream journal. Users tell their dream by
> voice; the app transcribes it and can render it as a short AI film.
> All generated content is AI-made and labeled as such. Before any data
> leaves the device, a consent gate names every AI provider (fal.ai,
> Google, DeepSeek, MiniMax/ByteDance) and the exact data shared.
> No account is required — tap "Later" on the sign-in step. Purchases:
> credits via StoreKit (consumable) and a monthly/yearly subscription.
> Photos of other people require an explicit in-app consent checkbox per
> photo. Demo video: <Link>. Test tips: record any short dream, then
> "Read my dream" → film order.

## Quellen

- [App Store Review Guidelines (Apple)](https://developer.apple.com/app-store/review/guidelines/) — die Nummern oben
- [iOS App Store Review Guidelines 2026 — Überblick](https://theapplaunchpad.com/blog/ios-app-store-review-guidelines/)
- [App Store Rejection Reasons 2026 (QAwerk)](https://qawerk.com/blog/app-store-rejection-reasons/)
- [Warum KI-Apps abgelehnt werden (appnatively)](https://appnatively.com/blog/apple-is-rejecting-ai-generated-apps)
- [Review-Anforderungen & Submission Gates 2026 (Lexogrine)](https://lexogrine.com/blog/apple-app-store-review-requirements-2026)
- [Expo: Apple Privacy Manifests](https://docs.expo.dev/guides/apple-privacy/)
- [fastlane precheck](https://docs.fastlane.tools/actions/precheck/) · [deliver](https://docs.fastlane.tools/actions/deliver/)
- [appstore-precheck (GitHub, 52 Vektoren)](https://github.com/berkayturk/appstore-precheck)
