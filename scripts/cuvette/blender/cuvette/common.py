import json
import math
import os
from pathlib import Path

from mathutils import Vector

HERE = Path(__file__).resolve().parent.parent
ROOT = HERE.parents[2]
ASSETS = ROOT / "assets" / "cuvette"
# The set's maps live with the scene sources, not in public: the site no longer ships a real-time scene.
TEXTURES = Path(os.environ.get("CUVETTE_TEXTURES", HERE / "textures"))

CAMERAS = json.loads((HERE / "cameras.json").read_text())
PROFILES = json.loads((HERE / "profiles.json").read_text())
RIG = json.loads((HERE / "rig.json").read_text())


def b(v):
    """Live-scene (x, y up, z toward camera) to Blender (x, y away from camera, z up)."""
    return Vector((v[0], -v[2], v[1]))


def between(v, lo, hi):
    return min(1.0, max(0.0, (v - lo) / (hi - lo)))


def smooth(v):
    return v * v * (3 - 2 * v)


def look_at(obj, target):
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = (Vector(target) - obj.location).to_track_quat("-Z", "Y")


def lerp(a, c, t):
    return a + (c - a) * t


def srgb(hex_colour):
    """A CSS hex colour as linear RGB."""
    h = hex_colour.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def deg(d):
    return d * math.pi / 180
