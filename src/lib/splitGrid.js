/* Cuts one wide grid image into equal vertical panels, in the browser.
 *
 * The server has no image decoder — this app is deliberately Vanilla JS with
 * no new native dependency for something the BROWSER already does natively.
 * <canvas> is that decoder, and it is already loaded wherever this runs.
 *
 * Plain exact-thirds cropping, no divider detection: verified against the
 * real API on 09.08.2026 — the model's own divider lines land close enough
 * to exact thirds that a straight crop shows neither a seam nor bleed from
 * the panel next door. See buildGridPrompt() for the prompt that depends on
 * this being true.
 */
export async function splitIntoPanels(url, count) {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const blobs = [];

  // Boundaries computed from 0, not accumulated panel widths — three
  // rounded thirds can otherwise land a pixel short of the image's real
  // width, leaving a sliver of the last panel uncaptured.
  const bounds = Array.from({ length: count + 1 }, (_, i) => Math.round((i * img.naturalWidth) / count));

  for (let i = 0; i < count; i++) {
    const sx = bounds[i];
    const sw = bounds[i + 1] - sx;
    canvas.width = sw;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, sx, 0, sw, img.naturalHeight, 0, 0, sw, img.naturalHeight);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) blobs.push(blob);
  }
  return blobs;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same origin as the app in every shipped configuration (API_BASE only
    // ever points elsewhere for a Capacitor bundle, which has no canvas
    // tainting to begin with — file:// pages have no origin to violate).
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the grid image for splitting."));
    img.src = url;
  });
}
