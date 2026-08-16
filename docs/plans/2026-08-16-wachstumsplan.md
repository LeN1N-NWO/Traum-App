# Wachstumsplan — was Umsatz bringt, in Reihenfolge

> Stand 16.08.2026, recherchiert gegen die aktuellen Branchendaten
> (RevenueCat „State of Subscription Apps 2026", Adapty, App-Store-Rechtslage
> Stand August 2026). Rangfolge nach erwartetem Umsatzhebel ÷ Aufwand.
> Quellen am Ende.

## Die Lage in drei Zahlen

- **10,7 % vs. 2,1 %** — Konversion (Download→zahlend, Tag 35) mit harter
  Paywall im Onboarding vs. Freemium. Dream Rushes hat heute: gar keine Kasse.
- **55,5 %** des Abo-App-Umsatzes läuft inzwischen über **Wochen-Abos**
  (2023: 43,3 %). Unsere Preisliste kennt nur Monat und Jahr.
- **14.700 neue Abo-Apps pro Monat** (2022: ~2.000), und 69 % des Umsatzes
  liegt bei Apps, die es vor 2020 schon gab. Heißt: Paid-Ads-Auktionen sind
  für uns unbezahlbar — Organik und eigene Kanäle sind der Weg.

## Rangliste

### 1. Die Kasse. Es gibt keine.

Alles Folgende ist Theorie, solange niemand bezahlen KANN. Der Toast im
teuersten Moment der App sagt wörtlich „Aufladen kommt bald". StoreKit über
Capacitor + RevenueCat-SDK + das Konten-Minimum (anonyme Apple-ID-Bindung
reicht anfangs). Hängt zusammen mit dem ohnehin geplanten Capacitor-ADR.
**Alles andere in dieser Liste multipliziert diesen Punkt.**

### 2. Paywall an die zwei Momente hoher Absicht

Nicht „eine Paywall bauen", sondern sie dorthin setzen, wo die Daten zeigen,
dass entschieden wird:

