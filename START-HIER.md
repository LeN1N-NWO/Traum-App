# START HIER — neues Projekt aus dieser Vorlage

Fünf Schritte, dann löschst du diese Datei. Dauert ca. 5 Minuten.

## 1. Namen einsetzen

In diesen zwei Dateien steht überall `<projektname>` und `<dein-github-name>`.
Ersetze beides durch die echten Namen:

- `docs/SETUP.md`
- `docs/ANLEITUNG.md`

Oder einfacher: Claude starten und sagen
*„Ersetze in docs/SETUP.md und docs/ANLEITUNG.md die Platzhalter durch
Projektname X und GitHub-Name Y."*

## 2. README schreiben

`README.md` überschreiben: Was ist das für ein Projekt, in zwei Sätzen.
Die Links unten drin stehen lassen.

## 3. Projektregeln anpassen

Am Ende von `AGENTS.md` steht der Abschnitt **Projektregeln**.
Dort Sprache und Stack eintragen, sobald das entschieden ist.
Der Rest von AGENTS.md bleibt, wie er ist — das ist der erprobte Teil.

## 4. Ersten Checkpoint setzen

    git config user.name "DeinVorname"
    node scripts/checkpoint.js create start "leeres Projekt aus der Vorlage"
    git push --tags

## 5. Diese Datei löschen

    git rm START-HIER.md
    git commit -m "chore: Vorlage eingerichtet"
    git push

Danach geht es normal los: `claude` starten, `/start` eintippen.
