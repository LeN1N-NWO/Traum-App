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

export default function LegacyOrder({ order, safeTop = 0, safeBottom = 0, dom }) {
  if (typeof globalThis.__setSafeArea === "function") globalThis.__setSafeArea(safeTop, safeBottom);
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    const resume = {
      /* Neue Fassung fuer einen bestehenden Traum (Antons Wunsch 12.09.):
         mit entryId haengt Step5 den Film an den Eintrag, statt einen
         neuen anzulegen — alle Fassungen bleiben. */
      entryId: order.entryId || undefined,
      text: order.text, originalText: order.originalText || order.text, analysis: order.analysis,
      title: order.analysis?.title || "", tagline: order.analysis?.tagline || "", mode: order.mode || "film", urls: [],
      prefill: { styleId: order.styleId, pace: order.pace, videoModel: order.videoModel, quality: order.quality, seconds: order.seconds, step: 5 },
      /* Film: sofort rendern (Preis stand nativ auf dem Knopf). Bilder: die
         Web-Seite von Schritt 5 zeigt Anzahl und Preis, der Mensch drückt. */
      autoRender: (order.mode || "film") === "film", orderId: order.orderId, assignmentOverrides: order.assignmentOverrides || {},
    };
    window.history.replaceState({ usr: { resume } }, "", "#/dream");
  }
  return <App embedded />;
}
