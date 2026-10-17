"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import {
  BackSide,
  Color,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  ObjectSpaceNormalMap,
  PCFShadowMap,
  PerspectiveCamera,
  ShaderMaterial,
  type BufferGeometry,
  Vector2,
  Vector3,
  setConsoleFunction,
  type IUniform,
} from "three";

import { CHAPTERS, chapterAt, routeAt, type Chapter, type Light, type Moment } from "../_lib/chapters";
import { TERRAIN } from "../_lib/content";
import { cn } from "@/lib/utils";
import { detailTexture, heightAt, loadField, massifGeometry, surfaceTexture, toWorld, worldY, type Field } from "./terrain-field";
import { LetteringLayer, labelState, placeLabels } from "./terrain-labels";
import { RouteLines, buildRoute, type RouteHandle, type RoutePath } from "./terrain-route";
import {
  CLOUD_FRAGMENT,
  CLOUD_VERTEX,
  MASSIF_COLOUR,
  MASSIF_EDGE,
  MASSIF_FRAGMENT_PARS,
  MASSIF_LIGHT,
  MASSIF_NORMAL,
  MASSIF_VERTEX,
  MASSIF_VERTEX_PARS,
  SKY_FRAGMENT,
  SKY_VERTEX,
} from "./terrain-shaders";

const CLOUD_LEVEL = 1900;
const SHADOWS = { enabled: true, type: PCFShadowMap, autoUpdate: false };
const GL = { antialias: true, toneMapping: NeutralToneMapping, powerPreference: "high-performance" as const };
/** Device pixels the canvas may fill: retina and 1440p screens trade a little sharpness for a steady frame rate. */
const PIXEL_BUDGET = 2.2e6;
/** Seconds the massif takes to rise out of the haze on arrival, while the camera settles in. */
const ARRIVAL = 2.2;
/** cos(0.25°): the shadow map is only redrawn once the sun has moved further than this. */
const SUN_STEP = Math.cos(MathUtils.degToRad(0.25));

// R3F 9 still creates a THREE.Clock, which three 0.186 reports as deprecated on every mount.
setConsoleFunction((type: "log" | "warn" | "error", message: string, ...params: unknown[]) => {
  if (message.startsWith("THREE.Clock:")) return;
  console[type](message, ...params);
});

type Assets = { field: Field; surface: DataTexture; detail: DataTexture; geometry: BufferGeometry };

const breathe = () => new Promise((resolve) => setTimeout(resolve, 0));

// Everything is ready before the Canvas mounts: anything suspending inside it after the first
// commit makes R3F force-lose the WebGL context. Each step yields, so none blocks a scroll.
function useAssets(segments: number) {
  const [assets, setAssets] = useState<Assets | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const field = await loadField().catch(() => null);
      if (!field) return;
      await breathe();
      const surface = surfaceTexture(field);
      await breathe();
      const detail = detailTexture(field);
      await breathe();
      const geometry = massifGeometry(field, segments);
      await breathe();
      if (cancelled) return;
      setAssets({ field, surface, detail, geometry });
    })();
    return () => {
      cancelled = true;
    };
  }, [segments]);
  return assets;
}

/** Mesh detail is chosen once from the screen's longest side in device pixels, so rotating never rebuilds it. */
function pickSegments() {
  const pixels = Math.max(window.screen.width, window.screen.height) * Math.min(2, window.devicePixelRatio || 1);
  return pixels > 1500 ? 448 : 320;
}

type Parsed = {
  top: Color;
  horizon: Color;
  glow: Color;
  glowStrength: number;
  band: number;
  wisps: number;
  sun: Vector3;
  sunColour: Color;
  sunIntensity: number;
  sunline: number;
  hemiSky: Color;
  hemiGround: Color;
  hemiIntensity: number;
  fog: Color;
  fogDensity: number;
  cloudLit: Color;
  cloudShade: Color;
  cover: number;
  stars: number;
};

