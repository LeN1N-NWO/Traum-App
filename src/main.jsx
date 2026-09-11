import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/sheets.css";
import "./styles/orbit.css";
import App from "./App.jsx";
import { installHaptics } from "./lib/haptics.js";
import { setupNativeShell } from "./lib/nativeShell.js";

/* WebKit only applies :active on touch when someone listens for touchstart.
   Without this empty listener the pressed state in base.css never shows on
   the phone — only with a mouse. */
document.addEventListener("touchstart", () => {}, { passive: true });
installHaptics();
setupNativeShell();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
