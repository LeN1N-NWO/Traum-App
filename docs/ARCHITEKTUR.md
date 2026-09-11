# ARCHITEKTUR — wer spricht mit wem, womit, und was daran trägt

> Diese Datei beschreibt den **Ist-Zustand** samt Protokollen und Datenformaten
> und bewertet ihn. Sie wird fortgeschrieben, nicht überschrieben — anders als
> `STAND.md`, die nur die Gegenwart des Projektfortschritts zeigt.
>
> **Stand:** 2026-09-11 · Erhoben in Hannis Sitzung (Analyse: Claude) aus dem
> Code, nicht aus Erinnerung — jede Zahl ist nachgezählt.
> Bildfassung mit beiden Schaubildern:
> https://claude.ai/code/artifact/d10514e8-e99f-4f8e-bdba-3919f9a23f2b

---

## 1. Die Bestandteile

```
  OBERFLÄCHE                 EIGENER PROZESS              FREMDE DIENSTE
 ┌──────────────┐           ┌──────────────────┐        ┌────────────────┐
 │ iOS-App      │──HTTP────▶│                  │──HTTPS▶│ fal.ai         │ 💸
 │ WKWebView    │◀──WS─────▶│   server.js      │        │ Bilder + Filme │
 │ capacitor:// │           │   Bun · :8100    │──HTTPS▶│ DeepSeek       │ 💸
 ├──────────────┤           │                  │        │ Analyse/Regie  │
 │ Browser      │──HTTP────▶│  HÄLT ALLE       │◀─WSS──▶│ Gemini         │ 💸
 │ Vite · :5173 │           │  SCHLÜSSEL       │        │ Sprache        │
 └──────┬───────┘           └────────┬─────────┘        └────────────────┘
        │                            │
        ▼                            ▼
 ┌──────────────┐           ┌──────────────────┐
 │ localStorage │           │ Lokale Platte    │
 │ Zustand,     │           │ media/           │
 │ Credits ⚠    │           │ data/traeume/    │
 └──────────────┘           └──────────────────┘
```

💸 = kostet echtes Geld. **Alle drei Geldwege gehen durch `server.js`** — das
ist der Grund, warum dieser Prozess nicht in eine Funktion-als-Dienst-Umgebung
passt und warum er die Vertrauensgrenze ist.

## 2. Protokolle und Nutzlasten

| Von → Nach | Protokoll | Nutzlast |
|---|---|---|
| iOS-App → `server.js` | HTTP/1.1 ⚠ unverschlüsselt | `application/json`, CORS gegen Positivliste |
| iOS-App ⇄ `server.js` | WebSocket `/api/voice` | PCM16 base64 in JSON-Rahmen, beide Richtungen |
| Browser → `server.js` | HTTP/1.1, WS für HMR | JSON, über Vites Proxy für `/api` und `/media` |
| Oberfläche → `localStorage` | Web Storage API | JSON-Zeichenkette, ~5 MB Kontingent |
| `server.js` → fal.ai | HTTPS REST | hin JSON · zurück JPEG/PNG/WebP, MP4. Bilder synchron über `fal.run`, Filme über `queue.fal.run` mit Abgabe und Nachfragen |
| `server.js` → DeepSeek | HTTPS REST | JSON ⇄ JSON |
| `server.js` ⇄ Gemini | **WSS**, bidirektional | JSON-Rahmen, PCM16 base64 — 16 kHz hinauf, 24 kHz herunter |
| `server.js` → Platte | Dateisystem | Name = `Bun.hash` des Inhalts (64 Bit) |

**Die Gemini-Verbindung ist die einzige, die offen bleibt.** Alles andere ist
Anfrage und Antwort. Das ist der Grund, warum `server.js` ein Dauerprozess sein
muss: Supabase Edge Functions kappen WebSockets nach 150 s (kostenlos) bzw.
400 s (Pro), und ein Sprachinterview dauert länger.

## 3. Was am Entwurf trägt

Damit es beim Umbau nicht verlorengeht:

