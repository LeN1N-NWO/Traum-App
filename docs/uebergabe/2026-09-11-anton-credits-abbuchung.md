für: Anton, LeN1N-NWO

Hallo Anton, hier eine Aufgabe, die bei dir besser aufgehoben ist als bei
uns — sie liegt direkt an deiner Prompt-Kette, und die fassen wir nicht an.

STAND 11.09.2026 ABEND (Anton + Claude) — Punkt 1 ist erledigt, der Rest wartet
  · src/lib/quote.js: EINE Preisrechnung für Client und Server (quoteFor,
    compareQuote, priceTable). Der Wizard rechnet damit, der Server rechnet
    nach — und lehnt mit HTTP 409 + beiden Zahlen ab, wenn er TEURER liegt
    als angezeigt. Nichts wird gerendert. Liegt er gleich oder billiger,
    gilt sein Preis. Antons Regel: nie zu günstig verkaufen, niemanden
    übervorteilen. Live geprüft: 409 in Millisekunden, kein Aufruf nach
    draußen (quote.test.js hält die Reihenfolge fest).
  · Scharf ist das für den FILM. Bilder werden nur beobachtet (Log), weil
    der Bildweg zurückgebaut wird und drei Aufrufformen hat.
  · GET /api/prices liefert die Preistabelle des Servers — für einen
    nativen Client, der prüfen will, ob sein Bundle noch dieselben Zahlen
    trägt.
  · settleCharge() in server.js ist die vorbereitete Abbuchungsstelle:
    heute nur Log, mit der Anmeldung → withUser + server_spend (Punkt 2).
  · Nebenbefund: Der Client bucht bei Plan B `block.length` ab (4), zeigt
    aber 6 — die Kassenprüfung rechnet richtig, die Buchung nicht. Fällt
    mit dem Server-Abbuchen weg, deshalb nicht angefasst.
  Offen bleiben Punkt 2–6, alle hinter der Anmeldung.

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

⚠ VORAUSSETZUNG — ERST NACH DER ANMELDUNG
  Diese Aufgabe braucht zwei Dinge. Das erste steht seit 11.09.2026:
  server.js ist mit der Datenbank verbunden (src/lib/db.js). Das zweite
  fehlt noch: die Anmeldung (Sign in with Apple), damit der Server weiß,
  WESSEN Credits er abbucht. Ohne sie gibt es keine Nutzerkennung und
  nichts zum Abbuchen — beginne erst, wenn sie in main ist.

  DER WEG ZUR DATENBANK (steht fest):
  server.js meldet sich als eigene Rolle dreamrushes_server an — nach
  Least Privilege, Hannis Grundsatz. Die Rolle darf das Guthaben nur
  LESEN und sieht dank RLS nur die Zeilen des einen Nutzers, für den der
  Server gerade handelt. Deshalb läuft JEDER Datenbankzugriff im Namen
  eines Nutzers durch withUser():

      import { withUser } from "./src/lib/db.js";
      await withUser(database, userId, async (tx) => { ... });

  withUser erklärt in einer Transaktion, für wen der Server handelt; außerhalb
  davon sieht er keine Zeilen und bewegt kein Geld. userId MUSS aus der
  verifizierten Anmeldung kommen, nie aus dem Anfragekörper.

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

  2. VOR dem bezahlten fal-Aufruf abbuchen — über server_spend, NICHT über
     credits_spend:
        await withUser(database, userId, (tx) =>
          tx`select public.server_spend(${cost}, ${jobRef}, null)`);
     ⚠ credits_spend(userId, …) ist für die Server-Rolle GESPERRT
     (nachgewiesen: 42501). Es nimmt jede beliebige Nutzer-ID an — ein Fehler,
     der die falsche übergibt, würde fremdes Guthaben abbuchen. server_spend
     nimmt gar keine ID, sondern bucht für den per withUser erklärten Nutzer.
     Reicht das Guthaben nicht, wirft es — dann wird NICHT gerendert,
     Antwort 402. Welche Endpunkte Geld kosten, sagt dir schon
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
     Das braucht eine neue Migration unter supabase/migrations/ — und dazu
     einen Wrapper server_refund(jobRef) ohne Nutzer-ID, der der Rolle
     dreamrushes_server freigegeben wird, genau wie server_spend (Muster in
     20260911150000_server_role.sql). server_grant verweigert 'refund'
     ausdrücklich, damit niemand den falschen Weg nimmt.
     ⚠ Migrationen laufen nur noch über den SQL-Editor: server.js hat keine
     Admin-Rechte, und das soll so bleiben. Beim Kopieren in den Editor
     verfälscht die Zwischenablage auf Hannis Rechner Nicht-ASCII-Zeichen
     (LC_CTYPE=C) — Zeichenketten in SQL deshalb nur ASCII.

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
