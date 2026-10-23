import { lookKey, type BottleLook } from "../../_lib/product-look";
import { drawLabel, LABEL_SPAN, LABEL_U0 } from "./label";
import type { Picture, Rect, TemplateManifest, Tile } from "./manifest";
import type { Planes } from "./planes";

// One shared WebGL2 context composites the product-free template (manifest v2, see pack_lean.py) for any product.
// Planes are read by full-frame pixel, output pixel + crop origin; targets hold image rows top first, the blit flips.

export type FrameImages = { base: ImageBitmap; light: ImageBitmap; data: ImageBitmap };

/** Each plane's layer in its texture array (data or light), or −1 when the picture has none. */
type TileIndex = { uv0: number; uv1: number; lens: number; shade: number; front: number; light: number[]; depth: number[] };

export type GpuPicture = {
  picture: Picture;
  /** The output's top-left in frame pixels, and its size. */
  origin: [number, number];
  w: number;
  h: number;
  /** Where the base image sits in the frame, and its size: a view may reach past it, repeating its edge. */
  baseOrigin: [number, number];
  baseSize: [number, number];
  owners: number;
  /** Per bottle: the u at the centre of its face to the lens, and the lift that evens its light with the others. */
  faces: number[];
  gains: number[];
  index: TileIndex;
  base: WebGLTexture;
  light: WebGLTexture;
  data: WebGLTexture;
};

export type UploadOptions = {
  /** Where the base image sits in the full frame (a crop's offset). */
  origin?: [number, number];
  owners?: number;
  /** The rect of the frame to composite, when it differs from the base image's. */
  view?: Rect;
  /** The manifest's encoding, needed to measure a shot of several bottles. */
  encoding?: TemplateManifest["encoding"];
};

export type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };

/** A picture's print for one set of looks, at twice its pixels: `rect` is the part of the frame it covers. */
export type Ink = Target & { mips: boolean; rect: Rect };

/** The live light, in the bottle's terms (see the shader): none for stills. */
export type LiveLight = {
  /** The pool's centre: bottle half-widths right of the axis, bottle heights up from the foot. */
  pool: [number, number];
  /** Gains on the set's light and on the light through the serum. */
  set: number;
  glow: number;
  /** The glint's place across the glass (half-widths) and its strength. */
  glint: [number, number];
  /** Where the pointer's light catches the set's lit edges (half-widths), how strongly, and the pool's gain. */
  sheen: [number, number, number];
  haze: number;
  drift: number;
};

export type PaintOptions = {
  /** Frame pixel = output pixel * map[0] + [map[1], map[2]]. */
  map: Warp;
  /** The bottle's foot and shoulder in this picture's frame pixels, for the live light. */
  axis?: [number, number, number, number];
  live?: LiveLight | null;
  /** Over what is already drawn, at this opacity. */
  alpha?: number;
  grain?: number;
  seed?: number;
};

export const GRADE = {
  exposure: 0,
  white: [1.0, 0.975, 0.93],
  slope: 1.0,
  power: 1.08,
  sat: 1.05,
  vignette: 0.2,
  grain: 0.01,
  enamel: 0.85,
  inkCover: 1.0,
  legible: 1.6,
};

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const COMMON = `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2D uTone;
uniform highp sampler2DArray uData, uLight;
uniform ivec4 uRect;
uniform int uTUv0, uTUv1, uTLens, uTShade, uTFront, uTLight[3], uTDepth[3];
float tone(float b) { return texelFetch(uTone, ivec2(int(b), 0), 0).r; }
bool inRect(ivec2 f) { return all(greaterThanEqual(f, uRect.xy)) && all(lessThan(f, uRect.xy + uRect.zw)); }
vec3 tile(int t, ivec2 f) {
  if (t < 0 || !inRect(f)) return vec3(0.0);
  return floor(texelFetch(uData, ivec3(f - uRect.xy, t), 0).rgb * 255.0 + 0.5);
}
float grey(int t, ivec2 f) {
  if (t < 0 || !inRect(f)) return 0.0;
  return floor(texelFetch(uLight, ivec3(f - uRect.xy, t), 0).r * 255.0 + 0.5);
}
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

const INK = `${COMMON}
uniform sampler2D uArt0, uArt1, uArt2;
uniform vec3 uInk[3], uAccent[3];
uniform float uOwnerStep, uU0[3], uSpan;
uniform ivec2 uInkOrigin;
out vec4 outInk;

vec2 art(int o, vec2 st, vec2 dx, vec2 dy) {
  if (o == 1) return textureGrad(uArt1, st, dx, dy).rg;
  if (o == 2) return textureGrad(uArt2, st, dx, dy).rg;
  return textureGrad(uArt0, st, dx, dy).rg;
}

// Bilinear over the 1x coordinate tiles, skipping texels with no coordinates (beyond the print's dilated edge).
void sampleUv(vec2 fp, out vec2 uv, out float cov, out float nv, out float valid) {
  vec2 g = fp - 0.5;
  ivec2 i0 = ivec2(floor(g));
  vec2 t = g - vec2(i0);
  uv = vec2(0.0); cov = 0.0; nv = 0.0; valid = 0.0;
  for (int k = 0; k < 4; k++) {
    ivec2 o = ivec2(k & 1, k >> 1);
    float w = (o.x == 1 ? t.x : 1.0 - t.x) * (o.y == 1 ? t.y : 1.0 - t.y);
    vec3 a = tile(uTUv0, i0 + o), b = tile(uTUv1, i0 + o);
    float ok = (a.r + a.g + a.b + b.r) > 0.0 ? 1.0 : 0.0;
    uv += w * ok * vec2(a.r * 256.0 + a.g, a.b * 256.0 + b.r) / 65535.0;
    nv += w * ok * b.b / 255.0;
    valid += w * ok;
    cov += w * b.g / 255.0;
  }
  uv /= max(valid, 1e-6);
  nv /= max(valid, 1e-6);
}

