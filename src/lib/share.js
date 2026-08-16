/* Sharing a dream to Instagram, TikTok or anywhere else.
 *
 * Deliberately the Web Share API and nothing else. It opens the device's own
 * share sheet, which already knows every installed app — no API key, no OAuth,
 * no per-platform developer account, no review process, and it works inside a
 * Capacitor build. Wiring up Instagram's and TikTok's own APIs would mean all
 * of that overhead for the same end result.
 *
 * Trade-off worth knowing: we cannot choose the target app or pre-select
 * "story vs post" — the share sheet does. What we CAN control is the aspect
 * ratio at generation time, which is why 9:16 is the default.
 */

import { mediaUrl, filmWithOutro, uploadPanel } from "./api.js";
import { buildEndCard } from "./endCard.js";

export function canShareFiles() {
  return typeof navigator !== "undefined" &&
         typeof navigator.canShare === "function" &&
         typeof navigator.share === "function";
}

/** Fetch the rendered media so it can be shared as an actual file. */
async function toFiles(urls, title) {
  const files = [];
  for (let i = 0; i < urls.length; i++) {
    const res = await fetch(mediaUrl(urls[i]));
    if (!res.ok) throw new Error(`Could not fetch image ${i + 1}.`);
    const blob = await res.blob();
    const ext = blob.type.includes("video") ? "mp4" : "png";
    files.push(new File([blob], `${title}-${i + 1}.${ext}`, { type: blob.type }));
  }
  return files;
}

/**
 * @returns {"shared"|"unsupported"|"cancelled"}
 * Cancelling the native sheet is a normal outcome, not an error — it must not
 * surface as a failure toast.
 */

/* Jeder geteilte Film bekommt einen Abspann — Bilder nicht, die haben kein
 * Ende, an das man etwas haengen koennte.
 *
 * Faellt still auf den Originalfilm zurueck, wenn irgendetwas daran scheitert:
 * ffmpeg fehlt auf dem Server (501), die Masse sind nicht lesbar, das Netz ist
 * weg. Ein Abspann ist eine Nettigkeit — an ihr darf das Teilen nicht
 * scheitern, und ein Fehlerhinweis fuer etwas, das der Mensch nie angefordert
 * hat, waere schlicht verwirrend.
 */
async function addOutro(url) {
  if (!/\.mp4$/i.test(url)) return url;
  try {
    const { width, height } = await filmSize(mediaUrl(url));
    if (!width || !height) return url;
    const card = await uploadPanel(await buildEndCard(width, height));
    return await filmWithOutro(url, card);
  } catch {
    return url;
  }
}

/** Die Masse des Films, aus dem Video-Element — der Abspann muss exakt
 *  passen, sonst skaliert ffmpeg und die Schrift wird weich. */
function filmSize(src) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve({ width: v.videoWidth, height: v.videoHeight });
    v.onerror = () => resolve({});
    v.src = src;
  });
}

export async function shareDream({ urls, title, text }) {
  if (!canShareFiles() || !urls?.length) return "unsupported";
  const withOutro = await Promise.all(urls.map(addOutro));
  const files = await toFiles(withOutro, (title || "dream").replace(/[^a-z0-9]+/gi, "-").toLowerCase());
  if (!navigator.canShare({ files })) return "unsupported";
  try {
    await navigator.share({ files, title, text });
    return "shared";
  } catch (err) {
    if (err?.name === "AbortError") return "cancelled";
    throw err;
  }
}

/** Fallback where sharing files is unavailable: save them to the device. */
export function downloadAll(urls, title) {
  const base = (title || "dream").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  urls.forEach((url, i) => {
    const a = document.createElement("a");
    a.href = mediaUrl(url);
    a.download = `${base}-${i + 1}`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}
