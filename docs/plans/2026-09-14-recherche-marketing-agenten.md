# Marketing-Agenten für Dream Rushes mit Hermes Agent: was sie können und wo die Grenzen liegen

Stand: 14.09.2026. Das ist eine Recherche, keine Rechtsberatung. Vor dem Launch sollte eine Anwältin/ein Anwalt für UWG, HWG und DSGVO drüberschauen.
Quellen stehen als Kürzel [H1], [G3] … im Text und am Ende als Liste mit URL und Datum.

**Legende für alle Regeln**
- **[GESETZ]** = Rechtspflicht (EU/DE/US). Ein Verstoß kann Abmahnung, Bußgeld oder Klage bedeuten.
- **[PLATTFORM]** = Regel von Google, Reddit, X usw. Ein Verstoß kann Sperre, Abwertung oder Entzug des API-Zugangs bedeuten.
- **[BEST PRACTICE]** = Empfehlung ohne Pflicht (Erfahrung, Risikominimierung).

---

## 0. Kurzfazit

1. **Hermes Agent kann das technisch alles:** Er ist ein Open-Source-Agent (MIT-Lizenz), aktuell **v0.21.2 vom 11.09.2026**. Er hat dauerhaftes Gedächtnis, eigene Skills im offenen SKILL.md-Standard, Cron-Jobs, Websuche, Browser, Terminal und Dateizugriff. Er läuft über Telegram, Discord, Slack und viele weitere Kanäle, mit mehreren getrennten Profilen parallel, auf VPS, in Docker oder bei Modal. [H1–H21]
2. **Das Risiko liegt nicht in der Technik, sondern im Einsatz.** Hermes bringt Werkzeuge mit, die für Marketing gefährlich sind: Cloud-Browser mit Stealth-Modus, Residential-Proxys und CAPTCHA-Lösung, dazu einen „Humanizer“-Skill und einen Skill, der Sperrseiten umgeht. Für Community-Arbeit sollten diese abgeschaltet sein. [H10, H23, H24]
3. **SEO-Agent:** Er darf recherchieren, Entwürfe schreiben, technisches SEO machen und interne Links setzen. **Veröffentlichen sollte er nicht selbst.** Gründe:
   - Google stuft massenhaft KI-generierte Seiten ohne Mehrwert als Spam ein („scaled content abuse“). [G1]
   - Die EU-KI-Verordnung verlangt ab **02.08.2026** eine KI-Kennzeichnung für Texte, die über Wissenschaft oder Gesundheit öffentlich informieren. Ausnahme: Ein Mensch hat den Text echt redaktionell geprüft und trägt die Verantwortung. [L10–L12]
4. **Community-Agent auf Reddit:** Nur beobachten und Antworten entwerfen. **Posten tut ein Mensch** von einem offen gekennzeichneten Gründer-Account. Gründe:
   - Reddit verlangt für jede Automatisierung eine Genehmigung, ein [App]-Label und getrennte Konten (seit März 2026 werden Bots gelabelt). Pro Tag entfernt Reddit rund 100.000 Bot-Konten. [R5, R8]
   - Wer als Unternehmer so tut, als sei er ein normaler Nutzer, begeht einen Verstoß, der **immer unzulässig** ist (UWG Anhang Nr. 22, EU-Richtlinie Anhang I Nr. 22). [L2, L9]
   - In Deutschland müssen automatisiert erstellte Beiträge von menschlich wirkenden Konten gekennzeichnet werden (§ 18 Abs. 3 Medienstaatsvertrag). [L7]
5. **Die Regeln der Subreddits r/Dreams, r/LucidDreaming, r/Dreamanalysis, r/DreamInterpretation und r/sleep konnte ich NICHT prüfen.** reddit.com ist für meine Recherche-Werkzeuge gesperrt. Anton muss sie vor jedem Beitrag selbst lesen (Checkliste in C.5).
6. **Wichtig für die Website:** Google hat von März 2025 bis August 2026 fünf Core-Updates und vier Spam-Updates ausgerollt. KI-Übersichten senken die Klickrate stark: laut Ahrefs etwa −58 % für Platz 1 bei Suchen mit AI Overview (Stand 12/2025). Klicks gibt es noch für eigene Daten, Erfahrung aus erster Hand, Video und Inhalte, die man nicht einfach zusammenfassen kann. [G7, G9–G12]
7. **Keine Heilversprechen.** Aussagen wie „hilft gegen Albträume“ oder „bessere Schlafqualität“ fallen unter das Heilmittelwerbegesetz (HWG). Gesundheitsthemen gelten bei Google außerdem als YMYL-Inhalte („Your Money or Your Life“) und werden strenger bewertet. [L8, G5]

---

## A. Hermes Agent (Nous Research)

### A.1 Eckdaten

| Punkt | Stand | Quelle |
|---|---|---|
| Aktuelle Version | **v0.21.2** („The state.db Patch Release“), Tag `v2026.9.11`, erschienen 11.09.2026. Behebt Datenbankprobleme aus v0.21.0 und härtet die Trennung mehrerer Profile. | [H2, H4] |
| Letztes Feature-Release | **v0.21.0 „The Pantheon Release“**, 31.08.2026. Neu: Bot Mode in der Desktop-App, Bot-zu-Bot-Nachrichten über `hermes peer`, Cron-Jobs mit Gedächtnis und Kontinuität, Subagenten lassen sich live steuern, MCP-Kommandozentrale, der Agent bedient den Browser der Desktop-App, sechs neue Modellanbieter. | [H3] |
| Historie | Repository angelegt am 22.07.2025, erstes öffentliches Release v0.2.0 am 12.03.2026. Laut GitHub-API am 14.09.2026 rund 245.000 Sterne. | [H1, H2] |
| Lizenz und Kosten | MIT. Die Software ist kostenlos, bezahlt werden nur das Sprachmodell und optionale Tool-APIs. Nach eigener Aussage sammelt Hermes keine Telemetrie. | [H19] |
| Installation | Shell-Installer für Linux, macOS und WSL2, PowerShell für Windows, Docker-Image `nousresearch/hermes-agent`. | [H1, H17] |
| Offizielle Links | GitHub: https://github.com/NousResearch/hermes-agent · Doku: https://hermes-agent.nousresearch.com/docs/ | |

### A.2 Fähigkeiten

**Dauerhaftes Gedächtnis** [H5, H3]
- Zwei Dateien unter `~/.hermes/memories/`:
  - `MEMORY.md`: Notizen des Agenten, maximal etwa 2.200 Zeichen.
  - `USER.md`: Profil des Nutzers, maximal etwa 1.375 Zeichen.
- Beide werden beim Sitzungsstart als fester Stand in den System-Prompt geladen.
- Alle Sitzungen liegen in einer SQLite-Datenbank (`~/.hermes/state.db`) mit Volltextsuche (`session_search`).
- Acht externe Gedächtnis-Anbieter lassen sich zusätzlich anbinden, z. B. Honcho, Mem0, Hindsight.
- Seit v0.21.0 laden und aktualisieren auch Cron-Jobs das Gedächtnis.
- Abschalten: `memory_enabled: false` und `user_profile_enabled: false`.

**Skills** [H6, H26, H3]
- Ein Skill ist ein Ordner mit einer `SKILL.md`: YAML-Kopf (`name`, `description`, `version`, optional `platforms` und `metadata.hermes`), dazu optional `references/`, `scripts/`, `templates/`, `assets/`.
- Hermes ist ausdrücklich **kompatibel mit dem offenen Standard von agentskills.io**. Anthropic hat den Standard ursprünglich entwickelt, heute wird er u. a. von Claude Code, Codex, Cursor und Gemini CLI unterstützt.
- Skills werden stufenweise geladen: erst nur Name und Beschreibung, der volle Text erst bei Bedarf.
- Speicherorte: `~/.hermes/skills/`, außerdem im Projekt `.hermes/skills/` oder `.agents/skills/`.
- **Der Agent schreibt und ändert eigene Skills selbst** (Werkzeug `skill_manage`).
  - Mit `skills.write_approval: true` landen Änderungen erst in einer Warteschlange zur Freigabe.
  - Seit v0.21.0 brauchen Schreibzugriffe auf AGENTS.md, Skills und Gedächtnis immer eine Freigabe.
- Es gibt einen Skills-Hub (u. a. skills.sh, openai/skills, anthropics/skills). Skills aus dem Hub durchlaufen vor der Installation einen Sicherheitsscanner.

**Geplante Aufgaben (Cron)** [H7, H3]
- Anlegen per natürlicher Sprache, mit `/cron add` oder `hermes cron create "every 2h" "…" --skill <name>`.
- Zeitangaben: `every 1h`, `weekdays at 9am`, klassische Cron-Ausdrücke oder ISO-Zeitpunkte.
- Das Gateway prüft jede Minute, ob ein Job fällig ist, und startet ihn in einer eigenen Sitzung.
- Ablage: Jobs in `~/.hermes/cron/jobs.json`, Ergebnisse unter `~/.hermes/cron/output/`.
- Ergebnisse gehen an ein Ziel (`deliver:`), z. B. Telegram, Discord, Slack, E-Mail, `local` oder `all`.
- Ein Cron-Job kann keine weiteren Cron-Jobs anlegen.
- Seit v0.21.0 zusätzlich:
  - Gedächtnis und `continuity=true`: Ein Lauf kennt die Ergebnisse des vorigen.
  - Ein dauerhafter Notizzettel pro Job.
  - Monitor-Modus: Ändert sich nichts, wird das Sprachmodell gar nicht erst aufgerufen. Das spart Kosten.

**Werkzeuge** [H8, H9, H10]
- **Websuche und Seitenabruf** (`web_search`, `web_extract`):
  - Anbieter: Firecrawl (Standard), SearXNG, Brave, DuckDuckGo, Exa, Parallel, Tavily, Perplexity, Keenable, xAI.
  - Ohne eigenen Schlüssel rotiert Hermes durch kostenlose Kontingente.
  - Treffer werden zwischengespeichert.
- **Browser** (`browser_navigate`, `browser_snapshot`, `browser_vision`):
  - Lokal: eigenes Chromium, oder Anbindung an das eigene Chrome, Brave oder Edge.
  - Cloud: Browser Use, Browserbase oder Firecrawl.
  - Camofox: lokaler Browser, der den Browser-Fingerabdruck verschleiert.
  - **Browser Use Cloud hat laut Doku Stealth-Modus, Residential-Proxys und CAPTCHA-Lösung standardmäßig an.**
