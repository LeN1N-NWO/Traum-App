/* Der Abspann, den ein geteilter Film bekommt.
 *
 * Anton, 16.08.2026: kein Wasserzeichen. Ein Aufdruck liegt über dem Traum
 * und macht ihn zum Werbeträger; ein Abspann steht DANACH und lässt das Bild
 * in Ruhe. Für ein Format, das auf TikTok und in Reels landet, ist das auch
 * die stärkere Variante — die letzten zwei Sekunden sind die, in denen jemand
 * überlegt, wo das herkommt.
 *
 * Gezeichnet wird hier im Browser, zusammengefügt auf dem Server. Der Grund
 * ist die Schrift: `var(--serif)` und die Palette existieren genau hier, und
 * ffmpegs `drawtext` bräuchte auf jedem Server eine Schriftdatei, die dort
 * vielleicht nicht liegt. So kennt der Server nur Pixel.
 *
 * Das Motiv ist bewusst dasselbe wie beim App-Start (Splash.jsx): Mond,
 * Wortmarke, sonst nichts. Womit die App aufgeht, damit geht der Film zu.
 */

const CARD_MS = 2000;

/** Liest einen Gestaltungswert aus den Tokens, statt ihn hier zu wiederholen. */
function token(name, fallback) {
  if (typeof getComputedStyle === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * @param {number} width  Bildbreite des Films — die Karte muss exakt passen,
 *                        sonst skaliert ffmpeg und der Text wird weich.
 * @param {number} height
 * @returns {Promise<Blob>} PNG
 */
export async function buildEndCard(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bg = token("--bg", "#050a14");
  const sky = token("--sky", "#17263f");
  const text = token("--text", "#e8edf5");
  const warm = token("--warm", "#f2a765");

  // Grund: derselbe Nachthimmel wie in der App, von oben herabfallend.
  const ground = ctx.createRadialGradient(
    width / 2, -height * 0.12, 0,
    width / 2, -height * 0.12, height * 0.95,
  );
  ground.addColorStop(0, sky);
  ground.addColorStop(1, bg);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, width, height);

  // Der Mond — das eine warme Element der App, hier als Lichtquelle.
  /* Mond bei 40 %, Wortmarke bei 56 % — die Gruppe sitzt also im oberen
     Zweidrittel, nicht in der Mitte. Das ist Absicht und keine schiefe
     Komposition: Auf TikTok und in Reels liegen Bildunterschrift und
     Bedienelemente ueber dem unteren Bildviertel. Was dort steht, sieht
     niemand. */
  const r = Math.min(width, height) * 0.075;
  const cx = width / 2;
  const cy = height * 0.40;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 5);
  halo.addColorStop(0, "rgba(242,167,101,0.30)");
  halo.addColorStop(1, "rgba(242,167,101,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 5, 0, Math.PI * 2);
  ctx.fill();

  const face = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  face.addColorStop(0, "#ffffff");
  face.addColorStop(0.28, "#ffe9cf");
  face.addColorStop(0.72, warm);
  face.addColorStop(1, "#b2542a");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  /* Schrift erst benutzen, wenn sie geladen ist. Ohne dieses Warten zeichnet
     Canvas stillschweigend in der Ersatzschrift — kein Fehler, nur ein
     falsches Bild, und das fällt erst im fertigen Video auf. */
  if (document.fonts?.ready) await document.fonts.ready;

  const serif = token("--serif", "Georgia, serif");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = text;
  ctx.font = `${Math.round(height * 0.042)}px ${serif}`;
  ctx.fillText("Dream Rushes", cx, height * 0.56);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not draw the end card."))),
      "image/png",
    );
  });
}

export const END_CARD_MS = CARD_MS;
