import { useEffect, useRef, useState } from "react";
import AlphaVideo from "./AlphaVideo.jsx";
import { mascot } from "../lib/mascots.js";
import "./buttonTap.css";

/* Das Maskottchen greift herein und tippt selbst auf den Knopf.
 *
 * Antons Ansage (25.08.2026): „Das Video soll als Overlay … auf den
 * Erzeuger-Button. Dann tut es so, als würde es auf den Button klicken, und
 * erst dann verschwindet es. Wir können das schon ein bisschen … es gibt
 * eine Verzögerung, das heißt, im Hintergrund ist es schon aktiviert.
 * Dadurch sparen wir auch ein bisschen Zeit und zeigen diese Animationen."
 *
 * ── Die eine Regel, an der alles hängt ───────────────────────────────────
 * ⚠ DIESES BAUTEIL IST NIE EIN TOR. Es liegt über dem Bildschirm und hält
 * nichts auf: Der Auftrag ist schon abgeschickt, bevor das erste Einzelbild
 * läuft. Genau davon lebt Antons Zeitgewinn — die sechs Sekunden sind
 * geschenkte Wartezeit, keine zusätzliche.
 *
 * Wer das umdreht und erst nach dem Video absendet, verschenkt nicht nur
 * die Sekunden. Er baut die Selbstheilung vom 24.08. wieder zu: Eine
 * Ablehnung wegen Inhaltsfilter kommt SCHNELL zurück, und der Mensch säße
 * sechs Sekunden vor einem fröhlichen Frosch, bevor er erfährt, dass sein
 * Traum abgelehnt wurde. Deshalb nimmt der Aufrufer den Einspieler bei
 * einem Fehler sofort weg (Step5Style.jsx).
 *
 * ── Warum der Anker gegen das ECHTE Element rechnet ──────────────────────
 * ⚠ Nicht gegen Bildschirmprozente. Die Animation ist auf 9:16 gezeichnet,
 * kein heutiges Telefon IST 9:16 (iPhone: rund 19,5:9). Auf Prozente gelegt
 * wandert der Funke auf jedem Gerät woanders hin — und daneben zu tippen
 * sieht schlimmer aus als gar nicht zu tippen.
 *
 * Der Aufrufer misst den Knopf im Moment des Drucks und reicht das Rechteck
 * herein. MOMENT DES DRUCKS ist wörtlich: Auf dem Erzeugen-Bildschirm
 * verschwindet der Knopf sofort danach (`if (busy) return …`), ein ref wäre
 * dann schon leer. Ein einmal gemessenes Rechteck kann nicht verschwinden.
 *
 * ── Was hier NICHT steht ─────────────────────────────────────────────────
 * Kein Nachmessen beim Scrollen oder Drehen. Das Rechteck ist in
 * Sichtfenster-Koordinaten (`position: fixed` rechnet genauso), und die
 * sechs Sekunden laufen auf einem Bildschirm, der in dieser Zeit steht.
 * Wer das Bauteil an eine scrollbare Stelle hängt, muss hier nachrüsten. */

/* Sicherheitsnetz. Das `ended`-Ereignis ist der Normalfall, aber es gibt
   Geräte ohne WebGL und WebViews, die das Abspielen verweigern — dort käme
   es NIE, und der Einspieler bliebe für immer stehen. Ein Schmuckstück darf
   den Bildschirm niemals dauerhaft blockieren, auch wenn es ihn gar nicht
   blockieren SOLL: Es läge sichtbar im Weg. */
const NETZ_MS = 1200;

/* `scale` ist ein Prüfstand-Griff, kein Gestaltungsmittel: Der echte Wert
   gehört zum Maskottchen (mascots.js). Er steht hier nur offen, damit die
   Werkbank ihn zur Laufzeit drehen kann, ohne dass jemand eine Zahl in einer
   Bibliotheksdatei ändert und sie dort vergisst. */
export default function ButtonTapOverlay({ rect, mascotId = null, scale = null, onDone }) {
  const m = mascot(mascotId);
  const groesse = scale ?? m.tap.scale;
  const [geo, setGeo] = useState(null);
  const fertigRef = useRef(false);

  /* Einmal auslösen, egal welcher Weg zuerst da ist — Video zu Ende,
     Zeitbremse, oder ein Fingertipp zum Überspringen. */
  const beenden = () => {
    if (fertigRef.current) return;
    fertigRef.current = true;
    onDone?.();
  };

  useEffect(() => {
    if (!rect) return;

    /* Wer Bewegung abgeschaltet hat, bekommt keine — und zwar SOFORT
       weiter, nicht sechs Sekunden Standbild. Dieselbe Regel wie in
       Mascot.jsx und AlphaVideo.jsx, hier aber mit einer Folge: Ohne diesen
       Zweig bliebe das Standbild liegen, weil ein nie gestartetes Video
       auch nie endet. */
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      beenden();
      return;
    }

    const vw = window.innerWidth;
    const w = vw * groesse;
    const h = w * (m.tap.height / m.tap.width);

    setGeo({
      width: w,
      height: h,
      /* Der Anker im Bild landet auf der Mitte des Knopfes. Das ist die
         ganze Rechnung — und der Grund, warum `anchor` in mascots.js pro
         Maskottchen steht und nicht hier. */
      left: rect.left + rect.width / 2 - m.tap.anchor.x * w,
      top: rect.top + rect.height / 2 - m.tap.anchor.y * h,
    });

    const t = setTimeout(beenden, m.tap.seconds * 1000 + NETZ_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, m, groesse]);

  if (!rect || !geo) return null;

  return (
    /* ⚠ `pointer-events` steht auf dem Rahmen auf none und NUR auf der
       Überspringen-Fläche wieder auf auto. Der Rahmen liegt über dem ganzen
       Bildschirm; fängt er Berührungen ab, ist alles darunter tot. */
    <div className="tap-frame" aria-hidden="true">
      <button
        className="tap-skip"
        tabIndex={-1}
        aria-hidden="true"
        onClick={beenden}
      />
      <AlphaVideo
        src={m.tap.src}
        loop={false}
        onEnded={beenden}
        className="tap-clip"
        style={{
          position: "absolute",
          left: `${geo.left}px`,
          top: `${geo.top}px`,
          width: `${geo.width}px`,
          height: `${geo.height}px`,
          /* Das Ausblenden setzt kurz VOR dem letzten Einzelbild an, damit
             der Abgang weich ist statt abgeschnitten — die Länge steht in
             mascots.js, nicht im Stylesheet (siehe buttonTap.css). */
          animationDelay: `${Math.max(0, m.tap.seconds - 0.35)}s`,
        }}
      />
    </div>
  );
}
