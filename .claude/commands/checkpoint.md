---
description: Benannten Wiederherstellungspunkt setzen (annotierter Git-Tag)
argument-hint: <name> [beschreibung]
---

Setze einen benannten Wiederherstellungspunkt.

1. Falls es uncommittete Änderungen gibt, committe sie zuerst (frage bei Unklarheit,
   ob sie in den Checkpoint sollen).
2. Führe aus: `node scripts/checkpoint.js create $ARGUMENTS`
3. Pushe den Tag: `git push --tags`
4. Bestätige dem Menschen den Tag-Namen und wofür er steht.

Hinweis: Checkpoints sind annotierte Git-Tags — geteilt, dauerhaft, für alle sichtbar.
Sie sind NICHT dasselbe wie `/rewind` (das ist sitzungslokal und flüchtig).
