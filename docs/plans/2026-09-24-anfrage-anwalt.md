# Anfrage an eine Rechtsanwältin / einen Rechtsanwalt — Dream Rushes

> Vorbereitet 24.09.2026, Hanni + Claude. **Entwurf** — Hanni schickt ab.
> Teil 1 ist die Anfrage zum Kopieren, Teil 2 die Übersicht, die man
> mitschicken kann. Quelle aller Fakten: der Code-Stand vom 24.09. (Dateien
> in Klammern, für uns, nicht für die Kanzlei).
> Plan: `docs/plans/2026-09-23-app-store-pruefung.md`, Entscheidung 4, N4.

---

## Teil 1 — Anschreiben (zum Kopieren)

**Betreff:** Anfrage: Datenschutzerklärung, Nutzungsbedingungen und
Markenfrage für eine KI-App (Traumtagebuch) vor App-Store-Start

Sehr geehrte Damen und Herren,

wir entwickeln zu zweit eine iPhone-App, „Dream Rushes": ein privates
Traumtagebuch. Nutzerinnen und Nutzer erzählen ihren Traum per Sprache
oder Text; die App kann daraus mithilfe externer KI-Dienste einen kurzen
Film erzeugen. Auf Wunsch spielen darin reale Personen mit, von denen die
Nutzer ein Foto hochladen — sie selbst oder Menschen aus ihrem Umfeld.

Wir bereiten die Einreichung im Apple App Store vor und gründen dafür eine
UG (haftungsbeschränkt). Verkauf ist erst nach der Gründung geplant;
bezahlt wird ausschließlich über Apple (In-App-Käufe: Credit-Pakete und ein
Abo), Apple ist dabei Händler (Merchant of Record).

Wir suchen Unterstützung bei:

1. **Datenschutzerklärung** (App und Webseite) und **Einwilligungstexte** —
   besonders zu Fotos Dritter (biometrische Daten, Art. 9 DSGVO),
   Sprachaufnahmen und der Übermittlung an KI-Dienste in Drittländern
   (USA, China).
2. **Nutzungsbedingungen** — digitale Inhalte, Credits und Abo über Apple,
   Widerrufsrecht, Haftung für KI-erzeugte Inhalte, Altersgrenze 18+.
3. **Impressum** und Anbieterkennzeichnung (Webseite, App Store,
   EU-DSA-Händlerangaben).
4. **KI-Kennzeichnung** (EU AI Act, Transparenzpflichten für erzeugte
   Bilder/Videos mit realen Personen).
5. **Markenfrage**: Unsere Recherche zeigt eine eingetragene EU-Marke
   „RUSHES" (Klassen 35, 40, 41, 42, seit 2015) und eine französische
   „Rushes" (Klasse 9, seit 2025). Besteht Verwechslungsgefahr mit
   „Dream Rushes"? Sollten wir „Dream Rushes" selbst anmelden (DPMA oder
   EUIPO, welche Klassen), und vor oder nach der UG-Gründung?

Unsere bisherigen Texte (in der App, auf Deutsch und Englisch) und eine
Übersicht, welche Daten wohin gehen, schicken wir gern mit. Wir haben
bewusst versucht, alles in verständlicher Sprache ehrlich zu beschreiben —
die fachliche Prüfung fehlt.

Könnten Sie uns sagen, ob Sie das übernehmen, was Sie dafür benötigen und
mit welchem Aufwand bzw. welchen Kosten wir rechnen müssen?

Mit freundlichen Grüßen
Hanna Martens

---

## Teil 2 — Übersicht zum Mitschicken: Welche Daten gehen wohin?

### Die App in drei Sätzen
Private Traumtagebuch-App für iPhone (Android später). Ohne Konto nutzbar;
das Tagebuch liegt auf dem Gerät. Filme entstehen auf Wunsch über externe
KI-Dienste und kosten Credits.

### Verantwortlich
Bis zur UG-Gründung: Hanna Martens (Apple-Entwicklerkonto als
Einzelperson). Danach: die UG. **Offen:** Anschrift/Impressum, ggf.
Datenschutzbeauftragter nötig?

