für: Anton, LeN1N-NWO

# Übergabe an Anton — S7 Phase 1: Der Server bucht den Film ab (05.10.2026, Hanni)

Punkte 2–4 aus deiner Übergabe vom 11.09.
(`2026-09-11-anton-credits-abbuchung.md`) sind gebaut — für den **Film**.
Wir haben es gemacht, weil du diese Woche keine Zeit hast; deine Logik ist
unverändert (19 deiner Funktionen in `server.js` per Skript mit `main`
verglichen, alle gleich — `directFilm`, `startVideo`, `settleCharge`,
`jobStatus` …).

## Was sich in deinem Bestellweg geändert hat

In `server.js`, Route `/api/generate`, nur Zusätze und **eine** ersetzte
Zeile:

1. **Ersetzt:** `settleCharge({ kind: "film", … })` im Film-Zweig →
   `filmCharge = await chargeAccount(person, preis.charge, "film")`. Gleiche
   Stelle (nach der 409-Preisprüfung, vor der Regie). Reicht das Guthaben
   im Konto nicht → **402** `reason: "credits"`, nichts läuft an. Ist die
   Kasse nicht erreichbar → **503** `reason: "charge"`, ebenfalls nichts.
   `settleCharge()` selbst ist unverändert und loggt weiter für Bild,
   Raster und Skizze (Phase 1 = nur Film, wie bei der Preisprüfung).
2. **Neu:** `let filmCharge = null;` vor dem `try` der Route.
3. **Neu nach `startVideo`/`claimJob`:** die Ledger-Kennung wird am Auftrag
   vermerkt (`media/besitz/abbuchung/<jobId>`), dann `filmCharge = null`.
4. **Neu im `catch`:** War schon abgebucht und das Abschicken scheitert
   (Regie wirft, `startVideo` wirft) → sofort `server_refund`.
5. **`/api/job`:** Meldet `jobStatus` `failed` → Erstattung über die
   vermerkte Kennung (idempotent; der Vermerk fällt erst weg, wenn die
   Erstattung gelaufen ist).

Lokal ohne `REQUIRE_AUTH` bucht nichts — nur ein Log wie bisher.

## Datenbank

Neue Migration `supabase/migrations/20261005200000_credits_refund.sql`
(Hanni spielt sie im SQL-Editor ein): `credits_refund(user, ref)` bucht
jeden Topf genau zurück, was dort abgebucht wurde (nie `credits_grant` —
die Falle aus deiner Übergabe, Punkt 4), Wrapper `server_refund(ref)` für
die Server-Rolle. Dazu entzieht sie `anon`/`authenticated` die Rechte an
**allen** Geld-Funktionen — die Migrationen vom 11.09. hatten das nur für
`public` getan. Prüfung: `supabase/tests/credits_refund.sql` (rollt sich
selbst zurück).

## ⚠ Wichtig für deine Warteschlange (Weg B, Übergabe von heute)

Abbuchung und Erstattung hängen jetzt an der Stelle, die du umbaust:

- Die Abbuchung muss **synchron** vor der Antwort bleiben (nach dem 409,
  vor `preparing`) — sonst sieht der Kunde „nicht genug Credits" erst im
  Hintergrund, und es gibt keinen sauberen Fehler.
- Scheitert die Vorbereitung im Hintergrund, braucht der Auftrag die
  Erstattung: `refundCharge(person, ref, …)` mit der Kennung, die du statt
  im `catch` dann im Hintergrund-Fehlerweg hast. Den Vermerk
  `owners.noteCharge(jobId, ref)` gleich beim Anlegen des Auftrags
  schreiben — dann erstattet `/api/job` bei `failed` von selbst.
- Ein `preparing`, das nach einem Neustart als `failed` endet, wird über
  denselben Vermerk erstattet.

## Was noch offen ist (aus deiner Übergabe)

- **Punkt 5:** fal-Fehler liest `jobStatus` weiter als „läuft noch"
  (`if (!s.ok) return { status: "pending" }`) — ein so hängender Film wird
  nie `failed` und nie erstattet. Dein Bereich.
- **Punkt 6 (Phase 2):** Die App zählt weiter selbst mit (sieben
  `spend()`-Stellen, Anzeige vom Gerät). Kommt nach PR #88 (eigener Bereich
  je Konto), der dieselben Dateien umbaut.
- **Kauf:** Ein Kauf schreibt heute nur dem Gerät gut. Bis B1 (Beleg bei
  Apple prüfen, `server_grant(…, 'purchase')`) kommt ein Kauf nicht im Konto
  an. Testguthaben: Hanni hat dir und sich je 500 Credits im Konto
  gutgeschrieben.
- Bilder/Raster/Skizze und `/api/character` buchen noch nicht.
