"""Chooses the scroll progress of every hero-sequence frame so that each step moves the picture by about the same amount.

  python3 scripts/cuvette/blender/sequence_plan.py [--frames 108] [--out scripts/cuvette/blender/sequence.json]

The homepage camera eases into each chapter and rests there, while the dropper and the drop move inside chapter 3's
rest. Sampling progress evenly would spend frames on still pictures and skip the drop, so frames are spaced evenly in
accumulated on-screen motion instead (tracked points projected through the live 16:10 camera), with a floor so the
chapter rests still get the odd frame.
"""

import argparse
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAM = json.loads((HERE / "cameras.json").read_text())
PROFILES = json.loads((HERE / "profiles.json").read_text())
D = CAM["dropper"]
TIP = PROFILES["pipette_tip"]
PENDANT = 0.068
ASPECT = 1.6


def between(v, lo, hi):
    return min(1.0, max(0.0, (v - lo) / (hi - lo)))


def smooth(v):
    return v * v * (3 - 2 * v)


def lens(p):
    frames = CAM["chapters"]["wide"]
    scaled = min(1.0, max(0.0, p)) * (len(frames) - 1)
    i = min(len(frames) - 2, math.floor(scaled))
    t = smooth(scaled - i)
    a, c = frames[i], frames[i + 1]
    mix = lambda k, n: [a[k][j] + (c[k][j] - a[k][j]) * t for j in range(n)]
    return {"eye": mix("eye", 3), "look": mix("look", 3), "fov": a["fov"] + (c["fov"] - a["fov"]) * t, "shift": mix("shift", 2)}


def sub(a, b):
    return [a[i] - b[i] for i in range(3)]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def norm(a):
    n = math.sqrt(sum(x * x for x in a))
    return [x / n for x in a]


def dot(a, b):
    return sum(a[i] * b[i] for i in range(3))


def project(L, point):
    """Point in the 16:10 frame, both axes in frame-height units (x from the left, y down)."""
    fwd = norm(sub(L["look"], L["eye"]))
    right = norm(cross(fwd, [0, 1, 0]))
    up = cross(right, fwd)
    v = sub(point, L["eye"])
    z = dot(v, fwd)
    t = math.tan(math.radians(L["fov"]) / 2)
    x = dot(v, right) / z / t
    y = dot(v, up) / z / t
    return [(0.5 + x * 0.5 / ASPECT + L["shift"][0]) * ASPECT, 0.5 - y * 0.5 - L["shift"][1]]


def dropper(p):
    ph, dp = D["phases"], D["drop_phases"]
    e = lambda k: smooth(between(p, *ph[k]))
    lift, shift, lower, raise_, back, seat = (e(k) for k in ("lift", "shift", "lower", "raise", "back", "seat"))
    height = D["lift"] * lift * (1 - seat) - D["lower"] * lower * (1 - raise_)
    side = shift * (1 - back)
    x, z, tilt = D["hang"][0] * side, D["hang"][2] * side, D["tilt"] * side
    tip = [x - TIP * math.sin(tilt), height + TIP * math.cos(tilt), z]
    grow, fall, spread = between(p, *dp["grow"]), between(p, *dp["fall"]), smooth(between(p, *dp["spread"]))
    start = tip[1] - 1.3 * D["drop"]
    drop = [tip[0], start - fall * fall * (start - D["drop"]), z] if 0 < fall < 1 else tip
    return {"bulb": [x, height + 3.3, z], "tip": tip, "drop": drop, "r": PENDANT * smooth(grow) * (fall == 0) + D["bead"]["radius"] * spread}


FIXED = [[0, 0, 0], [0, 3.3, 0], [0, 2.3, 0], [-0.55, 0.38, 0.4], [0.55, 0.38, 0.4], [-0.55, 1.42, 0.4], [0.55, 1.42, 0.4], [-1.65, 0, 0.95], [1.65, 0, 0.95]]


def picture(p):
    L = lens(p)
    dr = dropper(p)
    pts = [project(L, q) for q in FIXED + [dr["bulb"], dr["tip"], dr["drop"]]]
    size = abs(project(L, [dr["tip"][0] + dr["r"], dr["tip"][1], dr["tip"][2]])[0] - project(L, dr["tip"])[0])
    return pts, size


def motion(p0, p1):
    a, sa = picture(p0)
    b, sb = picture(p1)
    step = lambda i: math.dist(a[i], b[i])
    # The dropper's motion counts only while it is in shot: it crosses above the frame unseen.
    seen = lambda q: -0.02 <= q[0] <= ASPECT + 0.02 and -0.02 <= q[1] <= 1.02
    shown = lambda i: step(i) if seen(a[i]) or seen(b[i]) else 0.0
    scene = sum(step(i) for i in range(len(FIXED))) / len(FIXED)
    # The dropper weighs as much as the whole set: it is what the eye follows in chapter 3; the drop's growth too.
    moving = max(shown(len(FIXED)), shown(len(FIXED) + 1)) + 0.6 * shown(len(FIXED) + 2) + 4 * abs(sb - sa)
    return scene + moving


def plan(n, floor=0.12, grid=20000):
    ps = [i / grid for i in range(grid + 1)]
    speed = [motion(ps[i], ps[i + 1]) for i in range(grid)]
    mean = sum(speed) / grid
    acc = [0.0]
    for s in speed:
        acc.append(acc[-1] + s + floor * mean)
    total = acc[-1]
    out, j = [], 0
    for k in range(n):
        target = total * k / (n - 1)
        while j < grid and acc[j + 1] < target:
            j += 1
        span = acc[j + 1] - acc[j] if j < grid else 1
        frac = 0 if j >= grid else (target - acc[j]) / span
        out.append(round(min(1.0, ps[min(j, grid)] + frac / grid), 5))
    out[0], out[-1] = 0.0, 1.0
    steps = [motion(out[i], out[i + 1]) for i in range(n - 1)]
    return out, total, steps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, default=108)
    ap.add_argument("--out", default=str(HERE / "sequence.json"))
    args = ap.parse_args()
    ps, total, steps = plan(args.frames)
    chapters = CAM["chapter_progress"]
    near = [min(range(len(ps)), key=lambda i: abs(ps[i] - c)) for c in chapters]
    # Snap one frame exactly onto each chapter, so every chapter has a frame that is its exact still.
    for i, c in zip(near, chapters):
        ps[i] = c
    data = {"frames": len(ps), "progress": ps, "chapters": [{"progress": c, "frame": i} for c, i in zip(chapters, near)],
            "dropper": {k: v for k, v in D.items() if k in ("phases", "drop_phases")}}
    Path(args.out).write_text(json.dumps(data, indent=1))
    print(f"{len(ps)} frames; motion per step: max {max(steps):.4f}, median {sorted(steps)[len(steps) // 2]:.4f} frame heights")
    buckets = [0] * 20
    for p in ps:
        buckets[min(19, int(p * 20))] += 1
    print("frames per 5% of scroll:", buckets)


main()
