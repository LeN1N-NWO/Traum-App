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

## 6. Quellen (20.08.2026)

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
