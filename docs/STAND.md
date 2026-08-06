# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** (Datum der ersten Session eintragen)

## Woran wird gearbeitet

- Projekt frisch aus der Vorlage angelegt. Die Arbeitsweise steht, die App noch nicht.

## Bekannte Baustellen

- `scripts/shared-files.json` enthält nur Platzhalter. Sobald Code existiert, empirisch
  neu ermitteln: welche Dateien werden quer über Feature-Grenzen importiert?
- Kein package.json / kein Lint — die Regel „Lint muss sauber sein" greift erst,
  wenn der Stack steht.

## Nächste Schritte

1. START-HIER.md abarbeiten und danach löschen.
2. Stack entscheiden und als ADR-0002 in `docs/decisions/` festhalten.
3. Projektgerüst anlegen, Frischinstallation testen, Lint einrichten.
