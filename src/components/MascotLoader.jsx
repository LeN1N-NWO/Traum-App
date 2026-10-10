import halo from "../../mobile/assets/galaxy/halo.webp";
import disk from "../../mobile/assets/galaxy/disk.webp";
import spiral from "../../mobile/assets/galaxy/spiral.webp";
import core from "../../mobile/assets/galaxy/core.webp";
import "./mascotLoader.css";

/* Die Ladeanzeige der App — seit 10.10.2026 die Galaxie, nicht mehr der
 * Frosch.
 *
 * Antons Befund 10.10.: „Mein Traum wird generiert, und der Traum-Tab hat
 * noch ein Icon von dem Frosch, den wir ersetzt haben. Nehmen wir das neue
 * Universum für diese Warteschleifen." In der nativen App wartet man
 * schon seit 09.10. vor der Galaxie (mobile/src/components/mascot-loader.tsx);
 * diese Web-Fassung erscheint dort noch, wenn der Bestell-Bildschirm auf
 * die alte Oberfläche zurückfällt (mobile/src/app/dream/order.tsx, `showWeb`).
 *
 * Dieselbe Galaxie wie nativ, aus denselben Bildern (mobile/assets/galaxy,
 * gerendert von scripts/galaxy-art.mjs): ein atmender Halo, die schräg
 * liegende Scheibe (−21°, auf 0,54 geplättet), darin die Spirale, die sich
 * in 14 s einmal dreht (zehnmal so schnell wie hinter dem Aufnahmeknopf —
 * man soll sehen, dass etwas passiert), und der Kern. Bewegt wird nur per
 * CSS-Transform, gezeichnet nichts. Bei „Bewegung reduzieren" steht sie.
 *
 * Maße in Website-Einheiten wie in galaxy-geometry.ts: Bühne 1440 × 850,
 * Mitte (720, 430), Scheibe 1300, Kern 390; `ZOOM` wie nativ (scale 0.7).
 *
 * @param {"page"|"inline"} size  "page" für Wartebildschirme, "inline" für
 *   eine Zeile neben Text. */
const BOX = { page: 180, inline: 56 };
const ZOOM = 0.7;

export default function MascotLoader({ size = "page", className = "" }) {
  const box = BOX[size] ?? BOX.page;
  const s = (box / 820) * ZOOM;
  const c = box / 2;
  const stage = { width: 1440 * s, height: 850 * s, left: c - 720 * s, top: c - 430 * s };
  const d = 1300 * s, k = 390 * s;
  return (
    <div className={`ml-wrap ml-${size} ${className}`.trim()} style={{ width: box, height: box }} aria-hidden="true">
      <img className="ml-layer ml-halo" src={halo} alt="" style={stage} />
      <div className="ml-tilt" style={{ width: d, height: d, left: c - d / 2, top: c - d / 2 }}>
        <div className="ml-spin">
          <img className="ml-layer" src={disk} alt="" />
          <img className="ml-layer" src={spiral} alt="" />
        </div>
        <img className="ml-layer ml-core" src={core} alt="" style={{ width: k, height: k, left: (d - k) / 2, top: (d - k) / 2 }} />
      </div>
    </div>
  );
}
