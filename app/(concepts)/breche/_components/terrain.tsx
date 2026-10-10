"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import type { MotionValue } from "motion/react";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  CatmullRomCurve3,
  Color,
  MathUtils,
  NeutralToneMapping,
  DoubleSide,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type Group,
} from "three";

import { ROUTE, TERRAIN } from "../_lib/content";

const SEGMENTS = { wide: 448, tall: 224 };
const SNOW_LINE = 1450;
const ROCK = new Color("#5b6675");
const SCREE = new Color("#78828f");
const SNOW = new Color("#f2f7ff");
const GLACIER = new Color("#c2dcf2");
// Snow in shadow is deep blue, never black — it still collects the whole sky.
const SHADOW = new Color("#4c586e");
const SUNLIGHT = new Color("#ffe8dc");
const CLOUD_LEVEL = 1950;
// Matches the key light, so the baked relief and the lit surface agree.
const SUN = { x: -0.66, y: 0.2, z: 0.72 };

const smooth = (v: number) => v * v * (3 - 2 * v);
const between = (v: number, from: number, to: number) => Math.min(1, Math.max(0, (v - from) / (to - from)));

// Metres above sea level become world units: kilometres, overstated like a relief model.
const toWorld = (lat: number, lon: number, altitude: number) => {
  const x = ((lon - TERRAIN.west) / (TERRAIN.east - TERRAIN.west) - 0.5) * TERRAIN.span;
  const z = -((lat - TERRAIN.south) / (TERRAIN.north - TERRAIN.south) - 0.5) * TERRAIN.span;
  const y = (altitude / 1000) * TERRAIN.relief;
  return new Vector3(x, y, z);
};

type Heights = { data: Float32Array; size: number };

function blur(field: Float32Array, size: number) {
  const pass = (input: Float32Array, horizontal: boolean) => {
    const output = new Float32Array(input.length);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const at = (dx: number, dy: number) => {
          const sx = Math.min(size - 1, Math.max(0, x + dx));
          const sy = Math.min(size - 1, Math.max(0, y + dy));
          return input[sy * size + sx];
        };
        const a = horizontal ? at(-1, 0) : at(0, -1);
        const b = input[y * size + x];
        const c = horizontal ? at(1, 0) : at(0, 1);
        output[y * size + x] = (a + 2 * b + c) / 4;
      }
    }
    return output;
  };
  // Two full separable rounds: one is not enough to stop per-texel DEM noise
  // becoming visible sawtooth once the mesh samples it near 1:1.
  let out = field;
  for (let i = 0; i < 3; i++) out = pass(pass(out, true), false);
  return out;
}

function useHeights() {
  const [heights, setHeights] = useState<Heights | null>(null);
  useEffect(() => {
    let cancelled = false;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, image.width, image.height);
      const out = new Float32Array(image.width * image.height);
      for (let i = 0; i < out.length; i++) {
        const encoded = (data[i * 4] * 256 + data[i * 4 + 1]) / 65535;
        out[i] = TERRAIN.min + encoded * (TERRAIN.max - TERRAIN.min);
      }
      if (!cancelled) setHeights({ data: blur(out, image.width), size: image.width });
    };
    image.src = TERRAIN.file;
    return () => {
      cancelled = true;
    };
  }, []);
  return heights;
}

function Sky() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          high: { value: new Color("#17253f") },
          low: { value: new Color("#6b6480") },
          glow: { value: new Color("#8fa8cf") },
        },
        vertexShader: `
          varying vec3 vWorld;
          void main() {
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vWorld;
          uniform vec3 high;
          uniform vec3 low;
          uniform vec3 glow;
          void main() {
            float h = clamp(normalize(vWorld).y * 1.35 + 0.12, 0.0, 1.0);
            vec3 sky = mix(low, high, smoothstep(-0.04, 0.32, h));
            float sun = pow(clamp(1.0 - distance(normalize(vWorld), normalize(vec3(-0.66, 0.2, 0.72))), 0.0, 1.0), 5.0);
            gl_FragColor = vec4(mix(sky, glow, sun * 0.92), 1.0);
          }
        `,
      }),
    [],
  );
  return <mesh material={material} frustumCulled={false}><sphereGeometry args={[150, 48, 24]} /></mesh>;
}

