// Integer-lattice hash without sin(), so it stays stable at the large coordinates the stretched noise reaches.
const NOISE = /* glsl */ `
  float tHash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float tNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(tHash(i), tHash(i + vec2(1.0, 0.0)), u.x), mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float tFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * tNoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
  }
`;

// Noise stretched along the fall line. It blends the two nearest of four fixed orientations,
// because rotating one domain by a varying angle smears into fingerprint whorls.
const FLOW = /* glsl */ `
  float tFlowAt(vec2 p, float i, float across, float along) {
    vec2 d = vec2(cos(i * 0.7853982), sin(i * 0.7853982));
    vec2 q = vec2(dot(p, vec2(-d.y, d.x)) * across, dot(p, d) * along) + i * 19.0;
    return tNoise(q) * 0.65 + tNoise(q * 2.1 + 9.0) * 0.35;
  }
  float tFlow(vec2 p, vec2 down, float across, float along) {
    p += (vec2(tNoise(p * 1.7), tNoise(p * 1.7 + 31.0)) - 0.5) * 0.3;
    float s = mod(atan(down.y, down.x), 3.1415927) / 0.7853982;
    float i = floor(s);
    return mix(tFlowAt(p, i, across, along), tFlowAt(p, mod(i + 1.0, 4.0), across, along), smoothstep(0.0, 1.0, s - i));
  }
`;

export const MASSIF_VERTEX_PARS = /* glsl */ `
  #include <common>
  varying vec3 vTerrain;
`;

export const MASSIF_VERTEX = /* glsl */ `
  #include <begin_vertex>
  vTerrain = transformed;
`;

export const MASSIF_FRAGMENT_PARS = /* glsl */ `
  #include <common>
  uniform float uSnowLine;
  uniform float uRelief;
  uniform vec2 uSunline;
  uniform vec3 uForest;
  uniform vec3 uMeadow;
  uniform vec3 uScree;
  uniform vec3 uRock;
  uniform vec3 uSnow;
  uniform vec3 uGlacier;
  uniform sampler2D uDetail;
  varying vec3 vTerrain;
  ${NOISE}
  ${FLOW}
`;

