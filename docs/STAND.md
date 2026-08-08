# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-08 (15:30) — Branch `session/2026-08-07-anton`, PR #9

## Woran wird gearbeitet

„Dream Rushes" ist eine React-SPA: Traum aufschreiben oder sprechen → KI macht
daraus eine Bildstrecke oder einen kurzen Film. **Fünf Tabs**, der Wizard öffnet
sich über der Tab-Leiste:

| Tab | Inhalt |
|---|---|
| Home | Begrüßung nach Tageszeit, letzter Traum als Himmel, Menagerie |
| Journal | Träume als Kartenstapel **oder** Liste (umschaltbar), Bibliothek, Detail als Bilderstrecke |
| **⊕** | Der Wizard: Traum → Ausgabe → Personen → Orte → Style → Ergebnis |
| Sleep | **Alles gratis:** Einschlaf-Checkliste, Sound-Mixer, Lucid-Guide, Symbole |
| Profil | Porträt, Credits-Pille (öffnet Paywall), Traum-Kalender |

Die Navigationsleiste trägt **nur Icons** aus einem einheitlichen SVG-Satz und
genau **vier** Tabs — eine gerade Zahl, damit der Plus-Knopf auf der Mittellinie
sitzt. Bei fünf lag er 32 px daneben, weil zwei Tabs links nie drei rechts
ausgleichen. Deshalb sind die Symbole in den Sleep-Tab gezogen.

**Stack:** Bun + Vite + React 18 + react-router-dom (HashRouter), `server.js` als
schlüsselhaltender Proxy. Zustand in `localStorage`, Schlüssel `dreamrushes_v1`.

**Sprache:** Oberfläche **englisch**, alle Texte in `src/i18n/en.js` und nirgends
sonst. Doku und Commits deutsch.

## Farben und Gestaltung

Seit 08.08. **tiefes Blau mit warmem Gegenpol** (vorher violette Nacht). Der
Hintergrund existiert genau **einmal** als `--bg-rgb` in `src/styles/tokens.css`;
jeder Schleier und Verlauf leitet seine Deckkraft davon ab
(`rgb(var(--bg-rgb) / .x)`). Vorher stand er in zwölf Dateien von Hand.

- **Warm ist selten und bedeutet „Weg nach vorn":** Hauptknöpfe, Plus-Knopf und
  Paywall-Akzente tragen `--warm-grad` (drei Stopps, Gold → Bernstein → Glut).
  ⚠ **Immer mit `color: var(--bg)`** — Weiß auf Bernstein reißt den Kontrast.
- **Titel stehen in `--serif`** (Systemschriften, kein Download).
- `scripts/test-contrast.mjs` prüft 16 Paarungen gegen WCAG AA und läuft in
  `bun run test` mit. Der Grenzfall `--faint` auf `--sky` steht bei **5,56:1**.

## Starten

    bun run dev                       # Oberfläche 5173, API 8100, Hot Reload
    bun run build && bun server.js    # produktionsnah, alles auf 8100
    bun run test                      # 65 Unit + 50 Freigabe + Hygiene + 16 Kontrast

⚠️ Die Oberfläche liegt im Dev-Modus auf **5173**, nicht 8100 — dort läuft nur
die API. Und: **5173 und 8100 sind für den Browser verschiedene Herkünfte mit
getrenntem `localStorage`.** Wer die Ports wechselt, sieht zwei verschiedene
Tagebücher; das sah lange nach Datenverlust aus.

## Provider und Preise (recherchiert und gemessen am 08.08.)

| | Modell | Kosten |
|---|---|---|
| Bild | `fal-ai/nano-banana-2` (1K) | **$0,08** je Bild |
| Bild mit Referenz | `.../edit` — Pflicht, sonst werden `image_urls` ignoriert | $0,08 |
| Video Standard | `minimax/h3/image-to-video` (768P) | **$0,08 je Sekunde**, 2–15 s |
| Video Premium | `bytedance/seedance-2.5` (720p) | **$0,473 je Sekunde**, bis 30 s am Stück |
| Diktat | `fal-ai/wizper` | $0,0005 je Minute |
| Analyse | `deepseek-v4-flash` | **$0,00026** je Traum |