- **Terminal und Dateien:** `terminal`, `read_file`, `write_file`, `patch`, `execute_code`.
- **Weitere:** Bildanalyse, Bilderzeugung, Sprachausgabe, Subagenten (`delegate_task`, seit v0.21 bis zu 10 parallel), MCP-Server, X-Suche über xAI (standardmäßig aus).
- Werkzeuggruppen lassen sich pro Profil oder Plattform an- und abschalten: `hermes tools` oder `--toolsets "web,file"`.

**Messaging-Gateways** [H11]
- Über 20 Kanäle, darunter Telegram, Discord, Slack, WhatsApp, Signal, SMS, E-Mail, Matrix, Mattermost, Microsoft Teams, Google Chat und LINE.
- Läuft als Hintergrunddienst (systemd unter Linux, launchd unter macOS).
- Standardmäßig wird jeder Nutzer abgewiesen, der nicht auf einer Allowlist steht oder per DM-Pairing freigeschaltet ist.
- Pro Kanal lassen sich eigenes Modell und eigener Prompt einstellen.

**Persona und Anweisungen** [H12, H13, H14]
- `~/.hermes/SOUL.md`: Identität, Ton und Stil. Steht an erster Stelle im System-Prompt und wird auf Prompt-Injection geprüft.
- `AGENTS.md`: projektbezogene Anweisungen.
  - Reihenfolge, der erste Treffer gewinnt: `.hermes.md` → `AGENTS.override.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`.
  - In Git-Repos werden alle AGENTS.md vom Wurzelverzeichnis bis zum Arbeitsordner zusammengeführt.
- `config.yaml`: Modell, Werkzeuge, Freigaben, Gedächtnis, Terminal-Backend, Budgets.
- `.env`: nur Geheimnisse.
- `/personality`: vorgefertigte Rollen für eine Sitzung.

**Mehrere Agenten parallel** [H15, H16, H3, H4]
- Ein Profil ist ein eigenes Hermes-Verzeichnis mit eigener `config.yaml`, `.env`, `SOUL.md`, Gedächtnis, Skills, Cron-Jobs und Datenbank.
- `hermes profile create seo` legt es an, danach gibt es den Befehl `seo chat`.
- **Die Doku warnt:** Nie zwei Agenten-Prozesse auf dasselbe Profil zeigen lassen.
- Bot Mode in der Desktop-App: Namensliste der Bots, Gruppenchats, @-Erwähnungen.
- `hermes peer`: Bot-zu-Bot-Nachrichten, auch über Rechnergrenzen.
- Ein gebündeltes Gateway kann mehrere Profile bedienen.
- v0.21.2 schließt Lücken, durch die ein Profil Allowlists oder Geheimnisse eines anderen erben konnte.

**Hosting** [H28, H17, H14, H21]
- Überall lauffähig: lokal (macOS, Linux, WSL2, Windows, Android/Termux), laut README auf einem „$5 VPS“, im GPU-Cluster oder serverlos.
- Docker: `docker run … nousresearch/hermes-agent gateway run`, Daten unter `/opt/data`.
- Terminal-Backends für die Befehlsausführung: `local`, `docker`, `ssh`, `singularity`, `modal`, `daytona`, `vercel_sandbox`. Modal und Daytona schlafen, wenn nichts zu tun ist, und wachen bei Bedarf auf.
- **Hermes Cloud**: gehostete Instanzen über das Nous Portal.
- Tipp aus der Doku: Befehle nicht über Browser-Konsolen von VPS-Anbietern (z. B. Hetzner) einfügen, sondern per SSH. Die Konsolen verfälschen Sonderzeichen.

**Modellanbieter** [H19, H20, H3]
- Nous Portal: ein Abo für über 300 Modelle plus „Tool Gateway“ mit Websuche, Bildern, Sprachausgabe und Cloud-Browser.
- Direkt: OpenRouter, OpenAI, Anthropic, Google (Gemini, Vertex), AWS Bedrock, Azure Foundry, xAI, z.ai/GLM, Kimi, MiniMax.
- Lokal: Ollama, vLLM, llama.cpp, SGLang oder jeder OpenAI-kompatible Endpunkt.
- Seit v0.21: u. a. Meta Model API und Nebius.
- Das Modell braucht mindestens 64.000 Tokens Kontextfenster.
- Hermes warnt, wenn ein gewähltes Modell mit den eigenen Daten trainiert wird. Das ist relevant, wenn Traumtexte oder Reddit-Inhalte durch das Modell laufen.

**Kosten** [H19, H27, H14, H3]
- Software: 0 €.
- VPS: laut Hostinger etwa 4–25 $ pro Monat. Hostinger verkauft selbst VPS, hat also Eigeninteresse. Stand 06.08.2026.
- Sprachmodell: grob 2–10 $ pro Monat bei wenig Nutzung, 40–60 $ und mehr bei viel Nutzung mit Premium-Modellen (gleiche Quelle).
- Nous-Portal-Abos laut derselben Quelle: Free 0 $, Plus 20 $, Super 100 $, Ultra 200 $ pro Monat, mit 22, 110 bzw. 220 $ Guthaben. **Vor Abschluss auf portal.nousresearch.com prüfen**, die Seite war für mich nicht abrufbar.
- Was die Kosten treibt: häufige Cron-Läufe, lange Kontexte, Subagenten, Browser mit Bildanalyse.
- Was dagegen hilft:
  - `agent.max_turns` (Obergrenze für Schritte).
  - `agent.run_budget_seconds` (Zeitlimit pro Lauf).
  - Günstiges Nebenmodell für die Kontext-Komprimierung (`auxiliary.compression`).
  - Monitor-Modus bei Cron-Jobs.
  - Web-Cache.
  - Kostenanzeige im Desktop.

### A.3 Sicherheit [H18, H3, H4]
- **Freigabe gefährlicher Befehle:**
  - `approvals.mode` kennt `smart` (Standard: ein Hilfsmodell schätzt das Risiko ein), `manual` und `off` (entspricht `--yolo`).
  - In Cron-Jobs, Einzelabfragen und unbeaufsichtigten Webhook- oder API-Sitzungen gilt standardmäßig `deny`.
  - Eine feste Sperrliste gilt immer, z. B. für `rm -rf /`.
  - Eigene Sperrmuster über `approvals.deny`.
- **Achtung:** Bei Container-Backends (Docker, Modal usw.) prüft Hermes gefährliche Befehle **nicht**. Der Container gilt dann selbst als Schutzgrenze.
- Docker wird gehärtet gestartet (alle Linux-Rechte entzogen, Prozesslimit, begrenztes /tmp).
- Geschützte Pfade wie `.env`, `~/.ssh` und `auth.json` sind immer gesperrt. `HERMES_WRITE_SAFE_ROOT` beschränkt Schreibzugriffe auf bestimmte Ordner.
- Gateway: Standard ist Ablehnen, dazu Allowlists und DM-Pairing mit Rate-Limit. Die Doku empfiehlt ausdrücklich, nie `GATEWAY_ALLOW_ALL_USERS=true` zu setzen.
- `security.website_blocklist` sperrt Domains. SSRF-Schutz gegen interne Netzadressen ist immer aktiv.
- Kontextdateien wie AGENTS.md und SOUL.md werden auf Prompt-Injection geprüft. Für Pakete gibt es Warnungen zu bekannten Supply-Chain-Angriffen.
- **v0.21.2 bringt einen Passwort-Tresor:** Der Agent kann sich über 1Password, Bitwarden oder einen eigenen Tresor anmelden und bezahlen, ohne das Passwort zu sehen. **Für Marketing-Agenten nicht anbinden.**

### A.4 Befunde, die für Marketing wichtig sind
- **`reddit-reading`** [H22]
  - Optionaler Skill, nur Lesen: Er postet nicht, stimmt nicht ab und meldet sich nicht an.
  - Liest standardmäßig die öffentlichen RSS-Feeds von Reddit, etwa eine Anfrage pro Minute pro IP.
  - Laut Skill blockiert Reddit normale Abrufe von Server-IPs mit Fehler 403 oder einer „Prove your humanity“-Seite.
  - Mit App-Zugangsdaten sind etwa 100 Anfragen pro Minute möglich.
  - **Aber:** Neue App-Zugangsdaten gibt es seit November 2025 nur noch nach Genehmigung, und kommerzielle Nutzung braucht eine schriftliche Freigabe (siehe C.2).
- **`humanizer`** (Standard-Skill): entfernt typische KI-Merkmale aus Texten. Für den Schreibstil im eigenen Blog ist das in Ordnung. **Er darf aber nicht dazu dienen, KI-Herkunft zu verschleiern, wo eine Kennzeichnung nötig ist.** Reddit verbietet KI-Inhalte, die sich als menschlich ausgeben (siehe C.1). [H23]
- **`blocked-page-recovery`** (Standard-Skill): holt gesperrte Seiten über Wayback Machine, archive.today, Jina Reader oder den Browser. **Für Reddit und kostenpflichtige Studien abschalten.** Sonst drohen Umgehung von Plattformsperren und Urheberrechtsprobleme. [H24]
- **Cloud-Browser mit Stealth, Residential-Proxys, CAPTCHA-Lösung und Camofox:** Genau diese Signale suchen Reddit, X und TikTok, um Bot-Netze zu erkennen. Für Social Media nie verwenden. [H10]
- **Veröffentlichungs-Skills:** `publish-site` veröffentlicht versioniert auf GitHub, Cloudflare oder Netlify Pages. Für WordPress.com gibt es einen offiziellen MCP-Eintrag mit Beiträgen, Entwürfen und Statistiken. **Nur mit Entwurfsrechten einrichten.** [H3, H25]
- **`social-media-content-calendar`** (optional) und `xurl` (X-API) gibt es als Skills. [H3]

### A.5 Was „Hermes“ sonst noch heißen kann
- **Hermes-Sprachmodelle von Nous Research** (z. B. Hermes-4-70B und -405B): die Modellfamilie, nicht der Agent. [H20]
- **Hermes JavaScript-Engine von Meta:** die Standard-Engine in React Native. Falls die iOS-App mit React Native oder Expo gebaut wird, taucht dort „Hermes“ auf, hat aber nichts mit dem Agenten zu tun.
- **OpenClaw:** ein ähnlicher, eigenständiger Agent. Hermes kann dessen Einstellungen übernehmen (`hermes claw migrate`). [H28]

---

## B. Google Search: Regeln für einen Agenten, der laufend Blogartikel liefert

### B.1 Spam-Richtlinien (Seite zuletzt aktualisiert 28.08.2026) [G1, G2, G3]
Google hat diese drei Regeln am **05.03.2024** eingeführt. [G2]

