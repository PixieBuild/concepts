// Bakes the catalogue's stills with the site's own compositor, for search, Open Graph and no-JS visitors.
//   npm run dev, then: node scripts/cuvette/bake-stills.mjs [--url http://localhost:3000] [--only label,pack]
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TEMPLATE = path.join(ROOT, "public/concepts/cuvette/template");
const OUT = path.join(ROOT, "public/concepts/cuvette/stills");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const URL = arg("url", "http://localhost:3000");
const ONLY = arg("only", "").split(",").filter(Boolean);

// Synthetic defocus on fine print reads as a smudge past a few pixels, so these stills hold the ink nearer focus.
const INK_COC = { label: 0.4 };

const manifest = JSON.parse(fs.readFileSync(path.join(TEMPLATE, "manifest.json"), "utf8"));
const stills = manifest.stills ?? {};
const has = (name) => name in stills;
const sequence = manifest.sequence?.items?.length ? manifest.sequence : null;
const still = (name) => ({ kind: "still", name });
const opening = (compact) => ({ kind: "sequence", chapter: 0, compact });

/** A fractional crop [x, y, w, h], then an optional size. */
async function finish(png, { crop, width, aspect } = {}) {
  let img = sharp(png);
  const { width: W, height: H } = await img.metadata();
  if (crop) {
    img = sharp(await img.extract({ left: Math.round(crop[0] * W), top: Math.round(crop[1] * H), width: Math.round(crop[2] * W), height: Math.round(crop[3] * H) }).toBuffer());
  } else if (aspect) {
    const w = Math.min(W, Math.round(H * aspect));
    const h = Math.min(H, Math.round(W / aspect));
    img = sharp(await img.extract({ left: Math.round((W - w) / 2), top: Math.round((H - h) / 2), width: w, height: h }).toBuffer());
  }
  if (width) img = img.resize(width);
  return img;
}

/** Each still to bake: the subject and shot it is filed under, where it comes from, and the bottles in it. */
function jobs(serums) {
  const list = [];
  const pack = has("pack") ? "pack" : has("three-quarter") ? "three-quarter" : null;
  for (const slug of serums) {
    const looks = [slug];
    if (sequence) {
      list.push({ key: `${slug}-poster-wide`, source: opening(false), looks });
      list.push({ key: `${slug}-poster-tall`, source: opening(true), looks });
      list.push({ key: `${slug}-hero-tall`, source: opening(true), looks });
    }
    if (has("hero-wide")) list.push({ key: `${slug}-hero-wide`, source: still("hero-wide"), looks, post: { aspect: 16 / 9 } });
    else if (sequence) list.push({ key: `${slug}-hero-wide`, source: opening(false), looks, post: { aspect: 16 / 9 } });
    if (pack) {
      list.push({ key: `${slug}-pack`, source: still(pack), looks });
      list.push({ key: `${slug}-thumb`, source: still(pack), looks, shot: "thumb", post: { width: 400 } });
    }
    // Only when it differs from the packshot, so a product page never shows the same picture twice.
    if (has("three-quarter") && pack !== "three-quarter") list.push({ key: `${slug}-three-quarter`, source: still("three-quarter"), looks });
    if (has("label")) list.push({ key: `${slug}-label`, source: still("label"), looks });
    if (has("drop")) list.push({ key: `${slug}-drop`, source: still("drop"), looks });
    if (has("drop-stone")) list.push({ key: `${slug}-drop-stone`, source: still("drop-stone"), looks });
  }
  const pair = Object.keys(stills).find((n) => stills[n].owners === 2);
  const set = ["vitamin-c", "hyaluronic"];
  if (pair) {
    list.push({ key: "morning-set-pack", source: still(pair), looks: set });
    list.push({ key: "morning-set-thumb", source: still(pair), looks: set, post: { aspect: 1, width: 400 } });
  } else if (has("group")) {
    // No two-bottle render yet: the group's left two bottles, cropped at the gap before the third.
    list.push({ key: "morning-set-pack", source: still("group"), looks: [...set, "niacinamide"], post: { crop: [0.02, 0.19, 0.635, 0.635] } });
    list.push({ key: "morning-set-thumb", source: still("group"), looks: [...set, "niacinamide"], post: { crop: [0, 0.255, 0.655, 0.524], width: 400 } });
  }
  if (has("group")) list.push({ key: "range-group", source: still("group"), looks: ["vitamin-c", "hyaluronic", "niacinamide"] });
  if (has("group-wide")) list.push({ key: "range-group-wide", source: still("group-wide"), looks: ["vitamin-c", "hyaluronic", "niacinamide"] });
  return list;
}

