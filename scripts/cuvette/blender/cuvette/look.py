import bpy

from .common import TEXTURES, srgb
from .optics import DARK, SIGMA

# Light that crossed serum is isolated by channel: in the `light` layer each bottle's serum passes only its own channel
# (bottle i → channel i) and blocks the rest, so `light − dark` is the light through each bottle, caustics included.
# The `absorb` layer repeats that with SIGMA per unit of grey absorption, so absorb / light = exp(−SIGMA·d) gives the
# optical path d through serum per pixel. A single bottle needs one layer: R passes clear, G absorbs SIGMA.


class Graph:
    def __init__(self, name):
        self.mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        try:
            self.mat.use_nodes = True
        except AttributeError:
            pass
        self.nt = self.mat.node_tree
        self.nt.nodes.clear()
        self.out = self.node("ShaderNodeOutputMaterial")
        self.out.target = "CYCLES"

    def node(self, kind, **props):
        n = self.nt.nodes.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.nt.links.new(a, b)

    def principled(self, **inputs):
        p = self.node("ShaderNodeBsdfPrincipled")
        for k, v in inputs.items():
            self.set(p.inputs[k], v)
        return p

    def set(self, socket, value):
        if isinstance(value, bpy.types.NodeSocket):
            self.link(value, socket)
        else:
            socket.default_value = value

    def math(self, op, a, c=None, clamp=False):
        n = self.node("ShaderNodeMath", operation=op, use_clamp=clamp)
        self.set(n.inputs[0], a)
        if c is not None:
            self.set(n.inputs[1], c)
        return n.outputs[0]

    def mix_colour(self, fac, a, c):
        n = self.node("ShaderNodeMix", data_type="RGBA")
        colours = [s for s in n.inputs if s.type == "RGBA"]
        self.set(n.inputs[0], fac)
        self.set(colours[0], a)
        self.set(colours[1], c)
        return next(s for s in n.outputs if s.type == "RGBA")

    def mix_shader(self, fac, a, c):
        m = self.node("ShaderNodeMixShader")
        self.set(m.inputs[0], fac)
        self.link(a.outputs[0] if hasattr(a, "outputs") else a, m.inputs[1])
        self.link(c.outputs[0] if hasattr(c, "outputs") else c, m.inputs[2])
        return m

    def layer(self, name):
        """A float custom property of the view layer being rendered (0 when unset)."""
        return self.node("ShaderNodeAttribute", attribute_type="VIEW_LAYER", attribute_name=name).outputs["Fac"]

    def object_attr(self, name):
        return self.node("ShaderNodeAttribute", attribute_type="OBJECT", attribute_name=name)

    def coords(self):
        xyz = self.node("ShaderNodeSeparateXYZ")
        self.link(self.node("ShaderNodeTexCoord").outputs["Object"], xyz.inputs[0])
        return xyz

    def surface(self, shader, front=None):
        """Camera rays obey the data layers: `front` sees only the front-surface reflection of the bottle glass (all
        else holdout), `uv` sees holdout everywhere (the print sleeve writes its coordinates as AOVs)."""
        camera = self.node("ShaderNodeLightPath").outputs["Is Camera Ray"]
        hold = self.node("ShaderNodeHoldout")
        in_front = self.mix_shader(self.math("MULTIPLY", self.layer("front"), camera), shader, front or hold)
        final = self.mix_shader(self.math("MULTIPLY", self.layer("uv"), camera), in_front, self.node("ShaderNodeHoldout"))
        self.link(final.outputs[0], self.out.inputs["Surface"])

    def volume(self, shader):
        self.link(shader.outputs[0], self.out.inputs["Volume"])

    def serum_volume(self):
        single = self.layer("single")
        absorb = self.layer("absorb")
        active = self.math("ADD", self.math("ADD", self.layer("light"), absorb), self.layer("dark"))
        # A drop or a pipette's column is a few millimetres across: `gain` scales its optical path, as a photographer
        # would pick a denser batch for the macro, so the product's colour still reads in it.
        unit = self.math("MULTIPLY", self.object_attr("gain").outputs["Fac"], SIGMA / DARK)
        chan = self.object_attr("chan").outputs["Color"]
        dim = self.node("ShaderNodeVectorMath", operation="SCALE")
        self.link(chan, dim.inputs[0])
        self.set(dim.inputs["Scale"], self.math("SUBTRACT", 1.0, self.math("MULTIPLY", absorb, unit)))
        lone = self.node("ShaderNodeCombineXYZ")
        lone.inputs[0].default_value = 1.0
        self.set(lone.inputs[1], self.math("SUBTRACT", 1.0, unit))
        colour = self.mix_colour(single, dim.outputs[0], lone.outputs[0])
        colour = self.mix_colour(self.layer("dark"), colour, (0.0, 0.0, 0.0, 1.0))
        vol = self.node("ShaderNodeVolumeAbsorption")
        self.set(vol.inputs["Color"], colour)
        self.set(vol.inputs["Density"], self.math("MULTIPLY", active, DARK))
        self.volume(vol)

    def bump(self, height, strength=1.0, distance=1.0):
        b = self.node("ShaderNodeBump")
        b.inputs["Strength"].default_value = strength
        b.inputs["Distance"].default_value = distance
        self.link(height, b.inputs["Height"])
        return b.outputs[0]

    def ridge(self, value, centre, width):
        """exp(−((value − centre) / width)²): a thin raised line."""
        d = self.math("DIVIDE", self.math("SUBTRACT", value, centre), width)
        return self.math("EXPONENT", self.math("MULTIPLY", self.math("MULTIPLY", d, d), -1.0))

    def seam(self, xyz, at, width):
        """A two-part mould's parting line: thin ridges at `at` and opposite it, around the z axis."""
        angle = self.math("ARCTAN2", xyz.outputs[0], self.math("MULTIPLY", xyz.outputs[1], -1.0))
        a = self.ridge(self.math("SINE", self.math("SUBTRACT", angle, at)), 0.0, width)
        return a


