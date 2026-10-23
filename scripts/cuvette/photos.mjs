// Grades the owner's photographs from assets/cuvette/images/<slot>.png into the WebP files the homepage reads,
// and rewrites photos.json to list exactly what was written. Re-run after replacing any source image:
//   node scripts/cuvette/photos.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC = new URL("../../assets/cuvette/images/", import.meta.url).pathname;
const OUT = new URL("../../public/concepts/cuvette/photos/", import.meta.url).pathname;
const SERUMS = ["vitamin-c", "hyaluronic", "niacinamide", "retinal"];

// Vitamin C's hand was generated ~5% smaller and lower than the other three; this crop puts all four at one scale
// so the routine crossfade only changes the serum.
const ALIGN = { "vitamin-c": { left: 85, top: 116, width: 3640, height: 2427 } };

// Lifts the generator's #040405 black to the #0c0d0e panel the fingertips sit in.
const LIFT = [0.968, 8];

function pool(size, cx, cy, edge, inner, radius) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><radialGradient id="g" cx="${cx}" cy="${cy}" r="${radius}">
      <stop offset="0" stop-color="#fff"/><stop offset="${inner}" stop-color="#fff"/><stop offset="1" stop-color="${edge}"/>
    </radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
}

// Clipped white glints read as cling film; everything above the knee rolls off toward ~235.
async function softenHighlights(input, knee = 210, slope = 0.55) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i++) if (data[i] > knee) data[i] = knee + (data[i] - knee) * slope;
  return sharp(data, { raw: info });
}

const written = [];
async function save(image, name) {
  const info = await image.webp({ quality: 82, effort: 6, smartSubsample: true }).toFile(join(OUT, name));
  written.push(name);
  console.log(`${name}  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`);
}

const source = (slot) => (existsSync(join(SRC, `${slot}.png`)) ? join(SRC, `${slot}.png`) : null);

for (const serum of SERUMS) {
  const file = source(`${serum}-fingertips`);
  if (!file) continue;
  const image = ALIGN[serum] ? sharp(file).extract(ALIGN[serum]) : sharp(file);
  await save(image.resize(2400, 1600, { kernel: "lanczos3" }).linear(...LIFT), `${serum}-fingertips.webp`);
}

// One shared pool of light around the fingertip, so the evenly lit skin falls off into the dark reviews panel.
for (const serum of SERUMS) {
  const file = source(`${serum}-skin`);
  if (!file) continue;
  const base = await sharp(file).resize(2400, 2400, { kernel: "lanczos3" }).toBuffer();
  const pooled = await sharp(base).composite([{ input: pool(2400, 0.55, 0.42, "#383838", 0.28, 0.82), blend: "multiply" }]).png().toBuffer();
  await save(await softenHighlights(pooled), `${serum}-skin.webp`);
}

// The generator can't write digits, so its scribble on the vial label is lifted out (ink pixels only, refilled
// with the surrounding paper) and the lot the Porto band names is lettered on in a marker hand.
const LABEL_SCRIBBLE = { x0: 1279, x1: 1400, y0: 1392, y1: 1466 };
const LABEL_LETTERING = { left: 1272, top: 1322 };

async function liftScribble(input, { x0, x1, y0, y1 }, reach = 7) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  const at = (x, y) => (y * info.width + x) * 3;
  const lum = (i) => 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      let brightest = 0;
      for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) brightest = Math.max(brightest, lum(at(x + dx, y + dy)));
      const paper = [0, 0, 0];
      let n = 0;
      for (let dy = -reach; dy <= reach; dy++)
        for (let dx = -reach; dx <= reach; dx++) {
          const j = at(x + dx, y + dy);
          if (lum(j) < brightest - 22) continue;
          for (let c = 0; c < 3; c++) paper[c] += data[j + c];
          n++;
        }
      const i = at(x, y);
      const ink = Math.min(1, Math.max(0, (brightest - lum(i) - 14) / 36));
      for (let c = 0; c < 3; c++) out[i + c] = Math.round(data[i + c] * (1 - ink) + (paper[c] / n - 5) * ink);
    }
  return sharp(out, { raw: info }).png().toBuffer();
}

async function letter(lines) {
  const { chromium } = await import("playwright");
  const font = readFileSync("/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf").toString("base64");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 300, height: 200 } });
  await page.setContent(`<style>
    @font-face { font-family: Hand; src: url(data:font/ttf;base64,${font}); }
    body { margin: 0; background: transparent; }
    div { position: absolute; left: 10px; top: 10px; font-family: Hand; color: #141414; line-height: 1; transform: rotate(-4deg); transform-origin: left top; }
    p { margin: 0; font-size: 40px; } p + p { margin: 6px 0 0 4px; font-size: 27px; }
  </style><div>${lines.map((line) => `<p>${line}</p>`).join("")}</div>`);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 240, height: 130 } });
  await browser.close();
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * 0.86);
  return sharp(data, { raw: info }).blur(0.7).png().toBuffer();
}

// Mirrored so the gloved wrist enters from the page's outer edge instead of being cut by the text column.
const bench = source("porto-bench");
if (bench) {
  const base = await sharp(bench).flop().resize(2560, 2560, { kernel: "lanczos3" }).toBuffer();
  const pooled = await sharp(base).composite([{ input: pool(2560, 0.5, 0.5, "#8a8a8a", 0.38, 0.78), blend: "multiply" }]).png().toBuffer();
  const clean = await liftScribble(pooled, LABEL_SCRIBBLE);
  await save(sharp(clean).composite([{ input: await letter(["2610-09", "09·10·26"]), ...LABEL_LETTERING }]), "porto-bench.webp");
}

writeFileSync(join(OUT, "photos.json"), `${JSON.stringify(written.sort(), null, 2)}\n`);
