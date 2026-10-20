"""Pass readers and image helpers for pack_lean.py, which runs on Blender's bundled Python (numpy + OpenImageIO)."""

import numpy as np
import OpenImageIO as oiio

from .optics import SIGMA


def read_layers(exr):
    inp = oiio.ImageInput.open(str(exr))
    layers = {}
    i = 0
    while inp.seek_subimage(i, 0):
        spec = inp.spec()
        pixels = inp.read_image(oiio.FLOAT)
        for c, name in enumerate(spec.channelnames):
            layers[name] = pixels[:, :, c]
        i += 1
    inp.close()
    return layers


def rgb(layers, name):
    return np.stack([layers[f"{name}.{c}"] for c in "RGB"], axis=-1)


def dilate(value, weight, steps=6):
    """Pushes values from fully covered pixels outward into partly covered ones, so edge pixels carry the print's
    own light rather than a blend with whatever is behind it."""
    v = np.where(weight > 0.98, value, 0.0)
    w = (weight > 0.98).astype(np.float32)
    for _ in range(steps):
        vs, ws = v.copy(), w.copy()
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            vs += np.roll(np.roll(v, dy, 0), dx, 1)
            ws += np.roll(np.roll(w, dy, 0), dx, 1)
        grown = ws > 0
        v = np.where(w > 0, v, np.where(grown, vs / np.maximum(ws, 1e-6), 0.0))
        w = np.where(w > 0, w, grown.astype(np.float32))
    return v


def blur(x, radius):
    """Three box passes along each axis: close to a Gaussian, with no SciPy."""
    for axis in (0, 1):
        for _ in range(3):
            c = np.cumsum(np.pad(x, [(radius + 1, radius) if a == axis else (0, 0) for a in range(x.ndim)], mode="edge"), axis=axis)
            hi = np.take(c, np.arange(2 * radius + 1, c.shape[axis]), axis=axis)
            lo = np.take(c, np.arange(0, c.shape[axis] - 2 * radius - 1), axis=axis)
            x = (hi - lo) / (2 * radius + 1)
    return x


def smooth_depth(d, weight, radius=2):
    """Optical depth averaged by how much serum light each pixel carries, so dim noisy pixels borrow from bright
    ones and the bright ones keep their own value."""
    w = np.sqrt(np.maximum(weight, 0.0))
    near = blur(d * w, radius) / np.maximum(blur(w, radius), 1e-12)
    lit = weight[weight > 0]
    ref = np.sqrt(np.percentile(lit, 60)) if lit.size else 1.0
    trust = np.clip(w / (ref + 1e-12), 0.0, 1.0)
    return np.where(weight > 0, trust * d + (1 - trust) * near, 0.0)


def down2(x):
    h, w = x.shape[0] // 2 * 2, x.shape[1] // 2 * 2
    return x[:h, :w].reshape(h // 2, 2, w // 2, 2, *x.shape[2:]).mean(axis=(1, 3))


def write_png(path, array):
    if array.ndim == 2:
        array = array[..., None]
    h, w, channels = array.shape
    out = oiio.ImageOutput.create(str(path))
    out.open(str(path), oiio.ImageSpec(w, h, channels, oiio.UINT8))
    out.write_image(np.ascontiguousarray(array))
    out.close()


def circle_of_confusion(depth, lens):
    """Thin-lens blur diameter in 1x pixels for points at `depth` (along the view axis), as Cycles' aperture makes it."""
    if not lens or not lens["dof"]:
        return np.zeros_like(depth)
    radius = lens["lens_mm"] * 1e-3 / (2.0 * lens["fstop"])
    focus = lens["focus"]
    z = np.maximum(depth, 1e-3)
    across = 2.0 * radius * np.abs(z - focus) / z
    return across * lens["span_px"] / (2.0 * focus * np.tan(lens["fov"] / 2.0))


def serum_light(L, owners):
    """Per bottle k: the neutral light through its serum and the optical path behind that light."""
    dark = rgb(L, "dark.Combined")
    light = rgb(L, "light.Combined")
    I = np.zeros_like(dark)
    D = np.zeros_like(dark)
    if owners == 1:
        clear = np.maximum(light[..., 0] - dark[..., 0], 0.0)
        absorbed = np.maximum(light[..., 1] - dark[..., 1], 0.0)
        pairs = [(0, clear, absorbed, dark[..., 0])]
    else:
        absorb = rgb(L, "absorb.Combined")
        pairs = [(k, np.maximum(light[..., k] - dark[..., k], 0.0), np.maximum(absorb[..., k] - dark[..., k], 0.0), dark[..., k]) for k in range(owners)]
    for k, clear, absorbed, rest in pairs:
        # Below a couple of percent of a pixel, serum light is denoiser residue.
        real = (clear > 2e-5) & (clear > 0.02 * (clear + rest))
        t = np.clip(absorbed / np.maximum(clear, 1e-9), 1e-6, 1.0)
        d = np.where(real, -np.log(t) / SIGMA, 0.0)
        I[..., k] = np.where(real, clear, 0.0)
        D[..., k] = smooth_depth(d, I[..., k], radius=2)
    return dark, I, D