void main() {
  vec2 fp = vec2(uInkOrigin) + gl_FragCoord.xy / 2.0;
  vec2 uv; float cov, nv, valid;
  sampleUv(fp, uv, cov, nv, valid);
  int owner = uTLens >= 0 ? clamp(int(tile(uTLens, ivec2(floor(fp))).g / uOwnerStep + 0.5) - 1, 0, 2) : 0;
  vec2 st = vec2((uv.x - uU0[owner]) / uSpan, 1.0 - uv.y);
  vec2 dx = dFdx(st), dy = dFdy(st);
  outInk = vec4(0.0);
  if (cov < 0.002 || valid < 0.5) return;
  if (st.x < 0.0 || st.x > 1.0 || st.y < 0.0 || st.y > 1.0) return;
  vec2 ink = art(owner, st, dx, dy);
  float a = cov * clamp(ink.r + ink.g, 0.0, 1.0) * smoothstep(0.03, 0.2, nv);
  vec3 albedo = (ink.r * uInk[owner] + ink.g * uAccent[owner]) / max(ink.r + ink.g, 1e-4);
  outInk = vec4(albedo * a, a);
}`;

const MAIN = `${COMMON}
uniform sampler2D uBase, uInkTex;
uniform ivec2 uBaseOrigin, uFull, uSize;
// Frame pixel = output pixel * uMap.x + uMap.yz; output pixels run top-down, so a canvas (bottom-up) is flipped.
uniform vec3 uMap;
uniform int uFlip, uSmooth;
uniform float uOutH;
uniform ivec4 uInkRect;
uniform vec3 uSigma[3];
uniform float uClear[3], uGain[3];
uniform float uDmax, uCocStep;
const float THIN = 0.8;
uniform float uExposure, uGrain, uVignette, uSeed, uEnamel, uInkCover, uLegible;
uniform vec3 uWhite;
uniform float uSlope, uPower, uSat;
uniform int uDebug;
// The live light (uLive 0 for stills): the bottle's foot and shoulder in frame pixels; the pool's centre (bottle
// half-widths, heights) and set and serum gains; the glint's place and strength, the haze and the dust's drift.
uniform float uLive;
uniform vec4 uAxis, uPool, uSweep;
uniform vec3 uSheen;
out vec4 outColour;

vec3 agxCurve(vec3 x) {
  vec3 x2 = x * x; vec3 x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}
// AgX (Sobotka; polynomial fit by B. Wrensch) with an ASC CDL look.
vec3 agx(vec3 c) {
  const mat3 inset = mat3(0.842479062253094, 0.0423282422610123, 0.0423756549057051,
                          0.0784335999999992, 0.878468636469772, 0.0784336,
                          0.0792237451477643, 0.0791661274605434, 0.879142973793104);
  const mat3 outset = mat3(1.19687900512017, -0.0528968517574562, -0.0529716355144438,
                           -0.0980208811401368, 1.15190312990417, -0.0980434501171241,
                           -0.0990297440797205, -0.0989611768448433, 1.15107367264116);
  const float lo = -12.47393, hi = 4.026069;
  c = inset * max(c, vec3(1e-10));
  c = (clamp(log2(c), lo, hi) - lo) / (hi - lo);
  c = pow(max(agxCurve(c) * uSlope, 0.0), vec3(uPower));
  float l = lum(c);
  return clamp(outset * (l + uSat * (c - l)), 0.0, 1.0);
}

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423) + uSeed);
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float sq(float x) { return x * x; }

vec3 setAt(ivec2 f) {
  vec3 b = floor(texelFetch(uBase, clamp(f - uBaseOrigin, ivec2(0), uSize - 1), 0).rgb * 255.0 + 0.5);
  return vec3(tone(b.r), tone(b.g), tone(b.b));
}

// f is a frame pixel; the base may start lower (a phone crop that reaches above the frame repeats its top row).
// g scales the set's light and the serum's.
vec3 serum(ivec2 f, vec2 g) {
  vec3 c = setAt(f) * g.x;
  if (!inRect(f)) return c;
  for (int k = 0; k < 3; k++) {
    if (uTLight[k] < 0) continue;
    float e = grey(uTDepth[k], f) / 255.0;
    float l = tone(grey(uTLight[k], f)) * uGain[k];
    // A water-clear serum shows the dark set through it: its even backlit glow drops, its lit edges stay.
    l *= mix(1.0, clamp(pow(l / 3.0, 0.6), 0.42, 1.0), uClear[k]);
    // The pipette's column, the drop and the bead are a few mm of serum: tinted as at least THIN deep, they keep the
    // serum's colour instead of reading grey until the dropper is back in the bottle.
    c += g.y * l * exp(-uSigma[k] * max(uDmax * e * e, THIN));
  }
  return max(c, vec3(0.0));
}

// Between frame pixels (above 1x, or warped onto a moving camera) the photograph is interpolated; the ink, drawn at
// 2x, stays sharp.
vec3 serumAt(vec2 c, vec2 g) {
  if (uSmooth == 0) return serum(ivec2(floor(c)), g);
  vec2 q = c - 0.5;
  ivec2 i = ivec2(floor(q));
  vec2 t = q - vec2(i);
  return mix(mix(serum(i, g), serum(i + ivec2(1, 0), g), t.x), mix(serum(i + ivec2(0, 1), g), serum(i + ivec2(1, 1), g), t.x), t.y);
}