def glass(name="glass", roughness=0.012, moulded=True, tinted=True):
    """Soda-lime glass: clear face-on, faintly green-grey through its thickness at the edges. A moulded bottle's
    surface wavers a little and carries a faint parting line; the drawn pipette is perfectly smooth."""
    g = Graph(name)
    normal = None
    if moulded:
        xyz = g.coords()
        waver = g.node("ShaderNodeTexNoise")
        waver.inputs["Scale"].default_value = 5.0
        waver.inputs["Detail"].default_value = 2.0
        g.link(g.node("ShaderNodeTexCoord").outputs["Object"], waver.inputs["Vector"])
        height = g.math("ADD", g.math("MULTIPLY", waver.outputs[0], 0.0012), g.math("MULTIPLY", g.seam(xyz, 1.92, 0.006), 0.0011))
        normal = g.bump(height)
    inputs = {"Base Color": (1, 1, 1, 1), "Roughness": roughness, "IOR": 1.5, "Transmission Weight": 1.0}
    if normal is not None:
        inputs["Normal"] = normal
    body = g.principled(**inputs)
    fresnel = g.node("ShaderNodeFresnel")
    fresnel.inputs["IOR"].default_value = 1.5
    mirror = g.node("ShaderNodeBsdfGlossy")
    mirror.inputs["Roughness"].default_value = roughness
    if normal is not None:
        g.link(normal, fresnel.inputs["Normal"])
        g.link(normal, mirror.inputs["Normal"])
    front = g.mix_shader(fresnel.outputs[0], g.node("ShaderNodeHoldout"), mirror)
    g.surface(body, front if moulded else None)
    if not tinted:
        return g.mat
    vol = g.node("ShaderNodeVolumeAbsorption")
    # Neutral in the serum-light layers so their channels compare like for like.
    data = g.math("ADD", g.layer("light"), g.layer("absorb"), clamp=True)
    g.set(vol.inputs["Color"], g.mix_colour(data, (0.86, 0.95, 0.95, 1), (0.93, 0.93, 0.93, 1)))
    vol.inputs["Density"].default_value = 1.1
    g.volume(vol)
    return g.mat


