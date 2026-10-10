# Übergabe an Hanni — Aufnahmen aufräumen, Geschenke ins Konto (Anton, 10.10.2026)

Zwei Server-Aufgaben aus Antons Fragen vom 10.10., dazu drei Kleinigkeiten.
Die App-Seite ist auf `session/2026-10-10-anton` (PR #97) erledigt. Hier
steht nur, was **auf dem Server** fehlt. Keine Eile vor dem TestFlight-Upload
am 14.10. — Teil 2 wird erst gebraucht, wenn jemand 24 Träume hat.

---

## 1. Verworfene Aufnahmen sollen nicht auf dem Server liegen bleiben

### Antons Frage

„Wenn jemand mit einer Aufnahme beginnt und dann auf Cancel drückt — bleibt
das irgendwo stecken, vermüllt das, erzeugt das Trash?"

### Was die App seit heute tut (`0b2c24b`)

- **Auf dem Gerät:** Jede Aufnahme wird gelöscht, sobald sie nicht mehr
  gebraucht wird. Das gilt für verworfen, zu kurz und sicher hochgeladen.
  Reste älter als 24 h räumt der Traum-Tab beim Öffnen weg
  (`mobile/src/lib/recordings.ts`).
- **Hochgeladen wird erst, wenn der Text da ist.** Vorher ging die
  Aufnahme schon beim Stopp an `/api/panel`, auch wenn man sie danach
  verwarf.
- **Der falsche Traum:** Eine liegengebliebene Aufnahme (`pendingAudioUrl`)
  wurde an den nächsten neuen Traum gehängt, auch an einen getippten. Das
  ist behoben.

### Was übrig bleibt — dein Teil

Wer aufnimmt, den Text bekommt und dann **nie speichert** (Wizard
abgebrochen, App geschlossen), hinterlässt eine `.m4a` in `MEDIA_DIR` mit
Besitz-Eintrag (`claimMedia` in `/api/panel`). Keine Traum-Zeile verweist
darauf. Sie wird erst mit dem Konto gelöscht.

**Vorschlag, zwei Teile:**

**a) Löschen auf Zuruf:** `DELETE /api/panel?url=/media/<name>`
- Nur für den Besitzer (`owners.owns(person.userId, name)`).
- Nur Tonaufnahmen (`.m4a` / Audio-Typ aus `MEDIA_TYPES`), keine Bilder
  oder Filme.
- Nur wenn **keine Traum-Zeile dieses Menschen** den Pfad enthält
  (`dreams.media->'audio'`, siehe `safeMedia` in `src/lib/dreamRow.js`).
- ⚠ Der Dateiname ist der Hash des Inhalts (`storeBytes`). Gleiche Bytes
  ergeben denselben Namen. Vor dem Löschen der Datei also prüfen, dass
  kein **anderer** Besitzer sie beansprucht; sonst nur den eigenen
  Besitz-Eintrag entfernen.
- Antwort 204, auch wenn es nichts zu löschen gab (die App wiederholt
  nicht).

Die App ruft das auf, sobald eine hochgeladene Aufnahme sicher nicht mehr
gebraucht wird: wenn eine neue Aufnahme sie ersetzt oder ein neuer Traum
beginnt, ohne dass der alte gespeichert wurde. „Cancel" allein löscht
nichts. Es führt nur zur Startseite, der Wizard behält seinen Stand
(`mobile/src/store/wizard-store.ts`), man kann zurückkommen. Das
verdrahte ich, sobald die Route steht. Alles andere fängt b).

**b) Nachts aufräumen (Sicherheitsnetz für Abstürze und abgebrochene
Apps):** Einmal täglich jede Audio-Datei in `MEDIA_DIR`, die
- älter als 7 Tage ist und
- in keiner Traum-Zeile ihres Besitzers vorkommt,

löschen, samt Besitz-Eintrag. Dateien ohne Besitzer, älter als 7 Tage,
ebenso. In der Produktion gibt es keine (`/api/panel` braucht mit
`REQUIRE_AUTH=1` ein Konto); lokal schon.

⚠ Gäste: Ihre Träume stehen nicht in `public.dreams`. Solange `/api/panel`
ein Konto verlangt, laden Gäste keine Aufnahmen hoch. Falls das je
geöffnet wird, dürfen Gast-Aufnahmen nicht unter b) fallen.

**Alternative „kommt erst gar nicht an":** Die App lädt erst beim
Speichern hoch statt nach dem Text. Dann bräuchte es keine
Server-Änderung, aber einen Wiederholungsweg in der App, falls der Upload
beim Speichern scheitert. Mein Vorschlag bleibt a) + b): Der Server ist
der einzige, der auch Abstürze sieht.

---

## 2. Die großen Ring-Geschenke müssen ins Konto gebucht werden

### Antons Entscheidung (10.10.)

„Große Geschenke gibt es nur für Leute, die schon mal etwas gekauft
haben." Für alle anderen gibt es bei 48 Träumen 10 Glimpses statt
50 Credits. Gezählt wird jeder Traum mit Glimpse oder Film
(`dreamCount`), nicht einer pro Tag.

