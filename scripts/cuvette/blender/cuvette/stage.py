import math
import time

import bpy
from mathutils import Vector

from . import geo, look
from .common import CAMERAS, RIG, b, between, deg, lerp, look_at, smooth, srgb

D = CAMERAS["dropper"]
LABEL = CAMERAS["label"]
PLINTH = CAMERAS["plinth"]
WALL = CAMERAS["wall"]

# Real optics at this scale: one unit is 26 mm, and Cycles sizes the aperture from the focal length in metres.
UNIT_MM = 26.0
DROP_GAIN = 1.6
RESIDUAL = 0.06  # The bead left on the tip, as a fraction of a full drop's growth.
CHANNELS = [(1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)]
# Group shots stand the bottles apart, staggered in depth and each turned its own way, so mould lines, surface waver
# and highlights differ from bottle to bottle.
# Real bottles are never filled to the same hairline, so the fill drifts a little from bottle to bottle.
PLACES = {
    "trio": [
        {"x": -1.6, "z": -0.62, "turn": deg(-13), "fill": 1.45},
        {"x": 0.0, "z": -0.26, "turn": deg(5), "fill": 1.49},
        {"x": 1.58, "z": -0.44, "turn": deg(9), "fill": 1.43},
    ],
    "pair": [{"x": -0.86, "z": 0.12, "turn": deg(-9)}, {"x": 0.86, "z": -0.3, "turn": deg(13)}],
}


def fstop(real):
    return real * UNIT_MM / 1000


