# Plan: Träume lokal, Sicherung Ende-zu-Ende verschlüsselt

> 24.09.2026, Hanni + Anton + Claude. **Ersetzt** die erste Fassung dieses
> Plans (Supabase Storage mit befristeten Adressen, Commit `506bbc8`).
> **Antons Prompt-Kette, Modelle, Regie bleiben unberührt.**

## Entscheidungen (Hanni + Anton, 24.09.)

1. **Träume liegen auf dem Gerät** — Text UND Filme, Bilder, Aufnahmen
   (5–10 MB je Film). Abgespielt wird vom Gerät, jederzeit, auch offline.
2. **Der Server hält eine verschlüsselte Sicherung** — nur als Backup:
   App gelöscht, Handy verloren, neues Handy. **Wer sein Konto löscht,
   verliert die Träume** (Konto-Löschung löscht auch die Sicherung —
   Apple 5.1.1(v), DSGVO Art. 17).
3. **Server:** Antons vorhandener **Hetzner-VPS** — unter den Bedingungen
   unten.

## Schlüssel: Ende-zu-Ende, im iCloud-Schlüsselbund

- Die App erzeugt je Nutzer einen **AES-256-Schlüssel** (`expo-crypto`,
  nativ, AES-GCM) und verschlüsselt **auf dem Gerät**. Server und
  Speicheranbieter sehen nur unlesbare Daten — auch wir nicht.
- Der Schlüssel liegt im **iCloud-Schlüsselbund** (synchronisiert mit der
  Apple-ID). Er übersteht: App löschen ✓, Handy verloren/neu (gleiche
  Apple-ID) ✓. Er geht verloren: Apple-ID gewechselt oder iCloud-
  Schlüsselbund aus → dann ist die Sicherung nicht lesbar.
- Technik: `expo-secure-store` kennt keine iCloud-Synchronisation —
  **Bun-Patch** (`kSecAttrSynchronizable`), wie schon bei
  `expo-modules-jsi`. Neuer App-Bau nötig.
- Jede verschlüsselte Sicherung trägt eine **Schlüssel-Kennung** (Hash des
  Schlüssels, nicht der Schlüssel). Findet ein Gerät Sicherungen mit einer
  fremden Kennung, überschreibt es sie nie und legt keinen zweiten
  Schlüssel an, sondern sagt: „Diese Sicherung gehört zu einem anderen
  Schlüssel".
- **Später (offen):** Wiederherstellungscode zum Aufschreiben, für
  Nutzer ohne iCloud-Schlüsselbund; Android (Google-Konto-Backup).

## Wo was liegt

| Was | Gerät | Server |
|---|---|---|
| Traumtext, Titel, Analyse, Reflexion | ✅ (Tagebuch) | **verschlüsselt** in Supabase `dreams.sealed` |
| Filme, Bilder, Aufnahmen | ✅ `Documents/media/` (iOS räumt es nicht weg) | heute unverschlüsselt in `media/` auf dem Server → **Schritt C** |
| Konto, Profil, Guthaben-Buch | — | Supabase (unverändert) |

## Schritte

**A — Medien aufs Gerät (jetzt).** Jeder Snapshot der Brücke läuft durch
`journal-store.ts`. Dort: `/media/…`-Adressen, deren Datei schon unter
`Documents/media/` liegt, durch die lokale Datei ersetzen; fehlende im
Hintergrund laden. Name = der Inhalts-Hash, den der Server vergibt
(unverändert). Die Brücke, die Tagebuch-Daten und der Server bleiben, wie
sie sind.

**B — Verschlüsselte Träume-Sicherung (jetzt).**
- Migration: `dreams.sealed text`, `dreams.key_id text`; die Klartext-
  Spalten bleiben (leer) für die Kompatibilität.
- Server `/api/dreams/sync` nimmt **nur noch** `{id, createdAt, editedAt,
  sealed, keyId}` — Klartext wird abgelehnt, damit kein alter Client je
  wieder Klartext schickt. `GET /api/dreams` liefert dasselbe zurück.
  Vorhandene Klartext-Zeilen werden beim nächsten Abgleich überschrieben
  (Klartext-Spalten geleert).
- App: `dream-sync.ts` verschlüsselt jeden Traum (Sicherungsform aus
  `journalBackup.js`, also nie Fotos) vor dem Senden und entschlüsselt
  nach dem Holen. Schlüssel aus `backup-key.ts`.

**C — Medien-Sicherung verschlüsselt (nach Antons Server-Umzug).**
- Das Gerät verschlüsselt jede Datei und lädt sie hoch; der Server legt sie
  in **Hetzner Object Storage** ab (S3, DE, 6,49 €/Monat für 1 TB inkl.
  Traffic; Hetzner ist durch den VPS schon Auftragsverarbeiter — kein neuer
  Anbieter). Weil verschlüsselt, genügt ein Bucket-Schlüssel auf dem Server
  (keine Regeln je Nutzer nötig).
- Der Server hält Filme **nur, bis das Gerät sie abgeholt hat**, danach
  löschen (heute bleiben sie unbegrenzt — S2/S3 lösen sich damit).
- Konto löschen löscht die Sicherung (Supabase-Zeilen per Kaskade ✓,
  Objekte in Hetzner ausdrücklich).
- Speicher-Modul mit einer Schnittstelle (ablegen/holen/löschen/alles eines
  Kontos löschen), `local` für die Entwicklung.

**D — Texte.** Datenschutzerklärung, Einwilligung, Konto-Schritt: „liegt
auf diesem Gerät; die Sicherung ist so verschlüsselt, dass nur du sie
lesen kannst".

## Bedingungen für Antons Hetzner-VPS

1. Standort **Deutschland oder Finnland** (Hetzner hat auch USA/Singapur).
2. **Getrennt** von Antons anderen Projekten: eigener Systemnutzer, eigene
   `.env` (nur für diesen Nutzer lesbar), Firewall 22/80/443.
3. **Zuständigkeit:** Anton pflegt (Updates, Neustart); wer außer ihm Zugang
   hat, ist festgelegt.
4. **Auftragsverarbeitungsvertrag** mit Hetzner (im Kundenkonto), Eintrag in
   der Datenschutzerklärung.
5. Einrichtung als Skript im Repo (Bun, ffmpeg, Caddy, systemd, Updates,
   Deploy mit einem Befehl).

## Offen
- Aufbewahrung: wie lange nach letzter Nutzung bleibt eine Sicherung?
  (Anwalt)
- Auftragsstand (`media/jobs`) liegt weiter auf der Platte des Servers.
- `/api/cast-backup` (speichert Fotos!) vor der Veröffentlichung entfernen.
