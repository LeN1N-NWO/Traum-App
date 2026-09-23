# Plan: Dream Rushes durch die App-Store-Prüfung bringen

> Stand 23.09.2026 abends, Hanni + Claude. **Entwurf zur Abstimmung mit
> Anton.** Baut auf `docs/APP-STORE-EINREICHUNG.md` (Antons Leitfaden: Regeln,
> Blocker B1–B8, Werkzeuge) auf und doppelt ihn nicht — hier steht die
> REIHENFOLGE, wer was macht, und was seit dem Leitfaden dazugekommen ist.
> Wer einen Punkt erledigt, hakt ihn im Leitfaden UND hier ab.

## Grundsatz

Apple prüft die App, wie ein Fremder sie zum ersten Mal benutzt: ohne unser
WLAN, ohne Konto, mit Blick auf jede Behauptung, die sie über Daten macht.
Also gilt für jeden Punkt: **Stimmt, was die App sagt, mit dem überein, was
sie tut?** Die meisten Ablehnungen für Apps wie unsere kommen nicht aus dem
Code, sondern aus diesem Abstand.

## Wo wir stehen (Blocker aus dem Leitfaden, aktualisiert)

| # | Blocker | Stand 23.09. abends |
|---|---------|---------------------|
| B1 | StoreKit + Server-Gutschrift | Client gebaut (PR #54); Server-Belegprüfung fehlt; Produkte in App Store Connect fehlen |
| B2 | Konto-Löschung | ✅ fertig, am iPhone belegt, inkl. Apple-Token-Widerruf (PR #55) |
| B3 | Server aus dem Internet erreichbar | ❌ offen — größter Brocken neben B1, siehe Phase 2 |
| B4 | Testphasen-Schalter | ❌ offen, trivial, bewusst als Letztes |
| B5 | Systemtexte lokalisieren | ✅ in `app.json` + `mobile/locales/` (23.09., Phase 1) — entsteht bei jedem Prebuild |
| B6 | Privacy Manifest | ⚠ Preflight ✓, Inhalt nicht fachlich geprüft |
| B7 | Export-Compliance-Flag | ✅ `ios.config.usesNonExemptEncryption: false` in `app.json` (23.09.) |
| B8 | Medien-Speicherung/-Löschung | ❌ offen, hängt an B3 (und an Befund N3) |

## Neu seit dem Leitfaden (Test 23.09. und Recherche)

| # | Punkt | Apple-Regel | Wo |
|---|-------|-------------|----|
| N1 | ✅ **Datenschutz-Aussage beim eigenen Foto stimmte nicht:** „It stays on your phone" — das Foto geht beim Hinzufügen an fal.ai (Prüfung auf anstößige Inhalte, `server.js:2601`) und für Filme an die KI-Dienste. Neu: „verlässt dein Handy nur für eine Sicherheitsprüfung und für deine Filme". ⚠ Korrektur am Entwurf: Die Kachel „Your journal lives on this device" **stimmt** — kein Client ruft `/api/dreams` auf, Träume werden bisher nicht hochgeladen. | 5.1.1(i), 2.3 | `src/i18n/en.js:1257`, `de.js:1174` |
| N2 | ✅ **Platzhalter im Onboarding** (Liste geleert, Zeile wird ohne Einträge nicht gezeichnet): „★★★★★ Reviews to come", „App Store Award to come". | 2.1(a), 2.3.1 | `src/i18n/en.js:1290` (+ de) |
| N3 | ✅ (Text) **Löschhinweis versprach, Filme zu entfernen** — sie bleiben auf der Platte. Text sagt jetzt nur, was stimmt: Konto und Profil. Filme wirklich mitlöschen bleibt Phase 2 (B8). | 5.1.1(v) | `de.js:413`, `:415`, `en.js:459`, `:461` |
| N4 | **„Vor dem Start prüft ein Anwalt diese Texte"** steht sichtbar in der App (Rechtstexte). Muss vor der Einreichung wahr geworden und verschwunden sein. | 2.1(a) | `de.js:1097`, `en.js:1171` |
| N5 | **Datenschutzerklärung als öffentliche Webseite.** Apple verlangt den Link in den Metadaten UND leicht erreichbar in der App; in der App gibt es sie, eine URL nicht. Dazu eine Support-URL. | 5.1.1(i), 2.1 | neu |
| N6 | **EU-Händlerstatus (DSA)** muss in App Store Connect erklärt werden. Als Händler werden **Adresse, Telefon und E-Mail öffentlich** auf der Produktseite gezeigt — bei einer Einzelperson Hannis private Daten. Wer Umsatz macht, ist praktisch immer Händler. | EU-Recht | App Store Connect |
| N7 | **Gekaufte Credits dürfen nicht verfallen** („may not expire"). Pakete verfallen nie ✓; das Abo-Guthaben (`allowance`) läuft monatlich/jährlich ab — als Abo-Kontingent vermutlich zulässig, aber im Kauftext klar als Monatskontingent benennen. | 3.1.1 | `src/lib/plans.js:189–226` |
| N8 | **Käufe wiederherstellen** braucht einen Weg in der App (bei Abos), und das Kaufblatt muss vor dem Kauf sagen, was man für welchen Preis und Zeitraum bekommt. | 3.1.1, 3.1.2(c) | `mobile/src/components/paywall-sheet.tsx` |
| N9 | **Medien ohne Zugangsprüfung (S2 in `docs/ARCHITEKTUR.md`):** `/media/*` ist für jeden abrufbar, der die URL kennt — Gesichter realer Menschen. Im Heim-WLAN tolerierbar, **öffentlich gehostet nicht**. | 5.1.1, DSGVO Art. 9 | `server.js`, `docs/ARCHITEKTUR.md:84` |
| N10 | **Der Prüfer braucht Credits**, um einen Film zu sehen; mit B4a gibt es keine Gratis-Credits mehr. Entweder Sandbox-Kauf (IAP müssen dafür mit der ersten Version eingereicht und „vollständig, sichtbar, funktionsfähig" sein) oder ein Willkommensguthaben. | 2.1(b) | Entscheidung |
| N11 | Face-ID-Schalter im Simulator ohne Reaktion; Fehlschlag in jedem Fall stumm. | 2.1 | `mobile/src/app/profile/settings.tsx:40` |
| N12 | „Mit Apple anmelden"-Knopf ist selbst gezeichnet (Glas) statt Apples Knopf. | 4.8 / HIG | Onboarding |
| N13 | ✅ (23.09., Konto-Sicherung gebaut, Neues-Handy-Test im Simulator bestanden: App gelöscht, neu installiert → Traum samt Film wieder da) **Der Konto-Schritt versprach, was es nicht gab:** „Mit einem Konto bleiben Träume, Filme und dein Profil erhalten, wenn das Handy wechselt" — Träume und Filme werden bisher nicht mit dem Konto gesichert (kein Client ruft `/api/dreams`). Entweder den Satz auf das Profil beschränken oder die Sicherung bauen. | 2.3.1 | `de.js:1216`, `en.js:1298` |

## Entscheidungen, die zuerst fallen müssen (Phase 0)

Ohne diese lässt sich der Rest nicht sinnvoll bauen. **Wer entscheidet:**
Hanni (Konto, Recht), Anton (Produkt, Geld) — gemeinsam.

1. ✅ **Entschieden (Hanni, 23.09.): jetzt vorbereiten und TestFlight als
   Einzelperson, verkaufen erst als UG.** — Frage war: Erste Einreichung als Einzelperson oder erst mit der UG? Hängt direkt
   an N6: Als Einzelperson mit Käufen stehen Hannis Adresse und Telefon
   öffentlich im EU-Store. Und STAND sagt schon: echte, zahlende Nutzer erst
   nach dem Wechsel zur Organisation. **Vorschlag:** TestFlight und die
   gesamte Vorbereitung jetzt als Einzelperson; die **Einreichung zum
   Verkauf erst nach dem Wechsel zur UG** (D-U-N-S, Team-ID-Falle beachten:
   `docs/plans/2026-09-22-apple-konto-einzelperson-organisation.md`).
2. **Hosting (B3):** Wo läuft `server.js` öffentlich — eigener Server mit
   Caddy (so skizziert in `docs/ARCHITEKTUR.md:155`) oder ein Anbieter?
   Anforderungen: HTTPS, EU-Standort (DSGVO), Domain, IPv6 (Apples
   Prüfnetz), Medien hinter Zugangsprüfung (N9).
3. **Domain** für API, Datenschutzerklärung und Support (N5).
4. **Anwalt** für Nutzungsbedingungen und Datenschutzerklärung (N4) — wann
   und wer. Die Texte bestimmen, was N1/N3 sagen dürfen.
5. **Wie testet der Prüfer den Film (N10)?** Vorschlag: Sandbox-Kauf mit
   eingereichten IAP (Apples Normalweg), dazu ein kleines
   Willkommensguthaben, das ohnehin im Ledger vorgesehen ist
   (`welcome_grant`).
6. **Store-Länder und -Sprachen:** zuerst DE/AT/CH oder weltweit? Bestimmt,
   welche Lokalisierungen Pflicht sind (Metadaten, Systemtexte).

## Phasen (Reihenfolge)

### Phase 1 — Texte und Konfiguration (klein, sofort, eine Sitzung)
Kein Risiko, keine Abhängigkeit. **Claude mit Hanni.**
- ✅ N1, N2, N3 (Text), Antons Befund 1 („Sie zu Filmen machen"; es/fr/zh/hi/ar
  folgen mit der Sammelübersetzung). **Befund 9 bewusst NICHT umgesetzt:**
  Die App erzeugt weiter Bilder (Startbild jedes Films, gezeichnete
  Besetzung) — die Einwilligung muss „images" nennen.
- ✅ N13: Träume-Sicherung mit dem Konto (`mobile/src/lib/dream-sync.ts`,
  `components/dream-sync-layer.tsx`, Brücke `syncExport`/`syncImport`).
  Holen vor Schicken, nie überschreiben/löschen beim Holen; Server nimmt
  keinen älteren Stand über einen neueren; Sprachaufnahme als Pfad dabei;
  nur mit Konto UND gültiger Einwilligung. ⚠ Grenze (Hanni 23.09.): Löschen
  auf Gerät A kann von Gerät B zurückkommen — Lösch-Merkliste auf dem Server
  vor Mehrgeräte-Nutzung/Android nachrüsten.
- ✅ B5, B7 und `NSFaceIDUsageDescription` in `mobile/app.json`
  (`ios.infoPlist`, `ios.config.usesNonExemptEncryption`, `locales` →
  `mobile/locales/{en,de}.json`). Nach Prebuild belegt: Flag gesetzt,
  `Supporting/de.lproj/InfoPlist.strings` mit allen vier Texten; Preflight
  kennt jetzt beide Orte. ⚠ B6 (Privacy Manifest) entsteht erst bei
  `pod install`, nicht beim Prebuild. **Mit Anton
  abstimmen**, damit sein lokales Xcode-Projekt nicht auseinanderläuft.
- N11 (Face ID am iPhone prüfen; Fehlschlag sichtbar machen).
- **Fertig, wenn:** Preflight auf Hannis Mac = nur noch B3/B4-Schalter;
  jeder Satz über Daten in `en.js`/`de.js` stimmt mit `server.js` überein.

### Phase 2 — Öffentlich erreichbar (B3, N9, B8, N5)
Der größte Umbau. **Braucht Entscheidung 2 und 3.**
- Hosting + HTTPS + Domain; `EXPO_PUBLIC_API_BASE` auf die Domain (nie eine
  IP — Apples Prüfnetz ist IPv6).
- Medien hinter Zugangsprüfung (S2/S3, `docs/ARCHITEKTUR.md:184`:
  Supabase Storage mit signierten Adressen).
- Medien beim Konto-Löschen mitlöschen (B8, N3).
- CORS-`null` raus / `API_TOKEN` (B3a).
- Datenschutzerklärung + Support als Webseiten (N5).
- **Fertig, wenn:** Ein iPhone im Mobilfunknetz (nicht im WLAN!) kann
  aufnehmen, lesen, einen Film bestellen und ihn sehen; eine Medien-URL ohne
  Berechtigung liefert 401/403.

### Phase 3 — Kaufen (B1, N7, N8, N10)
**Parallel zu Phase 2 möglich.**
- Hanni in App Store Connect: Produkte (S/M/L/XL, Monats-/Jahresabo),
  Sandbox-Tester, Paid-Applications-Vertrag, Bank/Steuer, Small Business
  Program (15 %), App-Store-Connect-API-Schlüssel für die Belegprüfung.
- Server: Belegprüfung über die App-Store-Server-API → `server_grant()`;
  Sandbox-Belege ins Test-Ledger. Abo-Verlängerung über App Store Server
  Notifications.
- Kaufblatt: Preis, Zeitraum, Leistung vor dem Kauf (3.1.2(c));
  „Käufe wiederherstellen"; Links zu Nutzungsbedingungen und
  Datenschutzerklärung.
- **Fertig, wenn:** Sandbox-Kauf am iPhone → Guthaben im Ledger (nicht im
  Client-Zähler) → nach Neuinstallation wieder da.

### Phase 4 — Generalprobe: TestFlight
- **Release-Bau auf Hannis Mac** (Archive). ⚠ Antons Release-Absturz vom
  18.09. (vorkompilierte RN-Pakete, Xcode 26.3) ist auf Xcode 26.6
  ungeprüft; sein Rezept steht in STAND.
- Xcode Organizer → **Validate App**, dann Upload, **TestFlight Beta Review**
  (Apples echte Kurzprüfung — die billigste Ablehnung, die man bekommen
  kann).
- Anton als interner Tester; alle Wege einmal am echten Gerät im
  Mobilfunknetz: Onboarding ohne Konto, mit Apple, Aufnahme, Film, Kauf,
  Konto löschen, Erinnerungen, Teilen.

### Phase 5 — Metadaten und Einreichung
- Screenshots (6,9"/6,5" — App Store Connect nennt die Pflichtgrößen),
  Beschreibung, Schlagworte, Support-URL, Datenschutz-URL; `fastlane
  precheck` über die Metadaten (Leitfaden Teil 4).
- **Privacy Nutrition Labels** — jede Datenart aus dem Einwilligungs-Tor
  (Traumtext, Fotos, Sprachaufnahme, E-Mail) mit Zweck und Empfänger.
- Altersfreigabe (Leitfaden: 18+), **DSA-Händlerstatus** (Entscheidung 1).
- B4-Schalter zurückdrehen → **Preflight = 0**.
- Review-Notes (Vorlage im Leitfaden Teil 5) + Demo-Video; dem Prüfer
  sagen, wie er ohne Konto durchkommt und wie er einen Film sieht (N10).
- Zuerst **nur DE/AT/CH?** (Entscheidung 6).

## Wer macht was

| Wer | Was |
|-----|-----|
| **Hanni** | Entscheidungen 1, 3, 4 mit Anton; alles im Apple-Konto (ASC-Produkte, Verträge, Sandbox, DSA, TestFlight, Einreichen); Datenbank; `app.json`; Texte mit dem Anwalt |
| **Anton** | Entscheidungen 2, 5, 6 mit Hanni; Kaufblatt/Paywall-Texte; sein lokales Xcode-Projekt an `app.json` angleichen; Demo-Video; Tests am iPhone |
| **Claude-Sitzungen** | Phase 1 komplett; Belegprüfung und Medien-Zugangsprüfung (Phase 2/3); Release-Bau-Rezept für Hannis Mac; Preflight um N1–N10 erweitern, wo sich etwas automatisch prüfen lässt |

## Offene Fragen an Anton

- Einverstanden mit „vorbereiten jetzt, verkaufen erst als UG" (Entsch. 1)?
- Hosting-Vorliebe (Entsch. 2)? Seine 5090 kommt wegen Erreichbarkeit und
  DSGVO dafür kaum in Frage.
- Abo-Guthaben (N7): als Monatskontingent benennen genügt uns — oder soll
  es nie verfallen?

## Quellen

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 2.1, 2.3, 3.1.1, 3.1.2, 4.8, 5.1.1
- [EU Digital Services Act: Trader-Anforderungen (Apple)](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)
- [Konto-Löschung in der App (Apple)](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- Leitfaden `docs/APP-STORE-EINREICHUNG.md` (Werkzeuge, Review-Notes-Vorlage)
- `docs/ARCHITEKTUR.md` (S2/S3/S6, Zielarchitektur)