class Stage:
    """The darkroom set with one, two or three bottles, ready to pose and photograph."""

    def __init__(self, layout="single", pebbles=False):
        self.layout = layout
        # How much lower than the sequence the dropper hangs for the dose (the drop macro frames it over the serum).
        self.hang_drop = 0.0
        self.softboxes = []
        self.scene = bpy.context.scene
        self._reset()
        places = PLACES.get(layout) or CAMERAS["places"][layout]
        self.labels = bpy.data.collections.new("labels")
        self.scene.collection.children.link(self.labels)
        self._render_settings()
        self._world()
        self._set(pebbles)
        self._lights()
        self.bottles = [self._bottle(i, place) for i, place in enumerate(places)]
        self.camera = self._camera()
        self._layers()
        self.pose(0.0)

    # Scene plumbing.

    def _reset(self):
        for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.lights, bpy.data.cameras, bpy.data.materials, bpy.data.images, bpy.data.collections):
            for item in list(coll):
                coll.remove(item)
        self.root = self.scene.collection

    def add(self, obj, parent=None):
        self.root.objects.link(obj)
        if parent is not None:
            obj.parent = parent
        return obj

    def empty(self, name, parent=None, location=(0, 0, 0)):
        e = bpy.data.objects.new(name, None)
        e.location = location
        return self.add(e, parent)

    def _render_settings(self):
        s = self.scene
        s.render.engine = "CYCLES"
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        c = s.cycles
        c.device = "GPU"
        c.samples = 256
        c.use_adaptive_sampling = True
        c.adaptive_threshold = 0.012
        c.adaptive_min_samples = 24
        c.use_denoising = True
        c.denoiser = "OPENIMAGEDENOISE"
        c.denoising_input_passes = "RGB_ALBEDO_NORMAL"
        c.denoising_prefilter = "ACCURATE"
        if hasattr(c, "denoising_use_gpu"):
            c.denoising_use_gpu = True
        c.max_bounces = 18
        c.diffuse_bounces = 2
        c.glossy_bounces = 4
        c.transmission_bounces = 16
        c.volume_bounces = 0
        c.transparent_max_bounces = 8
        c.caustics_reflective = True
        c.caustics_refractive = True
        c.blur_glossy = 0.4
        c.sample_clamp_direct = 0
        c.sample_clamp_indirect = 12
        c.use_light_tree = True
        s.render.use_persistent_data = True
        s.render.film_transparent = False
        # Linear passes for every view layer in one file; the compositor tone-maps, never Blender.
        im = s.render.image_settings
        im.media_type = "MULTI_LAYER_IMAGE"
        im.file_format = "OPEN_EXR_MULTILAYER"
        im.color_depth = "32"
        im.exr_codec = "ZIP"
        vs = s.view_settings
        vs.view_transform = "AgX"
        for name in ("AgX - Medium High Contrast", "Medium High Contrast", "AgX - Base Contrast", "None"):
            try:
                vs.look = name
                break
            except TypeError:
                continue
        vs.exposure = 0.0
        vs.gamma = 1.0

    def _world(self):
        w = bpy.data.worlds.get("darkroom") or bpy.data.worlds.new("darkroom")
        try:
            w.use_nodes = True
        except AttributeError:
            pass
        bg = w.node_tree.nodes.get("Background")
        bg.inputs["Color"].default_value = (RIG["world"],) * 3 + (1,)
        bg.inputs["Strength"].default_value = 1.0
        self.scene.world = w

    # The set.

    def _set(self, pebbles):
        width = PLINTH[self.layout]
        plinth = self.add(geo.block("plinth", (width, PLINTH["depth"], PLINTH["height"]), bevel=0.068))
        plinth.location = b((0, -PLINTH["height"] / 2, PLINTH["z"]))
        plinth.data.materials.append(look.basalt())

        wall = self.add(geo.plane("wall", WALL["width"], WALL["height"]))
        wall.location = b((0, WALL["y"], WALL["z"]))
        wall.rotation_euler = (deg(90), 0, 0)
        wall.data.materials.append(look.plaster())

        floor = self.add(geo.plane("floor", 40, 20))
        floor.location = b((0, -PLINTH["height"], 4))
        floor.data.materials.append(look.matte("floor", "#151515"))

        if pebbles and self.layout == "single":
            for name, size, at, turn, tone in (
                ("pebble-a", (0.2, 0.15, 0.085), (-1.12, 0.07, -0.62), 0.6, "#404040"),
                ("pebble-b", (0.12, 0.1, 0.06), (-0.88, 0.05, -0.85), 2.2, "#585858"),
            ):
                p = self.add(geo.pebble(name, size, turn))
                p.location = b(at)
                p.rotation_euler = (0, 0, turn)
                p.data.materials.append(look.pebble_stone(name, tone))

    def _area(self, name, size, power, colour="#ffffff", camera=False, diffuse=True, glossy=True, spread=None):
        light = bpy.data.lights.new(name, "AREA")
        light.shape = "RECTANGLE"
        light.size, light.size_y = size
        light.energy = power
        light.color = srgb(colour)[:3]
        if spread is not None:
            light.spread = spread
        obj = self.add(bpy.data.objects.new(name, light))
        obj.visible_camera = camera
        obj.visible_diffuse = diffuse
        obj.visible_glossy = glossy
        return obj

    def _lights(self):
        """The rig from rig.json: one key pool, rim strips the glass sees but the set doesn't, a halo on the wall."""
        for spec in RIG["lights"]:
            if spec["type"] == "SOFTBOX":
                self.softboxes.append(self._softbox(spec))
                continue
            light = bpy.data.lights.new(spec["name"], spec["type"])
            light.energy = spec["energy"]
            light.color = srgb(spec.get("colour", "#ffffff"))[:3]
            if spec["type"] == "SPOT":
                light.spot_size = deg(spec["spot"])
                light.spot_blend = spec["blend"]
                light.shadow_soft_size = spec["soft"]
            else:
                light.shape = "RECTANGLE"
                light.size, light.size_y = spec["size"]
                if "spread" in spec:
                    light.spread = deg(spec["spread"])
            obj = self.add(bpy.data.objects.new(spec["name"], light))
            obj.location = b(spec["at"])
            look_at(obj, b(spec["aim"]))
            obj.visible_camera = spec.get("camera", False)
            obj.visible_diffuse = spec.get("diffuse", True)
            obj.visible_glossy = spec.get("glossy", True)
            obj.visible_transmission = spec.get("transmission", True)

    def _softbox(self, spec):
        """A strip softbox as an emitting panel, so its face can fall off like a real one (see look.softbox)."""
        w, h = spec["size"]
        panel = geo.plane(spec["name"], w, h)
        panel.data.polygons[0].flip()
        panel.data.materials.append(look.softbox(spec["name"], spec["strength"]))
        obj = self.add(panel)
        obj.location = b(spec["at"])
        look_at(obj, b(spec["aim"]))
        obj.visible_camera = False
        obj.visible_shadow = False
        obj.visible_volume_scatter = False
        obj.visible_diffuse = spec.get("diffuse", True)
        obj.visible_glossy = spec.get("glossy", True)
        obj.visible_transmission = spec.get("transmission", True)
        return obj

    def _glow(self, i, root):
        """A cut card behind the bottle, lit hottest low in the middle: what the serum glows against. It is invisible to
        the lens and re-aimed for every camera so the bottle always hides it."""
        g = RIG["glow"]
        card = geo.plane(f"glow-{i}", g["width"], g["height"])
        self.add(card, root)
        # Only rays through the glass see it; the set never receives its light, so it leaves no edge on the wall.
        card.visible_camera = False
        card.visible_diffuse = False
        card.visible_glossy = False
        card.visible_volume_scatter = False
        card.visible_shadow = False
        card.data.materials.append(bpy.data.materials.get("glow") or look.glow(g["centre"], g["sigma"], g["strength"]))
        return card

    # The bottles.

    def _bottle(self, i, place):
        origin = b((place["x"], 0, place["z"]))
        root = self.empty(f"place-{i}", location=origin)
        spinner = self.empty(f"spinner-{i}", root)
        spinner.rotation_euler = (0, 0, place["turn"])
        chan = CHANNELS[i]

        def part(obj, mat, parent, collection=None, serum=False, gain=1.0):
            (collection or self.root).objects.link(obj)
            obj.parent = parent
            obj.pass_index = i + 1
            mats = mat if isinstance(mat, list) else [mat]
            for m in mats:
                obj.data.materials.append(m)
            if len(mats) == 1:
                obj.data.polygons.foreach_set("material_index", [0] * len(obj.data.polygons))
            if serum:
                obj["chan"] = chan
                obj["gain"] = gain
            return obj

        glass_profile, _, serum_side = geo.bottle_profiles()
        glass_mat = bpy.data.materials.get("glass") or look.glass()
        serum_mat = bpy.data.materials.get("serum") or look.serum()
        part(geo.lathe(f"glass-{i}", glass_profile, 288), glass_mat, spinner)
        part(geo.thread_mesh(f"thread-{i}"), glass_mat, spinner)
        # Seated, the serum parts round the pipette; with the dropper lifted out it closes over.
        fill = place.get("fill", geo.FILL)
        seated = part(geo.lathe(f"serum-seated-{i}", geo.serum_profile(serum_side, fill, around_pipette=True), 256), serum_mat, spinner, serum=True)
        lifted = part(geo.lathe(f"serum-{i}", geo.serum_profile(serum_side, fill), 256), serum_mat, spinner, serum=True)
        card_from = b(RIG["print_card"]["from"])
        sleeve_mat = bpy.data.materials.get("sleeve") or look.sleeve(card_from, RIG["print_card"]["strength"], LABEL)
        part(geo.label_mesh(f"label-{i}", LABEL), sleeve_mat, spinner, self.labels)

        rig = self.empty(f"dropper-{i}", root)
        rig.rotation_mode = "XYZ"
        part(geo.lathe(f"collar-{i}", geo.collar_profile(), 192, closed=False), bpy.data.materials.get("steel") or look.steel(), rig)
        bulb = part(geo.lathe(f"bulb-{i}", geo.bulb_profile(), 192), bpy.data.materials.get("rubber") or look.rubber(), rig)
        bulb.rotation_euler = (0, 0, place["turn"] * 2.3 + 0.7 * i)
        tube_profile, column_profile = geo.pipette_profiles()
        # The drawn pipette is thin enough that its tint is invisible, and leaving it out keeps its clear wetted faces
        # off any volume boundary.
        dry = bpy.data.materials.get("pipette") or look.glass("pipette", 0.006, moulded=False, tinted=False)
        wet = bpy.data.materials.get("pipette-wet") or look.wet_glass()
        pipette = part(geo.lathe(f"pipette-{i}", tube_profile, 160, loop=True), [dry, wet, wet], rig)
        column = part(geo.lathe(f"column-{i}", column_profile, 128), serum_mat, rig, serum=True, gain=DROP_GAIN)
        drip = part(geo.lathe(f"drip-{i}", geo.drip_profile(1.0), 192), serum_mat, rig, serum=True, gain=DROP_GAIN)
        falling = part(geo.lathe(f"falling-{i}", geo.sphere_profile(), 128), serum_mat, root, serum=True, gain=DROP_GAIN)
        bead = part(geo.bead_mesh(f"bead-{i}"), serum_mat, root, serum=True, gain=DROP_GAIN)

        # The backlight card the serum glows against: always behind the bottle as seen from the lens, so the
        # bottle hides it, exactly as a cut card hidden behind a bottle on a real set.
        card = self._glow(i, root)
        drops = bpy.data.collections.new(f"drops-{i}")
        for obj in (drip, falling, bead):
            drops.objects.link(obj)
        dose_card, dose_light = self._dose_lights(i, drops)
        return {"root": root, "spinner": spinner, "turn": place["turn"], "rig": rig, "falling": falling, "bead": bead, "card": card, "column": column, "drip": drip, "growth": 1.0, "seated": seated, "lifted": lifted, "dose_card": dose_card, "dose_light": dose_light, "pipette": pipette, "glass": (dry, wet)}

    def _dose_lights(self, i, drops):
        """What a photographer adds for the dose: a small backlight card behind the hanging drop (seen only through it
        and the pipette, so the serum glows with a bright core) and a small strip that puts one clean highlight on the
        drop, the falling drop and the bead, linked to them alone."""
        d = RIG["dose"]
        card = geo.plane(f"dose-card-{i}", *d["card"]["size"])
        self.add(card)
        for flag in ("visible_camera", "visible_diffuse", "visible_glossy", "visible_volume_scatter", "visible_shadow"):
            setattr(card, flag, False)
        c = d["card"]
        card.data.materials.append(bpy.data.materials.get("dose-glow") or look.glow(c["centre"], c["sigma"], c["strength"], "dose-glow"))
        light = bpy.data.lights.new(f"dose-light-{i}", "AREA")
        light.shape = "RECTANGLE"
        light.size, light.size_y = d["light"]["size"]
        light.energy = d["light"]["energy"]
        obj = self.add(bpy.data.objects.new(f"dose-light-{i}", light))
        obj.visible_diffuse = False
        obj.light_linking.receiver_collection = drops
        return card, obj

    def _layers(self):
        """Lensed (DOF, denoised): dark (serum absorbs everything, no print), light (+ absorb for groups: light through
        each bottle's serum by channel), front (front-surface reflection of the bottle glass only).
        Pinhole: label (light falling on the print, denoised) and, at twice the size with no pixel filter, uv (the
        print's exact coordinates, owner, facing and depth)."""
        s = self.scene
        base = s.view_layers[0]
        for stale in list(s.view_layers)[1:]:
            s.view_layers.remove(stale)
        for aov in list(base.aovs):
            base.aovs.remove(aov)
        base.name = "dark"
        names = ["light", "front", "label", "uv"] + (["absorb"] if len(self.bottles) > 1 else [])
        views = {"dark": base, **{n: s.view_layers.new(n) for n in names}}
        single = 1.0 if len(self.bottles) == 1 else 0.0
        for name, vl in views.items():
            for flag in ("dark", "light", "absorb", "front", "uv"):
                vl[flag] = 1.0 if flag == name else 0.0
            vl["single"] = single
            vl.use_pass_combined = True
            vl.cycles.use_denoising = name != "uv"
            vl.layer_collection.children["labels"].exclude = name not in ("label", "uv")
        uv = views["uv"]
        for aov_name, kind in (("luv", "COLOR"), ("nv", "VALUE"), ("owner", "VALUE"), ("z", "VALUE")):
            a = uv.aovs.add()
            a.name, a.type = aov_name, kind
        views["label"].samples = 48
        uv.samples = 4
        self.views = views

    def lens(self):
        """What the packer needs to turn the uv layer's depth into a circle of confusion."""
        d = self.camera.data
        s = self.scene.render
        vertical = d.sensor_fit == "VERTICAL"
        return {
            "dof": d.dof.use_dof,
            "fstop": d.dof.aperture_fstop,
            "focus": d.dof.focus_distance,
            "lens_mm": d.lens,
            "fov": d.angle_y if vertical else d.angle_x,
            "span_px": s.resolution_y if vertical else s.resolution_x,
        }

    def _pass(self, layers, target, dof, scale=100, filter_width=1.5, adaptive=True):
        for name, vl in self.views.items():
            vl.use = name in layers
        self.camera.data.dof.use_dof = dof
        r = self.scene.render
        r.resolution_percentage = scale
        self.scene.cycles.filter_width = filter_width
        self.scene.cycles.use_adaptive_sampling = adaptive
        r.filepath = str(target)
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"PASS {'+'.join(layers)} {r.resolution_x * scale // 100}x{r.resolution_y * scale // 100} {time.time() - t0:.1f}s", flush=True)

    def render(self, target, label_target, uv_target, samples):
        """Three passes: the lensed layers, the print's light (pinhole), and its coordinates at 2x with no pixel filter,
        so averaging never mixes coordinates across a glyph edge. The compositor lens-blurs the print itself."""
        dof = self.camera.data.dof.use_dof
        self.views["front"].samples = max(32, samples // 2)
        lensed = ["dark", "light", "absorb", "front"]
        self._pass(lensed, target, dof)
        self._pass(["label"], label_target, False)
        self._pass(["uv"], uv_target, False, scale=200, filter_width=0.01, adaptive=False)
        self.camera.data.dof.use_dof = dof
        self.scene.render.resolution_percentage = 100
        self.scene.cycles.filter_width = 1.5
        self.scene.cycles.use_adaptive_sampling = True
        for vl in self.views.values():
            vl.use = True

    # Posing.

    def pose(self, p, animated=None):
        """Places dropper and drops as the homepage does at scroll progress `p`."""
        animated = self.layout == "single" if animated is None else animated
        for bot in self.bottles:
            q = p if animated else 0.0
            ph = D["phases"]
            lift = smooth(between(q, *ph["lift"]))
            shift = smooth(between(q, *ph["shift"]))
            lower = smooth(between(q, *ph["lower"]))
            raise_ = smooth(between(q, *ph["raise"]))
            back = smooth(between(q, *ph["back"]))
            seat = smooth(between(q, *ph["seat"]))
            height = D["lift"] * lift * (1 - seat) - (D["lower"] + self.hang_drop) * lower * (1 - raise_)
            side = shift * (1 - back)
            x, z, tilt = D["hang"][0] * side, D["hang"][2] * side, D["tilt"] * side
            bot["rig"].location = b((x, height, z))
            sits = abs(height) < 1e-4 and side < 1e-4
            bot["seated"].hide_render = bot["seated"].hide_viewport = not sits
            bot["lifted"].hide_render = bot["lifted"].hide_viewport = sits
            bot["rig"].rotation_euler = (0, -tilt, 0)

            tip_x = x - geo.TIP * math.sin(tilt)
            tip_y = height + geo.TIP * math.cos(tilt)
            dp = D["drop_phases"]
            grow, fall, spread = between(q, *dp["grow"]), between(q, *dp["fall"]), smooth(between(q, *dp["spread"]))
            # Out of the bottle the tip always carries serum: a bead on the rim that swells into the drop, and after
            # the drop lets go, the bead it leaves behind.
            hanging = animated and not sits
            growth = RESIDUAL + (1 - RESIDUAL) * smooth(grow) if fall == 0 else RESIDUAL
            bot["pipette"].data.materials[geo.IMMERSED] = bot["glass"][1 if sits else 0]
            # Seated, the column is the bottle's own serum; only out of the bottle is it judged as a drop is.
            bot["column"]["gain"] = 1.0 if sits else DROP_GAIN
            if hanging and abs(bot["growth"] - growth) > 1e-4:
                old = bot["drip"].data
                bot["drip"].data = geo.lathe("drip", geo.drip_profile(growth), 192).data
                bot["drip"].data.materials.append(old.materials[0])
                bot["drip"].data.polygons.foreach_set("material_index", [0] * len(bot["drip"].data.polygons))
                bot["growth"] = growth
            bot["drip"].hide_render = bot["drip"].hide_viewport = not hanging
            bot["column"].hide_render = bot["column"].hide_viewport = hanging
            dosing = animated and between(q, *ph["lower"]) > 0 and between(q, *ph["raise"]) < 1
            bot["drop_at"] = b((tip_x, tip_y - 1.1 * geo.PENDANT, z)) if dosing else None

            fallen = bot["falling"]
            fallen.hide_render = fallen.hide_viewport = not (animated and 0 < fall < 1)
            start = tip_y - 1.3 * D["drop"]
            fallen.location = b((tip_x, start - fall * fall * (start - D["drop"]), z))
            stretch = 1 + 0.12 * math.sin(math.pi * fall)
            fallen.scale = (D["drop"] / math.sqrt(stretch), D["drop"] / math.sqrt(stretch), D["drop"] * stretch)

            land = (D["hang"][0] - geo.TIP * math.sin(D["tilt"]), 0.0, D["hang"][2])
            bead = bot["bead"]
            bead.hide_render = bead.hide_viewport = not (animated and spread > 0)
            bead.location = b(land)
            bead.scale = (D["bead"]["radius"] * (0.45 + 0.55 * spread),) * 3
        self.aim_dose()

    def aim_dose(self):
        """Keeps the dose card straight behind the hanging drop as seen from the lens, and the drop's strip above and to
        the right of the lens, so the highlight always lands on the drop's shoulder."""
        eye = self.camera.location
        d = RIG["dose"]
        for bot in self.bottles:
            at = bot.get("drop_at")
            for obj in (bot["dose_card"], bot["dose_light"]):
                obj.hide_render = obj.hide_viewport = at is None
            if at is None:
                continue
            away = (at - eye).normalized()
            right = away.cross(Vector((0, 0, 1))).normalized()
            up = right.cross(away)
            card = bot["dose_card"]
            card.location = at + away * d["card"]["behind"] + up * d["card"]["rise"]
            look_at(card, card.location - away)
            light = bot["dose_light"]
            ox, oy, oz = d["light"]["offset"]
            light.location = at + right * ox + up * oy - away * oz
            look_at(light, at)

    def aim_cards(self):
        self.aim_dose()
        eye = self.camera.location
        for bot in self.bottles:
            centre = bot["root"].matrix_world.translation
            to_cam = Vector((eye.x - centre.x, eye.y - centre.y, 0)).normalized()
            card = bot["card"]
            g = RIG["glow"]
            card.location = Vector((-to_cam.x * g["distance"], -to_cam.y * g["distance"], g["y"]))
            look_at(card, card.location - to_cam)

    def _camera(self):
        cam = bpy.data.cameras.new("lens")
        cam.clip_start = 0.05
        cam.clip_end = 80
        obj = self.add(bpy.data.objects.new("lens", cam))
        self.scene.camera = obj
        return obj

    def frame(self, eye, target, fov, size, shift=(0.0, 0.0), fit="VERTICAL", focus=None, f_number=None):
        """A live-scene camera: `fov` is vertical (three.js) unless fit is HORIZONTAL; shift is three.js's lens shift."""
        s = self.scene
        s.render.resolution_x, s.render.resolution_y = size
        s.render.resolution_percentage = 100
        cam = self.camera
        cam.location = b(eye)
        look_at(cam, b(target))
        data = cam.data
        data.sensor_fit = fit
        data.sensor_width, data.sensor_height = 36, 24
        if fit == "VERTICAL":
            data.angle_y = deg(fov)
        else:
            data.angle_x = deg(fov)
        w, h = size
        big = max(w, h)
        data.shift_x = -shift[0] * w / big
        data.shift_y = -shift[1] * h / big
        data.dof.use_dof = focus is not None
        if focus is not None:
            forward = (b(target) - b(eye)).normalized()
            data.dof.focus_distance = (b(focus) - b(eye)).dot(forward)
            data.dof.aperture_fstop = fstop(f_number or 11)
            data.dof.aperture_blades = 9
            data.dof.aperture_rotation = deg(10)
        self.aim_cards()


def chapter_lens(p, path="wide"):
    frames = CAMERAS["chapters"][path]
    scaled = min(1.0, max(0.0, p)) * (len(frames) - 1)
    i = min(len(frames) - 2, math.floor(scaled))
    t = smooth(scaled - i)
    a, c = frames[i], frames[i + 1]
    return {
        "eye": [lerp(a["eye"][k], c["eye"][k], t) for k in range(3)],
        "look": [lerp(a["look"][k], c["look"][k], t) for k in range(3)],
        "fov": lerp(a["fov"], c["fov"], t),
        "shift": [lerp(a["shift"][k], c["shift"][k], t) for k in range(2)],
    }


def hero_frame(stage, p, size):
    """The homepage camera at progress `p`, widened to a square that holds both the desktop and the phone crop."""
    lens = chapter_lens(p)
    crops = CAMERAS["hero"]["crops"]
    desk = crops["desktop"]
    hfov = math.degrees(2 * math.atan(1.6 * math.tan(math.radians(lens["fov"]) / 2) / desk["w"]))
    # Where the live desktop frame puts its target, measured across the square.
    across = desk["x"] + desk["w"] * (0.5 + lens["shift"][0])
    shift = (across - 0.5, lens["shift"][1] * desk["h"])
    stage.frame(lens["eye"], lens["look"], hfov, (size, size), shift=shift, fit="HORIZONTAL")
    stage.pose(p)
    return lens
