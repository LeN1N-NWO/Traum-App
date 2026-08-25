import { useState } from "react";
import Button from "../../components/Button.jsx";
import ButtonTapOverlay from "../../components/ButtonTapOverlay.jsx";
import { MASCOTS, mascot } from "../../lib/mascots.js";
import "./onboarding.css";

/* Die Werkbank fürs Maskottchen — auf Antons Bitte (25.08.2026): „Starte
 * mir diese Page, damit ich es mal probieren kann. Ich würde so eine Art
 * kurzen Dummy sehen, wo ich immer wieder draufklicken kann."
 *
 * Der Knopf hier ist ABSICHTLICH derselbe `Button` wie auf dem
 * Erzeugen-Bildschirm, an derselben Stelle unten. Ein Prüfstand, der die
 * Geometrie nachbaut statt sie zu benutzen, prüft seine eigene Nachbildung.
 *
 * Der Größenregler ist der Grund, warum es diese Seite gibt: 0,65 ist am
 * 25.08. gegengerendert, aber „passt" entscheidet ein Auge, keine Rechnung.
 * Was der Regler findet, gehört danach nach `mascots.js` — hier bleibt es
 * nicht stehen.
 *
 * Englisch fest verdrahtet, wie im StartMenu und aus demselben Grund: Diese
 * Seite hängt an ihm, läuft also vor der Sprachwahl. Und sie stirbt mit ihm
 * — beides ist Dev-Werkzeug, das vor dem Launch gelöscht wird.
 *
 * ⚠ Kein `key`-Trick, um neu zu starten: Der Einspieler wird abgeräumt und
 * beim nächsten Druck frisch angelegt. Ein montiertes Video, das über
 * `currentTime = 0` wieder anspringt, ließe den WebGL-Aufbau stehen — und
 * die Dekoderzahl auf dem Telefon ist klein (siehe AlphaVideo.jsx). */
export default function MascotLab({ onExit }) {
  const [rect, setRect] = useState(null);
  const [scale, setScale] = useState(mascot(null).tap.scale);
  const [laeufe, setLaeufe] = useState(0);

  /* Das Rechteck kommt aus dem Ereignis, nicht aus einem ref: `currentTarget`
     IST der Knopf, und so braucht `Button` keine ref-Weiterleitung. Auf dem
     echten Bildschirm ist es dieselbe Zeile — dort sogar zwingend, weil der
     Knopf unmittelbar danach verschwindet. */
  function tippen(e) {
    setRect(e.currentTarget.getBoundingClientRect());
    setLaeufe((n) => n + 1);
  }

  const m = mascot(null);

  return (
    <main className="ob ob-center mascot-lab" lang="en" dir="ltr">
      <h1 className="ob-title">Mascot test bench</h1>
      <p className="ob-text">
        Press the button. The mascot reaches in and taps it for you — the
        same overlay the generate button uses.
      </p>

      <p className="lab-readout">
        {m.name} · anchor {(m.tap.anchor.x * 100).toFixed(1)} % /{" "}
        {(m.tap.anchor.y * 100).toFixed(1)} % · {m.tap.seconds}s ·{" "}
        {laeufe} {laeufe === 1 ? "run" : "runs"}
      </p>

      <label className="lab-slider">
        <span>size {Math.round(scale * 100)} %</span>
        <input
          type="range"
          min="35" max="100" step="1"
          value={Math.round(scale * 100)}
          onChange={(e) => setScale(Number(e.target.value) / 100)}
        />
        <small>
          {scale === m.tap.scale
            ? "matches mascots.js"
            : `mascots.js says ${Math.round(m.tap.scale * 100)} % — tell me if this is better`}
        </small>
      </label>

      {/* Nur solange es mehr als eins gibt. Heute ist die Liste einzeilig,
          und eine Auswahl mit einem Eintrag ist eine Attrappe. */}
      {MASCOTS.length > 1 && (
        <p className="ob-text">{MASCOTS.map((x) => x.name).join(" · ")}</p>
      )}

      <div className="ob-actions lab-actions">
        <Button onClick={tippen}>Create images · 4 credits</Button>
        <Button variant="ghost" onClick={onExit}>Back</Button>
      </div>

      {rect && (
        <ButtonTapOverlay
          rect={rect}
          scale={scale}
          onDone={() => setRect(null)}
        />
      )}
    </main>
  );
}
