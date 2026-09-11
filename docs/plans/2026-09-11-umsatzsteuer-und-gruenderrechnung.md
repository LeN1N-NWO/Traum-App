# Umsatzsteuer, Abrechnung, Gründerrechnung — Vermerk vom 11.09.2026

**Anlass:** Antons Fragen am Abend des 11.09.: Wie läuft die Umsatzsteuer
beim Credit-Verkauf? Mit wem haben wir überhaupt den Vertrag? Und wie viel
müssten die Nutzer zahlen, damit zwei Gründer je 5.000 € netto im Monat
nach Hause tragen?
**Das ist eine Recherche mit Quellen, keine Steuerberatung.** Die Zahlen
sind Schätzungen mit ±10 %; was ein Steuerberater prüfen muss, steht am Ende.
Vorgeschichte: [Rechtsform](2026-09-11-rechtsform.md),
[Direktbezug](2026-09-11-direktbezug-videomodelle.md),
[Wachstumsplan](2026-08-16-wachstumsplan.md) §5 (Web-Funnel/Stripe).

## Antons Festlegungen vom 11.09.

- **UG (haftungsbeschränkt).** Gründung rund 400 €, laufend 200–300 € im
  Jahr an Steuer- und Registerdingen.
- **Steuerberater (≈3.000 €/Jahr) ist nicht Pflicht** — die Buchhaltung
  soll durch Cloud-Software laufen (lexoffice/sevdesk o. ä.). Siehe
  Einschränkung unten.
