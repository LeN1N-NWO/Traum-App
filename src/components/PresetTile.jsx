import { useState } from "react";
import "./presetTile.css";

/* Eine Stil-Kachel mit laufender Vorschau (Antons Wahl 03.09.2026: das
 * Raster, Variante B der Werkbank).
 *
 * Drei Dinge, die nicht offensichtlich sind:
 *
 * 1. **Der Clip darf fehlen.** Heute liegen die Vorschauen unter /media/
 *    und gehören dem Gerät (presets.js erklärt, warum). Lädt der Clip
 *    nicht, zeigt die Kachel Emoji auf Farbe — dieselbe Regel wie bei den
 *    Kacheln im Kaufblatt (ShowcaseTile): Eine Kachel mit kaputtem Video
 *    ist schlimmer als eine ohne.
 *
 * 2. **Reduzierte Bewegung heißt keine Bewegung.** Das Video wird dann gar
 *    nicht geladen. Neun Clips, die niemand sehen will, sind fremdes
 *    Datenvolumen.
 *
 * 3. **Der `look`-Filter ist Attrappe.** Er färbt denselben Clip je Stil
 *    verschieden, solange es keine echten Stil-Clips gibt. Mit echten Clips
 *    fällt das Feld in presets.js weg, und hier ändert sich nichts. */

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PresetTile({ preset, label, sub, on, onPick, infoLabel, onInfo }) {
  const [broken, setBroken] = useState(false);
  const still = reducedMotion();
  const showClip = preset.clip && !broken && !still;

  return (
    <div className={"pt-wrap" + (preset.wide ? " pt-wide" : "")}>
      <button
        className={"pt" + (on ? " pt-on" : "")}
        onClick={() => onPick(preset.id)}
        aria-pressed={on}
      >
        {showClip ? (
          <video
            className="pt-clip"
            src={preset.clip}
            style={preset.look ? { filter: preset.look } : undefined}
            autoPlay muted loop playsInline preload="metadata"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="pt-blank" aria-hidden="true">{preset.emoji}</span>
        )}
        <span className="pt-scrim" aria-hidden="true" />
        <span className="pt-meta">
          <span className="pt-name">
            <span aria-hidden="true">{preset.emoji}</span> {label}
          </span>
          {sub && preset.wide && <span className="pt-sub">{sub}</span>}
        </span>
        {on && <span className="pt-check" aria-hidden="true">✓</span>}
      </button>
      {/* Das ⓘ liegt NEBEN dem Auswahlknopf in dessen Ecke, nie als Knopf
          im Knopf — dasselbe Muster wie bei Stilen und Modellen bisher. */}
      {onInfo && (
        <button className="pt-info" aria-label={infoLabel} onClick={onInfo}>i</button>
      )}
    </div>
  );
}
