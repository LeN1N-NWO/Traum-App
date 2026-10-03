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

> **Nachtrag 22.09. (Hanni):** Schritt 1 ist gebaut (PR #51), aber das
> Apple-Konto läuft vorerst auf Hanni als **Einzelperson** — die UG kommt
> später. Apples Nutzerkennungen gelten pro Team; wechselt beim Umzug auf die
> UG das Team, bekommt jeder Apple-Nutzer eine neue Kennung, und Konten mit
> Guthaben und Einladungen hingen am alten. **Deshalb gehört der Umzug vor
> die ersten echten Käufe und vor die Einladungen** — Details, Wege und die
> offene Frage an Apple in
> `docs/plans/2026-09-22-apple-konto-einzelperson-organisation.md`.
> ⚠ Für Schritt 3: In der UG vorab keine In-App-Produkte mit denselben IDs
> anlegen (z. B. `credits.starter`) — gleiche Produkt-IDs im Ziel-Account
> blockieren einen App-Transfer.

## Was Anton noch entscheidet
- Menge des Starter-Codes (Vorschlag 22 Credits).

> **Nachtrag 03.10. (Anton + Claude):** Die Prämie ist jetzt in **Träumen**
> (1 Traum = 16 Credits): S → 1, Monatsabo → 1, M → 2, L → 3, XL → 5,
> Jahresabo → 6. Gebucht in einen dritten Bucket **`gift`** mit Ablauf nach
> 30 Tagen (lokal schon gebaut: `src/lib/credits.js` `giftCredits`), nicht
> mehr in `purchased`. Und: beim Kauf **`appAccountToken` = User-UUID**
> setzen, dann kennen die Server Notifications das Konto selbst.
> Tabelle und Begründung: `docs/plans/2026-09-14-codes-einladungen-plan.md`,
> Nachtrag 03.10.

## Nachtrag 03.10. (Anton + Claude): Die App-Seite steht — das erwartet sie vom Server

Anton baut nur die Oberfläche; Server und Datenbank bleiben bei dir. Gebaut
(Entwurfs-PR #71): Einladungs-Seite `mobile/src/app/profile/invite.tsx`,
Karte im Profil, Code-Feld, Teilen über das iOS-Blatt, Deep Link
`dreamrushes://invite/CODE` (`mobile/src/app/+native-intent.tsx`), gemeinsame
Regeln `src/lib/invites.js` (Code-Format, Link, Prämie in Träumen — bitte
für den Server dieselbe Datei importieren statt nachzubauen).

**Endpunkte, die die App ruft** (`mobile/src/lib/invites.ts`, beide mit
`authFetch`, also Bearer-Token):

    GET  /api/invite
      200 { code: "DRM4KX7",            // 7 Zeichen aus CODE_ALPHABET
            connected: false,            // ist DIESES Konto schon eingeladen worden?
            rewardsThisMonth: 1,         // Prämien des laufenden Monats (Deckel 5)
            referrals: [{ id, name,      // Anzeigename des Freundes oder null
                          status: "joined" | "bought" | "rewarded" | "rejected",
                          product: "pack-s" | … | null,   // plan.id aus plans.js
                          films: 2,                      // Prämie in Träumen
                          rewardAt: ISO | null }] }      // wann „bought" auszahlt

    POST /api/invite/connect   { code }
      200 { ok: true }
      4xx { error: "unknown" | "own" | "already" | "device" }

Solange die Endpunkte 404/501 antworten, zeigt die App eine markierte
**Vorschau** mit Beispieldaten (`INVITE_PREVIEW` in `invites.ts`, vor der
Veröffentlichung auf `false`).

**Kauf:** `buyPlan()` (`mobile/src/lib/iap.ts`) setzt jetzt
`appAccountToken` = Supabase-User-ID (nur wenn angemeldet und eine UUID).
Die kommt in der signierten Transaktion und in den Server Notifications V2
zurück — Kauf und `REFUND` lassen sich damit ohne die App dem Konto zuordnen.

**Gutschrift:** Prämie = `referralReward(planId).credits` (1 Traum = 16
Credits) in einen Bucket `gift` mit Ablauf 30 Tage — dieselbe Logik wie
lokal in `src/lib/credits.js` (`giftCredits`, Ausgabe Abo → Geschenk →
gekauft). Die Serien-Geschenke (`streakBoard.js`) gehören in denselben
Bucket, sobald Credits auf dem Server liegen.

**Noch offen bei dir:**
- Universal Links: `ios.associatedDomains: ["applinks:dreamrushes.app"]` in
  `app.json` + AASA-Datei auf der Domain + Capability im Apple-Konto. Die
  App leitet `/i/CODE` dann schon richtig weiter (`+native-intent.tsx`).
- Landingpage `dreamrushes.app/i/CODE` (Code zeigen, „Kopieren & App laden").
- DeviceCheck-Bit („hier wurde schon eine Einladung verbunden").
- `expo-clipboard` für Apples Einfügeknopf ist NICHT eingebaut (neues
  natives Modul); heute fügt man per Langdruck ins Feld ein.

## Nachtrag 03.10. abends (Hanni + Claude): Der Server-Teil steht — ohne Prämie

Gebaut, genau nach dem Vertrag oben:

- **`GET /api/invite`** → `{ code, connected, rewardsThisMonth, referrals }`
  in der Form von `mobile/src/lib/invites.ts`. Jedes Konto bekommt beim
  ersten Aufruf seinen Code (Alphabet und Länge aus `src/lib/invites.js`,
  kryptografischer Zufall, bei Kollision neu). Vom Freund kommt nur der
  Anzeigename.
- **`POST /api/invite/connect { code }`** → `200 { ok: true }`, sonst
  `404 unknown`, `409 own`, `409 mutual`, `409 already`. **Neu: `mutual`** —
  wen ich eingeladen habe, der kann nicht mich einladen (sonst belohnten
  sich zwei gegenseitig für je einen Kauf). Dafür sind `invites.ts`,
  `journal-store.ts` und der Text in `en.js`/`de.js` um je eine Zeile
  ergänzt; die Einladungs-Seite zeigt ihn ohne Änderung. Der Code wird mit
  `normalizeCode()` gelesen (Link, Kleinbuchstaben, Bindestriche gehen).
  Gebremst wie Anmelden (10/Minute), damit niemand Codes durchprobiert.
- **Datenbank:** `supabase/migrations/20261003120000_invites.sql` —
  `invite_codes`, `invite_redemptions` (Spalten für Kauf und Prämie stehen
  schon da), drei `security definer`-Funktionen nur für `dreamrushes_server`.
  Auf die Tabellen darf niemand direkt. Konto löschen löscht Code und
  Einladungen mit.
- Code: `src/lib/invitesServer.js` (+ Test), zwei Routen in `server.js` im
  Konto-Block.

Geprüft: 15 Tests für das Modul; die Migration in einem echten Postgres
(PGlite) mit 29 Prüfungen, darunter die Verbote mit Fehlercode `42501`,
Löschrecht und das Modul Ende zu Ende gegen die SQL-Funktionen; Gegenprobe
mit drei eingebauten Fehlern.

**Noch nicht:**
- ✅ **Migration eingespielt** (03.10., Hanni, SQL-Editor). Danach nur
  lesend an der echten Datenbank geprüft, 8/8: beide Tabellen mit RLS, drei
  `security definer`-Funktionen, nur `dreamrushes_server` darf sie
  ausführen, niemand hat direkte Tabellenrechte, Übersicht kommt in der
  richtigen Form, direktes Lesen und Aufruf ohne Nutzer → `42501`.
  **Offen:** einmal mit echtem Konto in der App prüfen (Code erscheint,
  zweites Konto verbindet sich) — erst dann `INVITE_PREVIEW = false`
  (Antons Datei). Ohne eingespielte Migration hätte der Server 501
  geantwortet und die App ihre Vorschau gezeigt.
- `bought`/`rewarded` und die Prämie: brauchen die Prüfung echter
  App-Store-Käufe (B1) und den Bucket `gift` auf dem Server. ⚠ Für B1:
  Prämie nur für den **ersten Kauf überhaupt**, und der muss **nach dem
  Verbinden** liegen (`invite_redemptions.created_at`) — sonst lässt sich
  ein Bestandskunde nachträglich verbinden und sein nächster Kauf zahlt aus.
- Ein gesperrter Code (`disabled_at`) wird seinem Besitzer weiter angezeigt,
  Freunde bekommen „unknown". Heute sperrt niemand Codes; wer das einführt,
  gibt dem Besitzer dabei einen neuen.
- `device` (DeviceCheck), Universal Links/AASA, Landingpage
  `dreamrushes.app/i/CODE`.
