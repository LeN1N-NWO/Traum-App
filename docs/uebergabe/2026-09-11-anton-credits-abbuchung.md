für: Anton, LeN1N-NWO

Hallo Anton, hier eine Aufgabe, die bei dir besser aufgehoben ist als bei
uns — sie liegt direkt an deiner Prompt-Kette, und die fassen wir nicht an.

WORUM ES GEHT (11.09.2026, Hanni + Claude)
  Die Credits liegen bis heute im localStorage des Geräts und lassen sich
  im Browser frei editieren. credits.js sagt das im Kopf selbst: „This is
  bookkeeping, NOT access control." Das Backend dafür steht jetzt:
  Supabase in Frankfurt, das Schema ist ausgeführt und gegen sechs
  Geld-Invarianten geprüft. Was fehlt, ist die Stelle, an der der SERVER
  vor einem bezahlten Render tatsächlich abbucht. Das ist diese Aufgabe.

  Hintergrund: docs/decisions/ADR-0005-supabase-als-datenschicht.md
  Schema:      supabase/migrations/20260911130000_initial_schema.sql
  Befund:      S7 in docs/ARCHITEKTUR.md

⚠ VORAUSSETZUNG — ERST NACH HANNIS NÄCHSTEM BRANCH
  Diese Aufgabe braucht zwei Dinge, die Hanni gerade baut: die Verbindung
  von server.js zur Datenbank und die Anmeldung (Sign in with Apple), damit
  der Server weiß, WESSEN Credits er abbucht. Solange das nicht gemergt ist,
  gibt es keine Nutzerkennung und nichts zum Abbuchen. Beginne erst, wenn
  dieser Branch in main ist — der konkrete Weg zur Datenbank und zur
  Nutzerkennung wird dort festgelegt und hier nachgetragen.

WARUM DAS BEI DIR LIEGT
  Der Preis wird heute AUSSCHLIESSLICH im Client festgelegt — der Server
  kennt überhaupt keine Kosten. Abgebucht wird an sieben Stellen:
    src/wizard/Step1Dream.jsx          (PRICES.improve)
    src/state/AppState.jsx             (sub.tiles)
    src/wizard/Step5Style.jsx          (price, block.length — mehrfach)
    src/screens/Journal/JournalDetail.jsx  (cost)
  Wer „dieser Auftrag" in „so viele Credits" übersetzen will, muss Modell,
  Dauer, Qualität, Tempo und Kachelzahl verstehen. Das ist deine Kette.

SO WÄRE ES RICHTIG
  1. ⚠⚠ DER SERVER RECHNET DEN PREIS SELBST. Nie einen Preis vom Client
     annehmen — sonst schickt jemand „cost: 0" und rendert umsonst, und wir
     hätten nur das Loch verschoben. server.js importiert schon aus zehn
     Modulen in src/lib; src/lib/plans.js ist reine Logik ohne React und
     lässt sich genauso holen. Eine Quelle für Preise, nicht zwei.

  2. VOR dem bezahlten fal-Aufruf abbuchen:
        credits_spend(userId, cost, jobRef)
     Reicht das Guthaben nicht, wirft die Funktion — dann wird NICHT
     gerendert, Antwort 402. Welche Endpunkte Geld kosten, sagt dir schon
     src/lib/gatekeeper.js → classOf(): Klasse „generate" (/api/generate,
     /api/character und alles Künftige).

  3. jobRef ist die Kennung, die Abbuchung und eine spätere Erstattung
     verbindet (z. B. die fal-Auftragsnummer oder eine eigene Job-ID). Der
     Index credits_ledger_no_double_booking macht damit eine wiederholte
     Abbuchung desselben Auftrags unmöglich — ein Wiederholungsversuch
     bucht nicht doppelt.

  4. ⚠⚠ ERSTATTEN NICHT ÜBER credits_grant — das ist eine Falle im Schema,
     die wir selbst gebaut haben. credits_grant bucht IMMER in den Topf
     „purchased". Kam die Abbuchung aber aus der „allowance" (die verfällt),
     würde die Erstattung aus verfallenden Credits dauerhafte machen. Der
     Grund „refund" steht in der Liste von credits_grant und lädt genau
     dazu ein. Richtig ist eine eigene Funktion
        credits_refund(userId, jobRef)
     die die Ledger-Zeilen der ursprünglichen Abbuchung (gleiche ref)
     heraussucht und JEDEN TOPF EINZELN zurückbucht — so viel, wie dort
     abgebucht wurde. Durch denselben Index ist sie von selbst idempotent.
     Das braucht eine neue Migration unter supabase/migrations/.

  5. Wann erstatten: wenn der Render NACH der Abbuchung scheitert. Achtung
     bei den Filmen — fal-Fehler werden in jobStatus heute als „läuft noch"
     gelesen (if (!s.ok) return { status: "pending" }). Ein Film, der so
     hängen bleibt, würde nie als gescheitert erkannt und nie erstattet.
     Das gehört mit hierher.

  6. Erst wenn der Server durchsetzt, die sieben spend()-Stellen im Client
     zurückbauen — zur reinen Anzeige des Guthabens, das vom Server kommt.
     Vorher nicht, sonst gibt es eine Zeit, in der gar niemand abbucht.

WAS DU WISSEN MUSST
  · Die Zwei-Töpfe-Regel aus credits.js ist in credits_spend() erhalten:
    immer zuerst die allowance, weil sie ohnehin verfällt. Das musst du
    nicht nachbauen, nur benutzen.
  · Überziehen ist in der Datenbank unmöglich (CHECK >= 0 auf dem Saldo),
    nicht nur verboten. Der Server muss trotzdem sauber mit dem Fehler
    umgehen — als 402, nicht als 500.
  · Die verwaisten Filme (Plan vom 03.09.) sind hier nicht mitgelöst. Wird
    ein Film abgebucht und seine Nummer erreicht danach niemanden, ist das
    Geld weg und der Film auch — ein Grund mehr für die sofortige
    Auftragsnummer aus deinem Plan.

WENN DU FERTIG BIST
  Diese Datei löschen (docs/uebergabe/…) — dann hört der Hinweis auf.
  Und Befund S7 in docs/ARCHITEKTUR.md als erledigt markieren.
