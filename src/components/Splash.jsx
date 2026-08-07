import { useEffect, useState } from "react";
import "./Splash.css";

/* Nicht nur Deko: beim Capacitor-Build ist ein Splash ohnehin Pflicht, und er
   überdeckt das Laden des localStorage. */
export default function Splash({ onFertig }) {
  const [weg, setWeg] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setWeg(true), 1400);
    const t2 = setTimeout(onFertig, 1800);   // erst nach dem Ausblenden entfernen
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFertig]);

  return (
    <div
      className={"splash" + (weg ? " splash-weg" : "")}
      role="status"
      aria-label="Dream Rushes wird geladen"
    >
      <div className="splash-mond" aria-hidden="true" />
      <p className="splash-name">Dream Rushes</p>
    </div>
  );
}