- **Die Vertrauensgrenze sitzt richtig.** Ein Prozess hält die Schlüssel, der
  Client sieht sie nie — auch nicht für das Sprachinterview, das deshalb als
  Relay gebaut ist und nicht als Direktverbindung zu Google.
- **Der Gatekeeper stuft Unbekanntes am strengsten ein.** Ein neuer Endpunkt
  bekommt die Bremse geschenkt, statt vergessen zu werden. Diese Voreinstellung
  hat `/api/character` gerettet, eine Stunde nach ihrer Einführung.
- **`resolveMedia()` arbeitet mit einer Positivliste**, geprüft gegen 50 Fälle
  inklusive `%00` und `../`.
- **Prompt-Hygiene gegen unsichtbare Zeichen** — Zero-Width, Bidi-Overrides,
  Unicode-TAG-Block. Ihr Test liest aus dem echten `server.js` statt aus einer
  Kopie; eine Kopie bliebe grün, während der Server längst durchließe.
- **Mediennamen stammen aus dem Inhalt**, nie aus etwas, das Client oder Modell
  gewählt haben.
- **Der Token-Vergleich läuft in konstanter Zeit.**

## 4. Befunde

Bewertet gegen den **geplanten** Betrieb — App im Store, echte Nutzer. Für den
heutigen Prototyp auf einem Laptop sind mehrere davon bewusst vertretbar.

| ID | Befund | Wirkung | Schwere |
|---|---|---|---|
| **S1** | `tokenMatches()` gibt `true` zurück, wenn kein `API_TOKEN` gesetzt ist. Der Zugangsschutz ist standardmäßig aus. | Wer den Port findet, generiert auf unsere Rechnung: 20 `generate` je Minute × bis $0,47 ≈ **$9 pro Minute**, unbemerkt. | **kritisch**, sobald öffentlich |
| **S2** | `/media/*` hat keinerlei Zugangsprüfung — `classOf()` gibt für alles außerhalb von `/api/` `null` zurück. | Gesichter realer Menschen, teils Dritter, dauerhaft per URL abrufbar. DSGVO Art. 9. | **hoch** |
| **S3** | `Bun.hash` ist Wyhash: 64 Bit, nicht kryptografisch, ohne Streuwert. Gleicher Inhalt → gleicher Name. | Existenz-Orakel: Wer ein Bild hat, kann prüfen, ob es bei uns liegt. Kollisionen überschreiben. | mittel |
| **S4** | ~~14 ausgehende `fetch`, null Abbruchsignale.~~ **Behoben am 11.09.2026.** | Ein hängender Anbieter hielt eine Verbindung bis 255 s; genug davon, und der Prozess nahm nichts mehr an. ⚠ **Nicht** der Fix für die verwaisten Filme — siehe „Zuverlässigkeit". | ✅ erledigt |
| **S5** | Mengenbremse zählt nach IP, im Arbeitsspeicher. | Neustart setzt alles zurück; hinter einem Proxy teilen sich alle einen Eimer. | mittel |
| **S6** | Transport unverschlüsselt (`http://`, dafür wurde die ATS-Ausnahme gebaut). | Traumtexte und Referenzfotos liegen im WLAN offen. | mittel, im Betrieb hoch |
| **S7** | Guthaben liegt im `localStorage` beim Kunden. | Kostenlose Generierung für jeden, der die Entwicklerwerkzeuge öffnet. | **hoch** |
| **S8** | `Bun.spawnSync` in der Anfragebearbeitung (`/api/film-outro`, ffmpeg). | Blockiert den einzigen Prozess vollständig — die ganze App steht. | mittel |

### ⚠ Was bei S1 zu beachten ist

S1 wurde am 11.09.2026 gebaut und **wieder zurückgenommen**. Der Grund gehört
hierher, damit ihn niemand ein zweites Mal entdecken muss:

**Der Client sendet gar keinen Token.** `x-api-token` kommt in `src/` nirgends
vor. `API_TOKEN` zu setzen sperrt deshalb heute *jeden* aus, auch localhost —
weshalb es vermutlich nie jemand gesetzt hat. Wer S1 schließen will, muss den
Token **zuerst** auf der Clientseite nachrüsten: fünf `fetch`-Stellen in
`api.js` plus die WebSocket-Verbindung in `voiceSession.js`, die keine
Kopfzeilen senden kann und ihn in die Adresse nehmen müsste.