- **Scaled content abuse (Masseninhalte):**
  - Gemeint sind viele Seiten, die vor allem Rankings manipulieren sollen und Nutzern nichts bringen.
  - Egal ob per Automatisierung, von Menschen oder gemischt erstellt.
  - Beispiele von Google: mit generativer KI viele Seiten ohne Mehrwert erzeugen, fremde Inhalte abgreifen und leicht umschreiben oder übersetzen, Inhalte mehrerer Seiten ohne eigenen Beitrag zusammenstückeln, mehrere Websites betreiben, um die Masse zu verschleiern.
  - **Typisches Risiko für Dream Rushes:** ein automatisch erzeugtes „Traumsymbol-Lexikon“ mit Hunderten KI-Seiten.
- **Site reputation abuse („Parasite SEO“):**
  - Fremdinhalte werden auf einer etablierten Domain veröffentlicht, um deren Ranking-Stärke zu nutzen. Das gilt auch für Freelancer oder White-Label-Dienste ohne echte Einbindung in die Redaktion.
  - **Neu ab 30.08.2026:** Innerhalb des EWR gibt es dafür keine manuellen Maßnahmen mehr, auf Druck der EU-Kommission im Rahmen des Digital Markets Act. Google trennt den betroffenen Bereich dort nur noch intern von der übrigen Seite. Außerhalb des EWR bleibt es bei manuellen Maßnahmen.
  - **Für Dream Rushes relevant**, wenn gekaufte Gastbeiträge auf großen Schlaf-Portalen erwogen werden, v. a. für Reichweite in den USA.
- **Expired domain abuse:** Abgelaufene Domains kaufen, um deren früheres Ansehen für dünne Inhalte zu nutzen.
- **Folgen:** manuelle Maßnahme mit Meldung in der Search Console und Möglichkeit zum Überprüfungsantrag, oder algorithmische Abwertung.

### B.2 KI-Inhalte, hilfreiche Inhalte, E-E-A-T [G4, G5, G6]
- **KI ist erlaubt, wenn sie echten Mehrwert schafft** (Seite „Using gen AI content“, aktualisiert 10.12.2025).
  - Genauigkeit gilt auch für Titel, Meta-Beschreibungen, strukturierte Daten und Alt-Texte.
  - Google empfiehlt, Lesern zu erklären, wie ein Inhalt entstanden ist.
  - KI-Bilder im E-Commerce brauchen IPTC-Metadaten (`DigitalSourceType` = `TrainedAlgorithmicMedia`).
- **Hilfreiche Inhalte** (aktualisiert 10.12.2025). Warnzeichen für Inhalte, die für Suchmaschinen statt für Menschen gemacht sind:
  - viele Themen mit starker Automatisierung abdecken,
  - auf eine bestimmte Wortzahl hinschreiben,
  - Datum ändern ohne echte Überarbeitung,
  - Trendthemen ohne Bezug zum eigenen Publikum.
- **„Wer, wie, warum“:**
  - Wer: Autorenzeile mit Link auf echte Autorenseite.
  - Wie: Einsatz von KI oder Automatisierung offenlegen.
  - Warum: um Menschen zu helfen, nicht um Rankings zu manipulieren.
- **E-E-A-T** (Erfahrung, Expertise, Autorität, Vertrauenswürdigkeit) zählt bei YMYL-Themen besonders. Dazu gehört Gesundheit, also auch Schlaf, Albträume und psychische Themen.
- **Richtlinien für Qualitätsbewerter:**
  - Januar 2025: Seiten, deren Hauptinhalt überwiegend KI-generiert ist und kaum eigenen Beitrag zeigt, können die niedrigste Bewertung bekommen.
  - 11.09.2025: kleinere Präzisierungen zu YMYL und Beispiele für AI Overviews.
  - Die Bewertungen beeinflussen Rankings nicht direkt, zeigen aber, wohin Google will.

### B.3 Ranking-Updates 2025–2026 (Google Search Status Dashboard) [G7]
| Update | Zeitraum |
|---|---|
| March 2025 core update | 13.–27.03.2025 |
| June 2025 core update | 30.06.–17.07.2025 |
| August 2025 spam update | 26.08.–22.09.2025 |
| December 2025 core update | 11.–29.12.2025 |
| February 2026 Discover update | 05.–27.02.2026 |
| March 2026 spam update | 24.03.2026 |
| March 2026 core update | 27.03.–08.04.2026 |
| May 2026 core update | 21.05.–02.06.2026 |
| June 2026 spam update | 24.–26.06.2026 |
| August 2026 spam update | 18.–21.08.2026 |

Auf der Google I/O am 19.05.2026 wurde AI Mode weiter ausgebaut und „Information Agents“ angekündigt, die das Web im Hintergrund beobachten. Konkrete Änderungen am Ranking wurden nicht genannt. [G13]

### B.4 AI Overviews und AI Mode: Was das für Klicks bedeutet
- **Pew Research** (22.07.2025): Erscheint eine KI-Zusammenfassung, klicken Nutzer nur in 8 % der Suchen auf einen normalen Treffer, sonst in 15 %. Auf Quellen innerhalb der Zusammenfassung klicken sie nur in etwa 1 %. [G10]
- **Ahrefs** (04.02.2026, Daten von 12/2025): Die Klickrate von Platz 1 sinkt bei AI Overview um etwa 58 %. Im April 2025 waren es noch 34,5 %. [G11]
- **Seer Interactive** (April 2026; 53 Marken, Daten 01/2025–02/2026):
  - Organische Klickrate bei Suchen mit AI Overview: Tiefpunkt 1,3 % im Dezember 2025, dann Erholung auf 2,4 % im Februar 2026.
  - Ohne AI Overview: 3,8 %.
  - Marken, die im AI Overview zitiert werden, bekommen etwa 120 % mehr Klicks pro Impression als nicht zitierte. Sie liegen aber immer noch unter dem Niveau von Suchen ohne AI Overview.
  - Ursache und Wirkung lassen sich laut Seer nicht sicher trennen. [G12]
- **Google selbst** (Liz Reid, 06.08.2025): Die organischen Klicks insgesamt seien stabil, die Klickqualität leicht höher. Gewinner seien Foren, Videos, Podcasts, Erfahrungen aus erster Hand, gründliche Tests und eigene Perspektiven. [G9]
- **Googles Empfehlung für KI-Suche** (Mai 2025): einzigartige, nicht austauschbare Inhalte, gute Seitenerfahrung, saubere Technik, strukturierte Daten, Bilder und Videos. Besondere Optimierung für KI-Features sei nicht nötig. [G8]
- **Folgerung für die Wissenskarten (Best Practice):** Eine reine Studienzusammenfassung beantwortet ein AI Overview selbst. Klicks bringen eher:
  - eigene, anonymisierte und aggregierte App-Daten (nur mit Einwilligung und DSGVO-konform),
  - Interviews mit Fachleuten,
  - erklärende Visualisierungen oder Traumfilme,
  - Werkzeuge und Vorlagen (z. B. für ein Traumtagebuch),
  - die Perspektive der Gründer.

### B.5 Praxis: sichere Veröffentlichungsfrequenz und Freigabeprozess
- **Google nennt keine Frequenz.** John Mueller hat gesagt, regelmäßiges Veröffentlichen sei kein Rankingfaktor (Zweitquelle [G14]). Gefährlich ist Masse ohne Mehrwert. **[PLATTFORM]**
- **Empfohlener Ablauf [BEST PRACTICE]:**
  1. Agent erstellt ein Briefing mit Suchintention, Lücken bestehender Inhalte und Liste der Primärstudien.
  2. Agent schreibt Gliederung und Entwurf mit Zitaten (DOI oder PubMed-Link).
  3. Automatische Prüfungen: Funktionieren alle Links und DOIs? Wurde die Studie zurückgezogen? Stehen Heilversprechen oder Diagnose-Aussagen drin? Doppelt sich der Text mit bestehenden Seiten?
  4. **Eine fachkundige Person prüft den Inhalt**, nicht nur Rechtschreibung.
  5. Die verantwortliche Person gibt frei, z. B. durch Merge eines Pull Requests.
  6. Veröffentlichen.
  7. Search Console beobachten.
- **Frequenz für eine neue Domain [BEST PRACTICE]:**
  - Mit 1 gründlichen Beitrag pro Woche starten, dazu bestehende Karten aktualisieren.
  - Erst auf 2–3 pro Woche gehen, wenn jede einzelne Freigabe weiter wirklich stattfindet.
  - Nie mehr veröffentlichen, als realistisch geprüft werden kann.
- **Übersetzungen [PLATTFORM + BEST PRACTICE]:** DE und EN mit `hreflang` verknüpfen [G15]. Keine automatische Massenübersetzung ohne Prüfung: Übersetzen ohne eigenen Mehrwert nennt Google ausdrücklich als Beispiel für Masseninhalte.

---

## C. Reddit

Hinweis zur Quellenlage: redditinc.com und reddit.com waren für meine Werkzeuge gesperrt. Die sitewide Regeln habe ich über das offizielle Reddit Help Center (support.reddithelp.com) gelesen. Die Einzelartikel dort spiegeln die Reddit Rules.

### C.1 Regeln für alle Nutzer
- **Spam** (aktualisiert 19.05.2026) [R1]
  - Spam heißt: wiederholte oder unerwünschte Aktionen, automatisiert oder von Hand. Ist nie erlaubt.
  - Beispiele von Reddit: massenhaft gleiche Beiträge für Reichweite oder Geld; viele Nutzer markieren oder massenhaft ungefragte Chat-Nachrichten schicken; **Werkzeuge wie Bots oder generative KI, die Spam fördern**.
  - Hinweis an Unternehmer: Wer vor allem Links zum eigenen Geschäft postet, soll mit der Häufigkeit zurückhaltend sein oder Werbung buchen.
  - Die Moderatoren jeder Community entscheiden selbst, was dort als Spam gilt.
- **Communities stören** (19.05.2026) [R2]
  - Verboten: Stimmen manipulieren (mit mehreren Konten, Diensten, Automatisierung oder abgesprochenen Gruppen), Karma automatisiert erhöhen, Sperren mit Zweitkonten umgehen.
  - Auch ein Warnsignal: in vielen Communities zum selben Thema gemeldet oder gebannt werden.
- **Identitätstäuschung** (19.05.2026) [R3]
  - Anonym bleiben ist erlaubt.
  - **Falsche Angaben über die eigene Identität oder Zugehörigkeit sind verboten.**
  - Ebenso verboten: sich als Person oder Organisation ausgeben, die es gar nicht gibt.
  - **Eine erfundene Persona wie „Lisa, 34, Klarträumerin“ fällt darunter.**