**Die Credit-Skala leitet sich daraus ab: 1 Credit = 1 Bild = $0,08.** Textarbeit
(Analyse, Überarbeiten, Diktat) ist **gratis**, weil sie 0,065 % eines Traums
kostet. Film Standard = ein Credit je Sekunde plus einer fürs Startbild.
Alles in `src/lib/pricing.js` und `src/lib/video.js`, jeweils aus **einer** Zahl
je Modell abgeleitet.

Verkaufsseite in `src/lib/plans.js`: Preis = Kosten × Aufschlag ÷ (1 − Provision).
Bei Apples 30 % und 1,75× Aufschlag sind das **$0,200 je Credit**. Abos bekommen
den Mindestaufschlag, Einmalkäufe 2,2× — daher der Abo-Rabatt.

**Modellwahl bewusst so:** Seedream 5 Lite kostet 56 % weniger, hält im Test
Gesichter pixelgenau, **befolgt aber die Regieanweisung nicht** (liefert einen
Hintergrundtausch statt eines Filmbildes). Für Bildstrecken bleibt es deshalb bei
Nano Banana — auch für den Gratis-Traum, weil der erste Eindruck entscheidet.

## Sicherheit

- **Vertraulichkeit:** Web-Wurzel ist `dist/`, nicht das Repo. Zusätzlich
  deny-by-default in `resolveStatic()`; `/media/` hat eine eigene, ebenso enge
  Prüfung (`resolveMedia()`, nur Hash-plus-Endung). 50 Prüfungen in
  `scripts/test-static.mjs`.
- **Prompt-Eingabe:** unsichtbare Zeichen werden serverseitig entfernt,
  `sanitizePromptText()` in `server.js:101` ist die verbindliche Stelle. Auch
  DeepSeeks Rückgabe und jedes Transkript laufen dort durch.
- **`/api/transcribe` nimmt nur Base64-Data-URIs**, niemals URLs — sonst wäre die
  Route ein Abruf-Proxy für beliebige Adressen.
- **Offen — `/api/generate` hat keine Authentifizierung und kein Rate-Limit**
  (`server.js:25`). Nur an localhost binden. Löst sich erst mit dem Backend,
  verbindlich **vor** jeder öffentlichen Nutzung.
- **Offen — Credits sind Buchhaltung, keine Zugangskontrolle**
  (`src/lib/credits.js:28`). Der Stand liegt im `localStorage` und ist frei
  editierbar. Das Willkommensgeschenk ist deshalb auf **3** gesenkt.
- **Offen — Datenschutz:** hochgeladene Referenzfotos und Sprachaufnahmen gehen
  an fal.ai. Gesichtsbilder sind biometrische Daten (DSGVO Art. 9). Vor einer
  Veröffentlichung braucht es Datenschutzhinweis, Einwilligung und Klärung der
  Speicherdauer.
- **Offen — Missbrauch:** Referenzfoto einer realen Person plus Traumtext ergibt
  einen Deepfake. Keine Inhaltsprüfung, kein Logging. Gehört ans Backend-ADR.

## Bekannte Baustellen

- **⚠ Der synchrone `fal.run` reicht nur für Bilder.** Gemessen: ein
  15-Sekunden-Video braucht **280 Sekunden**. Filme laufen deshalb über
  `queue.fal.run` (`falSubmitVideo()` / `jobStatus()` in `server.js`). **Wer
  irgendetwas anderes verlängert, muss denselben Weg nehmen** — sonst rechnet fal
  ab und niemand holt das Ergebnis.
- **`minimax/h3` ist nirgends öffentlich dokumentiert.** Seine Grenzen (2–15 s,
  768P/2K/4K) stehen nur in der eigenen Validierungsantwort. Leeren oder
  ungültigen Body schicken und den Fehler lesen — kostet nichts.
- **⚠ Falle in `TagTextarea.css`:** Feld und Spiegelebene tragen zusätzlich die
  Klasse des Aufrufers (`.wiz-textarea`). Bei gleicher Spezifität entscheidet die
  Bündelreihenfolge, und die entscheidet gegen uns. Alles, was den Aufrufer
  schlagen muss, braucht `.tt-wrap` davor.
- **Die Tag-Karte im Eingabefeld öffnet nur per Zeiger**
  (`src/components/TagTextarea.jsx:48`) — die Markierungen liegen in einer
  `aria-hidden`-Ebene und werden geometrisch getroffen. Derselbe Inhalt steht im
  Journal unter „Your cast", das per Tastatur bedienbar ist.