def serum(name="serum"):
    """Serum against air, and, on the faces geo tags WET, serum against the pipette's glass (1.36 / 1.5: IOR is inside
    over outside); the glass face just beyond is clear (see wet_glass), so the wetted pipette all but vanishes, as in a
    real bottle. One material for both, so the serum has one volume shader and Cycles enters and leaves it cleanly."""
    g = Graph(name)
    air = g.principled(**{"Base Color": (1, 1, 1, 1), "Roughness": 0.0, "IOR": 1.36, "Transmission Weight": 1.0})
    glass_face = g.node("ShaderNodeBsdfGlass")
    glass_face.inputs["Roughness"].default_value = 0.0
    glass_face.inputs["IOR"].default_value = 1.36 / 1.5
    tag = g.node("ShaderNodeAttribute", attribute_type="GEOMETRY", attribute_name="tag").outputs["Fac"]
    g.surface(g.mix_shader(g.math("GREATER_THAN", tag, 0.5), air, glass_face))
    g.serum_volume()
    return g.mat


def wet_glass(name="pipette-wet"):
    """The pipette's face where serum wets it: the serum's skin beside it does the refracting."""
    g = Graph(name)
    g.surface(g.node("ShaderNodeBsdfTransparent"))
    return g.mat


def sleeve(card, strength, label):
    """The print area. In the label layer: white and matte for the light falling on the print, plus a print card from
    `card` (a flagged fill lighting nothing else). In the uv layer it writes the sheet's cylindrical coordinates
    (u around the arc, v up), its owner and how squarely it faces the lens, all exact, as AOVs."""
    g = Graph("sleeve")
    white = g.node("ShaderNodeBsdfDiffuse")
    white.inputs["Color"].default_value = (1, 1, 1, 1)
    geo = g.node("ShaderNodeNewGeometry")
    to_card = g.node("ShaderNodeVectorMath", operation="SUBTRACT")
    to_card.inputs[0].default_value = card
    g.link(geo.outputs["Position"], to_card.inputs[1])
    unit = g.node("ShaderNodeVectorMath", operation="NORMALIZE")
    g.link(to_card.outputs[0], unit.inputs[0])
    facing = g.node("ShaderNodeVectorMath", operation="DOT_PRODUCT")
    g.link(unit.outputs[0], facing.inputs[0])
    g.link(geo.outputs["Normal"], facing.inputs[1])
    fill = g.node("ShaderNodeEmission")
    g.set(fill.inputs["Strength"], g.math("MULTIPLY", g.math("MAXIMUM", facing.outputs["Value"], 0.0), strength))
    lit = g.node("ShaderNodeAddShader")
    g.link(white.outputs[0], lit.inputs[0])
    g.link(fill.outputs[0], lit.inputs[1])
    g.surface(lit)

    xyz = g.coords()
    angle = g.math("ARCTAN2", xyz.outputs[0], g.math("MULTIPLY", xyz.outputs[1], -1.0))
    u = g.math("DIVIDE", g.math("ADD", angle, label["arc"] / 2), label["arc"])
    v = g.math("DIVIDE", g.math("SUBTRACT", xyz.outputs[2], label["y"] - label["height"] / 2), label["height"])
    rgb = g.node("ShaderNodeCombineXYZ")
    g.link(u, rgb.inputs[0])
    g.link(v, rgb.inputs[1])
    rgb.inputs[2].default_value = 1.0
    luv = g.node("ShaderNodeOutputAOV", aov_name="luv")
    g.link(rgb.outputs[0], luv.inputs["Color"])
    nv = g.node("ShaderNodeVectorMath", operation="DOT_PRODUCT")
    g.link(geo.outputs["Normal"], nv.inputs[0])
    g.link(geo.outputs["Incoming"], nv.inputs[1])
    nv_aov = g.node("ShaderNodeOutputAOV", aov_name="nv")
    g.link(nv.outputs["Value"], nv_aov.inputs["Value"])
    z = g.node("ShaderNodeOutputAOV", aov_name="z")
    g.link(g.node("ShaderNodeCameraData").outputs["View Z Depth"], z.inputs["Value"])
    owner = g.node("ShaderNodeOutputAOV", aov_name="owner")
    g.link(g.node("ShaderNodeObjectInfo").outputs["Object Index"], owner.inputs["Value"])
    return g.mat


