import { useState } from "react";
import { mascot } from "../lib/mascots.js";
import { useAppState } from "../state/AppState.jsx";
import "./mascotLoader.css";

/* Die Ladeanzeige der App: das Maskottchen, nicht ein drehender Ring.
 *
 * Antons Ansage (03.09.2026): „Kannst du bei der Ladeanimation, also der
 * drehenden Kugel, wieder den Frosch nehmen — die Animation, wo er sich im
 * Loop hinlegt und schläft."
 *
 * Es ist dieselbe Idle-Datei wie im Onboarding (mascots.js, `idle`), nur an
 * jeder Stelle, an der die App warten lässt. Das passt auch inhaltlich: Wer
 * hier wartet, wartet auf einen Traum, und der Frosch schläft solange.
 *
 * ── Warum eine eigene Datei und nicht Mascot.jsx wiederverwendet ─────────
 * Mascot.jsx wohnt im Onboarding und zieht dessen Stylesheet mit. Diese
 * Anzeige erscheint überall — Wizard, Journal, Wartebildschirme — und darf
 * nicht davon abhängen, dass ein Onboarding-Stylesheet geladen ist. Die
 * Bildquelle kommt bei beiden aus derselben Tabelle: Wer ein zweites
 * Maskottchen einträgt, ändert beide Stellen mit einer Zeile.
 *
 * ⚠ Der `screen`-Trick von Mascot.jsx gilt hier genauso: Die Quelle ist
 * weiße Strichzeichnung auf gemessenem Reinschwarz, `mix-blend-mode:
 * screen` rechnet das Schwarz auf Null. Kein `isolation: isolate` auf den
 * Behälter legen — dann wäre der schwarze Kasten zurück.
 *
 * ⚠ `autoPlay muted loop playsInline`, wie im Haus üblich. Kein eigenes
 * play() im Effekt: Genau daran stand der Frosch im Onboarding einmal
 * still, ohne eine einzige Fehlermeldung.
 *
 * @param {"page"|"inline"} size  "page" für Wartebildschirme (der Frosch in
 *   voller Größe), "inline" für eine Zeile neben Text. Unter etwa 40 Pixeln
 *   ist von der Zeichnung nichts mehr zu erkennen — dort bleibt der Ring.
 */
export default function MascotLoader({ size = "page", className = "" }) {
  const { state } = useAppState();
  const m = mascot(state);
  /* Wer Bewegung abgeschaltet hat, bekommt das Standbild — dieselbe Regel
     wie beim wandernden Licht und beim Wisch-Hinweis. Das Video wird dann
     gar nicht geladen. */
  const [stillHalten] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
  );

  return (
    <div className={`ml-wrap ml-${size} ${className}`.trim()} aria-hidden="true">
      <video
        className="ml-film"
        src={stillHalten ? undefined : m.idle.src}
        poster={m.idle.poster}
        autoPlay={!stillHalten}
        muted
        loop
        playsInline
        preload={stillHalten ? "none" : "auto"}
      />
    </div>
  );
}