// Forest, meadow, scree, then granite; snow above the bulletin's snow line sheds only from steep
// ground and gathers in gullies, near continuous above 3 300 m. Mapped glaciers stay ice.
export const MASSIF_COLOUR = /* glsl */ `
  #include <color_fragment>
  vec3 terrainNormal = normalize(texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0);
  // Cover reads the surface low-passed to at least ~100 m, so the snow edge follows ridges and
  // gullies rather than every 8-bit step of the per-pixel normal.
  vec2 terrainTexel = vNormalMapUv * vec2(textureSize(normalMap, 0));
  float terrainLod = 0.5 * log2(max(max(dot(dFdx(terrainTexel), dFdx(terrainTexel)), dot(dFdy(terrainTexel), dFdy(terrainTexel))), 1e-6));
  vec3 terrainBroad = normalize(textureLod(normalMap, vNormalMapUv, max(2.0, terrainLod + 1.0)).xyz * 2.0 - 1.0);
  vec4 terrainDetailMap = textureLod(uDetail, vNormalMapUv, max(0.5, terrainLod));
  float terrainAlt = vTerrain.y / uRelief * 1000.0;
  float terrainUp = clamp(terrainBroad.y, 0.05, 1.0);
  float terrainDeg = degrees(atan(sqrt(1.0 - terrainUp * terrainUp) / terrainUp / uRelief));
  float terrainHollow = terrainDetailMap.r * 2.0 - 1.0;
  float terrainGully = terrainDetailMap.b * 2.0 - 1.0;
  float terrainGlacier = smoothstep(0.25, 0.75, terrainDetailMap.g);
  float terrainHigh = smoothstep(3200.0, 3700.0, terrainAlt);
  float terrainKm = sqrt(length(dFdx(vTerrain.xz)) * length(dFdy(vTerrain.xz)));
  vec2 terrainDown = normalize(terrainBroad.xz + vec2(1e-4, 0.0));
  float terrainStreak = mix(tFlow(vTerrain.xz, terrainDown, 16.0, 2.0), 0.5, smoothstep(0.5, 1.2, terrainKm * 16.0));
  float terrainVein = mix(tFlow(vTerrain.xz + 7.0, terrainDown, 44.0, 4.0), 0.5, smoothstep(0.5, 1.2, terrainKm * 44.0));

  vec3 ground = mix(uForest, uMeadow, smoothstep(1750.0, 2200.0, terrainAlt - terrainHollow * 150.0));
  ground = mix(ground, uScree, smoothstep(2300.0, 2750.0, terrainAlt));
  ground = mix(ground, uRock, max(smoothstep(26.0, 40.0, terrainDeg) * smoothstep(1500.0, 2100.0, terrainAlt), smoothstep(2700.0, 3100.0, terrainAlt)));
  ground *= 0.92 + 0.16 * terrainStreak;

  // The snow line wanders a couple of hundred metres over a kilometre or so, lower on north faces and in hollows.
  float terrainLine = uSnowLine - terrainHollow * 240.0 + terrainBroad.z * 160.0 + (tNoise(vTerrain.xz * 0.9) - 0.5) * 320.0;
  float terrainLying = smoothstep(terrainLine - 200.0, terrainLine + 200.0, terrainAlt);
  float terrainShed = mix(34.0, 46.0, terrainHigh) + terrainHollow * 6.0 + terrainGully * 10.0 + terrainGlacier * 12.0;
  float terrainHold = 1.0 - smoothstep(terrainShed - 9.0, terrainShed + 10.0, terrainDeg);
  // Each soft cover is cut against noise: streaked down the fall line where snow sheds off steep
  // ground, so it survives in runnels between rock ribs; patchy where it thins out with altitude.
  float terrainBand = 2.3 * smoothstep(0.0, 0.3, terrainHold) * (1.0 - smoothstep(0.7, 1.0, terrainHold));
  float terrainCut = terrainHold - 0.5 - (terrainStreak - 0.5) * terrainBand;
  float terrainPatch = tNoise(vTerrain.xz * 7.0) * 0.6 + terrainStreak * 0.4;
  float terrainThin = terrainLying - 0.5 - (terrainPatch - 0.5) * 1.4 * smoothstep(0.0, 0.3, terrainLying) * (1.0 - smoothstep(0.7, 1.0, terrainLying));
  float terrainAa = fwidth(terrainCut) * 0.8 + 0.01;
  float terrainAb = fwidth(terrainThin) * 0.8 + 0.01;
  float terrainSnow = smoothstep(-terrainAa, terrainAa, terrainCut) * smoothstep(-terrainAb, terrainAb, terrainThin);
  // Bare rock above the snow line stays plastered in thin veins, so it reads grey-white, not as dark holes.
  float terrainPlaster = smoothstep(terrainLine, terrainLine + 400.0, terrainAlt) * smoothstep(0.56, 0.8, terrainVein) * (1.0 - smoothstep(55.0, 70.0, terrainDeg));
  terrainSnow = max(terrainSnow, terrainPlaster * 0.75);

  // Below the snow line the mapped glaciers stay ice: blue-white, crevassed across the flow, grey with moraine at the snout.
  float terrainBare = 1.0 - smoothstep(uSnowLine - 300.0, uSnowLine + 250.0, terrainAlt);
  float terrainCrevasse = smoothstep(0.62, 0.9, tFlow(vTerrain.xz, terrainDown, 9.0, 60.0)) * (1.0 - smoothstep(0.3, 0.8, terrainKm * 60.0));
  vec3 terrainIce = mix(uGlacier, uSnow, 0.55) * (0.9 + 0.1 * terrainStreak) * (1.0 - 0.3 * terrainCrevasse);
  terrainIce = mix(terrainIce, uScree * 1.15, (1.0 - smoothstep(1350.0, 2000.0, terrainAlt)) * 0.55);
  vec3 terrainWhite = mix(uSnow, terrainIce, terrainGlacier * terrainBare);
  terrainSnow = max(terrainSnow, terrainGlacier * (1.0 - smoothstep(50.0, 62.0, terrainDeg)));
  diffuseColor.rgb = mix(ground, terrainWhite, terrainSnow);
`;

// Rock carries fine relief the 26 m DEM cannot: ridged noise tilts the normal, much less on snow,
// and fades out where a pixel covers more than a ridge so distant faces never comb.
export const MASSIF_NORMAL = /* glsl */ `
  vec2 terrainP = vTerrain.xz * 26.0;
  float terrainR0 = 1.0 - abs(tNoise(terrainP) * 2.0 - 1.0) + 0.5 * (1.0 - abs(tNoise(terrainP * 2.3) * 2.0 - 1.0));
  float terrainRx = 1.0 - abs(tNoise(terrainP + vec2(0.35, 0.0)) * 2.0 - 1.0) + 0.5 * (1.0 - abs(tNoise((terrainP + vec2(0.35, 0.0)) * 2.3) * 2.0 - 1.0));
  float terrainRz = 1.0 - abs(tNoise(terrainP + vec2(0.0, 0.35)) * 2.0 - 1.0) + 0.5 * (1.0 - abs(tNoise((terrainP + vec2(0.0, 0.35)) * 2.3) * 2.0 - 1.0));
  float terrainDetail = mix(0.5, 0.1, terrainSnow) * mix(0.3, 1.0, smoothstep(1800.0, 2500.0, terrainAlt)) * (1.0 - smoothstep(0.25, 0.7, terrainKm * 60.0));
  vec3 terrainBent = normalize(terrainNormal + vec3(terrainR0 - terrainRx, 0.0, terrainR0 - terrainRz) * terrainDetail);
  normal = normalize(normalMatrix * terrainBent);
`;

