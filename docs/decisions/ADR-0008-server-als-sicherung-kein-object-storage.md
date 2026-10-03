# ADR-0008: Medien bleiben auf dem Server als Sicherung — kein Object Storage

**Status:** angenommen · **Datum:** 2026-10-03 · **Format:** MADR
**Entschieden von:** Hanni und Anton (abgestimmt am 03.10.2026).
**Verhältnis zur Medienablage vom 24.09.2026** (Plan
`docs/plans/2026-09-24-medienablage.md`, Stand `c6b3690`): ersetzt Schritt C
(Medien verschlüsselt vom Gerät in Hetzner Object Storage hochladen) und
dessen zweiten Teil (Server löscht Filme nach dem Abholen). Schritt A
(Medien aufs Gerät) und Schritt B (Traumtexte Ende-zu-Ende verschlüsselt in
Supabase) bleiben, wie sie sind.

## Kontext

Die Medienablage vom 24.09. sah vor: Das Gerät verschlüsselt jeden Film,
jedes Bild, jede Aufnahme und lädt sie als Sicherung in Hetzner Object
Storage; der Server löscht seine Kopie, sobald das Gerät sie abgeholt hat.
Am 03.10. war davon nur das Speicher-Modul `src/lib/media-store.js` gebaut,
nicht angebunden; Zugangsdaten für einen Bucket gab es nicht.

Dabei fiel auf: Jede Datei **entsteht ohnehin auf dem Server**
(`server.js` holt sie von fal.ai und legt sie unter `/media/` ab). Sie vom
Gerät verschlüsselt wieder hochzuladen hieße, sie ein zweites Mal über die
Leitung zu schicken — für eine Kopie dessen, was der Server schon hat. Und
die Film-Pipeline braucht die Dateien auf dem Server weiter: Die
`/media/…`-Pfade gehen als Keyframe- und Abspann-Quelle zurück
(`mobile/src/lib/media-cache.ts`, Kopfkommentar). Ein Löschen nach dem
Abholen hätte das gebrochen.

Hanni hatte zwischendurch vorgeschlagen, ganz ohne Sicherung auszukommen
(nur das Gerät, plus dessen iOS-Gerätesicherung). Nach Rücksprache mit Anton
gilt stattdessen der Plan unten.

## Betrachtete Optionen

1. **Wie am 24.09. geplant:** Gerät verschlüsselt und lädt in Object
   Storage, Server löscht nach dem Abholen.
2. **Nur auf dem Gerät:** keine Sicherung auf dem Server, Server löscht nach
   dem Abholen; gerettet wird nur über die iOS-Gerätesicherung.
3. **Server als Sicherung:** Die Datei bleibt dort, wo sie entsteht, auf dem
   VPS. Das Gerät holt sie einmal ab und nutzt ab dann die lokale Kopie.

## Entscheidung

Option 3. **Ein Film (Bild, Aufnahme) entsteht auf dem Server und bleibt
dort als Sicherung. Das Gerät holt ihn beim ersten Mal ab und spielt ihn ab
dann aus `Documents/media/`.** Geht auf dem Gerät etwas verloren (App neu
installiert, Datei beschädigt), lädt es die Datei einfach noch einmal.
Traumtexte bleiben Ende-zu-Ende verschlüsselt in Supabase (Schritt B).

Gründe:
- **Keine zusätzlichen Aufrufe:** kein Upload vom Gerät, kein zweiter Weg
  derselben Bytes, kein Bucket, kein Abgleich. Das Gerät lädt jede Datei
  einmal (Schritt A, schon gebaut).
- **Die Pipeline bleibt heil:** Keyframes und Abspann finden ihre Quellen
  weiter unter `/media/`.
- **Kein weiterer Dienst** für den Start.

## Konsequenzen

**Besser:** einfacher, weniger Code, weniger Datenverkehr; Wiederherstellung
nach Neuinstallation geht von selbst, solange das Konto besteht.

**Schlechter — und deshalb Pflicht:**

