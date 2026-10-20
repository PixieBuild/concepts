"""Packs raw template renders into the web compositor's lean format (manifest version 2). Runs on Blender's bundled
Python (numpy + OpenImageIO), outside Blender, so it can pack while Blender renders the next frame:

  PY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
  $PY scripts/cuvette/blender/pack_lean.py sequence --raw assets/cuvette/v3/seq/raw --packed assets/cuvette/v3/seq/packed-avif \
      --web public/concepts/cuvette/template [--watch 90]
  $PY scripts/cuvette/blender/pack_lean.py still --exr assets/cuvette/stills/raw/drop-macro --name drop --web ...
  $PY scripts/cuvette/blender/pack_lean.py manifest --web public/concepts/cuvette/template --seq-packed assets/cuvette/v3/seq/packed-avif

Per picture there are three files:
  base   RGB, lossy (WebP or AVIF): the shot with every serum absorbing all light and no print, tone-coded
         (manifest.encoding.tone)
  light  grey, lossy: tiles cut to the rect around the bottle(s) holding the serum light and optical path per bottle,
         the light on the print and the glass's front reflection
  data   RGB, lossless WebP: the print's coordinates and, for lens or group shots, the circle of confusion and which
         bottle owns each pixel
The manifest's tiles list each tile's file, position and channel names.
"""

import argparse
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from cuvette.pack import blur, circle_of_confusion, dilate, down2, read_layers, serum_light, write_png  # noqa: E402

HERE = Path(__file__).resolve().parent
CAMERAS = json.loads((HERE / "cameras.json").read_text())
LO, HI = -12.47393, 4.026069
DMAX = 12.0
COC_PER_BYTE = 0.25
OWNER_STEP = 85
COMPACT_ASPECT = 0.8
# A light byte (tone code) below which a pixel's serum light is invisible, and its optical path irrelevant.
DEPTH_LIT = 12
VERSION = 2


def agx_poly(t):
    t2 = t * t
    t4 = t2 * t2
    return 15.5 * t4 * t2 - 40.14 * t4 * t + 31.96 * t4 - 6.868 * t2 * t + 0.4298 * t2 + 0.1191 * t - 0.00232


# The tone code follows the display curve (AgX's log2 range and sigmoid) so 8 bits sit where the eye resolves steps,
# with a quarter of plain log mixed in to keep some precision in the toe. The decode table is in the manifest.
_T = np.linspace(0.0, 1.0, 8193)
_C = agx_poly(_T)
_C = (_C - _C[0]) / (_C[-1] - _C[0])
_E = np.maximum.accumulate(0.75 * _C + 0.25 * _T)
_E = (_E - _E[0]) / (_E[-1] - _E[0])


def tone_table():
    t = np.interp(np.arange(256) / 255.0, _E, _T)
    x = np.exp2(LO + t * (HI - LO))
    x[0] = 0.0
    return [float(f"{v:.6g}") for v in x]


def tone(x):
    t = np.clip((np.log2(np.maximum(x, 1e-12)) - LO) / (HI - LO), 0.0, 1.0)
    return np.interp(t, _T, _E)


def bytes8(e, rng=None):
    """Quantises 0..1 to a byte, dithered when `rng` is given so smooth gradients never band."""
    v = np.clip(e, 0.0, 1.0) * 255.0
    v = np.floor(v + rng.random(v.shape)) if rng is not None else np.round(v)
    return np.clip(v, 0, 255).astype(np.uint8)


def split16(e):
    q = np.clip(np.round(np.clip(e, 0.0, 1.0) * 65535.0), 0, 65535).astype(np.uint32)
    return (q >> 8).astype(np.uint8), (q & 255).astype(np.uint8)


def calm(value, cov):
    """Coverage-weighted 3x3 mean inside the print: the coordinates are smooth, the sub-pixel jitter is not."""
    w = (cov > 0.99).astype(np.float32)
    acc = np.zeros_like(value)
    wt = np.zeros_like(value)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            acc += np.roll(np.roll(value * w, dy, 0), dx, 1)
            wt += np.roll(np.roll(w, dy, 0), dx, 1)
    return np.where(w > 0, acc / np.maximum(wt, 1e-6), value)


