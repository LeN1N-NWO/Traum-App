# Recherche: Einladungsprogramm („Freunde einladen“) für Dream Rushes

Stand: 14.09.2026 · Nur Recherche, niemand kontaktiert, nichts registriert.
Kennzeichnung: **UNGEPRÜFT** = nicht an Primärquelle verifiziert oder Anbieter-Marketing. **SCHÄTZUNG** = eigene Rechnung/Annahme.
Keine Rechtsberatung — die UWG-/DSGVO-Einordnung vor dem öffentlichen Start von einer Kanzlei gegenlesen lassen.

---

## Kurzantwort

1. **Tracking:** Ohne Tracking-SDK zuverlässig und datenschutzfreundlich geht es **deterministisch** über einen **Einladungscode**, der auf drei Wegen in die App kommt: (a) Universal Link, wenn die App schon installiert ist, (b) Einfügen per `ClipboardPasteButton` (Apples `UIPasteControl`, **kein** Einfüge-Dialog) nach dem Kopieren auf unserer Landingpage, (c) Handeingabe. Echtes „Deferred Deep Linking“ nach App-Store-Installation gibt es auf iOS **nicht** ohne Fingerprinting (IP/User-Agent/Bildschirm usw.) — und genau das untersagt Apple im Lizenzvertrag. Apples eigene Werkzeuge (Kampagnen-Links, AdAttributionKit) liefern nur **aggregierte** Zahlen, keine Zuordnung Einladender → Eingeladener.
2. **Credits für Einladungen:** Die Evidenz sagt: Empfehlungsprogramme lohnen sich meist, **aber** der Hebel ist kleiner als die Dropbox-Legende nahelegt (Duolingo: nur +3 % Neunutzer). Bei Kosten pro Generierung: **nie bei Installation oder Registrierung belohnen**, sondern gestuft nach einer echten Handlung (erster Film mit festem Konto) und den größeren Teil erst nach dem **ersten Kauf** des Eingeladenen; Deckel pro Einladendem; Bonus-Credits getrennt von gekauften führen und befristen. Forschung spricht dafür, den **Eingeladenen** großzügig zu beschenken („prosozial“) — das wirkt mindestens gleich gut und senkt nebenbei das UWG-Risiko.

---

# Teil A — Funktioniert das? Evidenz und Erfahrungen

## A1. Akademische Evidenz

| Studie | Kernergebnis | Übertragbarkeit auf uns |
|---|---|---|
| **Schmitt, Skiera & Van den Bulte (2011)**, *Journal of Marketing* 75(1), 46–59 | ~10.000 Kunden einer deutschen Bank, knapp 3 Jahre. Geworbene Kunden: anfangs höhere Deckungsbeiträge (Abstand schwindet), **dauerhaft höhere Bindung**, Wert **≥ 16 %** bzw. laut Executive Summary **mind. 40 € höher** als vergleichbare Nicht-Geworbene. Prämie 25 € an den Werber → ROI ca. **60 %**. Sorge vor „Missbrauch durch Prämienjäger“ war kleiner als der Nutzen. | Hohe Wechselkosten (Bank) ≠ Konsum-App. Richtung (bessere Bindung) ist plausibel übertragbar, Größenordnung nicht. |
| **Van den Bulte, Bayer, Skiera & Schmitt (2018)**, *JMR* | Mechanismus: geworbene Kunden passen besser zum Produkt („Matching“) und profitieren von sozialer Einbindung. | Spricht dafür, Einladungen an **Leute mit Bezug** (Freundeskreis) zu richten, nicht an Reichweite. |
| **Ryu & Feick (2007)**, *JM* 71(1) „A Penny for Your Thoughts“ | Prämien erhöhen die Empfehlungswahrscheinlichkeit, v. a. bei **schwachen Bindungen** und **schwachen/unbekannten Marken**. Bei starken Bindungen wirkt es besser, zumindest einen Teil der Prämie dem **Empfänger** zu geben. | Wir sind eine unbekannte Marke → Prämie hilft; Freunde & Familie = starke Bindungen → Eingeladenen beschenken. |
| **Gershon, Cryder & John (2020)**, *JMR* „Why Prosocial Referral Incentives Work“ | Zwei Feldexperimente + Labor: **empfänger-begünstigende** Prämien gewinnen **mehr** Neukunden; Werber sehen Reputationsgewinn, und für den Empfänger sinkt die Hürde. | Direkt relevant: „Dein Freund bekommt einen Gratisfilm“ statt „Du bekommst Credits“. |
| **Dimoka, Hou, Li & Pavlou** (SSRN, Arbeitspapier) | Empfänger belohnen motiviert Werber prosozial; Effekt **schwächer**, wenn der Werber zusätzlich belohnt wird. | Werber-Prämie klein halten bzw. erst später (nach Kauf) auszahlen. |
| **Gershon & Jiang (2025)**, *JMR* „Referral Contagion“ | 41,2 Mio. Kunden: geworbene Kunden werben **31–57 % mehr** weiter; Erinnerung an die eigene Herkunft („Du bist über Anna gekommen“) → **+21 %** erfolgreiche Empfehlungen (Feldexperiment). | Günstiger UX-Trick: Eingeladenen später an ihre Einladung erinnern und selbst Einladen anbieten. |
| **Jin & Huang (2014)** (zitiert in JAMS-Literatur) | Sachprämien (hedonisch, z. B. Kinogutschein) wirken oft besser als Geld — Geld erhöht soziale Kosten („verkauft Freunde“). | Credits = produktnahe Sachprämie → passend. |
| Literatur zur Prämienhöhe (u. a. JAMS 2019 „Unintended reward costs“) | Große Prämien helfen meist, einzelne Studien zeigen null/negativen Effekt durch Imagesorgen; bei innovativen Produkten entstehen „unbeabsichtigte Prämienkosten“. | Moderate Prämie reicht. **UNGEPRÜFT** im Detail (nur Abstracts gelesen). |

