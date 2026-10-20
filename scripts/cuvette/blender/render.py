"""Path-traces the Cuvette template bottle once per shot. Every shot is product-free: products are composited from data
at runtime, so a new product never needs a render. pack_lean.py packs the raw passes for the web.

  Blender -b --factory-startup -P scripts/cuvette/blender/render.py -- \
    --shots drop-macro,set --out assets/cuvette/stills [--samples 64] [--scale 1]

Shots: hero-wide, three-quarter, label, group, pack, set, drop-stone, drop-macro. Each writes raw/<shot>.exr (dark,
plus the front reflection on lens shots), .light.exr, .label.exr, .uv.exr and .json (lens, size), as sequence.py does.
"""

import argparse
import json
import math
import sys
import time
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from cuvette import geo  # noqa: E402
from cuvette.common import CAMERAS, ROOT  # noqa: E402
from cuvette.passes import render_passes  # noqa: E402
from cuvette.stage import Stage  # noqa: E402

STILLS = CAMERAS["stills"]
PORTRAIT = (1600, 2000)
PACK = (1920, 2400)  # The primary packshot, cut into the thumb and the tall hero (pack_lean.CROPS).
# The drop macro hangs the dropper lower than the sequence does, so the defocused bottle behind it is serum, not air.
MACRO_DROP = 0.77

# Stills framed for the photographs rather than copied from the live camera. `rise` lifts the frame without tilting
# the camera (a shift lens), so verticals stay vertical. Heights in scene units: the bottle stands 3.3 to its bulb.
FRAMES = {
    # The homepage's opening chapter at 16:9 for share images and the PDP hero; no depth of field, like the sequence.
    "hero-wide": dict(eye=[0, 1.72, 11.6], look=[0, 1.72, 0], fov=26, shift=[0.1, 0.03], size=(2400, 1350)),
    # Raised ~3° so the serum's surface reads as a thin ellipse.
    "three-quarter": dict(eye=[2.3, 2.3, 10.2], look=[0.1, 1.62, 0], fov=24, rise=0.0, focus=[0.1, 1.1, 0.62], f=16, turn=0.05),
    "label": dict(eye=[0, 1.28, 3.2], look=[0, 0.95, 0], fov=24, rise=0.0, focus=[0, 0.93, 0.63], f=8),
    "group": dict(eye=[0, 4.0, 14.5], look=[0, 4.0, 0], fov=24.5, rise=-0.37, focus=[0, 1.1, 0.7], f=16, layout="trio"),
    # The morning set's packshot: the pair whole on the plinth, framed and sized like the single `pack`.
    "set": dict(eye=[0, 1.9, 11.4], look=[0, 1.9, 0], fov=26, rise=-0.035, focus=[0, 1.1, 0.5], f=16, layout="pair", size=PACK),
}


def lowered_tip(drop=0.0):
    """The pipette tip once the dropper has come down beside the bottle for the dose (progress 0.62–0.8)."""
    d = CAMERAS["dropper"]
    return [d["hang"][0] - geo.TIP * math.sin(d["tilt"]), d["lift"] - d["lower"] - drop + geo.TIP * math.cos(d["tilt"]), d["hang"][2]]


def spec(name):
    """Layout, progress, camera and lens for one named shot."""
    if name in FRAMES:
        f = FRAMES[name]
        return dict(layout=f.get("layout", "single"), p=0.0, turn=f.get("turn", 0), eye=f["eye"], look=f["look"], fov=f["fov"],
                    shift=f.get("shift", [0, -f.get("rise", 0)]), size=f.get("size", PORTRAIT), focus=f.get("focus"), f=f.get("f"))
    if name in ("pack", "drop-stone"):
        s = STILLS[name]
        layout = s["layout"]
        focus = (s.get("focus") or {}).get("at") or [0.1, 1.1, 0.62]
        f = {"drop-stone": 5.6}.get(name, 16)
        return dict(layout=layout, p=s["progress"], turn=s.get("turn", 0), eye=s["eye"], look=s["look"], fov=s["fov"],
                    shift=s["shift"], size=PACK if name == "pack" else PORTRAIT, focus=focus, f=f)
    if name == "drop-macro":
        # From a little below the drop, so the defocused bottle behind carries its serum line across the top.
        tip = lowered_tip(MACRO_DROP)
        centre = [tip[0], tip[1] - 0.07, tip[2]]
        away = [1.0, 0.0, 0.34]
        n = math.hypot(away[0], away[2])
        eye = [centre[0] + away[0] / n * 1.7, centre[1] - 0.42, centre[2] + away[2] / n * 1.7]
        # Re-lit for the macro, as a photographer would: the edge strip, folded through the column and the drop's neck,
        # would draw a hot thread down the pipette and a forked glint in the drop.
        return dict(layout="single", p=0.655, eye=eye, look=centre, fov=17, shift=[0, -0.14], size=PORTRAIT, focus=centre, f=11,
                    hang_drop=MACRO_DROP, off=["strip-edge"])
    raise SystemExit(f"unknown shot {name}")


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--shots", required=True)
    ap.add_argument("--out", default=str(ROOT / "assets/cuvette/stills"))
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--blend", default="")
    args = ap.parse_args(argv)

    out = Path(args.out)
    raw = out / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    log = out / "render-log.txt"
    stage, built = None, None
    for name in args.shots.split(","):
        sp = spec(name)
        t0 = time.time()
        if sp["layout"] != built:
            stage = Stage(sp["layout"])
            built = sp["layout"]
        stage.scene.cycles.samples = args.samples
        size = tuple(round(v * args.scale) for v in sp["size"])
        for bot in stage.bottles:
            bot["spinner"].rotation_euler.z = bot["turn"] + sp.get("turn", 0)
        stage.hang_drop = sp.get("hang_drop", 0.0)
        for obj in stage.scene.objects:
            if obj.type == "LIGHT" or obj in stage.softboxes:
                obj.hide_render = obj.name in sp.get("off", [])
        stage.pose(sp["p"])
        stage.frame(sp["eye"], sp["look"], sp["fov"], size, shift=sp["shift"], focus=sp.get("focus"), f_number=sp.get("f"))
        if args.blend:
            bpy.ops.wm.save_as_mainfile(filepath=args.blend)
        built_s = time.time() - t0
        t1 = time.time()
        borders = render_passes(stage, raw, name, args.samples, max(16, args.samples // 4), pad=0.06)
        meta = {"lens": stage.lens(), "size": size, "samples": args.samples, "owners": len(stage.bottles), "borders": borders}
        (raw / f"{name}.json").write_text(json.dumps(meta, indent=1))
        line = f"{time.strftime('%H:%M:%S')}\t{name}\t{size[0]}x{size[1]}\t{args.samples}spp\tbuild {built_s:.1f}s\trender {time.time() - t1:.1f}s"
        print("SHOT", line, flush=True)
        with log.open("a") as fh:
            fh.write(line + "\n")


main()
