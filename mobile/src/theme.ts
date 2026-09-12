/* Die Farben und Schriften der App, nativ — gespiegelt aus src/styles/tokens.css.
   Dieselbe Nacht: kalte Basis, ein warmer Kontrapunkt, selten gesetzt. */
export const colors = {
  bg: "#050a14",
  bg2: "#0c1423",
  sky: "#17263f",
  panel: "rgba(255,255,255,0.055)",
  panelLine: "rgba(255,255,255,0.11)",
  text: "#eaf0fb",
  muted: "#a3b6d2",
  faint: "#8b9eba",
  accent: "#4f9cf9",
  accentSoft: "#8cc0ff",
  accentDeep: "#2a62d0",
  warm: "#f2a765",
  gold: "#f6c65b",
  cyan: "#4fd6e6",
  ok: "#3ddc97",
};
export const fonts = {
  serif: "Iowan Old Style",     // Systemschrift auf iOS; Traumtitel
  sans: undefined as string | undefined,   // System (SF)
};
export const radius = { card: 20, lg: 26 };
/* Die Glas-Tab-Leiste schwebt über dem Inhalt (iOS 26) und lässt sich nicht
   messen (NativeTabs). Jeder scrollende Bildschirm hält unten so viel frei,
   dass sein letzter Knopf über der Leiste steht — Antons Befund 12.09. */
export const TAB_INSET = 112;
