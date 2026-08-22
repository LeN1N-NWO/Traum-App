# Streak-Board — Gamification, die zum Träumen passt

**Stand:** 2026-08-21 · Anlass: Antons Ansage beim Testen
**Status: VORSCHLAG — wartet auf Antons Zuschnitt, dann bauen.**

## 1. Antons Auftrag, in seinen Worten

Klick auf die Streak-Pille („✦ 1 Tag") soll „eine Art Board" öffnen: was
mich erwartet, wenn ich dranbleibe. „Es geht NICHT darum, dass ich mich
gleich mit 100 Träumen einfüge und dadurch Credits verdiene — das ist
Quatsch. An Duolingo angelehnt überlegen, was für ein Streak sinnvoll
macht. Es muss wirklich Spaß machen, jeden Tag dranzubleiben."

## 2. Was schon existiert (und trägt)

- `streak.js` zählt **Nächte, nicht Träume**: bumpStreak erhöht höchstens
  einmal pro Kalendertag. 100 Träume an einem Tag = 1 Serientag. Der
  wichtigste Abuse-Schutz ist also längst gebaut.
- Die Serie speist bereits die **Wesen-Rarität** (creatures.js: höhere
  Serie → seltenere Wesen) und die Menagerie sammelt sie.
- `streakAtRisk` + Home-Zeile („heute hält die Serie…") existieren.

Das Board macht sichtbar, was die App schon tut — dasselbe Muster wie
Storyboard und Atlas: *die App speichert mehr, als sie zeigt.*

## 3. Die Traum-Besonderheit, die Duolingo nicht hat

Man träumt nicht auf Kommando — und erinnert sich nicht jede Nacht.
Eine Serie, die an „jede Nacht ein erzählter Traum" hängt, bestraft
Biologie. Deshalb der wichtigste Baustein:

**„Nichts hängengeblieben" zählt.** Ein Ein-Tipp-Eintrag („Heute keine
Erinnerung") hält die Serie am Leben — wie Duolingos Eine-Lektion-Minimum.
Ehrlich (die App lügt nicht über Traumerinnerung), bindend (das Ritual
ist der Besuch, nicht die Leistung), und er verbessert nebenbei die
Erinnerung — Traumtagebuch-Führen IST das beste Recall-Training, das
steht schon im Luzid-Guide. Diese Einträge bekommen KEIN Wesen und
zählen nicht als „echter Traum" (kein Atlas, keine Reflection) — nur
die Serie atmet weiter.

## 4. Das Board (Klick auf die Pille, überall wo sie steht)

Ein Sheet, drei Zonen:

1. **Jetzt:** große Serie-Zahl, Wochenring (7 Punkte, gefüllt = Nacht
   erledigt), die „hält bis du schläfst"-Zeile.
2. **Der Weg:** Meilenstein-Leiter mit dem NÄCHSTEN zuerst —
   3 · 7 · 14 · 30 · 60 · 100 Nächte. Jeder Meilenstein zeigt konkret,
   was wartet (s. §5). Erreichte sind abgehakt, ferne angedeutet.
3. **Schutz:** die Schlummernacht (s. §6) — wie viele man hat, wie man
   sie verdient.

## 5. Belohnungen — Wesen zuerst, Credits homöopathisch

Grundsatz aus der Ökonomie (credits.js-Kopf): jeder verschenkte Credit
ist $0,08 echtes Geld, beliebig wiederholbar über localStorage. Deshalb:

- **Primärwährung ist die Menagerie:** Meilensteine schalten
  Raritätsstufen frei (ab 7 Nächten können Epics fallen, ab 30
  Legendaries — die Mechanik existiert, sie bekommt nur sichtbare
  Schwellen), plus je Meilenstein ein GARANTIERTES Sonderwesen
  (das „7-Nächte-Wesen" hat man sich erlaufen, das kann man nicht
  kaufen). Kostet uns $0, ist aber der Duolingo-Kern: Sammlung + Stolz.
- **Credits nur an zwei Stellen, einmalig, klein:** 7 Nächte → 1 Credit,
  30 Nächte → 3 Credits. Deckel: 4 Credits je Installation über die
  gesamte Leiter ($0,32 — weniger als das Willkommensgeschenk). Für
  einen Abuser sind 7 echte Kalendertage Warterei für $0,08 der
  schlechteste Stundenlohn der Welt; für einen ehrlichen Nutzer ist es
  ein „die App schenkt mir was"-Moment genau dann, wenn Bindung entsteht.
- **Keine Rangliste, kein Teilen-Zwang:** Träume sind privat. Der
  Vergleich ist mit sich selbst, nicht mit Fremden.

## 6. Schlummernacht (Streak-Freeze, aber im App-Ton)

Eine verpasste Nacht löscht nicht alles — das ist Duolingos wichtigste
Lehre (Verlustangst bindet nur, bis sie einmal zuschlägt; danach
deinstalliert sie). Regel: je 7 erledigte Nächte verdient man EINE
Schlummernacht (max. 2 auf Vorrat). Verpasste Nacht + Schlummernacht
vorhanden → Serie lebt, Schlummernacht verbraucht. Automatisch, mit
ehrlicher Meldung am Morgen („Dein Faultier hat für dich übernommen").
Namensgebung passt zum Maskottchen; Antons Faultier-Asset kann hier
später auftauchen (faultier-assets.md).

## 7. Bau-Zuschnitt (wenn Anton Go gibt)

> **Stand 22.08.2026 — was davon steht:**
> - Meilenstein-Leiter + Board-Sheet + antippbare Pille: **gebaut** (Stufe 1).
> - Mini-Credit-Geschenke 7→1, 30→3, Deckel 4: **gebaut** (Antons „Mini-
>   Geschenke, okay"). `giftFor()` in streakBoard.js, vergeben in AppState,
>   Schwellen in `state.streakGifts`.
> - **Offen:** Schlummernacht (§6) und „Nichts hängengeblieben" (§3) —
>   dazu fehlt Antons Wort. Das garantierte Sonderwesen je Meilenstein
>   (§5) ist ebenfalls noch nicht gebaut; die Leiter nennt bisher nur die
>   Raritätsschwellen, die creatures.js wirklich kennt.

- `src/lib/streakBoard.js`: Meilenstein-Tabelle, verdiente/verbrauchte
  Schlummernächte, Belohnungs-Vergabe (idempotent, Flags am State wie
  creditsGranted) + Tests. Schlummer-Logik in refreshStreak einbauen.
- Board-Sheet `src/components/StreakBoard.jsx` (Sheet-Muster), Pille in
  Home/Kopf wird antippbar.
- „Nichts hängengeblieben": kleiner Knopf unter dem Home-CTA, legt einen
  markierten Mini-Eintrag an (`kind: "blank"`), bumpStreak, KEIN Wesen;
  Journal/Atlas/Reflection filtern ihn aus.
- i18n en+de (Übersetzungs-Stopp).
- NICHT in dieser Session mit der Cloud kollidieren: checkin.js (Cloud,
  P2) berührt denselben Morgen-Moment — vor dem Bau PR #18 mergen oder
  absprechen, sonst entstehen zwei Morgen-Rituale nebeneinander.

## 8. Bewusst NICHT

- Keine Credits pro Traum, pro Woche oder wiederholbar — nicht mal klein.
- Kein „Serie kaufen/reparieren" für Geld (Duolingo tut es; bei uns
  würde es das Ehrlichkeits-Versprechen der App beschädigen).
- Keine Push-Eskalation („Dein Faultier weint") — eine stille Erinnerung
  reicht, der Ton der App ist nachts leise.
