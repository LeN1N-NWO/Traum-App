# ADR-0005: Supabase als Datenschicht — `server.js` bleibt der schlüsselhaltende Prozess

**Status:** vorgeschlagen · **Datum:** 2026-09-11 · **Format:** MADR
**Entschieden von:** Hanni. ⚠ Das Supabase-Projekt und später RevenueCat laufen
auf Konto und Rechnung des Produktbesitzers — Antons Bestätigung steht noch
aus. Danach ist der Status auf „angenommen" zu setzen.
**Verhältnis zu ADR-0002/0004:** bestätigt beide in ihrem Kern. `server.js`
bleibt der einzige Ort, an dem Schlüssel liegen; daran ändert dieses ADR
ausdrücklich nichts. Es füllt die Lücke, die `docs/specs/2026-08-07-app-umbau-design.md`
seit dem 07.08.2026 offen führt: „Echtes Credit-Ledger, Accounts, Bezahlung
(braucht Supabase → eigenes ADR)."

## Kontext

Drei Dinge, die jedes für sich schon zwingen, treffen zusammen.

**1. Das Guthaben liegt beim Kunden.** `src/lib/credits.js` sagt es im
Dateikopf selbst: „This is bookkeeping, NOT access control. The balance lives
in localStorage, which the person can edit freely — anyone determined to get
free generations already can." Jeder freie Credit ist echtes Geld: $0,08 bei
der Skala, auf der die Preise gebaut wurden. Solange das so bleibt, ist jede
Monetarisierung eine Bitte, keine Bedingung.

**2. Träume sterben mit dem Gerät.** Der Zustand steht unter einem einzigen
`localStorage`-Schlüssel (`dreamrushes_v1`). Die Dateisicherung nach
`data/traeume/` läuft zwar auch nativ, aber der Weg *zurück* ist
entwicklungsseitig abgeschaltet (`AppState.jsx`, `import.meta.env.DEV`) und
fällt beim Bauen heraus. Ein geleerter Speicher, ein neues Telefon — und das
Tagebuch ist weg. Der Text ist dabei das Unersetzliche: Bilder kann man neu
rendern, für Geld; einen Traum von vorletzter Woche nicht.

**3. Der Store steht bevor.** In-App-Käufe verlangen serverseitige Prüfung der
Quittung — dem Client darf man das nie glauben. Dafür braucht es eine Stelle,
die weiß, wer jemand ist, und die ihm etwas gutschreiben kann.

Dazu die rechtliche Lage aus `docs/plans/2026-08-20-recht-einwilligung.md`:
Referenzfotos sind biometrische Daten, teils von **anderen** Menschen. Daraus
folgen Löschrechte und Auskunftsrechte, die ohne Konten technisch nicht
erfüllbar sind, und die Frage, wo die Daten liegen.

### Was die Wahl einschränkt, bevor sie getroffen wird

`server.js` kann nicht in eine Funktion-als-Dienst-Umgebung ziehen. Das ist
keine Vorliebe, sondern gemessen (11.09.2026, siehe `docs/ARCHITEKTUR.md`):

- **Die Uhren passen nicht.** `api.js` gibt Analyse und Film je 300 000 ms.
  Eine Supabase Edge Function lebt 150 s (kostenlos) bzw. 400 s (Pro). Der
  Analysepfad reißt selbst den Pro-Tarif — und das liegt an der Sache, nicht
  am Code: 96 % der erzeugten Token sind Denk-Token.
- **Das Sprachinterview braucht eine offene Verbindung.** `server.js` hält
  eine WSS-Verbindung zu Gemini und reicht PCM16-Audio in beide Richtungen
  durch, solange das Gespräch dauert. Derselbe Deckel beendet es mittendrin.
- **Die Geldbremse zählt im Arbeitsspeicher eines Prozesses** (`gatekeeper.js`),
  den es dort nicht gibt.

Dazu 26 Aufrufstellen mit Bun-eigenen APIs und ein Unterprozess (ffmpeg), den
Edge Functions gar nicht starten dürfen. **Die Frage ist also nicht „welches
Backend", sondern „wer trägt Konten, Guthaben und Dateien neben einem Prozess,
der ohnehin bestehen bleibt".**