Quellen:
- https://journals.sagepub.com/doi/abs/10.1509/jm.75.1.46 · Executive Summary: https://www.marketing.uni-frankfurt.de/fileadmin/user_upload/dateien_abteilungen/abt_marketing/Bilder/Professor_Skiera/Slides/Executive-Summary-Schmitt-Skiera-vandenBulte-2011-Referral-Programs-Customer-Value.pdf
- https://journals.sagepub.com/doi/abs/10.1509/jmr.14.0653
- https://journals.sagepub.com/doi/10.1509/jmkg.71.1.084
- https://journals.sagepub.com/doi/abs/10.1177/0022243719888440
- https://papers.ssrn.com/sol3/Delivery.cfm/4870350.pdf?abstractid=4870350&mirid=1
- https://journals.sagepub.com/doi/abs/10.1177/00222437241257886 · https://www.ama.org/2026/03/02/referral-contagion-capturing-the-full-roi-of-referral-programs/
- https://link.springer.com/article/10.1007/s11747-019-00635-z · https://link.springer.com/article/10.1007/s11747-022-00852-z

## A2. Branchenzahlen Konsum-/Abo-Apps 2023–2026

Belastbare, unabhängige Zahlen zu „Anteil der Installationen aus Empfehlungen“ für Abo-Apps habe ich **nicht** gefunden. Was kursiert, stammt fast immer von Anbietern von Empfehlungs-Software:

- „20–35 % aller Installationen bei reifen Programmen“, „Share→Install 12–20 %“, „+37 % D30-Retention“, „+25 % LTV“, „zweiseitig schlägt einseitig um 30–50 %“ — GrowSurf/ReferralCandy/vmobify, 2025/2026. **UNGEPRÜFT, Anbieter-Marketing, Methodik nicht offengelegt.** Nicht in Businesspläne übernehmen.
  https://growsurf.com/statistics/mobile-app-referral-statistics/ · https://www.referralcandy.com/blog/referral-program-benchmarks-whats-a-good-conversion-rate-in-2025/
- Betrug allgemein: „31 % des globalen App-Traffics im Q1 2025 ungültig/betrügerisch“ (Appdome/GeeTest-Blogs) — bezieht sich auf Werbe-/Install-Traffic insgesamt, **nicht** auf Empfehlungsprogramme. **UNGEPRÜFT.** https://www.appdome.com/dev-sec-blog/what-is-mobile-app-fraud/ · https://www.geetest.com/en/article/bonus-abuse-in-2025-types-risks-prevention-strategies

**SCHÄTZUNG** für uns: Bei Freunden & Familie ist Einladen ohnehin der Hauptkanal; ob die Prämie das Volumen messbar erhöht, lässt sich bei kleinen Zahlen kaum messen. Der Nutzen der Prämie liegt eher darin, dem Eingeladenen den ersten, sonst vielleicht gesperrten Film zu schenken.

## A3. Bekannte Fälle

| Firma | Was gegeben wird | Auslöser / Deckel | Ergebnis (soweit dokumentiert) |
|---|---|---|---|
| **Dropbox** (2008–2010) | beide Seiten 500 MB | Deckel 16 GB für Werber | 100k → 4 Mio. Nutzer in 15 Monaten; Empfehlungen sollen 2,8× mehr Anmeldungen als bezahlte Kanäle gebracht haben. Quelle nur Sekundärblogs, **UNGEPRÜFT** im Detail. Grenzkosten Speicher ≈ 0 — bei uns nicht so. https://growsurf.com/blog/dropbox-referral-program/ |
| **Duolingo** | Werber: 1 Monat Super (später 1 Woche, max. 10) | Freund startet Super-Probe | Nur **+3 %** Neunutzer; Grund: die aktivsten Nutzer hatten schon Super und die Prämie war für sie wertlos. Wachstum kam stattdessen über Retention (Streaks, Ranglisten). Lenny's Newsletter, 28.02.2023. https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth |
| **Headspace / Calm** | Gastpass: 30 Tage Premium für den **Eingeladenen**; Werber bekommt nichts | Eingeladener legt Zahlungsdaten an, wird nach 30 Tagen abgerechnet; nur für Nicht-Abonnenten ohne frühere Probe | Rein prosozial, Probezeit mit Zahlungsmittel. Keine Zahlen öffentlich. https://help.headspace.com/hc/en-us/articles/9485953746843-How-does-the-Guest-Pass-feature-work · https://support.calm.com/hc/en-us/articles/360017887793 |
| **Uber** (Fahrgäste) | beidseitig $10 → $20 → $30 Guthaben | erste Fahrt | Großer Wachstumsbeitrag laut Case-Studies, zugleich Probleme mit Fake-/Doppelkonten. **UNGEPRÜFT** (Sekundärquellen). https://referralrock.com/blog/uber-referral-program/ |
| **Revolut** | nur **Werber** bekommt Geld | Eingeladener muss Privatkonto eröffnen, **physische Karte bestellen** und **3 Kartenzahlungen** über Mindestbetrag machen; max. **5** Belohnungen pro Kampagnenzeitraum | Lehrbuch für „Belohnung nach echter Handlung + Deckel“. https://www.revolut.com/en-IT/legal/referrals-terms/ · https://help.revolut.com/help/referrals/other/what-are-the-requirements-to-get-my-referral-reward/ |
| **Suno** (KI-Musik) | beide 250 Credits (≈ 50 Songs) | Freund meldet sich an **und erstellt 10 Songs**; Deckel 2.500 Credits für Werber | Juni 2024 als Pilot, Okt. 2024 „auf Wunsch zurückgebracht“ (X-Posts von Suno). Credit-Zahlen aus Drittseiten → teilweise **UNGEPRÜFT**. https://x.com/suno/status/1802734375525666951 · https://x.com/suno_ai_/status/1843739161783599518 |
| **Kling AI** (KI-Video) | Werber 500 Credits; Eingeladener +50 % Bonus-Credits | erst beim **ersten Kauf** eines Individual-Plans; Werber muss selbst zahlender Kunde sein; befristete Kampagne (~3 Monate, Juni 2025 zum Jubiläum) | Keine Ergebnisse veröffentlicht. Konditionen aus Drittquellen, offizielle Seite nicht auslesbar → **UNGEPRÜFT**. https://x.com/Kling_ai/status/1930609713148043426 · https://www.referkaroearnkaro.com/post/kling-ai-referral-program-for-free-credit |
| **Higgsfield** (unser Anbieter) | Werber: 3/5/7 Tage „Unlimited Seedance 2.0“ (720p, 8 s), Deckel 7 Tage; Eingeladener bis 60 % Rabatt | Eingeladener muss binnen **24 h** Plus/Pro kaufen **und** eine bezahlte Generierung machen; nur Plus/Pro-Kunden dürfen einladen | Blog 14.07.2026 (aktual. 28.08.2026). Keine Ergebnisse. https://higgsfield.ai/blog/how-to-get-free-unlimited-seedance-2 |
| **PixVerse** | beide Seiten Bonus-Credits, Deckel angeblich 4.340 Credits | Einlösung bei Anmeldung | Zahlen nur aus Code-Sammelseiten → **UNGEPRÜFT**. https://www.atlascloud.ai/blog/tips/pixverse-referral-code |
| **Leonardo.Ai** | Affiliate-Programm (Provision) | — | Programm am **07.04.2026 eingestellt**. https://intercom.help/leonardo-ai/en/articles/9057851-affiliate-program-faq |
| Midjourney, Runway, Pika, CapCut | keine aktuellen, belastbaren Angaben gefunden | — | **Nicht belegt.** |

