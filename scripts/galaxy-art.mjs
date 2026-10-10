#!/usr/bin/env node
/* Rendert die stillen Ebenen der Galaxie als Bilder (10.10.2026, Antons
 * Befund „kleiner Lag beim ersten Öffnen des Traum-Tabs").
 *
 * Warum Bilder: react-native-svg zeichnet auf der CPU, im Hauptthread. Die
 * Spirale — 63 Fäden mit Farbverlauf, 180 Sterne, eine Scheibe im Verlauf,
 * auf einer Fläche von gut 2400 × 2400 Pixeln — kostete beim ersten
 * Erscheinen eine knappe halbe Sekunde, in der die App stand. Ein Bild
 * dekodiert iOS im Hintergrund, gedreht und überblendet wird es auf der
 * Grafikkarte.
 *
 * Quelle der Formen: mobile/src/lib/galaxy-geometry.ts (dieselbe Datei
 * nutzt die App für die bewegten Sterne). Gerendert wird in einem
 * Chromium-Browser — dessen SVG-Zeichnung ist die der Website.
 *
 * Ablauf:
 *     node scripts/galaxy-art.mjs
 *   → öffnet einen kleinen Server und nennt die Adresse; die Seite in
 *     Chrome/Chromium öffnen. Sie zeichnet die vier Bilder und schickt sie
 *     zurück; das Skript schreibt sie nach mobile/assets/galaxy/ und endet.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { coreSvg, diskSvg, haloSvg, spiralSvg } from "../mobile/src/lib/galaxy-geometry.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "mobile/assets/galaxy");
mkdirSync(out, { recursive: true });

/* Pixelmaße: Die Spirale steht auf dem größten iPhone ~870 pt breit — 2400 px
   sind dort gut 2,7-fach, die feinen Fäden bleiben scharf. Scheibe, Halo und
   Kern sind weiche Verläufe; die dürfen klein sein und werden hochskaliert.
   Format: WebP verlustfrei (Chromium schreibt bei Qualität 1 verlustfrei) —
   die Spirale als PNG wäre 2–6 MB, als WebP ~1 MB, mit Palette sähe man
   Ringe im Verlauf. */
const ART = [
  { name: "spiral", svg: spiralSvg(), w: 2400, h: 2400 },
  { name: "disk", svg: diskSvg(), w: 520, h: 520 },
  { name: "halo", svg: haloSvg(), w: 720, h: 425 },
  { name: "core", svg: coreSvg(), w: 390, h: 390 },
];

const page = `<!doctype html><meta charset="utf-8"><title>galaxy-art</title>
<body style="background:#0b1324;color:#ccd;font:14px system-ui">
<p id="s">rendering…</p>
<script>
const ART = ${JSON.stringify(ART)};
(async () => {
  for (const a of ART) {
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(a.svg);
    await img.decode();
    const c = document.createElement("canvas");
    c.width = a.w; c.height = a.h;
    c.getContext("2d").drawImage(img, 0, 0, a.w, a.h);
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", 1));
    await fetch("/save?name=" + a.name, { method: "POST", body: blob });
    document.getElementById("s").textContent += " " + a.name + " ✓";
  }
  document.getElementById("s").textContent += " — fertig.";
})();
</script>`;

let left = ART.length;
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page);
    return;
  }
  if (req.method === "POST" && url.pathname === "/save") {
    const name = url.searchParams.get("name");
    if (!ART.some((a) => a.name === name)) { res.writeHead(400).end(); return; }
    const parts = [];
    req.on("data", (c) => parts.push(c));
    req.on("end", () => {
      const file = join(out, `${name}.webp`);
      writeFileSync(file, Buffer.concat(parts));
      /* Chromium packt verlustfrei, aber locker (Spirale 2,3 MB). Ist Python
         mit Pillow da, packt es dieselben Pixel enger (≈ 1 MB) — sonst
         bleibt die Datei, wie sie ist. */
      spawnSync("python3", ["-c", "import sys; from PIL import Image; f=sys.argv[1]; Image.open(f).save(f, lossless=True, quality=100, method=6)", file]);
      console.log(`✓ ${file} (${Math.round(statSync(file).size / 1024)} KB)`);
      res.writeHead(204).end();
      if (--left === 0) { console.log("fertig."); server.close(); }
    });
    return;
  }
  res.writeHead(404).end();
});
server.listen(Number(process.env.PORT) || 8732, "127.0.0.1", () => {
  console.log(`Im Browser öffnen: http://127.0.0.1:${server.address().port}/`);
});
