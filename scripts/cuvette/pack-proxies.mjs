// Packs a half-size proxy of every sequence frame from the published full frames, and records them in the manifest
// as sequence.proxy. A fast scroll shows them while full frames load; half size keeps about half the type's sharpness,
// where a quarter kept a fifth.
// Run after pack_lean.py (whose `manifest` step rewrites the manifest without them):
//   node scripts/cuvette/pack-proxies.mjs
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const WEB = new URL("../../public/concepts/cuvette/template/", import.meta.url).pathname;
const S = 2;
const GUTTER = 16;
const manifestPath = join(WEB, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const seq = manifest.sequence;
const table = manifest.encoding.tone.table;
const [FW, FH] = seq.size;
const [PW, PH] = [FW / S, FH / S];

// Tone codes are logarithmic: average their light, not their bytes.
const toneByte = (x) => {
  let lo = 0;
  let hi = 255;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid] <= x) lo = mid;
    else hi = mid;
  }
  return x - table[lo] < table[hi] - x ? lo : hi;
};

const raw = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};

const out = (rel) => {
  const path = join(WEB, rel);
  mkdirSync(dirname(path), { recursive: true });
  return path;
};

const name = (frame, ext) => `${String(frame).padStart(seq.path.pad, "0")}.${ext}`;
const items = [];
let bytes = 0;

for (const item of seq.items) {
  const n = String(item.frame).padStart(seq.path.pad, "0");
  const [base, light, data] = await Promise.all([
    raw(join(WEB, seq.path.wide.replace("{frame}", n))),
    raw(join(WEB, seq.path.light.replace("{frame}", n))),
    raw(join(WEB, seq.path.data.replace("{frame}", n))),
  ]);

  const small = Buffer.alloc(PW * PH * 3);
  for (let y = 0; y < PH; y++)
    for (let x = 0; x < PW; x++)
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) sum += table[base.data[((y * S + j) * base.w + x * S + i) * 4 + c]];
        small[(y * PW + x) * 3 + c] = toneByte(sum / (S * S));
      }

  const [rx, ry, rw, rh] = item.rect;
  const [x0, y0] = [Math.floor(rx / S), Math.floor(ry / S)];
  const [w, h] = [Math.ceil((rx + rw) / S) - x0, Math.ceil((ry + rh) / S) - y0];
  const inside = (X, Y) => X >= rx && Y >= ry && X < rx + rw && Y < ry + rh;

  const lightTiles = item.tiles.filter((t) => t.file === "light");
  const dataTiles = item.tiles.filter((t) => t.file === "data");
  const lightAtlas = Buffer.alloc((w + GUTTER) * lightTiles.length * h * 3);
  const LW = (w + GUTTER) * lightTiles.length;
  const tiles = [];
  lightTiles.forEach((t, k) => {
    const coded = !t.channels[0].startsWith("depth");
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let j = 0; j < S; j++)
          for (let i = 0; i < S; i++) {
            const [X, Y] = [(x0 + x) * S + i, (y0 + y) * S + j];
            const b = inside(X, Y) ? light.data[((t.y + Y - ry) * light.w + t.x + X - rx) * 4] : 0;
            sum += coded ? table[b] : b;
          }
        const v = coded ? toneByte(sum / (S * S)) : Math.round(sum / (S * S));
        const at = (y * LW + k * (w + GUTTER) + x) * 3;
        lightAtlas[at] = lightAtlas[at + 1] = lightAtlas[at + 2] = v;
      }
    tiles.push({ file: "light", x: k * (w + GUTTER), y: 0, channels: t.channels });
  });

  // The print's coordinates are split bytes: never averaged, taken from the valid pixel nearest each block's centre.
  const DW = (w + GUTTER) * dataTiles.length;
  const dataAtlas = Buffer.alloc(DW * h * 3);
  const [uv0, uv1] = [dataTiles.find((t) => t.channels[0] === "u.hi"), dataTiles.find((t) => t.channels[0] === "v.lo")];
  const px = (t, X, Y) => (inside(X, Y) ? ((t.y + Y - ry) * data.w + t.x + X - rx) * 4 : -1);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let best = null;
      let bestD = Infinity;
      let cov = 0;
      for (let j = 0; j < S; j++)
        for (let i = 0; i < S; i++) {
          const [X, Y] = [(x0 + x) * S + i, (y0 + y) * S + j];
          const a = px(uv0, X, Y);
          const b = px(uv1, X, Y);
          if (a < 0) continue;
          cov += data.data[b + 1];
          const valid = data.data[a] + data.data[a + 1] + data.data[a + 2] + data.data[b] > 0;
          const d = (i - (S - 1) / 2) ** 2 + (j - (S - 1) / 2) ** 2;
          if (valid && d < bestD) [best, bestD] = [[a, b], d];
        }
      dataTiles.forEach((t, k) => {
        const at = (y * DW + k * (w + GUTTER) + x) * 3;
        if (t === uv1) dataAtlas[at + 1] = Math.round(cov / (S * S));
        if (!best) return;
        const src = t === uv0 ? best[0] : best[1];
        dataAtlas[at] = data.data[src];
        if (t !== uv1) dataAtlas[at + 1] = data.data[src + 1];
        dataAtlas[at + 2] = data.data[src + 2];
      });
    }
  dataTiles.forEach((t, k) => tiles.push({ file: "data", x: k * (w + GUTTER), y: 0, channels: t.channels }));

  const files = {
    base: out(`sequence/proxy/base/${name(item.frame, "avif")}`),
    light: out(`sequence/proxy/light/${name(item.frame, "avif")}`),
    data: out(`sequence/proxy/data/${name(item.frame, "webp")}`),
  };
  await sharp(small, { raw: { width: PW, height: PH, channels: 3 } }).avif({ quality: 62, effort: 7, chromaSubsampling: "4:4:4" }).toFile(files.base);
  await sharp(lightAtlas, { raw: { width: LW, height: h, channels: 3 } }).avif({ quality: 58, effort: 7, chromaSubsampling: "4:2:0" }).toFile(files.light);
  await sharp(dataAtlas, { raw: { width: DW, height: h, channels: 3 } }).webp({ lossless: true, effort: 6 }).toFile(files.data);
  bytes += Object.values(files).reduce((s, f) => s + statSync(f).size, 0);
  items.push({ frame: item.frame, rect: [x0, y0, w, h], tiles: tiles.sort((a, b) => item.tiles.findIndex((t) => t.channels[0] === a.channels[0]) - item.tiles.findIndex((t) => t.channels[0] === b.channels[0])) });
  process.stdout.write(".");
}

seq.proxy = {
  size: [PW, PH],
  path: { base: "sequence/proxy/base/{frame}.avif", light: "sequence/proxy/light/{frame}.avif", data: "sequence/proxy/data/{frame}.webp" },
  bytes,
  items,
};
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + "\n");
console.log(`\n${items.length} proxies, ${(bytes / 1024).toFixed(0)} KB`);
