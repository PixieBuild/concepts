import math

import bmesh
import bpy
from mathutils import Vector

from .common import PROFILES

FILL = PROFILES["fill"]  # About 72% of the body: the serum line sits just above the print.
MENISCUS = 0.038  # How far the serum climbs the glass: about 1 mm.
MENISCUS_REACH = 0.026  # How far in from the wall the curl dies away.
WALL = 0.058  # 1.5 mm of soda-lime glass.
BASE = 0.13  # A heavy 3.4 mm base, as moulded bottles have.
OVERLAP = 0.002  # The serum overlaps the bottle's glass so the glass/serum interface refracts as one surface.
SKIN = 0.0004  # Where serum wets the pipette its face stands this far off the glass, so the two never coincide.
TIP = PROFILES["pipette_tip"]
# A drawn glass dropper: 3.9 mm tube drawn down over its last 6 mm to a fire-polished 1.6 mm tip, 0.7 mm bore.
PIPETTE_R = 0.075
PIPETTE_TOP = 2.41
TIP_R = 0.031
TIP_BORE = 0.014
LIP = 0.008
NECK_R = 0.22


def catmull(points, step=0.004):
    """Centripetal Catmull-Rom through the points, resampled about every `step` so no kink reaches the silhouette."""
    P = [Vector(p) for p in points]
    if len(P) < 3:
        return P
    ext = [P[0] + (P[0] - P[1]), *P, P[-1] + (P[-1] - P[-2])]
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        t0 = 0.0
        t1 = t0 + max((p1 - p0).length ** 0.5, 1e-5)
        t2 = t1 + max((p2 - p1).length ** 0.5, 1e-5)
        t3 = t2 + max((p3 - p2).length ** 0.5, 1e-5)
        n = max(2, math.ceil((p2 - p1).length / step))
        for k in range(n):
            t = t1 + (t2 - t1) * k / n
            a1 = p0 * ((t1 - t) / (t1 - t0)) + p1 * ((t - t0) / (t1 - t0))
            a2 = p1 * ((t2 - t) / (t2 - t1)) + p2 * ((t - t1) / (t2 - t1))
            a3 = p2 * ((t3 - t) / (t3 - t2)) + p3 * ((t - t2) / (t3 - t2))
            b1 = a1 * ((t2 - t) / (t2 - t0)) + a2 * ((t - t0) / (t2 - t0))
            b2 = a2 * ((t3 - t) / (t3 - t1)) + a3 * ((t - t1) / (t3 - t1))
            c = b1 * ((t2 - t) / (t2 - t1)) + b2 * ((t - t1) / (t2 - t1))
            out.append(Vector((max(0.0, c.x), c.y)))
    out.append(P[-1].copy())
    return out


def offset_inward(dense, width):
    """The surface `width(normal)` inside a profile that runs up the outside of a solid; drops points that fold back."""
    out = []
    for i, p in enumerate(dense):
        a = dense[max(i - 1, 0)]
        c = dense[min(i + 1, len(dense) - 1)]
        t = (c - a).normalized()
        n = Vector((t.y, -t.x))
        q = p - n * width(n)
        q.x = max(0.0, q.x)
        if out and (q - out[-1]).dot(t) <= 1e-6:
            continue
        out.append(q)
    return out


def _dedupe(points, eps=1e-6):
    out = []
    for p in points:
        if not out or (p - out[-1]).length > eps:
            out.append(p)
    return out


def lathe(name, profile, segments=256, closed=True, loop=False):
    """Turns a (radius, height) profile about Blender's z axis. Angle 0 faces the camera (-y). `loop` joins the
    last ring back to the first, for a profile with no point on the axis (a tube). A `Tagged` profile also gives each
    band of faces its material slot."""
    tags = profile.tags if isinstance(profile, Tagged) else None
    profile = list(profile) if tags else _dedupe([Vector(p) for p in profile])
    verts, rings, slots = [], [], []
    for r, h in profile:
        if r < 1e-6:
            rings.append([len(verts)])
            verts.append((0.0, 0.0, h))
            continue
        ring = []
        for j in range(segments):
            a = 2 * math.pi * j / segments
            ring.append(len(verts))
            verts.append((r * math.sin(a), -r * math.cos(a), h))
        rings.append(ring)
    faces = []
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if loop else [])
    for n, (lo, hi) in enumerate(pairs):
        if len(lo) == 1 and len(hi) == 1:
            continue
        for j in range(segments):
            slots.append(tags[(n + 1) % len(tags)] if tags else 0)
            k = (j + 1) % segments
            if len(lo) == 1:
                faces.append((lo[0], hi[k], hi[j]))
            elif len(hi) == 1:
                faces.append((lo[j], lo[k], hi[0]))
            else:
                faces.append((lo[j], lo[k], hi[k], hi[j]))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.polygons.foreach_set("material_index", slots)
    if tags:
        mesh.attributes.new("tag", "FLOAT", "FACE").data.foreach_set("value", [float(t) for t in slots])
    _finish(mesh, closed, None if closed else radial)
    return bpy.data.objects.new(name, mesh)


