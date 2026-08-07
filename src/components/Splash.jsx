import { useEffect, useState } from "react";
import { t } from "../i18n/index.js";
import "./Splash.css";

/* Not just decoration: a Capacitor build needs a splash anyway, and it covers
   the localStorage read. */
export default function Splash({ onDone }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setGone(true), 1400);
    const t2 = setTimeout(onDone, 1800);   // remove only after the fade
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={"splash" + (gone ? " splash-gone" : "")}
      role="status"
      aria-label={t.splash.loading}
    >
      <div className="splash-moon" aria-hidden="true" />
      <p className="splash-name">Dream Rushes</p>
    </div>
  );
}