function Massif({ heights, segments }: { heights: Heights; segments: number }) {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(TERRAIN.span, TERRAIN.span, segments, segments);
    plane.rotateX(-Math.PI / 2);
    const position = plane.attributes.position as BufferAttribute;
    const colour = new Float32Array(position.count * 3);
    const tint = new Color();

    const sample = (u: number, v: number) => {
      const x = Math.min(heights.size - 1, Math.max(0, u * (heights.size - 1)));
      const y = Math.min(heights.size - 1, Math.max(0, v * (heights.size - 1)));
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(heights.size - 1, x0 + 1);
      const y1 = Math.min(heights.size - 1, y0 + 1);
      const fx = x - x0;
      const fy = y - y0;
      const a = heights.data[y0 * heights.size + x0];
      const b = heights.data[y0 * heights.size + x1];
      const c = heights.data[y1 * heights.size + x0];
      const d = heights.data[y1 * heights.size + x1];
      return MathUtils.lerp(MathUtils.lerp(a, b, fx), MathUtils.lerp(c, d, fx), fy);
    };

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const u = x / TERRAIN.span + 0.5;
      const v = z / TERRAIN.span + 0.5;
      const metres = sample(u, v);
      position.setY(i, (metres / 1000) * TERRAIN.relief);

      const step = 3.4 / segments;
      const cell = (TERRAIN.span / segments) * 1000;
      const gx = (sample(u + step, v) - sample(u - step, v)) / (2 * cell);
      const gy = (sample(u, v + step) - sample(u, v - step)) / (2 * cell);
      const slope = Math.hypot(gx, gy);
      const length = Math.hypot(-gx, 1, -gy);
      const lambert = Math.max(0, (-gx * SUN.x + SUN.y - gy * SUN.z) / length);

      // Snow settles on the tops but slides off anything steep; the rest is rock, and
      // the flat high ground reads as glacier.
      const holds = smooth(between(metres, SNOW_LINE - 600, SNOW_LINE + 700)) * (1 - smooth(between(slope, 1.6, 3.6)));
      const ice = smooth(between(metres, 2600, 3500)) * (1 - smooth(between(slope, 0.15, 0.7)));
      tint.copy(ROCK).lerp(SCREE, between(metres, 900, 2300)).lerp(SNOW, holds).lerp(GLACIER, ice * 0.6);
      // Shade goes deep blue; the sun adds only a touch, since the key light is warm already.
      tint.lerp(SHADOW, 0.26 * Math.pow(1 - lambert, 1.1));
      tint.lerp(SUNLIGHT, 0.1 * Math.pow(lambert, 2.4));
      tint.multiplyScalar(0.8 + 0.4 * lambert);
      // Fine grain, so the DEM's terraces break into snow texture instead of flat bands.
      const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      tint.multiplyScalar(0.955 + 0.09 * (seed - Math.floor(seed)));
      colour[i * 3] = tint.r;
      colour[i * 3 + 1] = tint.g;
      colour[i * 3 + 2] = tint.b;
    }

    plane.setAttribute("color", new BufferAttribute(colour, 3));
    plane.computeVertexNormals();
    return plane;
  }, [heights, segments]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.86} metalness={0} />
    </mesh>
  );
}

function RouteLine({ progress }: { progress: MotionValue<number> }) {
  const drawn = useRef<Group>(null);
  const points = useMemo(() => {
    const anchors = ROUTE.map((w) => toWorld(w.lat, w.lon, w.altitude + 60));
    return new CatmullRomCurve3(anchors, false, "catmullrom", 0.4).getPoints(220);
  }, []);

  useFrame(() => {
    const group = drawn.current;
    if (!group) return;
    const shown = smooth(between(progress.get(), 0.18, 0.72));
    group.scale.setScalar(shown > 0 ? 1 : 0.0001);
    group.visible = shown > 0.01;
  });

  return (
    <group ref={drawn}>
      <Line points={points} color="#e2552c" lineWidth={2.4} transparent opacity={0.95} />
    </group>
  );
}

const CLOUD_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CLOUD_FRAGMENT = `
  varying vec2 vUv;
  uniform float time;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 p = vUv * 7.0 + vec2(time * 0.012, time * 0.007);
    float body = fbm(p) * 0.75 + fbm(p * 2.3 + 4.0) * 0.25;
    float edge = smoothstep(0.08, 0.34, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    float alpha = smoothstep(0.42, 0.78, body) * edge;
    gl_FragColor = vec4(mix(vec3(0.06, 0.09, 0.15), vec3(0.42, 0.39, 0.44), body), alpha * 0.82);
  }
`;

