für: Anton, LeN1N-NWO

Hallo Anton — für die App-Store-Prüfung muss der Server raus aus unserem
WLAN. Die Grundlage steht in `docs/plans/2026-09-24-hosting.md` (Anforderungen
aus dem Code, Optionen, Kostenvergleich). Hier kurz, was ich vorschlage und
was wir beide noch entscheiden müssen.

## Mein Vorschlag

**1. Server:** ein kleiner Linux-Server (VPS) bei einem deutschen Anbieter
(Hetzner oder Strato), davor Caddy für HTTPS, `server.js` als Dienst. Serverlos
geht nicht: Filme brauchen Minuten, das Sprachinterview hält einen
WebSocket, wir brauchen ffmpeg, und die Mengenbremse zählt in einem Prozess.

**2. Medien (Filme, Bilder, Aufnahmen): zuerst Supabase Storage** —
privater Bucket in Frankfurt, je Konto ein Ordner, kurzlebige signierte
Adressen. Damit ist auch das Problem weg, dass heute jeder mit einer
`/media/…`-Adresse die Datei laden kann (Gesichter realer Menschen), und
beim Konto-Löschen können die Medien mit.

Dazu eine Klarstellung, damit wir nicht mit falschen Zahlen planen:
„kostenlos" heißt hier **ohne Mehrkosten**, nicht ohne Kosten. Der
Supabase-Gratis-Tarif pausiert nach einer Woche ohne Zugriff (ist uns am
22.09. passiert) — für echte Nutzer brauchen wir **Supabase Pro (25 $/Monat)
sowieso**, schon wegen Konten und Datenbank. Darin sind 100 GB Speicher und
250 GB Abspiel-Traffic enthalten. Nach unserer Schätzung (8 Filme je Nutzer
und Monat, je 3× angesehen) reicht das bis etwa **1.000 Nutzer praktisch ohne
Aufpreis**. Bei ~10.000 Nutzern würde Supabase durch den Abspiel-Traffic
~185–270 $/Monat extra kosten, Hetzner Object Storage ~57 €.

**3. Deshalb den Code von Anfang an umzugsfähig bauen** — damit der Wechsel
zu Hetzner Object Storage, falls wir so groß werden, ein Umzug ist und kein
Umbau:
- **Eine einzige Stelle im Code spricht mit dem Speicher** (eigenes Modul,
  z. B. `src/lib/media-store.js`) mit wenigen Befehlen: ablegen, befristete
  Adresse holen, löschen, alles eines Kontos löschen. `server.js` ruft nur
  diese Befehle auf und weiß nicht, wo die Dateien liegen.
- **In der Datenbank stehen nur Schlüssel** wie `konto-id/datei.mp4`, **nie
  fertige Adressen** eines Anbieters. Die App bekommt die Adresse beim
  Anzeigen frisch vom Server.
- **S3-kompatibel ansprechen,** wo es geht: Hetzner Object Storage spricht
  S3, Supabase Storage bietet ebenfalls eine S3-Schnittstelle. Dann ist der
  Wechsel im besten Fall: Dateien kopieren, Zugangsdaten tauschen. (Wie gut
  sich Supabases S3-Weg mit unserer Least-Privilege-Linie verträgt — ohne
  Generalschlüssel —, prüfe ich vor dem Bau.)
- Ein Test, der dieselben Befehle gegen beide Speicher prüft.

Das betrifft in `server.js` nur die Medienablage — **deine Prompt-Kette,
Modelle und Regie bleiben unberührt.** Wo genau die neue Datei andockt,
würde ich vorher mit dir absprechen.

## Was wir beide entscheiden müssen

1. **Wer pflegt den Server?** Einer muss Zugang haben und im Notfall
   reagieren (Updates, Neustart). Die Routine — automatische Updates,
   Neustart nach Absturz, Deploy mit einem Befehl — bauen wir einmal als
   Skript.
2. **Hetzner oder Strato** für den Server? Beides deutsch. Strato VPS S:
   4 €/Monat (2 € die ersten 3 Monate, 9 € Einrichtung), Backups nicht
   enthalten. Hetzner: Preis im Rechner, unter Entwicklern verbreiteter,
   IPv6 und Snapshots eingebaut. Die Domains (`dreamrushes.app`,
   `dreamrushes.de`) liegen bei Strato.
3. **Budget:** Supabase Pro (25 $) + Server (wenige Euro) + Domains. Wer
   zahlt, bis die UG steht?
4. **Wann:** Für TestFlight mit Freunden würde der Server sofort reichen;
   Medien nach Supabase müssen vor der Einreichung fertig sein.
5. Außerdem noch offen aus Phase 0 (Plan `2026-09-23-app-store-pruefung.md`):
   **Wie sieht der Prüfer einen Film** (Sandbox-Kauf und/oder kleines
   Willkommensguthaben — deine Geldfrage) und **in welchen Ländern starten
   wir** (Vorschlag: DACH + englischsprachig, weil de/en fertig sind)?

Sag mir einfach deine Sicht zu 1–5, dann trage ich es in den Plan ein.

Hanni
