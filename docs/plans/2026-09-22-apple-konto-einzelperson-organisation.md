# Apple-Konto: jetzt Einzelperson, später die UG

Stand 22.09.2026 — Hanni, mit Claude. Apple-Aussagen unten sind an Apples
eigener Doku geprüft (Quellen am Ende), nicht aus dem Gedächtnis.

**Entscheidung (Hanni):** Das Apple Developer Program läuft vorerst auf
Hanni als **Einzelperson**, weil die Gründung der UG länger dauert. Später
soll die UG Verkäuferin im App Store sein.

Für Entwicklung, TestFlight, Gerätetests und „Mit Apple anmelden" ändert das
heute nichts. Es entscheidet aber, **wann** der Launch sinnvoll liegt — und
es kann jedes Apple-Konto in der App kosten, wenn der Umzug falsch läuft.

## Zwei Wege zur UG

**A — Die bestehende Mitgliedschaft umstellen lassen (bevorzugt).**
Apple hat dafür einen eigenen Antrag („update your membership from an
individual to an organization"). Voraussetzungen: Hanni ist
Gründerin/Mitgründerin, die UG hat eine **D-U-N-S-Nummer**, ggf.
Geschäftsunterlagen. Geht durch Apples Rechtsprüfung — nach Berichten
Tage bis über einen Monat.

⚠ **Offen und entscheidend: Bleibt dabei die Team-ID gleich?** Apples Doku
sagt es nicht. Bleibt sie, bleiben die Apple-Kennungen der Nutzer gleich
und es ist nichts zu migrieren. Wechselt sie, gilt alles unter „Die Falle".
→ **Diese Frage im Antrag ausdrücklich stellen**, bevor es echte Nutzer gibt.

**B — Die UG neu einschreiben und die App übertragen (Rückfall).**
App-Transfer-Kriterien, soweit sie uns betreffen:
- Die App braucht **mindestens eine im App Store veröffentlichte Version.**
  Vor dem Launch lässt sie sich also gar nicht übertragen.
- In-App-Produkt-IDs der App dürfen im Ziel-Account **nicht schon
  existieren** → in der UG vorher keine Produkte mit denselben IDs anlegen
  (z. B. `credits.starter` aus der Codes-Übergabe).
- Für „Mit Apple anmelden" darf die App-ID nicht gruppiert sein (wir sind
  „primary App ID" — passt). TestFlight-Tests müssen aus sein.
- Die Bundle-ID `app.dreamrushes` bleibt beim Transfer gleich.

## Die Falle: „Mit Apple anmelden" hängt am Team

- Apples Nutzerkennung (`sub`) gilt **pro Team.** Neues Team → neue
  Kennung für jeden Menschen.
- Wer „E-Mail-Adresse verbergen" gewählt hat, bekommt im neuen Team auch
  eine **neue Relay-Adresse** — die alte leitet nicht mehr weiter.
- Apple liefert nach dem Transfer **60 Tage lang** eine `transfer_sub` im
  Token mit, über die sich alt und neu verbinden lassen. Wird das Fenster
  verpasst, muss die App zurück übertragen und von vorn migriert werden.

**Was das bei uns trifft:** Alle unsere Tabellen hängen an
`auth.users(id)` — der Supabase-UUID, nicht an Apples Kennung
(`profiles.id`, `dreams.user_id`, `credits_balance.user_id`,
`credits_ledger.user_id`). Träume und Guthaben bleiben also liegen. Kaputt
geht die **Verbindung** zwischen Apple-Kennung und Supabase-Nutzer
(`auth.identities`). Ohne Umschreiben passiert beim nächsten Anmelden
Folgendes: Supabase kennt die Kennung nicht, legt ein **neues** Konto an,
der Trigger gibt ihm eine leere Guthabenzeile — und Träume und bezahltes
Guthaben hängen unsichtbar am alten Konto. Kein Fehler, nirgends.

Das Umschreiben der Identitäten ist **noch nicht gebaut** und muss vor
einem Transfer stehen.

## Was daraus folgt

1. **Weg A zuerst.** Im Antrag fragen, ob die Team-ID bleibt.
2. **Umstellen, bevor es zahlende Nutzer gibt** — danach migriert man
   Geld. Einladungsprämien machen es schlimmer: sie verknüpfen zwei Konten.
3. Bei Weg B liegt der Transfer zwangsläufig **nach** dem Launch
   (veröffentlichte Version nötig) → enges Fenster zwischen Launch und
   erstem Kauf. Oder den Launch auf die fertige UG warten lassen.
4. **Einnahmen vor der Umstellung sind steuerlich Hannis** als
   Privatperson, nicht die der UG — gehört zum Umsatzsteuer-Vermerk.
5. Reihenfolge: UG im Handelsregister → D-U-N-S beantragen (dauert selbst)
   → Antrag bei Apple.

## Verwandt: `app.dreamrushes` ist „not available" (22.09., unbestätigt)

Beim Speichern der App-ID meldete das Portal: *„An App ID with Identifier
'app.dreamrushes' is not available."* Bundle-IDs sind über **alle**
Apple-Accounts eindeutig. Wahrscheinliche Ursache: Antons Release-Bau aufs
iPhone am 18.09. lief mit einem **kostenlosen Account** (WORKLOG 18.09.:
„Free-Account: Signatur läuft nach 7 Tagen ab"), und Xcode registriert die
App-ID dabei automatisch in dessen *Personal Team*.

- Erst gegenprüfen: steht die ID in Hannis eigener Identifiers-Liste?
- Ein Gratis-Account kommt nicht an *Identifiers* heran — Anton kann sie
  nicht selbst löschen. Freigabe über Apple Developer Support, oder die
  Bundle-ID ändern, solange nichts im Store ist.
- ⚠ **Schleife:** Antons Gratis-Signatur läuft alle 7 Tage ab; beim
  nächsten Neubau holt Xcode sich die ID aus `app.json` sofort wieder.
  Vorher klären, mit welchem Team Gerätebauten signiert werden.
- Dasselbe Thema wie oben: **Wem gehört die Identität der App?** Die
  App-ID muss in dem Account liegen, der am Ende ausliefert.

## Quellen

- [App transfer criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria) — „at least one version that was released to the App Store"; Produkt-ID-Konflikte
- [Overview of app transfer](https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer) — Sign in with Apple, TestFlight, In-App-Käufe
- [TN3159: Migrating Sign in with Apple users for an app transfer](https://developer.apple.com/documentation/technotes/tn3159-migrating-sign-in-with-apple-users-for-an-app-transfer)
- [Transferring your apps and users to another team](https://developer.apple.com/documentation/signinwithapple/transferring-your-apps-and-users-to-another-team)
- [Updating your account information](https://developer.apple.com/help/account/membership/updating-your-account-information/) — Antrag Einzelperson → Organisation