def planes(exrs, uv_exr, lens, owners):
    """Every plane at 1x, as floats (tone-coded later)."""
    L = {}
    for exr in exrs:
        L.update(read_layers(exr))
    U = read_layers(uv_exr)
    dark, I, D = serum_light(L, owners)
    h, w = dark.shape[:2]

    cov2 = np.clip(U["uv.luv.B"], 0.0, 1.0)
    mean = lambda a: down2(a)[:h, :w]
    c = mean(cov2)
    safe = np.maximum(c, 1e-6)
    has = c > 1e-3
    u = np.where(has, np.clip(mean(U["uv.luv.R"]) / safe, 0, 1), 0.0)
    v = np.where(has, np.clip(mean(U["uv.luv.G"]) / safe, 0, 1), 0.0)
    nv = np.where(has, np.clip(mean(U["uv.nv.X"]) / safe, 0, 1), 0.0)
    z = np.where(has, mean(U["uv.z.X"]) / safe, 0.0)
    owner = np.where(has, np.clip(np.round(mean(U["uv.owner.X"]) / safe), 0, 3), 0.0)
    u, v = calm(u, c), calm(v, c)
    # Edge pixels carry the print's own coordinates, extended a few pixels past it, so bilinear reads stay on the print.
    u, v, nv = dilate(u, c, 4), dilate(v, c, 4), dilate(nv, c, 4)
    owner = np.round(dilate(owner, c, 4))
    coc = dilate(np.where(has, circle_of_confusion(z, lens), 0.0), c, 12)

    near = blur((c > 0).astype(np.float32), 4) > 0
    shade = np.where(near, dilate(L["label.Combined.G"], c), 0.0)
    front = np.where(near, L["front.Combined.G"], 0.0)
    return {"dark": dark, "I": I, "D": D, "u": u, "v": v, "cov": c, "nv": nv, "owner": owner, "coc": coc, "shade": shade, "front": front}


def layout(owners, dof):
    """Lossless RGB tiles (`data`): coordinates and per-pixel ids. Lossy grey tiles (`light`): every light value."""
    data = [["u.hi", "u.lo", "v.hi"], ["v.lo", "cov", "nv"]]
    if dof or owners > 1:
        data.append(["coc", "owner", "-"])
    light = ["shade", "front"] + [n for k in range(1, owners + 1) for n in (f"light.{k}", f"depth.{k}")]
    return data, light


def rect_of(P, margin=10):
    h, w = P["cov"].shape
    mask = (P["cov"] > 0) | (P["I"].max(axis=-1) > 0) | (P["shade"] > 0)
    mask = blur(mask.astype(np.float32), 3) > 0
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return [0, 0, 2, 2]
    x0, x1 = max(0, xs.min() - margin) // 2 * 2, min(w, xs.max() + 1 + margin)
    y0, y1 = max(0, ys.min() - margin) // 2 * 2, min(h, ys.max() + 1 + margin)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def unlit_filled(depth, light):
    """Optical path only matters where light crosses the serum: elsewhere it is path-tracing noise that costs bytes, so
    it is replaced by a wide blur of the lit values around it."""
    lit = blur((tone(light) * 255.0 > DEPTH_LIT).astype(np.float32), 2) > 0
    w = lit.astype(np.float32)
    fill = blur(depth * w, 12) / np.maximum(blur(w, 12), 1e-6)
    return np.where(lit, depth, fill)


def channels(P, rng, lo_bits=8):
    ch = {"-": np.zeros_like(P["cov"], dtype=np.uint8)}
    ch["u.hi"], ch["u.lo"] = split16(P["u"])
    ch["v.hi"], ch["v.lo"] = split16(P["v"])
    # The low bytes are near-random to a lossless codec; their last bits sit far below a printed glyph's edge.
    keep = (0xFF << (8 - lo_bits)) & 0xFF
    half = (1 << (8 - lo_bits)) >> 1
    for name in ("u.lo", "v.lo"):
        ch[name] = np.where(ch[name] > 0, (ch[name] & keep) | half, 0).astype(np.uint8) if lo_bits < 8 else ch[name]
    ch["cov"] = bytes8(P["cov"])
    ch["nv"] = bytes8(P["nv"])
    ch["coc"] = bytes8(P["coc"] / COC_PER_BYTE / 255.0)
    ch["owner"] = (P["owner"] * OWNER_STEP).astype(np.uint8)
    for name in ("shade", "front"):
        ch[name] = bytes8(tone(P[name]), rng)
    for k in range(P["I"].shape[-1]):
        ch[f"light.{k + 1}"] = bytes8(tone(P["I"][..., k]), rng)
        depth = unlit_filled(np.sqrt(np.clip(P["D"][..., k] / DMAX, 0, 1)), P["I"][..., k])
        ch[f"depth.{k + 1}"] = bytes8(depth, rng)
    return ch


