# Codes, Einladungen, Verlosungen — Plan

Stand 14.09.2026. Antons Fragen: Wie lassen sich Einladungen nachverfolgen,
lohnen sich Credits dafür? Wir brauchen ein Promo-Code-System für die ersten
Nutzer (Freunde, Bekannte) und später Codes und Verlosungen in Instagram-Posts.

Belege: `2026-09-14-recherche-einladungen.md`,
`2026-09-14-recherche-codes-verlosungen.md`. Für Hanni:
`docs/uebergabe/2026-09-14-hanni-codes-einladungen.md`. **Nichts gebaut.**

## Die Kurzfassung

| Was | Wie | Wann |
|---|---|---|
| Credits für die ersten Tester | Server bucht direkt ins Test-Konto | TestFlight, vor dem Launch |
| Codes für Freunde, Instagram, Gewinner | **Apple Offer Codes** (Gratis-Angebot auf ein Credit-Paket) | ab Launch |
| Verlosung | Instagram-Post, kostenlose Teilnahme, Gewinner bekommen einen Offer Code | ab Launch |
| Einladungen | Einladungscode per Link, Prämie nur für den Einladenden nach dem ersten Film des Freundes | erstes Update nach dem Launch |

## 1. Warum keine eigenen Codes in der App

Apple verbietet „eigene Freischalt-Mechanismen" (3.1.1) und wendet das auch
auf **kostenlose** Codes an. Belegte Ablehnungen: 2018, 09/2024 (ein
Einladungscode schaltete Gratis-Nutzung frei — fast unser Fall), 01/2025,
09/2025. Große Spiele wie Pokémon GO lassen Codes auf dem iPhone deshalb nur
auf ihrer Website einlösen.

**Der sichere Weg sind Apples eigene Offer Codes**, seit Oktober 2025 auch für
Credit-Pakete und als Gratis-Angebot:
- **Einmal-Codes** (zufällig, einmal einlösbar, höchstens 6 Monate gültig) für
  Freunde, Tester und Gewinner.
- **Eigene Codes mit Namen** („DREAMFRIENDS") mit Einlöse-Limit und Enddatum
  für Instagram und Werbung.
- Eingelöst wird über Apples Blatt in der App oder per Link. Apple meldet uns
  die Einlösung, der Server bucht die Credits.
- Grenzen: 10 aktive Angebote, 1 Mio. Codes pro Quartal, ein Code je Angebot
  pro Apple-ID. Codes gibt es erst, wenn App und Paket freigegeben sind.
- Kostet nichts, Apple bekommt bei Gratis-Codes nichts.

**Vorschlag:** ein eigenes Paket „Starter" mit **22 Credits** (zwei 5-s-Filme,
uns kostet das höchstens ~$0,62), nur über Codes erhältlich.

**Vor dem Launch (TestFlight):** Offer Codes gehen noch nicht. Tester bekommen
Credits direkt vom Server. ⚠ Käufe in TestFlight sind gratis — der Server darf
sie nicht wie echte gutschreiben, sonst holen sich Tester unbegrenzt Credits
und wir zahlen die Filme.

## 2. Einladungen — lohnt sich das?

**Ja, aber in Maßen.**
- Geworbene Kunden bleiben länger und sind mehr wert: In einer großen Studie
  (deutsche Bank, 10.000 Kunden) mindestens 16 % mehr Kundenwert, rund 60 %
  Rendite auf die Prämie (Schmitt, Skiera & Van den Bulte 2011).
- Geworbene werben selbst 31–57 % mehr weiter (Gershon & Jiang 2025).
- **Aber der Mengeneffekt ist oft klein:** Bei Duolingo brachte das Programm
  nur +3 % Neunutzer. Zahlen wie „30 % aller Installationen aus Empfehlungen"
  stammen von Verkäufern solcher Software.
- **KI-Anbieter mit echten Kosten** belohnen spät: Kling und Higgsfield erst,
  wenn der Eingeladene kauft; Suno erst nach 10 erstellten Songs.

**Was Apple erlaubt:** Belohnt werden darf der **Einladende** für eine echte
Handlung des Freundes in der App. Ein Bonus für den **Eingeladenen** fürs
Installieren oder Registrieren wurde 2021 abgelehnt. Die Forschung sagt zwar,
ein Geschenk für den Freund wirkt am besten — das bekommen wir trotzdem: Der
Freund bekommt den ersten Film geschenkt wie jeder neue Nutzer, und genau das
steht im Einladungstext.

