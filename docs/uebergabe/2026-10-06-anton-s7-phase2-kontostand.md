für: Anton, LeN1N-NWO

# Übergabe an Anton — S7 Phase 2: Die App zeigt den Kontostand (06.10.2026, Hanni + Claude)

**Hannis Entscheidung (06.10.): „Anzeige + Film".** Seit PR #89 bucht der
Server den Film im Konto ab — die App zeigte aber weiter den Gerätezähler
(mit Test-Auffüllung immer ≥ 500). Jetzt zeigt sie das Konto.

## Was sich geändert hat

**`src/lib/api.js` — neu `accountCredits()`:** `GET /api/account`, gibt
`credits.total` zurück. Nur mit Token, und bewusst **nicht** über
`sendWithSession`: Ein 401 dort öffnet beim Gast das Anmelde-Blatt — eine
Anzeige darf das nie. Ohne Token / ohne Datenbank / bei Fehler → `null`.

**`mobile/src/legacy/journal-bridge.jsx`:**
- Kontostand je Konto-ID gemerkt (`konto`, `refreshKonto`), höchstens alle
  15 s neu gefragt (bei jedem Wecken der Brücke), nach einer Bestellung
  sofort. Ein Aussetzer behält die letzte Zahl.
- **Anzeige** (`shownCredits`): Profil, Bezahlblatt, Skizzen-Vorbereitung —
  Kontostand, wenn bekannt, sonst wie bisher der Gerätezähler (Gast, lokal).
- **Film** (`runOrder`): Vorprüfung gegen den Kontostand; die
  Geräte-Abbuchung nach dem Auftrag fällt mit Konto weg (`deviceSpend`).
  Ein 402 vom Server (`reason: "credits"`) wird zu `error: "nocredits"` —
  die Auftragsseite führt dann wie bei der Vorprüfung zur Bezahlseite.
- **Charakterbogen und Skizze:** mit Konto bucht das Gerät nicht mehr ab —
  der Server bucht sie noch nicht, also sind sie für Angemeldete bis dahin
  **gratis** (so entschieden). Sonst wären sie nach B4a (Test-Guthaben auf
  0) blockiert, obwohl die Anzeige Guthaben zeigt.
- Unverändert: Verbessern/Analyse (Preis 0), `devTopUp`, Käufe (schreiben
  bis B1 weiter nur dem Gerät gut — in TestFlight sieht ein Sandbox-Kauf
  also keine Wirkung auf die Anzeige).

## Belegt

- 4 neue Tests für `accountCredits` (Token, Gast, 401 ohne Anmelde-Blatt,
  Fehlerfälle); Gegenprobe: über `sendWithSession` bricht der 401-Test.
  945 Tests grün, `tsc` 0, Lint wie `main` (22 alte Warnungen).
- Simulator gegen den VPS, Hannis Konto: Profil zeigt **485** (500 − 7 − 8,
  die beiden bezahlten Filme) statt ≥ 500 vom Gerät.

## Offen

- Nicht live geprüft: 402 beim Film (bräuchte ein leeres Konto) — der Weg
  ist derselbe wie bei der Vorprüfung.
- Erstattung nach gescheitertem Film erscheint in der Anzeige beim nächsten
  Wecken der Brücke (≤ 15 s nach Fokus), nicht sofort.
- Charakterbogen/Skizze/Bilder serverseitig abbuchen, B1 (Käufe ins Konto).