// The sharp ink, seen through the lens: a disk gather over the circle of confusion. At 1x a bilinear read at the
// centre of each 2x2 block of ink averages it exactly.
vec4 inkAt(vec2 f, float coc) {
  vec2 q = (f - vec2(uInkRect.xy)) * 2.0;
  if (any(lessThan(q, vec2(0.0))) || any(greaterThanEqual(q, vec2(uInkRect.zw * 2)))) return vec4(0.0);
  vec2 size = vec2(textureSize(uInkTex, 0));
  float radius = coc * 2.0;
  if (radius < 0.9) return texture(uInkTex, q / size);
  const int TAPS = 48;
  float lod = log2(max(1.0, 1.9 * radius / sqrt(float(TAPS))));
  // A lens's blur disc is brightest at its centre and soft at its rim; a flat disc reads as a bold outline.
  vec4 sum = vec4(0.0);
  float total = 0.0;
  for (int k = 0; k < TAPS; k++) {
    float r = sqrt((float(k) + 0.5) / float(TAPS));
    float th = float(k) * 2.39996323;
    float w = 1.0 - 0.8 * r * r;
    sum += w * textureLod(uInkTex, (q + 1.15 * radius * r * vec2(cos(th), sin(th))) / size, lod);
    total += w;
  }
  return sum / total;
}

// A frame pixel in the bottle's own terms: half-widths right of its axis, bottle heights up from its foot.
vec2 bottleSpace(vec2 fc) {
  vec2 up = uAxis.zw - uAxis.xy;
  float len = max(length(up), 1.0);
  up /= len;
  vec2 d = fc - uAxis.xy;
  return vec2(dot(d, vec2(-up.y, up.x)) / (len * 0.365), dot(d, up) / len);
}

// Soft motes drifting through the beam, two layers deep; none in front of the glass, where they would read as dirt.
float dust(vec2 b, float drift) {
  float sum = 0.0;
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 9.0 : 15.0;
    vec2 p = b * scale + vec2(0.37 * drift * (layer == 0 ? 1.0 : 0.6), -drift * (layer == 0 ? 1.0 : 0.7));
    vec2 cell = floor(p);
    float h = hash(cell + float(layer) * 17.0);
    if (h < 0.93) continue;
    vec2 at = cell + 0.25 + 0.5 * vec2(hash(cell + 3.1), hash(cell + 7.7));
    float r = length(p - at);
    sum += (layer == 0 ? 1.0 : 0.55) * (h - 0.93) / 0.07 * exp(-sq(r / 0.07));
  }
  return sum;
}

