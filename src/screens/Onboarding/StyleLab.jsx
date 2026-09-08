import { useState } from "react";
import { STYLES } from "../../lib/styles.js";
import "./styleLab.css";

/* Die Stil-Werkbank: drei Mockups dafür, wie Stil-Presets als VIDEO-Kacheln
 * aussehen könnten (Antons Ansage 03.09.2026).
 *
 * „Wir werden bei diesen Styles verschiedene Presets haben, eine Art
 * Kacheln, die ein kleines Video-Preview schon zeigen. Eins davon wird auch
 * dieser Style sein, den wir jetzt alles in einem Fluss haben … so wie wir
 * hatten bei den Credits auch schon so Kacheln mit Videos drinlaufen. Da
 * würde ich aber gerne drei Versionen als Mockup sehen, bevor wir es bauen."
 *
 * Dev-Werkzeug wie MascotLab: hängt am Startmenü, nicht an einer Route, und
 * verschwindet mit ihm. Es baut NICHTS in den Wizard ein — es zeigt.
 *
 * ── Was hier ehrlich nur Attrappe ist ────────────────────────────────────
 * Die Vorschau-Clips sind die drei Filme vom 03.09. (ruhig / schnell /
 * Fluss) plus zwei ältere, zyklisch verteilt, mit einem CSS-Filter je Stil
 * (Noir grau, Nostalgisch sepia …), damit sich die Kacheln unterscheiden.
 * Ein echtes Preset bräuchte einen eigenen, im jeweiligen Stil gerenderten
 * Clip — das ist dann Auslieferungsmaterial, kein Nutzerfilm. Was hier
 * beurteilt werden soll, ist das LAYOUT: Wie liegen die Kacheln, wie groß,
 * wie wählt man, wo steht der Name.
 *
 * ── Das neunte Preset ────────────────────────────────────────────────────
 * Der Fluss ohne Schnitte ist bislang ein TEMPO, kein Stil. Anton will ihn
 * als Preset neben den Stilen sehen. Der Arbeitstitel hier ist „Dreamflow";
 * der Name ist offen. */

/* ⚠ Die VORSCHAU-Kopien, nicht die Filme selbst (gemessen 03.09.2026):
   Neun Filme à 6–11 MB in 768×1344 gleichzeitig zu dekodieren, jeder mit
   einem CSS-Filter, hat den Renderer des Vorschau-Browsers 30 Sekunden
   blockiert — der Klick auf die Werkbank kam nie an. Die Kopien sind
   270 Pixel breit, sechs Sekunden, stumm, ~170 KB (ffmpeg, crf 28). Das
   ist auch die richtige Größe für echte Preset-Kacheln: Eine Vorschau,
   die das Datenvolumen eines Films kostet, ist keine. */
/* Flach unter /media/, nur Kleinbuchstaben und Ziffern, höchstens zwanzig
   Zeichen: resolveMedia() im Server lässt absichtlich nur die Namensform
   durch, die er selbst schreibt (Pfadschutz), und diese Regel weicht eine
   Werkbank nicht auf. Deshalb „pv" + Hash, kein Unterordner, kein Strich. */
const CLIPS = [
  "/media/pv146xj01olre81.mp4",   // Fluss
  "/media/pv3mbc0jejqwty8.mp4",   // schnell
  "/media/pv3nlve2uwl0zm.mp4",    // ruhig
  "/media/pvt8t2asdudzc4.mp4",    // Flamingo
  "/media/pv3q75trlqwsw61.mp4",   // Nebel und Lack
];

/* Ein Filter je Stil — nur damit sich dieselben Clips unterscheiden. */
const LOOK = {
  ultrareal: "contrast(1.05) saturate(1.05)",
  noir: "grayscale(1) contrast(1.25)",
  dreamlike: "saturate(.8) brightness(1.12)",   // kein blur: auf laufendem Video der teuerste Filter
  romantic: "sepia(.25) saturate(1.3) hue-rotate(-12deg)",
  dark: "brightness(.55) contrast(1.2) saturate(.7)",
  surreal: "hue-rotate(35deg) saturate(1.5)",
  nostalgic: "sepia(.6) contrast(.95)",
  adventurous: "saturate(1.35) contrast(1.1)",
  flow: "none",
};

const SUB = {
  ultrareal: "Wie gefilmt",
  noir: "Schwarzweiß, harte Schatten",
  dreamlike: "Weich, leuchtend",
  romantic: "Warm, golden",
  dark: "Dunkel, schwer",
  surreal: "Verdrehte Farben",
  nostalgic: "Verblichen wie ein Foto",
  adventurous: "Satt, kontrastreich",
  flow: "Kein Schnitt — alles wird ineinander",
};

const PRESETS = [
  { id: "flow", label: "Dreamflow", emoji: "🌊", clip: CLIPS[0], hero: true },
  ...STYLES.map((s, i) => ({ id: s.id, label: s.label, emoji: s.emoji, clip: CLIPS[(i + 1) % CLIPS.length] })),
];

