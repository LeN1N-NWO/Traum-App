# Geteilte Träume

Hier liegen die Träume, die **alle sehen sollen, die an der App entwickeln**
— Antons Entscheidung vom 22.08.2026: „Ich möchte, dass alle, die jetzt an
der App entwickeln, diese Träume sehen. Später, wenn wir die App
entwickeln, nehmen wir diese Regel raus."

## Wie sie hierher kommen

Von selbst. Die laufende App schickt jede inhaltliche Änderung an
`POST /api/journal-backup`, der Server legt sie als eine Datei je Traum ab
(`<datum>-<id>.json`). Regeln stehen in `src/lib/journalBackup.js`.

## Wie sie in eine frische Installation kommen

Ebenfalls von selbst — aber **nur im Entwicklungsmodus**: Beim Start holt
die App `GET /api/journal-backup` und ergänzt, was ihr Tagebuch noch nicht
kennt. Ein ausgelieferter Build tut das nicht (`import.meta.env.DEV`).

## Zwei Grenzen, die nicht zur Disposition stehen

1. **Keine Fotos.** Referenzbilder sind biometrische Daten, teils von
   anderen Menschen. `journalBackup.js` sichert über eine erlaubte
   Feldliste, nicht über „alles außer" — ein Test wacht darüber.
2. **Nur anhängen, nie löschen.** Verschwindet ein Traum aus der App,
   bleibt seine Datei stehen. Aufgeräumt wird ausschließlich auf Antons
   ausdrückliches Wort.

## Vor der Veröffentlichung

Diesen Ordner entfernen **und** den Ladepfad in `src/state/AppState.jsx`.
Beides ist als ⚠ markiert. Die `.gitignore` erklärt den Rest.