class Tagged(list):
    """A profile whose segments carry material slots: the segment ending at point k takes tags[k]."""

    def __init__(self, *parts):
        super().__init__()
        self.tags = []
        for points, tag in parts:
            for p in points:
                p = Vector(p)
                if self and (p - self[-1]).length <= 1e-6:
                    continue
                self.append(p)
                self.tags.append(tag)


# Material slots. Where serum wets the pipette, the serum's face refracts serum against glass and the glass's face is
# clear, so the pair bends light as one glass/serum interface: no air film and no ring of total internal reflection.
DRY, WET, IMMERSED = 0, 1, 2


def _finish(mesh, closed, outward=None):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    if closed:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    elif outward is not None:
        bm.normal_update()
        score = sum(f.normal.dot(outward(f.calc_center_median())) for f in bm.faces)
        if score < 0:
            bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    mesh.update()


def radial(c):
    v = Vector((c.x, c.y, 0.0))
    return v.normalized() if v.length > 1e-9 else Vector((0, 0, 1))


_OUTER = PROFILES["glass"][:19] + [[0.22, 2.30], [0.22, 2.40], [0.219, 2.425], [0.212, 2.438], [0.2, 2.444]]
_LIP = [[0.2, 2.444], [0.186, 2.446], [0.172, 2.44], [0.163, 2.426], [0.16, 2.405], [0.16, 2.25], [0.162, 2.2]]


def _wall(n):
    down = max(0.0, -n.y)
    return WALL + (BASE - WALL) * down * down


def bottle_profiles():
    # Catmull-Rom overshoots where the heel and shoulder meet the wall; a moulded bottle's wall is a true cylinder.
    wall = PROFILES["glass"][6][0]
    outer = [Vector((min(p.x, wall), p.y)) for p in catmull(_OUTER, 0.003)]
    body = [p for p in outer if p.y <= 2.13]
    inner = offset_inward(body, _wall)
    serum_side = offset_inward(body, lambda n: _wall(n) - OVERLAP)
    lip = catmull(_LIP, 0.003)
    glass = _dedupe([*outer, *lip[1:], *reversed(inner)])
    return glass, inner, serum_side


def serum_profile(side, fill=FILL, around_pipette=False):
    """The serum: its side follows the glass to the fill line, then a meniscus climbs the wall. With
    `around_pipette` it parts round the seated pipette (climbing it a little) and closes under the open tip."""
    top = fill + MENISCUS
    wall = []
    for p in side:
        if p.y >= top:
            break
        wall.append(p)
    # Where the glass crosses the meniscus height.
    a, c = wall[-1], next(p for p in side if p.y >= top)
    rw = a.x + (c.x - a.x) * (top - a.y) / max(c.y - a.y, 1e-9)
    # Into the pipette's wall, as at the bottle's: an air film between serum and glass would refract like a lens.
    hole = PIPETTE_R + SKIN if around_pipette else 0.0
    surface = []
    for i in range(1, 80):
        d = (i / 80) ** 2.2 * rw
        r = rw - d
        if r <= hole + 0.014:
            break
        surface.append(Vector((r, fill + MENISCUS * math.exp(-d / MENISCUS_REACH) ** 1.6)))
    if not around_pipette:
        return [*wall, Vector((rw, top)), *surface, Vector((0.0, fill))]
    climb = [Vector((hole + 0.012 * (1 - k / 8) ** 1.5, fill + 0.018 * (k / 8) ** 2.4)) for k in range(9)]
    tube = [Vector((p.x + SKIN, p.y)) for p in reversed(pipette_outer()) if p.y < fill]
    # Round the tip and into the bore, meeting the column drawn up inside it.
    mouth = TIP + LIP * 0.6 - SKIN
    return Tagged((wall, DRY), ([Vector((rw, top)), *surface, *climb], DRY), (tube, WET), ([p for p in wet_lip() if p.x > TIP_BORE or p.y < mouth], WET), ([Vector((TIP_BORE - SKIN, mouth)), Vector((0.0, mouth))], WET))


