// Encodes pack_lean.py's PNGs: `base` and `light` lossy (WebP or AVIF), `data` lossless WebP (every byte is a value).
//   node scripts/cuvette/blender/encode.mjs '[{"in": "a.png", "out": "a.avif", "quality": 60, "codec": "avif"} | {"in", "out", "lossless": true}]'
import sharp from "sharp";

const jobs = JSON.parse(process.argv[2]);

const lossy = (image, job) =>
  job.codec === "avif"
    ? image.avif({ quality: job.quality, effort: 6, chromaSubsampling: "4:2:0" })
    : image.webp({ quality: job.quality, smartSubsample: true, effort: 5 });

await Promise.all(jobs.map((job) => (job.lossless ? sharp(job.in).webp({ lossless: true, effort: 6 }) : lossy(sharp(job.in), job)).toFile(job.out)));