1. **Die Medien liegen unverschlüsselt auf dem Server, dauerhaft.** Darunter
   Gesichter realer Menschen, teils Dritter. Damit wird Befund **S2**
   (`/media/*` ohne Zugangsprüfung, jeder mit der Adresse kann abrufen) zur
   Voraussetzung für den Betrieb, nicht zur Nebensache:
   - Der Server muss wissen, **welche Datei wem gehört** — heute weiß er es
     nicht (keine Zuordnung in `server.js`). Die Stelle dafür: Filme holt
     der Server erst ab, wenn die App `/api/job` fragt (`jobStatus` →
     `storeAll` → `storeMedia` lädt die Datei von fal herunter und legt sie
     unter `/media/` ab). Diese Anfrage trägt seit S1 das geprüfte Token —
     dort ist bekannt, wem der Film gehört, ohne Prompts oder Modelle
     anzufassen. Bilder entsprechend an ihrer Ablage.
   - `/media/*` liefert nur an den Besitzer aus (Anmeldung wie bei S1).
   - **S3** (Dateiname aus 64-Bit-Hash, ratbar) verliert an Gewicht, sobald
     nur noch der Besitzer abrufen darf.
2. **Konto löschen löscht seine Medien** (Befund B8; Apple 5.1.1(v), DSGVO
   Art. 17) — geht nur mit der Zuordnung aus Punkt 1.
3. **Platz auf dem VPS ist begrenzt.** Ein Film hat 5–10 MB. Die Rechnung
   vom 24.09. (Hosting-Plan): bei 1.000 Nutzern im 12. Monat rund 670 GB —
   eine VPS-Platte wäre nach etwa einem Monat dieses Umfangs voll. Für den
   Start reicht sie. **Bevor sie knapp wird**, zieht die Ablage um: in
   Hetzner Object Storage hinter `src/lib/media-store.js` (dafür gebaut,
   bleibt deshalb liegen) — oder es gibt eine Aufbewahrungsregel. Das ist
   dann ein neues ADR.
4. **Die Sicherung braucht selbst eine Sicherung:** Snapshots/Backups des
   VPS bei Hetzner einschalten (steht schon in der Übergabe vom 25.09.).
5. **Der Film muss wirklich bei uns liegen.** Scheitert das Herunterladen
   von fal (z. B. Zeitüberschreitung), gibt `storeAll` heute statt der
   eigenen die **fal-Adresse** weiter (`(await storeMedia(u)) || u`, Stand
   `c6b3690`). Dann liegt der Film nur bei fal, dessen Adressen nicht
   dauerhaft gelten — die Sicherung hätte eine Lücke. Der Server muss das
   Herunterladen später erneut versuchen, statt die fal-Adresse zu behalten.
6. **Abgeholt wird nur, solange eine App fragt.** Fragt kein Gerät mehr
   `/api/job`, bleibt ein fertiger Film bei fal liegen (die bekannten
   „verwaisten Filme"). Für eine verlässliche Sicherung sollte der Server
   fertige Aufträge selbst abholen, nicht erst auf Nachfrage.
7. **Die App-Texte** (Schritt D sprach von einer verschlüsselten Medien-
   Sicherung) müssen sagen, was gilt: Texte verschlüsselt, Filme und Bilder
   auf unserem Server in Deutschland, nur für dich abrufbar, gelöscht mit
   deinem Konto.

## Verworfene Alternativen — warum

- **Option 1 (Object Storage, verschlüsselt):** schützt am besten, kostet
  aber einen Upload derselben Bytes, die der Server schon hat, einen
  weiteren Dienst und das Löschen nach dem Abholen — das die Film-Pipeline
  (Keyframes, Abspann) gebrochen hätte. Bleibt der Weg für später, wenn die
  Platte nicht mehr reicht; das Modul liegt bereit.
- **Option 2 (nur Gerät):** am datensparsamsten, aber wer die App ohne
  Gerätesicherung löscht, verliert bezahlte Filme, und das Löschen nach dem
  Abholen hätte dieselbe Pipeline-Frage aufgeworfen.