def glow(centre, sigma, strength, name="glow"):
    """A soft elliptical pool of light (centre and sigma in the card's UV) on an otherwise transparent card, so the
    card has no edge: where the pool dies away the real set behind it shows through."""
    g = Graph(name)
    uv = g.node("ShaderNodeSeparateXYZ")
    g.link(g.node("ShaderNodeTexCoord").outputs["UV"], uv.inputs[0])
    du = g.math("DIVIDE", g.math("SUBTRACT", uv.outputs[0], centre[0]), sigma[0])
    dv = g.math("DIVIDE", g.math("SUBTRACT", uv.outputs[1], centre[1]), sigma[1])
    falloff = g.math("EXPONENT", g.math("MULTIPLY", g.math("ADD", g.math("MULTIPLY", du, du), g.math("MULTIPLY", dv, dv)), -1.0))
    # Exactly zero well inside the card's border, so not even a faint step can reach the glass.
    alpha = g.math("DIVIDE", g.math("MAXIMUM", g.math("SUBTRACT", falloff, 0.004), 0.0), 0.996)
    em = g.node("ShaderNodeEmission")
    em.inputs["Strength"].default_value = strength
    g.surface(g.mix_shader(alpha, g.node("ShaderNodeBsdfTransparent"), em))
    return g.mat


def softbox(name, strength):
    """A strip softbox's face: brightest down its middle and rolling off across its width and towards both ends (a
    little more at the foot), so its reflection in glass holds detail instead of clipping to a flat bar, and its image
    folded through the pipette stays a soft line rather than a hot one burning through the print."""
    g = Graph(name)
    uv = g.node("ShaderNodeSeparateXYZ")
    g.link(g.node("ShaderNodeTexCoord").outputs["UV"], uv.inputs[0])
    d = g.math("SUBTRACT", g.math("MULTIPLY", uv.outputs[0], 2.0), 1.0)
    across = g.math("POWER", g.math("MAXIMUM", g.math("SUBTRACT", 1.0, g.math("MULTIPLY", d, d)), 0.0), 0.7)

    def ramp(value, width):
        r = g.node("ShaderNodeMapRange", interpolation_type="SMOOTHSTEP")
        g.set(r.inputs["Value"], value)
        r.inputs["From Min"].default_value = 0.0
        r.inputs["From Max"].default_value = width
        return r.outputs["Result"]

    v = uv.outputs[1]
    along = g.math("MULTIPLY", g.math("MULTIPLY", ramp(v, 0.3), ramp(g.math("SUBTRACT", 1.0, v), 0.32)), g.math("ADD", 0.7, g.math("MULTIPLY", v, 0.3)))
    level = g.math("MULTIPLY", g.math("MULTIPLY", across, along), strength)
    em = g.node("ShaderNodeEmission")
    em.inputs["Color"].default_value = (1, 1, 1, 1)
    g.set(em.inputs["Strength"], level)
    g.surface(em)
    try:
        g.mat.emission_sampling = "FRONT"
    except (AttributeError, TypeError):
        pass
    return g.mat


