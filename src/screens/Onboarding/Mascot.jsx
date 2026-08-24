import { useState } from "react";
import "./onboarding.css";
import frogVideo from "../../assets/mascot-frog-idle.mp4";
import frogPoster from "../../assets/mascot-frog-idle.jpg";

/* Das Maskottchen: Antons Frosch, gezeichnet wie mit Kreide.
 *
 * Bis zum 24.08.2026 stand hier ein SVG-Platzhalter („erstmal dumm"), und
 * sein eigener Dateikopf sagte, die Art Direction werde diese Datei einmal
 * komplett ersetzen. Das ist jetzt passiert.
 *
 * ── Warum ein Video ohne Alphakanal transparent aussieht ─────────────────
 * Die Quelle ist weiße Strichzeichnung auf Schwarz — gemessen echtes
 * Reinschwarz, RGB 0,0,0 in den Ecken. Für so etwas braucht es keinen
 * Alphakanal: `mix-blend-mode: screen` (onboarding.css) rechnet Schwarz auf
 * Null, und der Hintergrund der App scheint durch. Am 24.08. gegen einen
 * hellen Verlauf gegengeprüft — das Schwarz verschwindet restlos.
 *
 * ⚠ Das ist der billigste Weg von allen, und er geht NUR bei hellem Motiv
 * auf dunklem Grund. Sobald ein Motiv dunkle Anteile hat, verschwinden die
 * mit — dann führt kein Weg an echtem Alpha vorbei, und dafür gibt es
 * `AlphaVideo.jsx` samt `scripts/alpha-packen.mjs`. Screen kostet 0 Bytes
 * extra, die Alpha-Packung rund das Doppelte — und braucht WebGL.
 *
 * ⚠ KEIN `isolation: isolate` auf dem Behälter. Das erzeugte einen neuen
 * Stapelkontext, und dann läge hinter dem Video nichts mehr, mit dem sich
 * Schwarz verrechnen könnte — der schwarze Kasten wäre zurück. Das Blenden
 * SOLL bis auf den Seitenhintergrund durchgreifen.
 *
 * ── Die Datei ────────────────────────────────────────────────────────────
 * Antons Original war 7299 KB (500×500, 15 s, ~4 Mbit/s — für eine
 * Strichzeichnung weit überzeichnet). Neu kodiert mit CRF 23: 460 KB, bei
 * dreifacher Vergrößerung nicht vom Original zu unterscheiden. Damit liegt
 * es auf der Höhe der beiden Clips, die schon im Bündel sind (~650 KB).
 *
 * ⚠ `autoPlay muted loop playsInline` ist die Konvention, die im Haus schon
 * zweimal steht (HomeScreen, Onboarding-Hero) — bitte nicht durch ein
 * eigenes `play()` im Effekt ersetzen. Die erste Fassung hier tat genau das
 * und ließ `autoPlay` weg: Der Frosch stand still, ohne eine einzige
 * Fehlermeldung, weil das abgelehnte play()-Promise abgefangen war und das
 * Poster wie ein gewolltes Standbild aussah.
 *
 * ⚠ Und die Diagnose daneben ist es wert, festgehalten zu werden, WEIL sie
 * falsch war: Auffällig war, dass React `muted` als PROPERTY setzt und nicht
 * als ATTRIBUT — eine bekannte Stolperstelle, und sie sah nach der Ursache
 * aus. Ist sie hier aber nicht. Nachgemessen im Browser, mit laufendem
 * Video: `hasAttribute("muted")` ist WEITERHIN false, und es spielt
 * trotzdem. Chrome liest für die Autoplay-Regel die Property. Gefehlt hat
 * allein `autoPlay`.
 *
 * Das Poster ist die Rückfallebene, falls eine WebView doch einmal blockt —
 * dann steht ein Bild da statt einer leeren Fläche.
 */
export default function Mascot() {
  /* Wer Bewegung abgeschaltet hat, bekommt das Standbild — dieselbe Regel
     wie beim wandernden Licht (orbit.css) und beim Wisch-Hinweis. Das Video
     wird dann gar nicht erst geladen: 460 KB für etwas zu holen, das
     niemand sehen will, wäre fremdes Datenvolumen. */
  const [stillHalten] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
  );

  return (
    <div className="ob-mascot" aria-hidden="true">
      <video
        className="ob-mascot-film"
        src={stillHalten ? undefined : frogVideo}
        poster={frogPoster}
        autoPlay={!stillHalten}
        muted
        loop
        /* ⚠ Ohne `playsInline` reißt Safari das Video beim Start in den
           Vollbildmodus — mitten im Onboarding. */
        playsInline
        preload={stillHalten ? "none" : "auto"}
      />
    </div>
  );
}
