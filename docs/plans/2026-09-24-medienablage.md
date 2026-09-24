# Plan: Medienablage nach Supabase Storage — umzugsfähig für Hetzner

> 24.09.2026, Hanni + Claude. **Wartet auf Antons finales Go**
> (`docs/uebergabe/2026-09-24-anton-hosting.md`). Grundlage:
> `docs/plans/2026-09-24-hosting.md`. Schließt N9/S2 (Medien ohne
> Zugangsprüfung), S3 (erratbare Namen), B8 (Medien beim Konto-Löschen).
> **Antons Prompt-Kette, Modelle, Regie bleiben unberührt** — geändert wird
> nur, WO Bytes abgelegt und WOHER sie gelesen werden.

## Ziel

Filme, Bilder und Sprachaufnahmen liegen in einem **privaten Speicher, je
Konto ein Ordner**, erreichbar nur über **befristete Adressen**. Der Server
hält keine Nutzerdateien mehr dauerhaft und wird austauschbar. Ein Wechsel
von Supabase Storage zu Hetzner Object Storage ist ein **Umzug** (Dateien
kopieren, Einstellung tauschen), kein Umbau.

## Heute (Code-Stand 24.09., `4b5a79a`)

| Was | Wo | Befund |
|---|---|---|
| Ablegen | `storeBytes()` `server.js:1945`, `storeMedia()` `:1957` | schreibt nach `media/<Bun.hash>.<ext>` — Name aus dem Inhalt, **erratbar/prüfbar** (S3) |
| Aus fal kopieren | `storeAll()` `:2042`, Aufrufer `:1767`, `:1803` | nach jedem fertigen Auftrag |
| Hochladen aus der App | `/api/panel` `:3469` | Bildausschnitte, **Sprachaufnahmen** |
| Ausliefern | `serveMedia()` `:2059`, Route `:3485` | **ohne jede Zugangsprüfung** (S2), `cache: immutable` |
| Zurücklesen als Bytes | Film-Keyframe `:2145`, Bildketten-Anker `:2937` | → data-URI an fal |
| ffmpeg | Abspann `appendOutro()` `:1995`, Standbild `:1797` | braucht **lokale Dateien** |
| Auftragsstand | `JOBS_DIR` `:1553` = `media/jobs/*.json` | Aufträge liegen auf der Platte — ein Neustart mitten im Render verliert den Stand |
| Stimmproben | `:311` | Zwischenspeicher, jederzeit neu erzeugbar |
| Dev-Sicherungen | `/api/journal-backup`, `/api/cast-backup` (`:3028`, `:3074`) | **cast-backup enthält Fotos** — laut `castBackup.js` vor der Veröffentlichung entfernen |
| App: Adresse bilden | `mediaUrl()` `src/lib/api.js:21`, `absolute()` `journal-bridge.jsx:67` | **eine** Stelle, synchron: `/media/x` → `API_BASE/media/x` |
| Nutzerbezug | `/api/generate`, `/api/job`, `/api/panel` | **prüfen keine Anmeldung** — Filme entstehen auch ohne Konto |

## ⚠ Entscheidungen vor dem Bau

**E1 — Wem gehört ein Film ohne Konto?** (Produktfrage, Hanni + Anton)
Ordner je Konto setzt voraus, dass der Server beim Erzeugen weiß, wer
fragt. Heute kennt er niemanden.
- **a) Filme nur mit Konto.** Einfach und sauber; passt zu B1 (Credits im
  Server-Ledger hängen ohnehin am Konto). Apple verbietet Anmeldezwang nur,
  wenn die App ohne Konto sinnvoll nutzbar ist — Aufnehmen, Tagebuch,
  Schlaf bleiben ohne Konto; der Film ist die kostenpflichtige Leistung.
  Konto-Anlage per „Mit Apple anmelden" ist ein Tipp.
- **b) Anonymer Bereich:** ohne Konto ein Ordner je Gerät (zufällige
  Geräte-Kennung). Mehr Code, und „wer die Kennung hat, hat die Filme" —
  schwächer als a).
- **Empfehlung: a)**, mit Anton abstimmen (Onboarding-Text, Conversion).

**E2 — Aufbewahrung.** Die Datenschutzerklärung verspricht „automatische
Löschung alter Renderings … vor dem öffentlichen Start". Wie lange? (z. B.
unbegrenzt solange Konto besteht vs. X Monate nach letzter Nutzung) — auch
Frage an den Anwalt.

**E3 — Gültigkeit der befristeten Adressen.** Vorschlag 1 Stunde; die App
holt nach, wenn eine abläuft.

**E4 — Supabase Pro** ab wann? Spätestens vor TestFlight mit Freunden (Free
pausiert nach 1 Woche).

## Aufbau

### Ein Speicher-Modul, zwei (später drei) Umsetzungen
`src/lib/media-store.js` — die EINZIGE Stelle, die Speicher kennt:

```
put(owner, bytes, contentType)  → key        // "<owner>/<zufall>.<ext>"
get(owner, key)                  → bytes      // Keyframe, Anker, ffmpeg
signedUrl(owner, key, ttl)       → url        // befristet
remove(owner, key)
removeAll(owner)                              // Konto löschen
```

- Jeder Aufruf prüft zuerst: **`key` beginnt mit `owner/`** — sonst Abbruch.
  So kann ein Fehler im Server keine fremde Datei ausliefern, egal welcher
  Speicher dahinterliegt.
- **Schlüssel statt Adressen:** In Tagebuch und Datenbank steht nur
  `<owner>/<zufall>.<ext>`, nie eine Anbieter-URL. Zufallsnamen statt
  Inhalts-Hash (schließt S3).