- **Manipulierte Inhalte und KI** (19.05.2026) [R4]
  - KI-Inhalte sind grundsätzlich erlaubt, im Rahmen der Community-Regeln.
  - **Verboten sind KI-Inhalte, die sich als von Menschen verfasst ausgeben.**
  - Wer erlaubte KI-Inhalte postet, soll das offen kennzeichnen, z. B. mit einem Tag.
- **Mehrere Konten** sind erlaubt, dürfen aber nie für dieselben Beiträge abstimmen. [R18]

### C.2 API, Bots, kommerzielle Nutzung
- **Responsible Builder Policy** (aktualisiert 05.06.2026) [R5]
  - **Jeder Zugriff auf Reddit-Daten über die API braucht vorher eine ausdrückliche Genehmigung.**
  - Man darf nicht verschleiern, wie oder warum man zugreift. Mehrere Konten oder Anträge für denselben Zweck sind verboten. Limits dürfen nicht umgangen werden.
  - **Kommerzielle Nutzung von Reddit-Daten braucht eine schriftliche Freigabe.** Das umfasst Werbe-Targeting und KI-Training.
  - Regeln für Bots, KI-Agenten und nicht von Menschen bediente Konten:
    - Entwicklerprofil anlegen, dann gibt es das **App-Label**. Von Reddit gesetzte Labels dürfen nicht umgangen werden.
    - Klarer Zweck, nur die Subreddits und Aktionen, die wirklich nötig sind.
    - **Private Nachrichten nur mit ausdrücklicher Zustimmung des Empfängers.**
    - **Das App-Konto nur für App-Funktionen nutzen, keine Mischkonten.**
    - Kein Spam per Beitrag, Kommentar oder DM, auch keine gleichen oder sehr ähnlichen Texte in mehreren Subreddits.
  - **Null Toleranz**, wenn aus Daten sensible Merkmale einzelner Nutzer abgeleitet werden (z. B. Gesundheit) oder Nutzer de-anonymisiert werden.
  - Mögliche Folgen: Token-Entzug, Sperre von App, Konten, Domains oder Subreddits.
- **Seit 11.11.2025 kein Selbstbedienungszugang mehr:** Neue OAuth-Apps gibt es nur nach manueller Prüfung. Laut Entwicklerberichten dauert das Wochen und wird oft abgelehnt (Zweitquellen [R7]).
- **Data API Wiki** (11.05.2026) [R6]
  - Nur mit registriertem OAuth.
  - Eindeutiger User-Agent; über den User-Agent darf man nie lügen.
  - Limit: 100 Anfragen pro Minute pro Client.
  - Gelöschte Inhalte und Konten muss man ebenfalls löschen. Reddit empfiehlt, gespeicherte Daten routinemäßig nach 48 Stunden zu löschen.
- **Bot-Labels und Menschlichkeits-Prüfung**
  - CEO Steve Huffman hat am **25.03.2026** angekündigt:
    - Ab 31.03.2026 tragen erlaubte automatisierte Konten auf dem Profil das Label [App] bzw. „Developer Platform App“.
    - Konten mit Bot-Verdacht müssen nachweisen, dass ein Mensch dahintersteht (Passkeys, Face ID, eventuell externe Anbieter wie World ID). Reddit soll dabei die Identität nicht erfahren.
    - Nicht gelabelte automatisierte Konten können eingeschränkt oder gelöscht werden.
    - Reddit entfernt täglich etwa 100.000 Konten.
    - KI-Hilfe beim Schreiben durch echte Menschen will Reddit nicht verfolgen. Es geht darum, dass ein Mensch hinter dem Konto steht. [R8]
  - **Vorgeschichte:** Forschende der Uni Zürich ließen von November 2024 bis März 2025 verdeckt KI-Bots in r/changemyview posten, über 1.700 Kommentare, teils mit erfundenen Identitäten wie Trauma-Beraterin. Reddit nannte das moralisch und rechtlich falsch und schickte formale rechtliche Forderungen. Die Studie wurde nicht veröffentlicht (Berichte 28.–30.04.2025). [R9] **Lehre: KI-Personas in sensiblen Themen führen zu Sperren und rechtlichen Schritten.**

### C.3 Regeln speziell für Unternehmen (Reddit Pro)
- **Reddit Pro** ist kostenlos und in der Beta. Laut Reddit ist es in allen englischsprachigen Ländern verfügbar, in denen Reddit aktiv ist. **Ob eine deutsche Firma teilnehmen kann, muss geprüft werden.** [R11]
- **Regeln für Unternehmen** (FAQ, 08.05.2025) [R10]:
  - Offen sagen, welche Marke man vertritt.
  - **Nie so tun, als gehöre das Konto einer anderen Marke oder einem normalen Nutzer.**
  - Keine Nutzer enttarnen und keine Profile einzelner Nutzer anlegen.
  - Community-Regeln einhalten.
  - Kritiker nicht bedrängen, **keine Anreize für positive Beiträge**.
- **Trends** (28.05.2026): offizielles Keyword-Monitoring. Zeigt, wo und wie über Begriffe gesprochen wird, mit KI-Zusammenfassung und passenden Communities. **Das ist der saubere Weg zum Beobachten, statt eigener Scraper.** [R12]
- **Brand-Affiliate-Tag** (Artikel vom 22.02.2024): markiert Beiträge mit kommerziellem Hintergrund. Reddit weist darauf hin, dass Nutzer selbst für gesetzlich nötige Offenlegungen verantwortlich sind. [R13]
- **Verifizierte Profile** (09.07.2026): grauer Haken für Unternehmen mit Reddit Pro, öffentliche Beta, kostenlos. Bestätigt nur die Identität, keine Vorteile bei Ranking oder Moderation. [R14]

### C.4 Warum Konten „unsichtbar“ werden (Shadowban)
- **Offiziell** [R15–R17]:
  - Werden Beiträge, Kommentare, Chats und Profil nicht mehr wie erwartet angezeigt, wurde das Konto womöglich als Spam oder unecht markiert. Dagegen gibt es ein Einspruchsformular.
  - Konten können auch gesperrt werden, weil sie **mit anderen, wegen Spam gesperrten Konten in Verbindung gebracht werden**.
  - Moderatoren können einen **Reputationsfilter** einschalten. Er beruht auf dem Contributor Quality Score, der Karma, Verifizierung und weitere Kontosignale auswertet. Neue oder auffällige Konten werden dann vorab ausgefiltert.
- **Typische Auslöser** (Erfahrungswerte, keine offizielle Liste) **[BEST PRACTICE]**:
  - neues Konto mit wenig Karma postet sofort Links,
  - derselbe Link oder Text in mehreren Subreddits,
  - viele Kommentare in kurzer Zeit,
  - Rechenzentrums-, VPN- oder Proxy-IPs, Stealth-Browser,
  - mehrere Konten auf derselben Infrastruktur,
  - Stimmen durch Team-Konten,
  - gleiche Muster in Formulierungen,
  - Meldungen in mehreren Communities,
  - Nicht-API-Automatisierung über die Website.

### C.5 Die Dream- und Sleep-Subreddits: NICHT geprüft
r/Dreams, r/LucidDreaming, r/Dreamanalysis, r/DreamInterpretation und r/sleep: Weder reddit.com noch Suchmaschinen-Snippets oder Drittanbieter (GummySearch, reddapi) lieferten die Regeltexte. Ich stelle bewusst keine Vermutungen als Fakten dar.

**Checkliste für Anton, einmal pro Subreddit, danach monatlich neu:**
1. Sidebar „Rules“, Wiki und angepinnte Beiträge lesen, Screenshot mit Datum ablegen.
2. Ist Eigenwerbung erlaubt, nur in Sammelthreads, nur mit Freigabe durch Moderatoren oder gar nicht?
3. Sind Links zu Apps oder Websites erlaubt? Gibt es Mindestwerte für Karma oder Kontoalter?
4. Sind KI-Inhalte oder KI-Bilder erlaubt oder verboten? Sind Traumdeutung durch KI oder KI-Tools ausdrücklich verboten?
5. Sind medizinische Ratschläge verboten? Das ist gerade für r/sleep wahrscheinlich relevant, aber unbestätigt.
6. Im Zweifel die Moderatoren per Modmail fragen: „Wir sind die Gründer von X. Dürfen wir …?“ Die Antwort dokumentieren.
7. Die Ergebnisse als Skill-Referenz ablegen, z. B. `skills/community/references/subreddit-rules.md`, mit Datum. Der Agent liest nur diese Datei. Ein Mensch aktualisiert sie.

---

## D. Recht: verdecktes Marketing durch Bots und KI

### D.1 EU: Richtlinie über unlautere Geschäftspraktiken (UGP-RL 2005/29/EG), Anhang I („immer unlauter“) [L9]
- **Nr. 11 („Advertorial“):** Redaktionelle Inhalte werden zur Verkaufsförderung eingesetzt und vom Unternehmer bezahlt, ohne dass das für Verbraucher klar erkennbar ist.
- **Nr. 22:** Fälschlich behaupten oder den Eindruck erwecken, man handle nicht als Unternehmer, **oder sich als Verbraucher ausgeben**.
- Nr. 23b und 23c (Bewertungen) kamen mit der Omnibus-Richtlinie (EU) 2019/2161 hinzu.
- Leitlinien der Kommission (2021/C 526/01, Abschnitt 4.2.6): Influencer-Marketing und Kennzeichnung kommerzieller Absicht in sozialen Medien, u. a. nach Art. 7 Abs. 2.

### D.2 Deutschland
- **§ 5a Abs. 4 UWG** [L1], Wortlaut: „Unlauter handelt auch, wer den kommerziellen Zweck einer geschäftlichen Handlung nicht kenntlich macht, sofern sich dieser nicht unmittelbar aus den Umständen ergibt, und das Nichtkenntlichmachen geeignet ist, den Verbraucher oder sonstigen Marktteilnehmer zu einer geschäftlichen Entscheidung zu veranlassen, die er andernfalls nicht getroffen hätte.“
  → **Ein Gründer, der die eigene App empfiehlt, handelt geschäftlich und muss das kenntlich machen.**