- **Ende des Onboardings, direkt nach dem ersten gratis Traum.** 55 % aller
  Kündigungen von 3-Tage-Trials passieren an Tag 0 — die erste Sitzung
  entscheidet. Unser Aha-Moment existiert schon („Dein erster Traum geht auf
  uns", volle Auflösung, bewusst so beschlossen). Direkt danach ist der
  einzige ehrliche Ort für die Frage nach Geld — als Video-Paywall mit einem
  echten gerenderten Film.
- **Der „Keine Credits"-Moment im Wizard.** Wer da steht, WILL gerade
  rendern. Heute: Sackgasse. Künftig: Kaufblatt mit einem Tipp Abstand.

### 3. Wochen-Abo einführen, Preise rauf

Weekly ist das umsatzstärkste Format der Branche geworden, und teurere Apps
konvertieren im Median **2× besser** als billige — wir sind mit $5,99/Monat
für eine KI-Video-App eher zu billig (Vergleich: Mirror $7,99/Monat nur für
Text-Deutung; KI-Video-Apps nehmen $4,99–9,99/WOCHE). Vorschlag: Weekly
$4,99 mit Credits als Einstieg, Monat auf $9,99, Jahr bleibt. plans.js
komplett neu durchrechnen (die MwSt./Grant-Korrektur vom 10.08. gilt weiter).

### 4. Zwei Push-Nachrichten, die das Produkt SIND

- **Der Morgen-Push.** Träume verdampfen in Minuten; eine Traumtagebuch-App
  ohne Morgenerinnerung verzichtet auf ihr Kernritual. Push-Opt-in-Nutzer
  halten ~2× besser — und bei uns ist die Erinnerung keine Marketing-Nachricht,
  sondern der Produktnutzen selbst. Uhrzeit aus der Umfrage/Weckzeit ableiten.
- **„Dein Film ist fertig."** Filme rendern Minuten. Wer die App zumacht,
  vergisst den teuersten Kauf seiner Sitzung. Der Push holt ihn zum
  Wow-Moment zurück.

Braucht Capacitor → hängt an Punkt 1.

### 5. Der Web-Funnel — die Umfrage existiert schon, sie steht nur am falschen Ort

Der große unbedachte Hebel. Quiz-Onboarding auf einer WEBSITE → Stripe-
Checkout → „Lade die App, melde dich an". Noom/BetterMe-Muster; Annual-LTV
im Web-Funnel ~2× gegenüber In-App, und Stripe kostet 3–4 % statt 15–30 %
(~27 % mehr Marge je Abo). Seit Epic v. Apple dürfen US-Apps sogar aus der
App heraus auf Web-Checkout verlinken (aktuell 0 % Provision; Apple
beantragt 15 % — selbst dann bleibt es günstiger). **Unsere Sprach-Umfrage
IST bereits ein Quiz-Funnel, in sieben Sprachen.** Die Web-Variante davon
(getippt statt gesprochen) plus Stripe repariert nebenbei die Margenrechnung
aus plans.js, die mit 30 % Store-Anteil defizitär ist.

### 6. Teilen als Wachstumsmotor: der Film ist die Werbung

KI-Video ist DAS Format auf TikTok/Reels. Unsere Filme sind von Natur aus
teilbar — was fehlt, ist der Weg: ein Share-Flow, der den Film mit dezentem
„Dream Rushes"-Wasserzeichen exportiert (9:16 haben wir schon). Jeder
geteilte Traum ist ein Werbespot, den ein Nutzer freiwillig produziert hat.
Das später geplante Empfehlungsprogramm dockt genau hier an.

### 7. Positionierung: Kategorie für sich, nicht Konkurrent in fremder

Alle sichtbaren Wettbewerber (Mirror, Oniri, Dreamz, Everi) deuten TEXT.
Niemand rendert Träume als Filme. Also nicht „noch ein Dream Interpreter"
— sondern die Suchbegriffe besetzen, die uns allein gehören („dream to
video", „see your dreams") und zusätzlich die, wo die Nachfrage liegt
(„dream journal", „dream meaning") über das Symbole-Feature bedienen, das
wir SCHON haben. Wichtig: Die Hausregel „keine Deutung" bleibt — Symbole
zeigen Muster, sie wahrsagen nicht. Untertitel im Store entsprechend:
„Dream Journal & AI Dream Films".

### 8. Preise lokalisieren

Sieben Sprachen sind schon da — aber ein $9,99-Abo ist in Indien oder
Brasilien ein anderes Produkt als in den USA. Apple-Preisstufen je
Storefront setzen (Hindi und Arabisch sind nicht zufällig unter unseren
Sprachen). Billig im Aufwand, messbar im Volumen.

### 9. Streak vertiefen: Verlustaversion, aber im Ton der App

Duolingo hält Nutzer über Streak + Verlustangst weit über dem
Kategorie-Schnitt. Wir haben Streak UND Menagerie — aber nichts geht je
verloren und nichts wird seltener. Sanfte Variante, die zum Faultier passt:
Wesen-Seltenheit an Streaks koppeln, „dein Wesen schläft ein" statt
Drohkulisse. Kein dunkles Muster; die App ist ein Ruheort.

### 10. Churn-Werkzeuge: Winback, Billing-Retry, Kündigungsumfrage

Erst sinnvoll, wenn 1–3 stehen und es überhaupt Abonnenten gibt, die man
verlieren kann. Steht hier, damit es auf der Karte ist: RevenueCat bringt
das meiste davon mit.

## Was ich bewusst NICHT empfehle

- **Werbung.** Zerstört die Nachtstimmung, die das Produkt ist, und bringt
  bei kleiner Nutzerbasis Centbeträge.
- **Preise senken.** Die Daten zeigen das Gegenteil: teurer konvertiert
  besser, weil der Preis das Produkt ernst macht.
- **Ein Deutungs-/Horoskop-Feature.** Dort liegt zwar messbar Nachfrage
  (jeder Konkurrent lebt davon), aber es bricht die Hausregel, auf der das
  Vertrauen der App ruht. Der konforme Weg ist Punkt 7: Symbole und Muster
  sichtbar machen, Deutung dem Menschen überlassen.

## Datenbasis

- RevenueCat, State of Subscription Apps 2026 (115.000+ Apps, $16 Mrd.
  Umsatz): harte Paywall 10,7 % vs. 2,1 %; Tag-0-Kündigungen 55 %;
  teure Apps konvertieren 2×; Marktkonzentration.
- Adapty, Mobile App Monetization 2026: Weekly 55,5 % Umsatzanteil.
- RevenueCat Web-to-App-Guide + Airbridge: Web-Funnel-LTV, Stripe-Marge.
- Epic v. Apple (30.04.2025) + MacRumors 13.08.2026: Link-out-Rechtslage.
- Pushwoosh/UXCam Retention-Benchmarks 2026: Push-Opt-in ~2× Retention;
  D30 im Schnitt <5 %.
- Wettbewerb: Mirror ($7,99/Monat), Oniri, Dreamz, Everi — alle Deutung,
  keiner Video.
