"use dom";
/* Das Onboarding als Web-Baustein in der nativen Hülle (13.09.2026 —
 * Antons Wunsch: „ich möchte den Onboarding-Screen jetzt erst mal immer
 * sehen, weil ich in der Entwicklung bin").
 *
 * Warum der Web-Baustein und nicht gleich nativ: Der Ablauf (Plakat-Video,
 * drei Folien, Umfrage, Formular, Selfie) und die Willkommens-Credits
 * hängen an `Onboarding.jsx` samt Zustand; erst wenn Anton durchgegangen
 * ist und gesagt hat, was bleibt, lohnt der native Umbau. Bis dahin ist er
 * hier vollständig bedienbar.
 *
 * Der Ausgang ist EINE Meldung nach nativ (`onDone`) — dieselbe Form wie
 * beim Stimm-Gespräch. Das Consent-Tor läuft nativ darüber (siehe
 * components/consent-gate.tsx), hier also nicht nötig. */
import "./vite-env.js";                       // ⚠ zuerst, siehe dort
import "../../../src/styles/tokens.css";
import "../../../src/styles/base.css";
import "../../../src/styles/sheets.css";
import "../../../src/styles/orbit.css";
import "./legacy.css";
import { HashRouter } from "react-router-dom";
import { AppStateProvider } from "../../../src/state/AppState.jsx";
import { ToastBridge } from "../../../src/App.jsx";
import Onboarding from "../../../src/screens/Onboarding/Onboarding.jsx";

export default function LegacyOnboarding({ onDone, safeTop = 0, safeBottom = 0, dom }) {
  if (typeof globalThis.__setSafeArea === "function") globalThis.__setSafeArea(safeTop, safeBottom);
  return (
    <AppStateProvider>
      <HashRouter>
        <Onboarding onExit={() => onDone()} />
        <ToastBridge />
      </HashRouter>
    </AppStateProvider>
  );
}
