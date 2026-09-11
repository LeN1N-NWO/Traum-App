# Rechtsform, Haftung, Versicherung — Recherche vom 11.09.2026

**Anlass:** Antons Frage: „Sollten wir eine Limited in England gründen oder
in Dubai, damit wir nicht mit unserem Vermögen haften?" Es geht um
Haftungsbegrenzung und Sicherheit, nicht um Steuern.
**Das ist eine Recherche mit Quellen, keine Rechts- oder Steuerberatung.**
Was ein Steuerberater und ein Anwalt klären müssen, steht am Ende.

**Fortsetzung:** Umsatzsteuer, Abrechnung über Apple und die Gründer-
rechnung (2 × 5.000 € netto) stehen in
[2026-09-11-umsatzsteuer-und-gruenderrechnung.md](2026-09-11-umsatzsteuer-und-gruenderrechnung.md).
Antons Entscheidung vom Abend: UG.

## Die Antwort in einem Satz

Weder UK Ltd noch Dubai bringen zwei Gründern, die in Deutschland wohnen
und die App von hier führen, einen Haftungsschutz — der übliche und
günstigste Weg ist die deutsche **UG (haftungsbeschränkt)**, später bei
Bedarf GmbH.

## Warum die Auslandswege nicht tragen

- **UK Ltd mit Leitung in Deutschland:** Seit dem Brexit gilt die
  Sitztheorie. Eine Ltd mit Verwaltungssitz hier wird als OHG/GbR (bzw.
  Einzelunternehmen) behandelt — **volle persönliche Haftung**. Der BGH
  hat das am 14.07.2026 bestätigt (II ZR 202/25): Gläubiger können den
  Titel gegen die Ltd direkt gegen den Gesellschafter vollstrecken. Dazu
  doppelte Buchführung (Companies House + deutsches Finanzamt). Berater
  raten Bestands-Ltds zur Umwandlung in eine GmbH; eine Neugründung für
  einen deutschen Zweck empfiehlt niemand.
- **Dubai/VAE Free Zone mit Leitung in Deutschland:** Ort der
  Geschäftsleitung (§ 10 AO) → in Deutschland unbeschränkt steuerpflichtig,
  dazu Hinzurechnungsbesteuerung (VAE 0–9 % liegt unter der 15-%-Grenze),
  kein DBA mehr seit 2022, Setup 3.000–7.000 €, laufend 1.500–3.000 € VAE
  plus deutsche Buchführung, und die Haftungsbegrenzung ist in Deutschland
  genauso unsicher wie bei der Ltd. Trägt erst mit echtem Wegzug und
  Geschäftsführer vor Ort — nicht unser Fall.

## Der Nullpunkt, den viele übersehen

Zwei Personen, die ohne Rechtsform gemeinsam eine App verkaufen, sind
automatisch eine **GbR mit gesamtschuldnerischer persönlicher Haftung
beider**. Das ist der heutige Zustand.

## Vergleich

| Form | Gründung | laufend p.a. | Haftung privat | geeignet |
|---|---|---|---|---|
| Einzelunternehmen / GbR | 20–60 € | 0–1.500 € | **ja, beide voll** | nein |
| **UG (haftungsbeschränkt)** | 350–700 € + Kapital ab 1 € (praktisch 1–5 T€) | 1.000–3.000 € (bis 5 T€ mit Steuerberater) | nein (außer GF-Pflichtverletzung, Bürgschaft) | **ja, Standardweg** |
| GmbH | 500–1.500 € + 25 T€ Kapital (12,5 T€ eingezahlt) | 1.500–5.000 € | nein | ja, wenn Kapital da; sonst später aus der UG |
| UK Ltd, Leitung DE | 50–200 € | 2.000–5.000 €+ doppelt | **ja** (BGH) | nein |
| VAE Free Zone, Leitung DE | 3.000–7.000 € | 3.500–8.000 €+ | unsicher | nein |

## Apple und der Verkäufer

- Ein Organisations-Konto verlangt einen **Rechtsträger** (UG/GmbH
  qualifiziert; Einzelunternehmen und GbR nicht) plus D-U-N-S-Nummer
  (kostenlos über Apples Lookup). Dann steht die Firma als Seller.
- Als Einzelperson steht der **Klarname** als Seller, und wegen der
  EU-DSA-Trader-Pflicht (seit 02/2025 werden Apps ohne Status entfernt)
  zusätzlich **Adresse und Telefonnummer öffentlich** auf der Produktseite
  in allen 27 EU-Ländern. Mit UG/GmbH erscheint die Firmenanschrift.
- Das ist die Frage, die Hanni mit Anton klärt („wer steht als Verkäufer")
  — und die Antwort heißt: die UG, nicht eine Person.

## Versicherung

- IT-Haftpflicht mit Vermögensschaden für kleine Softwareanbieter:
  grob **300–800 € im Jahr** (Hiscox ab ~15 €/Monat; „Ansprüche Dritter
  aus dem Bereitstellen von KI-Anwendungen automatisch mitversichert";
  exali mit KI-Baustein). Beim Angebot ausdrücklich nach generativen
  Videoinhalten und Persönlichkeitsrechten fragen — manche Versicherer
  schließen KI aus.
- Die realistischen Risiken einer KI-Video-App: Persönlichkeitsrechte
  (Lookalikes, Deepfakes — § 201b StGB ist im Gesetzgebungsverfahren),
  Urheberrecht, Jugendschutz, AI-Act-Kennzeichnung (Art. 50). AGB können
  Nutzer verpflichten und freistellen, gegenüber Verbrauchern aber nur
  begrenzt Haftung ausschließen. Dazu passt unser Recht-Plan
  (`2026-08-20-recht-einwilligung.md`).

## Was kleine App-Anbieter üblicherweise tun

Allein: Einzelunternehmen zum Testen. Sobald Geld von Fremden fließt und
Inhalte Dritter entstehen — genau unser Fall — UG. Steuerlich wird die
Kapitalgesellschaft ab etwa 60–100 T€ Jahresgewinn interessant; darunter
entscheidet allein die Haftungsfrage. Faustregel aus den Quellen: **Die
UG-Gründung gehört vor den ersten verkauften Credit, nicht danach.**

## Was Steuerberater und Anwalt klären müssen

UG oder GmbH konkret (Kapital, Vertrag für zwei Gesellschafter,
GF-Vergütung, Sozialversicherung) · Übertragung von Apple-, fal- und
Domain-Verträgen auf die Gesellschaft · Verbraucher-AGB (Haftung,
Freistellung, Widerruf bei digitalen Credits, Impressum, Datenschutz,
AI-Act) · Versicherungsangebot mit ausdrücklicher KI-Deckung ·
Umsatzsteuer bei Apple-Abrechnung (Reverse Charge) · Stand von § 201b
StGB und Art. 50 AI Act zum Launch.

Quellen (Auswahl): BGH II ZR 202/25 · bvm-law.de „Haftungsfalle LTD" ·
Handelskammer Hamburg (Brexit-Handlungsbedarf) · juhn.com (Dubai, AStG) ·
emiratessetup.de (Steuerfalle Dubai) · developer.apple.com (Enrollment,
D-U-N-S, DSA Trader) · hiscox.de, exali.de · onlinebilanz.de (UG-Kosten) ·
helgeklein.com (Softwarefirma gründen) · anwalt-kg.de (App entwickeln).
