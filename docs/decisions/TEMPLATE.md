# ADR-XXXX: Titel der Entscheidung

**Status:** vorgeschlagen | angenommen | ersetzt durch ADR-YYYY · **Datum:** JJJJ-MM-TT · **Format:** MADR

## Kontext

Welches Problem zwingt zur Entscheidung? Welche Kräfte wirken?

## Betrachtete Optionen

1. Option A
2. Option B
3. Option C

## Entscheidung

Gewählt: Option X, weil …

## Konsequenzen

Was wird dadurch besser, was schlechter, was wird zur Pflicht?

## Verworfene Alternativen — warum

Der eigentliche Wert des ADR: verhindert, dass jemand dieselbe Sackgasse nochmal betritt.
ADRs sind unveränderlich — eine neue Entscheidung ersetzt sie durch ein neues ADR.

## ⚠ Verweise auf lebende Dokumente

Aus der Unveränderlichkeit folgt eine Regel, die leicht zu übersehen ist:
**Ein ADR darf sich nicht auf ein Dokument stützen, das sich ändert.**
`STAND.md` und `ARCHITEKTUR.md` werden fortgeschrieben — wer von hier
dorthin verweist, hat in einem Jahr eine Begründung, die gewandert ist.

- **Belege gehören INS ADR.** Zahlen, Messwerte, Zitate ausschreiben, nicht
  verlinken. Das Dokument muss allein stehen können.
- **Muss doch verwiesen werden, dann auf einen Commit** (`Stand <hash>`).
  Der bleibt abrufbar, auch wenn die Datei weiterläuft.
- **Umgekehrt ist es richtig:** Lebende Dokumente dürfen und sollen auf ADRs
  zeigen. Fest zeigt nie auf beweglich, beweglich gern auf fest.
- Dokumente mit Datum im Dateinamen (`docs/plans/JJJJ-MM-TT-*.md`) sind durch
  die Nomenklatur eingefroren und damit unbedenklich.
