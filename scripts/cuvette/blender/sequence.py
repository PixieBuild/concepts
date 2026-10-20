"""Path-traces the homepage hero sequence, product-free, through the live 16:10 desktop camera. Resumable: frames whose
raw files exist are skipped, so a killed run picks up where it stopped.

  Blender -b --factory-startup -P scripts/cuvette/blender/sequence.py -- \
    --out assets/cuvette/seq --size 1600x1000 --samples 32 [--frames 0-40] [--plan scripts/cuvette/blender/sequence.json]

Writes raw/NNN.exr (dark), raw/NNN.light.exr, raw/NNN.label.exr (front reflection and print light), raw/NNN.uv.exr (2x,
float) and raw/NNN.json (lens and where the bottle axis falls, for the phone crop). pack_lean.py turns them into web files.
Only the dark layer covers the frame: the serum light is rendered inside a border around everything serum can light, and
the print layers inside a border around the print, which more than halves the cost of a wide frame.
"""

import argparse
import json
import sys
import time
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, str(Path(__file__).resolve().parent))

from cuvette.common import b  # noqa: E402
from cuvette.passes import render_passes  # noqa: E402
from cuvette.stage import Stage, chapter_lens  # noqa: E402


def frames_arg(spec, n):
    if not spec or spec == "all":
        return list(range(n))
    out = []
    for part in spec.split(","):
        lo, _, hi = part.partition("-")
        out.extend(range(int(lo), int(hi or lo) + 1))
    return [i for i in out if i < n]


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--plan", default=str(Path(__file__).resolve().parent / "sequence.json"))
    ap.add_argument("--size", default="1600x1000")
    ap.add_argument("--samples", type=int, default=32)
    ap.add_argument("--threshold", type=float, default=0.02)
    ap.add_argument("--frames", default="all")
    ap.add_argument("--blend", default="")
    args = ap.parse_args(argv)

    plan = json.loads(Path(args.plan).read_text())
    size = tuple(int(v) for v in args.size.split("x"))
    raw = Path(args.out) / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    log = Path(args.out) / "render-log.txt"

    stage = Stage("single")
    c = stage.scene.cycles
    c.samples = args.samples
    c.adaptive_threshold = args.threshold
    c.adaptive_min_samples = min(16, args.samples // 2)
    light_samples = max(8, args.samples // 2)

    for i in frames_arg(args.frames, plan["frames"]):
        name = f"{i:03d}"
        if (raw / f"{name}.json").exists():
            continue
        p = plan["progress"][i]
        t0 = time.time()
        L = chapter_lens(p)
        for bot in stage.bottles:
            bot["spinner"].rotation_euler.z = bot["turn"]
        stage.frame(L["eye"], L["look"], L["fov"], size, shift=L["shift"])
        stage.pose(p)
        if args.blend and i == 0:
            bpy.ops.wm.save_as_mainfile(filepath=args.blend)
        borders = render_passes(stage, raw, name, args.samples, light_samples)
        bpy.context.view_layer.update()
        axis = [world_to_camera_view(stage.scene, stage.camera, b((0, y, 0))) for y in (0.0, 1.2, 3.3)]
        meta = {
            "frame": i,
            "progress": p,
            "size": size,
            "samples": args.samples,
            "lens": stage.lens(),
            "camera": L,
            "borders": {k: [round(v, 4) for v in box] for k, box in borders.items()},
            # Normalised frame position (x right, y down) of the bottle axis at its base, mid-label and bulb top.
            "axis": [[round(v.x, 5), round(1 - v.y, 5)] for v in axis],
        }
        (raw / f"{name}.json").write_text(json.dumps(meta, indent=1))
        line = f"{time.strftime('%H:%M:%S')}\t{name}\tp={p:.4f}\t{size[0]}x{size[1]}\t{args.samples}spp\t{time.time() - t0:.1f}s"
        print("FRAME", line, flush=True)
        with log.open("a") as fh:
            fh.write(line + "\n")


main()
