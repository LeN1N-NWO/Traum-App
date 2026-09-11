"use dom";
/* Die alte Oberfläche, komplett, als DOM-Komponente — Schritt 3 des
 * Würgefeigen-Umzugs (ADR-0006): Am ersten Tag läuft die ganze App in der
 * Expo-Hülle, danach wird Bildschirm für Bildschirm nativ ersetzt.
 * Der Quelltext bleibt der aus ../../../src — nichts kopiert. */
import "./vite-env.js";                       // ⚠ zuerst, siehe dort
import "../../../src/styles/tokens.css";
import "../../../src/styles/base.css";
import "../../../src/styles/sheets.css";
import "../../../src/styles/orbit.css";
import App from "../../../src/App.jsx";

export default function LegacyApp() {
  return <App />;
}