**Muster bei KI-Anbietern mit echten Rechenkosten:** Wer ernsthaft Credits verschenkt (Kling, Higgsfield), knüpft die Werber-Prämie an einen **Kauf** des Eingeladenen; wer bei Anmeldung belohnt (PixVerse), hat zugleich eine riesige Code-Tauschbörsen-Szene im Netz. Suno liegt dazwischen (10 Songs = echte Nutzung als Hürde).

## A4. Typische Prämien-Designs

**Zeitpunkt der Belohnung** (von riskant nach sicher):
1. Installation — nicht messbar ohne Fingerprinting, maximal betrugsanfällig. ❌
2. Registrierung — Farming mit Wegwerfkonten trivial. ❌ (höchstens für den Eingeladenen, und nur klein)
3. **Erste sinnvolle Handlung** (erster fertiger Film, Tag-2-Rückkehr) — guter Kompromiss für kleine Prämien.
4. **Erster Kauf** (ggf. nach Ablauf der Widerrufs-/Erstattungsfrist) — für die größere Werber-Prämie. Apple-Erstattungen gibt es auch nachträglich; **SCHÄTZUNG**: 7–14 Tage Wartezeit oder Rückbuchung bei `REFUND`-Notification der App Store Server API.

**Größe:** Konsum-Apps geben meist „eine Einheit Produkt“ (eine Fahrt, eine Woche, ein Monat, 50 Songs). Faustregel aus der Praxis (**UNGEPRÜFT**): Werber-Prämie ≤ Rohertrag des ersten Kaufs des Eingeladenen.

**Deckel:** Dropbox 16 GB, Duolingo 10 Wochen, Revolut 5 pro Kampagne, Suno 2.500 Credits, Higgsfield 7 Tage. Deckel pro Monat **und** lebenslang ist üblich.

**Verfall:** Bonus-Credits getrennt von gekauften führen. Apple-Richtlinie 3.1.1: *per In-App-Kauf gekaufte* Credits dürfen nicht verfallen — für geschenkte Bonus-Credits gilt das nicht ausdrücklich. Verbraucherrechtliche Zulässigkeit eines Verfalls in AGB (§ 307 BGB) **UNGEPRÜFT** → Juristen fragen.

**Betrugsmuster und Gegenmittel:**

| Muster | Gegenmittel |
|---|---|
| Selbst-Einladung mit Zweitkonto auf **gleichem Gerät** / Neuinstallation | **DeviceCheck-Bit** („auf diesem Gerät wurde schon ein Code eingelöst“) — überlebt Neuinstallation und sogar „Alle Inhalte löschen“ |
| Mehrere Geräte (Familien-iPads, alte iPhones) | Prämie erst nach Kauf / echter Nutzung; Deckel; Sign in with Apple statt anonymer Konten |
| Emulator-/Gerätefarmen, gepatchte Apps, API direkt ansprechen | **App Attest** (echte App auf echtem Apple-Gerät); iOS-Simulator hat kein App Attest/DeviceCheck |
| Code-Tauschbörsen (Reddit, Code-Sammelseiten) | Prämie auf „Freund“-Niveau begrenzen, Deckel pro Werber, auffällige Werber (viele Einlösungen, niemand kauft) manuell sperren |
| Kauf → Prämie kassieren → Erstattung | Werber-Prämie verzögert gutschreiben bzw. bei Refund zurückbuchen |
| Anonyme Wegwerfkonten | Einlösung/Prämie nur für Konten mit `is_anonymous = false` |

Revolut und Uber belegen, dass Betrug real ist, aber Schmitt et al. zeigen: bei vernünftiger Auslöser-Wahl überwiegt der Nutzen.

## A5. Empfehlung für eine KI-App mit echten Kosten — Rechenbeispiel

**Ausgangszahlen** (von euch): billigster Film = 11 Credits ≈ **$0,28** Kosten → **≈ $0,0255 pro Credit**.
Abo $9,99 / 160 Credits; Paket S $4,99 / 50 Credits.

**Nettoerlös pro Kauf (SCHÄTZUNG):** Apple Small Business Program 15 % Provision; in DE sind 19 % USt im Preis enthalten.

| Produkt | Brutto | nach USt (DE) | nach 15 % Apple | Kosten bei voller Nutzung | Rohertrag 1. Monat |
|---|---|---|---|---|---|
| Abo 160 Cr | $9,99 | $8,39 | **$7,14** | 160 × 0,0255 = $4,07 | **≈ $3,07** |
| Paket S 50 Cr | $4,99 | $4,19 | **$3,56** | 50 × 0,0255 = $1,27 | **≈ $2,29** |

(Wird nicht alles verbraucht, steigt der Rohertrag. Server/Hosting nicht eingerechnet.)

**Kosten von Credit-Prämien für uns** (nur wenn verbraucht): 11 Cr = $0,28 · 22 Cr = $0,56 · 33 Cr = $0,84 · 44 Cr = $1,12.
**Wert für den Nutzer** (Ladenpreis): 1 Credit ≈ $0,062 (Abo) bis $0,10 (Paket S) → 11 Credits ≈ $0,69–1,10. Das ist fair als Geschenk, aber zu wenig, um Betrug mit echten Geräten und Apple-IDs lohnend zu machen.

**Vorgeschlagene Logik (zweistufig):**

| Stufe | Auslöser (serverseitig geprüft) | Eingeladener | Einladender |
|---|---|---|---|
| **Qualifiziert** | Code eingelöst binnen 7 Tagen nach Kontoanlage · Konto nicht anonym (Sign in with Apple) · DeviceCheck-Bit frei · nicht der eigene Code · **erster Film fertig** | **+11 Credits = 1 Film geschenkt** (sofort bei Einlösung als „reserviert“ anzeigen, gutschreiben bei Qualifizierung — oder direkt bei Einlösung, da gering) | +11 Credits (max. 5 pro Monat, 20 lebenslang) |
| **Belohnt** | erster Kauf des Eingeladenen (Abo oder Paket), 7 Tage ohne Erstattung | — | **+33 Credits = 3 Filme** (kein Monatsdeckel nötig, aber lebenslang z. B. 30) |