function CloudSea() {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);

  useFrame((_, dt) => {
    const cloud = material.current;
    if (!cloud) return;
    cloud.uniforms.time.value += dt;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (CLOUD_LEVEL / 1000) * TERRAIN.relief, 0]}>
      <planeGeometry args={[TERRAIN.span * 1.6, TERRAIN.span * 1.6, 1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={CLOUD_VERTEX}
        fragmentShader={CLOUD_FRAGMENT}
        transparent
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}

function SunGlow() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { tint: { value: new Color("#9db9e8") } },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec3 tint;
          void main() {
            float d = distance(vUv, vec2(0.5));
            float core = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(tint, pow(core, 2.4) * 0.45);
          }
        `,
      }),
    [],
  );
  return (
    <mesh material={material} position={[-62, 20, 70]}>
      <planeGeometry args={[52, 52, 1, 1]} />
    </mesh>
  );
}

function Rig({ progress, tall }: { progress: MotionValue<number>; tall: boolean }) {
  const eye = useRef<Vector3 | null>(null);
  const aim = useRef(new Vector3());
  const summit = useMemo(() => toWorld(ROUTE[ROUTE.length - 1].lat, ROUTE[ROUTE.length - 1].lon, ROUTE[ROUTE.length - 1].altitude), []);
  const hut = useMemo(() => toWorld(ROUTE[3].lat, ROUTE[3].lon, ROUTE[3].altitude), []);
  const valley = useMemo(() => toWorld(ROUTE[0].lat, ROUTE[0].lon, ROUTE[0].altitude), []);

  const shots = useMemo(() => {
    const lift = tall ? 1.35 : 1;
    return [
      { eye: new Vector3(-13 * lift, 13.5 * lift, 16 * lift), look: new Vector3(0, 3.4, 0) },
      { eye: new Vector3(valley.x - 6.4, valley.y + 7.4, valley.z + 9.6), look: new Vector3(hut.x, hut.y + 0.9, hut.z) },
      { eye: new Vector3(hut.x - 5.2, hut.y + 4.4, hut.z + 7), look: new Vector3(summit.x, summit.y - 0.3, summit.z) },
      { eye: new Vector3(summit.x + 5.4, summit.y + 4.2, summit.z + 7.2), look: new Vector3(summit.x - 0.6, summit.y - 1.4, summit.z - 1.2) },
    ];
  }, [tall, summit, hut, valley]);

  useFrame(({ camera, pointer }, dt) => {
    const p = Math.min(1, Math.max(0, progress.get()));
    const scaled = p * (shots.length - 1);
    const index = Math.min(shots.length - 2, Math.floor(scaled));
    const t = smooth(scaled - index);
    const from = shots[index];
    const to = shots[index + 1];

    const targetEye = new Vector3().lerpVectors(from.eye, to.eye, t);
    targetEye.x += pointer.x * 0.9;
    targetEye.y += pointer.y * 0.4;
    const targetAim = new Vector3().lerpVectors(from.look, to.look, t);

    if (!eye.current) {
      eye.current = targetEye.clone();
      aim.current.copy(targetAim);
    }
    const k = 1 - Math.exp(-dt * 3.2);
    eye.current.lerp(targetEye, k);
    aim.current.lerp(targetAim, k);
    camera.position.copy(eye.current);
    camera.lookAt(aim.current);
  });

  return null;
}

export function Terrain({ progress }: { progress: MotionValue<number> }) {
  const heights = useHeights();
  const [tall, setTall] = useState(false);

  useEffect(() => {
    const check = () => setTall(window.innerWidth < window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!heights) return null;

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.6]}
      camera={{ fov: 42, near: 0.1, far: 220, position: [-13, 13.5, 16] }}
      gl={{ antialias: true, toneMapping: NeutralToneMapping }}
      className="!absolute !inset-0"
    >
      <color attach="background" args={["#070c14"]} />
      {/* Haze is lighter than the terrain, never darker — distance must wash out, not black out. */}
      <fogExp2 attach="fog" args={["#5a6b8a", 0.012]} />
      <Sky />
      <ambientLight intensity={0.45} color="#b6c6dc" />
      <hemisphereLight args={["#93a6c0", "#4b5466", 0.95]} />
      <directionalLight
        position={[-19, 5.6, 20.4]}
        intensity={2.2}
        color="#ffeede"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0012}
        shadow-normalBias={0.06}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <directionalLight position={[14, 6, -10]} intensity={0.3} color="#3d5f96" />
      <SunGlow />
      <Massif heights={heights} segments={tall ? SEGMENTS.tall : SEGMENTS.wide} />
      <CloudSea />
      <RouteLine progress={progress} />
      <Rig progress={progress} tall={tall} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.3} intensity={0.4} mipmapBlur />
        <Vignette offset={0.32} darkness={0.22} />
      </EffectComposer>
    </Canvas>
  );
}
