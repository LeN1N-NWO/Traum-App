für: Hanni, H4nn40x

Hallo Hanni — Anton will zum Start **Codes** (Freunde und Bekannte bekommen
Credits, später Codes in Instagram-Posts und Verlosungen) und nach dem Launch
**Einladungen** mit Prämie. Beides läuft über dein Backend (Konten, Ledger,
Store), deshalb hier alles, was feststeht, bevor jemand etwas baut. Gebaut ist
davon noch nichts.

Stand 14.09.2026 mittags, **nach Antons Entscheidungen**:
- **Kein Willkommensgeschenk mehr** („das kostet uns nur Geld"). Im Client ist
  es entfernt (`src/lib/credits.js`), der Server darf nie `welcome_grant`
  buchen. Den Enum-Wert im Schema kannst du stehen lassen oder in einer
  späteren Migration aufräumen.
- **Einladungsprämie nur, wenn der Eingeladene wirklich kauft.** Keine
  Prämie für Installieren, Registrieren oder den ersten Film.
- **XL-Paket 650 Credits** statt 700 (`src/lib/plans.js`) — wichtig für die
  Store-Produkte.

Belege: `docs/plans/2026-09-14-recherche-codes-verlosungen.md` (Apple-Regeln,
Recht) und `docs/plans/2026-09-14-recherche-einladungen.md` (Nachverfolgung,
Erfahrungswerte). Plan: `docs/plans/2026-09-14-codes-einladungen-plan.md`.

## Die drei Fallen zuerst

1. **Kein eigenes Code-Feld in der App für Gratis-Credits.** Apple lehnt das
   unter 3.1.1 ab („eigene Freischalt-Mechanismen") — auch wenn nichts verkauft
   wird. Belegte Ablehnungen 2018, 09/2024 (Referral-Codes schalten Gratis-Scans
   frei, fast unser Fall), 01/2025, 09/2025.
2. **Der Eingeladene bekommt nichts extra.** Apple hat 2021 einen Bonus für den
   Eingeladenen unter 3.2.2 abgelehnt. Belohnt wird nur der Einladende.
3. **TestFlight-Käufe kosten nichts.** Schreibt der Server Sandbox-Käufe wie
   echte gut, holen sich Tester beliebig viele Credits, und wir bezahlen die
   Filme bei fal. → Transaktionen mit `environment = Sandbox` nie ins echte
   Ledger. Und: Eine Sandbox-Transaktion darf **nie** eine Einladungsprämie
   auslösen.

## Codes: Apple Offer Codes statt eigener Codes

Seit 29.10.2025 gibt es Offer Codes für **Consumables**, auch als **Free
Offer**. Seit 26.03.2026 lassen sich keine alten IAP-Promo-Codes mehr anlegen.

- **Produkt:** ein eigenes Consumable `credits.starter` nur für Codes (Menge
  entscheidet Anton, Vorschlag 22 Credits = zwei 5-s-Filme), dazu Free Offers.
- **Einmal-Codes** für Freunde/Tester/Gewinner (höchstens 6 Monate gültig),
  **Custom-Code** mit Namen und Einlöselimit für Instagram („DREAMFRIENDS").
- **Grenzen:** 10 aktive Angebote, 1 Mio. Codes pro Quartal, ein Code je
  Angebot pro Apple-ID. Erzeugbar erst, wenn App **und** IAP freigegeben sind.
- **In der App:** ein Knopf „Code einlösen", der Apples eigenes Blatt öffnet
  (StoreKit `presentOfferCodeRedeemSheet`, Consumables ab iOS 16.3).
- **Server:** Die Einlösung kommt als Transaktion mit `offerType = 3`,
  `offerIdentifier`, `offerDiscountType = ONE_TIME`, Preis 0; Notification
  `ONE_TIME_CHARGE`. Die App schickt die signierte Transaktion mit dem Konto;
  der Server prüft und bucht. Außerhalb der App eingelöst → kommt beim nächsten
  Start über `Transaction.updates`/`unfinished`, Listener gleich beim Start.
  Ob die Notification allein das Konto kennt (ohne `appAccountToken`), ist
  ungeprüft → Zuordnung über die App.
- **Buchung:** `credits_grant(..., ref = transactionId)`, Bucket `purchased`,
  kein Verfall (IAP, Apple 3.1.1). Der Unique-Index macht Doppelmeldungen
  unschädlich.
- ⚠ **Ein Gratis-Code ist kein Kauf** im Sinne der Einladungsprämie: Preis 0
  oder `offerType = 3` löst keine Prämie aus.

## Vor dem Launch: Tester direkt beschenken

Für Freunde in TestFlight keine Codes: ein kleines Admin-Skript bucht
`credits_grant(user, n, 'adjustment', ref = 'beta-<datum>-<name>', note)`.

## Einladungen (erstes Update nach dem Launch)

**Zuordnen ohne Tracking-SDK:**
- Jedes Konto hat einen Einladungscode (7 Zeichen, ohne 0/O/1/I/L).
- Teilen über das iOS-Teilen-Menü mit Link `https://<domain>/i/CODE`. **Nie**
  Versand durch unseren Server, kein Kontaktzugriff (BGH I ZR 208/12).
- App installiert → Universal Link (`ios.associatedDomains`, AASA-Datei,
  `app/+native-intent.tsx`).
- Nicht installiert → Landingpage ohne Cookies zeigt den Code, „Code kopieren &
  App laden"; in der App fügt `ClipboardPasteButton` (expo-clipboard, Apples
  `UIPasteControl`, kein Einfüge-Dialog) ihn ein.
- Der Code **schaltet beim Eingeladenen nichts frei**, er verbindet nur zwei
  Konten (Falle 1 und 2).
- Kein Branch/AppsFlyer/Adjust/Detour (auf iOS Fingerprinting).

**Prämie (entschieden, Anton 14.09.2026):**
- Auslöser: **erster echter Kauf** des Eingeladenen (Paket oder Abo, nicht
  Sandbox, nicht Preis 0) **und 14 Tage ohne `REFUND`** — so lange läuft auch
  das EU-Widerrufsrecht.
- Größe: rund 20 % der gekauften Credits, **auf glatte Zehner abgerundet**,
  beim Jahresabo **100**. Am besten als feste Tabelle je Produkt-ID auf dem
  Server, nicht als Formel:

| Kauf des Freundes | Prämie | kostet uns höchstens | Anteil an unserem Gewinn aus dem Kauf |
|---|---|---|---|
| Paket S $4,99 | 10 | $0,28 | 13 % |
| Paket M $12,99 | 30 | $0,85 | 17 % |
| Paket L $24,99 | 60 | $1,70 | 19 % |
| Paket XL $49,99 | 130 | $3,67 | 21 % |
| Monatsabo $9,99 | 30 | $0,85 | 32 % des ersten Monats |
| Jahresabo $99,99 | 100 | $2,83 | 17 % |

(Apple 15 %, 19 % MwSt, voller Verbrauch, teuerster Einkauf je Credit.)
- Hinweis: 10 Credits allein reichen für keinen Film (billigster: 11) — sie
  landen im selben Guthaben und zählen mit dem Rest.
- Deckel: höchstens 5 Prämien pro Monat je Einladendem.
- Buchung: `credits_grant(referrer, n, 'referral', ref = 'referral:<redemption_id>')`
  in `purchased` (kein Verfall; ein Verfall bräuchte einen dritten Topf und
  eine juristische Prüfung).

**Datenmodell-Skizze (Postgres):**
- `invite_codes(user_id pk, code unique, created_at, disabled_at)`
- `invite_redemptions(id, referrer_id, invitee_id unique, source link|paste,
  status pending|purchased|rewarded|rejected, reject_reason, created_at,
  purchase_tx, purchased_at, rewarded_at, check referrer_id <> invitee_id)`
- Ein täglicher Job setzt `purchased` → `rewarded`, wenn der Kauf 14 Tage alt
  ist und kein `REFUND` kam; Deckel dort prüfen.
- Clients schreiben nichts (RLS), Einlösen nur über den Bun-Server.
- Neue Werte in `credit_reason`: `promo`, `referral`; `credits_grant` muss sie
  zulassen.

**Schutz:** DeviceCheck (2 Bits pro Gerät bei Apple, überleben Neuinstallation;
Bit 0 = „hier wurde schon eine Einladung verbunden") — kleines eigenes
Expo-Modul, `.p8`-Schlüssel nicht ins Repo. Weil erst ein echter Kauf zahlt,
lohnt Betrug kaum; App Attest erst vor dem öffentlichen Launch.

## Reihenfolge und Abhängigkeiten

1. **Mit Apple anmelden** (Konten ohne dich) — ohne Konto keine Zuordnung.
2. **StoreKit + App Store Server Notifications** (Käufe prüfen, Sandbox
   trennen, `REFUND` → Abo-Guthaben 0; Jahresabo legt im Abojahr dazu, siehe
   `allowanceGrant()` in `src/lib/plans.js`).
3. **Offer Codes** auf `credits.starter`.
4. **Einladungen** im ersten Update nach dem Launch.

## Was Anton noch entscheidet
- Menge des Starter-Codes (Vorschlag 22 Credits).
