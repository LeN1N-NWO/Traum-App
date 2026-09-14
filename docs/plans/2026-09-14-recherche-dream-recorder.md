# Dream Recorder (Modem) — und ob Dream Rushes kooperieren kann

Stand: 14.09.2026. Nur Recherche, niemand wurde kontaktiert, nichts abgeschickt.
Methode: GitHub-API (Repo, Commits, Issues, PRs, Forks), Webseiten von Modem,
Presse, Hacker News, TMview und DPMAregister (Abfrage am 14.09.2026).
Markierungen: **Einschätzung** = eigene Bewertung; **UNGEPRÜFT** = nicht selbst bestätigt.
Keine Rechtsberatung.

---

## Kurzfazit

- **„Dream Recorder" ist keine Firma.** Es ist ein Open-Source-Bastelprojekt (MIT-Lizenz)
  des Amsterdamer Design-Studios **Modem Works B.V.**, erschienen Ende Juni 2025 unter dem
  Label „Modem Ventures". Man kann es nicht kaufen, nur selbst bauen (Raspberry Pi 5,
  Display, USB-Mikrofon, 3D-Druck-Gehäuse, rund 285 € Teile). Die Nutzer bezahlen OpenAI
  und Luma mit **eigenen API-Schlüsseln** (etwa 0,15 $ pro Traum).
- **Das Projekt ruht.** Letzter Commit auf `main` am 19.06.2025, letzte Antwort eines
  Maintainers am 28.06.2025. Kein einziger fremder Pull Request wurde je bearbeitet (6 offen,
  0 geschlossen). Luma hat inzwischen die API umgestellt und führt Ray2 als veraltet. Frisch
  gebaute Geräte erzeugen deshalb wahrscheinlich keine Filme mehr, ohne dass man den Code
  anpasst (**UNGEPRÜFT**, nicht getestet). Das Interesse ist trotzdem da: 1.618 Sterne,
  129 Forks, neue Forks bis August 2026 und 2026 erneut Presse (Dezeen, Hacker News).
- **Die Haltung passt in Kernpunkten nicht zu Dream Rushes.** Modem will ein Schlafzimmer
  ohne Handy und ohne Apps, unscharfe Lo-Fi-Bilder und verwischte Gesichter, merkt sich
  laut Konzept nur eine Woche und stellt sich gegen eine KI-Zukunft, die von Konzernen und
  Risikokapital geprägt ist. Dream Rushes ist eine App mit Abo, echten Gesichtern und
  langem Archiv.
- **Kooperation: ja, anfragen. Aber klein, mit einem Geschenk vorweg und ohne Pitch.**
  Am plausibelsten ist ein anbieterneutraler Open-Source-Fix plus Austausch, danach
  vielleicht gemeinsame Inhalte. Eine Cloud-Integration, eine Begleit-App oder ein
  Bausatz sind kurzfristig unrealistisch.
- **Den Code darf Dream Rushes ohnehin nutzen (MIT, Hinweis beibehalten), den Namen nicht.**
  In Deutschland ist „dreamrecorder" sogar als Wortmarke eines Dritten eingetragen,
  nicht von Modem. „Dream Rushes": keine Markentreffer.

---

## 1. Was ist Dream Recorder?

### Macher
| | |
|---|---|
| Firma | **Modem Works B.V.**, Laurierstraat 248-H, 1016 PT Amsterdam. Beschreibt sich als Mischung aus Thinktank und Design-Studio, gegründet 2021 und **mit festem Enddatum 2030** |
| Gründer | **Bas van de Poel** (früher Creative Director bei SPACE10, dem Forschungslabor von IKEA) und **Astin le Clercq** |
| Team | Laut le Clercq (Okt. 2025) fünf Generalisten plus ein loses Netz aus Fachleuten und Akademikern |
| Label | „Modem Ventures": Unterlabel für eigene Produkte, die als Open Source erscheinen (Terra 2024, Dream Recorder 2025) |
| Mitwirkende | **Mark Hinch** (Software und Hardware, Creative Technologist aus Amsterdam, Lead-Maintainer auf GitHub), **Ben Levinas und Joe Tsao** (Industriedesign), **Alexis Jamet** (Illustrationen) |
| Kunden von Modem | u. a. OpenAI, Google DeepMind, Teenage Engineering, Chanel, Nike, IKEA, Samsung, Rimowa |
| Launch | Repo angelegt am 17.03.2025. Presse ab 23.–30.06.2025. Etwa neun Monate Entwicklung (le Clercq) |

