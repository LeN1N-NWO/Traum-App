import { useMemo, useState } from "react";
import { recurrenceFor } from "../lib/atlas.js";
import { symbolById } from "../lib/symbols.js";
import { t } from "../i18n/index.js";
import "./recurrence.css";

/* „Davon hast du schon geträumt" — Mehrwert-Plan P2b, die Oberfläche zu
 * recurrenceFor() (atlas.js:137).
 *
 * Der Unterschied zur Reflection darunter: Die Reflection ist eine DEUTUNG
 * (ein Aufruf, ein Absatz, eine mögliche Lesart). Das hier ist ein BEFUND —
 * gezählt, nicht gedeutet, ohne Modell, ohne Kosten. Deshalb steht es
 * DARÜBER: erst was war, dann was es heißen könnte.
 *
 * Jede Marke führt zu den früheren Träumen selbst. Das ist der eigentliche
 * Punkt: Ein Hinweis „Wasser: ×3", der nirgendwohin führt, ist Dekoration.
 * Erst der Weg zurück in die drei Nächte macht daraus ein Muster, das man
 * nachlesen kann.
 *
 * Zeigt sich nur, wenn es wirklich etwas gibt (sonst: null) — und höchstens
 * fünf Marken, drei Symbole plus zwei Figuren. Der Atlas ist der Ort fürs
 * Inventar; hier steht nur, was an DIESEM Traum wiederkehrt. */
const MAX_SYMBOLS = 3;
const MAX_CAST = 2;
const MAX_DREAMS = 4;

export default function Recurrence({ journal, entry, onOpen }) {
  const [open, setOpen] = useState(null);

  const { symbols, cast } = useMemo(() => recurrenceFor(journal, entry), [journal, entry]);
  const byId = useMemo(() => new Map((journal || []).map((e) => [e.id, e])), [journal]);

  const items = useMemo(() => [
    ...symbols.slice(0, MAX_SYMBOLS).map((s) => ({
      key: `s:${s.id}`,
      icon: symbolById(s.id)?.emoji || "✦",
      label: t.symbols.byId[s.id]?.label || s.id,
      count: s.count,
      entryIds: s.entryIds,
    })),
    ...cast.slice(0, MAX_CAST).map((c) => ({
      key: `c:${c.tag}`,
      icon: "@",
      label: c.tag,
      count: c.count,
      entryIds: c.entryIds,
    })),
  ], [symbols, cast]);

  if (!items.length) return null;
  const shown = items.find((i) => i.key === open) || null;

  return (
    <div className="j-rec">
      <p className="j-original-label">{t.journal.recurrenceTitle}</p>
      <div className="j-rec-chips">
        {items.map((it) => (
          <button
            key={it.key}
            className={`j-rec-chip${open === it.key ? " j-rec-chip-on" : ""}`}
            aria-expanded={open === it.key}
            onClick={() => setOpen(open === it.key ? null : it.key)}
          >
            <span className="j-rec-chip-icon" aria-hidden="true">{it.icon}</span>
            <span className="j-rec-chip-label">{it.label}</span>
            <span className="j-rec-chip-n">×{it.count}</span>
          </button>
        ))}
      </div>

      {shown && (
        <div className="j-rec-dreams">
          <p className="j-rec-lede">{t.journal.recurrenceIn(shown.count, shown.label)}</p>
          {shown.entryIds.slice(0, MAX_DREAMS).map((id) => {
            const e = byId.get(id);
            if (!e) return null;
            return (
              <button key={id} className="j-rec-dream" onClick={() => onOpen(id)}>
                <span className="j-rec-dream-title">{e.title || t.journal.untitled}</span>
                <span className="j-rec-dream-date">
                  {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