**Beispiel „Freunde & Familie“ (SCHÄTZUNG, alle Quoten angenommen):**
100 Link-Aufrufe → 40 Installationen → 30 Konten mit Code → **20 qualifizieren** (erster Film) → **3 kaufen** (2× Paket S, 1× Abo).

- Stufe 1: 20 × (11 + 11) = 440 Cr → **$11,20**
- Stufe 2: 3 × 33 = 99 Cr → **$2,52**
- Summe **$13,72** → **$0,69 pro aktiviertem Neunutzer**, **$4,57 pro zahlendem Neunutzer**
- Rohertrag der 3 Käufer im 1. Monat: (2 × 2,29) + 3,07 = **$7,65** → im ersten Monat nicht gedeckt, ab Folgemonat (Abo-Verlängerung, Nachkäufe) positiv. Die Werber-Prämie aus Stufe 2 ($0,84) liegt bei 27 % (Abo) bzw. 37 % (Paket S) des Erst-Rohertrags — vertretbar.
- Worst Case Farming: Ein Betrüger mit 5 echten Zweitgeräten/Apple-IDs pro Monat holt 5 × 22 Cr = 110 Cr ≈ $2,80 Kosten für uns — und muss dafür 5 Filme generieren lassen. Uninteressant.

**Stellschrauben:** Wenn es teuer wird, zuerst Stufe-1-Werberprämie auf 0 setzen (prosoziale Variante: nur der Freund bekommt den Film) — laut Gershon et al. 2020 kaum Wirkungsverlust.

---

# Teil B — Einladungen auf iOS ohne Werbe-/Tracking-SDK nachverfolgen

## B1. Optionen und Zuverlässigkeit

### (a) Code manuell in der App eingeben
- **Zuverlässigkeit:** 100 % deterministisch, aber Reibung (Tippen, Tippfehler). Kurze Codes ohne verwechselbare Zeichen (kein 0/O, 1/I/L), 6–8 Zeichen.
- **Datenschutz:** ideal, nur das, was der Nutzer selbst eingibt.

### (b) Universal Link mit Code (App installiert)
- `https://<unsere-domain>/i/ABC123` → iOS öffnet die App direkt, wenn installiert und die Domain in `apple-app-site-association` (AASA) steht.
- Einschränkungen: Universal Links greifen **nicht**, wenn der Link auf derselben Domain angeklickt oder in die Safari-Adresszeile getippt wird; in manchen In-App-Browsern unzuverlässig (**UNGEPRÜFT** je Messenger). iOS lädt die AASA bei Installation/Update über Apples CDN.
- Expo: `ios.associatedDomains: ["applinks:<domain>"]`, AASA unter `/.well-known/apple-app-site-association` per HTTPS. Umschreiben des Pfads in expo-router über `+native-intent.tsx` (`redirectSystemPath({ path, initial })`).
  https://docs.expo.dev/linking/ios-universal-links/ · https://docs.expo.dev/router/advanced/native-intent/

### (c) Nach App-Store-Installation („deferred“) ohne Fingerprinting
Die harte Wahrheit: **Der App Store ist auf iOS eine Datenschutzgrenze.** Android hat die Install-Referrer-API (deterministisch), iOS hat kein Gegenstück. Übrig bleiben:

- **Zwischenablage — Lesen per Code (`UIPasteboard.general.string`)**: Seit **iOS 16** erscheint beim programmatischen Lesen ein System-Dialog „… möchte aus … einsetzen“ (Erlauben/Nicht erlauben). Kein Dialog bei: Einfügen über das Bearbeiten-Menü (langes Drücken), ⌘V, und **`UIPasteControl`** (iOS 16+).
  https://sarunw.com/posts/uipasteboard-privacy-change-ios16/ (11.07.2022)
- **`UIPasteboard.detectPatterns(for:)`** (iOS 14+) und `hasStrings`: klassifizieren/prüfen ohne den Inhalt preiszugeben → **kein Dialog**, aber man erfährt nur „da liegt wahrscheinlich eine URL/Zahl“, nicht den Code. Brauchbar nur als Hinweis „Einladungscode einfügen?“. expo-clipboard bietet `detectPatterns` nach meiner Lesart **nicht** an (**UNGEPRÜFT**) → bräuchte ein kleines eigenes Expo-Modul; für den Start unnötig.
  https://developer.apple.com/documentation/uikit/uipasteboard/detectionpattern · https://mszpro.com/article/ios14-pasteboard-detect-patterns
- **`ClipboardPasteButton` in expo-clipboard (SDK 57.0.0 dokumentiert)**: rendert Apples `UIPasteControl`, **kein Berechtigungsdialog**, weil der Nutzer selbst tippt. Einschränkungen: Aussehen kaum anpassbar, **Höhe und Breite müssen gesetzt sein**, vorher `Clipboard.isPasteButtonAvailable` prüfen. `getStringAsync()`/`hasStringAsync()` können laut Expo-Doku auf iOS 16+ den Dialog auslösen; bei Ablehnung kommt ein leerer String.
  https://docs.expo.dev/versions/latest/sdk/clipboard/
  → **Das ist der sauberste „fast-deferred“-Weg:** Landingpage kopiert den Code per Nutzer-Tipp, App zeigt beim Onboarding den nativen Einfügen-Knopf.
- Akzeptanzraten des Einfüge-Dialogs „30–50 % ohne, 50–70 % mit Erklärbildschirm“ — Tolinku-Blog 02.06.2026, **UNGEPRÜFT**/Anbieter. https://tolinku.com/blog/ios-paste-permission-deferred-links/
- **App Clips:** Die Aufruf-URL (inkl. Code) geht an den App Clip und — wenn der Nutzer die volle App installiert — auch an die App; Daten im gemeinsamen App-Group-Container werden in die volle App übernommen. Deterministisch und ohne Fingerprinting, **aber** großer Aufwand (zweites Target, AASA `appclips`, App-Clip-Erlebnis in App Store Connect, Größenlimit laut Sekundärquelle 50 MB digital / 15 MB physisch ab iOS 17, **UNGEPRÜFT**). Für den Start überdimensioniert.
  https://developer.apple.com/documentation/appclip/sharing-data-between-your-app-clip-and-your-full-app
