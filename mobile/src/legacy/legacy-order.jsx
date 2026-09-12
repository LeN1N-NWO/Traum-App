"use dom";
/* Der Web-Motor des Wizards (12.09.2026, ADR-0006): Die nativen Schritte
 * haben Text, Analyse, Stil, Tempo, Modell, Qualität und Länge gesammelt
 * und den Preis bestätigt. Hier läuft nur noch der Auftrag — die alte App
 * mit `resume` im Router-Zustand, WizardShell springt an Schritt 5 und
 * Step5Style startet genau einmal (autoRender + orderId). Danach zeigt
 * Schritt 6 das Warten und legt den Traum ins Journal — unverändert. */
import "./vite-env.js";                       // ⚠ zuerst, siehe dort
import "../../../src/styles/tokens.css";
import "../../../src/styles/base.css";
import "../../../src/styles/sheets.css";
import "../../../src/styles/orbit.css";
import "./legacy.css";
import { useRef } from "react";
import App from "../../../src/App.jsx";

export default function LegacyOrder({ order, dom }) {
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    const resume = {
      text: order.text, originalText: order.originalText || order.text, analysis: order.analysis,
      title: order.analysis?.title || "", tagline: order.analysis?.tagline || "", mode: "film", urls: [],
      prefill: { styleId: order.styleId, pace: order.pace, videoModel: order.videoModel, quality: order.quality, seconds: order.seconds, step: 5 },
      autoRender: true, orderId: order.orderId,
    };
    window.history.replaceState({ usr: { resume } }, "", "#/dream");
  }
  return <App embedded />;
}
