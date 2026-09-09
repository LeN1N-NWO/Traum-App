# Gemini Omni 1.1 Flash — geprüft und gedroppt

**Stand:** 2026-09-05 · Antons Entscheidung: „Das Modell ist schlecht dafür
geeignet, sieht auch nicht so gut aus. Ich würde es droppen."
**Status: ENTSCHIEDEN — kein drittes Modell. Nicht wieder aufmachen, ohne
diesen Befund gelesen zu haben.**

## Warum es interessant schien

Google (27.08.2026): 360p-Drafts für $0,03/s, Verlängern in 10-s-Schritten
bis 40 s mit 10 s Kontext, bis zehn Referenzbilder, Ton immer dabei. Auf
fal als `google/gemini-omni-flash/v1.1/reference-to-video`, Verlängern und
Hochskalieren nur bei Google direkt.

## Was die Probe gezeigt hat (≈ $1,50, Skripte `scripts/omni-*.mjs`)

1. **360p ist für den Kunden nicht billiger.** $0,03/s ergibt aufgerundet
   dieselben 2 Credits/s wie H3 in 480P ($0,05/s) — 1 Credit/s läge unter
   dem Einkauf. Der Unterschied wäre unsere Marge, nicht sein Preis.
2. **Der Draft lässt sich nicht hochrechnen.** Auflösung ist ein Parameter
   je Anfrage; 1080p/4K sind laut Google selbst hochskaliert. Kein Seed.
3. **Die Kette über `previous_interaction_id` nimmt immer den ERSTEN Clip
   als Kontext.** Teil 2 und Teil 3 begannen beide mit Teil 1
   (Bildabweichung 13,7/255 zu Teil 1, 63/255 zueinander). Kein 30-Sekünder.
4. **Verlängern hochgeladener Videos wird komplett geblockt** („Input
   blocked … sensitive words") — auch ohne Bogen, ohne Referenz-Tag, mit
   synthetischem Testbild ohne Person und harmlosem Einzeiler. Der Weg,
   nicht der Inhalt.
5. **Übrig bleibt unser eigener Weg:** neue Generation ab dem letzten Bild
   des vorigen Teils (Naht 17/255). Das kann die App mit H3 heute schon.
6. **Der Bogen blutet:** Am Schluss saß das Gesicht vor der grauen
   Studiowand des Charakterbogens — dieselbe Falle wie bei der Bildkette.
7. **Das Dauerfeld heißt `response_format.duration`** („10s"), kein
   Doku-Beispiel setzt es; beim Extend-Task darf kein `aspect_ratio`
   stehen. Beides per kostenloser Sondierung gefunden (400 in 1 s).

Was gut war: Teil 1 (Büro → Aufzug → Kabine) mit Fremden, die fremd
bleiben, und Antons Gesicht, das hält. Das allein trägt kein drittes Modell.

## Folgen

- `video.js` bleibt bei zwei Modellen. Kein Preset, kein Schalter.
- Die drei Skripte bleiben als Messprotokoll (alle hinter `--ja`).
- Der 40-s-Extend als Ersatz für den Zweiteiler ist damit vom Tisch; die
  Zweiteiler-Frage gehört weiter zum Preisentscheid.