- Umsetzungen:
  1. **`local`** — Dateien auf der Platte wie heute. **Standard, wenn keine
     Supabase-Schlüssel da sind** (Antons Mac, Cloud-Sitzungen) — damit
     niemandem die Entwicklung kaputtgeht.
  2. **`supabase`** — Storage-REST-API **mit dem Token des Nutzers** und dem
     anon-Schlüssel; Regeln in der Datenbank: nur der eigene Ordner. **Kein
     `service_role`-Schlüssel.**
  3. später **`s3`** (Hetzner Object Storage) — hier hält der Server einen
     Schlüssel für EINEN Bucket; die Eigentumsprüfung macht dann allein
     `media-store.js` (siehe oben). Das ist schwächer als RLS — bewusst
     festgehalten, falls wir umziehen.
- **Ein Vertragstest** prüft dieselben Befehle gegen jede Umsetzung
  (`local` immer, `supabase` nur mit gesetzten Testzugangsdaten).

⚠ Offen, vor dem Bau prüfen: Supabases **S3-Schnittstelle mit Nutzer-Token**
(„session token", RLS gilt) — wenn das geht, kann Supabase über dieselbe
S3-Umsetzung laufen wie später Hetzner, und der Umzug wird noch kleiner.
Wenn nicht, bleibt es bei der REST-Umsetzung — das Modul verdeckt den
Unterschied ohnehin.

### Datenbank (Migration, führt Hanni aus)
- Privater Bucket `media` (nicht öffentlich), Größenlimit je Datei (60 MB
  wie heute `MAX_MEDIA_BYTES`), erlaubte Typen: png, jpeg, webp, mp4, m4a.
- Regeln auf `storage.objects`: **lesen, anlegen, löschen nur im Ordner
  `auth.uid()`**; kein Ändern (Dateien sind unveränderlich).
- **Belegen wie am 23.09.:** Rechte per Abfrage, dazu Negativprobe — Nutzer
  B versucht, eine Datei von A zu lesen/löschen → muss mit Grund scheitern,
  nicht nur „0 Zeilen".

### Server (`server.js` — nur Medienablage)
1. `storeBytes`/`storeMedia`/`storeAll` → `mediaStore.put(owner, …)`.
2. `serveMedia` → bleibt nur für `local` (Entwicklung); in Produktion
   liefert der Speicher selbst aus.
3. **Neu `POST /api/media/sign`** `{keys:[…]}` → befristete Adressen, nur für
   eigene Schlüssel (Eigentumsprüfung + RLS).
4. Keyframe/Anker (`:2145`, `:2937`) → `mediaStore.get(owner, key)`.
   ⚠ Das liegt IN der Film-Route neben Antons Code — geändert werden nur
   die zwei Zeilen, die Bytes holen, per Diff belegt.
5. Abspann/Standbild: Film in eine **temporäre Datei** holen, ffmpeg,
   Ergebnis `put`, Temp löschen.
6. `/api/generate`, `/api/job`, `/api/panel`, `/api/film-outro`: Anmeldung
   prüfen (je nach E1), `owner` = geprüfte Nutzer-ID.
7. **Konto löschen:** `mediaStore.removeAll(owner)` **vor**
   `server_delete_account()` (Reihenfolge wie beim Apple-Widerruf: erst das,
   was nach dem Löschen niemand mehr anstoßen kann).
8. Auftragsstand (`media/jobs`) bleibt zunächst auf der Platte — ⚠ Risiko
   bei Neustart mitten im Render; eigener Schritt später (Tabelle `jobs`).

### App
- `mediaUrl()` / `absolute()` erkennen neue Schlüssel und schlagen sie in
  einem **Zwischenspeicher befristeter Adressen** nach; fehlende/ablaufende
  werden gesammelt per `/api/media/sign` geholt (ein Aufruf für viele), dann
  neuer Snapshot. `/media/…`-Pfade (alt, Entwicklung) funktionieren weiter.
- Die Träume-Sicherung trägt nur Schlüssel — passt, `safeMedia()` lässt
  Pfade durch und verwirft `data:`.
- Teilen: der Film wird über die befristete Adresse geladen — wie heute.

### Aufräumen
- `/api/journal-backup` und `/api/cast-backup` (**Fotos!**) in Produktion
  abschalten bzw. entfernen, wie `castBackup.js` es verlangt.
- Vorhandene Dateien: nur Entwicklungsdaten (15 MB) — Umzugsskript
  optional, kein Muss.

## Reihenfolge und Aufwand (Schätzung)

| Schritt | Wer | Aufwand |
|---|---|---|
| 0. E1–E4 entscheiden | Hanni + Anton | — |
| 1. Supabase-S3-mit-Nutzer-Token prüfen | Claude | klein |
| 2. `media-store.js` + `local` + Vertragstest | Claude | 1 Sitzung |
| 3. Migration Bucket + Regeln, belegen | Claude schreibt, Hanni führt aus | klein |
| 4. `supabase`-Umsetzung + Test gegen echtes Projekt | Claude + Hanni | 1 Sitzung |
| 5. Server umhängen (1–7 oben) | Claude, Diff an Anton | 1 Sitzung |
| 6. App: befristete Adressen | Claude | ½ Sitzung |
| 7. Ende-zu-Ende im Simulator/iPhone: Film, Teilen, Konto löschen → Ordner leer | Hanni + Claude | ½ Sitzung |

## Was dieser Plan NICHT löst
- Auftragsstand auf der Platte (Schritt 8 oben, eigener Plan).
- Aufbewahrungsfristen (E2) — nur die Entscheidung, nicht der Löschjob.
- Die Hetzner-Umsetzung selbst — nur die Tür dafür.