- **Smart App Banner mit `app-argument`:** übergibt die URL **nur, wenn die App schon installiert ist** — kein Deferred-Linking.
  https://developer.apple.com/forums/thread/772811 · https://www.airbridge.io/glossary/smart-app-banner
- **Landingpage, die den Code groß zeigt:** banal, aber robust — Nutzer merkt/kopiert sich den Code.

### (d) Apples eigene Werkzeuge
- **App-Store-Connect-Kampagnenlinks** (`pt=` Anbieter, `ct=` Kampagne, max. 30 Zeichen): zeigen Impressionen, Seitenaufrufe, Downloads, Käufe, Abos pro Kampagne — **nur aggregiert**, **nur von Nutzern, die der Analysedaten-Weitergabe zugestimmt haben**, Mindestschwelle **5** pro Kennzahl, Anzeige frühestens nach 24 h. **Keine** Einzelnutzer-Daten → taugt nur für „wie viele Installationen kamen über Einladungsseiten insgesamt“ (`ct=invite`), nicht für Prämien.
  https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/
- **Custom Product Pages:** alternative Store-Seiten mit eigener URL, ebenfalls nur aggregierte Auswertung; nicht pro Person. (Deep-Link-Verhalten von CPPs nach Installation **UNGEPRÜFT**.)
- **AdAttributionKit / SKAdNetwork:** misst **Werbeanzeigen** registrierter Werbenetzwerke (Download, Redownload, Re-Engagement), Postbacks mit Crowd-Anonymitätsschwellen und groben/feinen Conversion-Werten. Kann **keinen** Freund einem Einladenden zuordnen. Irrelevant für uns.
  https://developer.apple.com/app-store/ad-attribution · https://developer.apple.com/videos/play/wwdc2025/221/

### (e) Drittanbieter-Deep-Link-Dienste
- **Firebase Dynamic Links** ist seit **25.08.2025** abgeschaltet (Links liefern 404). https://firebase.google.com/support/dynamic-links-faq
- **Branch:** deferred deep linking; klassisch probabilistisches Matching, zusätzlich „NativeLink“ (legt Ziel-Link in die Zwischenablage, ohne IP-Matching — mit dem iOS-16-Einfügedialog bzw. UIPasteControl). Gratisstufe laut Drittquelle bis ca. 10.000 MAU, Bezahlpläne ab ca. $500/Monat (**UNGEPRÜFT**, Branch veröffentlicht keine Preise).
  https://www.branch.io/resources/blog/nativelink-solution-to-challenges-caused-by-ios-15/ · https://linklyhq.com/review/branch
- **AppsFlyer OneLink, Adjust, Kochava, Airbridge:** vollwertige MMPs (Werbe-Attribution) — Overkill, bringen Tracking-SDKs mit, widersprechen unserer Positionierung.
- **Detour (Software Mansion, Open Source, 1.0 in 2026):** gute Expo-Router-Integration über `+native-intent`, „free to start“. **Aber auf iOS probabilistisch** mit Signalen wie User-Agent, Bildschirmgröße, Locale, Zeitzone, IP, optional Zwischenablage; laut eigener Doku „best-effort, keine 100 % Genauigkeit“. Expo-Blog 22.07.2026.
  https://detour.swmansion.com/docs/Fundamentals/introduction · https://expo.dev/blog/deferred-deep-linking-the-right-way
- **Ist probabilistisches Matching erlaubt?**
  - **Apple:** „you may not derive data from a device for the purpose of uniquely identifying it“; Apps bzw. SDKs, die das tun, „may be rejected“. Und: Wer über Drittanbieter eindeutige Kennungen für Werbemessung teilt, braucht ATT. Ob kurzlebiges Install-Matching für eigene Einladungen darunter fällt, ist eine Grauzone — die großen Anbieter tun es seit Jahren, Apple hat es nicht ausdrücklich freigegeben. **Für eine Privacy-first-Marke nicht vertretbar.**
    https://developer.apple.com/app-store/user-privacy-and-data-use/
  - **DSGVO / TDDDG:** IP + Gerätemerkmale zum Wiedererkennen sind personenbezogene Daten; das Auslesen von Endgerät-Informationen im Browser/App fällt unter § 25 TDDDG (ehem. TTDSG) → i. d. R. Einwilligung nötig, zusätzlich Auftragsverarbeitung/Drittlandtransfer beim Anbieter. **UNGEPRÜFT** im Einzelfall, Tendenz: einwilligungspflichtig.
- **Fazit (e):** Für unsere Anforderung (Code einem Konto zuordnen) bringt ein Drittanbieter auf iOS nur probabilistische Treffer — rechtlich und markenseitig riskant — oder Zwischenablage, was wir selbst gratis haben. **Nicht einsetzen.**

**Übersicht Zuverlässigkeit:**

| Weg | Deterministisch | Kein Tracking | Aufwand | Deckt „noch nicht installiert“ ab |
|---|---|---|---|---|
| Code manuell | ✅ | ✅ | gering | ✅ (mit Reibung) |
| Universal Link | ✅ | ✅ | gering | ❌ |
| Landingpage kopiert → `ClipboardPasteButton` | ✅ | ✅ | gering | ✅ (ein Tipp) |
| Zwischenablage programmatisch lesen | ✅ | ✅ | gering | ✅, aber Dialog nervt |
| App Clip | ✅ | ✅ | hoch | ✅ |
| Apple-Kampagnenlinks / AAK | ❌ (aggregiert) | ✅ | gering | nur Statistik |
| Branch/Detour probabilistisch | ❌ | ❌ | mittel | ✅ (unsicher) |

## B2. DeviceCheck und App Attest