function sunVector(azimuth: number, elevation: number, out = new Vector3()) {
  const a = MathUtils.degToRad(azimuth);
  const e = MathUtils.degToRad(elevation);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

const parse = (light: Light): Parsed => ({
  top: new Color(light.sky.top),
  horizon: new Color(light.sky.horizon),
  glow: new Color(light.sky.glow),
  glowStrength: light.sky.glowStrength,
  band: light.sky.band,
  wisps: light.sky.wisps,
  sun: sunVector(light.sun.azimuth, light.sun.elevation),
  sunColour: new Color(light.sun.colour),
  sunIntensity: light.sun.intensity,
  sunline: light.sunline,
  hemiSky: new Color(light.hemi.sky),
  hemiGround: new Color(light.hemi.ground),
  hemiIntensity: light.hemi.intensity,
  fog: new Color(light.fog.colour),
  fogDensity: light.fog.density,
  cloudLit: new Color(light.cloud.lit),
  cloudShade: new Color(light.cloud.shade),
  cover: light.cloud.cover,
  stars: light.stars,
});

const blank = (): Parsed => parse(CHAPTERS[0].light);
const PARSED = new Map<Light, Parsed>();
const parsed = (light: Light) => {
  let value = PARSED.get(light);
  if (!value) PARSED.set(light, (value = parse(light)));
  return value;
};

function mixParsed(a: Parsed, b: Parsed, t: number, out: Parsed) {
  const n = (x: number, y: number) => x + (y - x) * t;
  out.top.lerpColors(a.top, b.top, t);
  out.horizon.lerpColors(a.horizon, b.horizon, t);
  out.glow.lerpColors(a.glow, b.glow, t);
  out.glowStrength = n(a.glowStrength, b.glowStrength);
  out.band = n(a.band, b.band);
  out.wisps = n(a.wisps, b.wisps);
  out.sun.lerpVectors(a.sun, b.sun, t).normalize();
  out.sunColour.lerpColors(a.sunColour, b.sunColour, t);
  out.sunIntensity = n(a.sunIntensity, b.sunIntensity);
  out.sunline = n(a.sunline, b.sunline);
  out.hemiSky.lerpColors(a.hemiSky, b.hemiSky, t);
  out.hemiGround.lerpColors(a.hemiGround, b.hemiGround, t);
  out.hemiIntensity = n(a.hemiIntensity, b.hemiIntensity);
  out.fog.lerpColors(a.fog, b.fog, t);
  out.fogDensity = n(a.fogDensity, b.fogDensity);
  out.cloudLit.lerpColors(a.cloudLit, b.cloudLit, t);
  out.cloudShade.lerpColors(a.cloudShade, b.cloudShade, t);
  out.cover = n(a.cover, b.cover);
  out.stars = n(a.stars, b.stars);
  return out;
}

function lightAt(m: Moment, out: Parsed) {
  const from = CHAPTERS[m.from];
  const to = CHAPTERS[m.to];
  if (m.from === m.to) return mixParsed(parsed(from.light), parsed(from.lightEnd ?? from.light), m.drift, out);
  return mixParsed(parsed(from.lightEnd ?? from.light), parsed(to.light), m.t, out);
}

type Pose = { target: Vector3; heading: number; pitch: number; distance: number; fov: number; fx: number; fy: number };
const pose = (): Pose => ({ target: new Vector3(), heading: 0, pitch: 0, distance: 0, fov: 40, fx: 0, fy: 0 });

function poseOf(chapter: Chapter, drift: number, tall: boolean, out: Pose) {
  const { shot } = chapter;
  toWorld(shot.at[0], shot.at[1], shot.at[2], out.target);
  out.heading = shot.heading + chapter.drift.heading * drift;
  out.pitch = shot.pitch + chapter.drift.pitch * drift;
  out.distance = (tall ? shot.tall.distance : shot.distance) + chapter.drift.distance * drift;
  out.fov = tall ? shot.tall.fov : shot.fov;
  [out.fx, out.fy] = tall ? shot.tall.frame : shot.frame;
  return out;
}

function mixPose(a: Pose, b: Pose, t: number, out: Pose) {
  out.target.lerpVectors(a.target, b.target, t);
  const turn = ((((b.heading - a.heading) % 360) + 540) % 360) - 180;
  out.heading = a.heading + turn * t;
  out.pitch = a.pitch + (b.pitch - a.pitch) * t;
  out.distance = Math.exp(Math.log(a.distance) + (Math.log(b.distance) - Math.log(a.distance)) * t);
  out.fov = a.fov + (b.fov - a.fov) * t;
  out.fx = a.fx + (b.fx - a.fx) * t;
  out.fy = a.fy + (b.fy - a.fy) * t;
  return out;
}

function Massif({ geometry, surface, uniforms }: { geometry: BufferGeometry; surface: DataTexture; uniforms: Record<string, IUniform> }) {
  const material = useMemo(() => {
    const surfaceMaterial = new MeshStandardMaterial({
      normalMap: surface,
      normalMapType: ObjectSpaceNormalMap,
      roughness: 0.93,
      metalness: 0,
    });
    surfaceMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader.replace("#include <common>", MASSIF_VERTEX_PARS).replace("#include <begin_vertex>", MASSIF_VERTEX);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", MASSIF_FRAGMENT_PARS)
        .replace("#include <color_fragment>", MASSIF_COLOUR)
        .replace("#include <normal_fragment_maps>", MASSIF_NORMAL)
        .replace("#include <aomap_fragment>", MASSIF_LIGHT)
        .replace("#include <fog_fragment>", MASSIF_EDGE);
    };
    surfaceMaterial.customProgramCacheKey = () => "breche-massif";
    return surfaceMaterial;
  }, [surface, uniforms]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

function Sky({ uniforms, follow }: { uniforms: Record<string, IUniform>; follow: RefObject<Mesh | null> }) {
  const material = useMemo(
    () => new ShaderMaterial({ side: BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT }),
    [uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh ref={follow} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[150, 48, 24]} />
    </mesh>
  );
}

function Clouds({ surface, uniforms }: { surface: DataTexture; uniforms: Record<string, IUniform> }) {
  const layers = useMemo(
    () =>
      [0, 1].map((layer) => {
        const level = CLOUD_LEVEL + layer * 90;
        return new ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
          fog: true,
          toneMapped: false,
          vertexShader: CLOUD_VERTEX,
          fragmentShader: CLOUD_FRAGMENT,
          uniforms: {
            ...uniforms,
            fogColor: { value: new Color() },
            fogDensity: { value: 0 },
            fogNear: { value: 1 },
            fogFar: { value: 1000 },
            uSurface: { value: surface },
            uSpan: { value: TERRAIN.span },
            uLevel: { value: (level - TERRAIN.min) / (TERRAIN.max - TERRAIN.min) },
            uSeed: { value: layer * 7.3 },
          },
        });
      }),
    [surface, uniforms],
  );
  useEffect(() => () => layers.forEach((material) => material.dispose()), [layers]);

  return (
    <>
      {layers.map((material, layer) => (
        <mesh key={layer} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, worldY(CLOUD_LEVEL + layer * 90), 0]} renderOrder={1}>
          <planeGeometry args={[TERRAIN.span * 1.9, TERRAIN.span * 1.9, 1, 1]} />
        </mesh>
      ))}
    </>
  );
}

