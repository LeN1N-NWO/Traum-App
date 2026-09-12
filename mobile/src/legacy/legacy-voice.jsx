"use dom";
/* Das Stimm-Gespräch (Gemini Live) allein — der Web-Baustein VoiceInterview,
 * ohne den Rest des Wizards. Der Traum geht als Text an die native Hülle
 * zurück (onDone), die dann die Lesung macht — derselbe Weg wie im Web
 * (Step1Dream.fromInterview). */
import "./vite-env.js";                       // ⚠ zuerst, siehe dort
import "../../../src/styles/tokens.css";
import "../../../src/styles/base.css";
import "../../../src/styles/sheets.css";
import "../../../src/styles/orbit.css";
import "./legacy.css";
import { HashRouter } from "react-router-dom";
import { AppStateProvider } from "../../../src/state/AppState.jsx";
import { ToastBridge } from "../../../src/App.jsx";
import VoiceInterview from "../../../src/wizard/VoiceInterview.jsx";

export default function LegacyVoice({ onDone, onCancel, safeTop = 0, safeBottom = 0, dom }) {
  if (typeof globalThis.__setSafeArea === "function") globalThis.__setSafeArea(safeTop, safeBottom);
  return (
    <AppStateProvider>
      <HashRouter>
        <VoiceInterview onDone={(p) => onDone(p.text || "")} onCancel={() => onCancel()} />
        <ToastBridge />
      </HashRouter>
    </AppStateProvider>
  );
}
