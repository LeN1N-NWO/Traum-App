/* The native chrome around the web view (11.09.2026).
 *
 * Three things a wrapped web app gets wrong by default, each visible in the
 * first ten seconds on a phone:
 *   · the status bar keeps dark text on our night-blue — clock and battery
 *     all but disappear;
 *   · the keyboard is the light one over a dark screen;
 *   · above the keyboard sits WebKit's form bar (↑ ↓ Done), which no native
 *     app has — the clearest "this is a website" tell there is.
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
  try {
    const { Keyboard, KeyboardStyle } = await import("@capacitor/keyboard");
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
    await Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch { /* same */ }
}
