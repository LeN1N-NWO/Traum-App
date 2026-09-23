für: Hanni, H4nn40x

Hallo Hanni — drei Dinge aus Antons Sessions vom 22./23.09., zwei davon
brauchen dich, eins ist eine Warnung, die dir Zeit spart.

## 1. Konto-Löschung: Migration ausführen und einmal echt testen

Apple verlangt sie (5.1.1(v)), sobald es Konto-Erstellung gibt — dein
„Mit Apple anmelden" hat sie gebracht. Gebaut ist alles:

- **Migration `supabase/migrations/20260923090000_account_delete.sql`** —
  bitte im Supabase-Dashboard ausführen (dein Zugang). Sie legt
  `server_delete_account()` an, nach dem Muster deiner
  server_role-Wrapper: kein Nutzer-Argument, handelt für den in der
  Transaktion erklärten Nutzer; gelöscht wird nur die `auth.users`-Zeile,
  deine `on delete cascade`-Ketten räumen Profil, Träume und Guthaben.
- Endpunkt `DELETE /api/account` (server.js, direkt hinter deinem PATCH),
  Client `deleteAccount()` in `mobile/src/lib/auth.ts`, rote Zeile
  „Konto löschen" in den Einstellungen (Bestätigung; bei aktiver
  Face-ID-Sperre zusätzlich Face ID).
- **Testen kann das nur, wer die Datenbank hat — du.** Anton bekommt ohne
  Supabase-Keys ein 503. Bitte einmal: Konto anlegen → in der App
  löschen → prüfen, dass auth.users-Zeile, Profil, Träume, Guthaben weg
  sind und die Sitzung tot ist.

## 2. ⚠ Dein Merge brachte native Pakete mit — Anton kostete das einen Absturz

`expo-crypto` und `expo-apple-authentication` kamen mit PR #51 in die
package.json. Auf Antons Seite lief danach `bun install`, aber kein
`pod install` — Ergebnis: **„Cannot find native module 'ExpoCrypto'"**,
fataler JS-Fehler am Ende des Onboardings (Konto-Schritt lädt deinen
Apple-Code), App friert ein bzw. stürzt ab. Behoben (pod install), aber
als Regel für uns beide: **Wer einen Branch mit neuen nativen Paketen
zieht, muss `pod install` + Rebuild machen** — die bekannte
„neue native Pakete"-Regel gilt auch, wenn das Paket per Merge kommt.
Umgekehrt gilt es auch für dich: Unser Branch bringt
`expo-local-authentication` (Face-ID-Schutz) mit.

## 3. App Store: Was nur du machen kannst

Anton hat einen Einreichungs-Guide beauftragt —
`docs/APP-STORE-EINREICHUNG.md` (Blocker-Liste, Werkzeuge, Ablauf).
`bun run preflight` prüft die Blocker automatisch. Deine Punkte daraus:

- **Bundle-ID festlegen** (unveränderlich nach dem ersten Upload):
  app.json sagt seit deinem PR `com.dreamrushes.app`, Antons lokales
  Xcode-Projekt baut `app.dreamrushes`. Eine muss gewinnen — sprich dich
  mit Anton ab (deine Signierung spricht für `com.dreamrushes.app`).
- **Einzelperson vs. Organisation** — dein Plan
  `2026-09-22-apple-konto-einzelperson-organisation.md` liegt schon da;
  Entscheidung vor dem ersten Upload.
- **StoreKit (Guide Teil 2b):** Wir bauen die Technik (Kaufblatt,
  Beleg-Prüfung, `server_grant()`); du machst das Konto-Gebundene:
  Produkte in App Store Connect anlegen (Pakete S/M/L/XL, Monats-/
  Jahresabo), Sandbox-Tester anlegen, TestFlight-Builds.
- **Geld-Setup in App Store Connect** (einmalig, vor den ersten
  Verkäufen): Paid-Applications-Vertrag annehmen, Bank- und Steuerdaten
  hinterlegen, und ins **Small Business Program** eintragen — 15 % statt
  30 % Provision unter 1 Mio. $ Jahresumsatz, kostenlos. Details und
  Buchführungs-Überblick: Guide Teil 2c.
- **Systemtexte lokalisieren** (`mobile/app.json`, deine Datei):
  NSMicrophone/NSPhoto/NSFaceID-Begründungen brauchen deutsche Fassungen
  (`CFBundleLocalizations`/`InfoPlist.strings`) — Onboarding-Befund 10,
  jetzt App-Store-relevant (Blocker B5 im Preflight).

Danke! Fragen gern über Anton oder als Notiz in docs/uebergabe/.
