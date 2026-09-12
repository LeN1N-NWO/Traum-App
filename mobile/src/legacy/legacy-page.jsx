"use dom";
/* Einzelne Web-Blätter der alten Oberfläche, allein aufgeschoben: die
 * Einstellungen, der Avatar-Dialog, das Kaufblatt — bis sie nativ sind
 * (ADR-0006, Schritt 4). Mit denselben Brücken wie die App. */
import "./vite-env.js";                       // ⚠ zuerst, siehe dort
import "../../../src/styles/tokens.css";
import "../../../src/styles/base.css";
import "../../../src/styles/sheets.css";
import "../../../src/styles/orbit.css";
import "./legacy.css";
import { HashRouter } from "react-router-dom";
import { AppStateProvider } from "../../../src/state/AppState.jsx";
import { ToastBridge, PaywallBridge } from "../../../src/App.jsx";
import Settings from "../../../src/screens/Profile/Settings.jsx";
import AvatarDialog from "../../../src/components/AvatarDialog.jsx";
import Paywall from "../../../src/screens/Profile/Paywall.jsx";

function Page({ page, onClose }) {
  const close = () => onClose();
  if (page === "settings") return <Settings onClose={close} />;
  if (page === "avatar") return <AvatarDialog category="me" onClose={close} />;
  if (page === "paywall") return <Paywall reason="browse" onClose={close} />;
  return null;
}

export default function LegacyPage({ page, onClose, dom }) {
  return (
    <AppStateProvider>
      <HashRouter>
        <Page page={page} onClose={onClose} />
        <ToastBridge />
        <PaywallBridge />
      </HashRouter>
    </AppStateProvider>
  );
}