- **Anhang zu § 3 Abs. 3 UWG** („stets unzulässig“) [L2]:
  - **Nr. 11** (als Information getarnte Werbung): „der vom Unternehmer finanzierte Einsatz redaktioneller Inhalte zu Zwecken der Verkaufsförderung, ohne dass sich dieser Zusammenhang aus dem Inhalt oder aus der Art der optischen oder akustischen Darstellung eindeutig ergibt“.
  - **Nr. 22** (Irreführung über Unternehmereigenschaft): „die unwahre Angabe oder das Erwecken des unzutreffenden Eindrucks, der Unternehmer sei Verbraucher oder nicht für Zwecke seines Geschäfts, Handels, Gewerbes oder Berufs tätig“.
  - **Korrektur zur Anfrage:** Im heutigen Gesetz ist Nr. 23 „Irreführung über Kundendienst in anderen Mitgliedstaaten“. Der Tatbestand „Unternehmer gibt sich als Verbraucher aus“ steht jetzt unter **Nr. 22**. Die Nummerierung folgt seit der UWG-Novelle vom 28.05.2022 dem Anhang der EU-Richtlinie. Ältere Texte und Kommentare zitieren oft noch „Nr. 23“. Bitte beim Zitieren die aktuelle Fassung verwenden. [L2, L5]
  - **Nr. 23b/23c:** Verbraucherbewertungen als echt ausgeben, ohne es zu prüfen. Gefälschte Bewertungen oder Empfehlungen übermitteln oder in Auftrag geben. **Bewertungen oder Empfehlungen von Verbrauchern in sozialen Medien falsch darstellen.** Das trifft z. B. Upvotes durch Team-Konten und Fake-Testimonials.
- **§ 7 UWG:** Unzumutbare Belästigung. Werbung per elektronischer Post ohne vorherige ausdrückliche Einwilligung ist unzulässig (Abs. 2 Nr. 2). → Ungefragte Werbe-DMs sind rechtlich riskant. [L3]
- **§ 6 DDG** (Digitale-Dienste-Gesetz, früher TMG): Kommerzielle Kommunikation muss klar als solche erkennbar sein. Der Auftraggeber muss klar identifizierbar sein. [L6]
- **§ 18 Abs. 3 Medienstaatsvertrag: Kennzeichnungspflicht für Social Bots** [L7], Wortlaut:
  - „Anbieter von Telemedien in sozialen Netzwerken sind verpflichtet, bei mittels eines Computerprogramms automatisiert erstellten Inhalten oder Mitteilungen den Umstand der Automatisierung kenntlich zu machen, sofern das hierfür verwandte Nutzerkonto seinem äußeren Erscheinungsbild nach für die Nutzung durch natürliche Personen bereitgestellt wurde.“
  - Der Hinweis muss gut lesbar bei- oder vorangestellt werden.
  - Als „automatisiert erstellt“ gelten auch vorgefertigte Texte, die automatisch versendet werden.
  → **Ein Agent, der selbst von einem menschlich wirkenden Konto postet, braucht diese Kennzeichnung.** Postet ein Mensch nach eigener Prüfung, greift die Vorschrift nach ihrem Wortlaut nicht, weil kein Programm das Konto steuert.
- **§ 18 Abs. 2 MStV:** Wer journalistisch-redaktionelle Online-Angebote betreibt, muss eine verantwortliche Person mit Name und Anschrift nennen. Das passt zur „redaktionellen Verantwortung“ in der KI-Verordnung (siehe D.3). [L7]
- **Heilmittelwerbegesetz (HWG):**
  - Gilt nach § 1 Abs. 1 Nr. 2 auch für „andere Mittel, Verfahren“, sobald sich die Werbung auf das Erkennen, Beseitigen oder Lindern von Krankheiten oder krankhaften Beschwerden bezieht.
  - § 3: Irreführend ist z. B., eine therapeutische Wirksamkeit zu behaupten, die das Mittel nicht hat, oder den Eindruck zu erwecken, ein Erfolg sei sicher.
  - → Nicht schreiben „Dream Rushes hilft gegen Albträume oder Schlafstörungen“. [L8]
- **DSGVO** (Hinweis ohne Detailrecherche): Reddit-Beiträge über eigene Träume, Schlafprobleme oder Traumata, verknüpft mit einem Nutzernamen, können Gesundheitsdaten nach Art. 9 sein. **Keine Profile anlegen, nur so wenig wie möglich speichern, schnell löschen.** Das deckt sich mit der Null-Toleranz-Regel von Reddit (C.2).
- **Folgen in Deutschland:**
  - Abmahnung und Unterlassungsanspruch durch Mitbewerber (z. B. andere Traum-Apps), Wettbewerbsverbände oder Verbraucherzentralen (§ 8 UWG), meist mit Vertragsstrafe.
  - Schadensersatz (§ 9 UWG), seit 2022 auch für Verbraucher (§ 9 Abs. 2).
  - Bußgeld nach § 19 UWG nur bei weitverbreiteten, grenzüberschreitenden Verstößen in koordinierten EU-Verfahren: bis 4 % des Jahresumsatzes oder bis 2 Mio. €, wenn der Umsatz nicht feststellbar ist. [L4]
  - Bei Verstößen gegen den MStV: Maßnahmen der Landesmedienanstalten.

### D.3 EU-KI-Verordnung, Art. 50 (Transparenzpflichten) [L10–L16]
- **Gilt ab 02.08.2026** (Art. 113). **Der Digital Omnibus hat Art. 50 nicht verschoben.** Nur für die maschinenlesbare Kennzeichnung nach Art. 50 Abs. 2 gibt es eine Schonfrist bis **02.12.2026**, und zwar ausschließlich für Systeme, die vor dem 02.08.2026 auf den Markt kamen. Inhalte von vor dem 02.08.2026 müssen nicht nachträglich gekennzeichnet werden. [L11]
- **Die Pflichten im Einzelnen:**
  - **Abs. 1 (Anbieter):** Wer ein KI-System baut, das direkt mit Menschen interagiert, muss dafür sorgen, dass sie das spätestens bei der ersten Interaktion klar erfahren. Ausnahme: Es ist ohnehin offensichtlich.
    - Laut FAQ der Kommission müssen vier Bedingungen zusammenkommen: KI-System, echter Austausch in beide Richtungen, **direkt (kein Mensch dazwischen)** und mit natürlichen Personen.
    - Laut Leitlinien (Zusammenfassung Faegre Drinker [L14]) sollen KI-Agenten offenlegen, dass sie KI sind **und in wessen Auftrag** sie handeln.
  - **Abs. 2 (Anbieter generativer KI):** maschinenlesbare Kennzeichnung der erzeugten Inhalte.
  - **Abs. 4 (Betreiber):**
    - Deepfakes kennzeichnen.
    - **KI-generierte Texte kennzeichnen, die veröffentlicht werden, um die Öffentlichkeit über Themen von öffentlichem Interesse zu informieren.** Laut FAQ zählen dazu u. a. **öffentliche Gesundheit** und **wissenschaftliche Entwicklungen**, also sehr wahrscheinlich auch Blogartikel über Schlaf- und Traumforschung.
    - **Ausnahme:** Der Text wurde von Menschen geprüft und redaktionell kontrolliert, und eine Person oder Firma trägt die redaktionelle Verantwortung.
    - Echte Prüfung heißt laut FAQ: Menschen mit Fachwissen und Urteilsvermögen sehen sich den Inhalt bewusst an. **Rechtschreib- oder reine Formalprüfung reicht nicht.**
  - **Abs. 5:** Die Information muss klar und unterscheidbar sein, spätestens bei der ersten Interaktion oder beim ersten Kontakt mit dem Inhalt.
- **Leitlinien der Kommission** zu Art. 50: 20.07.2026, C(2026) 5054. **Verhaltenskodex zur Transparenz KI-generierter Inhalte:** am 08.07.2026 von der Kommission als ausreichend bewertet, freiwilliges Werkzeug, um die Einhaltung nachzuweisen. [L12, L13]
- **Stand Digital Omnibus zur KI:**
  - Vorschlag: 19.11.2025.
  - Position des Rats: 13.03.2026.
  - Politische Einigung: 07.05.2026.
  - Europäisches Parlament: 16.06.2026.
  - Endgültige Annahme durch den Rat: 29.06.2026.
  - Veröffentlicht als Verordnung (EU) 2026/1744, **in Kraft seit 27.07.2026**.
  - Inhalt: Hochrisiko-Regeln verschoben (Anhang III auf 02.12.2027, Anhang I auf 02.08.2028), neues Verbot von KI-„Nudification“ ab Dezember 2026. [L15]
- **Deutschland:** Das KI-Marktüberwachungsgesetz (KI-MIG) macht die Bundesnetzagentur zur zentralen Aufsichtsbehörde. Bundestag 11.06.2026, laut Berichten in Kraft vor dem 02.08.2026. [L16]
- **Bußgelder für Art. 50:** bis 15 Mio. € oder 3 % des weltweiten Jahresumsatzes (Art. 99 Abs. 4). Für KMU und Start-ups gilt der jeweils niedrigere Betrag (Art. 99 Abs. 6). [L11]
- **Nebenbefund, außerhalb des Auftrags, aber wichtig:** Die App erzeugt selbst KI-Filme. Dream Rushes könnte damit Anbieter nach Art. 50 Abs. 2 sein und die Filme maschinenlesbar kennzeichnen müssen. Wer nach dem 02.08.2026 startet, bekommt keine Schonfrist. Realistische Darstellungen echter Personen können als Deepfake gelten. **Separat prüfen.**

### D.4 Digital Services Act (DSA)
- Art. 26 Abs. 2 verpflichtet Online-Plattformen, eine Funktion anzubieten, mit der Nutzer kommerzielle Inhalte selbst kennzeichnen können. Reddit bietet dafür den Brand-Affiliate-Tag. Die Pflicht trifft die Plattform. **Die eigene Offenlegungspflicht (UWG, UGP-RL) ersetzt das nicht.** [L17]
- **Noch in Arbeit:** Digital Fairness Act (Influencer-Marketing, Dark Patterns). Der Kommissionsvorschlag wird für das 4. Quartal 2026 erwartet. [L25]

### D.5 USA
- **FTC Endorsement Guides** (16 CFR Part 255, überarbeitet 2023) [L21]:
  - Wer eine materielle Verbindung zum Produkt hat (Mitarbeiter, Eigentümer), muss sie klar und deutlich offenlegen, auch in Foren und Bewertungen.
  - Ein Hinweis auf den Arbeitgeber im Profil reicht nicht. Die Offenlegung gehört in den Beitrag.
  - Die Guides sind Auslegungshilfe. Durchgesetzt wird über Section 5 FTC Act (Unterlassung, Vergleiche).
