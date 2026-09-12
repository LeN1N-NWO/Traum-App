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

function Page({ page, category, tag, onClose }) {
  const close = () => onClose();
  if (page === "settings") return <Settings onClose={close} />;
  if (page === "avatar" && category) return <AvatarDialog category={category} suggestedName={tag || ""} onClose={close} onCreated={close} />;
  if (page === "avatar") return <AvatarDialog category="me" isMe onClose={close} />;
  if (page === "paywall") return <Paywall reason="browse" onClose={close} />;
  return null;
}

export default function LegacyPage({ page, category, tag, onClose, safeTop = 0, safeBottom = 0, dom }) {
  if (typeof globalThis.__setSafeArea === "function") globalThis.__setSafeArea(safeTop, safeBottom);
  return (
    <AppStateProvider>
      <HashRouter>
        <Page page={page} category={category} tag={tag} onClose={onClose} />
        <ToastBridge />
        <PaywallBridge />
      </HashRouter>
    </AppStateProvider>
  );
}