type Work = ReturnType<typeof makeWork>;

function makeWork(field: Field) {
  return {
    moment: { from: 0, to: 0, t: 0, drift: 0 } as Moment,
    light: blank(),
    a: pose(),
    b: pose(),
    shot: pose(),
    eye: new Vector3(),
    forward: new Vector3(),
    tip: new Vector3(),
    lastSun: new Vector3(),
    sinceShadow: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    labels: labelState(field),
    shown: -1,
    cutAt: -1,
    first: true,
    arrivedAt: -1,
  };
}

function makeUniforms(snowLine: number, detail: DataTexture) {
  return {
    massif: {
      uDetail: { value: detail },
      uSnowLine: { value: snowLine },
      uRelief: { value: TERRAIN.relief },
      uSunline: { value: new Vector2(-2000, -1000) },
      uForest: { value: new Color("#2e352f") },
      uMeadow: { value: new Color("#55574b") },
      uScree: { value: new Color("#727478") },
      uRock: { value: new Color("#666a71") },
      uSnow: { value: new Color("#f4f7fb") },
      uGlacier: { value: new Color("#a9d3ea") },
    },
    sky: {
      uTop: { value: new Color() },
      uHorizon: { value: new Color() },
      uFog: { value: new Color() },
      uGlow: { value: new Color() },
      uGlowStrength: { value: 0 },
      uBand: { value: 0.24 },
      uSun: { value: new Vector3(0, 1, 0) },
      uSunColour: { value: new Color() },
      uStars: { value: 0 },
      uWisps: { value: 0 },
    },
    cloud: {
      uTime: { value: 0 },
      uCover: { value: 0.3 },
      uLit: { value: new Color() },
      uShade: { value: new Color() },
    },
  };
}