def grid(n, w, h, step):
    """Positions of n tiles of w x h, `step`-aligned with a `step` gutter (lossy codecs filter across block edges)."""
    cols = 1 if n == 1 else 2 if n <= 4 else 3
    sw = -(-w // step) * step + step
    sh = -(-h // step) * step + step
    rows = -(-n // cols)
    return [((i % cols) * sw, (i // cols) * sh) for i in range(n)], (cols * sw, rows * sh)


def atlas_rgb(ch, tiles, rect):
    x, y, w, h = rect
    places, (W, H) = grid(len(tiles), w, h, 2)
    out = np.zeros((H, W, 3), np.uint8)
    for (tx, ty), names in zip(places, tiles):
        for c, n in enumerate(names):
            out[ty : ty + h, tx : tx + w, c] = ch[n][y : y + h, x : x + w]
    return out, [{"file": "data", "x": tx, "y": ty, "channels": names} for (tx, ty), names in zip(places, tiles)]


def atlas_grey(ch, names, rect):
    x, y, w, h = rect
    places, (W, H) = grid(len(names), w, h, 16)
    out = np.zeros((H, W), np.uint8)
    for (tx, ty), n in zip(places, names):
        out[ty : ty + h, tx : tx + w] = ch[n][y : y + h, x : x + w]
    return out, [{"file": "light", "x": tx, "y": ty, "channels": [n]} for (tx, ty), n in zip(places, names)]


def encode(jobs):
    subprocess.run(["node", str(HERE / "encode.mjs"), json.dumps(jobs)], check=True)


def pack_one(exrs, uv_exr, lens, owners, out, quality, crops=None, seed=0, light_quality=88, codec="webp", lo_bits=8):
    """Writes out["base"] (plus crops of it), out["light"] and out["data"]; returns the sidecar describing them. WebP
    planes are dithered against banding; AVIF holds smooth gradients without it, and dither would only cost bytes."""
    rng = np.random.default_rng(seed) if codec == "webp" else None
    P = planes(exrs, uv_exr, lens, owners)
    h, w = P["cov"].shape
    rect = rect_of(P)
    data_tiles, light_names = layout(owners, bool(lens and lens.get("dof")))
    ch = channels(P, rng, lo_bits)
    data, data_places = atlas_rgb(ch, data_tiles, rect)
    light, light_places = atlas_grey(ch, light_names, rect)
    base = np.stack([bytes8(tone(P["dark"][..., i]), rng) for i in range(3)], -1)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        jobs = []

        def job(kind, array, target, **opts):
            write_png(tmp / f"{kind}.png", array)
            Path(target).parent.mkdir(parents=True, exist_ok=True)
            jobs.append({"kind": kind, "in": str(tmp / f"{kind}.png"), "out": str(target), **opts})

        job("base", base, out["base"], quality=quality, codec=codec)
        for name, (cx, cy, cw, ch_) in (crops or {}).items():
            job(name, base[cy : cy + ch_, cx : cx + cw], out[name], quality=quality, codec=codec)
        job("light", light, out["light"], quality=light_quality, codec=codec)
        job("data", data, out["data"], lossless=True)
        encode(jobs)
    lit = P["I"].max(axis=-1)
    return {
        "size": [w, h],
        "owners": owners,
        "rect": rect,
        "tiles": data_places + light_places,
        "bytes": {j["kind"]: Path(j["out"]).stat().st_size for j in jobs},
        "stats": {"depth_p99": float(np.percentile(P["D"][lit > 0], 99)) if (lit > 0).any() else 0.0, "depth_max": float(P["D"].max())},
    }


def compact_crop(meta):
    w, h = meta["size"]
    cw = int(round(h * COMPACT_ASPECT / 2) * 2)
    centre = meta["axis"][1][0] * w
    x = int(round(min(max(centre - cw / 2, 0), w - cw) / 2) * 2)
    return [x, 0, cw, h]


def pack_sequence(args):
    raw = Path(args.raw)
    web = Path(args.web) / "sequence"
    side = Path(args.packed) if args.packed else raw.parent / "packed"
    side.mkdir(parents=True, exist_ok=True)
    done = set()
    while True:
        only = set(args.only.split(",")) if args.only else None
        todo = [m for m in sorted(raw.glob("*.json")) if m.stem not in done and not (side / m.name).exists() and (not only or m.stem in only)]
        for m in todo:
            t0 = time.time()
            meta = json.loads(m.read_text())
            n = m.stem
            crop = compact_crop(meta)
            ext = {k: "webp" if k == "data" else args.codec for k in ("wide", "compact", "light", "data")}
            out = {k: web / k / f"{n}.{ext[k]}" for k in ext}
            out["base"] = out.pop("wide")
            exrs = [x for x in (raw / f"{n}.exr", raw / f"{n}.light.exr", raw / f"{n}.label.exr") if x.exists()]
            info = pack_one(exrs, raw / f"{n}.uv.exr", meta["lens"], 1, out, args.quality, crops={"compact": crop},
                            seed=meta["frame"], light_quality=args.light_quality, codec=args.codec, lo_bits=args.lo_bits)
            info.update(frame=meta["frame"], progress=meta["progress"], crop=crop, axis=meta["axis"])
            (side / m.name).write_text(json.dumps(info))
            print(f"PACKED {n} {time.time() - t0:.1f}s {sum(info['bytes'].values()) // 1024}KB", flush=True)
        for m in raw.glob("*.json"):
            if (side / m.name).exists():
                done.add(m.stem)
        if not args.watch or len(done) >= args.watch:
            break
        time.sleep(5)


def pack_still(args):
    exr = Path(args.exr)
    meta = json.loads(Path(f"{exr}.json").read_text())
    lens, owners = meta["lens"], meta.get("owners", 1)
    web = Path(args.web) / "stills" / args.name
    out = {k: web / f"{k}.webp" for k in ("base", "light", "data")}
    exrs = [x for x in (Path(f"{exr}.exr"), Path(f"{exr}.light.exr"), Path(f"{exr}.label.exr")) if x.exists()]
    info = pack_one(exrs, Path(f"{exr}.uv.exr"), lens if lens["dof"] else None, owners, out, args.quality, seed=7)
    info.update(name=args.name, layout={1: "single", 2: "pair", 3: "trio"}[owners], lens=lens)
    side = exr.parent.parent / "packed"
    side.mkdir(exist_ok=True)
    (side / f"{args.name}.json").write_text(json.dumps(info))
    (web / "still.json").write_text(json.dumps(info))
    print(f"PACKED {args.name} {sum(info['bytes'].values()) // 1024}KB {info['stats']}", flush=True)


def build_manifest(args):
    web = Path(args.web)
    plan = json.loads((HERE / "sequence.json").read_text())
    frames = [json.loads(p.read_text()) for p in sorted(Path(args.seq_packed).glob("*.json"))]
    stills = {}
    for p in sorted((web / "stills").glob("*/still.json")):
        s = json.loads(p.read_text())
        name = s.pop("name")
        s.pop("stats", None)
        files = {k: f"stills/{name}/{k}.webp" for k in ("base", "light", "data")}
        stills[name] = {**files, **s, "crops": CROPS.get(name, {})}
    total = lambda d: sum(f.stat().st_size for f in d.rglob("*.*")) if d.exists() else 0
    ext = lambda k: "webp" if k == "data" else args.codec
    first = frames[0] if frames else {"size": [0, 0], "tiles": []}
    manifest = {
        "version": VERSION,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "note": "Product-free template renders of the Cuvette bottle; a product is composited from data at runtime. Made by scripts/cuvette/blender (sequence.py, render.py, pack_lean.py).",
        "label": CAMERAS["label"],
        "files": {
            "base": "RGB lossy WebP or AVIF, tone-coded per channel: every serum absorbing all light, no print",
            "light": "greyscale lossy WebP or AVIF atlas of tone/depth-coded tiles (read .r); tiles sit on 16 px blocks with a 16 px gutter",
            "data": "RGB lossless WebP atlas; read with texelFetch only (never filter across split bytes)",
            "tiles": "each tile is a rect-sized cut of the full frame: atlas texel = tile.xy + (frame pixel - rect.xy); outside rect every plane is 0",
        },
        "encoding": {
            "tone": {"note": "8-bit display-matched code for light values: linear = table[byte]", "lo": LO, "hi": HI, "table": tone_table()},
            "u.hi/u.lo, v.hi/v.lo": "16-bit (hi * 256 + lo) / 65535: u around the print's arc, v up it, 0..1; all four bytes 0 = no coordinates",
            "cov": "byte / 255: how much of the pixel is print (occlusion and silhouette included)",
            "nv": "byte / 255: how squarely the print faces the lens",
            "light.k": "tone: neutral light that crossed bottle k's serum, caustics on the stone included; add light * exp(-sigma * depth)",
            "depth.k": {"note": "optical path through bottle k's serum in scene units (26 mm): max * (byte / 255)^2", "max": DMAX},
            "shade": "tone: light falling on the print area (multiply the ink's albedo)",
            "front": "tone: the glass's front-surface reflection over the print, to put back on top of the ink",
            "coc": {"note": "circle of confusion diameter in 1x pixels = byte * perByte (lens shots only)", "perByte": COC_PER_BYTE},
            "owner": {"note": "bottle 1..3 = round(byte / step); without a coc/owner tile every pixel is bottle 1", "step": OWNER_STEP},
        },
        "sequence": {
            "frames": len(frames),
            "path": {**{k: f"sequence/{k}/{{frame}}.{ext(k)}" for k in ("wide", "compact", "light", "data")}, "pad": 3},
            "size": first["size"],
            "compact": {"aspect": COMPACT_ASPECT, "note": "item.crop = [x, y, w, h] of the wide frame that compact/{frame} holds; light/data are shared and in wide-frame pixels"},
            "camera": "the live wide chapter path at 16:10, vertical fov, no depth of field",
            "chapters": plan["chapters"],
            "dropper": plan["dropper"],
            "items": [{"frame": f["frame"], "progress": f["progress"], "rect": f["rect"], "crop": f["crop"], "tiles": f["tiles"]} for f in frames],
            "bytes": {k: total(web / "sequence" / k) for k in ("wide", "compact", "light", "data")},
        },
        "stills": stills,
        "fromSequence": {**{k: {**v, "frame": plan["chapters"][1]["frame"]} for k, v in FROM_SEQUENCE.items()}, "note": "composite that sequence frame (wide), then cut `crop` (in 1600x1000 frame pixels; scale by size)"},
        "missing": {"group-wide": "use group", "drop-stone": "use drop", "carton": "no model"},
    }
    (web / "manifest.json").write_text(json.dumps(manifest, indent=1))
    print(json.dumps({"frames": len(frames), "stills": list(stills), "bytes": manifest["sequence"]["bytes"]}))


# Shots cut from a render rather than rendered, as [x, y, w, h] in that render's pixels.
CROPS = {
    "pack": {"thumb": [0, 240, 1920, 1920], "hero-tall": [285, 0, 1350, 2400]},
    "hero-wide": {"og": [0, 45, 2400, 1260]},
}
# Shots taken from a sequence frame: the label close-up chapter (chapter 1's frame), cut to 16:9.
FROM_SEQUENCE = {"label-wide": {"crop": [0, 50, 1600, 900]}}


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sequence")
    s.add_argument("--raw", required=True)
    s.add_argument("--web", required=True)
    s.add_argument("--quality", type=int, default=58)
    s.add_argument("--light-quality", type=int, default=52)
    s.add_argument("--codec", choices=("webp", "avif"), default="avif")
    s.add_argument("--lo-bits", type=int, default=3, help="bits kept of the print coordinates' low bytes")
    s.add_argument("--packed", help="where the per-frame sidecars go (default: next to --raw)")
    s.add_argument("--only", help="comma-separated frame names, for a partial repack")
    s.add_argument("--watch", type=int, default=0)
    t = sub.add_parser("still")
    t.add_argument("--exr", required=True, help="raw path without extension")
    t.add_argument("--name", required=True)
    t.add_argument("--web", required=True)
    t.add_argument("--quality", type=int, default=90)
    m = sub.add_parser("manifest")
    m.add_argument("--web", required=True)
    m.add_argument("--seq-packed", required=True)
    m.add_argument("--codec", choices=("webp", "avif"), default="avif", help="the sequence's lossy codec")
    args = ap.parse_args()
    {"sequence": pack_sequence, "still": pack_still, "manifest": build_manifest}[args.cmd](args)


main()