function Clip({ preset, className = "" }) {
  return (
    <video
      className={"sl-clip " + className}
      src={preset.clip}
      style={{ filter: LOOK[preset.id] || "none" }}
      autoPlay muted loop playsInline preload="metadata"
    />
  );
}

/* ── A · Das Reel ────────────────────────────────────────────────────────
   Große Hochkant-Karten, eine fast bildschirmbreit, waagerecht wischen mit
   Einrasten. Wie Stories: Ein Stil, ein Bild, eine Entscheidung nach der
   anderen. Der gewählte trägt den Rahmen. */
function Reel({ picked, onPick }) {
  return (
    <div className="sl-reel">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          className={"sl-card" + (picked === p.id ? " sl-on" : "")}
          onClick={() => onPick(p.id)}
          aria-pressed={picked === p.id}
        >
          <Clip preset={p} />
          <span className="sl-card-scrim" aria-hidden="true" />
          <span className="sl-card-meta">
            <span className="sl-card-emoji" aria-hidden="true">{p.emoji}</span>
            <span className="sl-card-name">{p.label}</span>
            <span className="sl-card-sub">{SUB[p.id]}</span>
          </span>
          {picked === p.id && <span className="sl-check" aria-hidden="true">✓</span>}
        </button>
      ))}
    </div>
  );
}

/* ── B · Das Raster ──────────────────────────────────────────────────────
   Drei Spalten, alle Stile auf einen Blick, ohne zu wischen. Das Fluss-
   Preset liegt als doppelt breite Kachel oben — es ist das besondere. Der
   Name steht klein im Bild, die Wahl als Rahmen. */
function Grid({ picked, onPick }) {
  return (
    <div className="sl-grid">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          className={"sl-cell" + (p.hero ? " sl-cell-wide" : "") + (picked === p.id ? " sl-on" : "")}
          onClick={() => onPick(p.id)}
          aria-pressed={picked === p.id}
        >
          <Clip preset={p} />
          <span className="sl-cell-scrim" aria-hidden="true" />
          <span className="sl-cell-name">{p.emoji} {p.label}</span>
          {picked === p.id && <span className="sl-check sl-check-sm" aria-hidden="true">✓</span>}
        </button>
      ))}
    </div>
  );
}

/* ── C · Die Bühne ───────────────────────────────────────────────────────
   Oben läuft der gewählte Stil groß, mit Name und einem Satz. Darunter
   eine Reihe kleiner Vorschauen zum Antippen — wie der Filterwähler einer
   Kamera-App: Das Große zeigt, das Kleine wählt. */
function Stage({ picked, onPick }) {
  const p = PRESETS.find((x) => x.id === picked) || PRESETS[0];
  return (
    <div className="sl-stage">
      <div className="sl-stage-hero">
        <Clip preset={p} key={p.id} />
        <span className="sl-stage-scrim" aria-hidden="true" />
        <div className="sl-stage-meta">
          <span className="sl-stage-name">{p.emoji} {p.label}</span>
          <span className="sl-stage-sub">{SUB[p.id]}</span>
        </div>
      </div>
      <div className="sl-strip">
        {PRESETS.map((q) => (
          <button
            key={q.id}
            className={"sl-thumb" + (picked === q.id ? " sl-on" : "")}
            onClick={() => onPick(q.id)}
            aria-pressed={picked === q.id}
            aria-label={q.label}
          >
            <Clip preset={q} />
            <span className="sl-thumb-name">{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const VARIANTS = [
  { id: "reel", name: "A · Reel", note: "Große Karten, wischen wie durch Stories", View: Reel },
  { id: "grid", name: "B · Raster", note: "Alle auf einen Blick, Dreamflow als breite Kachel", View: Grid },
  { id: "stage", name: "C · Bühne", note: "Der gewählte Stil läuft groß, kleine Vorschauen wählen", View: Stage },
];

export default function StyleLab({ onExit }) {
  const [variant, setVariant] = useState("reel");
  const [picked, setPicked] = useState("flow");
  const { View, note } = VARIANTS.find((v) => v.id === variant);

  return (
    <main className="sl" lang="de" dir="ltr">
      <header className="sl-head">
        <button className="sl-exit" onClick={onExit}>← Zurück</button>
        <h1 className="sl-title">Stil-Presets als Video-Kacheln</h1>
        <div className="sl-tabs" role="tablist">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={variant === v.id}
              className={"sl-tab" + (variant === v.id ? " sl-tab-on" : "")}
              onClick={() => setVariant(v.id)}
            >{v.name}</button>
          ))}
        </div>
        <p className="sl-note">{note}</p>
      </header>

      <section className="sl-body">
        <h2 className="sl-sub">Wie soll es aussehen?</h2>
        <View picked={picked} onPick={setPicked} />
      </section>

      <footer className="sl-foot">
        Clips: deine drei Filme von heute plus zwei ältere, mit einem Farbfilter je Stil.
        Echte Presets bekommen eigene Clips — beurteilt wird hier das Layout.
      </footer>
    </main>
  );
}
