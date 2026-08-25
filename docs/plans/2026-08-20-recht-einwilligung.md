# Recht & Einwilligung — was die App den Menschen abverlangen muss, bevor sie rendert

**Stand:** 2026-08-20 · Anlass: Antons Frage („müssen die User nicht irgendwas
akzeptieren … damit wir weltweit und in der EU sicher sind?")
**Status: ANALYSE + BAUPLAN. Nichts umgesetzt.**

⚠ **Das hier ist juristische Recherche, kein Rechtsrat.** Vor dem
Store-Launch gehören AGB, Datenschutzerklärung und die Einwilligungstexte
einmal zu einem Anwalt (IT-/Datenschutzrecht). Dieses Dokument sorgt dafür,
dass der Anwalt REDIGIERT statt bei null anzufangen — und dass die App die
richtigen Stellen dafür schon hat.

## 1. Antons Kernfrage zuerst: „Rechte abtreten"?

**Nein — niemand muss Rechte abtreten, und wir sollten es auch nicht
verlangen.** Was wir brauchen, ist eine **Lizenz**: Der Mensch behält alle
Rechte an seinen Fotos und Träumen und räumt uns das ein, was der Dienst
technisch braucht — Verarbeitung, Übermittlung an die benannten
KI-Anbieter, Zwischenspeicherung, Erzeugung abgeleiteter Bilder/Filme für
IHN. Eine Rechteabtretung („wir dürfen deine Fotos für alles nutzen")
wäre in der EU AGB-rechtlich angreifbar (überraschende Klausel), würde
im App Store schlecht aussehen und ist für unser Geschäft schlicht nicht
nötig. FaceApp hat mit genau so einer Klausel 2019 einen PR-Schaden
kassiert.

Für die ERZEUGTEN Bilder/Filme gilt umgekehrt: Rechte daran, soweit sie
bestehen, gehören dem Nutzer (fal und Google räumen die Ausgaben dem
Kunden ein; wir reichen das durch). Ehrlicher Zusatz in den AGB: Rein
KI-erzeugte Werke genießen in den meisten Rechtsordnungen keinen
Urheberrechtsschutz — versprechen dürfen wir „deins", nicht „exklusiv
schützbar".

## 2. Die vier Baustellen

### a) Vertragsschicht — AGB/EULA mit Klick-Zustimmung (Clickwrap)

Ein Zustimmungs-Screen beim ersten Start, VOR dem ersten Upload:
„Ich akzeptiere die Nutzungsbedingungen und habe die
Datenschutzerklärung zur Kenntnis genommen" — ein Häkchen, das der
Mensch selbst setzt (kein vorangekreuztes). Inhalt der AGB u. a.:
Lizenz (§1), Verbotenes (keine fremden Fotos ohne Erlaubnis, keine
Kinderbilder außer eigener Sorgeberechtigung, nichts Rechtswidriges,
keine Personen des öffentlichen Lebens für Täuschung), Credits/Preise,
Verfügbarkeit, Haftungsrahmen, 16+.

### b) DSGVO-Schicht — Einwilligung, Erklärung, Verträge

- **Rechtsgrundlage:** Für das Verarbeiten hochgeladener Gesichtsfotos
  durch Dritt-APIs ist die **ausdrückliche Einwilligung** (Art. 6/7,
  vorsichtshalber am Maßstab von Art. 9 formuliert) der sichere Weg —
  als EIGENES Häkchen neben den AGB: „Meine Fotos und Traumtexte dürfen
  zur Bild-/Filmerzeugung an die in der Datenschutzerklärung benannten
  Anbieter übermittelt werden." Widerruflich; Widerruf = Funktion aus.
- **Traumtexte sind heikler als Fotos:** Träume können Gesundheit,
  Sexualität, Religion enthalten — Art.-9-Kategorien. Das gehört
  ausdrücklich in Einwilligung und Erklärung („Inhalte deiner Träume
  können sensible Angaben enthalten; lade nur, was du teilen willst").
- **Auftragsverarbeitung (AVV/DPA)** mit fal.ai und Google abschließen
  (beide bieten Standard-DPAs mit SCCs; Häkchen im jeweiligen Konto).
- **Datenschutzerklärung** hosten (Webseite + App-Link): wer, was, wohin,
  wie lange, Rechte. Die ehrlichen UI-Zeilen, die es schon gibt
  (avatarDialog.privacy, dream.privacy), bleiben — sie sind die
  Kurzfassung am Ort der Handlung, nicht der Ersatz.
- **Speicherfristen:** Der Server behält /media heute UNBEGRENZT —
  hochgeladene Fotos (Lenas Foto liegt dort), gerenderte Bilder, Filme.
  Es braucht eine Regel (z. B. Uploads nach Render löschen oder nach N
  Tagen; Journal bleibt ohnehin auf dem Gerät) und einen Löschweg auf
  Anfrage.

### c) 🔴 Die China-Rotflagge: DeepSeek

Traumtexte gehen an die DeepSeek-API — **Serverstandort China, kein
Angemessenheitsbeschluss der EU**; die italienische Garante hat die
DeepSeek-App 2025 gesperrt. Sensible Traumtexte nach China zu senden ist
die angreifbarste Stelle des ganzen Aufbaus. Optionen, vor Launch zu
entscheiden:
1. DeepSeek durch EU/US-gehostetes Modell ersetzen (offene
   DeepSeek-Gewichte laufen bei US/EU-Hostern; fal/Together/Azure) —
   sauberste Lösung, ein Slug-Wechsel im Server.
2. Mindestens: Pseudonymisierung prüfen (keine Namen nötig?) — schwach,
   Träume bleiben Inhaltsdaten.
Bis zur Entscheidung bleibt die ehrliche Nennung in der UI (steht schon
drin) — aber Nennung ersetzt keine Rechtsgrundlage für den Transfer.

### d) EU-AI-Act — gilt seit dem 2. August 2026, also JETZT

Art. 50 (Transparenz) ist seit 02.08.2026 anwendbar, die finalen
Leitlinien der Kommission kamen am 20.07.2026. Für uns heißt das:
- **Deepfake-Kennzeichnung:** Filme/Bilder, die echte Personen zeigen
  (genau unser Kernfeature — Lena im Riesenrad), müssen als
  KI-generiert offengelegt werden — **auch ohne Täuschungsabsicht**.
- **Maschinenlesbare Markierung** der Ausgaben (Metadaten/C2PA):
  primär Pflicht der Modellanbieter (fal/Google) — prüfen, ob deren
  Ausgaben markiert sind, und unsere Nachbearbeitung (Panels schneiden,
  Outro anhängen via ffmpeg) darf die Marke nicht zerstören.
- Praktisch für uns: Der Film-Abspann („dreamed with …", existiert
  seit Aufgabe 16) wird zur KI-Kennzeichnung ausgebaut; Bilder bekommen
  beim TEILEN einen Hinweis (Share-Text), Metadaten-Erhalt wird geprüft.
  Bußgeldrahmen bis 15 Mio. € / 3 % — das ist keine Kür.

## 3. Fremde Gesichter — das Lena-Problem, juristisch

Der Nutzer lädt Fotos DRITTER hoch (Lena kann uns nichts einwilligen).
Vollständig lösen kann das keine App der Welt; der Standard ist:
- **Zusicherung beim Upload** (im AvatarDialog, wo heute schon die
  privacy-Zeile steht): „Lade nur Fotos hoch, die du selbst nutzen
  darfst — bei anderen Personen brauchst du deren Erlaubnis." Bei
  Kategorie „Person" ein kurzes bestätigendes Element, nicht nur Text.
- **AGB-Klausel** (Verantwortung des Uploaders, Freistellung) und ein
  **Melde-/Löschweg** für Betroffene (E-Mail-Adresse reicht anfangs;
  Apple verlangt für UGC-Apps ohnehin Melden/Blocken, Richtlinie 1.2).
- In Deutschland konkret: §§ 22, 23 KUG (Recht am eigenen Bild) — die
  Erlaubnis der abgebildeten Person ist Sache des Nutzers, aber wir
  müssen zumutbare Vorkehrungen zeigen (Hinweis, Meldeweg, Löschung).

## 4. Was konkret in die App gehört (Reihenfolge = Priorität)

1. **Consent-Gate im Onboarding** (ein Screen, zwei eigene Häkchen:
   AGB/Datenschutz · Foto-/Traumtext-Einwilligung) + 16+-Zeile.
   Gespeichert mit Zeitstempel + Versionsnummer der Texte
   (Nachweispflicht Art. 7). Texte ändern sich → Screen kommt wieder.
2. **Upload-Zusicherung im AvatarDialog** (Personen/Tiere): die
   bestehende privacy-Zeile wird zur aktiven Bestätigung beim ERSTEN
   Personen-Upload (einmal, nicht bei jedem Foto — Reibung dosieren).
3. **KI-Kennzeichnung:** Abspann-Karte als Pflichtteil des Films
   (statt optionaler Nettigkeit), „AI-generated" im Share-Text; prüfen,
   ob fal/Google C2PA/SynthID-Marken liefern und ob ffmpeg/Canvas sie
   überleben.
4. **Speicherfrist im Server** (Uploads nach Render löschen, Renders
   nach N Tagen ohne Abruf) + Kontakt-/Löschweg in der Erklärung.
5. **DeepSeek-Entscheidung** (2c) — vor Launch.
6. **Dokumente:** AGB + Datenschutzerklärung als Markdown im Repo
   (docs/legal/), gerendert in der App unter Profil → About; dann
   anwaltlich redigieren lassen.

## 5. Was NICHT gebraucht wird

- Keine Rechteabtretung (§1). Keine Konten-Pflicht nur fürs Recht —
  Einwilligung geht auch gerätelokal mit Zeitstempel. Keine
  Consent-Banner-Orgie: Die App hat keine Tracking-Cookies; wenn das so
  bleibt, bleibt auch die Erklärung kurz.

## 6. Nachtrag 20.08. abends — Antons drei Nachfragen, recherchiert

### a) Trainieren die Anbieter mit unseren Daten?

| Anbieter | Trainingslage (recherchiert 20.08.) |
|---|---|
| **Google** (Gemini API, bezahlt) | Trainiert NICHT mit Prompts/Antworten; im EWR gelten die Bezahlbedingungen sogar für die Gratis-Stufe. Beste Lage. |
| **DeepSeek** (bezahlte API) | Seit der Richtlinien-Aktualisierung 03/2026 standardmäßig KEIN Training mit API-Daten; „de-identifizierte" Nutzung zur Dienstverbesserung bleibt möglich, Opt-out-Rechte je nach Region. China-Transfer bleibt das größere Problem (§2c). |
| **fal.ai** (Standard-API) | Grauzone: Kunde behält Rechte am Input, aber fal darf „Usage Data" — anonymisiert/aggregiert, auch AUS Kundeninput abgeleitet — zur Entwicklung eigener Produkte und KI-Modelle nutzen. Ein ausdrückliches „wir trainieren nicht auf euren Inhalten" gibt es nur für Enterprise-Verträge. |

Konsequenz: Die Trainingslage steht jetzt WÖRTLICH im Aufklapp-Teil des
Consent-Gates (t.consent.details) — kein Kleingedrucktes. Bei Wachstum:
fal auf einen Enterprise-/DPA-Vertrag mit No-Training-Zusage heben, oder
die Direktanbieter-Schwellen aus 2026-08-20-direktanbieter-preise.md §5
ziehen (Google direkt trainiert nicht).

### b) 16+ oder 18+? → 18+, selbst erklärt

Die 16 aus der Erstfassung war das DSGVO-Einwilligungsalter (Art. 8,
Deutschland: 16). Antons Entscheidung: **18+** — einfacher und strenger.
Umsetzung nach Branchenstandard (FaceApp, Lensa, Remini machen es genauso):
**Selbsterklärung als eigenes Häkchen** im Consent-Gate plus die
**Alterseinstufung im App Store** (Apple gated darüber die Apple-ID).
Eine echte Altersverifikation (Ausweis) ist für diese App-Kategorie
unverhältnismäßig und macht niemand Vergleichbares.

### c) Muss ein PRIVATER Nutzer seinen Traum auf Instagram kennzeichnen?

Antons Instinkt stimmt weitgehend: Der AI-Act nimmt natürliche Personen
bei „rein persönlicher, nicht beruflicher Tätigkeit" aus (Art. 2), und
für offensichtlich künstlerisch-kreative Inhalte ist die Offenlegung
abgeschwächt. **Die Kennzeichnungspflicht aus §2d trifft UNS als
Anbieter/Betreiber, nicht den privaten Endnutzer.** ABER: Instagram/Meta
verlangt plattformseitig die Kennzeichnung realistischer KI-Inhalte —
und erkennt eingebettete Herkunfts-Metadaten (C2PA) automatisch. Genau
deshalb ist unsere maschinenlesbare Markierung der elegante Weg: Trägt
unser Export die Marke, kennzeichnet Instagram von selbst, und der
Nutzer muss gar nichts wissen oder tun. Der Satz dazu steht im
Consent-Gate („wird beim Teilen so gekennzeichnet") — einlösen müssen
wir ihn über Punkt 3 der Baull-Liste (§4).

### d) Stand der Umsetzung

**Punkt 1 der Liste aus §4 ist seit 20.08. GEBAUT:** ConsentGate.jsx
nach der Sprachwahl, vor Onboarding UND App (auch das Stimm-Interview
sendet Daten), drei eigene Häkchen, nichts vorangekreuzt, Aufklapp-Teil
mit Anbieter- und Trainingslage, gespeichert als state.consent
{v, at} (consent.js, CONSENT_VERSION öffnet das Tor bei Textänderungen
erneut). Offen aus der Liste: 2 (Upload-Zusicherung), 3 (Kennzeichnung),
4 (Speicherfristen), 5 (DeepSeek), 6 (Dokumente + Anwalt) — dazu ein
Widerrufsweg im Profil (Art. 7: Widerruf so leicht wie Erteilung).

## 7. Quellen (20.08.2026)

- AI-Act Art. 50 anwendbar seit 02.08.2026, finale Leitlinien 20.07.2026,
  Deepfake-Label auch ohne Täuschungsabsicht, bis 15 Mio. €/3 %:
  EU-Kommission (digital-strategy.ec.europa.eu, Guidelines on
  transparency obligations) · artificialintelligenceact.eu/transparency-
  rules-article-50 · gtlaw.com (Insights 6/2026) · hard2bit.com ·
  bratby.law
- DSGVO-Grundlagen (Art. 6/7/9, Kap. V Drittlandtransfer), KUG §§ 22/23:
  Gesetzestexte; Garante-Sperre DeepSeek 01/2025: allgemein berichtete
  Aufsichtspraxis.
- Apple App Review 1.2 (UGC: Melden/Blocken), 5.1.1 (Einwilligung):
  developer.apple.com/app-store/review/guidelines.

## 8. Nachtrag 25.08. — Prominente im Traum

Anlass: Der Clooney-Lauf vom 25.08. hat einen **erkennbaren echten
Menschen** erzeugt. Bis dahin behandelte dieses Dokument fremde Gesichter
nur als Lena-Problem (§3) — Privatpersonen, deren Foto jemand hochlädt.
Prominente kamen in einem halben Nebensatz vor: „keine Personen des
öffentlichen Lebens für Täuschung" (§2a). **Dieser Halbsatz ist zu eng.**
Der Clooney-Lauf war keine Täuschung, sondern ein Traum.

### a) Antons Frage: Reicht eine AGB-Klausel?

Wörtlich: „Müssten wir uns explizit abgrenzen und in den AGB vereinbaren,
dass alles, was der User generiert, auf seine eigene Verantwortung geht?"

**Nein — jedenfalls nicht als Dach.** Es sind drei Parteien, nicht zwei:
Die AGB regeln die Linie zwischen uns und dem Nutzer. Der Abgebildete hat
nie etwas unterschrieben, und ihn bindet eine Vereinbarung, an der er
nicht beteiligt war, nicht. Er verklagt den Greifbaren mit dem Konto.

⚠ Dazu kommt: **Genau die Freistellungsklausel, die man sich hier wünscht,
ist gegenüber Verbrauchern die angreifbarste von allen.** „Der Nutzer
stellt uns von sämtlichen Ansprüchen frei" wird in deutschen AGB gegenüber
Privatkunden regelmäßig als unangemessene Benachteiligung kassiert
(§ 307 BGB). Sie gehört trotzdem hinein — sie hilft bei grobem Missbrauch.
Sie ist ein Netz, kein Dach.

### b) ⚠ Richtigstellung: Apple sperrt uns dafür NICHT

Am 25.08. stand hier zwischenzeitlich, App-Review sei ein
Veröffentlichungs-Blocker. **Das war überzogen, und Antons Einwand war
richtig:** Apple wirft keine App raus, die auch Personen erzeugen kann —
sonst wäre kein einziges Bildwerkzeug im Store. Rausgeworfen wird, wer
**damit wirbt**: Face-Swap-, Deepfake- und „Nudify"-Apps, die Prominente
im Namen, im Screenshot oder in der Beschreibung führen.

Für uns gilt also weiterhin nur Richtlinie 1.2 aus §3: Meldeweg,
Sperrmöglichkeit, veröffentlichter Kontakt. Bauaufgabe, kein Blocker.

Die Stelle steht hier, weil sie die Entscheidung in c) und d) getragen
hätte, wäre sie unwidersprochen geblieben.

### c) Warum die Klage nicht an fal oder OpenAI weitergereicht wird

Antons zweite Frage: „Wie kann es sein, dass OpenAI rechtlich sicher ist
und wir, die ihre Tools verwenden, auf einmal Probleme haben?"

**Die sind nicht sicher.** Getty gegen Stability, die Künstler-Sammel-
klagen, die NYT gegen OpenAI — und als Sora 2 im Oktober 2025 ungefragt
Schauspieler nachbaute, standen SAG-AFTRA und Bryan Cranston auf der
Matte; OpenAI hat binnen Tagen Zustimmungspflichten für Abbilder
eingebaut. Sie tragen dieses Risiko täglich.

**Genau deshalb filtern sie.** Der Ablehnungsfilter, gegen den Antons
Freddy-Krüger-Traum lief, ist kein Schikane-Mechanismus, sondern OpenAIs
eigener Selbstschutz — und solange wir ihn laufen lassen, schützt er uns
gratis mit.

**Nach oben durchreichen geht trotzdem nicht**, und der Grund ist trocken
vertraglich: Ihre Bedingungen sagen sinngemäß „dir gehört die Ausgabe, du
bist dafür verantwortlich, und du stellst UNS frei". Die Risikoverteilung
läuft die Kette hinab, nicht hinauf. Freistellungen wie OpenAIs
„Copyright Shield" gibt es, aber sie decken **Urheberrecht, nicht
Persönlichkeitsrecht**, gelten für Geschäftskunden — und **entfallen,
sobald man die Schutzmechanismen umgeht**. Ob fal auf der
Selbstbedienungs-Stufe überhaupt etwas Vergleichbares bietet: vor Launch
nachlesen, Erwartung ist nein.

### d) ⚠ Die Linie, die wirklich zählt: durchgelassen ≠ umgangen

Zwischen **„der Filter hat es durchgelassen"** und **„wir haben etwas
gebaut, um am Filter vorbeizukommen"** liegt die ganze Verteidigung. Das
Erste ist ein Werkzeugfehler, den wir nicht zu vertreten haben. Das Zweite
ist unsere Entscheidung — und kippt zugleich jede Anbieter-Freistellung
und potenziell unser API-Konto.

**Damit wird der `unname`-Umschreiber (recovery.js, 24.08.) zur
Gretchenfrage**, denn er ist ein Werkzeug, das nach einer Ablehnung eine
Fassung baut, die durchgeht:

- Wird aus „George Clooney" *„ein distinguierter Mann Anfang sechzig mit
  grauem Haar"*, dann **entidentifiziert** er. Am Ende steht irgendein
  Mann. Das ist ein Filter auf UNSERER Seite — richtig so.
- Wird ein Name durch eine so genaue Beschreibung ersetzt, dass **wieder
  dieselbe Person** herauskommt, ist es eine Tarnkappe. Dann bauen wir
  genau das, was uns die Deckung kostet.

⚠ **Prüfkriterium, das noch nicht eingelöst ist:** Der echte Satz vom
24.08. — „Freddy Krüger" → „ein Mann mit verbranntem Gesicht, braunem Hut
und Klingenhandschuh" — sitzt **auf der Kippe**. Das ist noch erkennbar
die Figur. Wer am Umschreiber arbeitet, misst ihn hieran, nicht daran, ob
der Auftrag durchgeht.

### e) Die Entscheidung (Anton, 25.08.)

**Nichts sperren, nichts bewerben, nichts umgehen.**

- Kein Namensfilter am Eingang. Menschen träumen von Prominenten, das
  gehört dazu; und wir bewerben es an keiner Stelle.
- Der Anbieterfilter bleibt das Tor. Wir bauen keinen Weg daran vorbei.
- Der Umschreiber entidentifiziert, statt zu tarnen (siehe d).
- Privat bleibt die stärkste Verteidigung: § 22 KUG greift bei
  „Verbreiten oder öffentlich Zurschaustellen". Ein Tagebuch, das auf dem
  Telefon bleibt, verbreitet nichts. ⚠ **Das Risiko entsteht mit dem
  Teilen** — und der Share-Text steht in §4 Punkt 3 schon auf der Liste.
- Dazu unverändert: KI-Kennzeichnung (§2d), Meldeweg (§3),
  AGB-Klauseln mit dem Wissen aus a).

### f) Was der Anwalt zusätzlich vorgelegt bekommt

1. Die Klausel aus a) — mit der ausdrücklichen Frage, wie weit eine
   Freistellung gegenüber Verbrauchern überhaupt trägt.
2. Die Linie aus d), als Beschreibung dessen, was die App TUT — nicht als
   Behauptung, dass es genügt.
3. Die Frage, ob wir für erzeugte Bilder Hostinganbieter im Sinne des DDG
   sind oder eigene Inhalte verantworten. Wir sind kein neutraler
   Speicher: Wir erzeugen auf Zuruf, mit unserem Anbieterkonto. Das ist
   ungeklärt und gehört gefragt, nicht geraten.
4. Der Hinweis, dass die Rechtslage zu digitalen Abbildern seit 2024 in
   Bewegung ist (Tennessee, Kalifornien, mehrere EU-Staaten) — was heute
   reicht, ist vor Launch neu zu prüfen.
