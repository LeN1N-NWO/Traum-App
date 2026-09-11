/* The native chrome around the web view (11.09.2026).
 *
 * Three things a wrapped web app gets wrong by default, each visible in the
 * first ten seconds on a phone:
 *   · the status bar keeps dark text on our night-blue — clock and battery
 *     all but disappear;
 *   · (the keyboard: see the note below — deliberately left to iOS.)
 *
 * capacitor.config.ts sets the same styles for the moment before this runs.
 * Off the device this does nothing; the plugins' web versions would only
 * throw "not implemented". */
import { Capacitor } from "@capacitor/core";

export async function setupNativeShell() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });   // Dark = light text, for dark backgrounds
  } catch { /* an older shell without the plugin keeps its default */ }
  /* ⚠ KEIN Tastatur-Plugin (11.09. abends). @capacitor/keyboard schneidet den
     WebView über der Tastatur ab, und nach dem Schließen wertet WebKit
     env(safe-area-inset-bottom) nicht neu aus — die Tab-Leiste rutschte in
     die Displayrundung (ionic-team/capacitor #6430). iOS verwaltet die
     Tastatur selbst besser. Dunkle Tastatur und Formularleiste: ADR-0006,
     das ist Sache der nativen Oberfläche. */
}