- **Screens sind nur manuell geprüft.** Getestet ist die Logikschicht (65
  Unit-Tests) plus Freigabe, Prompt-Hygiene und Kontrast. Für die React-Screens
  gibt es keine automatisierten Tests — dafür bräuchte es eine DOM-Umgebung.
- **Die riskanteste Stelle bleibt `promptBuilder.js:18` (`buildReferences`).**
  Eine Figur ohne Foto darf keinen Index verbrauchen, sonst bekommen Menschen
  fremde Gesichter. Wer dort etwas ändert, führt die Tests aus.
- **Die Bilderstrecke im Journal teilt nach Sätzen**, gleichmäßig auf die Bilder.
  Genauer ginge es nur, wenn die Beats im Eintrag gespeichert würden — sie liegen
  heute nur in der Analyse.
- **Vite startet neu, sobald eine `.env*`-Datei gespeichert wird** — auch
  `.env.example`. Sieht beim ersten Mal nach einem Absturz aus.
- **Symbolerkennung nur auf Englisch** (`src/lib/symbols.js:34`). Deutsche Träume
  liefern keine Symbole. Wird spätestens mit der deutschen Oberfläche fällig.
- Tagebuch wächst unbegrenzt und wird komplett gerendert — keine Pagination.
  Zusammen mit base64-Referenzfotos ist das localStorage-Kontingent (~5 MB) das
  eigentliche Limit; `saveState()` meldet es wenigstens.

## Nächste Schritte

1. **Sprachassistent (Gemini Live).** `GEMINI_KEY` liegt seit 08.08. in `.env`.
   fal bietet kein Echtzeit-Sprachmodell, der Schlüssel kommt direkt von Google.
   **Wichtig für die Umsetzung:** Gemini Live kann Funktionen aufrufen — dem
   Modell `setDreamText()`, `addPerson()`, `addPlace()` mitgeben, statt hinterher
   ein Protokoll durch DeepSeek zu jagen. Die Daten kommen dann strukturiert an,
   ohne zweiten Aufruf. Kosten: ~$0,028 je Traum (3 Minuten Gespräch).
2. **Onboarding-Fragebogen** über denselben Assistenten: Name, wiederkehrende
   Träume, Vorlieben, eigenes Foto. Gestaffelte Belohnung bis 3 Credits — wer
   nichts ausfüllt, behält alles Kostenlose und stößt erst beim Generieren auf
   die Paywall.
3. **Empfehlungsprogramm.** Trägt sich ab dem zweiten Monat des Geworbenen.
   Prämie **erst nach der ersten erfolgreichen Abbuchung** gutschreiben, sonst ist
   es eine Einladung, sich selbst zu empfehlen. Braucht das Konten-Backend.
4. **Character-Sheets** für beschriebene Figuren ohne Foto. Seedream ist dafür
   das bessere und billigere Werkzeug — seine Stärke (Vorlage exakt halten) ist
   hier genau richtig.
5. Vor jeder öffentlichen Nutzung: **Auth + Rate-Limit** für `/api/generate`.
6. **Supabase-Projekt** (Produktbesitzer) → ADR für Accounts/DB/Credits. Erst
   danach sind Bezahlung, Empfehlungen und ein fälschungssicherer Kontostand
   möglich.
7. Apple-/Google-Developer-Accounts → ADR für Capacitor. Erst dann In-App-Käufe,
   ein echter Einschlaf-Wecker (Benachrichtigungen) und natives Autostart für den
   Sound-Mixer.

## Offene Zahlen, die nur die Wirklichkeit beantworten kann

- **Umwandlungsquote und Haltedauer.** Das Geschenk trägt sich ab **3,8 %** bei
  drei Monaten mittlerer Haltedauer. Ob die erreicht werden, weiß niemand, bevor
  es Konten gibt. Konservativ starten, nachlegen wenn die Zahlen es hergeben —
  zu wenig verschenkt lässt sich korrigieren, zu viel ist weg.
- **Das Jahresabo trägt die Marge nur bei ~75 % Verbrauch.** Deshalb verfallen
  Monats-Credits. Vor dem Verkauf an echten Zahlen prüfen.
- **Echte Rechnungsbeträge** stehen im fal.ai-Dashboard. Die Sitzung hat dort
  reale Läufe hinterlassen (Bilder, ein 15-s- und ein 12-s-Video) — ein Blick
  darauf bestätigt oder korrigiert die hier genannten Preise.