void main() {
  vec2 o = vec2(gl_FragCoord.x, uFlip == 1 ? uOutH - gl_FragCoord.y : gl_FragCoord.y);
  vec2 fc = o * uMap.x + uMap.yz;
  ivec2 f = ivec2(floor(fc));

  vec2 g = vec2(1.0);
  vec2 b = vec2(0.0);
  float pool = 0.0, band = 0.0;
  if (uLive > 0.0) {
    b = bottleSpace(fc);
    pool = exp(-0.5 * (sq((b.x - uPool.x) / 1.7) + sq((b.y - uPool.y) / 1.05)));
    g = mix(vec2(1.0), vec2(uPool.z * (1.0 + uSheen.z * pool), uPool.w * (0.72 + 0.6 * pool)), uLive);
    // A highlight slides round the glass as the light moves: confined to the bottle's own outline.
    float onGlass = smoothstep(1.12, 0.92, abs(b.x)) * smoothstep(-0.02, 0.06, b.y) * smoothstep(1.32, 1.12, b.y);
    band = uLive * uSweep.y * onGlass * exp(-0.5 * sq((b.x - uSweep.x) / 0.15));
  }
  vec3 colour = serumAt(fc, g);

  if (inRect(f)) {
    float coc = uTLens >= 0 ? tile(uTLens, f).r * uCocStep : 0.0;
    vec4 ink = inkAt(fc, coc);
    float alpha = ink.a;
    if (uDebug == 1) { outColour = vec4(vec3(alpha), 1.0); return; }
    if (alpha > 0.002) {
      vec3 albedo = ink.rgb / alpha;
      float shade = tone(grey(uTShade, f)) * mix(1.0, 0.85 + 0.3 * pool, uLive);
      vec3 front = vec3(tone(grey(uTFront, f))) * (1.0 + 1.2 * band);
      // Screen print darkens a little as the cylinder turns away from the lens.
      float facing = tile(uTUv1, f).b / 255.0;
      shade *= mix(0.85, 1.0, smoothstep(0.15, 0.85, facing));
      vec3 inkLight = albedo * shade;
      float lit = max(lum(inkLight), 1e-6);
      // Defocused print only spreads its light: no legibility lift, which would read as a bold blur.
      float sharp = 1.0 - smoothstep(0.6, 1.6, coc);
      // Legible over a glowing serum: the ink is lifted above its ground, judged over two wide rings with each tap
      // capped near the ink, so a narrow highlight (the pipette) never brightens one glyph more than the next.
      float behind = 0.0;
      for (int k = 0; k < 16; k++) {
        float th = float(k) * 0.7854 + (k < 8 ? 0.0 : 0.3927);
        float reach = (k < 8 ? 0.014 : 0.028) * float(uFull.x);
        behind += min(lum(serum(f + ivec2(reach * vec2(cos(th), sin(th))), g)), 1.15 * lit);
      }
      behind /= 16.0;
      inkLight *= mix(1.0, clamp(uLegible * behind / lit, 1.0, 1.8), sharp) * mix(0.75, 1.0, sharp);
      // Enamel on the outside of the glass is opaque: nothing inside the bottle shows through it. The glass's
      // front reflection is taken off what is beneath and laid back over the ink, a little dulled.
      vec3 under = max(colour - front, 0.0);
      // Over a hot highlight inside the bottle the print reads as a silhouette, as it does to the eye; the camera
      // curve would otherwise flatten both to white and the glyph would vanish into the streak.
      inkLight *= mix(1.0, 0.5, smoothstep(1.3, 3.5, lum(under) / max(lum(inkLight), 1e-6)));
      colour = mix(under, inkLight, alpha * uInkCover) + front * mix(1.0, uEnamel, alpha);
      if (uDebug == 2) { outColour = vec4(inkLight / 4.0, 1.0); return; }
      if (uDebug == 3) { outColour = vec4(under / 4.0, 1.0); return; }
      if (uDebug == 4) { outColour = vec4(colour / 4.0, 1.0); return; }
    }
  }
  if (uDebug == 5) { outColour = vec4(colour / 4.0, 1.0); return; }

  if (uLive > 0.0) {
    // The glass's own highlights flare as the band crosses them, and its front reflection carries a specular stripe.
    vec3 lit = setAt(f);
    colour += lit * smoothstep(0.25, 1.4, lum(lit)) * band * 1.6;
    float glass = inRect(f) ? tone(grey(uTFront, f)) : 0.0;
    colour += uWhite * band * (0.9 * glass + 0.06 * smoothstep(0.0, 0.004, glass));
    // The pointer's light catches the set's lit edges nearest it: the plinth's top and the glass's foot.
    float edge = exp(-0.5 * sq((b.x - uSheen.x) / 1.2)) * smoothstep(-0.5, -0.12, b.y) * smoothstep(0.4, 0.08, b.y);
    colour += uSheen.y * edge * lit * smoothstep(0.03, 0.6, lum(lit));
    // Haze in the beam that falls from above onto the pool, and a little dust caught in it.
    float beam = exp(-0.5 * sq((b.x - uPool.x + 0.3 * (b.y - uPool.y)) / 1.5)) * smoothstep(-0.4, 0.9, b.y);
    float clear = 1.0 - smoothstep(1.25, 1.05, abs(b.x)) * smoothstep(-0.05, 0.05, b.y) * smoothstep(2.1, 1.9, b.y);
    colour += uLive * uWhite * beam * (uSweep.z * (0.55 + 0.45 * pool) + 0.035 * clear * dust(b, uSweep.w));
  }

  colour *= exp2(uExposure) * uWhite;
  vec2 c = fc / vec2(uFull) - 0.5;
  c.x *= float(uFull.x) / float(uFull.y);
  colour *= 1.0 - uVignette * pow(length(c) / 0.75, 2.4);
  vec3 display = agx(colour);
  display += (hash(floor(o)) - 0.5) * uGrain * sqrt(max(lum(display), 0.02));
  display += (ign(floor(o) + uSeed * 97.0) - 0.5) / 255.0;
  outColour = vec4(clamp(display, 0.0, 1.0), 1.0);
}`;

// Draws a target, or a crossfade of two, to the canvas. Each may be warped (src = dst * s + t, in target pixels) so
// a held frame follows the camera between rendered frames.
const BLIT = `#version 300 es
precision highp float;
uniform sampler2D uA, uB;
uniform vec3 uWarpA, uWarpB;
uniform float uMix;
uniform int uHeight;
out vec4 outColour;
vec4 read(sampler2D t, vec3 w, ivec2 p) {
  if (w == vec3(1.0, 0.0, 0.0)) return texelFetch(t, p, 0);
  return texture(t, ((vec2(p) + 0.5) * w.x + w.yz) / vec2(textureSize(t, 0)));
}
void main() {
  ivec2 p = ivec2(int(gl_FragCoord.x), uHeight - 1 - int(gl_FragCoord.y));
  vec4 a = read(uA, uWarpA, p);
  outColour = uMix > 0.0 ? mix(a, read(uB, uWarpB, p), uMix) : a;
}`;

/** A blit warp: source pixel = destination pixel * scale + offset. */
export type Warp = [number, number, number];
const STILL: Warp = [1, 0, 0];

export function srgbToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [16, 8, 0].map((shift) => {
    const c = ((n >> shift) & 255) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
}

// The least a tinted serum absorbs in its strongest channel, per scene unit: below it a pale tint vanishes.
const TINT_FLOOR = 0.3;

/** Absorption per scene unit: the colour normalised so its clearest channel absorbs nothing, times the density. */
export function absorption(look: BottleLook): number[] {
  const c = srgbToLinear(look.liquid.colour);
  const top = Math.max(...c);
  const hue = c.map((v) => -Math.log(Math.max(v / top, 1e-4)));
  const peak = Math.max(...hue);
  const density = peak > 0.02 ? Math.max(look.liquid.density, TINT_FLOOR / peak) : look.liquid.density;
  return hue.map((v) => v * density);
}

/** 1 for a water-clear serum, 0 for one dense enough to glow with its own colour. */
export function clarity(look: BottleLook): number {
  const t = Math.min(1, Math.max(0, (Math.max(...absorption(look)) - 0.25) / 0.75));
  return 1 - t * t * (3 - 2 * t);
}

function tileIndex(picture: Picture): TileIndex {
  const layer = (file: string) => picture.tiles.filter((t) => t.file === file);
  const at = (first: string) => {
    const tile = picture.tiles.find((t) => t.channels[0] === first);
    return tile ? layer(tile.file).indexOf(tile) : -1;
  };
  return {
    uv0: at("u.hi"),
    uv1: at("v.lo"),
    lens: at("coc"),
    shade: at("shade"),
    front: at("front"),
    light: [1, 2, 3].map((k) => at(`light.${k}`)),
    depth: [1, 2, 3].map((k) => at(`depth.${k}`)),
  };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

type Uniform = (name: string) => WebGLUniformLocation | null;
type Program = { program: WebGLProgram; shaders: WebGLShader[]; linked: boolean; locations: Map<string, WebGLUniformLocation | null> };

// Status is read later, in ready() or on first use: reading it here would wait for the driver to finish compiling.
function link(gl: WebGL2RenderingContext, fragment: string): Program {
  const program = gl.createProgram()!;
  const shaders = [compile(gl, gl.VERTEX_SHADER, VERT), compile(gl, gl.FRAGMENT_SHADER, fragment)];
  shaders.forEach((s) => gl.attachShader(program, s));
  gl.linkProgram(program);
  return { program, shaders, linked: false, locations: new Map() };
}

function check(gl: WebGL2RenderingContext, p: Program) {
  if (p.linked) return;
  if (!gl.getProgramParameter(p.program, gl.LINK_STATUS)) {
    throw new Error([gl.getProgramInfoLog(p.program), ...p.shaders.map((s) => gl.getShaderInfoLog(s))].filter(Boolean).join("\n"));
  }
  p.linked = true;
}

const SINGLE = { faces: [0.5, 0.5, 0.5], gains: [1, 1, 1] };

function planes(bitmap: ImageBitmap) {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height, { colorSpace: "srgb" }).data;
}

/**
 * For a shot of several bottles, read on the CPU once: where each bottle's sleeve faces the lens (so its print is
 * centred on what the camera sees, however the bottle stands) and how much light crosses its serum (a bottle in the
 * set's shadow is lifted to its brightest neighbour, so the same serum reads the same colour as in its own shot).
 */
function measureOwners(images: FrameImages, picture: Picture, owners: number, encoding: TemplateManifest["encoding"]) {
  const tone = encoding.tone.table;
  const find = (c: string) => picture.tiles.find((t) => t.channels[0] === c);
  const [uv0, uv1, lens] = [find("u.hi"), find("v.lo"), find("coc")];
  if (!uv0 || !uv1 || !lens) return SINGLE;
  const data = planes(images.data);
  const light = planes(images.light);
  const [, , w, h] = picture.rect;
  const dw = images.data.width;
  const lw = images.light.width;
  const faces = [0, 0, 0];
  const weights = [0, 0, 0];
  const sums = [0, 0, 0];
  const counts = [0, 0, 0];
  const lights = [1, 2, 3].map((k) => find(`light.${k}`));
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const at = (t: Tile) => ((t.y + y) * dw + t.x + x) * 4;
      const b = at(uv1);
      const k = Math.round(data[at(lens) + 1] / encoding.owner.step) - 1;
      if (k >= 0 && k < owners && data[b + 1] > 200 && data[b + 2] > 180) {
        const a = at(uv0);
        const wgt = (data[b + 2] / 255) ** 8;
        faces[k] += wgt * ((data[a] * 256 + data[a + 1]) / 65535);
        weights[k] += wgt;
      }
      lights.forEach((t, j) => {
        if (!t || j >= owners) return;
        const l = tone[light[((t.y + y) * lw + t.x + x) * 4]];
        if (l > 0.005) {
          sums[j] += Math.min(l, 4);
          counts[j]++;
        }
      });
    }
  }
  const means = sums.map((s, j) => (counts[j] ? s / counts[j] : 0));
  const top = Math.max(...means);
  return {
    faces: faces.map((f, j) => (weights[j] > 0 ? f / weights[j] : 0.5)),
    gains: means.map((m) => (m > 0 ? Math.min(4, top / m) : 1)),
  };
}

type Plane = "base" | "light" | "data";
type Pooled = { tex: WebGLTexture; kind: Plane; w: number; h: number; layers: number };
// Freed plane textures kept for reuse: about one frame's worth, enough for the window's evict-then-load.
const POOL = 6;

const ART_WIDTH = 4096;
const ART_CACHE = 12;

export class Compositor {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  private ink: Program;
  private main: Program;
  private blit: Program;
  private shared: Ink | null = null;
  private tones = new Map<string, WebGLTexture>();
  private arts = new Map<string, WebGLTexture>();
  private lost = false;
  private readying: Promise<void> | null = null;
  private pool: Pooled[] = [];
  private pooled = new Map<WebGLTexture, Pooled>();

  private static instance: Compositor | null | undefined;

  /** The page's one compositor, or null where WebGL2 is unavailable. */
  static get(): Compositor | null {
    if (Compositor.instance === undefined || Compositor.instance?.isLost) {
      try {
        Compositor.instance = new Compositor();
      } catch {
        Compositor.instance = null;
      }
    }
    return Compositor.instance;
  }

  /** Paints straight into a visible canvas: nothing is read back, and the canvas keeps its last picture between
   * paints. Null where WebGL2 is unavailable. */
  static on(canvas: HTMLCanvasElement): Compositor | null {
    try {
      return new Compositor(canvas);
    } catch {
      return null;
    }
  }

  private constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement("canvas");
    if (!canvas) {
      this.canvas.width = 2;
      this.canvas.height = 2;
    }
    // Only the offscreen compositor is copied out of (present), so only it keeps its drawing buffer.
    const gl = this.canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: !canvas });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
    });
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    this.ink = link(gl, INK);
    this.main = link(gl, MAIN);
    this.blit = link(gl, BLIT);
    gl.bindVertexArray(gl.createVertexArray());
  }

  /** Resolves once the shaders have compiled, off the main thread where the browser supports it. */
  ready(): Promise<void> {
    this.readying ??= new Promise((resolve, reject) => {
      const gl = this.gl;
      const parallel = gl.getExtension("KHR_parallel_shader_compile");
      const programs = [this.ink, this.main, this.blit];
      const poll = () => {
        if (parallel && !programs.every((p) => gl.getProgramParameter(p.program, parallel.COMPLETION_STATUS_KHR))) {
          requestAnimationFrame(poll);
          return;
        }
        try {
          programs.forEach((p) => check(gl, p));
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      poll();
    });
    return this.readying;
  }

  /** Draws and uploads each look's label now, so a composite that follows does no type-setting. */
  warm(looks: BottleLook[], manifest: TemplateManifest) {
    looks.forEach((look) => this.art(look, manifest));
  }

  /** Whether WebGL runs on the CPU (a blocklisted or missing GPU), where painting every scroll frame would stall. */
  get software(): boolean {
    const gl = this.gl;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  }

  get isLost() {
    return this.lost || this.gl.isContextLost();
  }

  private texture(source: TexImageSource | null, { w = 0, h = 0, mips = false } = {}) {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (source) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } else {
      gl.texStorage2D(gl.TEXTURE_2D, mips ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1, gl.RGBA8, w, h);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mips ? gl.LINEAR : gl.NEAREST);
    return t;
  }

  /**
   * Each atlas tile becomes one layer of a texture array, so only the rect, never the atlas, must fit the GPU. An
   * atlas that fits is uploaded once and its tiles copied on the GPU; one that does not is read tile by tile.
   */
  private layers(source: ImageBitmap, picture: Picture, file: Tile["file"]) {
    const gl = this.gl;
    const tiles = picture.tiles.filter((t) => t.file === file);
    const [, , w, h] = picture.rect;
    const red = file === "light";
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, red ? gl.R8 : gl.RGBA8, w, h, Math.max(1, tiles.length));
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if (source.width <= max && source.height <= max) {
      const atlas = this.texture(source);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, atlas, 0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
      tiles.forEach((tile, layer) => gl.copyTexSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, tile.x, tile.y, w, h));
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(atlas);
      return t;
    }
    tiles.forEach((tile, layer) => {
      gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, tile.x);
      gl.pixelStorei(gl.UNPACK_SKIP_ROWS, tile.y);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, w, h, 1, red ? gl.RED : gl.RGBA, gl.UNSIGNED_BYTE, source);
    });
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    return t;
  }

  /**
   * Uploads a decoded picture one texture per step, so a caller can yield between them; `origin` is where its base
   * image sits in the full frame (a crop's offset).
   */
  *uploadSteps(images: FrameImages, picture: Picture, { origin = [0, 0], owners = 1, view, encoding }: UploadOptions = {}): Generator<void, GpuPicture> {
    const base = this.texture(images.base);
    yield;
    const light = this.layers(images.light, picture, "light");
    yield;
    const data = this.layers(images.data, picture, "data");
    const { faces, gains } = owners > 1 && encoding ? measureOwners(images, picture, owners, encoding) : SINGLE;
    const [vx, vy, vw, vh] = view ?? [...origin, images.base.width, images.base.height];
    const baseSize: [number, number] = [images.base.width, images.base.height];
    return { picture, origin: [vx, vy], w: vw, h: vh, baseOrigin: origin, baseSize, owners, faces, gains, index: tileIndex(picture), base, light, data };
  }

  upload(images: FrameImages, picture: Picture, options: UploadOptions = {}): GpuPicture {
    const steps = this.uploadSteps(images, picture, options);
    for (;;) {
      const step = steps.next();
      if (step.done) return step.value;
    }
  }

  free(p: GpuPicture) {
    [p.base, p.light, p.data].forEach((t) => this.release(t));
  }

  /** A texture for a plane, reusing a freed one of about the same size: allocating mid-scroll can stall the driver. */
  private alloc(kind: Plane, w: number, h: number, layers: number): WebGLTexture {
    const i = this.pool.findIndex((p) => p.kind === kind && p.layers === layers && p.w >= w && p.h >= h && p.w * p.h <= 1.4 * w * h);
    if (i >= 0) return this.pool.splice(i, 1)[0].tex;
    const gl = this.gl;
    const [W, H] = [Math.ceil(w / 32) * 32, Math.ceil(h / 32) * 32];
    const tex = gl.createTexture()!;
    const target = kind === "base" ? gl.TEXTURE_2D : gl.TEXTURE_2D_ARRAY;
    gl.bindTexture(target, tex);
    if (kind === "base") gl.texStorage2D(target, 1, gl.RGBA8, W, H);
    else gl.texStorage3D(target, 1, kind === "light" ? gl.R8 : gl.RGBA8, W, H, layers);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.pooled.set(tex, { tex, kind, w: W, h: H, layers });
    return tex;
  }

  private release(tex: WebGLTexture) {
    const entry = this.pooled.get(tex);
    if (!entry || this.lost) {
      this.pooled.delete(tex);
      this.gl.deleteTexture(tex);
      return;
    }
    this.pool.push(entry);
    while (this.pool.length > POOL) {
      const old = this.pool.shift()!;
      this.pooled.delete(old.tex);
      this.gl.deleteTexture(old.tex);
    }
  }

  /**
   * Uploads packed planes in bands of about `band` bytes, yielding after each so a caller can spread a picture over
   * several frames within a time budget. Abandoning the steps returns their textures to the pool.
   */
  *uploadPlanes(planes: Planes, picture: Picture, band = 1 << 18): Generator<void, GpuPicture> {
    const gl = this.gl;
    const [, , w, h] = picture.rect;
    const nLight = picture.tiles.filter((t) => t.file === "light").length;
    const nData = picture.tiles.filter((t) => t.file === "data").length;
    const { w: bw, h: bh, bytes } = planes.base;
    const base = this.alloc("base", bw, bh, 1);
    const light = this.alloc("light", w, h, Math.max(1, nLight));
    const data = this.alloc("data", w, h, Math.max(1, nData));
    let done = false;
    try {
      const step = (perRow: number) => Math.max(1, Math.floor(band / perRow));
      for (let y = 0, n = step(bw * 4); y < bh; y += n) {
        gl.bindTexture(gl.TEXTURE_2D, base);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, bw, Math.min(n, bh - y), gl.RGBA, gl.UNSIGNED_BYTE, bytes, y * bw * 4);
        yield;
      }
      const layered = (tex: WebGLTexture, layers: number, src: Uint8Array, format: number, px: number) => function* () {
        for (let layer = 0; layer < layers; layer++) {
          for (let y = 0, n = step(w * px); y < h; y += n) {
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
            gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, y, layer, w, Math.min(n, h - y), 1, format, gl.UNSIGNED_BYTE, src, (layer * h + y) * w * px);
            yield;
          }
        }
      };
      yield* layered(light, nLight, planes.light, gl.RED, 1)();
      yield* layered(data, nData, planes.data, gl.RGBA, 4)();
      done = true;
    } finally {
      if (!done) [base, light, data].forEach((t) => this.release(t));
    }
    return {
      picture,
      origin: [0, 0],
      w: bw,
      h: bh,
      baseOrigin: [0, 0],
      baseSize: [bw, bh],
      owners: 1,
      faces: SINGLE.faces,
      gains: SINGLE.gains,
      index: tileIndex(picture),
      base,
      light,
      data,
    };
  }

  target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = this.texture(null, { w, h });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h };
  }

  freeTarget(t: Target) {
    this.gl.deleteFramebuffer(t.fbo);
    this.gl.deleteTexture(t.tex);
  }

  private tone(manifest: TemplateManifest) {
    let t = this.tones.get(manifest.base);
    if (!t) {
      const gl = this.gl;
      t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 256, 1, 0, gl.RED, gl.FLOAT, new Float32Array(manifest.encoding.tone.table));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.tones.set(manifest.base, t);
    }
    return t;
  }

  private art(look: BottleLook, manifest: TemplateManifest) {
    const key = lookKey(look);
    const hit = this.arts.get(key);
    if (hit) {
      this.arts.delete(key);
      this.arts.set(key, hit);
      return hit;
    }
    const gl = this.gl;
    const t = this.texture(drawLabel(look, manifest.label, ART_WIDTH));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 16);
    this.arts.set(key, t);
    while (this.arts.size > ART_CACHE) {
      const [oldest, tex] = this.arts.entries().next().value!;
      this.arts.delete(oldest);
      gl.deleteTexture(tex);
    }
    return t;
  }

  private inkTarget(w: number, h: number, mips: boolean, reuse: Ink | null): Ink {
    if (reuse && reuse.w >= w && reuse.h >= h && reuse.mips === mips) return reuse;
    if (reuse) this.freeTarget(reuse);
    const up = (v: number) => Math.ceil(Math.max(v, 1) / 256) * 256;
    const W = Math.max(up(w), reuse?.mips === mips ? reuse.w : 0);
    const H = Math.max(up(h), reuse?.mips === mips ? reuse.h : 0);
    const gl = this.gl;
    const tex = this.texture(null, { w: W, h: H, mips });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w: W, h: H, mips, rect: [0, 0, 0, 0] };
  }

  private owners(looks: BottleLook[]) {
    return [0, 1, 2].map((i) => looks[Math.min(i, looks.length - 1)]);
  }

  /**
   * Prints a picture's label for `looks` (one per bottle; the last repeats) at twice its pixels, over the part of
   * the frame it shows; `reuse` is an earlier print whose texture can take it. `mips` lets a paint below 2x read it
   * without shimmer (a defocused print always has them, for its blur).
   */
  print(p: GpuPicture, looks: BottleLook[], manifest: TemplateManifest, reuse: Ink | null = null, mips = false): Ink {
    const gl = this.gl;
    const owners = this.owners(looks);
    const [rx, ry, rw, rh] = p.picture.rect;
    const x0 = Math.max(rx, p.origin[0]);
    const y0 = Math.max(ry, p.origin[1]);
    const x1 = Math.min(rx + rw, p.origin[0] + p.w);
    const y1 = Math.min(ry + rh, p.origin[1] + p.h);
    const rect: Rect = [x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)];
    const lens = p.index.lens >= 0 || mips;
    const ink = this.inkTarget(2 * rect[2], 2 * rect[3], lens, reuse);
    ink.rect = rect;
    const e = manifest.encoding;
    const u = this.use(this.ink);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ink.fbo);
    gl.viewport(0, 0, ink.w, ink.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (rect[2] > 0 && rect[3] > 0) {
      gl.viewport(0, 0, 2 * rect[2], 2 * rect[3]);
      this.bind(u, [
        ["uData", p.data, gl.TEXTURE_2D_ARRAY],
        ["uLight", p.light, gl.TEXTURE_2D_ARRAY],
        ["uTone", this.tone(manifest)],
        ["uArt0", this.art(owners[0], manifest)],
        ["uArt1", this.art(owners[1], manifest)],
        ["uArt2", this.art(owners[2], manifest)],
      ]);
      this.tiles(u, p);
      gl.uniform2i(u("uInkOrigin"), rect[0], rect[1]);
      gl.uniform3fv(u("uInk"), owners.flatMap((o) => srgbToLinear(o.ink).map((c) => c * 0.82)));
      gl.uniform3fv(u("uAccent"), owners.flatMap((o) => srgbToLinear(o.accent).map((c) => c * 0.82)));
      gl.uniform1f(u("uOwnerStep"), e.owner.step);
      gl.uniform1fv(u("uU0"), p.faces.map((c) => LABEL_U0 + c - 0.5));
      gl.uniform1f(u("uSpan"), LABEL_SPAN);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (lens) {
        gl.bindTexture(gl.TEXTURE_2D, ink.tex);
        gl.generateMipmap(gl.TEXTURE_2D);
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ink;
  }

  private use(p: Program): Uniform {
    check(this.gl, p);
    this.gl.useProgram(p.program);
    return (name) => {
      if (!p.locations.has(name)) p.locations.set(name, this.gl.getUniformLocation(p.program, name));
      return p.locations.get(name)!;
    };
  }

  private bind(u: Uniform, units: [string, WebGLTexture, number?][]) {
    const gl = this.gl;
    units.forEach(([name, t, target = gl.TEXTURE_2D], i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(target, t);
      gl.uniform1i(u(name), i);
    });
  }

  private tiles(u: Uniform, p: GpuPicture) {
    const gl = this.gl;
    const { picture, index } = p;
    gl.uniform4i(u("uRect"), ...picture.rect);
    gl.uniform1i(u("uTUv0"), index.uv0);
    gl.uniform1i(u("uTUv1"), index.uv1);
    gl.uniform1i(u("uTLens"), index.lens);
    gl.uniform1i(u("uTShade"), index.shade);
    gl.uniform1i(u("uTFront"), index.front);
    gl.uniform1iv(u("uTLight"), new Int32Array(index.light.map((t, k) => (k < p.owners ? t : -1))));
    gl.uniform1iv(u("uTDepth"), new Int32Array(index.depth));
  }

  /**
   * Composites a picture for one look per bottle (the last look repeats) into `out`: the picture's size, or up to
   * twice it for dense displays.
   */
  composite(p: GpuPicture, looks: BottleLook[], out: Target, manifest: TemplateManifest, { grain = GRADE.grain, seed = 0.37 } = {}) {
    const ink = this.print(p, looks, manifest, this.shared);
    this.shared = ink;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, out.fbo);
    this.paintInto(p, looks, ink, manifest, out.w, out.h, false, { map: [p.w / out.w, p.origin[0], p.origin[1]], grain, seed });
  }

  /** Paints a picture with its print into the visible canvas, sized `w` x `h` (see Compositor.on). */
  paint(p: GpuPicture, looks: BottleLook[], ink: Ink, manifest: TemplateManifest, w: number, h: number, options: PaintOptions) {
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.paintInto(p, looks, ink, manifest, w, h, true, options);
  }

  private paintInto(p: GpuPicture, looks: BottleLook[], ink: Ink, manifest: TemplateManifest, w: number, h: number, flip: boolean, options: PaintOptions) {
    const gl = this.gl;
    const { map, axis = [0, 0, 0, 0], live = null, alpha = 1, grain = GRADE.grain, seed = 0.37 } = options;
    const owners = this.owners(looks);
    const e = manifest.encoding;
    const u = this.use(this.main);
    gl.viewport(0, 0, w, h);
    if (alpha < 1) {
      gl.enable(gl.BLEND);
      gl.blendColor(0, 0, 0, alpha);
      gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
    } else gl.disable(gl.BLEND);
    this.bind(u, [
      ["uBase", p.base],
      ["uData", p.data, gl.TEXTURE_2D_ARRAY],
      ["uLight", p.light, gl.TEXTURE_2D_ARRAY],
      ["uTone", this.tone(manifest)],
      ["uInkTex", ink.tex],
    ]);
    this.tiles(u, p);
    const g = GRADE;
    const exact = map[0] === 1 && Number.isInteger(map[1]) && Number.isInteger(map[2]);
    gl.uniform3fv(u("uMap"), map);
    gl.uniform1i(u("uFlip"), flip ? 1 : 0);
    gl.uniform1i(u("uSmooth"), exact ? 0 : 1);
    gl.uniform1f(u("uOutH"), h);
    gl.uniform2i(u("uFull"), p.picture.size[0], p.picture.size[1]);
    gl.uniform2i(u("uSize"), ...p.baseSize);
    gl.uniform4i(u("uInkRect"), ...ink.rect);
    gl.uniform3fv(u("uSigma"), owners.flatMap(absorption));
    gl.uniform1fv(u("uClear"), owners.map(clarity));
    gl.uniform1fv(u("uGain"), p.gains);
    gl.uniform2i(u("uBaseOrigin"), ...p.baseOrigin);
    gl.uniform1f(u("uDmax"), e["depth.k"].max);
    gl.uniform1f(u("uCocStep"), e.coc.perByte);
    gl.uniform1f(u("uExposure"), g.exposure);
    gl.uniform3fv(u("uWhite"), g.white);
    gl.uniform1f(u("uSlope"), g.slope);
    gl.uniform1f(u("uPower"), g.power);
    gl.uniform1f(u("uSat"), g.sat);
    gl.uniform1f(u("uVignette"), g.vignette);
    gl.uniform1f(u("uGrain"), grain);
    gl.uniform1f(u("uEnamel"), g.enamel);
    gl.uniform1f(u("uInkCover"), g.inkCover);
    gl.uniform1f(u("uLegible"), g.legible);
    gl.uniform1f(u("uSeed"), seed);
    gl.uniform1f(u("uLive"), live ? 1 : 0);
    gl.uniform4fv(u("uAxis"), axis);
    gl.uniform4fv(u("uPool"), live ? [...live.pool, live.set, live.glow] : [0, 0, 1, 1]);
    gl.uniform4fv(u("uSweep"), live ? [...live.glint, live.haze, live.drift] : [0, 0, 0, 0]);
    gl.uniform3fv(u("uSheen"), live ? live.sheen : [0, 0, 0]);
    gl.uniform1i(u("uDebug"), (globalThis as { __compDebug?: number }).__compDebug ?? 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Draws `a`, or `a` crossfaded `t` of the way to `b`, each optionally warped, into a 2D canvas at `a`'s size. */
  present(ctx: CanvasRenderingContext2D, a: Target, b: Target | null = null, t = 0, warpA: Warp = STILL, warpB: Warp = STILL) {
    const gl = this.gl;
    const { w, h } = a;
    if (this.canvas.width < w || this.canvas.height < h) {
      this.canvas.width = Math.max(this.canvas.width, w);
      this.canvas.height = Math.max(this.canvas.height, h);
    }
    const u = this.use(this.blit);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    this.bind(u, [
      ["uA", a.tex],
      ["uB", (b ?? a).tex],
    ]);
    gl.uniform3fv(u("uWarpA"), warpA);
    gl.uniform3fv(u("uWarpB"), warpB);
    gl.uniform1f(u("uMix"), b ? t : 0);
    gl.uniform1i(u("uHeight"), h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
      ctx.canvas.width = w;
      ctx.canvas.height = h;
    }
    ctx.drawImage(this.canvas, 0, this.canvas.height - h, w, h, 0, 0, w, h);
  }
}