type WorldProps = {
  assets: Assets;
  snowLine: number;
  path: RoutePath;
  progress: MotionValue<number>;
  reduced: boolean;
  parallax: boolean;
  lineWidth: number;
  shadowSize: number;
  marks: RefObject<(HTMLElement | null)[]>;
  dip: RefObject<HTMLDivElement | null>;
  onCompiled: () => void;
  onFirstFrame: () => void;
};

/** One clock for the whole scene: camera, light, route and lettering all read the same moment. */
function World({ assets, snowLine, path, progress, reduced, parallax, lineWidth, shadowSize, marks, dip, onCompiled, onFirstFrame }: WorldProps) {
  const { field, surface, detail, geometry } = assets;
  const { gl, scene, camera } = useThree();
  const uniforms = useMemo(() => makeUniforms(snowLine, detail), [snowLine, detail]);
  const live = useRef(uniforms);
  const work = useRef<Work>(useMemo(() => makeWork(field), [field]));
  const sky = useRef<Mesh>(null);
  const fog = useRef<FogExp2>(null);
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const route = useRef<RouteHandle>(null);

  // Shaders compile off the main thread where the driver allows it; the loop starts once they are linked.
  const whenCompiled = useRef(onCompiled);
  useEffect(() => {
    let live = true;
    if (!gl.extensions.has("KHR_parallel_shader_compile")) whenCompiled.current();
    else gl.compileAsync(scene, camera).catch(() => {}).then(() => live && whenCompiled.current());
    return () => {
      live = false;
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (!parallax) return;
    const move = (event: PointerEvent) => {
      work.current.pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
      work.current.pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [parallax]);

  useFrame((state, dt) => {
    const { camera, size, clock, gl } = state;
    const w = work.current;
    const u = live.current;
    const p = Math.min(1, Math.max(0, progress.get()));
    const m = chapterAt(p, w.moment);

    // Reduced motion cuts between held shots behind a short dip to ink instead of flying.
    if (reduced) {
      const nearest = m.t < 0.5 ? m.from : m.to;
      if (w.shown === -1) w.shown = nearest;
      if (nearest !== w.shown && w.cutAt < 0) {
        w.cutAt = clock.elapsedTime;
        dip.current?.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 250, easing: "ease-in-out" });
      }
      if (w.cutAt >= 0 && clock.elapsedTime - w.cutAt > 0.125) {
        w.shown = nearest;
        w.cutAt = -1;
      }
      const inHold = m.from === m.to && m.from === w.shown;
      m.drift = inHold ? m.drift : nearest > w.shown ? 0 : 1;
      m.from = w.shown;
      m.to = w.shown;
      m.t = 0;
    }

    const tall = size.width < size.height;
    // Short, wide screens (a phone on its side) push the subject lower and further off, under the caption.
    const squeeze = MathUtils.clamp((size.width / size.height - 1.65) / 0.55, 0, 1);
    const shot = reduced
      ? poseOf(CHAPTERS[m.from], 0, tall, w.shot)
      : mixPose(poseOf(CHAPTERS[m.from], m.from === m.to ? m.drift : 1, tall, w.a), poseOf(CHAPTERS[m.to], 0, tall, w.b), m.t, w.shot);

    if (w.arrivedAt < 0) w.arrivedAt = clock.elapsedTime;
    const arrival = reduced ? 1 : MathUtils.smootherstep(clock.elapsedTime - w.arrivedAt, 0, ARRIVAL);
    shot.distance *= 1 + 0.14 * (1 - arrival);
    shot.pitch += 1.2 * (1 - arrival);

    shot.fy -= 0.24 * squeeze;
    shot.distance *= 1 + 0.12 * squeeze;
    // Short desktop windows lower the opening skyline so the buttons stay on sky.
    if (size.width >= 1024) shot.fy -= 0.1 * MathUtils.clamp((760 - size.height) / 110, 0, 1) * (m.from === 0 ? 1 - m.t : 0);

    const pointer = w.pointer;
    const follow = 1 - Math.exp(-dt * 2.5);
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;
    const heading = MathUtils.degToRad(shot.heading + (parallax ? pointer.x * 1.4 : 0));
    const pitch = MathUtils.degToRad(shot.pitch + (parallax ? pointer.y * 0.7 : 0));
    w.forward.set(Math.sin(heading) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(heading) * Math.cos(pitch));
    w.eye.copy(shot.target).addScaledVector(w.forward, -shot.distance);
    const ground = worldY(heightAt(field, w.eye.x, w.eye.z)) + 0.45;
    if (w.eye.y < ground) w.eye.y = ground;

    const lens = camera as PerspectiveCamera;
    lens.position.copy(w.eye);
    lens.lookAt(shot.target);
    lens.fov = shot.fov;
    lens.updateProjectionMatrix();
    // Shifts the principal point, so the subject sits low and off-centre with sky left for the type.
    lens.projectionMatrix.elements[8] = -shot.fx;
    lens.projectionMatrix.elements[9] = -shot.fy;
    lens.projectionMatrixInverse.copy(lens.projectionMatrix).invert();
    lens.updateMatrixWorld();

    const light = lightAt(m, w.light);
    u.sky.uTop.value.copy(light.top);
    u.sky.uHorizon.value.copy(light.horizon);
    u.sky.uFog.value.copy(light.fog);
    u.sky.uGlow.value.copy(light.glow);
    u.sky.uGlowStrength.value = light.glowStrength;
    u.sky.uBand.value = light.band;
    u.sky.uSun.value.copy(light.sun);
    u.sky.uStars.value = light.stars;
    u.sky.uSunColour.value.copy(light.sunColour);
    u.sky.uWisps.value = light.wisps;
    sky.current?.position.copy(lens.position);
    if (fog.current) {
      fog.current.color.copy(light.fog);
      fog.current.density = MathUtils.lerp(light.fogDensity * 6, light.fogDensity, arrival);
    }
    u.massif.uSunline.value.set(light.sunline - 250, light.sunline + 150);
    u.cloud.uLit.value.copy(light.cloudLit);
    u.cloud.uShade.value.copy(light.cloudShade);
    u.cloud.uCover.value = light.cover;
    if (!reduced) u.cloud.uTime.value += dt;

    if (sun.current) {
      sun.current.position.copy(light.sun).multiplyScalar(40);
      sun.current.color.copy(light.sunColour);
      sun.current.intensity = light.sunIntensity;
      w.sinceShadow++;
      // During a flight the shadows refresh less often; the sun only moves between chapters.
      if (w.first || (w.sinceShadow >= (m.from === m.to ? 3 : 10) && w.lastSun.dot(light.sun) < SUN_STEP)) {
        gl.shadowMap.needsUpdate = true;
        w.lastSun.copy(light.sun);
        w.sinceShadow = 0;
      }
    }
    if (hemi.current) {
      hemi.current.color.copy(light.hemiSky);
      hemi.current.groundColor.copy(light.hemiGround);
      hemi.current.intensity = light.hemiIntensity;
    }

    const r = routeAt(m);
    route.current?.draw(r, w.tip);
    const onRoute = CHAPTERS[m.from].waypoint !== null || CHAPTERS[m.to].waypoint !== null;
    const climbing = p > 0.06 && onRoute && (m.from !== m.to || CHAPTERS[m.from].waypoint !== null);
    // The opening frame carries the page's own type, so the spot heights only arrive with the climb.
    const lettering = (m.from === 0 ? m.t : 1) * (1 - (CHAPTERS[m.to].id === "handoff" ? m.t || 1 : 0));
    placeLabels(marks.current, w.labels, field, lens, size, r, w.tip, climbing ? 1 : 0, lettering, dt);

    if (w.first) {
      w.first = false;
      onFirstFrame();
    }
  });

  return (
    <>
      <color attach="background" args={["#0f1724"]} />
      <fogExp2 ref={fog} attach="fog" args={["#6f86a3", 0.016]} />
      <Sky uniforms={uniforms.sky} follow={sky} />
      <hemisphereLight ref={hemi} args={["#9fb2d6", "#3a4256", 0.75]} />
      <directionalLight
        ref={sun}
        intensity={2.5}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-radius={3}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <Massif geometry={geometry} surface={surface} uniforms={uniforms.massif} />
      <Clouds surface={surface} uniforms={uniforms.cloud} />
      <RouteLines ref={route} path={path} width={lineWidth} />
    </>
  );
}

type TerrainProps = { snowLine: number; progress: MotionValue<number>; reduced: boolean; running: boolean; onReady: () => void };

export function Terrain({ snowLine, progress, reduced, running, onReady }: TerrainProps) {
  const [segments] = useState(pickSegments);
  const assets = useAssets(segments);
  const [compiled, setCompiled] = useState(false);
  const [parallax] = useState(() => !reduced && window.matchMedia("(pointer: fine)").matches);
  const [lineWidth] = useState(() => (window.innerWidth < 640 ? 3.6 : 3.2));
  const [view] = useState(() => {
    const area = window.innerWidth * window.innerHeight;
    return {
      dpr: Math.max(0.8, Math.min(1.75, window.devicePixelRatio || 1, Math.sqrt(PIXEL_BUDGET / area))),
      shadowSize: area > 2.3e6 ? 1024 : 2048,
    };
  });
  const [ready, setReady] = useState(false);
  const marks = useRef<(HTMLElement | null)[]>([]);
  const dip = useRef<HTMLDivElement>(null);
  const path = useMemo(() => (assets ? buildRoute(assets.field) : null), [assets]);

  useEffect(
    () => () => {
      assets?.surface.dispose();
      assets?.detail.dispose();
    },
    [assets],
  );

  return (
    <div className={cn("absolute inset-0 transition-opacity duration-700 ease-out", ready ? "opacity-100" : "opacity-0")}>
      {assets && path && (
        <Canvas
          shadows={SHADOWS}
          dpr={view.dpr}
          frameloop={running && compiled ? "always" : "never"}
          gl={GL}
          camera={{ fov: 34, near: 0.05, far: 240, position: [0, 20, 30] }}
          className="absolute! inset-0!"
        >
          <World
            assets={assets}
            snowLine={snowLine}
            path={path}
            progress={progress}
            reduced={reduced}
            parallax={parallax}
            lineWidth={lineWidth}
            shadowSize={view.shadowSize}
            marks={marks}
            dip={dip}
            onCompiled={() => setCompiled(true)}
            onFirstFrame={() => {
              setReady(true);
              onReady();
            }}
          />
        </Canvas>
      )}
      <LetteringLayer marks={marks} />
      <div ref={dip} aria-hidden className="pointer-events-none absolute inset-0 bg-(--ink) opacity-0" />
    </div>
  );
}