**DeviceCheck (DCDevice):**
- App erzeugt ein kurzlebiges, anonymes Token (`DCDevice.current.generateToken()`), schickt es an unseren Server; der Server fragt Apple (`https://api.devicecheck.apple.com/v1/query_two_bits`, `…/update_two_bits`, `…/validate_device_token`; Entwicklung: `api.development.devicecheck.apple.com`).
- Pro Gerät **2 Bits + Zeitstempel** (Monatsgenauigkeit), gespeichert bei Apple. Laut Apple (WWDC21) bleibt der Zustand über **Neuinstallation, Geräteweitergabe und sogar „Alle Inhalte und Einstellungen löschen“** erhalten.
- Die Bits gelten **pro Entwicklerteam, nicht pro App** — bei weiteren Apps desselben Teams teilen sie sich die Bits.
- Authentifizierung: JWT (ES256) mit `.p8`-Schlüssel, Key-ID und Team-ID; jede Anfrage mit `transaction_id` und `timestamp` in Millisekunden.
- Wir erfahren **nicht, welches** Gerät es ist — nur „Bit gesetzt ja/nein“. Deshalb datenschutzfreundlich und kein Fingerprinting.
- **Vorschlag Bit-Belegung:** `bit0` = „auf diesem Gerät wurde ein Einladungscode eingelöst“, `bit1` = „Gerät wegen Betrugs markiert“ (oder: „Willkommens-Credits schon vergeben“ — das wäre wohl die wertvollere Nutzung, gleich mit einplanen). Zeitstempel erlaubt periodisches Zurücksetzen.
- Grenzen: funktioniert nicht im Simulator; ein Betrüger mit vielen echten Geräten wird nicht gestoppt (dafür Deckel + Kauf-Auslöser).
  https://developer.apple.com/videos/play/wwdc2021/10244/ · https://developer.apple.com/documentation/devicecheck/accessing-and-modifying-per-device-data · https://fluffy.es/devicecheck-tutorial/

**App Attest (DCAppAttestService):**
- Schlüssel im Secure Enclave pro **Installation**; Server schickt Challenge, App attestiert den Schlüssel einmal (`attestKey`), danach signiert sie Anfragen (`generateAssertion`). Beweist: echte, unveränderte App auf echtem Apple-Gerät. Attestierungen sind **anonym, ohne Hardware-Kennung**.
- **Risk-Metric-Service:** Beleg (Receipt) lässt sich bei Apple gegen die ungefähre Zahl der auf einem Gerät erzeugten Schlüssel eintauschen → erkennt „ein Gerät, viele Neuinstallationen“.
- `attestKey` ist **rate-limitiert** → schrittweise ausrollen (Apple: bei 1 Mio. DAU über etwa einen Tag).
- Neu (WWDC26, Session 201): macOS 27-Unterstützung; ab iOS 27 Extensions mit „Launch Validation Category“ und Bundle-Version in den Authenticator-Daten.
- Server-seitig in Bun: CBOR/X.509-Kette prüfen — machbar, aber Aufwand; für den F&F-Start nicht nötig, sinnvoll vor öffentlichem Launch zum Schutz von **allen** kostenpflichtigen Endpunkten (nicht nur Einladungen).
  https://developer.apple.com/videos/play/wwdc2026/201/ · https://developer.apple.com/documentation/devicecheck/assessing-fraud-risk
- Expo: kein offizielles `expo-device-check`/App-Attest-Modul im SDK gefunden (**UNGEPRÜFT**); Community-Pakete existieren, sonst ein kleines lokales Expo-Modul (Swift, ~50 Zeilen für DeviceCheck-Token).

## B3. Empfohlene Architektur (Expo SDK 57 + Supabase + Bun)

### Datenmodell (Postgres, Skizze)

```sql
-- Ein Code pro Nutzer (lazy beim ersten Öffnen von "Freunde einladen")
create table invite_codes (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  code        text unique not null,          -- 7 Zeichen, Alphabet ohne 0/O/1/I/L
  created_at  timestamptz not null default now(),
  disabled_at timestamptz                    -- manuelles Sperren bei Missbrauch
);

create type invite_status as enum ('pending','qualified','rewarded','rejected');

create table invite_redemptions (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references auth.users(id) on delete cascade,
  invitee_id    uuid not null unique references auth.users(id) on delete cascade, -- max. 1 Einlösung pro Konto
  source        text not null check (source in ('link','paste','manual')),
  status        invite_status not null default 'pending',
  reject_reason text,          -- 'self','device_used','anonymous','too_late','cap','code_disabled'
  created_at    timestamptz not null default now(),
  qualified_at  timestamptz,
  rewarded_at   timestamptz,
  check (referrer_id <> invitee_id)
);
create index on invite_redemptions (referrer_id, status, qualified_at);
```

- Prämien laufen **ausschließlich über das bestehende Credit-Ledger** mit Idempotenz-Schlüssel, z. B. Unique-Constraint auf `(reason, reference_id)`: `referral_invitee:<redemption_id>`, `referral_referrer_q:<redemption_id>`, `referral_referrer_paid:<redemption_id>`. Doppelte Gutschrift ist damit ausgeschlossen, auch bei Retry.
- Bonus-Credits im Ledger als Typ `bonus` mit `expires_at` markieren und **vor** gekauften verbrauchen (**SCHÄTZUNG** / Produktentscheidung).
- Deckel als Abfrage beim Qualifizieren: `count(*) where referrer_id = $1 and qualified_at > now() - interval '30 days'`.
- RLS: Clients dürfen **nichts** in diese Tabellen schreiben; Lesen nur eigene Zeilen (Einladender sieht Anzahl/Status, **keine** Identität des Eingeladenen).

### Abläufe

1. **Teilen:** Screen „Freunde einladen“ → `Share.share()` (React Native) bzw. `expo-sharing` mit Text + Link `https://<domain>/i/ABC1234`. Text neutral, **vom Nutzer editierbar**, Absender ist der Nutzer selbst in seinem Messenger. Keine Kontaktliste, kein Versand durch unseren Server.
2. **Link geklickt, App installiert:** Universal Link → `+native-intent.tsx` schreibt `/i/ABC1234` auf `/invite?code=ABC1234` um → Code lokal merken (SecureStore/AsyncStorage) → nach Anmeldung einlösen.
3. **Link geklickt, App nicht installiert:** Landingpage auf unserer Domain (Bun liefert statisch aus) zeigt: Filmbeispiel, großen Code, Knopf **„Code kopieren & App laden“** (`navigator.clipboard.writeText` im Klick-Handler, dann Weiterleitung zu `apps.apple.com/app/id…?pt=…&ct=invite&mt=8`). Keine Cookies, keine Analytics nötig; höchstens serverseitig anonym „Seitenaufrufe pro Tag“ ohne IP-Speicherung.
4. **Erster Start:** Onboarding-Schritt „Von einem Freund eingeladen?“ mit `ClipboardPasteButton` (kein Dialog) + Eingabefeld + „Überspringen“. Später unter Einstellungen noch 7 Tage lang möglich.
5. **Anmeldung:** Einlösen erst, wenn das Konto **nicht anonym** ist (Sign in with Apple). Anonyme Supabase-Konten dürfen die App ausprobieren; der Code wird lokal zwischengespeichert und bei `linkIdentity()`/Umwandlung eingelöst. Supabase empfiehlt für anonyme Anmeldungen Captcha/Turnstile gegen Missbrauch; IP-Limit Standard 30/h; anonyme Nutzer werden nicht automatisch aufgeräumt.
   https://supabase.com/docs/guides/auth/auth-anonymous · https://supabase.com/docs/guides/auth/rate-limits