- **Rule on the Use of Consumer Reviews and Testimonials** (16 CFR Part 465; beschlossen 14.08.2024, in Kraft 21.10.2024) [L18–L20]:
  - Verboten: gefälschte Bewertungen und Testimonials, **auch KI-generierte oder von nicht existierenden Personen**.
  - Verboten: Bewertungen durch Führungskräfte oder Mitarbeiter ohne Offenlegung.
  - Verboten: angeblich unabhängige Bewertungsseiten, die man selbst betreibt.
  - Verboten: Bewertungen durch Drohungen unterdrücken.
  - Verboten: gekaufte Follower, Likes oder Aufrufe von Bots („fake social media indicators“).
  - **Zivilstrafen bei wissentlichen Verstößen bis 53.088 $ pro Verstoß** (Wert 2025).
  - Am 22.12.2025 verschickte die FTC Warnbriefe an 10 Unternehmen.
- **Kalifornien, B.O.T. Act** (Bus. & Prof. Code § 17941, gilt seit 01.07.2019): Es ist rechtswidrig, online mit Menschen in Kalifornien über einen Bot zu kommunizieren und dabei über dessen künstliche Identität zu täuschen, um einen Kauf anzuregen. Wer klar und deutlich offenlegt, dass es ein Bot ist, haftet nicht. [L22]
- **Maine** (LD 1727, unterzeichnet 12.06.2025, in Kraft ab September 2025): KI-Chatbots, die Verbraucher glauben lassen, sie sprächen mit einem Menschen, gelten als unlautere Geschäftspraxis. [L23]
- **Utah** (AI Policy Act, geändert durch SB 226, gültig ab 07.05.2025): Offenlegung, wenn der Verbraucher fragt. **Bei „Hochrisiko“-Interaktionen wie Gesundheitsberatung muss man von sich aus offenlegen.** Bußgelder bis 2.500 $, zivil bis 5.000 $ pro Verstoß. [L24]

---

## E. Andere Plattformen für Traum-Inhalte

| Plattform | Automatisierung | KI-Inhalte | Quelle |
|---|---|---|---|
| **Pinterest** | Nur Automatisierung, die Pinterest ausdrücklich freigegeben hat (Partner-Tools/API). Keine unechten oder massenhaft angelegten Konten, keine repetitiven Inhalte zum Geldverdienen. Richtlinien Stand Mai 2026, neue Fassung gilt ab 12.11.2026. | Pinterest erkennt KI-Bilder über Metadaten und Klassifikatoren und zeigt das Label „AI modified“ (seit 30.04.2025). Nutzer können „weniger KI“ wählen. | [P1, P2] |
| **TikTok** | Automatisierungs-Tools, Skripte oder Tricks zum Umgehen der Systeme sind streng verboten. Keine täuschenden Konten, kein Fake-Engagement. | **Realistisch wirkende KI-generierte oder stark bearbeitete Inhalte muss der Creator kennzeichnen.** Richtlinien gültig seit 13.09.2025, Aktualisierung angekündigt für 24.09.2026. → Dream-Rushes-Filme immer mit KI-Label posten. | [P3] |
| **X** | Nur über die API, **Skripten der Website kann zur dauerhaften Sperre führen**. Keine automatischen Antworten nur auf Basis von Keyword-Suchen. **KI-Antwort-Bots brauchen vorher eine schriftliche Genehmigung von X.** Keine Auto-Likes. Stand April 2026. | Automatisierte Konten sollen das Label „Automated“ tragen und mit einem menschlich geführten Konto verknüpft sein. | [P4, P5] |
| **Quora** | Spam umfasst: Fragen zur Eigenwerbung, irrelevante Antworten, um Traffic zu erzeugen, übermäßige Eigenwerbung, dieselbe Antwort mehrfach (Stand 19.11.2025). | **Verbindung zum eigenen Produkt muss in der Antwort oder im Profil-Credential offengelegt werden.** Eine eigene KI-Regel fand ich im Help Center nicht, laut Fallstudie von 2024 erkennt und entfernt Quora aber aktiv KI-Antworten. | [P6–P9] |
| **Medium** | Kein SEO-Spam mit KI, keine KI-Umschreibungen fremder Texte, keine erfundenen Zahlen oder Fakten. | **KI-Text muss in den ersten zwei Absätzen offengelegt werden**, sonst wird er nur an eigene Follower ausgespielt. KI-Texte dürfen nicht hinter die Bezahlschranke. KI-Bilder brauchen eine Bildunterschrift. | [P10] |
| **YouTube** (zusätzlich) | Massenproduzierte oder repetitive Inhalte werden nicht monetarisiert (Richtlinie „inauthentic content“ seit 15.07.2025). | Fotorealistische KI-Inhalte in YouTube Studio offenlegen. Klar unrealistische, fantastische Inhalte sind ausgenommen. | [P11, P12] |

---

## F. Guardrails: konkrete Regeln für beide Agenten

### F.1 SEO-Agent (Website und Blog mit Wissenskarten)

**Aufgabe:** recherchieren, Entwürfe schreiben, technisches SEO, interne Links. **Veröffentlichen tut ein Mensch.**

**DO**
1. **Nur Entwürfe liefern:** Markdown in einen Branch, dazu ein Entwurfs-PR im Website-Repo. Veröffentlicht wird erst, wenn eine fachkundige Person inhaltlich geprüft und gemergt hat.
   **[GESETZ]** Art. 50 Abs. 4 KI-VO: Nur mit echter menschlicher Prüfung und redaktioneller Verantwortung entfällt die KI-Kennzeichnung.
   **[PLATTFORM]** Google: scaled content abuse, E-E-A-T.
2. **Verantwortung sichtbar machen:** Impressum und verantwortliche Person (DDG § 5, MStV § 18 Abs. 2) **[GESETZ]**. Autorenzeile mit echter Person und „fachlich geprüft von …“ **[BEST PRACTICE / PLATTFORM: Googles „Wer, wie, warum“]**.
3. **Jede Studienaussage belegen:** Primärquelle mit DOI oder PubMed-Link, Jahr und Stichprobengröße. Der Agent ruft die Quelle wirklich ab und gleicht das Zitat ab. Er prüft, ob die Studie zurückgezogen wurde. **Keine Quelle ohne abrufbaren Link.** **[BEST PRACTICE; PLATTFORM: Google, keine leicht widerlegbaren Fehler]**
4. **Keine Heilversprechen und keine Diagnosen** („hilft gegen Albträume“, „heilt Insomnie“). Stattdessen: „Studien zeigen …, bei Beschwerden ärztlich abklären“.
   **[GESETZ]** HWG §§ 1, 3; UWG § 5.
   **[PLATTFORM]** Google YMYL.
5. **Frequenz:** Mit 1 gründlichen Artikel pro Woche starten, dazu bestehende Karten aktualisieren. Nur steigern, wenn die Prüfung mitwächst. **Keine programmatischen Seiten** (Symbol-Lexikon mit Hunderten KI-Seiten).
   **[BEST PRACTICE]** für die Zahl.
   **[PLATTFORM]** Google scaled content abuse.
6. **Technisches SEO als PR:** Sitemap, strukturierte Daten (Article, author), interne Links, Canonical, `hreflang` DE/EN, Core Web Vitals. Ein Mensch merged. **[BEST PRACTICE]**
7. **Transparenzhinweis „So entstand dieser Artikel“:** z. B. KI-gestützte Recherche, von Name geprüft. **[BEST PRACTICE]** Wird ein Text ohne echte Prüfung veröffentlicht, ist die Kennzeichnung **[GESETZ]**-Pflicht.
8. **KI-Bilder:** IPTC-Metadaten setzen, Bildunterschrift „KI-generiert“. Keine realistischen Bilder echter Personen.
   **[GESETZ]** bei Deepfakes nach Art. 50 Abs. 4.
   **[BEST PRACTICE]** sonst.
9. **Datum nur bei echter Überarbeitung ändern.** **[PLATTFORM: Google]**
10. **Bilder und Abbildungen aus Studien nur mit passender Lizenz** (z. B. CC-BY mit Namensnennung). **[GESETZ: Urheberrecht]**
11. **Search Console wöchentlich prüfen.** Bei manueller Maßnahme oder starkem Einbruch sofort anhalten. **[BEST PRACTICE]**

**DON'T**
- Nicht selbst veröffentlichen, keine CMS-Zugangsdaten mit Veröffentlichungsrecht. **[BEST PRACTICE]**
- Keine Massen- oder automatischen Übersetzungen ohne Prüfung. Kein Keyword-Stuffing. **[PLATTFORM]**
- Keine erfundenen Autoren oder Expertinnen („Dr. Luna“). **[GESETZ: UWG Irreführung] [PLATTFORM]**
- Keine Fake-Bewertungen oder -Testimonials auf der Website oder im App Store. **[GESETZ: UWG Anhang Nr. 23b/23c; FTC 16 CFR 465]**
- Keine gekauften Gastbeiträge auf fremden Domains, keine abgelaufenen Domains kaufen und umwidmen. **[PLATTFORM: site reputation abuse, expired domain abuse]**
- Paywalls nicht umgehen (`blocked-page-recovery` für kostenpflichtige Journals abschalten). **[GESETZ: Urheberrecht]**

### F.2 Community-Agent (Reddit, Quora, X …)

**Aufgabe:** beobachten, Threads einordnen, Antworten entwerfen. **Posten tut Anton von einem offen gekennzeichneten Gründer-Account.**

**DO**
1. **Der Agent postet nie selbst.** Er hat keinen Reddit-Login und kein Token. Entwürfe gehen per Telegram an Anton, der liest, in eigenen Worten anpasst und manuell postet.
   **[PLATTFORM]** Reddit: Automatisierung nur mit Genehmigung, App-Label und eigenem Konto, keine Mischkonten. X: KI-Antwort-Bots nur mit Genehmigung.
   **[GESETZ]** Ein automatisiert postendes, menschlich wirkendes Konto bräuchte die Kennzeichnung nach MStV § 18 Abs. 3. Direkte KI-Interaktion fällt unter Art. 50 Abs. 1 KI-VO. In den USA gelten der B.O.T. Act und das Gesetz in Maine.
2. **Beobachten nur über offizielle Wege:** Reddit Pro Trends (Verfügbarkeit prüfen) oder ein genehmigter API-Zugang, mit kommerzieller Freigabe. Das anonyme RSS-Lesen per `reddit-reading` ist für kommerzielle Zwecke eine Grauzone. **Nicht ohne Freigabe.** Keine Scraper, Proxys oder Stealth-Browser.
   **[PLATTFORM]** Responsible Builder Policy, Data API Wiki.
