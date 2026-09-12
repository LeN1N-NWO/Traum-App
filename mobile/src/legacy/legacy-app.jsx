"use dom";
/* Die alte Oberfläche als DOM-Komponente — ein Webview je nativem Tab
 * (ADR-0006, Schritt 3→4). `screen` sagt, welcher Bildschirm hier läuft;
 * die App selbst bleibt der Quelltext aus ../../../src, nichts kopiert.
 *
 * `focusTick` zählt hoch, wenn der native Tab den Fokus bekommt. Jeder
 * Webview hat seinen eigenen Zustand im Speicher, alle teilen denselben
 * localStorage — beim Fokus liest AppState neu ein (Ereignis unten), sonst
 * fehlt im Journal der Traum, der gerade im Traum-Tab entstand. */
import "./vite-env.js";                       // ⚠ zuerst, siehe dort
import "../../../src/styles/tokens.css";
import "../../../src/styles/base.css";
import "../../../src/styles/sheets.css";
import "../../../src/styles/orbit.css";
import "./legacy.css";
import { useEffect, useRef } from "react";
import App from "../../../src/App.jsx";

const ROUTES = { home: "/", journal: "/journal", dream: "/dream", sleep: "/sleep", profile: "/profile" };

export default function LegacyApp({ screen = "home", focusTick = 0 }) {
  // HashRouter liest location.hash beim Aufbau — also vor dem ersten Render setzen.
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    window.location.hash = "#" + (ROUTES[screen] || "/");
  }
  const seen = useRef(focusTick);
  useEffect(() => {
    if (focusTick === seen.current) return;
    seen.current = focusTick;
    window.dispatchEvent(new Event("dreamrushes:reload"));
  }, [focusTick]);
  return <App embedded />;
}
