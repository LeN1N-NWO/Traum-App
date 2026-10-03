für: Anton, LeN1N-NWO

# Übergabe an Anton — Träume nur auf dem Gerät? (03.10.2026, Hanni)

Ich schlage vor, die Sicherung auf dem Server ganz wegzulassen: Träume —
Texte und Filme — liegen nur auf dem jeweiligen Gerät. Auf dem VPS läuft nur
`server.js` mit der Logik. Ausgearbeitet in
`docs/decisions/ADR-0008-traeume-nur-auf-dem-geraet.md`, Status
**vorgeschlagen** — es ersetzt einen Teil unserer gemeinsamen Entscheidung
vom 24.09. und gilt erst mit deinem Ja.

## Kurz

- **Warum:** Wir speichern dann keine Traumtexte und keine Filme mit
  Gesichtern dauerhaft, auch nicht verschlüsselt. Kein Object Storage,
  keine Kosten, keine Aufbewahrungsfrage für den Anwalt, weniger Code.
- **Was man verliert:** Wer die App ohne Gerätesicherung löscht oder ein
  neues iPhone ohne Sicherung einrichtet, verliert seine Träume und
  bezahlten Filme.
- **Was es abfängt:** `Documents/media/` ist nicht von der iOS-Sicherung
  ausgenommen (geprüft) — bei einem neuen iPhone aus der Sicherung kommen
  die Filme mit.

## Was ich von dir brauche

1. **Ja oder Nein zu ADR-0008.** Bei Ja setzt du den Status auf
   „angenommen" (oder sagst es mir).
2. **Wann darf der Server einen Film löschen?** Das ist der Punkt, der dich
   direkt betrifft: Ohne Sicherung muss der Server Filme löschen, sobald das
   Gerät sie abgeholt hat — sonst sammelt der VPS alle an und `/media/*`
   bleibt offen (Befund S2). Laut `mobile/src/lib/media-cache.ts` gehen die
   `/media/…`-Pfade aber als **Keyframe- und Abspann-Quelle** an den Server
   zurück. Fragen:
   - Welche Aufrufe brauchen eine Datei noch, nachdem das Gerät sie hat
     (Abspann `/api/film-outro`, Keyframes, Glimpse-Ton, weitere)?
   - Können die die Datei stattdessen vom Gerät hochgeladen bekommen, oder
     lieber eine Frist (z. B. 24 h nach Abholung)?
3. **Reihenfolge bestätigen** (im ADR): Erst zieht das Tagebuch aus dem
   `localStorage` der Web-Ansichten in eine Datei unter `Documents/` (dein
   Umzug der Datenschicht) — **erst danach** bauen wir die verschlüsselte
   Text-Sicherung in Supabase zurück. Vorher wäre sie die einzige
   verlässliche Kopie der Texte.

## Was ich schon gemacht habe

- Schritt C (Medien in den Object Storage) **nicht** weitergebaut.
  `src/lib/media-store.js` ist markiert: nicht anbinden, bis du entschieden
  hast; bei Ja wird es gelöscht.
- Plan `2026-09-24-medienablage.md` und `ARCHITEKTUR.md` verweisen auf das
  ADR. Kein Code geändert.
- Die App-Texte („liegt nur auf diesem Gerät und in seiner
  iCloud-Sicherung") habe ich noch nicht angefasst — sie liegen in
  `en.js`/`de.js`, die auch dein PR #71 ändert.

## Damit wird hinfällig

Aus `2026-09-25-anton-vps-einrichtung.md` Punkt 3: den Object-Storage-Bucket
und die `MEDIA_S3_*`-Werte brauchst du nicht mehr anzulegen.
