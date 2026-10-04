# Frosch-Loops für den Ring (Startseite)

Stand 03.10.2026 — Antons Wahl: Der Frosch in der Mitte des Rings besteht
aus **Video-Zuständen** (Variante A). Ein Grund-Loop läuft immer, Ereignisse
spielen einen einmaligen Clip darüber, der danach ausblendet.
Code: `mobile/src/components/frog-stage.tsx` → `FROG_CLIPS`. Fehlt ein Clip,
läuft der Schlaf-Loop, und Ereignisse werden zu einem kleinen Hüpfer.

## Was gebraucht wird

| Datei (Lieferung) | Zustand | Art | Länge | Wann |
|---|---|---|---|---|
| `frog-sleep.mp4` | schläft (gibt es schon: `frog-idle`) | Loop | 6–15 s | Serie 0, heute noch kein Traum |
| `frog-idle.mp4` | wach: atmet, blinzelt, schaut sich um | Loop | 6–10 s | Serie ≥ 1 oder heute schon geträumt |
| `frog-tap.mp4` | angetippt: schaut hoch, quakt, kleine Geste | einmalig | 1,5–2,5 s | Tipp auf den Frosch oder ein Geschenk im Ring |
| `frog-dream.mp4` | neuer Traum: freut sich, kleiner Hüpfer | einmalig | 2–3 s | ein Traum ist dazugekommen |
| `frog-milestone.mp4` | Meilenstein: großer Sprung, Glühwürmchen | einmalig | 2,5–3,5 s | Serie erreicht 3 / 7 / 14 / 30 / 60 / 100 |
| `frog-cheer.mp4` | Ring voll: feiert ausgelassen | einmalig | 3–4 s | letzte Nacht des Rings ist eingetragen |

Später möglich (noch nicht verdrahtet): einschlafen/aufwachen als Übergang,
hüpft nach links/rechts (zur Nacht im Ring), Looks für Meilensteine
(Schlafmütze, Laterne, Krone).

## Regeln, damit es nahtlos wirkt

1. **Gleiche Grundpose.** Jeder Clip beginnt und endet in derselben Pose wie
   der wache Loop (`frog-idle`): gleiche Stelle, gleiche Größe, gleiche
   Blickrichtung. Sonst springt das Bild beim Überblenden.
2. **Loops schließen sich.** Erstes und letztes Bild des Loops sind gleich.
3. **Quadratisch, Frosch mittig**, mit Luft rundherum (Sprünge brauchen
   oben Platz). 720 × 720, 24 fps.
4. **Kreide-Stil wie bisher: helle Zeichnung auf reinem Schwarz** (#000).
   Die Transparenz entsteht aus der Helligkeit — alles Schwarze wird
   durchsichtig. Kein Grau im Hintergrund, keine Vignette, kein Rauschen.
5. Ohne Ton.

## Umwandlung (macht Claude)

Aus der Lieferung wird eine HEVC-Datei mit Alphakanal (wie
`mobile/assets/mascots/frog-idle.mov`):

    ffmpeg -i frog-idle.mp4 \
      -filter_complex "[0:v]split[c][g];[g]format=gray,lut=y='if(lt(val,6),0,val)'[a];[c][a]alphamerge,format=bgra" \
      -c:v hevc_videotoolbox -alpha_quality 0.6 -q:v 35 -allow_sw 1 \
      -tag:v hvc1 mobile/assets/mascots/frog-idle.mov

⚠ Breite und Höhe müssen Vielfache von 16 sein (720 passt). Sonst füllt
HEVC intern auf, und iOS zeigt rechts und unten einen feinen Strich —
so geschehen beim 500×500-Schlaf-Loop (03.10., auf 512 gepolstert).

Danach eine Zeile in `FROG_CLIPS` eintragen. ⚠ Android kann HEVC-Alpha
nicht (dort bräuchte es WebM/VP9) — für jetzt nur iOS.

## Lade-Stories für den Warte-Frosch (Antons Notiz 04.10.)

Während ein Auftrag läuft (Glimpse, Film), zeigt der Lader unten
(`mobile/src/components/mascot-loader.tsx`) heute EINEN Loop. Gewünscht:
mehrere kurze Clips, zufällig gewählt, die erzählen, dass der Frosch
gerade **deinen Traum baut** — die Wartezeit wirkt kürzer und süßer.

| Datei (Lieferung) | Was der Frosch tut | Länge |
|---|---|---|
| `wait-paint.mp4` | malt mit Pinsel auf eine Leinwand / Filmrolle | 4–8 s, Loop |
| `wait-wheel.mp4` | schraubt an einem Rad, Zahnrädern, einer kleinen Maschine | 4–8 s, Loop |
| `wait-reel.mp4` | spult eine Filmrolle auf, hält ein Bild ins Licht | 4–8 s, Loop |
| `wait-stir.mp4` | rührt in einem Kessel, aus dem Traumbilder aufsteigen | 4–8 s, Loop |
| `wait-sew.mp4` | näht Wolken/Sterne zusammen | 4–8 s, Loop |

Regeln wie oben: helle Kreide auf reinem Schwarz, ohne Ton, Kanten durch
16 teilbar (Lader heute 500 px → **512 × 512** liefern), Loop schließt
sich. Einbau: Liste in `mascot-loader.tsx`, Zufall beim Start jedes
Wartens, nach jedem Durchlauf weiter zum nächsten.
