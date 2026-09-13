# Warum Dream Rushes scheitern kann — und was daraus folgt

Stand 13.09.2026 · Antons Frage: „Aus welchen Gründen kann das komplette
Scheitern dieser App passieren? Sollten wir mehr Features anderer
Schlaf-Apps kostenlos hineinnehmen? Und wie driften wir weiter weg von
den Großen, wenn die das Traum-Video auch bauen?"

Das ist eine Einschätzung, keine Studie. Zahlen aus dem Repo, wo es sie
gibt (STAND, plans.js, video.js); der Rest ist Erfahrung mit Apps dieser
Art und ehrlich als Meinung markiert.

## 1. Die Gründe, aus denen es scheitern kann — nach Wahrscheinlichkeit

**1. Die Gewohnheit stirbt vor dem Wert.** Ein Traumtagebuch lebt vom
Morgen. Wer drei Morgen hintereinander nichts einträgt, kommt nicht
zurück — nicht aus Enttäuschung, sondern weil die App nicht mehr im
Tag vorkommt. Das ist der Tod jeder Journaling-App, und der Film ändert
daran nichts: Er ist der Höhepunkt, nicht die Gewohnheit. Was heute
dagegen steht: Serie, Check-in, Erinnerungen (geplant, nicht gebaut),
Rekorder um drei Uhr nachts. Was fehlt: **ein Grund, die App auch an
einem Morgen ohne Traum zu öffnen** (dazu Abschnitt 2).