- **Seedance 2.5 direkt buchen, über Replicate** (halber Preis gegenüber
  fal, „das wäre echt krass, das von den Leuten zu verlangen"). Anton hat
  schon ein Replicate-Konto. H3 bleibt bei fal.

## 1. Mit wem haben wir den Vertrag? — Apple, nicht der Nutzer

Credits sind ein In-App-Kauf (Consumable). Für Käufer in der EU ist unser
Vertragspartner **Apple Distribution International Ltd., Cork, Irland**
(USt-IdNr. IE9700053D). Apple tritt gegenüber dem Nutzer als Verkäufer auf
(Kommissionär; Art. 9a der EU-Durchführungsverordnung 282/2011 vermutet
den App Store als Leistenden). Das heißt:

- **Apple kassiert die 19 % Umsatzsteuer vom deutschen Nutzer und führt
  sie ab.** Wir stellen dem Nutzer keine Rechnung und schulden auf den
  Verkauf keine deutsche Umsatzsteuer.
- **Wir erbringen eine sonstige Leistung an ein Unternehmen in Irland.**
  Leistungsort Irland (§ 3a Abs. 2 UStG), in Deutschland nicht steuerbar;
  Apple schuldet die irische Steuer im Reverse-Charge-Verfahren. Apple
  rechnet monatlich per Bericht/Gutschrift ab und überweist den Nettoerlös
  (etwa 33 Tage nach Ende des Apple-Geschäftsmonats).
- **Unsere Pflichten:** USt-IdNr. beantragen (BZSt, mit dem Fragebogen
  zur steuerlichen Erfassung), die Apple-Erlöse in der USt-Voranmeldung
  als „nicht steuerbare sonstige Leistungen § 18b UStG" eintragen, und
  vierteljährlich die **Zusammenfassende Meldung** mit Apples irischer
  USt-IdNr. abgeben. Üblich ist, je Auszahlung einen Reverse-Charge-Beleg
  an Apple zu erzeugen (Beweis fürs Finanzamt; die Software macht das).
- **RevenueCat** (Hannis Fund; Anton: „Supercat") ist **kein**
  Vertragspartner und kein Zahlungsdienst. Es ist die Buchhaltungsschicht
  in der App: prüft Apple-Belege, führt Berechtigungen, schickt Webhooks
  an Supabase (Credits gutschreiben). Preis: gratis bis 2.500 $ Monats-
  umsatz, darüber 1 % des Bruttoumsatzes (vor Apple-Provision).
- **Apple-Provision: 15 %** im Small Business Program (bis 1 Mio. $
  Vorjahreserlös; muss beantragt werden), sonst 30 %. Die neuen EU-Regeln
  ab 01.10.2026 lassen die 15 % für App-Store-Zahlungen unverändert;
  alternative Zahlungsabwicklung kostet dann 10 % (für den Web-Funnel aus
  dem Wachstumsplan später interessant).
- **DSA:** Als Anbieter, der verkauft, müssen wir im App Store als
  „Händler" mit Adresse, Telefon und E-Mail sichtbar sein (siehe
  Rechtsform-Notiz).

## 2. Kleinunternehmer? — Nein, das wäre eine Falle

Die Kleinunternehmerregelung (§ 19 UStG, 2026: 25.000 € Vorjahr /
100.000 € laufend) klingt bequem, hilft uns aber nicht und schadet:
Unser Verkauf ist ohnehin nicht in Deutschland steuerbar. Unsere
**Einkäufe** aber — fal, Replicate, Supabase, RevenueCat, alle in den USA —
sind Leistungen aus dem Ausland, für die **wir** als Empfänger die 19 %
deutsche Umsatzsteuer schulden (§ 13b UStG). Ein Regelbesteuerer zieht
sie in derselben Voranmeldung als Vorsteuer wieder ab (Nullsumme). Ein
Kleinunternehmer zahlt sie und darf nichts abziehen — 19 % Aufschlag auf
jede Modellrechnung. **Also: Regelbesteuerung, USt-IdNr. bei allen
Anbietern hinterlegen** (dann stellen sie ohne Steuer aus).

## 3. Buchhaltung ohne Steuerberater — was geht, was nicht

Eine UG braucht doppelte Buchführung, Jahresabschluss (Bilanz + GuV),
E-Bilanz ans Finanzamt, Körperschaft-, Gewerbe- und Umsatzsteuer-
Jahreserklärung und die Hinterlegung beim Unternehmensregister. Die
laufende Buchhaltung, Voranmeldungen und Zusammenfassende Meldung kann
Cloud-Software (lexoffice, sevdesk) mit Bankanbindung leisten — bei
unserem Volumen (eine Apple-Gutschrift, eine Handvoll Anbieterrechnungen
im Monat) ist das wenig Arbeit. **Der Jahresabschluss einer
Kapitalgesellschaft ist der Teil, an dem die meisten doch einen
Steuerberater nehmen** — nur dafür, einmal im Jahr, typischerweise
800–1.500 € statt 3.000 €. Empfehlung: laufend selbst, Abschluss kaufen;
mindestens das erste Jahr.

## 4. Die Gründerrechnung: 2 × 5.000 € netto im Monat

**Der Weg ist das Geschäftsführergehalt, nicht die Ausschüttung.**
Gehalt ist Betriebsausgabe (mindert den Gewinn der UG); die Ausschüttung
wird dreifach beschnitten: ~30 % Körperschaft- und Gewerbesteuer, dann
25 % Pflichtrücklage der UG (§ 5a GmbHG, bis 25.000 € Stammkapital
erreicht sind), dann 26,375 % Abgeltungsteuer — von 100 € Gewinn kommen
**~39 €** an; über Gehalt **~58 €**.

Annahmen: zwei Gesellschafter-Geschäftsführer zu je 50 % (ohne
Stichentscheid-Klausel → sozialversicherungsfrei), Steuerklasse I,
kinderlos, keine Kirchensteuer, freiwillig gesetzlich krankenversichert
zum Höchstbeitrag (2026: ≈1.261 €/Monat inkl. Pflege).

| je Gründer, monatlich | Betrag |
|---|---|
| Bruttogehalt | ≈ 8.700 € (≈ 104.000 €/Jahr) |
| Einkommensteuer + Soli (Tarif 2026) | ≈ −2.400 € |
| Kranken- und Pflegeversicherung | ≈ −1.260 € |
| **Netto** | **≈ 5.000 €** |

Kosten für die UG: keine Arbeitgeberbeiträge, also **≈ 17.400 €/Monat für
beide** (≈ 209.000 €/Jahr). Dazu Fixkosten der Firma: Apple Developer
(≈ 8 €), Supabase Pro (≈ 23 €), Server (≈ 20 €), Domain/Mail (≈ 5 €),
Versicherung (≈ 50 €), UG/IHK/Register (≈ 25 €), Buchhaltungssoftware
(≈ 25 €), Jahresabschluss (≈ 100 €) — **≈ 250 €/Monat**. Bedarf an
Deckungsbeitrag: **≈ 17.700 €/Monat.**

**Was von 1 € Nutzerpreis bei uns ankommt** (Deutschland, Kauf im App Store):

| Schritt | bleibt |
|---|---|
| 19 % Umsatzsteuer (Apple führt ab) | 0,840 € |
| 15 % Apple-Provision | 0,714 € |
| 1 % RevenueCat | 0,704 € |
| Modellkosten ≈ 30 % des Erlöses (Annahme; heute 13–36 % je nach Mix) | **0,49 €** |

**Benötigter Nutzerumsatz: ≈ 36.000 €/Monat brutto.**

| Abo-Preis | zahlende Nutzer nötig |
|---|---|
| 4,99 €/Monat | ≈ 7.200 |
| 9,99 €/Monat | ≈ 3.600 |
| 14,99 €/Monat | ≈ 2.400 |
| 19,99 €/Monat | ≈ 1.800 |

Umgekehrt: bei 1.000 zahlenden Nutzern müsste jeder ≈ 36 €/Monat zahlen,
bei 2.000 ≈ 18 €, bei 5.000 ≈ 7,20 €.

**Hebel, die die Rechnung verschieben:**
- Modellkosten auf 15 % drücken (Seedance über Replicate, Lite-Bilder):
  → ≈ 30.000 €/Monat, ≈ 3.000 Nutzer bei 9,99 €.
- Web-Funnel mit Stripe (3–4 % statt 15 %): ≈ 0,57 € statt 0,49 € je Euro
  → ≈ 31.000 €/Monat.
- Beides zusammen: ≈ 25.000 €/Monat, ≈ 2.500 Nutzer bei 9,99 €.
- Halbes Ziel (2 × 2.500 € netto): Bruttogehalt ≈ 4.100 € je Gründer
  (Steuer fällt progressiv), Bedarf ≈ 9.000 €/Monat, ≈ 1.850 Nutzer bei
  9,99 €.

## Was der Steuerberater bestätigen muss

Gewerbesteuer-Hebesatz der Gemeinde · Verzicht auf § 19 im Fragebogen ·
ob die Apple-Abrechnung als Gutschrift reicht oder ein eigener Beleg je
Auszahlung nötig ist · Fremdüblichkeit der Geschäftsführergehälter und
eines KV-Zuschusses durch die UG · Sozialversicherungsstatus (Statusfest-
stellung bei der DRV beantragen, 50/50 ohne Stichentscheid) · ob monatliche
oder vierteljährliche Voranmeldung gilt.

Quellen (11.09.2026): eKiwi-Blog, belegfuchs, fischer/collegen und Duden
& Partner zu App-Store-Erlösen und Reverse Charge (IE9700053D); IHK
Stuttgart, nwb, Taxfix zu § 19 UStG 2026; betriebsbuddy, Bösel Steuer-
berater zur § 13b-Falle für Kleinunternehmer; Flick Gocke Schaumburg, REB,
IHK Köln zum 50-%-Geschäftsführer; DieStrategieMakler und Knispel zu
GKV-Höchstbeitrag 2026 (BBG 69.750 €); Apple Newsroom 18.08.2026 und
9to5Mac zu den EU-Provisionen ab 01.10.2026; Apple Small Business Program;
RevenueCat-Preisseite (costbench, metacto); Schürmann Steuerberatung und
BMF zum Tarif 2026 (Grundfreibetrag 12.348 €, 42 % ab 69.879 €);
steuerschroeder/sevdesk zur UG-Gesamtsteuerlast ≈ 30 %.