6. **Einlösen (Bun, `POST /api/invites/redeem`):** Supabase-JWT prüfen → `is_anonymous = false` → Konto jünger als 7 Tage und noch kein Kauf → Code existiert, nicht gesperrt, nicht eigener → noch keine Einlösung für dieses Konto → DeviceCheck-Token vom Client: `query_two_bits`; ist `bit0` gesetzt → `rejected/device_used` (freundliche Meldung, App normal nutzbar) → sonst Zeile `pending` anlegen, `bit0` setzen.
7. **Qualifizieren:** im bestehenden Job, der einen fertigen Film verbucht: gibt es `pending` für diesen Nutzer → `qualified`, Ledger-Gutschriften Stufe 1 (Deckel prüfen; bei Überschreitung bekommt nur der Eingeladene seine Credits).
8. **Belohnen:** App Store Server Notification (`SUBSCRIBED`/`ONE_TIME_CHARGE`) für den Eingeladenen → nach Wartezeit (z. B. täglicher Job, Kauf ≥ 7 Tage alt, kein `REFUND`) → `rewarded`, Ledger Stufe 2.
9. **Anzeige:** Einladender: „3 Freunde dabei · 1 hat einen Film gemacht · +44 Credits verdient“. Eingeladener: „Anna hat dir einen Film geschenkt 🎬“ — Namen des Einladenden nur zeigen, wenn dieser das beim Teilen bewusst mitschickt (Anzeigename im Link-Text statt serverseitiger Auflösung) — datensparsamer. Später Erinnerung „Du bist über eine Einladung gekommen — lade selbst ein“ (Gershon & Jiang: +21 %).

### Expo-Bausteine (SDK 57)
- `expo-router` + `app/+native-intent.tsx` (Link-Umschreibung) · `expo-linking` (`useURL`/`Linking.getInitialURL` falls nötig)
- `expo-clipboard` → `ClipboardPasteButton`, `isPasteButtonAvailable` (in der SDK-57-Doku beschrieben)
- App-Config: `ios.associatedDomains: ["applinks:<domain>"]`; AASA-Datei mit `applinks.details[].appIDs` = `<TEAMID>.<bundleId>` und `components` für `/i/*` auf der Domain (Bun-Route mit `Content-Type: application/json`, ohne Weiterleitung). EAS synchronisiert die Associated-Domains-Capability beim Build.
- `expo-apple-authentication` (Sign in with Apple) — vermutlich schon vorhanden.
- DeviceCheck: lokales Expo-Modul (Swift) oder geprüftes Community-Paket (**UNGEPRÜFT**, keins verifiziert).
- `expo-sharing` bzw. RN `Share` für das Teilen-Menü.
- SDK-55–57-spezifische Brüche im Linking habe ich **nicht** gefunden; die Expo-Doku zu Universal Links und `+native-intent` nennt keine Versionsgrenzen (**UNGEPRÜFT** gegen Changelogs).

## B4. Datenschutz und Recht — Kurznotizen (keine Rechtsberatung)

**DSGVO — wer hat wen eingeladen:**
- Rechtsgrundlage: **Art. 6 Abs. 1 lit. b** (Teilnahme am Einladungsprogramm nach Programmbedingungen — beide Seiten handeln aktiv: Teilen bzw. Code eingeben) und **lit. f** (Missbrauchsverhinderung, DeviceCheck-Status). **UNGEPRÜFT** juristisch, aber gängige Einordnung.
- Datenminimierung: nur `referrer_id`, `invitee_id`, Status, Zeitstempel. Keine Namen, keine Kontaktdaten Dritter, keine IP.
- Transparenz: Datenschutzerklärung + kurzer Hinweis beim Einlösen („Dein Freund sieht nur, dass jemand über seinen Code gekommen ist“).
- Löschung: Zeilen fallen mit Kontolöschung (`on delete cascade`); für Betrugsprüfung ggf. pseudonymisierte Restdaten mit Frist.
- Privacy-Nutrition-Label: DeviceCheck-Token ist kein Tracking; Einladungsdaten = „User ID / Other usage data, linked to user, not used for tracking“ (**SCHÄTZUNG**).

**Apple-Richtlinien:**
- **5.1.2(iv):** keine Kontaktdatenbank aus Kontakten aufbauen. **5.1.2(v):** Kontakte nur auf ausdrückliche, individuelle Initiative des Nutzers anschreiben, kein „Alle auswählen“, Vorschau, wie die Nachricht aussieht. → Mit Share-Sheet und ohne Kontaktzugriff umgehen wir das komplett.
- **3.2.2:** Nutzer dürfen nicht zu Store-Aktionen *gezwungen* werden; Anreize für Handlungen *in* der App sind erlaubt.
- **3.1.1:** eigene Mechanismen zum Freischalten von Inhalten (Lizenzschlüssel, QR-Codes …) sind verboten, freischalten muss über IAP. Ob ein Einladungscode, der **Bonus-Credits** schenkt, darunter fällt, ist eine Auslegungsfrage — Suno, Kling u. a. machen es in ihren Apps; Risiko gering, aber bei der Review-Notiz offen beschreiben (**UNGEPRÜFT**). Gekaufte Credits dürfen nicht verfallen.
  https://developer.apple.com/app-store/review/guidelines/

**UWG § 7 Abs. 2 Nr. 2 — Werbung per elektronischer Post** (umfasst E-Mail, SMS und nach OLG Hamm 03.05.2023, 18 U 154/22, auch Nachrichten über soziale Netzwerke/Messenger) nur mit **vorheriger ausdrücklicher Einwilligung**.
https://www.gesetze-im-internet.de/uwg_2004/__7.html · https://www.ra-plutte.de/zulaessigkeit-von-werbenachrichten-via-social-media/

