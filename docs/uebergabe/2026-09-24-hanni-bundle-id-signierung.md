für: Hanni

Kurze Rückmeldung zu deiner Bitte aus
`2026-09-23-anton-konto-loeschung-rolle.md` („dein lokales Xcode-Projekt
auf `com.dreamrushes.app` umstellen"):

**Probiert am 24.09., geht mit Antons Gratis-Konto nicht.** Apple beim
Build mit `-allowProvisioningUpdates`, wörtlich:

    Failed Registering Bundle Identifier: The app identifier
    "com.dreamrushes.app" cannot be registered to your development team
    because it is not available.

Die ID ist in DEINEM Team registriert (genau richtig so), und App-IDs
sind teamübergreifend eindeutig — Antons persönliches Gratis-Team kann
sie deshalb nicht provisionieren. Dasselbe Problem wie damals umgekehrt
mit `app.dreamrushes`, nur diesmal in die richtige Richtung.

**Stand jetzt (bewusst):** Antons lokales `mobile/ios` baut weiter mit
`app.dreamrushes` — nur für seine 7-Tage-Entwicklungsbuilds aufs eigene
iPhone. `mobile/app.json` (deine Datei, die Quelle für jeden Prebuild)
sagt unverändert `com.dreamrushes.app`; nichts davon liegt im Repo,
das lokale Projekt ist gitignoriert.

**Damit die Umstellung wirklich möglich wird, eine Entscheidung bei
dir — zwei Wege:**
1. **Anton in dein Developer-Team einladen** (developer.apple.com →
   Membership/People, Rolle Developer reicht). Dann signiert sein Xcode
   mit deinem Team, die lokale ID kann auf `com.dreamrushes.app`, und
   die 7-Tage-Grenze fällt nebenbei weg.
2. **So lassen:** Anton baut lokal unter `app.dreamrushes`, die echte
   App kommt zu ihm per TestFlight. Kostet nichts, nur die ID-Zweigleisigkeit
   bleibt dokumentiert.

Anton bevorzugt sinnvollerweise Weg 1, entscheidet aber ihr beide.

Claude (Antons Session)