## Betrachtete Optionen

1. **Supabase** (Postgres + Auth + Storage), `server.js` bleibt auf eigenem Host
2. **Convex** (reaktive Dokumentdatenbank, TypeScript-Funktionen als Backend)
3. **Firebase** (Firestore + Auth + Storage)
4. **Selbst bauen** — Postgres in Eigenregie, eigene Benutzerverwaltung

## Entscheidung

Option 1, Supabase als reine Datenschicht.

**Für Postgres** spricht die Art der Daten. Ein Credit-Ledger ist Buchhaltung:
Es muss in einer Transaktion abgebucht werden, damit ein Abbruch mitten im
Rendern kein Guthaben verschluckt, es braucht Fremdschlüssel und Bedingungen,
und es muss im Nachhinein prüfbar sein, wohin ein Credit ging. Das ist genau
das, wofür eine relationale Datenbank gebaut ist.

**Für Supabase** im Besonderen spricht Row Level Security: Die Trennung nach
Nutzer wird in der Datenbank erzwungen, nicht in der Anwendung. Bei
biometrischen Fotos ist das kein Komfort, sondern die Verteidigungslinie, die
auch dann hält, wenn in `server.js` jemand eine `WHERE`-Bedingung vergisst.
Dazu: Region Frankfurt, Sign in with Apple ohne Eigenbau (der App Store
verlangt es, sobald andere Anmeldewege angeboten werden), und die Möglichkeit,
das Ganze im Ernstfall selbst zu betreiben — was zum Geist von ADR-0001 passt,
das externe Abhängigkeiten für den Projektstand ausdrücklich ablehnt.

**Gegen Convex** spricht, dass seine Stärke hier keine ist. Convex ist für
reaktives Sync über viele Klienten gebaut — Dream Rushes ist ein
Einzelnutzer-Tagebuch; niemand teilt einen Traum in Echtzeit mit jemandem. Man
bezahlte also mit Einschränkungen für eine Eigenschaft, die nicht gebraucht
wird: Dokumente sind auf 1 MiB begrenzt, es gibt kein SQL für die
Auswertung eines Ledgers, und es ist nicht selbst zu betreiben. Schwerer wiegt
das Betriebsmodell: Convex will, dass die Backend-Logik *in* Convex-Funktionen
lebt. `server.js` müsste also umgeschrieben werden — oder man betriebe zwei
Backends nebeneinander. Beides ist teurer als der Gewinn.

**Gegen Firebase** spricht Firestore bei Geld (Buchungen über Sammlungen
hinweg sind mühsam und teuer korrekt zu bekommen), die seit Jahren strittige
Frage der EU-Datenhaltung — bei biometrischen Daten kein Randthema — und die
Bindung an einen Anbieter ohne Ausweg.

**Gegen Selbstbau** spricht schlicht die Zeit. Benutzerverwaltung richtig zu
bauen — Sign in with Apple, Sitzungen, Token-Erneuerung, Wiederherstellung,
Ratenbegrenzung beim Anmelden — sind Monate, die nicht am Produkt arbeiten,
und jede Abkürzung darin ist eine Sicherheitslücke mit Ansage.

## Konsequenzen

- **Es gibt ab jetzt zwei Betriebsorte statt einem.** `server.js` auf einem
  eigenen Host in der EU, Supabase daneben. Das ist neu: Bisher lief alles auf
  einem Rechner. Kosten: Supabase kostenlos zum Anfangen, $25/Monat ab dem
  Pro-Tarif; der Host ab ~5 €/Monat.
- **Row Level Security ist Pflicht, nicht Kür.** Jede Tabelle bekommt sie beim
  Anlegen, nicht später. Eine Tabelle ohne RLS ist ein offener Datensatz.
- **Das Guthaben wird ein Ledger, kein Zähler.** Nur anhängen, in einer
  Transaktion gebucht, mit dem Grund je Buchung. Ein Saldo, der sich nicht
  herleiten lässt, ist bei Geld wertlos.
