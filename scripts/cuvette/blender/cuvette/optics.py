# Shared by the Blender scene (look.py) and the packers, which run outside Blender.
# Grey absorption per scene unit in the `absorb` layer: absorb / light = exp(−SIGMA·d) recovers the optical path d.
SIGMA = 0.9
# Density that makes serum fully opaque in the `dark` layer.
DARK = 400.0