Entschieden wurde stattdessen, S1 mit dem echten Backend zu lösen — ein Token
im Bundle ist ein Token, den jeder hat, und richtige Benutzerauthentifizierung
kommt ohnehin mit den Konten.

## 5. Qualitätsmerkmale

Nach ISO/IEC 25010, auf das beschränkt, was hier etwas entscheidet.

- **Sicherheit — schwach.** Die Grenze sitzt richtig, ist aber nicht
  verschlossen (S1, S2, S6). Die Eingabeprüfung dagegen ist überdurchschnittlich.
- **Zuverlässigkeit — schwach.** Ein Prozess ohne Ausfallsicherung, ein
  blockierender Unterprozess (S8). Was fehlt, ist eine Auftrags-
  warteschlange mit eigenem Zustand.

  **Die verwaisten Filme** (dreimal gesehen) haben eine belegte Erklärung,
  und sie stammt nicht aus diesem Review, sondern aus
  `docs/plans/2026-09-03-regisseur-schnitt.md`: `/api/generate` antwortet
  im Film-Modus erst, wenn der Regisseur fertig ist. Gibt der Client vorher
  auf, reicht der Server den Film trotzdem bei fal ein, und die
  Auftragsnummer erreicht niemanden mehr. Strukturfix: sofort eine Nummer
  zurückgeben (Schritt 5 unten).

  ⚠ Davon zu trennen ist ein zweiter, eigener Mangel in `jobStatus`: Eine
  Fehlantwort von fal auf die Statusabfrage wird als „läuft noch" gelesen
  (`if (!s.ok) return { status: "pending" }`). Ein Auftrag, dessen
  Statusabfrage dauerhaft scheitert, bliebe damit ewig „in Arbeit". Ob das
  je einen der beobachteten Filme betraf, ist **nicht belegt** — es ist ein
  Mangel im Code, keine erklärte Ursache.

  Und S4 (Zeitgrenzen) ist **keiner** der beiden Fixes. Eine Nebenwirkung
  könnte helfen — DeepSeek ist jetzt auf 240 s gedeckelt, der Client wartet
  300 s, der Regisseur läuft also nicht mehr über die Client-Uhr hinaus —,
  aber das ist eine ungetestete Vermutung.
- **Performanz — tragfähig.** Die Wartezeiten kommen vom Modell, nicht vom
  Aufbau: 96 % der erzeugten Token sind Denk-Token. Der Engpass ist die
  Bauweise — `/api/generate` hält die Verbindung, statt sofort eine
  Auftragsnummer zurückzugeben.
- **Wartbarkeit — gemischt.** `server.js` ist **eine Datei mit 151 KB**, der
  größte strukturelle Schuldposten: Jede Sitzung fasst dieselbe Datei an, was
  parallele Arbeit erzwungenermaßen serialisiert. Dagegen steht eine
  ungewöhnlich gute Testlage (517 Tests, fünf Prüfskripte) und eine
  Kommentarkultur, die Gründe festhält statt Verhalten.

## 6. Zielbild

Drei Bausteine kommen hinzu, jeder schließt mehrere Befunde. **Am Geldfluss
ändert sich nichts** — die drei Wege zu fal, DeepSeek und Gemini bleiben, wo
sie sind.

| Baustein | Schließt | Wozu |
|---|---|---|
| **TLS-Proxy** (Caddy) vor `server.js` | S6, S5 | Erzwingt HTTPS und liefert die echte Absender-IP, womit die Mengenbremse wieder das Richtige zählt |
| **Auftragswarteschlange** | S4, S8, Performanz | `/api/generate` antwortet sofort mit einer Nummer; ffmpeg blockiert niemanden mehr |
| **Supabase** (Postgres, Auth, Storage) | S2, S3, S7, S1 | Konten, Credit-Ledger mit Row Level Security, Dateien hinter kurzlebigen signierten Adressen. Begründet in `ADR-0005` |