const browser = await chromium.launch({ headless: true, channel: "chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function bakePage(cocScale = 1) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page:", e.message));
  if (cocScale !== 1) {
    await page.route("**/template/manifest.json*", async (route) => {
      const res = await route.fetch();
      const m = await res.json();
      m.encoding.coc.perByte *= cocScale;
      await route.fulfill({ response: res, json: m });
    });
  }
  await page.goto(`${URL}/cuvette/render?bake`, { waitUntil: "networkidle", timeout: 180000 });
  await page.waitForFunction(() => window.__bottle, null, { timeout: 120000 });
  return page;
}

const pages = new Map();
const pageFor = async (source) => {
  const scale = (source.kind === "still" && INK_COC[source.name]) || 1;
  if (!pages.has(scale)) pages.set(scale, await bakePage(scale));
  return pages.get(scale);
};

const slugs = await (await pageFor({ kind: "sequence" })).evaluate(() => window.__bottle.slugs);
const list = jobs(slugs.filter((s) => s !== "morning-set")).filter((job) => !ONLY.length || ONLY.some((o) => job.key.endsWith(`-${o}`)));

fs.mkdirSync(OUT, { recursive: true });
const MANIFEST = path.join(OUT, "stills.json");
const previous = ONLY.length && fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const made = {};
for (const job of list) {
  const page = await pageFor(job.source);
  const { png, ms } = await page.evaluate(
    ({ source, looks, shot }) => window.__bottle.composite({ source, shot, looks: looks.map((s) => window.__bottle.looksOf(s)[0]) }),
    job,
  );
  const img = await finish(Buffer.from(png.split(",")[1], "base64"), job.post);
  const jpeg = await img.jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
  // Named by content, so a re-bake is never served from a browser, CDN or image-optimiser cache of the last one.
  const name = `${job.key}.${crypto.createHash("sha1").update(jpeg).digest("hex").slice(0, 10)}.jpg`;
  fs.writeFileSync(path.join(OUT, name), jpeg);
  const { width, height } = await sharp(jpeg).metadata();
  const blur = await sharp(jpeg).resize(16).jpeg({ quality: 60 }).toBuffer();
  made[job.key] = { src: `/concepts/cuvette/stills/${name}`, width, height, blurDataURL: `data:image/jpeg;base64,${blur.toString("base64")}` };
  console.log(`${name} ${width}x${height} ${Math.round(jpeg.length / 1024)}KB (${ms} ms)`);
}
await browser.close();
Object.assign(previous, made);
const kept = new Set(Object.values(previous).map((m) => path.basename(m.src)));
for (const file of fs.readdirSync(OUT)) {
  if (file.endsWith(".jpg") && !kept.has(file)) fs.unlinkSync(path.join(OUT, file));
}
const sorted = Object.fromEntries(Object.keys(previous).sort().map((k) => [k, previous[k]]));
fs.writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 1)}\n`);
// The dev image optimiser keys its cache by URL; drop it so no page keeps a stale size of an earlier bake.
for (const dir of [".next/dev/cache/images", ".next/cache/images"]) fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
console.log(`${Object.keys(made).length} baked, ${Object.keys(previous).length} stills`);