3. **Keine Nutzerprofile, so wenig Daten wie möglich:** Nutzername und Traum- oder Schlafinhalte nicht dauerhaft zusammen speichern. Entwürfe nach der Nutzung löschen, maximal etwa 48 Stunden aufbewahren.
   **[PLATTFORM]** Reddit: Null Toleranz bei sensiblen Merkmalen, Reddit-Pro-Regeln.
   **[GESETZ]** DSGVO Art. 9 (juristisch prüfen lassen).
4. **Offenlegung in jedem Beitrag mit Bezug zur App.** Dazu Profil-Bio, optional Brand-Affiliate-Tag, bei Reddit Pro der Verifizierungs-Haken.
   **[GESETZ]** UWG § 5a Abs. 4, Anhang Nr. 22; UGP-RL Anhang I Nr. 22; FTC Endorsement Guides.
   **[PLATTFORM]** Reddit Impersonation und Reddit-Pro-Regeln; Quora-Regel zu Verbindungen.
5. **KI-Hilfe ehrlich behandeln:** Anton schreibt den Beitrag in eigenen Worten. Bleibt nennenswert KI-Text stehen, dazuschreiben: „mit KI-Hilfe entworfen, von mir geprüft“.
   **[PLATTFORM]** Reddit: KI-Inhalte dürfen sich nicht als menschlich ausgeben.
6. **Vor jedem Beitrag die Regeln des Subreddits prüfen** (Checkliste C.5). Eigenwerbung nur dort, wo sie erlaubt ist. Im Zweifel Modmail. **[PLATTFORM]**
7. **Erst Nutzen, dann Werbung:** Mindestens 9 von 10 Beiträgen ohne App-Nennung und ohne Link. Lieber die Studie verlinken als die App. **[BEST PRACTICE]** Die 90/10-Regel war früher eine Reddit-Faustregel, offiziell ist sie heute nicht mehr.
8. **Keine Gesundheitsberatung:** Bei Albträumen, Trauma, Schlafstörungen oder Schlafparalyse auf Ärztin, Arzt oder Psychotherapie verweisen.
   **[GESETZ]** HWG, sobald Werbung im Spiel ist; Utah bei Gesundheitsberatung.
   **[BEST PRACTICE]** Schutz der Nutzer.
9. **Wenig posten, nie gleiche Texte:** Wenige Beiträge pro Tag, jeder individuell. **[PLATTFORM]** Reddit RBP und Spam-Regel, X, Quora.
10. **Sollte es später doch einen echten Bot geben** (z. B. im eigenen r/DreamRushes): nur mit Reddit-Genehmigung, eigenem App-Konto mit [App]-Label, nur in eigenen oder zustimmenden Subreddits, mit Hinweis „I'm a bot run by Dream Rushes“ im Text. **[PLATTFORM + GESETZ]**

**DON'T**
- **Nie so tun, als sei man ein normaler Nutzer.** Keine Personas, keine Zweitkonten, keine „zufriedenen Kunden“. **[GESETZ: UWG Anhang Nr. 22, 23c; FTC 465] [PLATTFORM: Impersonation]**
- **Keine Upvotes durch Team, Freunde oder Konten, kein Aufruf zum Abstimmen.** **[PLATTFORM: Disrupting Communities] [GESETZ: UWG Anhang Nr. 23c, FTC fake indicators]**
- **Keine DMs oder Chat-Nachrichten aus eigenem Antrieb.** **[PLATTFORM: RBP verlangt Zustimmung, Spam] [GESETZ-Risiko: § 7 UWG]**
- **Keine Belohnung für positive Beiträge oder Bewertungen** (z. B. Premium gratis gegen Post). **[GESETZ: FTC 465, UWG] [PLATTFORM: Reddit Pro]**
- Keinen `humanizer`, um KI-Herkunft zu verstecken. Keine Stealth- oder Proxy-Browser, kein `blocked-page-recovery` für Plattformen. Sperren nicht umgehen. **[PLATTFORM]**
- Keine Sperre mit neuen Konten umgehen. **[PLATTFORM: Ban evasion]**

### F.3 Hermes-Einrichtung für beide Agenten [BEST PRACTICE, aus H14–H18]
- **Zwei getrennte Profile:** `hermes profile create seo` und `hermes profile create community`. Jedes bekommt eigene `SOUL.md`, eigene `.env` und die Regeln aus F.1 bzw. F.2 als Skill oder in AGENTS.md.
- **Befehle nur mit Freigabe:** `approvals.mode: manual`. Die Einstellungen `cron_mode`, `unattended_mode` und `single_query_mode` bleiben auf `deny`. Nie `--yolo`.
- **Gedächtnis und Skills nicht ohne Freigabe ändern lassen:** `skills.write_approval: true`, `memory.write_approval: true`.
- **Werkzeuge beschränken:**
  - Community-Profil: nur `web`, `file`, `memory`, `cronjob`, `messaging` zu Anton. **Kein** `browser`, `terminal` oder `x_search`.
  - SEO-Profil: `web`, `file`, `terminal` im Docker-Backend, `browser` nur lokal ohne Cloud-Stealth.
- **Gateway nur für Anton:** `TELEGRAM_ALLOWED_USERS=<Antons ID>`. Kein `GATEWAY_ALLOW_ALL_USERS`.
- **Kosten deckeln:** `agent.max_turns` und `agent.run_budget_seconds` setzen. Cron-Jobs im Monitor-Modus, z. B. alle 6 Stunden statt alle 10 Minuten. Günstiges Nebenmodell für die Komprimierung.
- **Nichts Sensibles anbinden:** keinen Passwort-Tresor, keine Zahlungsdaten, keine Social-Media-Tokens mit Schreibrecht. Keine Modelle, die mit den Daten trainieren (auf Hermes-Warnung achten).
- **Terminal-Backend Docker oder SSH auf separatem VPS.** Achtung: Bei Container-Backends prüft Hermes gefährliche Befehle nicht, deshalb Container sauber abgrenzen.
- **Regelmäßig `hermes update`.** Die Versionen erscheinen im Takt von Tagen, v0.21.0 hatte Datenbankfehler.

### F.4 Offenlegungs-Formulierungen
- **Reddit EN, im Kommentar:** „Disclosure: I'm one of the founders of Dream Rushes, a dream-journal app. Not linking it here – happy to answer questions.“
- **Wenn die App direkt empfohlen wird:** „Full disclosure: this is my own app, so I'm biased.“
- **Mit KI-Hilfe:** „(Drafted with help from an AI tool; I checked the sources myself.)“
- **Profil-Bio:** „Co-founder @ Dream Rushes (dream journal app). I always disclose when I mention it.“
- **DE:** „Transparenzhinweis: Ich bin Mitgründer von Dream Rushes (Traumtagebuch-App).“
- **Quora-Credential:** „Co-founder, Dream Rushes (dream journal app)“.
- **Echter Bot, falls je genehmigt:** „🤖 I'm an automated account run by Dream Rushes. Replies are AI-generated.“

### F.5 Offene Punkte, die Anton oder ein Mensch klären muss
1. Subreddit-Regeln lesen und dokumentieren (C.5).
2. Ist Reddit Pro für eine deutsche Firma verfügbar? Falls ja: Konto anlegen und verifizieren.
3. Anwalt: HWG-Formulierungen für App und Blog, DSGVO beim Community-Monitoring, Art. 50 Abs. 2 und 4 für die KI-Filme der App.
4. Nous-Portal-Preise und Daten-Trainingsbedingungen des gewählten Modells direkt prüfen.
5. Falls ein Reddit-API-Zugang nötig wird: Antrag nach der Responsible Builder Policy mit ehrlicher kommerzieller Zweckangabe.

---

## Quellen (abgerufen am 14.09.2026, Datum = Stand der Seite, soweit angegeben)

### Hermes Agent
- [H1] GitHub-Repository (Metadaten per GitHub-API: angelegt 22.07.2025, MIT): https://github.com/NousResearch/hermes-agent
- [H2] Releases (v0.21.2 11.09.2026; v0.2.0 12.03.2026): https://github.com/NousResearch/hermes-agent/releases
- [H3] Release Notes v0.21.0 (31.08.2026): https://github.com/NousResearch/hermes-agent/releases/tag/v2026.8.31
- [H4] Release Notes v0.21.2 (11.09.2026): https://github.com/NousResearch/hermes-agent/releases/tag/v2026.9.11
- [H5] Doku Memory: https://hermes-agent.nousresearch.com/docs/user-guide/features/memory
- [H6] Doku Skills: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
- [H7] Doku Cron: https://hermes-agent.nousresearch.com/docs/user-guide/features/cron
- [H8] Doku Tools: https://hermes-agent.nousresearch.com/docs/user-guide/features/tools
- [H9] Doku Web Search: https://hermes-agent.nousresearch.com/docs/user-guide/features/web-search
- [H10] Doku Browser: https://hermes-agent.nousresearch.com/docs/user-guide/features/browser
- [H11] Doku Messaging Gateway: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/
- [H12] Doku Personality/SOUL.md: https://hermes-agent.nousresearch.com/docs/user-guide/features/personality
- [H13] Doku Context Files: https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files
- [H14] Doku Configuration: https://hermes-agent.nousresearch.com/docs/user-guide/configuration
- [H15] Doku Profiles: https://hermes-agent.nousresearch.com/docs/user-guide/profiles
- [H16] Doku Bot Mode: https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode
- [H17] Doku Docker: https://hermes-agent.nousresearch.com/docs/user-guide/docker
- [H18] Doku Security: https://hermes-agent.nousresearch.com/docs/user-guide/security
- [H19] Doku FAQ: https://hermes-agent.nousresearch.com/docs/reference/faq
- [H20] Doku Nous Portal: https://hermes-agent.nousresearch.com/docs/integrations/nous-portal
- [H21] Doku Hermes Cloud via MCP: https://hermes-agent.nousresearch.com/docs/guides/manage-hermes-cloud-with-mcp
- [H22] Skill reddit-reading: https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/social-media/reddit-reading/SKILL.md
- [H23] Skill humanizer: https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/humanizer/SKILL.md
- [H24] Skill blocked-page-recovery: https://github.com/NousResearch/hermes-agent/blob/main/skills/web/blocked-page-recovery/SKILL.md
- [H25] MCP-Eintrag WordPress.com: https://github.com/NousResearch/hermes-agent/blob/main/optional-mcps/wordpress-com/manifest.yaml
- [H26] Agent-Skills-Standard: https://agentskills.io/
- [H27] Hostinger, Kosten (06.08.2026, Anbieter mit Eigeninteresse): https://www.hostinger.com/tutorials/hermes-agent-cost
- [H28] README: https://github.com/NousResearch/hermes-agent/blob/main/README.md

