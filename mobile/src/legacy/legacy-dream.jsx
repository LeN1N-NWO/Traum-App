"use dom";
/* Die Traum-Seite der alten Oberfläche, allein — für die native
 * Journal-Liste, die sie per Stack aufschiebt (ADR-0006, Schritt 4). Die
 * Liste ist schon nativ, die Seite folgt als Nächstes. */
import "./vite-env.js";                       // ⚠ zuerst, siehe dort
import "../../../src/styles/tokens.css";
import "../../../src/styles/base.css";
import "../../../src/styles/sheets.css";
import "../../../src/styles/orbit.css";
import "./legacy.css";
import { HashRouter } from "react-router-dom";
import { AppStateProvider, useAppState } from "../../../src/state/AppState.jsx";
import { ToastBridge, PaywallBridge } from "../../../src/App.jsx";
import JournalDetail from "../../../src/screens/Journal/JournalDetail.jsx";

function Page({ entryId, onClose }) {
  const { state } = useAppState();
  const entry = (state.journal || []).find((e) => e.id === entryId);
  if (!entry) return null;
  return <JournalDetail key={entry.id} entry={entry} onClose={() => onClose()} onOpen={() => {}} />;
}

export default function LegacyDream({ entryId, onClose, dom }) {
  return (
    <AppStateProvider>
      <HashRouter>
        <Page entryId={entryId} onClose={onClose} />
        <ToastBridge />
        <PaywallBridge />
      </HashRouter>
    </AppStateProvider>
  );
}