### Datenarten
| Daten | Woher | Besonderheit |
|---|---|---|
| Traumtexte | Nutzer (getippt oder gesprochen) | sehr persönlich (Träume, Gesundheit, Sexualität möglich) |
| Sprachaufnahmen | Mikrofon | Stimme |
| Fotos | Nutzer lädt hoch — **eigenes Foto und Fotos Dritter** | Gesichter, biometrisch nutzbar; je Foto eine Bestätigung „ich darf dieses Foto verwenden" |
| Erzeugte Bilder/Filme | KI-Dienste | zeigen ggf. reale Personen, als KI gekennzeichnet |
| Konto (optional) | E-Mail + Passwort **oder** „Mit Apple anmelden" | bei Apple ggf. anonyme Weiterleitungsadresse |
| Profil (optional, mit Konto) | Name/Spitzname, Sprache, Stimme der Assistentin, Fragebogen (Schlafdauer, Traumerinnerung, Luzides Träumen, Ziele) | Fragebogen berührt Schlaf/Gesundheit |
| Sicherungskopie der Träume (mit Konto) | Text + Verweise auf Filme/Aufnahmen, **nie Fotos** | seit 23.09.2026 |
| Guthaben/Käufe | Apple In-App-Kauf → unser Ledger | Apple ist Händler |

### Empfänger
| Empfänger | Wofür | Daten | Sitz / Ort der Verarbeitung |
|---|---|---|---|
| **fal.ai** | Bilder/Filme erzeugen; Foto-Prüfung auf anstößige Inhalte | Traumtext (Szenen), Fotos | USA |
| **MiniMax (Hailuo)** / **ByteDance (Seedance)** — über fal.ai | Film rendern | Bilder, Szenentext | China / weitere Drittländer |
| **Google (Gemini)** | Sprachgespräch, Bilderzeugung | Stimme, Text, Fotos | USA |
| **DeepSeek** | Text analysieren, Anweisungen formulieren | Traumtext | China |
| **Supabase** | Konten, Sicherung der Träume, Guthaben-Buch | E-Mail/Apple-ID, Profil, Träume (Text) | Region Frankfurt (EU) |
| **Apple** | „Mit Apple anmelden", In-App-Käufe, Mitteilungen | Apple-Kennung, Kaufbelege | USA / EU |
| **Eigener Server** (Hosting noch offen, geplant EU) | vermittelt alle Aufrufe, speichert erzeugte Bilder/Filme und Sprachaufnahmen | alles oben | geplant EU |

Training: Googles und DeepSeeks bezahlte APIs nutzen Inhalte laut Anbieter
nicht bzw. standardmäßig nicht zum Training; fal.ai kann anonymisierte
Nutzungsdaten verwenden. (So steht es heute in unserer Einwilligung —
Stand der Anbieter-Bedingungen bitte mitprüfen.)

### Einwilligung heute
Vor dem ersten Traum ein Tor mit drei eigenen Häkchen (keins vorbelegt):
Nutzungsbedingungen/Datenschutz gelesen · Übermittlung an die namentlich
genannten KI-Dienste · „Ich bin 18 oder älter". Widerruf jederzeit in den
Einstellungen; danach verlässt nichts mehr das Gerät. Je hochgeladenem
Foto eine eigene Bestätigung.

### Löschen
Konto löschen in der App (Konto, Profil, Sicherung der Träume, Guthaben-Buch
werden entfernt; bei „Mit Apple anmelden" werden die Apple-Token widerrufen).
**Offen:** Erzeugte Filme/Bilder und Sprachaufnahmen bleiben bisher auf dem
Server liegen — Löschweg ist in Arbeit.

### Was wir wissen, dass es fehlt oder falsch war
- Die bisherigen Texte nennen Supabase, Apple und das Hosting nicht, und
  „Verantwortlicher" ist nur „Dream Rushes", keine Person/Firma.
- In der App steht sichtbar: „Vor dem Start prüft ein Anwalt diese Texte."
- Automatisches Löschen alter Renderings ist angekündigt, aber noch nicht
  gebaut.

---

## Teil 3 — Für uns: was vorher noch passieren sollte

- [ ] Kanzlei aussuchen: IT-/Datenschutzrecht, idealerweise Erfahrung mit
      Apps und KI. Mehrere anfragen, Angebote vergleichen.
- [ ] Die Texte aus der App als Datei beilegen (en/de: Einwilligung,
      Datenschutz, Nutzungsbedingungen) — Export aus `src/i18n/{de,en}.js`
      (`consent`, `legal.privacy`, `legal.terms`); auf Wunsch baue ich ein
      lesbares PDF.
- [ ] Markenrecherche beilegen: `docs/plans/2026-09-24-markenpruefung.md`.
- [ ] Mit Anton klären: Wer tritt auf, wer zahlt, bis die UG steht?
