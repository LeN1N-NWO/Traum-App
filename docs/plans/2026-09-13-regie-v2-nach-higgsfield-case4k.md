# Regie v2 — was das Higgsfield-Fallbeispiel „case4k" an unserer Kette ändert

Stand 13.09.2026 · Antons Auftrag: den Blog-Post
https://higgsfield.ai/blog/case4k gegen unsere Pipeline halten, eine
verbesserte Fassung ableiten, vor allem Schnitte und Takt.

## 1. Was der Post ist

Ein kompletter Workflow für einen viralen KI-Kurzfilm mit Seedance
(dort 2.0, 15 s je Prompt, 21:9, 4K): erst **Assets** (Charakterbogen
in drei Ansichten, Orts-Establisher, Requisitenbogen), dann ein
**Claude-Skill**, der Szenen in ein festes Prompt-Gerüst gießt, dann
**Szene für Szene rendern** und mit Notizen nachbessern.

Das Prompt-Gerüst, wörtlich in dieser Reihenfolge:
SCENE CONTEXT · ACTIVE REFERENCES · LOCATION MAP · FIRST FRAME /
BLOCKING · FORMAT MODE („Sequence of cuts, no timecodes — cuts only at
the specified points, the camera does not cut on its own") · CUT-BY-CUT
(„CUT 1 — MS, 47°") · OPTICS (Bildwinkel je Cut: 84° / 63° / 47° / 29° /
8°) · CAMERA (Handheld 1–2 cm, Kran 6 m/s, Track „half a beat late") ·
ACTION & PHYSICS · PERFORMANCE (Mikro-Mimik, Atem, Muskelspannung VOR
dem Dialog) · LIGHTING (3200 K / 5600 K) · AUDIO (nur reale Geräusche,
je Cut getaktet, „BOOM" auf das Ereignis) · STYLE · POSITIVE LOCKS
(bindend: „The drawing on @map_prop stays identical in every frame").

## 2. Was wir schon haben — und woher

Unser `director.js` ist aus demselben Regelwerk destilliert
(CINEDANCE, 17.–19.08.): Bildwinkel in Grad, LOCATION MAP, „100 %
matches the reference", erstes Bild ohne Establisher, Zeitblöcke über
die volle Dauer, Physik mit Ursache und Wirkung, Licht als Vorrang. Der
Schnitt (`cut.js`) entscheidet seit 03.09. nach Gewicht, welche Szene
wie lange läuft. Das ist keine Lücke, das ist derselbe Stamm.

Der echte Prompt des Tornado-Auftrags vom 12.09. (`media/jobs/mtyg5j37…`,
6 107 Zeichen, H3, 10 s) zeigt, wo wir stehen: LOCATION MAP in Metern,
drei Blöcke mit Schnittzeitpunkten, Positionen nach jedem Schnitt
wiederholt, Physik, Licht, Ton. Solide. Und drei Dinge fehlen ihm, die
der Post hat.

## 3. Die Lücken — gemessen am Tornado-Prompt

| | Post | Wir (bis 13.09.) | Wirkung |
|---|---|---|---|
| **Bildgröße je Cut** | jeder Cut eigene Größe + Grad (MS 47°, MCU 29°, OTS) | EIN Bildwinkel für den ganzen Film: dreimal 84° wide | Alles ist im Bild, nie ein Gesicht. Der Moment, der zählt, sieht aus wie die Anfahrt. |
| **PERFORMANCE** | eigener Block: Blick, Atem, Schlucken, Verzögerung vor der Reaktion | fehlt; Menschen „hold their positions", „stare" | Figuren stehen wie Statisten; die Angst vor dem Tornado ist nirgends im Körper. |
| **POSITIVE LOCKS** | bindender Schlussblock je Film (Requisite identisch, Laterne bleibt an) | bewusst weggelassen (CINEDANCE nannte es optional) | Bei drei Cuts reicht „restate positions"; bei fünf und mehr driftet die Requisite. |
| **Kameramaße** | Sway 1–2 cm, Kran 6 m/s, Track half a beat late | „restrained handheld drift", „slow forward dolly" | Ohne Maß rät das Modell — und rät zu viel. |
| **Haltedauer in Worten** | „longest hold of the sequence", „2 seconds" | nur Zahlen [0s-3s] | Zahlen allein lesen sich als gleich lang; „the longest hold" liest das Modell als Gewicht. |
| **Ton je Cut** | eine Geräuschspur je Cut, auf das Ereignis getaktet | Ton als ein Block am Ende | Der Knall kommt irgendwann, nicht beim Bruch. |
| **Assets** | 3-Ansichten-Bogen (vorn, hinten, nah), Gesicht auf dem Ganzkörper-Panel GELÖSCHT; Orts-Establisher; Requisitenbogen | Bogen aus Foto (Gesicht + Ganzkörper, grau), Orte als rohes Foto, keine Requisiten | Rückansicht fehlt (Figur von hinten wird jemand anderes); Orte bluten ihre Umgebung; die eine wichtige Requisite (der Fernsehturm, das Auto) hat keinen Anker. |
| **Länge** | 15 s je Prompt, lange Geschichten in TEILEN | 5–30 s in EINEM Prompt | Über 15 s zerfasert jede Kette; wir bestellen bis 30 s an einem Stück. |
| **Schleife** | Ergebnis ansehen → Notizen → neu | einmalig, „Nochmal, anders" fängt bei Null an | Kein Lernen aus dem letzten Lauf. |

Was der Post NICHT besser macht: Er arbeitet ohne Zeitmarken. Seedance
2.5 liest ganzzahlige Sekundenspannen, H3 Millisekunden-Schnittpunkte —
unsere Zeitmarken sind Modellwissen (`video.js`, `timeFormat`), die
bleiben. Der Post ersetzt sie durch Inhaltsanker („cuts only at the
specified points"); wir haben jetzt beides.

## 4. Was heute eingebaut ist (v2, `director.js`)

1. **Bildgröße je Shot** — `shotSize(hook, i, total)`: setup/transit weit
   (84°/63°), build halbnah (47°), turn/reveal/reversal halbnah-nah mit
   Push (29°), **climax nah am Gesicht, dann weit für die Wirkung**,
   resolution halbnah und still. Der erste Shot zeigt den Ort, wenn er
   nicht selbst der Höhepunkt ist. Die Größe steht in jeder Zeile des
   Schnittplans; der Systemprompt verlangt, sie zu benennen und nie zwei
   Cuts hintereinander gleich zu setzen. Innerhalb eines Shots bleibt
   die Regel „Linse halten, Kamera bewegen".
2. **Haltedauer in Worten** — der längste Block heißt „the longest hold,
   6 s", die anderen tragen ihre Sekunden als Wort.
3. **PERFORMANCE** als eigener Block zwischen ACTION TIMING und PHYSICS,
   auch in der Bewegungsregie für Ein-Bild-Modelle.
4. **POSITIVE LOCKS** am Ende: drei bis sechs Zeilen — Referenzen
   erben nichts vom Bogen-Hintergrund, Landmarken behalten Form und
   Markierung, die Lichtquelle wechselt nie die Seite, nichts erscheint,
   was die Blöcke nicht eingeführt haben.
5. **Kameramaße** — Sway in Zentimetern, Fahrten in m/s, „half a beat
   late"; eine Bewegung je Shot.
6. **Ton je Block**, auf das physische Ereignis getaktet.
7. „The camera never cuts on its own" wörtlich im FORMAT-Block.

Tests grün (`director.test.js`, `cut.test.js`), Trockenlauf
(`scripts/dry-run-prompts.mjs`) zeigt die neuen Zeilen.
⚠ **Ungeprüft am bezahlten Film.** Prompts werden länger (PERFORMANCE +
LOCKS ≈ 600–900 Zeichen); der Tornado lag schon bei 6 107 von 7 000 (H3).
Der Brief nennt das Budget je Shot, aber der erste echte Lauf muss zeigen,
ob die Notbremse zuschlägt (steht dann als Warnung im Server-Log).

## 5. Was als Nächstes kommt — in dieser Reihenfolge

**A. Der Beweis (ein Nachmittag, ~3 Filme à 46 Credits).** Denselben
Traum (Tornado) einmal mit v1-Prompt aus `media/jobs` und einmal mit v2
rendern, H3 10 s. Drei Fragen: Kommt die Nahaufnahme? Spielt das
Gesicht? Hält die Requisite (Fernsehturm) über die Cuts? Erst danach
gilt v2 als besser. (Regel aus STAND: „Ein Test am eigenen Traum findet
die eigenen Fehler nicht" — dazu einen fremden DreamBank-Traum.)

**B. Der 3-Ansichten-Bogen (Bildkosten ~5 Cent je Figur, einmalig).**
`buildSheetFromPhotoPrompt` erzeugt heute Gesicht + Ganzkörper auf
Grau. Neu: vorn / hinten / nah in EINEM Bild, und das Gesicht auf dem
Ganzkörper-Panel „erased" (der Post: sonst zieht die Figur das
Bogen-Layout in die Szene). Rückansicht ist der Gewinn: Menschen von
hinten sind heute Fremde.

**C. Orts-Bögen.** Ein Ort aus der Besetzung bekommt wie eine Figur einen
Bogen: Establisher mit Licht und Geometrie, kein Foto mit Passanten.
Das gibt dem LOCATION MAP zum ersten Mal ein Bild, auf das sich Meter
beziehen.

**D. Requisiten-Anker.** Die Analyse benennt heute Personen und Orte;
dazu EIN „key object" je Traum (der Zahn, der Brief, der Fernsehturm).
Es bekommt eine LOCK-Zeile und, wo es ein Foto gibt, einen Bogen.

**E. Lange Träume in Teilen.** Über 15 s: zwei Aufträge à ≤ 15 s, der
zweite mit dem letzten Frame des ersten als Startbild (Seedance
`video_extension` kann das direkt). Das ist der Zweiteiler aus dem
Preisentscheid — nur dass er jetzt eine Regie-, keine Preisfrage ist.

**F. Die Schleife.** „Nochmal, anders" nimmt den letzten Prompt und die
Notiz des Menschen („der Hund war zu klein") als Delta mit, statt neu
zu beginnen. Der Post lebt davon.

## 6. Was wir NICHT übernehmen

- **Dialog.** Der Post lässt Figuren sprechen. Träume in der App haben
  keine Stimme außer der eigenen (ADR-0007); Sprache im Film wäre Text
  im Bild, und die Modelle malen Text als Kauderwelsch.
- **4K, 21:9.** Unser Bild ist 9:16 auf dem Handy; die Auflösung kostet
  das Vierfache und nützt auf sechs Zoll nichts.
- **Musik in der Post-Produktion.** Wir haben keine Post.
