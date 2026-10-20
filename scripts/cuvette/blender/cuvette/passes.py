import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

from .common import b

# Mesh name prefixes whose light can have crossed serum: bottle, dropper, drops.
REACH = ("glass", "serum", "collar", "bulb", "pipette", "column", "drip", "falling", "bead")


def world(obj):
    """An object's world matrix from its parent chain: the print sleeves sit in a collection the active view layer
    excludes, so their own matrix_world is never re-evaluated as the bottles move."""
    m = obj.matrix_basis
    while obj.parent is not None:
        m = obj.parent.matrix_basis @ obj.matrix_parent_inverse @ m
        obj = obj.parent
    return m


def corners(obj):
    m = world(obj)
    return [m @ Vector(c) for c in obj.bound_box]


def border(stage, points, pad=0.03):
    """Normalised camera-frame box (x0, y0, x1, y1; origin bottom left) around world points, padded and clamped."""
    v = [world_to_camera_view(stage.scene, stage.camera, p) for p in points]
    v = [q for q in v if q.z > 0]
    x0, x1 = min(q.x for q in v) - pad, max(q.x for q in v) + pad
    y0, y1 = min(q.y for q in v) - pad, max(q.y for q in v) + pad
    return max(0.0, x0), max(0.0, y0), min(1.0, x1), min(1.0, y1)


def serum_reach(stage):
    """Everything light through serum can reach: bottles, dropper, drops and the stone around each base (the caustic
    and its reflection in the honed top)."""
    pts = []
    for obj in stage.scene.objects:
        if obj.type == "MESH" and not obj.hide_render and obj.name.split("-")[0] in REACH:
            pts += corners(obj)
    for bot in stage.bottles:
        at = bot["root"].matrix_world.translation
        pts += [at + b((x, 0.0, z)) for x in (-1.5, 1.5) for z in (-0.9, 1.1)]
    return pts


def labelled(stage):
    return [p for obj in stage.labels.objects for p in corners(obj)]


def bordered(stage, box, layers, target, dof, **kw):
    r = stage.scene.render
    r.use_border, r.use_crop_to_border = box is not None, False
    if box:
        r.border_min_x, r.border_min_y, r.border_max_x, r.border_max_y = box
    stage._pass(layers, target, dof, **kw)
    r.use_border = False


def render_passes(stage, raw, name, samples, light_samples, pad=0.03):
    """The stage's passes split by reach, in half float except the coordinates: the dark layer over the whole frame,
    serum light inside a border around everything serum can light, the print's light and the glass's front reflection
    inside a border around the print, and the print's coordinates there at twice the size with no pixel filter. Lens
    shots blur the serum layers (`pad` widens their border for it); the print layers stay pinhole."""
    im = stage.scene.render.image_settings
    dof = stage.camera.data.dof.use_dof
    stage.views["front"].samples = max(8, samples // 2)
    stage.views["label"].samples = light_samples
    bpy.context.view_layer.update()
    reach, print_box = border(stage, serum_reach(stage), pad), border(stage, labelled(stage), pad=0.01)
    lit = ["light", "absorb"] if len(stage.bottles) > 1 else ["light"]
    im.color_depth = "16"
    # The glass's front reflection goes back over the print, so it is lensed like the photograph it sits on.
    bordered(stage, None, ["dark", "front"] if dof else ["dark"], raw / f"{name}.exr", dof)
    bordered(stage, reach, lit, raw / f"{name}.light.exr", dof)
    bordered(stage, print_box, ["label"] if dof else ["front", "label"], raw / f"{name}.label.exr", False)
    im.color_depth = "32"
    bordered(stage, print_box, ["uv"], raw / f"{name}.uv.exr", False, scale=200, filter_width=0.01, adaptive=False)
    stage.camera.data.dof.use_dof = dof
    stage.scene.render.resolution_percentage = 100
    stage.scene.cycles.filter_width = 1.5
    stage.scene.cycles.use_adaptive_sampling = True
    for vl in stage.views.values():
        vl.use = True
    return {"reach": reach, "print": print_box}