def steel():
    """Turned stainless steel with a faint lathe grain and fine vertical ribs on the grip."""
    g = Graph("steel")
    coords = g.node("ShaderNodeTexCoord")
    xyz = g.node("ShaderNodeSeparateXYZ")
    g.link(coords.outputs["Object"], xyz.inputs[0])
    angle = g.math("ARCTAN2", xyz.outputs[1], xyz.outputs[0])
    ribs = g.math("SINE", g.math("MULTIPLY", angle, 60.0))
    band = g.math("MULTIPLY", g.math("GREATER_THAN", xyz.outputs[2], 2.39), g.math("LESS_THAN", xyz.outputs[2], 2.59))
    grain = g.node("ShaderNodeTexNoise")
    grain.inputs["Scale"].default_value = 900.0
    g.link(coords.outputs["Object"], grain.inputs["Vector"])
    height = g.math("ADD", g.math("MULTIPLY", g.math("MULTIPLY", ribs, band), 0.6), g.math("MULTIPLY", grain.outputs[0], 0.08))
    bump = g.node("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.002
    g.link(height, bump.inputs["Height"])
    p = g.principled(
        **{"Base Color": srgb("#c9cdd1"), "Metallic": 1.0, "Roughness": 0.13, "Anisotropic": 0.35, "Normal": bump.outputs[0]}
    )
    g.surface(p)
    return g.mat


def rubber():
    """Black nitrile teat: satin, with a faint moulded texture, a parting line up each side and a flash line where
    it meets the collar."""
    g = Graph("rubber")
    xyz = g.coords()
    noise = g.node("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 260.0
    noise.inputs["Detail"].default_value = 6.0
    g.link(g.node("ShaderNodeTexCoord").outputs["Object"], noise.inputs["Vector"])
    flash = g.ridge(xyz.outputs[2], 2.688, 0.0035)
    parting = g.seam(xyz, 0.4, 0.008)
    height = g.math("ADD", g.math("MULTIPLY", noise.outputs[0], 0.0006), g.math("MULTIPLY", g.math("ADD", flash, g.math("MULTIPLY", parting, 0.5)), 0.0016))
    p = g.principled(
        **{
            "Base Color": srgb("#141314"),
            "Roughness": 0.4,
            "Specular IOR Level": 0.5,
            "Sheen Weight": 0.5,
            "Sheen Roughness": 0.35,
            "Sheen Tint": srgb("#8a827a"),
            "Coat Weight": 0.1,
            "Coat Roughness": 0.3,
            "Normal": g.bump(height),
        }
    )
    g.surface(p)
    return g.mat


def _maps(g, name, scale, blend=0.25):
    coords = g.node("ShaderNodeTexCoord")
    mapping = g.node("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (scale, scale, scale)
    g.link(coords.outputs["Object"], mapping.inputs["Vector"])
    out = {}
    for kind in ("diff", "nor", "rough"):
        tex = g.node("ShaderNodeTexImage", projection="BOX", projection_blend=blend, interpolation="Cubic")
        tex.image = bpy.data.images.load(str(TEXTURES / f"{name}_{kind}.jpg"), check_existing=True)
        if kind != "diff":
            tex.image.colorspace_settings.name = "Non-Color"
        g.link(mapping.outputs[0], tex.inputs[0])
        out[kind] = tex.outputs["Color"]
    return out, mapping.outputs[0]


def basalt(name="basalt", tone="#2c2c2c"):
    """Honed basalt: near-black, desaturated, with fine pale flecks and a soft satin sheen that blurs reflections."""
    g = Graph(name)
    maps, vec = _maps(g, "stone", 0.42)
    grey = g.node("ShaderNodeHueSaturation")
    grey.inputs["Saturation"].default_value = 0.0
    g.link(maps["diff"], grey.inputs["Color"])
    clouds = g.node("ShaderNodeTexNoise")
    clouds.inputs["Scale"].default_value = 3.0
    clouds.inputs["Detail"].default_value = 8.0
    g.link(vec, clouds.inputs["Vector"])
    flecks = g.node("ShaderNodeTexVoronoi", feature="F1")
    flecks.inputs["Scale"].default_value = 260.0
    g.link(vec, flecks.inputs["Vector"])
    fleck = g.math("LESS_THAN", flecks.outputs["Distance"], 0.07)
    base = g.mix_colour(0.55, srgb(tone), grey.outputs[0])
    shade = g.math("ADD", 0.82, g.math("MULTIPLY", clouds.outputs[0], 0.36))
    tinted = g.node("ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY")
    tinted.inputs[0].default_value = 1.0
    cols = [s for s in tinted.inputs if s.type == "RGBA"]
    g.link(base, cols[0])
    shade_rgb = g.node("ShaderNodeCombineXYZ")
    for i in range(3):
        g.link(shade, shade_rgb.inputs[i])
    g.link(shade_rgb.outputs[0], cols[1])
    tinted_out = next(s for s in tinted.outputs if s.type == "RGBA")
    colour = g.mix_colour(g.math("MULTIPLY", fleck, 0.35), tinted_out, srgb("#8b8b8b"))
    darken = g.node("ShaderNodeBrightContrast")
    darken.inputs["Bright"].default_value = -0.02
    g.link(colour, darken.inputs["Color"])
    rough = g.math("ADD", 0.38, g.math("MULTIPLY", maps["rough"], 0.22))
    normal = g.node("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = 0.35
    g.link(maps["nor"], normal.inputs["Color"])
    p = g.principled(**{"Base Color": darken.outputs[0], "Roughness": rough, "Specular IOR Level": 0.5, "Normal": normal.outputs[0]})
    g.surface(p)
    return g.mat


def plaster():
    """Lime plaster in charcoal, matte, with enough relief to rake under the wall light."""
    g = Graph("plaster")
    maps, vec = _maps(g, "plaster", 0.17, blend=0.0)
    grey = g.node("ShaderNodeHueSaturation")
    grey.inputs["Saturation"].default_value = 0.0
    grey.inputs["Value"].default_value = 0.22
    g.link(maps["diff"], grey.inputs["Color"])
    clouds = g.node("ShaderNodeTexNoise")
    clouds.inputs["Scale"].default_value = 0.7
    clouds.inputs["Detail"].default_value = 6.0
    g.link(vec, clouds.inputs["Vector"])
    trowel = g.node("ShaderNodeTexNoise")
    trowel.inputs["Scale"].default_value = 9.0
    trowel.inputs["Detail"].default_value = 4.0
    g.link(vec, trowel.inputs["Vector"])
    colour = g.mix_colour(g.math("MULTIPLY", clouds.outputs[0], 0.5), grey.outputs[0], srgb("#3b3b3b"))
    normal = g.node("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = 0.9
    g.link(maps["nor"], normal.inputs["Color"])
    bump = g.node("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    g.link(trowel.outputs[0], bump.inputs["Height"])
    g.link(normal.outputs[0], bump.inputs["Normal"])
    p = g.principled(**{"Base Color": colour, "Roughness": 0.92, "Specular IOR Level": 0.3, "Normal": bump.outputs[0]})
    g.surface(p)
    return g.mat


def matte(name, hex_colour, roughness=0.9):
    g = Graph(name)
    g.surface(g.principled(**{"Base Color": srgb(hex_colour), "Roughness": roughness}))
    return g.mat


def pebble_stone(name, hex_colour):
    g = Graph(name)
    noise = g.node("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 40.0
    noise.inputs["Detail"].default_value = 8.0
    bump = g.node("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    g.link(noise.outputs[0], bump.inputs["Height"])
    col = g.mix_colour(g.math("MULTIPLY", noise.outputs[0], 0.4), srgb(hex_colour), srgb("#1d1d1d"))
    g.surface(g.principled(**{"Base Color": col, "Roughness": 0.34, "Normal": bump.outputs[0]}))
    return g.mat
