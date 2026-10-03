# ADR-0008: Träume nur auf dem Gerät — der Server hält die Logik, keine Träume

**Status:** vorgeschlagen · **Datum:** 2026-10-03 · **Format:** MADR
**Vorgeschlagen von:** Hanni. **Angenommen erst mit Antons Zustimmung** — die
Medienablage vom 24.09.2026 (Plan `docs/plans/2026-09-24-medienablage.md`,
Stand `c6b3690`) war eine gemeinsame Entscheidung, und diese ersetzt einen
Teil davon. Übergabe: `docs/uebergabe/2026-10-03-anton-traeume-lokal.md`.
**Verhältnis zu ADR-0005:** Supabase bleibt die Datenschicht für Konto,
Profil und Guthaben — nur Träume liegen nicht mehr dort.

## Kontext

Am 24.09.2026 haben Hanni und Anton entschieden: Träume liegen auf dem
Gerät, der Server hält eine Ende-zu-Ende-verschlüsselte Sicherung — Texte in
Supabase (Schritt B, gebaut und ausgerollt: Spalte `dreams.sealed`,
`/api/dreams`, `mobile/src/lib/dream-sync.ts`), Filme, Bilder und Aufnahmen
in Hetzner Object Storage (Schritt C, nur das Speicher-Modul
`src/lib/media-store.js` war gebaut, nicht angebunden; Zugangsdaten für den
Bucket gab es am 03.10. noch nicht).

Am 03.10.2026 schlug Hanni vor, ganz auf die Sicherung zu verzichten: Träume
nur lokal auf dem jeweiligen Gerät, auf dem VPS nur `server.js` mit der
Logik, damit die immer erreichbar ist.

Was dabei feststeht (geprüft am 03.10., Stand `c6b3690`):

- Filme, Bilder und Aufnahmen liegen auf dem Gerät unter
  `Documents/media/` (`mobile/src/lib/media-cache.ts`). Dieser Ordner ist
  **nicht** von der iOS-Gerätesicherung ausgenommen — kein
  `isExcludedFromBackup` im App-Code (ausgenommen ist nur das Modell des
  Glimpse-Renderers, `SketchModel.swift`). Er wandert also mit der
  iCloud-Gerätesicherung bzw. der Sicherung am Mac und kommt bei einem
  neuen iPhone aus der Sicherung mit.
- Das Tagebuch (Texte, Analyse, Titel) liegt bis zum Umzug der
  Datenschicht im `localStorage` der Web-Ansichten
  (`mobile/src/legacy/journal-bridge.jsx`, Kopfkommentar). Ob und wie
  verlässlich WebKit-Daten eine Gerätesicherung und Wiederherstellung
  überstehen, ist für diese App nicht geprüft.
- Die Filme kosten echtes Geld (Credits). Wer sie verliert, verliert
  Bezahltes.

## Betrachtete Optionen

1. **Wie geplant:** Texte verschlüsselt in Supabase (läuft), Medien
   verschlüsselt in Hetzner Object Storage (Schritt C).
2. **Nur Texte sichern:** Schritt B bleibt, Schritt C entfällt.
3. **Alles nur auf dem Gerät:** Schritt C entfällt, Schritt B wird
   zurückgebaut. Gesichert wird nur über die Gerätesicherung des iPhones.

## Entscheidung (vorgeschlagen)

Option 3: **Träume — Texte und Medien — liegen nur auf dem Gerät.** Der
Server erzeugt sie, gibt sie aus und hält sie nur so lange, bis das Gerät
sie abgeholt hat.

Gründe:
- **Datenschutz:** Wir speichern keine Traumtexte und keine Filme mit
  Gesichtern realer Menschen dauerhaft — auch nicht verschlüsselt. Für die
  Datenschutzerklärung, die Prüfung durch Apple und den Anwalt der
  einfachste Fall; die offene Frage nach der Aufbewahrungsdauer einer
  Sicherung entfällt.
- **Kein weiterer Dienst:** kein Object Storage, keine Kosten dafür, kein
  Bucket-Schlüssel auf dem Server.
- **Weniger bewegliche Teile:** kein Abgleich, kein Schlüssel-Abgleich
  zwischen Geräten, keine fremden Sicherungen.
- Der häufigste Verlustfall — neues iPhone — ist durch die Gerätesicherung
  abgedeckt, sobald das Tagebuch in `Documents/` liegt (siehe unten).

## Konsequenzen

**Besser:** Datenschutz, Kosten, Einfachheit, siehe oben. Das Konto dient
nur noch Anmeldung, Profil, Guthaben und Käufen.

**Schlechter:** Wer die App löscht (ohne Gerätesicherung) oder ein neues
iPhone ohne Sicherung einrichtet, verliert seine Träume und bezahlten
Filme. Ein zweites Gerät mit denselben Träumen gibt es nicht.

**Wird zur Pflicht — in dieser Reihenfolge:**

1. **Das Tagebuch zieht aus dem `localStorage` der Web-Ansichten in eine
   Datei unter `Documents/`** (Teil des Umzugs der Datenschicht,
   ADR-0006). Erst dann ist sicher, dass Texte die Gerätesicherung
   mitmachen.
2. **Erst danach Schritt B zurückbauen:** `dream-sync.ts`,
   `dream-sync-layer.tsx`, `/api/dreams`, `src/lib/dreamRow.js`,
   `backup-key.ts` (der iCloud-Schlüssel wird überflüssig), die Spalte
   `dreams.sealed` samt vorhandener Zeilen in Supabase löschen. Vorher
   wäre die Sicherung in Supabase die einzige verlässliche Kopie.
3. **Der Server löscht Filme nach dem Abholen** (bisher „Schritt C,
   zweiter Teil"). Ohne das sammelt der VPS alle Filme dauerhaft an, und
   `/media/*` bleibt offen (Befund S2). Die Film-Pipeline nutzt
   `/media/…`-Pfade als Keyframe- und Abspann-Quelle — wann eine Datei
   gelöscht werden darf, entscheidet Anton.
4. **Die App sagt es ehrlich:** Datenschutzerklärung, Einwilligung und
   Konto-Schritt — „Deine Träume liegen nur auf diesem Gerät und in seiner
   iCloud-Sicherung." Die Texte aus Schritt D (verschlüsselte Sicherung)
   werden ersetzt.
5. **`src/lib/media-store.js` entfällt** (samt Test, `.env.example`-
   Abschnitt `MEDIA_S3_*`, `.gitignore`-Eintrag).

## Verworfene Alternativen — warum

- **Option 1 (wie geplant):** sichert am meisten, kostet aber einen
  weiteren Dienst, einen Bucket-Schlüssel auf dem Server und dauerhaft
  gespeicherte, wenn auch verschlüsselte, Gesichter und Traumtexte. Für
  den Start mehr Last als Nutzen, solange die Gerätesicherung den
  häufigsten Fall abdeckt.
- **Option 2 (nur Texte):** Texte sind klein und schon gesichert — aber
  ohne die Filme rettet sie nur den halben Traum, und der Server hielte
  weiter Traumtexte. Hanni hat sich am 03.10. ausdrücklich für „auch
  Texte nur lokal" entschieden.

Kann später neu entschieden werden — etwa ein freiwilliger, verschlüsselter
Export für Nutzer, die ihre Träume selbst sichern wollen. Das wäre ein
neues ADR.