`server.js` bleibt als ein Stück bestehen und zieht auf einen eigenen Host in
der EU. Warum es **nicht** in Supabase Edge Functions ziehen kann: Die Uhren
passen nicht (`api.js` gibt Analyse und Film je 300 s, eine Edge Function lebt
150/400 s), das Sprachinterview bräuchte eine längere Verbindung als erlaubt,
und die Mengenbremse zählt im Arbeitsspeicher eines Prozesses, den es dort
nicht gibt. Dazu 26 Aufrufstellen mit Bun-eigenen APIs und ein Unterprozess
(ffmpeg), den Edge Functions gar nicht starten dürfen.

## 7. Reihenfolge

Nach Wirkung je Aufwand, nicht nach Schwere.

1. ~~Zeitgrenzen auf alle ausgehenden Aufrufe (S4)~~ — **erledigt 11.09.2026**
2. **Konten und Ledger in Postgres (S7)** — das eigentliche Backend-Vorhaben.
   Append-only, in einer Transaktion gebucht, damit ein Abbruch mitten im
   Rendern kein Guthaben verschluckt. Löst nebenbei S1 richtig statt behelfsweise.
   **Begonnen 11.09.2026:** Schema ausgeführt und gegen sechs Invarianten
   geprüft (`supabase/`). `server.js` verbindet sich als eigene Rolle
   `dreamrushes_server` nach Least Privilege — auf das Guthaben nur lesend,
   ohne Umgehung von RLS, Geld nur über `server_spend()` & Co. für den per
   `withUser()` erklärten Nutzer (`src/lib/db.js`); 14 Verbote empirisch
   belegt. ⚠ S7 bleibt offen, bis `server.js` vor jedem Render
   `server_spend()` aufruft — ein Schema, das niemand fragt, schützt nichts.
   Das braucht zuerst die Anmeldung.
3. **TLS davor (S6, S5)** — Caddy holt das Zertifikat selbst.
4. **Medien nach Supabase Storage mit signierten Adressen (S2, S3)** — löst
   zugleich das Löschrecht: eine Datei, ein Besitzer, ein Löschbefehl.
5. **Warteschlange für Film, ffmpeg und Analyse (S8, Performanz)** — der größte
   Umbau, aber er löst Baustelle 1 aus `STAND.md`.
6. **`server.js` nach Themen teilen** — kein Sicherheitsbefund, aber der Posten,
   der jede weitere Änderung teurer macht.

---

## Anhang: veraltete Dokumente

**`ADR-0002` beschreibt einen Stack, den es nicht mehr gibt.** Titel und Text
nennen Higgsfield als Generierungs-API; im Code gibt es davon keinen einzigen
Treffer mehr. Tatsächlich angesprochen werden `fal.run`, `queue.fal.run`,
`api.deepseek.com` und `generativelanguage.googleapis.com`. Das ADR gehört
ersetzt, nicht bearbeitet — ein ADR hält fest, was damals entschieden wurde.

**Ein eigenes ADR für Capacitor fehlt — aber die Wahl ist nicht unbegründet.**
`ADR-0004` behandelt sie unter „Verworfene Alternativen":

> **Ein natives Neuschreiben (SwiftUI/Compose):** nie ernsthaft erwogen. Zwei
> getrennte Oberflächen für ein Produkt, das noch kein Bezahlmodell hat, wäre
> sowohl teuer als auch verfrüht.

Dazu nennt es die Bedingung für eine Neubewertung: „Wenn Capacitor sich als
untauglich erweist … dann aber als eigenes ADR mit echten Messungen, nicht aus
dem Bauch." Was fehlt, ist also kein Grund, sondern ein eigenes Dokument —
`WORKLOG.md` führt „Capacitor-ADR + In-App-Käufe" entsprechend als offenen
Punkt, gebunden an die Store-Konten.

**Die Datenschicht ist seit dem 11.09.2026 entschieden:** `ADR-0005` —
Supabase als Datenschicht, `server.js` bleibt der schlüsselhaltende Prozess.
Dort steht auch, warum Convex, Firebase und ein Selbstbau verworfen wurden
und unter welchen Bedingungen die Frage neu zu stellen ist.
