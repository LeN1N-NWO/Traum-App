für: Hanni, H4nn40x

Hallo Hanni — Anton will zum Start **Codes** (Freunde und Bekannte bekommen
Credits, später Codes in Instagram-Posts und Verlosungen) und später
**Einladungen** („Freund einladen"). Beides läuft über dein Backend (Konten,
Ledger, Store), deshalb hier alles, was wir dazu herausgefunden haben, bevor
jemand etwas baut. Gebaut ist davon noch nichts.

Belege: `docs/plans/2026-09-14-recherche-codes-verlosungen.md` (Apple-Regeln,
Recht) und `docs/plans/2026-09-14-recherche-einladungen.md` (Nachverfolgung,
Erfahrungswerte). Antons Plan: `docs/plans/2026-09-14-codes-einladungen-plan.md`.

## Die drei Fallen zuerst

1. **Kein eigenes Code-Feld in der App für Gratis-Credits.** Apple lehnt das
   unter 3.1.1 ab („eigene Freischalt-Mechanismen") — auch wenn nichts verkauft
   wird. Belegte Ablehnungen 2018, 09/2024 (Referral-Codes schalten Gratis-Scans
   frei, fast unser Fall), 01/2025, 09/2025. Pokémon GO und Genshin lösen auf
   iOS deshalb nur auf der Website ein.
2. **Kein Bonus für den Eingeladenen fürs Installieren oder Registrieren.**
   Apple hat das 2021 unter 3.2.2 abgelehnt; erst ohne Bonus ging die App
   durch. Belohnt werden darf der Einladende, nach einer echten Handlung in der
   App.
3. **TestFlight-Käufe kosten nichts.** Schreibt der Server Sandbox-Käufe wie
   echte gut, holen sich Tester beliebig viele Credits, und wir bezahlen die
   Filme bei fal. → Transaktionen mit `environment = Sandbox` nie ins echte
   Ledger, oder nur in Testkonten mit Deckel.

## Codes: Apple Offer Codes statt eigener Codes

Seit 29.10.2025 gibt es Offer Codes für **Consumables**, auch als **Free
Offer**. Seit 26.03.2026 lassen sich keine alten IAP-Promo-Codes mehr anlegen.

- **Produkt:** ein eigenes Consumable, z. B. `credits.starter` (Menge
  entscheidet Anton, Vorschlag 22 Credits = zwei 5-s-Filme), dazu Free Offers.
- **Einmal-Codes** für Freunde/Tester (höchstens 6 Monate gültig),
  **Custom-Code** mit Namen und Einlöselimit für Instagram („DREAMFRIENDS").
- **Grenzen:** 10 aktive Angebote, 1 Mio. Codes pro Quartal, ein Code je
  Angebot pro Apple-ID. Codes erst erzeugbar, wenn App **und** IAP freigegeben
  sind — also nicht für die TestFlight-Phase vor dem Launch.
- **In der App:** ein Knopf „Code einlösen", der Apples eigenes Blatt öffnet
  (StoreKit `presentOfferCodeRedeemSheet`, Consumables ab iOS 16.3). Das ist
  Apples Mechanismus, kein eigenes Feld.
- **Server:** Die Einlösung kommt als normale Transaktion (`offerType = 3`,
  `offerIdentifier`, `offerDiscountType = ONE_TIME`, Preis 0), Notification
  `ONE_TIME_CHARGE`. Die App schickt die signierte Transaktion mit dem Konto an
  den Server; der prüft und bucht. Wird außerhalb der App eingelöst, kommt sie
  beim nächsten Start über `Transaction.updates`/`unfinished` — Listener gleich
  beim Start. Ob die Notification allein das Konto kennt (ohne
  `appAccountToken`), ist ungeprüft → Zuordnung über die App.
- **Buchung:** `credits_grant(..., reason, ref = transactionId)` — der
  Unique-Index `credits_ledger_no_double_booking` macht doppelte Meldungen
  unschädlich. Weil es eine IAP-Transaktion ist, **Bucket `purchased`, kein
  Verfall** (Apple 3.1.1).

## Vor dem Launch: Tester direkt beschenken

Für Freunde in TestFlight keine Codes: ein kleines Admin-Skript bucht
`credits_grant(user, n, 'adjustment', ref = 'beta-<datum>-<name>', note)`.
Konten legst du ohnehin noch von Hand an.

## Einladungen (erst im Update nach dem Launch)

Nachverfolgen ohne Tracking-SDK, deterministisch:
- Jedes Konto hat einen Einladungscode (7 Zeichen, ohne 0/O/1/I/L).
- Teilen über das iOS-Teilen-Menü mit Link `https://<domain>/i/CODE`. **Nie**
  Versand durch unseren Server, kein Kontaktzugriff (BGH I ZR 208/12
  „Empfehlungs-E-Mail": sonst gilt es als unsere Werbe-Mail).
- App installiert → Universal Link (`ios.associatedDomains`, AASA-Datei auf der
  Domain, `app/+native-intent.tsx`).
- App nicht installiert → Landingpage ohne Cookies zeigt den Code, „Code
  kopieren & App laden"; in der App fügt `ClipboardPasteButton`
  (expo-clipboard, Apples `UIPasteControl`, kein Einfüge-Dialog) ihn ein.
- ⚠ Wegen Falle 1 den Code **nicht** frei eintippen lassen und ihm beim
  Eingeladenen nichts freischalten: Er verbindet nur die zwei Konten.
- Branch, AppsFlyer, Adjust, Detour **nicht**: auf iOS nur per Fingerprinting,
  das verbietet Apples Lizenzvertrag und braucht in DE eine Einwilligung.

Datenmodell-Skizze (Postgres):
- `invite_codes(user_id pk, code unique, created_at, disabled_at)`
- `invite_redemptions(id, referrer_id, invitee_id unique, source
  link|paste, status pending|qualified|rewarded|rejected, reject_reason,
  created_at, qualified_at, rewarded_at, check referrer_id <> invitee_id)`
- Clients schreiben nichts (RLS), Einlösen nur über den Bun-Server.
- Ledger: neue Werte in `credit_reason` (`promo`, `referral`) und in
  `credits_grant` zulassen; `ref` = `referral:<redemption_id>` (idempotent).

Prämie (Antons Entscheidung, Vorschlag im Plan): Einladender +11 Credits, wenn
der Eingeladene seinen **ersten Film** fertig hat, höchstens 5 im Monat; später
+33 nach dessen erstem Kauf, 7 Tage ohne `REFUND`. Der Eingeladene bekommt
nichts extra — nur das Willkommensgeschenk, das alle bekommen.

Schutz: **DeviceCheck** (2 Bits pro Gerät bei Apple, überleben Neuinstallation;
Bit 0 = „hier wurde schon eine Einladung verbunden") — braucht ein kleines
eigenes Expo-Modul und einen `.p8`-Schlüssel (nicht ins Repo). App Attest erst
vor dem öffentlichen Launch.

## Reihenfolge und Abhängigkeiten

1. **Mit Apple anmelden** (Konten ohne dich) — ohne Konto keine Zuordnung.
2. **StoreKit + App Store Server Notifications** (Käufe prüfen, Sandbox
   trennen, `REFUND` → Abo-Guthaben 0, siehe Jahresabo in `src/lib/plans.js`).
3. **Offer Codes** auf `credits.starter` (App und IAP müssen freigegeben sein).
4. **Einladungen** im ersten Update nach dem Launch.

## Was Anton noch entscheidet
- Menge des Starter-Codes (Vorschlag 22 Credits).
- Prämien für Einladungen (Vorschlag oben).
- ⚠ `WELCOME_CREDITS = 4` in `src/lib/credits.js` kauft seit dem Wegfall der
  Bilder **keinen** Film mehr (billigster: 11). Das Versprechen „erster Film
  geht auf uns" braucht 11 — ~$0,28 je neuem Konto.