// The ranges east of the model shade the low ground at first light; hollows lose some sky.
export const MASSIF_LIGHT = /* glsl */ `
  float terrainSun = smoothstep(uSunline.x, uSunline.y, terrainAlt + (terrainStreak - 0.5) * 200.0);
  reflectedLight.directDiffuse *= terrainSun;
  reflectedLight.directSpecular *= terrainSun;
  reflectedLight.indirectDiffuse *= 1.0 - 0.32 * clamp(terrainHollow, 0.0, 1.0);
  #include <aomap_fragment>
`;

// The model's square edge melts into the haze instead of ending against the sky.
export const MASSIF_EDGE = /* glsl */ `
  #include <fog_fragment>
  vec2 terrainEdge = min(vNormalMapUv, 1.0 - vNormalMapUv);
  gl_FragColor.rgb = mix(fogColor, gl_FragColor.rgb, smoothstep(0.0, 0.16, min(terrainEdge.x, terrainEdge.y)));
`;

export const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The horizon warms only toward the sun and cools to a mauve belt opposite it; the join with the
// haze below is broken by noise, and high cloud picks up the sun's colour.
export const SKY_FRAGMENT = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uFog;
  uniform vec3 uGlow;
  uniform float uGlowStrength;
  uniform float uBand;
  uniform vec3 uSun;
  uniform vec3 uSunColour;
  uniform float uStars;
  uniform float uWisps;
  ${NOISE}
  float sHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  void main() {
    vec3 dir = normalize(vWorld - cameraPosition);
    vec3 sun = normalize(uSun);
    float around = atan(dir.x, dir.z);
    float h = dir.y + (tNoise(vec2(around * 9.0, 0.0)) - 0.5) * 0.012;
    float toward = dot(normalize(dir.xz + vec2(1e-5)), normalize(sun.xz + vec2(1e-5))) * 0.5 + 0.5;
    float warm = smoothstep(0.25, 1.0, toward);
    vec3 horizon = mix(mix(uHorizon, uFog, 0.6 * min(uGlowStrength, 1.0)), uHorizon, warm);
    vec3 sky = mix(horizon, uTop, pow(smoothstep(-0.02, uBand, h), 0.7));
    sky = mix(uFog, sky, smoothstep(-0.1, 0.03, h));
    float facing = max(dot(dir, sun), 0.0);
    float band = 1.0 - smoothstep(0.0, uBand * 1.33, abs(h - 0.03));
    sky += uGlow * uGlowStrength * (pow(facing, 5.0) * 0.5 * band + pow(facing, 40.0) * 0.45 + warm * warm * band * 0.18);

    vec2 deck = dir.xz / max(dir.y + 0.08, 0.1) * 1.6;
    float wisp = tFbm(vec2(deck.x * 0.55, deck.y * 1.7) + 3.0) * 0.7 + tFbm(deck * 3.1 + 11.0) * 0.3;
    float wisps = smoothstep(0.5, 0.8, wisp) * smoothstep(0.03, 0.14, h) * (1.0 - smoothstep(0.32, 0.62, h)) * uWisps;
    vec3 wispColour = mix(mix(uTop, horizon, 0.6) * 1.25, uSunColour * mix(horizon, vec3(1.0), 0.5), pow(facing, 2.0) * 0.8 + warm * 0.25);
    sky = mix(sky, wispColour, wisps * 0.55);

    vec3 cell = floor(dir * 520.0);
    float star = step(0.9988, sHash(cell)) * (0.4 + 0.6 * sHash(cell + 3.1));
    sky += vec3(star * uStars * smoothstep(0.04, 0.3, h) * (1.0 - wisps) * 0.85);
    gl_FragColor = vec4(sky, 1.0);
    #include <colorspace_fragment>
  }
`;

export const CLOUD_VERTEX = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export const CLOUD_FRAGMENT = /* glsl */ `
  #include <fog_pars_fragment>
  varying vec3 vWorld;
  uniform sampler2D uSurface;
  uniform float uSpan;
  uniform float uLevel;
  uniform float uTime;
  uniform float uCover;
  uniform float uSeed;
  uniform vec3 uLit;
  uniform vec3 uShade;
  ${NOISE}
  void main() {
    vec2 p = vWorld.xz * 0.21 + vec2(uTime * 0.011 + uSeed, uTime * 0.006 - uSeed);
    float body = tFbm(p) * 0.68 + tFbm(p * 2.6 + 5.0) * 0.32;
    float density = smoothstep(1.0 - uCover - 0.12, 1.0 - uCover + 0.3, body);
    vec2 uv = vec2(vWorld.x / uSpan + 0.5, 0.5 - vWorld.z / uSpan);
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    float ground = texture2D(uSurface, clamp(uv, 0.0, 1.0)).a * inside;
    density *= 1.0 - smoothstep(uLevel - 0.045, uLevel + 0.004, ground);
    float rim = length(vWorld.xz) / (uSpan * 0.95);
    density *= 1.0 - smoothstep(0.75, 1.0, rim);
    vec3 colour = mix(uShade, uLit, smoothstep(0.3, 0.85, body));
    gl_FragColor = vec4(colour, density * 0.92);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;