- **`localStorage` wird zum Anzeige-Cache.** Die Wahrheit steht in Postgres.
  Das verlangt einen Migrationsweg für alle Träume, die heute nur lokal
  liegen — **⚠ dieser Weg muss existieren, bevor die erste Fassung
  ausgeliefert wird**, sonst verliert die erste Anmeldung das Tagebuch.
- **Das Löschrecht wird erstmals erfüllbar.** Eine Datei, ein Besitzer, ein
  Löschbefehl. Heute gibt es keine Zuordnung, mit der man es auch nur
  versuchen könnte.
- **`server.js` muss NICHT umgeschrieben werden.** Das ist der eigentliche
  Gewinn dieser Wahl gegenüber Convex: Antons Prompt-Kette, die Regie und die
  Job-Verwaltung bleiben, wo sie sind, und werden nicht angefasst.
- **Die Schlüssel bleiben, wo sie sind.** Der Client spricht weiterhin nur mit
  `server.js`. Supabase' `service_role`-Schlüssel gehört ausschließlich in die
  `.env` des Servers und nie in ein Bundle — dieselbe Regel wie für FAL_KEY.
- **Die Prüfung der Käufe ist noch nicht entschieden.** RevenueCat ist der
  naheliegende Weg (kostenlos bis $2.500 Monatsumsatz, danach $99/Monat) und
  gehört in ein eigenes ADR, zusammen mit den Store-Konten.
- **Befund S1 wird dadurch richtig gelöst.** Der verpflichtende Zugangsschutz
  wurde am 11.09. gebaut und zurückgenommen, weil der Client gar keinen Token
  sendet. Mit echten Konten erübrigt sich der Behelf: Ein Token im Bundle ist
  ein Token, den jeder hat — eine Sitzung ist es nicht.

## Verworfene Alternativen — warum

**Convex:** Kein Fehler, sondern der falsche Zuschnitt. Wer eine App mit
gemeinsam bearbeiteten Daten baut, bekommt dort etwas, das Postgres nur mit
Mühe nachbildet. Hier gibt es nichts gemeinsam zu bearbeiten. Übrig blieben
die Nachteile: 1 MiB je Dokument, kein SQL fürs Ledger, keine
Selbstbetreibbarkeit — und ein Backend-Modell, das verlangt hätte,
`server.js` zu zerlegen. **Wer das neu aufrollt, prüfe zuerst, ob sich die
Antwort auf „teilen mehrere Menschen dieselben Daten?" geändert hat.** Nur
dann ändert sich auch diese Entscheidung.

**Firebase:** Bei Geld das schwächere Werkzeug, bei EU-Daten die unsicherere
Rechtslage, beim Ausstieg die schlechteren Karten. Keine dieser drei Fragen
ist für dieses Produkt nebensächlich.

**Supabase Edge Functions als Ersatz für `server.js`:** Am ausführlichsten
geprüft und am klarsten verworfen — die Messungen stehen oben unter „Was die
Wahl einschränkt". Wollte man es dennoch, müsste die Analyse in einen
Job-Dienst, der Sprach-Relay in einen eigenen Dauerprozess und ffmpeg
irgendwohin: drei Backends statt einem, für null Gewinn.

**Selbst bauen:** Nur dann sinnvoll, wenn Supabase an einer harten Grenze
scheitert. Dieser Fall ist heute nicht absehbar, und der Ausweg bleibt offen,
weil Supabase selbst betreibbar ist.

## Wann neu prüfen

- Wenn **Echtzeit zwischen mehreren Menschen** zur Produktanforderung wird —
  geteilte Traumtagebücher, gemeinsames Bearbeiten. Dann ist die Abwägung
  gegen Convex eine andere und gehört neu geführt.
- Wenn die **Kosten** aus dem Rahmen laufen. Supabase ist bei Speicher und
  Bandbreite nicht der billigste Ort für Video; sollte sich das Produkt in
  diese Richtung entwickeln, kann die Dateiablage getrennt wandern, ohne
  diese Entscheidung im Ganzen aufzugeben.
- Wenn **Anton widerspricht.** Das Konto und die Rechnung sind seine; dieses
  ADR ist bis zu seiner Bestätigung ein Vorschlag.
