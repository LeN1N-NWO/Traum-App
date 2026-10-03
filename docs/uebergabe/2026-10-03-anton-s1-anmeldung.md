für: Anton, LeN1N-NWO

# Notiz an Anton — S1: Bezahltes nur mit Konto (03.10.2026, Hanni)

Seit PR #72 gilt: **Umschauen ohne Konto ja, alles was Geld kostet nur mit
Konto.** Der Server prüft das mit `REQUIRE_AUTH=1` (`needsAccount()` in
`src/lib/gatekeeper.js`); lokal ist der Schalter aus, es ändert sich also
nichts beim Entwickeln. Versucht ein Gast etwas Bezahltes, öffnet die App
das Anmelde-Blatt — derselbe Anmelde-Schritt wie am Ende deines
Onboardings (`Account`, jetzt exportiert). Plan und Stand: Befund S1 in
`docs/ARCHITEKTUR.md`.

Deine Prompt-Kette, Modelle und Anfragekörper sind unberührt. In deinen
Dateien kam je Stelle nur eine Prop oder eine Kopfzeile dazu.

## Was du wissen solltest

1. **„Read my dream · Free" verwirrt.** Der Knopf sagt „Free", ein Gast
   bekommt aber das Anmelde-Blatt — die Analyse geht an DeepSeek und braucht
   deshalb ein Konto. Vorschlag: für Gäste anders beschriften (z. B. „Sign in
   to read my dream") oder „Free" nur zeigen, wenn jemand angemeldet ist. Das
   ist deine Oberfläche, deshalb nicht angefasst.
2. **Die Token-Brücke in den Web-Ansichten fällt mit dem Umzug weg.** Die
   vier `mobile/src/legacy/*`-Ansichten bekommen `getToken` von der nativen
   Seite, weil der Geldweg noch durch die alte Web-Oberfläche läuft
   (`NATIVE_ORDER = false`). Ist ein Bildschirm nativ, nimmt er
   `fetchWithSession`/`authFetch` aus `mobile/src/lib/auth.ts` — und die
   Prop an der Einbindung kann weg.
3. **Neu im Onboarding: „Skip to sign-in (dev)"** unter jedem Continue — nur
   im Entwicklungsbau (`__DEV__`), springt zur Anmeldung. Für dich zum
   Testen; im Release-Bau gibt es ihn nicht.
4. **Doppelter React-`key` im Schlaf-Regler** (`onboarding-flow.tsx`, die
   Kacheln in `SleepScale`: zweimal „of it dreaming"). Metro meldet es als
   Fehler; die Zeile ist auf main genauso, nicht von uns. Nicht angefasst.
5. **Der Foto-Check wirkt nirgends.** Das Onboarding-Foto (`mePhoto`) wurde
   noch nie geprüft, und das Ergebnis eines Checks (`photoCheck` an `me`/
   Figuren) liest keine Stelle aus. Sobald du es nutzen willst (z. B. Film
   mit abgelehntem Foto stoppen), kann der Check nach der Anmeldung
   nachgeholt werden — für Gäste scheitert er heute still als „nicht
   prüfbar".
6. **Sprachinterview als Gast** zeigt mit `REQUIRE_AUTH=1` „Could not reach
   the voice service" statt des Anmelde-Blatts — ein WebSocket kann den
   Grund der Abweisung nicht lesen. Fällt erst auf dem VPS auf.
7. **„Genug Guthaben" ist weiterhin deins:** S1 prüft nur das Konto.
   Die Abbuchung (`settleCharge()`, Punkte 2–6 in
   `2026-09-11-anton-credits-abbuchung.md`) kann jetzt auf die geprüfte
   Nutzerkennung bauen.