### Google
- [G1] Spam-Richtlinien (aktualisiert 28.08.2026): https://developers.google.com/search/docs/essentials/spam-policies
- [G2] Core Update und neue Spam-Richtlinien (05.03.2024): https://developers.google.com/search/blog/2024/03/core-update-spam-policies
- [G3] Site Reputation Abuse im EWR ohne manuelle Maßnahmen ab 30.08.2026: https://www.seroundtable.com/google-site-reputation-policy-eea-41968.html · https://www.searchenginejournal.com/google-updates-site-reputation-abuse-policy-removes-penalties-in-eea/587423/
- [G4] Using gen AI content (10.12.2025): https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- [G5] Creating helpful content (10.12.2025): https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- [G6] Quality Rater Guidelines 01/2025: https://searchengineland.com/google-quality-raters-content-ai-generated-454161 · 09/2025: https://www.seroundtable.com/google-search-quality-raters-guidelines-update-40092.html
- [G7] Search Status Dashboard (Ranking-Updates): https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history
- [G8] Succeeding in AI search (05/2025): https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search
- [G9] Google/Liz Reid (06.08.2025): https://blog.google/products-and-platforms/products/search/ai-search-driving-more-queries-higher-quality-clicks/
- [G10] Pew Research (22.07.2025): https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/
- [G11] Ahrefs (04.02.2026): https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/
- [G12] Seer Interactive (04/2026): https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-2026-update
- [G13] Google I/O 2026 Search (19.05.2026): https://blog.google/products-and-platforms/products/search/search-io-2026/
- [G14] Mueller zur Veröffentlichungsfrequenz (Zweitquelle): https://iloveseo.com/seo/google-publishing-consistency-does-not-affect-rankings/
- [G15] hreflang: https://developers.google.com/search/docs/specialty/international/localized-versions

### Reddit
- [R1] Spam (19.05.2026): https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam
- [R2] Disrupting Communities (19.05.2026): https://support.reddithelp.com/hc/en-us/articles/360043066412-Disrupting-Communities
- [R3] Impersonation (19.05.2026): https://support.reddithelp.com/hc/en-us/articles/360043075032-Impersonation
- [R4] Manipulated Content and Misleading Behavior (19.05.2026): https://support.reddithelp.com/hc/en-us/articles/41180423371156-Manipulated-Content-and-Misleading-Behavior
- [R5] Responsible Builder Policy (05.06.2026): https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy
- [R6] Data API Wiki (11.05.2026): https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki
- [R7] Ende des Selbstbedienungszugangs 11.11.2025 (Zweitquellen): https://molehill.io/blog/reddit_killed_self-service_api_keys_your_options_for_automated_reddit_integration · https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown
- [R8] Bot-Labels und Menschlichkeits-Prüfung (25./26.03.2026): https://www.engadget.com/social-media/reddit-will-prompt-some-accounts-to-verify-humanness-in-latest-bot-crackdown-161000181.html · https://www.helpnetsecurity.com/2026/03/26/reddit-human-verification-changes/ · Originalbeitrag u/spez: https://www.reddit.com/user/spez/comments/1s3ezrc/humans_welcome_bots_must_wear_name_tags/
- [R9] r/changemyview-Experiment (04/2025): https://www.nbcnews.com/tech/tech-news/reddiit-researchers-ai-bots-rcna203597 · https://www.washingtonpost.com/technology/2025/04/30/reddit-ai-bot-university-zurich/ · https://www.404media.co/reddit-issuing-formal-legal-demands-against-researchers-who-conducted-secret-ai-experiment-on-users/
- [R10] Reddit Pro, Regeln für Unternehmen (08.05.2025): https://support.reddithelp.com/hc/en-us/articles/24368958859668-Sign-up-for-Reddit-Pro
- [R11] What is Reddit Pro (30.03.2026): https://support.reddithelp.com/hc/en-us/articles/24368510335892-What-is-Reddit-Pro
- [R12] Reddit Pro Trends (28.05.2026): https://support.reddithelp.com/hc/en-us/articles/47619216411284-Reddit-Pro-Feature-Trends
- [R13] Brand-Affiliate-Tag (22.02.2024): https://support.reddithelp.com/hc/en-us/articles/23972085214484-What-s-a-brand-affiliate-tag
- [R14] Verified profiles (09.07.2026): https://support.reddithelp.com/hc/en-us/articles/42763717293716-Verified-profiles-on-Reddit
- [R15] Reputation filter (30.04.2026): https://support.reddithelp.com/hc/en-us/articles/27441485903124-Reputation-filter
- [R16] Konto als Spam markiert (14.08.2025): https://support.reddithelp.com/hc/en-us/articles/360045309012-My-account-was-flagged-for-spam-or-inauthentic-activity
- [R17] Sperre wegen Spam, unechter Aktivität, Ban-Evasion (28.03.2026): https://support.reddithelp.com/hc/en-us/articles/360045734911-My-account-was-banned-for-spam-inauthentic-activity-or-ban-evasion
- [R18] Mehrere Konten (29.03.2026): https://support.reddithelp.com/hc/en-us/articles/204535759-Is-it-ok-to-create-multiple-accounts

### Recht
- [L1] § 5a UWG: https://www.gesetze-im-internet.de/uwg_2004/__5a.html
- [L2] Anhang zu § 3 Abs. 3 UWG: https://www.gesetze-im-internet.de/uwg_2004/anhang.html
- [L3] § 7 UWG: https://www.gesetze-im-internet.de/uwg_2004/__7.html
- [L4] § 19 UWG: https://www.gesetze-im-internet.de/uwg_2004/__19.html
- [L5] UWG-Novelle 2022 (in Kraft 28.05.2022): https://www.wettbewerbszentrale.de/uwg-novelle-2022-die-wichtigsten-aenderungen-im-ueberblick-teil-ii-kundenbewertungen-belaestigende-werbung-blacklist-tatbestaende-und-neue-rechtsfolgen/
- [L6] § 6 DDG: https://www.gesetze-im-internet.de/ddg/__6.html
- [L7] § 18 MStV (Stand 14.03.2025): https://lxgesetze.de/mstv/18
- [L8] HWG § 1: https://www.gesetze-im-internet.de/heilmwerbg/__1.html · § 3: https://www.gesetze-im-internet.de/heilmwerbg/__3.html
- [L9] UGP-RL 2005/29/EG: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32005L0029 · Leitlinien 2021/C 526/01: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52021XC1229(05)
- [L10] KI-VO Art. 50: https://artificialintelligenceact.eu/article/50/ · https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50
- [L11] FAQ der Kommission zu Art. 50 (24.07.2026): https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- [L12] Leitlinien Art. 50 (20.07.2026): https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems
- [L13] Verhaltenskodex Transparenz: https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content · Bewertung durch die Kommission: https://digital-strategy.ec.europa.eu/en/library/commission-opinion-assessment-code-practice-transparency-ai-generated-content
- [L14] Faegre Drinker, Zusammenfassung der Leitlinien (07/2026): https://www.faegredrinker.com/en/insights/publications/2026/7/eu-ai-act-commission-confirms-transparency-code-of-practice-as-adequate-and-publishes-final-version-of-its-guidelines-on-transparency-obligations
- [L15] Digital Omnibus zur KI: Rat 29.06.2026 https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/ · Einigung 07.05.2026 https://www.consilium.europa.eu/en/press/press-releases/2026/05/07/artificial-intelligence-council-and-parliament-agree-to-simplify-and-streamline-rules/ · Inkrafttreten https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force · Legislative Train https://www.europarl.europa.eu/legislative-train/package-digital-package/file-digital-omnibus-on-ai
- [L16] KI-MIG: https://www.bundestag.de/dokumente/textarchiv/2026/kw13-pa-digitales-1155576 · LTO (21.07.2026): https://www.lto.de/recht/hintergruende/h/kuenstliche-intelligenz-ai-act-ki-mg-aufsicht-bussgeld
- [L17] DSA (VO 2022/2065), Art. 26: https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng
- [L18] FTC Final Rule Reviews (14.08.2024): https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials · Q&A: https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers · eCFR: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465
- [L19] FTC-Warnbriefe (22.12.2025): https://www.ftc.gov/news-events/news/press-releases/2025/12/ftc-warns-10-companies-about-possible-violations-agencys-new-consumer-review-rule
- [L20] FTC Strafrahmen 2025: https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-publishes-inflation-adjusted-civil-penalty-amounts-2025
- [L21] FTC Endorsement Guides FAQ: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- [L22] Kalifornien SB 1001 / § 17941: https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=201720180SB1001 · https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-6/section-17941/
- [L23] Maine LD 1727: https://legiscan.com/ME/text/LD1727/id/3255481 · https://www.maine.gov/housedems/news/governor-signs-kuhn-legislation-protect-mainers-deceptive-artificial-intelligence
- [L24] Utah SB 226: https://www.davispolk.com/insights/client-update/utah-scales-back-reach-generative-ai-consumer-protection-law
- [L25] Digital Fairness Act: https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act

### Plattformen
- [P1] Pinterest Community Guidelines (05/2026): https://policy.pinterest.com/en/community-guidelines
- [P2] Pinterest KI-Labels (30.04.2025): https://newsroom.pinterest.com/news/introducing-gen-ai-labels/
- [P3] TikTok Integrity & Authenticity (gültig 13.09.2025): https://www.tiktok.com/community-guidelines/en/integrity-authenticity
- [P4] X Automation Rules (04/2026): https://help.x.com/en/rules-and-policies/x-automation
- [P5] X Automated account labels: https://help.x.com/en/using-x/automated-account-labels
- [P6] Quora Platform Policies (19.11.2025): https://help.quora.com/hc/en-us/articles/360000470706-Platform-Policies
- [P7] Quora, Offenlegung von Verbindungen: https://help.quora.com/hc/en-us/articles/360055133711-What-is-Quora-s-policy-on-disclosing-affiliations-in-answers
- [P8] Quora, Plagiat (23.06.2025): https://help.quora.com/hc/en-us/articles/360000470206-What-is-Quora-s-policy-on-plagiarism-and-attribution
- [P9] Pangram-Fallstudie Quora (26.09.2024): https://www.pangram.com/blog/quora-case-study
- [P10] Medium AI Content Policy: https://help.medium.com/hc/en-us/articles/22576852947223-Artificial-Intelligence-AI-content-policy
- [P11] YouTube, Offenlegung synthetischer Inhalte: https://support.google.com/youtube/answer/14328491
- [P12] YouTube Monetarisierungsrichtlinien: https://support.google.com/youtube/answer/1311392