### Hardware (README, Stand Mai 2025, rund 285 €)
Raspberry Pi 5 (8 GB) mit Active Cooler, 64-GB-microSD, Waveshare-HDMI-Display 7,9"
(1280×400), USB-Mikrofon, **kapazitiver Touch-Sensor TTP223B** als einziger „Knopf",
USB-C-Netzteil (27 W), Flachband- und Winkelkabel, Nylon-Abstandshalter. Das zweiteilige
Gehäuse kommt aus dem 3D-Drucker (STL und G-Code liegen bei, transparentes PLA, wird nur
gesteckt). Laut Modem leuchtet die Hülle im Dunkeln. Löten ist nicht nötig. Ein Nutzer hat
im August 2025 neu gerechnet: etwa 300 € Teile plus ca. 60 € für den Druck (Issue #16).

### Software-Ablauf (aus Code und Diagrammen)
1. **Doppeltipp** startet die Aufnahme, **Einzeltipp** beendet sie. Das Audio wird per FFmpeg umgewandelt.
2. **OpenAI Whisper (`whisper-1`)** transkribiert. Das README spricht fälschlich von „text-to-speech", gemeint ist Speech-to-Text.
3. **`gpt-4o-mini`** macht aus dem Text einen einzigen Satz als Videoprompt. Der Systemprompt beschreibt die Rolle als Prompt-Engineer für Luma Dream Machine.
4. **Luma Dream Machine API, Modell `ray-flash-2`**: 540p, **21:9**, 5 Sekunden. Optional kann ein zweiter Teil angehängt werden. Das Gerät fragt den Status ab und lädt das Video herunter.
5. **FFmpeg-Filterkette** für den Traum-Look: Helligkeit, Vibrance, Entrauschen, bilateraler Weichzeichner, Körnung.
6. Wiedergabe als Schleife. Einzeltipp zeigt den letzten Traum, weitere Tipps die älteren, Doppeltipp führt zurück zur Uhr.

Technik: Raspberry Pi OS, Docker Compose, Python/Flask und Socket.IO, Chromium im
Kiosk-Modus, GPIO-Dienst über systemd, SQLite, alle Medien lokal. Verwaltet wird über die
Seite `http://dreamer:5000/dreams` im Heimnetz. Im Code ist **keine Anmeldung erkennbar**
(Socket.IO mit `cors_allowed_origins="*"`).

### KI-Dienste und Bezahlung
- **Jeder Nutzer bringt eigene API-Schlüssel mit.** Der Installer fragt die Schlüssel für OpenAI und Luma ab und speichert sie in `.env` auf dem Gerät. Vorgeschlagenes Startguthaben: etwa 5 $ bei OpenAI und 20 $ bei Luma.
- Kosten pro Traum (README, Mai 2025): OpenAI unter 0,01 $, Luma 0,14 $.
- Modem verdient daran nichts. Es gibt kein Abo und keine Cloud. Laut Fast Company hat Modem bewusst entschieden, das Gerät nicht zu verkaufen.

### Designhaltung (wichtig für jede Kooperation)
- Van de Poel bei Dezeen: „The bedroom should be a phone-free sanctuary". Das Gerät soll ohne Apps und Benachrichtigungen auskommen.
- Die niedrige Auflösung ist gewollt und soll zeigen, wie verschwommen man sich an Träume erinnert. Laut Fast Company **werden Gesichter verwischt**, damit niemand anders aussieht als in der Erinnerung. Außerdem soll das Gerät Träume nach höchstens einer Woche überschreiben; Modem spricht von sieben Speicherplätzen.
- **Konzept und Code weichen voneinander ab:** `VIDEO_HISTORY_LIMIT: 7` steht nur in den Konfigurationsdateien und wird im Code nirgends benutzt. Die Datenbank liest alle Träume ohne Limit, gelöscht wird nur von Hand (Code-Suche im Repo, `main`).
- Laut Dezeen dienten Jamets Illustrationen als Grundlage für den Stil. Im öffentlichen Code ist kein eigenes Training zu sehen, nur Luma plus FFmpeg-Filter.
- Le Clercq: Open Source soll den Zugang demokratisieren und eine Alternative zur KI-Vision von Konzernen und Risikokapital zeigen (sinngemäß, Dezeen).

---

## 2. Lizenz, Repository, Community, Kits, Presse

### Lizenz
- **MIT** (`LICENSE.md`, „Copyright 2025 Modem"). Sie gilt für das ganze Repo, also auch für STL- und G-Code-Dateien. **Eine eigene Hardware-Lizenz (etwa CERN-OHL) gibt es nicht.**
- MIT erlaubt Nutzung, Änderung und Verkauf, auch kommerziell. **Pflicht:** Copyright- und Lizenzhinweis müssen in allen Kopien und wesentlichen Teilen stehen bleiben.
- **Nicht abgedeckt:** Name und Logo „Dream Recorder". Ob das Bildmaterial im Repo (u. a. rund 1.100 Hintergrundbilder) und die Illustrationen von Alexis Jamet wirklich unter MIT stehen, ist **unklar** → vor jeder Nutzung fragen.
- Zum Vergleich: Modems älteres Projekt **Terra steht unter GPL-3.0** (Copyleft). Den Code nicht mit proprietärem Code mischen.

### Repository und Aktivität (GitHub-API, 14.09.2026)
| Kennzahl | Wert |
|---|---|
| URL | https://github.com/modem-works/dream-recorder |
| Sterne / Forks / Watcher | **1.618 / 129 / 26** |
| Commits auf `main` | 325, fast alle von Mark Hinch (plus Versions-Bot) |
| Letzter Commit `main` | **19.06.2025** |
| Branch `demo` | Commits 12.08.–14.10.2025 (Demo- und Kiosk-Modus, wohl für Ausstellungen; **UNGEPRÜFT**) |
| Version | Tag v0.47.0, keine GitHub-Releases |
| Issues | 15 offen, teils Spam. Neuestes echtes Issue #32 vom 14.02.2026 (Installer bricht ab) |
| Pull Requests | **6 offen, 0 geschlossen oder gemergt.** Neuester: #33 vom 29.07.2026 (Luma-API-Adresse geändert, `type: video` nötig) |
| Letzte Maintainer-Antwort | **28.06.2025** |
| Neue Forks | bis 21.08.2026 |
| Discussions / Wiki / Discord / Forum | keine |

**Wartungszustand:** Luma nennt Dream Machine und Ray2 inzwischen „deprecated". Aktuell ist
Ray3.2 (seit Juni 2026) über die neue „Luma Agents"-Plattform. Das Gerät nutzt noch `ray-flash-2`
und den alten Endpunkt → PR #33. Terra zeigt dasselbe Muster: letzter Push im März 2024.
**Einschätzung:** Modem veröffentlicht, pflegt danach aber kaum.

### Community und Bausätze
- **Keine offiziellen Bausätze** und kein Fertiggerät. Bei Etsy oder Tindie habe ich nichts gefunden (Suche, nicht vollständig).
- Eine kleine polnische 3D-Druckfirma berichtet von vielen Druckanfragen für das Gehäuse (PR #12). Nachfrage nach „fertig kaufen" gibt es also.
- Aktive Bastler schreiben in den Issues (Drucktipps für die Front, US-Einkaufsliste, Wake-Word- und Deepgram-Ideen, eine größere Erweiterung mit REST-Endpunkten in PR #23). Antworten von Modem gibt es darauf nicht mehr.

### Presse und Resonanz
| Datum | Medium | Kern |
|---|---|---|
| 23.06.2025 | Hacker News (1 Punkt, keine Diskussion) | Erster Post |
| 25.06.2025 | It's Nice That | Designprojekt, Lo-Fi-Ästhetik, Handy-freies Schlafzimmer |
| 30.06.2025 | **Dezeen** (21 Kommentare, nicht ladbar) | Zitate der Gründer, Open Source, Kunden, Enddatum 2030 |
| 22.07.2025 | Newsweek, NY Post (via Yahoo) | Rund 333 $ Teile in den USA. Nur für Menschen, die sich an Träume erinnern |
| 28.07.2025 | **Fast Company** (Mark Wilson) | Wird nicht verkauft. Gesichter verwischt, eine Woche Gedächtnis. Hinch: Das Video bildet den Traum nicht nach, fängt aber hoffentlich sein Gefühl ein (sinngemäß) |
| Ende 07/2025 | Hackster.io, The Hustle | Technik, etwa 1 bis 15 Cent pro Traum. The Hustle stellt es als Gegenentwurf zu kommerzieller KI dar (sinngemäß) |
| 16.08.2025 | designboom | Schreibt fälschlich, die Verarbeitung laufe lokal auf dem Gerät. Tatsächlich nutzt es Cloud-APIs |
| 24.02.2026 | **Hacker News** (23 Punkte, 13 Kommentare), Link auf dreamrecorder.ai | siehe unten |
| 25.04.2026 | **Dezeen**-Übersicht „Six open-source gadget designs" | Weiterhin als Bastelprojekt geführt |

Wired oder The Verge haben laut Suche nicht berichtet. Reddit war nicht abrufbar.
Social-Media-Posts behaupten teils Falsches (etwa EEG oder fMRI).

**Was gefällt:** das ruhige, fast skulpturale Objekt. Auf HN wird gelobt, dass die Seite zum
Selberbauen einlädt statt zum Kaufen. Außerdem Open Source, das Ritual am Morgen ohne Handy
und der liebevoll dokumentierte Nachbau.

**Was kritisiert wird (lehrreich auch für Dream Rushes):**
- Im Grunde sei es ein schickes Traumtagebuch, das keine Hirnaktivität aufnimmt (HN). Auf GitHub haben manche erwartet, dass wirklich der Traum aufgezeichnet wird. Einer schrieb, es habe sich anfangs fast unseriös angefühlt, weil nirgends erklärt war, wie es funktioniert (Issue #6).
- Der Weg vom Traum über Worte zur KI verliert Information, und die KI erfindet falsche Details dazu, also KI-Slop (HN).
- Unklar sei, für wen das gedacht ist. Und wer sein Traumgedächtnis trainiert, brauche kein Lo-Fi-Video (HN).
- Menschen ohne bildliche Vorstellung (Aphantasie) erleben Träume ganz anders (HN-Diskussion).
- Kosten und Aufwand: 285 bis 360 € plus API-Guthaben, Installer-Fehler, Druckprobleme.
- Datenschutz und Cloud-Abhängigkeit: Wunsch nach Offline-Betrieb (Issue #13).

---

## 3. Status 2026: kommerzielle Pläne, App, API?

- **Keine kommerzielle Version, keine App, keine Begleit-App, kein Cloud-Dienst und keine öffentliche API.** Angekündigte Pläne habe ich nicht gefunden.
- `dreamrecorder.ai` bettet nur Modems Landingpage ein. Dort gibt es nur einen Aufruf: das Gerät selbst bauen, mit Link zu GitHub.
- Aussagen zu **Partnerschaften oder Integrationen gibt es nicht.** Einzige Einladung: Die **Wunschliste im README** bittet um Beiträge für andere KI-Anbieter (Speech-to-Text und Prompt über Claude oder Gemini, **andere Videoanbieter**), lokale Einkaufslisten und eine nächtliche Bildschirmabschaltung.
- Modem allgemein: offen für Zusammenarbeit mit Menschen, deren Arbeit sie schätzen, laut Interview 2025 sogar mit Wettbewerbern. Wegen des Enddatums aber **sehr wählerisch** bei neuen Projekten (le Clercq, Okt. 2025, sinngemäß).
- Die lokalen HTTP- und Socket.IO-Endpunkte des Geräts sind intern und ohne Anmeldung, also keine Integrations-API.

---

## 4. Offizielle Kontaktwege (nur was Modem selbst auf Website und GitHub nennt)

| Kanal | Wofür |
|---|---|
| **office@modemworks.com** („General Inquiries", Website) | **Der richtige Weg für Kooperationsanfragen** |
| press@modemworks.com („Press Inquiries") | Nur Presse, nicht für Pitches |
| careers@modemworks.com | Passt nicht |
| Instagram **@modem.works** (von der Website verlinkt) | Zweiter Weg, eher für Nachfassen |
| Newsletter (Website) | Kein Kontaktweg |
| Post: Modem Works B.V., Laurierstraat 248-H, 1016 PT Amsterdam | |
| GitHub-Issues im Repo. Das README verweist auf Issues oder den Lead-Maintainer **@markhinch** | Technisches. Sein GitHub-Profil nennt Website und Kontaktadresse. Er ist aber ein Kollaborateur, **kein Entscheider** über Marke oder Kooperation. Issues sind öffentlich, dort **nicht pitchen** |

LinkedIn- und X-Profile von Modem gibt es laut Suche. Die Website verlinkt sie nicht, sie
sind hier deshalb nicht als offizieller Kanal aufgeführt. E-Mail-Adressen wurden nicht erraten.

---

## 5. Marke und Name (Schnellcheck, keine Rechtsberatung)

Abfrage in **TMview** (EU-Netz, deckt u. a. EUIPO, DPMA, BOIP, USPTO ab; laut TMview kein
amtliches Register) und im **DPMAregister**, beides am 14.09.2026:

| Suche | Ergebnis |
|---|---|
| „dream recorder" | 1 Treffer: USPTO „DREAM RECORDER", angemeldet 12/1999, Klasse 35, **erloschen** |
| „dreamrecorder" | **DPMA-Wortmarke 302025229148**, angemeldet 08.07.2025, eingetragen 24.09.2025, **Klassen 35, 41, 42**, Widerspruchsfrist am 26.01.2026 ohne Widerspruch abgelaufen, Schutz bis 08.07.2035. **Inhaber ist eine Privatperson aus Hamburg, nicht Modem.** Klasse 41 umfasst u. a. „Bereitstellen von nicht herunterladbaren Filmen". Klasse 9 (Software) fehlt |
| Marke von Modem für „Dream Recorder" | **keine gefunden** |
| „dream rushes" / „dreamrushes" | **0 Treffer** |
| „dream rush" | 11 Treffer, **keiner aktiv in EU, Deutschland oder USA** (aktiv nur China Kl. 35, Japan Kl. 28 seit 2025, Indien „RUSH EXCITEMENT DREAM" Kl. 41) |
| „dreamrush" | nur die erloschene US-Marke „ONEDREAMRUSH FILMS" (Kl. 41, 2008) |

**Einschätzung:**
- Zwischen Dream Rushes und Dream Recorder sehe ich **kaum Konfliktpotenzial**. Gemeinsam ist nur „Dream", und das ist in dieser Kategorie ein beschreibendes, schwaches Wort.
- **„Dream Recorder" oder „dreamrecorder" nie für Produkte, Funktionen, Editionen oder Werbung nutzen.** Das ist Modems Projektidentität, und in Deutschland gibt es zusätzlich die fremde Wortmarke.
- Vor der eigenen Anmeldung von „Dream Rushes": professionelle Recherche in Klasse 9, 41 und 42. Die frühere Namensrecherche des Projekts hatte keinen Registerzugriff, dieser Check schließt die Lücke nur teilweise.

---

## 6. Ähnliche Produkte (Kontext, kurz)

- **Hardware:** Ein zweites Gerät für den Nachttisch, das aus Träumen Videos macht, habe ich nicht gefunden. Angrenzend ist **Prophetic** mit Stirnbändern „Dual" (449 $, Lieferung ab Ende 2026) und „Phase" (1.299 $, 2027). Sie sollen per Ultraschall Klarträume auslösen und zeigen nichts an.
- **Apps von Stimme zu Video** (Auswahl, Angaben laut Store bzw. Website):
  - **DreamReel**: 3,99 $ oder 7,99 $ pro Trailer, 9:16, mit Ton
  - **DreamStudio**: Abo 7,99–24,99 $ im Monat mit „Moons"-Credits, Filme aus mehreren Szenen
  - **Dreamvio**: iOS-Start Q2 2026, Feed zum Teilen
  - **Dream Video: AI Dream Journal**, **DreamAI** (iOS/Android), **DreamVision-AI**, **Build My Dream** (Storyboard)
  - Die ausführliche Marktliste steht bereits in `docs/plans/2026-09-14-recherche-markt-namen.md`.
- **Forschung:** Echte Traumaufzeichnung gibt es nur im Labor und nur ansatzweise, z. B. Horikawa et al. 2013 mit fMRI. Das Missverständnis „nimmt Träume auf" betrifft deshalb jedes Produkt dieser Art.
- **Einschätzung zum Unterschied:** Dream Recorder ist ein Kunstobjekt ohne Gesichter und ohne App. Dream Rushes arbeitet mit Regie, eigener Besetzung und Archiv. Das Konzept ist verwandt, die Werte sind entgegengesetzt.

---

## 7. Einschätzung: Kann und soll Dream Rushes kooperieren?

### Wo es passt und wo es reibt
| | Dream Recorder | Dream Rushes |
|---|---|---|
| Ritual | Stimme direkt nach dem Aufwachen → Film | gleich |
| Ort | Objekt auf dem Nachttisch, **ohne Handy** | iPhone-App |
| Bild | Lo-Fi, **Gesichter verwischt**, 21:9, 5 s | kinoreif, **eigene Gesichter**, Hochformat (Stil-Clips 3:4), Filme 15 s |
| Gedächtnis | Konzept: eine Woche | Archiv und Tagebuch („5 Jahre Träume") |
| Geld | selbst gebaut, eigene API-Schlüssel, ~0,15 $ pro Clip | Abo und Credits (9,99 $ = fünf 15-s-Filme ≈ 2 $ pro Film) |
| Haltung | Alternative zu KI von Konzernen und Risikokapital | Start-up |

### Formate, geordnet nach Plausibilität und Nutzen für beide

**1. Kleiner Open-Source-Beitrag als Türöffner** *(Plausibilität: hoch für eine Antwort, unsicher für einen Merge; Nutzen: mittel)*
Ein anbieterneutrales Videomodul: Luma-Fix aus PR #33 plus austauschbare Anbieter, z. B. aktuelle Luma-API oder fal.ai. Das steht so auf Modems eigener Wunschliste. Dream Rushes höchstens als *eine* Option, nie als Standard.
- *Modem gewinnt:* Das Gerät läuft wieder, ohne dass sie selbst arbeiten müssen.
- *Dream Rushes gewinnt:* Vertrauen, einen Gesprächsanlass und Sichtbarkeit bei einer Bastler-Community mit rund 1.600 Sternen.
- *Risiko:* Modem hat noch nie einen PR bearbeitet. **Erst fragen, dann bauen.** Aufwand etwa ein bis zwei Tage (**Einschätzung**).

**2. Austausch und gemeinsamer Inhalt** *(Plausibilität: mittel; Nutzen: hoch für Dream Rushes, mittel für Modem)*
Ein Gespräch oder Text „Zwei Wege, einen Traum zu filmen" (Objekt gegen App, Lo-Fi gegen
Kino), Beobachtungen teilen, wie Menschen auf ihre Traumbilder reagieren (anonym, mit
Einwilligung), später vielleicht ein Talk.
- *Modem gewinnt:* Das passt zur Rolle als Thinktank. Le Clercq misst Erfolg an den Gesprächen, die ein Projekt auslöst.
- *Dream Rushes gewinnt:* Glaubwürdigkeit bei der Designpresse, die das Projekt schon kennt (Dezeen, It's Nice That, Fast Company).
- *Risiko:* Modem könnte sich als Feigenblatt für eine kommerzielle KI-App vorkommen und ist wählerisch. Jeden Text vor Veröffentlichung abstimmen, keine „Partnerschaft" behaupten.

**3. Dream Rushes als optionaler Cloud-Anbieter „ohne API-Schlüssel"** *(Plausibilität: niedrig bis mittel; erst nach Format 1 oder 2)*
Technisch gut machbar: `generate_video()` ersetzen, Gerät per Pairing-Code koppeln, Ausgabe in 21:9.
- *Nutzen:* Kein Einrichten von Schlüsseln mehr, keine kaputten APIs, bessere Filme. Für Dream Rushes ein neuer Kanal mit Hardware-Geschichte.
- *Risiken:*
  - Kleine Zielgruppe: Wie viele Geräte gebaut wurden, ist unbekannt, **Einschätzung** eher Hunderte als Tausende.
  - Großer Preisabstand: rund 0,15 $ gegen rund 2 $ pro Film.
  - Dream Rushes hätte noch **keine öffentliche API** und keine Selbstregistrierung.
  - Dream Rushes wäre für intime Traumaufnahmen datenschutzrechtlich verantwortlich.
  - Die AI-Act-Markierung gilt ab dem ersten Film.
  - Das widerspricht Lo-Fi und verwischten Gesichtern. Wenn überhaupt, dann als „Lo-Fi-Modus ohne Besetzung".

**4. Begleit-App oder Sync ins Dream-Rushes-Archiv** *(Plausibilität: niedrig)*
Das widerspricht Modems Kernsatz, dass das Gerät ohne Apps auskommt. Denkbar wäre höchstens ein freiwilliger Export
(Datei oder QR-Code), den Bastler selbst bauen.
- *Risiko:* Die Community könnte das als Aushöhlung der Idee sehen. Außerdem hat das Gerät eine lokale Weboberfläche ohne Anmeldung, dort dürften keine Tokens herumliegen.

**5. Bausatz oder „Dream Rushes Edition"** *(Plausibilität: sehr niedrig, kurzfristig)*
Modem hat sich bewusst gegen den Verkauf entschieden.
- *Aufwand für Hardware:* CE (EMV, Funk), Produktsicherheitsverordnung GPSR, WEEE- und Verpackungsregistrierung, Haftung, Lager. Die Teile allein kosten 285–360 €, der Endpreis läge deutlich darüber.
- *Name:* Siehe §5. Allenfalls später eine limitierte Auflage mit Modems ausdrücklichem Segen.

**6. Code übernehmen oder anpassen** *(geht jederzeit ohne Kooperation; gemeinsamer Nutzen gering)*
- *Erlaubt:* MIT erlaubt das, auch kommerziell. **Pflicht:** Copyright und Lizenztext beilegen, z. B. im Lizenz-Screen der App und als NOTICE im Repo. Ein Credit ist fair.
- *Brauchbar:* die Prompt-Vorlage und die FFmpeg-Filterkette als Idee für einen Lo-Fi-Stil. Der Stack ist ein anderer (Python/Flask gegen Expo/Bun), der Nutzen daher klein.
- *Nicht erlaubt:* Name, Logo und ungeklärte Illustrationen. Kein GPL-Code aus Terra.

### Risiken über alle Formate
- **Konkurrenz und Haltung:** Aus Modems Sicht ist Dream Rushes genau die handybasierte, abo-getriebene KI-App, gegen die sie argumentieren. **Gegenmittel:** den Unterschied offen benennen, zuerst etwas geben, keine Werbung in ihrem Repo.
- **Open-Source-Community:** Kommerzielle Standards, Upsells oder Tracking im DIY-Projekt würden Gegenwind auslösen. Auf HN wird gerade gelobt, dass es nichts zu kaufen gibt. **Gegenmittel:** anbieterneutral, freiwillig, transparent.
- **Datenschutz (DSGVO):** Traumaufnahmen sind Stimme plus sehr private Inhalte (Gesundheit, Sexualität, Religion und Ähnliches) → **Art. 9 möglich**. Dazu kommen Dritte in Träumen und Fotos der Besetzung, US-Dienstleister (fal.ai, Replicate, OpenAI, Luma → Drittlandtransfer prüfen) und ein Löschkonzept. Heute nutzen Dream-Recorder-Besitzer eigene Konten privat. Mit einer Integration würde Dream Rushes verantwortlich. → rechtlich prüfen lassen.
- **EU AI Act, Art. 50** (gilt seit 02.08.2026):
  - Anbieter generativer Systeme müssen die Ausgabe **maschinenlesbar markieren**. Die Übergangsfrist bis 02.12.2026 gilt laut AI-Omnibus (VO (EU) 2026/1744, ABl. 24.07.2026) **nur für Systeme, die vor dem 02.08.2026 auf dem Markt waren**. Neue Apps haben also keine Frist.
  - Laut Code of Practice und Kanzlei-Zusammenfassung sind in der Regel **zwei Techniken** gefordert, z. B. Metadaten plus Wasserzeichen.
  - Filme mit echten Menschen sind **Deepfakes** und brauchen einen sichtbaren Hinweis, sobald Dream Rushes sie veröffentlicht, etwa im Marketing. Die Ausnahme für künstlerische Werke erleichtert nur die Form, nicht die Pflicht.
  - Privatnutzer sind ausgenommen.
  - Details stehen im Projekt unter `docs/plans/2026-09-14-recherche-markt-namen.md`, Abschnitt A5.
- **Abhängigkeit von fremden Modellen:** Dream Recorder zeigt, wie ein API-Wechsel ein Produkt still lahmlegt. Kein Format sollte an einem einzigen Anbieter hängen.
- **Erreichbarkeit:** Das Repo ruht seit Mitte 2025, das Studio schließt 2030. Eine Antwort ist unsicher, deshalb nichts einplanen, das von Modem abhängt.

### Empfehlung für den nächsten Schritt
1. **Eine** kurze Mail von Anton an office@modemworks.com (Entwurf unten): etwas anbieten, eine Frage stellen, kein Deck.
2. Vor einer Antwort nichts Öffentliches in ihrem Repo tun, also kein Issue und keinen PR mit Dream-Rushes-Bezug.
3. Kommt nach drei bis vier Wochen nichts, einmal freundlich nachfassen (Mail oder Instagram-DM), danach loslassen.
4. Intern ohnehin mitnehmen: Die HN-Kritik ehrlich im Onboarding beantworten. Worte verlieren Information, der Nutzen muss klar sein, und kein Gerät nimmt Träume wirklich auf.

---

## 8. ENTWURF — erste Nachricht (NICHT GESENDET)

> Nur ein Entwurf. Anton verschickt selbst, wenn er will. Den Link-Platzhalter ersetzen.
> An: office@modemworks.com

**Subject:** Keeping Dream Recorder dreaming

Hi Modem team,

I'm Anton, co-founder of Dream Rushes. We're a small team from Germany building an iOS app
that turns a dream, spoken right after waking, into a short AI film.

Dream Recorder reaches the same morning moment without a phone. Different road, same ritual.

One concrete offer: open PR #33 says Luma has changed its API, and Luma now lists Ray2 as
deprecated. New builds may stop generating. We'd happily contribute a small,
provider-neutral video module to fix that. MIT, no Dream Rushes branding.

Would you accept a pull request like that, and who should review it?

And if you're ever curious how people react to seeing their dreams on screen, let's compare notes.

Best,
Anton
[Link to Dream Rushes]

*(126 Wörter inkl. Betreff und Platzhalter)*

---

## Quellen

**Modem und Projekt**
- https://modemworks.com/projects/dreamrecorder/
- https://modemworks.com/office/
- https://modemworks.com/projects/terra/
- https://dreamrecorder.ai/ → https://landingpages.modemworks.com/dreamrecorder/
- https://developments.media/interviews/modem-works (Jan. 2025)
- https://the-brandidentity.com/interview/modems-astin-le-clercq-on-building-a-design-studio-with-an-expiry-date (03.10.2025)

**GitHub**
- https://github.com/modem-works/dream-recorder
- https://github.com/modem-works/dream-recorder/blob/main/LICENSE.md
- https://github.com/modem-works/dream-recorder/blob/main/README.md
- https://github.com/modem-works/dream-recorder/blob/main/config.example.json
- https://github.com/modem-works/dream-recorder/blob/main/docs/diagrams/conversation_flow.mmd
- https://github.com/modem-works/dream-recorder/tree/demo
- https://github.com/modem-works/dream-recorder/pull/33
- https://github.com/modem-works/dream-recorder/pull/23
- https://github.com/modem-works/dream-recorder/pull/12
- https://github.com/modem-works/dream-recorder/issues/6
- https://github.com/modem-works/dream-recorder/issues/13
- https://github.com/modem-works/dream-recorder/issues/16
- https://github.com/modem-works/dream-recorder/issues/32
- https://github.com/modem-works/terra
- https://github.com/modem-works
- https://github.com/markhinch

**Luma**
- https://lumalabs.ai/llm-info

**Presse und Resonanz**
- https://www.itsnicethat.com/articles/modem-dream-recorder-product-design-project-250625
- https://www.dezeen.com/2025/06/30/dream-recorder-ai-design/
- https://www.newsweek.com/dream-recorder-device-cinematic-video-reels-ai-generated-imaging-2102220
- https://tech.yahoo.com/wearables/articles/ai-device-translate-dreams-play-155916458.html (NY Post)
- https://www.fastcompany.com/91373438/this-ai-gadget-turns-your-dreams-into-mini-movies
- https://www.hackster.io/news/turning-pillow-talk-into-films-with-ai-163502c6036f
- https://thehustle.co/news/this-ai-device-lets-you-watch-your-dreams-as-lo-fi-movies
- https://www.designboom.com/technology/ai-recorder-replays-dream-videos-recall-visualized-sleep-device-modem-08-16-2025/
- https://www.dezeen.com/2026/04/25/open-source-gadget-designs/
- https://news.ycombinator.com/item?id=44361024
- https://news.ycombinator.com/item?id=47143976
- https://www.threads.com/@power.ai/post/DMRtTV3TUcE (Beispiel für Falschdarstellung EEG/fMRI)

**Marken**
- https://www.tmdn.org/tmview/ (Suchen am 14.09.2026)
- https://register.dpma.de/DPMAregister/marke/register/3020252291489/DE

**Ähnliche Produkte und Forschung**
- https://apps.apple.com/us/app/dreamreel-ai-dream-videos/id6791236871
- https://dreamstudioapp.com/
- https://dreamvio.app/
- https://apps.apple.com/us/app/dream-video-ai-dream-journal/id6752927216
- https://apps.apple.com/us/app/dreamai-ai-dream-video-art/id6746871782
- https://apps.apple.com/us/app/build-my-dream/id6759507979
- https://www.prophetic.com/halo
- https://www.science.org/doi/10.1126/science.1234330 (Horikawa et al. 2013)

**Regulierung**
- https://digital-strategy.ec.europa.eu/en/news/commission-publishes-code-practice-marking-and-labelling-ai-generated-content
- https://artificialintelligenceact.eu/transparency-rules-article-50/
- https://fpf.org/blog/the-ai-act-implementation-timeline-what-changes-under-the-ai-omnibus/
- https://www.paulweiss.com/insights/client-memos/eu-finalises-transparency-rules-for-ai-generated-content
- https://gdpr-info.eu/art-9-gdpr/

**Grenzen dieser Recherche:** Gerät nicht gebaut oder getestet. Die Zahl gebauter Geräte ist
unbekannt. Dezeen-Kommentare ließen sich nicht laden, Reddit war gesperrt. TMview ist kein
amtliches Register. Rechtliche Aussagen sind nur Hinweise und keine Beratung.
