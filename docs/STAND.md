# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-06

## Woran wird gearbeitet

- Vorlage abgeschlossen (Platzhalter ersetzt, START-HIER.md entfernt, ADR-0002
  für den Stack geschrieben) und die bereits andernorts gebaute Traum-App
  (Dream Rushes) ins Repo überführt: `index.html`, `server.js`, `package.json`,
  `.env.example`.
- Die App funktioniert als Prototyp und wurde mit echter Higgsfield-Generierung
  getestet (Nano-Banana-Bildsequenzen mit Gesichts-Konsistenz, Seedance-Video) —
  aber außerhalb dieses Repos, über eine separate MCP-Verbindung. Im Repo selbst
  ist noch **kein** `HF_CREDENTIALS`-Key hinterlegt (darf per Regel auch nie ins
  Repo, nur in die lokale `.env`).

## Bekannte Baustellen

- `.env` fehlt lokal noch — ohne sie liefert `/api/generate` einen klaren 503
  und die App fällt auf Beispiel-Inhalte zurück (`server.js`, Fehlermeldungen
  dort). Wer weiterarbeitet: eigenen Higgsfield-Key besorgen (cloud.higgsfield.ai),
  `.env` aus `.env.example` anlegen.
- Model-Slugs in `server.js` (`nano-banana-2/text-to-image`, `seedance-2/text-to-video`)
  sind Annahmen aus der SDK-Doku, nicht am eigenen Higgsfield-Katalog verifiziert.
  Vor echtem Test gegen `cloud.higgsfield.ai`-Dashboard abgleichen.
- `server.js` reicht den rohen Traumtext unverändert an das Modell weiter. Für
  wirklich gute, Deakins-gerahmte Frames fehlt noch die Anbindung an den
  Prompt-Aufbau, der andernorts als Skill existiert (10-Beat-Bogen, Shot-Ladder,
  Identity-Locks) — siehe WORKLOG für Details.
- `scripts/shared-files.json` enthält weiterhin nur Platzhalter — jetzt, wo Code
  existiert, empirisch ermitteln, welche Dateien quer über Feature-Grenzen
  importiert werden (aktuell: `index.html` und `server.js` sind die einzigen
  Kern-Dateien, beide de facto "shared").
- Kein Lint/Test-Setup — bei einer Datei ohne Build-Step noch nicht dringend,
  aber offen.

## Nächste Schritte

1. Eigenen Higgsfield-Key besorgen und lokal in `.env` eintragen, echte
   Generierung end-to-end im Repo (nicht nur extern) verifizieren.
2. Model-Slugs im Higgsfield-Dashboard-Katalog gegenprüfen, `.env` ggf. mit
   `HF_MODEL_IMAGE`/`HF_MODEL_VIDEO` überschreiben.
3. Den Prompt-Aufbau (10-Beat-Traum-Bogen, Deakins-Shot-Ladder, Gesichts-Locks)
   in `server.js` einbauen, statt rohen Text durchzureichen.
4. `scripts/shared-files.json` mit den echten geteilten Dateien füllen.
