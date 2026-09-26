# Begleiter-Animationsplan (Blaupause, 23.09.2026)

Antons Auftrag: drei wählbare Begleiter (Frog · Sloth · Owl, `src/lib/mascots.js`),
und ein Plan, WELCHE Animationen je Begleiter zu erstellen sind. Dazu der
Befund: Der schwarze Hintergrund hinter dem Frosch kommt aus der NATIVEN
Warteanimation (fest verdrahteter schwarzer Kreis) — im Web war er längst
transparent. Fix in dieser Session (Alpha-`.mov`, siehe unten).

## 1. Wo Begleiter in der App auftauchen (die Slots)

| # | Slot | Wo genau | Technik | Bindung an die Wahl |
|---|------|----------|---------|---------------------|
| S1 | **Schlafen/Warten** (Idle-Loop) | Web: `MascotLoader` (Wizard Schritte 1/5/6, Journal-Detail) · Nativ: `mascot-loader` (Traum „liest…", Rekorder, Journal-Bearbeiten, Reflexion) | Web: mp4 weiß-auf-Reinschwarz, `mix-blend-mode: screen` · Nativ: HEVC-Alpha-`.mov` (seit heute; vorher schwarzer Kreis) | JA — folgt der Wahl |
| S2 | **Knopf-Tipp** (greift rein, tippt „Erstellen") | Web: `ButtonTapOverlay` (WebGL-Alpha-Packung) · Nativ: `mascot-tap` (HEVC-Alpha) | 720×1280-Quelle → zwei Ableitungen + **gemessener Anker** je Datei (mascots.js) | JA — folgt der Wahl |
| S3 | **Onboarding-Wahlkachel** | Nativ `onboarding-flow` (Schritt „Wer begleitet dich?") | Standbild/Poster reicht (heute gezeichnetes Gesicht `MascotFace`) | ist die Wahl selbst |
| S4 | **Onboarding-Intro** (Hero) | Web `Onboarding.jsx` (`intro-faultier.mp4`, Vollbild mit eigenem Bild) | eigenständiger Film | NEIN — läuft VOR der Wahl, bleibt EIN Video |
| S5 | **Home-Hero** | Nativ `app/index` (`home-faultier.mp4`) | Vollbild-Clip mit eigenem Hintergrund | HEUTE NEIN — ⚠ Entscheidung: soll er der Wahl folgen? |
| S6 | Paywall-Rückfallfilm (Web), Journal-Karten-Idee (`faultier-assets.md`) | Deko | — | NEIN (Rückfall/Zukunft) |

## 2. Was je Begleiter zu ERSTELLEN ist (Antons Zeichnungen)

Nur ZWEI Quell-Animationen je Begleiter — alles andere leite ich per Skript ab:

**A. Idle-Loop** („legt sich hin und schläft", Slot S1 + Poster für S3)
- Weiße Kreide-Zeichnung auf **gemessenem Reinschwarz (RGB 0,0,0)** — sonst
  bleibt im Web ein Grauschleier
- Quadratisch, ≥ 500×500, 5–15 s, **nahtloser Loop**, ohne Ton
- Daraus automatisch: Poster-JPG (erstes Bild) + natives Alpha-`.mov`
  (ffmpeg-Rezept in `mascot-loader.tsx`)

**B. Knopf-Tipp** („greift von rechts unten rein und tippt", Slot S2)
- 720×1280 (hoch), ~5–7 s, weiß auf Reinschwarz; die tippende
  Hand/Pfote muss im **unteren Bilddrittel** treffen
- Daraus automatisch: Web-Alpha-Packung (`scripts/alpha-packen.mjs`) +
  natives HEVC-`.mov` (Rezept in `mascot-tap.tsx`) + **Anker-Messung**
  (x/y/scale/seconds → Zeile in `mascots.js`; Messweg steht im Dateikopf
  von mascots.js — nie schätzen, ein danebentippender Begleiter wirft
  keinen Fehler)

## 3. Ist-Stand und Produktionsliste

| Begleiter | A Idle | B Tipp | Fehlt konkret |
|---|---|---|---|
| **Frog** | ✓ (`mascot-frog-idle.mp4`, 6 s) | ✓ (`mascot-frog-button.mp4`, 6,05 s, Anker gemessen) | — komplett |
| **Sloth** | ⚠ nur `home-faultier.mp4` — hat EIGENEN Hintergrund, taugt nicht für S1/S2 (nicht freistellbar) | ✗ | **Idle im Kreide-Stil neu** + **Tipp neu** |
| **Owl** | ✗ (leiht Frosch) | ✗ | **Idle neu** + **Tipp neu** |

**Summe: 4 neue Animationen** (2× Idle, 2× Tipp). Je gelieferter Datei
mache ich: Poster, beide Packungen, Anker-Messung, mascots.js-Zeile,
`placeholder`-Flag raus — pro Begleiter ~eine halbe Stunde Technik.

## 4. Offene Entscheidungen (Anton)

1. **S5 Home-Hero:** je Begleiter ein eigener Vollbild-Clip (3 weitere
   Filme!) oder bleibt das Faultier-Video für alle? Empfehlung: bleibt
   EINS, bis die vier Pflicht-Clips da sind.
2. **Sloth-Stil:** Kreide-Stil wie der Frosch (empfohlen — nur so
   funktioniert die Freistellung ohne Alphakanal-Zeichnung), oder sein
   heutiger eigener Look (dann braucht JEDE Sloth-Datei einen echten
   Alphakanal aus dem Zeichenprogramm)?
3. **Owl-Design** gibt es noch gar nicht.

## 5. Technik-Notizen

- ⚠ Android kann HEVC-Alpha nicht — bei Android-Start braucht S1/S2
  zusätzlich WebM/VP9-Alpha (ein weiteres Ableitungsformat, kein neues
  Zeichnen).
- Der Web-Weg (mix-blend-mode: screen) verträgt KEINE dunklen Motivteile —
  deshalb Regel „weiß/hell auf Reinschwarz" für alles, was in S1 läuft.
- Native Wahlkachel (S3) zeigt heute gezeichnete Gesichter (`MascotFace`);
  sobald echte Idles da sind, können dort die Poster stehen.
