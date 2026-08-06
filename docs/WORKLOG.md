# WORKLOG — Historie, nur anhängend, neue Einträge OBEN

> Alte Einträge werden NIE geändert. Richtigstellungen kommen als neuer Eintrag dazu.
> Pro Eintrag: Datum, Uhrzeit, Name, Branch, Commits, was, warum, was der Nächste wissen muss.

## 2026-08-06 13:48 — Anton — Branch `session/2026-08-06-anton`

**Was:** Vorlage fertig eingerichtet (START-HIER.md abgearbeitet: Platzhalter in
`docs/SETUP.md`/`docs/ANLEITUNG.md` ersetzt, README neu geschrieben, ADR-0002 für
den Stack angelegt, `AGENTS.md`-Projektregeln aktualisiert, `START-HIER.md`
gelöscht). Danach die Traum-App (Dream Rushes) aus einem separaten Prototyp-Ordner
ins Repo überführt: `index.html`, `server.js`, `package.json`, `.env.example`,
`clips/` (leer, `.gitkeep`).

**Warum:** Anton hatte die App bereits in einer anderen Umgebung gebaut und
gegen die echte Higgsfield-API getestet (funktioniert: Nano-Banana-Bildsequenzen
mit Gesichts-Konsistenz per Referenzbild, Seedance-Video, beides nativ 9:16).
Ziel war, dieses Repo als dauerhaftes, versioniertes Zuhause für die App zu
nutzen statt in einem unversionierten `~/Documents`-Ordner weiterzuarbeiten.

**Was der Nächste wissen muss:**
- Kein Key im Repo — `.env` muss lokal selbst angelegt werden (siehe
  `.env.example` + `docs/SETUP.md`).
- Die Bildgenerierung, die als Beweis diente, lief über eine separate
  MCP-Verbindung außerhalb dieses Repos — im Repo selbst ist Live-Generierung
  noch nicht verifiziert, nur der Code-Pfad dafür steht (`server.js` →
  `/api/generate`).
- Details, offene Punkte, nächste Schritte: siehe `docs/STAND.md`.