**BGH, Urteil v. 12.09.2013 – I ZR 208/12 „Empfehlungs-E-Mail“:**
- Sachverhalt: Website-Funktion, über die Nutzer Dritten Empfehlungs-E-Mails schicken konnten; als **Absender erschien das Unternehmen**.
- Leitsatz: Wer diese Möglichkeit schafft, wird so behandelt, als hätte er die Werbe-E-Mail **selbst** unverlangt verschickt. Dass der Versand auf dem Willen eines Dritten beruht, ist für die Einordnung als Werbung **unerheblich** — solche Funktionen dienen erfahrungsgemäß dazu, auf das Unternehmen aufmerksam zu machen.
  https://medien-internet-und-recht.de/volltext.php?mir_dok_id=2508 · https://www.activemind.de/magazin/tell-a-friend-ist-spam-bgh-urteil-zu-freundschaftswerbung-datenschutz/
- **Was heißt das für uns?**
  - **App verschickt E-Mails/SMS an eingegebene Adressen (Server als Absender):** klar im Anwendungsbereich des Urteils → **nicht bauen.**
  - **Nutzer teilt über das iOS-Share-Sheet aus seinem eigenen WhatsApp/iMessage-Konto, wählt Empfänger selbst, Text editierbar:** Absender ist der Nutzer, wir sehen weder Empfänger noch Adresse. Das ist deutlich weiter vom BGH-Fall entfernt (dort: Unternehmen als Absender, Formular auf der Website). Ein höchstrichterliches Urteil speziell zum Share-Sheet habe ich **nicht** gefunden → **UNGEPRÜFT**. Die BGH-Begründung („Wille des Dritten unerheblich“, „im Interesse des Unternehmens bereitgestellt“) lässt sich theoretisch übertragen; Datenschutzpraktiker empfehlen deshalb (DSN-Blog 06.12.2020): Absender = Bestandskunde, keine Werbeinhalte, nur eine Empfehlung pro Empfänger, Häufigkeit begrenzen — und sehen **Anreize für den Werbenden** als risikoerhöhend.
    https://www.dsn-group.de/datenschutz-notizen/kunden-werben-kunden-ueber-den-zwiespalt-zwischen-genialer-werbeidee-und-beanstandungsrisiko-4427944
  - Laienwerbung mit Prämien ist an sich zulässig, unlauter erst bei Verschleierung des Werbecharakters oder unangemessener Beeinflussung. https://www.omsels.info/die-verbote-oder-was-darf-ich-nicht/4a-uwg-aggressive-geschaeftliche-handlungen/8laienwerbung
  - **Praktische Folgerungen:** nur Share-Sheet (kein Serverversand, kein Kontaktzugriff) · vorformulierter Text kurz, persönlich, editierbar, ohne Werbeversprechen („Ich habe meinen Traum als Film gesehen — hier kannst du’s ausprobieren: …“) · Prämie **nicht pro gesendeter Nachricht**, sondern nur für qualifizierte Einlösungen · Prämie eher beim Eingeladenen (prosozial) · keine Aufforderung „schick es an alle deine Kontakte“ · vor öffentlichem Launch anwaltlich prüfen lassen.

---

# Empfehlung

## Zum Launch (Freunde & Familie) bauen

1. **Einladungscode pro Nutzer + Share-Sheet** mit Link `https://<domain>/i/CODE` und editierbarem Text. Kein Kontaktzugriff, kein Serverversand.
2. **Landingpage auf eigener Domain** (von Bun ausgeliefert, ohne Cookies/Analytics): Code groß, „Code kopieren & App laden“, App-Store-Link mit `ct=invite` für die aggregierte Gesamtzahl.
3. **Universal Links** (`associatedDomains`, AASA, `+native-intent.tsx`) für schon installierte Apps.
4. **Onboarding-Schritt „Eingeladen?“** mit `ClipboardPasteButton` + manueller Eingabe + Überspringen; 7 Tage nachholbar.
5. **Server-Einlösung in Bun** mit den Tabellen `invite_codes` / `invite_redemptions`, Status `pending → qualified → rewarded / rejected`, Gutschrift nur übers Ledger mit Idempotenz-Schlüssel, RLS nur lesend.
6. **Prämie klein und prosozial:** Eingeladener **+11 Credits (1 Film)** bei erstem fertigem Film mit Sign-in-with-Apple-Konto; Einladender zunächst **+11 Credits** bei Qualifizierung, Deckel 5/Monat. Kosten im Beispiel ≈ $0,69 pro aktiviertem Neunutzer.
7. **DeviceCheck `bit0`** („Code auf diesem Gerät eingelöst“) — kleiner Aufwand, großer Schutz gegen Neuinstallations-Farming. Wenn das native Modul den F&F-Termin gefährdet: für F&F weglassen (kleiner, bekannter Kreis) und direkt danach nachziehen.
8. **Anzeige** für den Einladenden nur als Zähler/Status, keine Identitäten.

## Später (vor/nach öffentlichem Launch)

- **Stufe 2:** +33 Credits für den Einladenden nach erstem Kauf des Eingeladenen (7 Tage Wartezeit, Rückbuchung bei `REFUND`), lebenslanger Deckel.
- **App Attest** für alle kostenpflichtigen Endpunkte (Generierung, Einlösen), schrittweise ausgerollt; Risk-Metric bei Auffälligkeiten.
- **Missbrauchs-Dashboard:** Werber mit vielen Einlösungen und null Käufen, Codes sperren.
- **Befristung der Bonus-Credits** (z. B. 90 Tage) nach juristischer Prüfung; Bonus zuerst verbrauchen.
- **„Herkunfts-Erinnerung“** für Eingeladene (Referral Contagion).
- **A/B-Vergleich** prosozial (nur Freund) vs. zweiseitig, sobald die Nutzerzahl Aussagen erlaubt.
- **Anwaltliche Prüfung** UWG/DSGVO/AGB (Einladungsbedingungen, Verfall) vor öffentlichem Start.
- Optional, nur bei nachgewiesenem Bedarf: `detectPatterns`-Hinweis per eigenem Modul oder App Clip.

## Nicht bauen

- Branch, AppsFlyer, Adjust, Kochava, Detour (auf iOS probabilistisch/Fingerprinting → Konflikt mit Apple-Lizenzvertrag, Einwilligung nach TDDDG/DSGVO, Markenversprechen).
- E-Mail-/SMS-Versand an Freunde durch unseren Server, Kontaktlisten-Upload.
- Prämien bei Installation oder bloßer Registrierung.