def label_mesh(name, label, segments=320):
    """An open sleeve half a millimetre off the glass, UV'd so the printed sheet wraps the arc."""
    r, arc, height, y = label["radius"] - 0.0004, label["arc"], label["height"], label["y"]
    verts, faces, uvs = [], [], []
    for row in range(2):
        for j in range(segments + 1):
            a = -arc / 2 + arc * j / segments
            verts.append((r * math.sin(a), -r * math.cos(a), y - height / 2 + height * row))
    for j in range(segments):
        faces.append((j, j + 1, segments + 2 + j, segments + 1 + j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    uv = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            vi = mesh.loops[li].vertex_index
            row, j = divmod(vi, segments + 1)
            uv.data[li].uv = (j / segments, row)
    _finish(mesh, False, radial)
    return bpy.data.objects.new(name, mesh)


def thread_mesh(name, r=NECK_R - 0.006, lo=2.262, hi=2.372, turns=1.6, depth=0.018, half=0.0105, steps=320, ring=14):
    """An 18-415 style neck thread: a rounded bead wound 1.6 turns, tapering in at both ends."""
    pitch = (hi - lo - 2 * half) / turns
    verts, faces = [], []
    for i in range(steps + 1):
        t = i / steps
        a = 2 * math.pi * turns * t
        h = lo + half + pitch * turns * t
        taper = smooth_end(t, 0.12)
        for k in range(ring):
            s = math.pi * k / (ring - 1)
            rr = r + depth * taper * max(0.0, math.sin(s)) ** 0.8
            hh = h - half * math.cos(s) * (0.35 + 0.65 * taper)
            verts.append((rr * math.sin(a), -rr * math.cos(a), hh))
    for i in range(steps):
        for k in range(ring):
            p, q = i * ring + k, i * ring + (k + 1) % ring
            faces.append((p, q, q + ring, p + ring))
    faces.append(tuple(range(ring))[::-1])
    faces.append(tuple(steps * ring + k for k in range(ring)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    _finish(mesh, True)
    return bpy.data.objects.new(name, mesh)


def smooth_end(t, w):
    e = min(1.0, t / w, (1 - t) / w)
    return e * e * (3 - 2 * e)



COLLAR_DROP = 0.13  # The skirt reaches down over the neck finish so the collar reads screwed on, not perched.


def collar_profile():
    skirt = [[r, h - COLLAR_DROP] if h < 2.33 else [r, h] for r, h in PROFILES["collar"][1:]]
    pts = [[0.236, 2.63], [0.236, 2.4]] + skirt
    return catmull(pts, 0.002)


def bulb_profile():
    return catmull(PROFILES["bulb"], 0.003)


def pipette_outer():
    """The tube's outside from where the tip's rounded lip ends up to the collar: a long draw-down taper."""
    taper = catmull([[TIP_R, TIP + LIP], [TIP_R + 0.001, TIP + 0.06], [0.041, TIP + 0.13], [0.06, TIP + 0.19], [0.072, TIP + 0.24], [PIPETTE_R, TIP + 0.3], [PIPETTE_R, 1.2]], 0.003)
    # Rings all the way up: one long face would let smooth shading bend the cap's normal down the whole tube.
    wall = [Vector((PIPETTE_R, 1.2 + (PIPETTE_TOP - 1.2) * k / 300)) for k in range(1, 301)]
    return _dedupe([*taper, *wall])


def pipette_lip():
    """The fire-polished orifice: a half-round from the bore, under the tip, to the outside wall."""
    half = (TIP_R - TIP_BORE) / 2
    return [Vector((TIP_BORE + half * (1 - math.cos(a)), TIP + LIP - LIP * math.sin(a))) for a in (math.pi * k / 12 for k in range(13))]


def wet_lip():
    """Serum's skin round the fire-polished orifice, from the outside wall under the tip to the bore."""
    half = (TIP_R - TIP_BORE) / 2
    centre = TIP_BORE + half
    return [Vector((centre - (half + SKIN) * math.cos(a), TIP + LIP - (LIP + SKIN) * math.sin(a))) for a in (math.pi * (12 - i) / 12 for i in range(13))]


def pipette_inner():
    """The bore from the tip up: the wall thins from 0.5 mm in the tube to 0.42 mm through the taper."""
    pts = [Vector((max(TIP_BORE, p.x - (0.016 + 0.003 * (p.x - TIP_R) / (PIPETTE_R - TIP_R))), p.y)) for p in pipette_outer()]
    return _dedupe([Vector((TIP_BORE, TIP + LIP)), *pts[1:]])


COLUMN_TOP = 1.59


def pipette_profiles():
    """The pipette as a hollow glass tube with a rounded orifice, and the serum drawn up inside it."""
    inner = pipette_inner()
    outer = pipette_outer()[1:]
    wet_line = FILL + 0.02  # Where the seated serum's meniscus leaves the pipette.
    down = list(reversed(inner[1:]))
    tube = Tagged(
        (pipette_lip(), WET),
        ([p for p in outer if p.y <= wet_line], IMMERSED),
        ([p for p in outer if p.y > wet_line], DRY),
        ([Vector((PIPETTE_R - 0.006, PIPETTE_TOP + 0.003)), Vector((inner[-1].x, PIPETTE_TOP))], DRY),
        ([p for p in down if p.y >= COLUMN_TOP], DRY),
        ([p for p in down if p.y < COLUMN_TOP], WET),
    )
    column_top = COLUMN_TOP
    side = [Vector((p.x - SKIN, p.y)) for p in inner if p.y < column_top]
    rw = side[-1].x
    surface = [Vector((rw * (1 - i / 24), column_top - 0.03 * (1 - math.exp(-(i / 24) * 4)) / (1 - math.exp(-4)))) for i in range(1, 25)]
    surface[-1].x = 0.0
    column = Tagged(([Vector((0.0, TIP + LIP * 0.6)), Vector((TIP_BORE - SKIN, TIP + LIP * 0.6)), *side, Vector((rw, column_top))], WET), (surface, DRY))
    return tube, column


PENDANT = 0.068  # A full drop: 3.5 mm across, hanging from the 1.6 mm tip.
BEAD = 0.014  # The shallowest bead that still covers the end of the tip.
# The full drop in drop radii, from the contact line on the tip's outer rim (y = 0) down to its pole: a concave neck
# that flares off the rim, then the bulb, widest about two thirds of the way down.
_DRIP = [[(TIP_R + SKIN) / PENDANT, 0.0], [0.48, -0.1], [0.53, -0.25], [0.66, -0.47], [0.84, -0.76], [0.97, -1.08], [0.99, -1.38], [0.88, -1.68], [0.62, -1.9], [0.3, -2.0], [0.0, -2.02]]


def _by_length(points, n):
    """`n` points evenly spaced along a polyline, so two profiles can be blended point by point."""
    seg = [(b - a).length for a, b in zip(points, points[1:])]
    total = sum(seg)
    out, i, run = [], 0, 0.0
    for k in range(n):
        target = total * k / (n - 1)
        while i < len(seg) - 1 and run + seg[i] < target:
            run += seg[i]
            i += 1
        t = 0.0 if seg[i] == 0 else min(1.0, (target - run) / seg[i])
        out.append(points[i].lerp(points[i + 1], t))
    return out


def _cap(depth, n):
    """A bead hanging from the tip's rim, `depth` deep: how a drop starts. Never shallower than BEAD, so the bead
    always covers the end of the tip."""
    a = TIP_R + SKIN
    return [Vector((a * math.cos(t), -depth * math.sin(t))) for t in (math.pi / 2 * k / (n - 1) for k in range(n))]


def drop_outline(growth, n=160):
    """The hanging drop's outside from the contact line to the pole, relative to the contact line, as it grows from a
    bead on the rim (growth near 0) to the full pendant drop (1)."""
    full = _by_length(catmull([Vector((x * PENDANT, y * PENDANT)) for x, y in _DRIP], 0.0015), n)
    cap = _by_length(_cap(BEAD + growth * 1.3 * PENDANT, 64), n)
    u = min(1.0, max(0.0, (growth - 0.3) / 0.65))
    w = u * u * (3 - 2 * u)
    pts = [c.lerp(f, w) for c, f in zip(cap, full)]
    pts[-1].x = 0.0
    return pts


def drip_profile(growth=1.0):
    """The serum in a dripping pipette as one watertight volume, in the pipette's own space: the hanging drop pinned on
    the tip's outer rim, then just inside the glass round the fire-polished lip, up the bore to the column's meniscus.
    One surface throughout: no film on the outside of the tip, no internal face at the orifice, no rim inside the drop."""
    rim = TIP + LIP
    outside = [Vector((p.x, rim + p.y)) for p in reversed(drop_outline(growth))]
    outside[-1] = Vector((TIP_R + SKIN, rim))
    bore = [Vector((p.x - SKIN, p.y)) for p in pipette_inner()[1:] if p.y < COLUMN_TOP]
    rw = bore[-1].x
    surface = [Vector((rw * (1 - i / 24), COLUMN_TOP - 0.03 * (1 - math.exp(-(i / 24) * 4)) / (1 - math.exp(-4)))) for i in range(1, 25)]
    surface[-1].x = 0.0
    return Tagged((outside, DRY), ([*wet_lip(), *bore, Vector((rw, COLUMN_TOP))], WET), (surface, DRY))


def sphere_profile(n=96):
    return [Vector((math.sin(math.pi * i / n), -math.cos(math.pi * i / n))) for i in range(n + 1)]


def bead_mesh(name, rise=0.33, rings=56, segments=192):
    """A bead of serum on stone (contact angle about 33°) with a faintly irregular wetted edge, closed underneath."""
    big = (1 + rise * rise) / (2 * rise)

    def noise(a):
        return 0.55 * math.sin(2 * a + 1.1) + 0.3 * math.sin(3 * a + 2.4) + 0.15 * math.sin(5 * a + 0.3)

    verts = [(0.0, 0.0, rise)]
    for r in range(1, rings + 1):
        t = math.sin((r / rings) * math.pi / 2)
        for s in range(segments):
            a = 2 * math.pi * s / segments
            edge = 1 + 0.035 * noise(a)
            h = max(0.0, math.sqrt(big * big - t * t) - (big - rise))
            verts.append((math.cos(a) * t * edge, math.sin(a) * t * edge, h))
    under = -0.025
    rim0 = 1 + (rings - 1) * segments
    for s in range(segments):
        x, y, _ = verts[rim0 + s]
        verts.append((x, y, under))
    verts.append((0.0, 0.0, under))
    at = lambda r, s: 1 + (r - 1) * segments + (s % segments)  # noqa: E731
    faces = [(0, at(1, s), at(1, s + 1)) for s in range(segments)]
    for r in range(1, rings):
        for s in range(segments):
            faces.append((at(r, s), at(r + 1, s), at(r + 1, s + 1), at(r, s + 1)))
    base = rim0 + segments
    for s in range(segments):
        k = (s + 1) % segments
        faces.append((rim0 + s, base + s, base + k, rim0 + k))
        faces.append((base + s, base + segments, base + k))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    _finish(mesh, True)
    return bpy.data.objects.new(name, mesh)



def block(name, size, bevel=0.02):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = bevel
    mod.segments = 4
    mod.limit_method = "NONE"
    mod.harden_normals = True
    return obj


def pebble(name, size, seed):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=5, radius=1.0)
    for v in bm.verts:
        n = v.co.normalized()
        wobble = 1 + 0.06 * math.sin(3.1 * n.x + seed) * math.cos(2.3 * n.y - seed) + 0.03 * math.sin(5.7 * n.z + 2 * seed)
        v.co = Vector((n.x * size[0], n.y * size[1], max(n.z, -0.55) * size[2])) * wobble
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    return bpy.data.objects.new(name, mesh)


def plane(name, w, h):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], [], [(0, 1, 2, 3)])
    uv = mesh.uv_layers.new(name="UVMap")
    for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = c
    return bpy.data.objects.new(name, mesh)
