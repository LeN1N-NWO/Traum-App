/* Die 19 Stil-Vorschauen, nativ gebündelt (13.09.2026).
 *
 * Die Brücke liefert Clip-Adressen als URL auf den Server
 * (`API_BASE + /clips/style-<id>.mp4`, aus presets.js). Für die native
 * Hülle liegen dieselben Dateien im Bündel — `public/clips/style-*.mp4`
 * ist versioniert (Ausnahme in .gitignore) — und `require` gibt Metro
 * die Datei mit. So laufen die Kacheln ohne Server, ohne Netz und im
 * Produktionsbau; der Server-Weg bleibt der Rückfall für alles, was hier
 * nicht steht (Beispielbilder, spätere Clips).
 *
 * ⚠ Ein neuer Stil braucht eine Zeile hier — `require` kann keinen Pfad
 * zur Laufzeit bauen. Wer das vergisst, sieht die Kachel trotzdem, nur
 * über den Server. */
const STYLE_CLIPS: Record<string, number> = {
  ultrareal: require("../../../public/clips/style-ultrareal.mp4"),
  noir: require("../../../public/clips/style-noir.mp4"),
  dreamlike: require("../../../public/clips/style-dreamlike.mp4"),
  romantic: require("../../../public/clips/style-romantic.mp4"),
  dark: require("../../../public/clips/style-dark.mp4"),
  surreal: require("../../../public/clips/style-surreal.mp4"),
  nostalgic: require("../../../public/clips/style-nostalgic.mp4"),
  adventurous: require("../../../public/clips/style-adventurous.mp4"),
  ink: require("../../../public/clips/style-ink.mp4"),
  clay: require("../../../public/clips/style-clay.mp4"),
  goldenage: require("../../../public/clips/style-goldenage.mp4"),
  fantasyanime: require("../../../public/clips/style-fantasyanime.mp4"),
  oilpaint: require("../../../public/clips/style-oilpaint.mp4"),
  marker: require("../../../public/clips/style-marker.mp4"),
  actionfigure: require("../../../public/clips/style-actionfigure.mp4"),
  marionette: require("../../../public/clips/style-marionette.mp4"),
  papercut: require("../../../public/clips/style-papercut.mp4"),
  papiermache: require("../../../public/clips/style-papiermache.mp4"),
  screenprint: require("../../../public/clips/style-screenprint.mp4"),
  /* Kein Stil, sondern Antons Spot fürs Zwischenbild „Die Menschen darin
     sind deine" (15 s, 9:16, 720p) — derselbe Weg ins Bündel. */
  "showcase-faces": require("../../../public/clips/showcase-faces.mp4"),
};

/** Die Quelle für expo-video: das gebündelte Modul, wenn die Adresse einen
 *  Stil-Clip meint, sonst die Adresse selbst. */
export function clipSource(url: string): number | string {
  const m = /\/clips\/(style-([a-z]+)|showcase-[a-z]+)\.mp4$/.exec(url);
  return (m && (STYLE_CLIPS[m[2]] ?? STYLE_CLIPS[m[1]])) ?? url;
}