**2. Der erste bezahlte Film enttäuscht.** Die Modelle liefern
schwankend: falsches Gesicht, ein Weg statt des Höhepunkts, eine
Requisite, die zwischen zwei Cuts ihre Form wechselt. Wer 46 Credits
(≈ 4,60 €) für einen Film ausgibt, der „nicht mein Traum" ist, kauft
nie wieder — und sagt es weiter. Alles, was in
`2026-09-13-regie-v2-nach-higgsfield-case4k.md` steht, ist Arbeit
gegen genau diesen Punkt. Dazu gehört auch: **eine Erstattungsregel**,
die die App selbst ausspricht („Nicht dein Traum? Der nächste Versuch
ist frei"), bevor es der App-Store-Reviewer tut.

**3. Die Rechnung geht nicht auf.** Der Gründervermerk verlangt
≈ 3 600 Abos à 9,99 € für zwei Gehälter. Ein 15-s-H3-Film in 768P kostet
im Einkauf ≈ 0,93 $, Seedance 2,5 in 720p ≈ 7 $. Ein Monatsabo mit 100
Credits trägt zwei H3-Filme, danach zahlen wir drauf, wenn jemand Kino
bestellt. Die Modelle werden billiger — aber nicht schneller, als ein
begeisterter Nutzer sie leert. Das ist kein Grund zur Panik, aber der
Grund, warum Punkt 2–6 der Abbuchungs-Übergabe (Server bucht ab, nicht
das Gerät) vor jeder Werbung kommen müssen.

**4. Die Großen bauen es nach.** Calm, Headspace, BetterSleep, Moonly
haben Millionen Nutzer, Marken und Vertrieb. „Traum eintippen → Video"
ist für sie ein Feature-Sprint, kein Produkt. Sie werden es tun, sobald
es sich irgendwo bewährt. Was sie nicht in einem Sprint bauen (Abschnitt 3):
die persönliche Besetzung, die über Monate gewachsene Traumwelt, und
einen Regisseur, der aus einem Traumprotokoll einen Schnitt macht.

**5. App-Store-Realität.** 30 % Apple-Anteil (15 % im Small Business
Program) auf jeden Credit; Review-Risiko bei KI-Bildern von Menschen
(Fotos von Freunden gehen an fal.ai — Datenschutzhinweis, Einwilligung,
Löschweg müssen sitzen); Sign in with Apple ist Pflicht, sobald es einen
Login gibt (steht in ADR-0005, ist noch nicht gebaut).

**6. Wartezeit.** Analyse plus Regie denken minutenlang, der Film
braucht weitere Minuten. Die App hat das entschärft (kein
Wartebildschirm, Abholer, Toast) — aber die erste Erfahrung eines
Neuen ist immer noch: Ich tippe, und dann passiert lange nichts.
Baustelle 1 in STAND (Denk-Token) ist unverändert offen.

**7. Ein Mensch, eine Kette.** Ein Mac, ein Server mit den Schlüsseln,
eine Person, die alles kennt. Kein Deploy, kein Monitoring, `media/`
ohne Sicherung außer dem Ordner selbst. Das killt keine App am Markt,
aber es killt sie am Tag, an dem der Laptop stirbt.

**8. Rechtliches um Gesichter.** Wer Fotos von Dritten hochlädt und sie
in Träume rendert, braucht deren Einverständnis — das ist heute ein Satz
im Dialog. Bei einem viralen Clip mit dem Gesicht eines Ex-Partners ist
das die Schlagzeile, nicht das Feature.

**9. Sprache und Markt.** Zwei Sprachen gepflegt, fünf auf Eis. Der
deutsche Markt allein ist für 3 600 Abos eng; Englisch ist Pflicht,
nicht Kür — und dort ist die Konkurrenz da.

Was ich NICHT für einen Scheiterungsgrund halte: die Technik der Hülle.
Der Umzug auf Expo ist gemacht, die letzten Web-Blätter sind heute
nativ. Das ist erledigt, nicht bedroht.

## 2. Features anderer Schlaf-Apps — welche wir gratis hineinnehmen sollten

Das Kriterium: **Gibt es der App einen Grund, an einem Morgen ohne Traum
geöffnet zu werden — und kostet es keine Inhalte, die wir nicht haben?**
Wir sind drei Leute, keine Redaktion. Alles, was Bibliothek braucht
(Sleep Stories, Meditationskurse, Musik), verlieren wir gegen Calm
schon beim Katalog.

**Ja, gratis, in dieser Reihenfolge:**

1. **Schlaf aus HealthKit lesen** (Apple Watch, iPhone-Schlaffokus).
   Kein eigenes Tracking — nur lesen. Dann steht im Mond-Streifen
   neben dem Check-in die echte Schlafdauer, und der Kalender zeigt
   Nächte, auch wenn nichts geträumt wurde. Das ist der billigste Grund,
   morgens zu öffnen: „7 h 20, gut geschlafen, kein Traum" ist ein
   Eintrag. Eine Berechtigung, eine Abfrage, kein Server.
2. **Der Atem** (4-7-8 steht als Text in der Checkliste). Eine
   animierte Atemübung, 60 Sekunden, mit Haptik. Jede Schlaf-App hat
   sie; unsere kann in den Stil-Clips atmen. Ein Bildschirm.
3. **Widget** (Lock Screen / Home): Mondphase der Nacht, Serie, „Traum
   eintragen". Das Widget ist die Erinnerung, die keine Erlaubnis
   braucht.
4. **Erinnerungen wirklich planen** (`expo-notifications`, steht seit
   Wochen auf der Liste): morgens „Was hast du geträumt?", abends
   „Runterkommen". Ohne die ist die Serie ein Zufallsprodukt.
5. **Teilen-Karte** ohne Film: Titel, Mond, Stil-Kachel, ein Satz — als
   Bild. Gratis, teilbar, mit Absender. Das ist unser Wachstumskanal,
   solange wir keine Werbung bezahlen.
6. **Klartraum-Realitätscheck** als Benachrichtigung am Tag (die
   Methode ist im Guide beschrieben; der Schalter existiert, tut nichts).

**Nein, oder nicht jetzt:**
- Sleep Stories, Meditationen, Musik-Bibliothek — Inhalte, die wir
  nicht produzieren können und die niemand von uns erwartet.
- Eigenes Schlaf-Tracking per Mikrofon/Beschleunigung — technisch
  heikel, rechtlich heikel, und HealthKit macht es besser.
- Smart Alarm — braucht Tracking.
- Astrologie/Horoskop (Moonly): Der Mond ist bei uns eine Tatsache der
  Nacht, kein Orakel. Das ist ein Ton, den wir halten sollten.

## 3. Wohin wir driften müssen, damit die Großen nicht hinterherkommen

Die Großen können „Text → Video" in einem Quartal. Was sie nicht in
einem Quartal können, ist ein **Nutzer, der seit einem Jahr eine Welt
in der App hat**. Darauf zielt alles:

1. **Die Besetzung als Kern, nicht als Feature.** Personen, Tiere, Orte
   mit Bogen — und ab jetzt (Regie v2) mit Rückansicht, Ortsbogen und
   Requisiten-Anker. Nach zehn Träumen hat jemand seine Menschen in der
   App; die nimmt er nicht mit zu Calm. Das ist der Wechselaufwand,
   den eine Journaling-App sonst nie hat.
2. **Die Traumwelt.** Atlas, Menagerie, wiederkehrende Orte, Serien von
   Träumen mit denselben Figuren. Heute Listen. Das Ziel: eine Karte
   der eigenen Nächte, in der man sieht, dass die Schule von 2026 die
   Schule von Traum 3 ist. Das ist die Seite, auf der man Zeit verbringt,
   ohne etwas zu kaufen.
3. **Der Regisseur als Handwerk.** Schnitt nach Gewicht, Bildgröße je
   Cut, Locks, Bögen — die Kette, die aus einem Diktat um drei Uhr
   nachts einen Film mit einem Höhepunkt macht. Das ist unsichtbar,
   deshalb ist es schwer zu kopieren, und deshalb muss es
   kontinuierlich besser werden (Beweis-Läufe mit fremden Träumen,
   jeder Modellwechsel gemessen).
4. **Die Stimme.** Aufnahme um drei Uhr, Transkription in der eigenen
   Sprache, die Aufnahme bleibt am Traum. Keine Schlaf-App fängt den
   Moment nach dem Aufwachen so ab; die Großen haben „Notiz tippen".
5. **Das Format.** 9:16, 5–15 s, teilbar in die Fotos-Mediathek — der
   Traum als Clip, den man jemandem zeigt. Die Stil-Clips im Onboarding
   sind das Versprechen; die echten Träume müssen es halten.
6. **Serie statt Sammlung** (Antons Opal-Idee, Pseudo-Rangliste):
   „weiter als 8 von 10" ohne echte Rangliste. Billig, wirksam, ehrlich
   markiert.

**Was ich NICHT tun würde:** breiter werden. Jedes Feature aus Abschnitt
2 ist ein Grund zu öffnen, kein Grund zu bleiben. Bleiben tut man wegen
der Welt aus Abschnitt 3. Wenn die Wahl ansteht zwischen einem weiteren
Gratis-Feature und einem besseren Regisseur, gewinnt der Regisseur.

## 4. Die drei Dinge, die vor jeder Werbung stehen müssen

1. Server bucht ab, Konto hält Credits (Hannis Backend + Übergabe
   Abbuchung) — sonst ist jede Zahl in der App eine Vermutung.
2. Regie v2 am bezahlten Film belegt (drei Filme, einer fremd).
3. Erinnerungen und HealthKit-Schlaf — der Grund, morgens zu öffnen.

Danach: TestFlight mit zehn Leuten, die nicht wir sind, und die eine
Frage: „Wie oft hast du in zwei Wochen geöffnet, ohne einen Film zu
bestellen?"