| Traum | hat gekauft | nie gekauft |
|---|---|---|
| 3, 6, 9, 15, 18 … | 1 Glimpse | 1 Glimpse |
| 12 | Film aus dem Ring (iPhone) | Film aus dem Ring |
| 24 | + 16 Credits (ein 15-s-Film) | — |
| 36 | + 32 Credits (zwei Filme) | — |
| 48 | + 50 Credits („volle Blüte") | + 10 Glimpses |

Die Rechnung dazu (Bericht an Anton, 10.10.): Wer kauft, bringt uns mit
der ganzen Staffel nicht ins Minus (≈ $2,77 Einkauf je Käufer). Wer nie
kauft, kostet bei 48 nur 10 Glimpses ≈ $0,39.

### Was die App tut (Gerät)

- `src/lib/streakBoard.js`: `giftFor` / `bigGiftAt` / `isPaid`.
- **Glimpses sind jetzt eine eigene Kategorie, keine Credits:**
  `state.glimpseGifts` (Zähler). Sie verfallen nicht, gelten nur für
  einen Glimpse, nie für einen Film. Reihenfolge beim Einlösen: erst die
  5 Gratis-Glimpses des Monats, dann die geschenkten, dann Credits
  (`src/lib/sketchQuota.js` `sketchGiftLeft`, `sketchCost`,
  `countSketch`). Antons Frage war genau das: „Das braucht pro User noch
  eine andere Kategorie, speziell Glimpses, nicht nur Punkte."
- **Credit-Geschenke** (24/36/48 nach einem Kauf) gehen wie bisher in den
  Geschenktopf (`giftCredits`, 30 Tage gültig).
- **„Hat gekauft"** = `state.paidAt`. Gesetzt beim ersten bestätigten
  Apple-Kauf (Brücken-Befehl `purchase`, Paket oder Abo).

### Das Problem mit Konto

Mit Konto zeigt und bucht die App den **Kontostand des Servers** (S7
Phase 2, `shownCredits` in `journal-bridge.jsx`). Der Geschenktopf auf
dem Gerät ist dann unsichtbar und nicht ausgebbar. Ein Käufer mit Konto
bekäme bei 24 die Meldung „Ein Traumfilm, von uns", aber keine Credits.
**Das muss vor dem ersten Menschen mit 24 Träumen stehen.**

### Vorschlag

1. **Migration:** `alter type public.credit_reason add value 'gift';`
2. **`POST /api/gifts/claim`** (mit Konto, ohne Eingaben aus dem Body).
   Der Server rechnet selbst:
   - `count` = Traum-Zeilen dieses Menschen mit Bild oder Film. Das
     entspricht `isFilmNight` in `src/lib/nights.js`: keine Ring-Filme
     (`kind = "moonfilm"`), keine Beispielträume, keine leeren Nächte.
   - `paid` = es gibt eine Ledger-Zeile `purchase` oder
     `subscription_refill`. Das hängt an der Belegprüfung (B1): Solange
     Käufe nur lokal gutgeschrieben werden, weiß der Server nichts davon.
   - Für jedes `n` aus 24, 36, 48 mit `n ≤ count` und `paid`:
     `server_grant(credits, 'gift', 'ring-gift-' || n)` in den Topf
     `purchased`. Doppelt gebucht wird nie: Der Unique-Index
     `credits_ledger_no_double_booking (user_id, reason, ref, bucket)`
     fängt jeden zweiten Aufruf ab.
   - Antwort: der neue Kontostand.
   - Ich habe `purchased` statt eines eigenen Geschenktopfs gewählt, weil
     `allowance` beim Abo-Monatswechsel **gesetzt** wird, ein Geschenk
     dort also verschwände. Die Server-Geschenke verfallen damit nicht.
     Das ist großzügiger als auf dem Gerät (30 Tage) und betrifft nur
     Käufer. Wenn du einen eigenen Topf mit Ablauf willst, sag Bescheid.
3. **Glimpse-Kategorie auf dem Server:** erst nötig, wenn der Server
   Glimpses abbucht. Heute sind sie für Angemeldete gratis (`deviceSpend`,
   deine Entscheidung 06.10.). Dann bitte eine Spalte
   `glimpse_gifts integer not null default 0` (z. B. in
   `credits_balance`). Sie steigt bei 3, 6, 9 … und bei 48 ohne Kauf um 10
   und sinkt, wenn ein Glimpse nach den 5 Gratis des Monats gemacht wird.
   Bis dahin zählt das Gerät.

**App-Seite danach (mache ich):** Bekommt jemand mit Konto ein
Credit-Geschenk (`giftFor` → Art `ringFilm`, `ringFilms`, `bloom`), ruft
die Brücke `/api/gifts/claim` und holt den Kontostand neu
(`refreshKonto(true)`).

---

## 3. Kleinigkeiten aus dieser Session

- **Galaxie als Bilder:** `mobile/assets/galaxy/*.webp` (4 Dateien,
  zusammen 1,2 MB, verlustfrei). Erzeugt mit `node scripts/galaxy-art.mjs`
  aus `mobile/src/lib/galaxy-geometry.ts`. Metro packt sie ein, **kein
  Prebuild nötig**. Grund: Antons „Lag beim ersten Öffnen des
  Traum-Tabs". Das SVG brauchte gut eine Sekunde Hauptthread, jetzt sind
  es ~45 ms.
- **Reanimated-Schalter `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS`:** würde jede
  laufende Animation billiger machen (Deckkraft und Drehung ohne Umweg
  über den Schattenbaum). Er braucht aber `pod install`, also deinen Mac.
  Kein Muss vor dem 14.10.
- **`EXPO_PUBLIC_DEV_PREVIEW`** nie im TestFlight-Build setzen. Er
  schaltet die Vorschau-Seite `profile/moonweave-preview` frei.
