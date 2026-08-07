# ADR-0004: React + Vite statt Vanilla, mit Blick auf Capacitor

**Status:** angenommen · **Datum:** 2026-08-07 · **Format:** MADR
**Verhältnis zu ADR-0002:** ersetzt dessen Vanilla-/Kein-Build-Teil. Bun als
Laufzeit und `server.js` als schlüsselhaltender Proxy bleiben unverändert
gültig — das ist der Kern von ADR-0002 und wird hier ausdrücklich bestätigt.
**Verhältnis zu ADR-0003:** löst es ab. Die dort beschriebene Aufteilung in
mehrere Seiten mit geteiltem `app.css`/`app.js` wird durch Komponenten und
Router ersetzt.

## Kontext

Zwei Anforderungen treffen zusammen, die ADR-0002 und ADR-0003 beide nicht
kannten:

1. Die App soll sich **wie eine App** anfühlen: Tabs, Screens, Splash, ein
   sechsstufiger geführter Ablauf zum Erfassen eines Traums (siehe
   `docs/specs/2026-08-07-app-umbau-design.md`).
2. Sie soll nach **iOS und Android** portiert werden, absehbar über Capacitor.

Der Wizard ist der eigentliche Auslöser. Er trägt Zustand über sechs Schritte
(Traumtext, erkannte Personen, deren Avatar-Zuordnung, Orte, Style, Format)
und muss ihn bei „Zurück" unverändert vorfinden. Das ist genau die Art von
Zustand, die sich von Hand am DOM schlecht führen lässt.

Zum Entscheidungszeitpunkt: `index.html` 609 Zeilen, `app.js` 260,
`app.css` 418, dazu `symbole.html` (283) und `fotos.html` (238).

ADR-0003 hatte für den Wachstumsfall ausdrücklich empfohlen, der erste
Kandidat sei „*nicht* ein Framework, sondern ES-Module". Diese Empfehlung wird
hier bewusst verworfen — nicht weil sie falsch war, sondern weil der zweite
Auslöser damals nicht vorlag: ES-Module lösen die Dateigröße, aber weder
Zustandsführung über Schritte hinweg noch die Portierung.

## Betrachtete Optionen

1. **React + Vite**, Ausgabe als statisches Bundle
2. **Next.js** mit `output: "export"`
3. **Vanilla behalten**, Screens per Hash-Routing (die ADR-0003-Empfehlung)

## Entscheidung

Option 1, vom Produktbesitzer gewählt.

**Gegen Next.js** spricht sein eigener Kern: Serverseitiges Rendern,
API-Routen und SEO sind das, wofür man Next.js nimmt — und alle drei sind hier
wertlos. Ein Capacitor-Bundle ist statisch; die API-Routen dürften die
Schlüssel ohnehin nicht halten, weil das Bundle extrahierbar ist. `server.js`
bliebe also trotzdem bestehen, und Next.js wäre ein zweites Server-Framework
ohne Aufgabe. Man würde `output: "export"` setzen und damit exakt die
Funktionen abschalten, für die man es geholt hat.

**Gegen Vanilla** spricht der Wizard. Sechs Schritte mit Rücksprung, Kacheln
mit drei Zuständen (zugeordnet, neu anzulegen, KI-frei) und einer
Preisberechnung, die von allem abhängt — das ist von Hand geführter DOM-
Zustand in seiner fehleranfälligsten Form. Dazu kommt das Redesign nach
Mobbin, das ohne Komponentengrenzen jede Änderung zu einer Suche über vier
HTML-Dateien macht.

## Konsequenzen

- **Es gibt jetzt einen Build-Schritt.** Das war die zentrale Zusage von
  ADR-0002 und fällt bewusst. `bun server.js` allein genügt nicht mehr;
  `vite build` muss vorher laufen, im Betrieb liefert `server.js` das `dist/`.
- **Die Freigabeliste im Server bleibt die Schutzstelle.** `PUBLIC_FILES`/
  `PUBLIC_DIRS` zeigen künftig auf `dist/` statt auf einzelne HTML-Dateien.
  Deny-by-default bleibt; `scripts/test-static.mjs` muss weiterhin beweisen,
  dass `.env` nicht ausgeliefert wird. Diese Prüfung ist nicht verhandelbar —
  sie ist das, was die API-Schlüssel schützt.
- **`server.js` bleibt unangetastet in seiner Rolle.** Schlüssel dort,
  nirgends sonst. Der Client kennt nur `API_BASE`.
- **`API_BASE` muss konfigurierbar sein**, nicht hart `localhost` — sonst ist
  das spätere Capacitor-Bundle unbrauchbar.
- Neue Abhängigkeiten: React, React-DOM, Vite. Damit endet auch die
  Null-Dependency-Eigenschaft des Projekts.
- Testbarkeit wird besser: `promptBuilder.js` und `storage.js` sind reine
  Logik ohne DOM und erstmals ohne Browser prüfbar. `docs/STAND.md` führt
  fehlende UI-Tests seit Längerem als Baustelle.

## Verworfene Alternativen — warum

**Next.js:** siehe oben — man müsste seine Kernfunktionen abschalten, um es
überhaupt einsetzen zu können. Zusätzliches Gewicht ohne Gegenwert.

**ES-Module ohne Framework (die ADR-0003-Empfehlung):** hätte den Build-Schritt
vermieden und die Dateigröße gelöst. Verworfen, weil sie das eigentliche
Problem nicht anfasst: Zustand über sechs Wizard-Schritte, wiederverwendbare
Komponenten für das Mobbin-Redesign und ein Bundle für Capacitor. Man hätte
sich Schritt für Schritt ein eigenes, schlechteres Framework gebaut.

**Ein natives Neuschreiben (SwiftUI/Compose):** nie ernsthaft erwogen. Zwei
getrennte Oberflächen für ein Produkt, das noch kein Bezahlmodell hat, wäre
sowohl teuer als auch verfrüht.

## Wann neu prüfen

Wenn Capacitor sich als untauglich erweist (etwa weil die Bildaufnahme oder
die Speicherung großer Mediendateien im WebView nicht tragfähig ist), steht
die Frage nach nativen Hüllen neu — dann aber als eigenes ADR mit echten
Messungen, nicht aus dem Bauch.