**Vorschlag Prämie:**
- Einladender **+11 Credits** (ein 5-s-Film), sobald der Freund seinen ersten
  Film fertig hat. Höchstens 5 pro Monat.
- Später zusätzlich **+33 Credits**, wenn der Freund zum ersten Mal kauft und
  7 Tage nicht erstattet.
- Kosten: rund $0,28 Prämie je aktiviertem Freund. Wer mit fünf eigenen
  Zweitgeräten betrügt, holt sich im Monat Prämien für ~$1,40 und muss dafür
  fünf Geräte, fünf Konten und fünf Filme aufsetzen — uninteressant.

## 3. Einladungen — wie wird das nachverfolgt?

Auf dem iPhone gibt es **keine** saubere automatische Zuordnung „dieser
Download kam von Anna" — der App Store ist eine Datenschutzgrenze. Dienste
wie Branch schätzen per Fingerprinting; das verbietet Apple und passt nicht
zu uns. Deshalb ein Einladungscode, der auf drei Wegen ankommt:
1. **Link** `dreamrushes.app/i/CODE` über das iOS-Teilen-Menü (WhatsApp,
   iMessage …). Ist die App installiert, öffnet sie sich direkt mit dem Code.
2. **Noch nicht installiert:** Die Seite zeigt den Code und kopiert ihn per
   Tipp; nach der Installation fügt ein Apple-Einfügeknopf in der App ihn ein —
   ohne Nachfrage-Dialog.
3. Die App ordnet den Freund dem Einladenden zu, sobald der Freund ein Konto
   hat. Schutz gegen Mehrfach-Einlösen: Apples DeviceCheck merkt sich pro
   Gerät „schon eingeladen", auch nach Neuinstallation, ohne das Gerät zu
   kennen.

**Wichtig:** Einladungen verschickt immer der Nutzer selbst aus seinem
Messenger. Schickt unser Server Mails oder SMS an Freunde, gilt das in
Deutschland als unsere Werbung ohne Einwilligung (BGH I ZR 208/12). Kein
Zugriff auf Kontakte.

**Für Instagram-Posts:** App-Store-Kampagnenlinks (`ct=post-12`) zeigen,
wie viele Installationen ein Post gebracht hat — nur als Summe, ohne Tracking.

## 4. Verlosungen

- **Auf Instagram:** Teilnahme kostenlos (Kommentar, höchstens ein bis zwei
  Freunde markieren). Gewinner bekommen per DM einen Einmal-Code.
- **Pflicht:** Teilnahmebedingungen (Veranstalter, Zeitraum, Preis, Auslosung,
  Alter, Datenschutz), der Satz „nicht von Instagram gesponsert oder
  organisiert" und die Freistellung von Meta. Posting als Werbung erkennbar.
- **Nie** Teilnahme gegen Kauf oder Credits: Dann wird es Glücksspiel
  (GlüStV, Apple 5.3.4).
- Auf Facebook ist „Freund markieren" als Bedingung verboten.
- In der App erst später; dann Bedingungen in der App und „Apple ist kein
  Sponsor".
- Checkliste aller Texte: Recherche, Abschnitt 10.

## 5. Was vorher da sein muss (Reihenfolge)

1. **Mit Apple anmelden** — ohne Konto keine Zuordnung, heute legt Hanni
   Konten von Hand an.
2. **Käufe über den App Store** mit Server-Prüfung (heute kassiert die App
   noch nichts), Sandbox getrennt.
3. **Offer Codes** auf das Starter-Paket.
4. **Einladungen** im Update nach dem Launch.
5. Vor dem öffentlichen Start: Anwältin für Einladungs- und Codebedingungen,
   Steuerberater zu geschenkten Credits.

## Zur Entscheidung (Anton)

1. Starter-Code: 22 Credits?
2. Einladungsprämie: +11 für den Einladenden nach dem ersten Film des Freundes,
   5 pro Monat; später +33 nach Kauf?
3. ⚠ **Willkommensgeschenk:** `WELCOME_CREDITS = 4` stammt aus der Bilderzeit
   und kauft heute keinen Film (billigster: 11 Credits). Soll „der erste Film
   geht auf uns" gelten, müssen es 11 sein — ~$0,28 je neuem Konto.
