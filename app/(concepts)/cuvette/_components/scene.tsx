"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, MeshTransmissionMaterial, RoundedBox, useFBO } from "@react-three/drei";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import type { MotionValue } from "motion/react";
import {
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  EquirectangularReflectionMapping,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  Object3D,
  PMREMGenerator,
  PlaneGeometry,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  Scene as Room,
  TextureLoader,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
  type MeshPhysicalMaterial,
  type MeshStandardMaterial,
  type Texture,
} from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

import { cn } from "@/lib/utils";
import { IMAGE_BASE, PRODUCTS, type Product } from "../_lib/content";

const ARC = 2.3;
const LABEL_RADIUS = 0.628;
const LABEL_HEIGHT = 1.05;
const BOTTLE_X = 1.15;

const profile = (points: [number, number][]) => points.map(([x, y]) => new Vector2(x, y));

// A Boston round dropper bottle, turned from its half-profile. Units are roughly decimetres.
const GLASS = profile([
  [0, 0], [0.5, 0], [0.585, 0.015], [0.62, 0.07], [0.625, 0.2], [0.625, 1.58], [0.61, 1.72],
  [0.55, 1.86], [0.42, 1.97], [0.27, 2.04], [0.225, 2.1], [0.22, 2.34], [0.235, 2.36], [0.235, 2.42], [0.2, 2.44],
]);
const LIQUID = profile([[0, 0.09], [0.5, 0.09], [0.565, 0.12], [0.575, 0.22], [0.575, 1.42], [0, 1.42]]);
const BULB = profile([[0, 2.66], [0.25, 2.66], [0.27, 2.72], [0.265, 2.95], [0.235, 3.12], [0.17, 3.24], [0.08, 3.29], [0, 3.3]]);

const WHITE = new Color("#ffffff");
const PALETTE = PRODUCTS.map((p) => ({ liquid: new Color(p.liquid), body: new Color(p.liquid).lerp(WHITE, 0.6) }));

const dummy = new Object3D();
const aim = new Vector3();
const focus = new Vector3();
const BUBBLES = Array.from({ length: 26 }, (_, i) => ({
  radius: Math.sqrt(((i * 37) % 100) / 100) * 0.46,
  angle: i * 2.39996,
  speed: 0.05 + (((i * 53) % 100) / 100) * 0.09,
  size: 0.008 + (((i * 29) % 100) / 100) * 0.017,
  offset: ((i * 71) % 100) / 100,
}));

const smooth = (v: number) => v * v * (3 - 2 * v);
const between = (v: number, from: number, to: number) => MathUtils.clamp((v - from) / (to - from), 0, 1);

type Vec = [number, number, number];
type Shot = { eye: Vec; look: Vec };

// One shot per chapter: the set, the label, the dropper, the results.
const WIDE: Shot[] = [
  { eye: [0.15, 1.8, 10.2], look: [0.45, 1.45, 0] },
  { eye: [0.35, 1.05, 3.4], look: [0.35, 0.95, 0] },
  { eye: [0.25, 3.5, 11.6], look: [0.3, 2.85, 0] },
  { eye: [0.9, 1.7, 9.6], look: [-0.25, 1.35, 0] },
];
const TALL: Shot[] = [
  { eye: [0, 2.2, 19], look: [0, -0.05, 0] },
  { eye: [0, 1.6, 11], look: [0, 0.2, 0] },
  { eye: [0.3, 3.8, 18], look: [0.5, 2.4, 0] },
  { eye: [0.6, 2.2, 19], look: [0, -0.05, 0] },
];

type Maps = { map: Texture; normalMap: Texture; roughnessMap: Texture };
type Assets = { hdri: Texture; plaster: Maps; stone: Maps };

function loadMaps(loader: TextureLoader, name: string, repeat: [number, number]): Promise<Maps> {
  return Promise.all(["diff", "nor", "rough"].map((kind) => loader.loadAsync(`${IMAGE_BASE}/textures/${name}_${kind}.jpg`))).then(
    ([map, normalMap, roughnessMap]) => {
      map.colorSpace = SRGBColorSpace;
      for (const texture of [map, normalMap, roughnessMap]) {
        texture.wrapS = MirroredRepeatWrapping;
        texture.wrapT = MirroredRepeatWrapping;
        texture.repeat.set(repeat[0], repeat[1]);
        texture.anisotropy = 8;
      }
      return { map, normalMap, roughnessMap };
    },
  );
}

// Every asset is ready before the canvas mounts: a canvas whose children suspend after the
// first commit gets its WebGL context force-lost by the reconciler's cleanup.
function useAssets() {
  const [assets, setAssets] = useState<Assets | null>(null);
  useEffect(() => {
    let cancelled = false;
    const loader = new TextureLoader();
    Promise.all([
      new HDRLoader().loadAsync(`${IMAGE_BASE}/studio.hdr`),
      loadMaps(loader, "plaster", [5, 2.7]),
      loadMaps(loader, "stone", [0.3, 0.3]),
    ]).then(([hdri, plaster, stone]) => {
      hdri.mapping = EquirectangularReflectionMapping;
      if (!cancelled) setAssets({ hdri, plaster, stone });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return assets;
}

function drawLabel(product: Product, serif: string, sans: string) {
  const width = 1536;
  const height = Math.round((width * LABEL_HEIGHT) / (LABEL_RADIUS * ARC));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D & { letterSpacing: string };
  const mid = width / 2;
  ctx.fillStyle = "#1a1714";
  ctx.textAlign = "center";
  const text = (value: string, font: string, y: number, spacing = 0) => {
    ctx.letterSpacing = `${spacing}px`;
    ctx.font = font;
    ctx.fillText(value, mid, y);
  };
  text("CUVETTE", `600 ${height * 0.05}px ${sans}`, height * 0.14, height * 0.026);
  text(product.name, `400 ${height * 0.21}px ${serif}`, height * 0.43);
  text(`${product.percent} ${product.inci.toUpperCase()}`, `500 ${height * 0.046}px ${sans}`, height * 0.56, height * 0.012);
  ctx.fillRect(mid - width * 0.05, height * 0.63, width * 0.1, Math.max(2, height * 0.004));
  text("SERUM · 30 ML · 1 FL OZ", `500 ${height * 0.04}px ${sans}`, height * 0.73, height * 0.014);
  text(`${product.ph.toUpperCase()} · FRAGRANCE-FREE`, `400 ${height * 0.034}px ${sans}`, height * 0.85, height * 0.012);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function useLabels() {
  const [labels, setLabels] = useState<CanvasTexture[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const root = getComputedStyle(document.documentElement);
      const serif = root.getPropertyValue("--font-display").trim();
      const sans = root.getPropertyValue("--font-sans").trim();
      setLabels(PRODUCTS.map((p) => drawLabel(p, serif, sans)));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return labels;
}

// Light through a four-pane window with foliage outside, projected by the key light.
function drawGobo() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, size, size);
  ctx.filter = "blur(10px)";
  ctx.fillStyle = "#ffffff";
  for (const [x, y, w, h] of [[0.14, 0.06, 0.33, 0.41], [0.51, 0.06, 0.33, 0.41], [0.14, 0.51, 0.33, 0.45], [0.51, 0.51, 0.33, 0.45]]) {
    ctx.fillRect(x * size, y * size, w * size, h * size);
  }
  ctx.filter = "blur(24px)";
  ctx.fillStyle = "rgba(16,16,16,0.72)";
  for (let i = 0; i < 24; i++) {
    const r = (n: number) => {
      const s = Math.sin(i * 91.7 + n * 17.3) * 43758.5453;
      return s - Math.floor(s);
    };
    ctx.beginPath();
    ctx.ellipse(size * (0.1 + r(1) * 0.8), size * (0.02 + r(2) * 0.42), size * (0.02 + r(3) * 0.05), size * (0.01 + r(4) * 0.025), r(5) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = "none";
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// The studio HDRI plus softbox strips, baked once into the environment so the glass
// carries the long clean highlights of a product photograph.
function Softboxes({ hdri }: { hdri: Texture }) {
  const gl = useThree((s) => s.gl);
  const environment = useMemo(() => {
    const room = new Room();
    room.background = hdri;
    const panel = new PlaneGeometry(1, 1);
    const glow = new MeshBasicMaterial({ color: new Color(2.4, 2.3, 2.1), side: DoubleSide });
    const boxes: [number, number, number, number, number, number, number][] = [
      [-4.5, 1.2, 1.5, 1.4, 8, 0, Math.PI / 2],
      [4.5, 1.2, 1.5, 1.4, 8, 0, -Math.PI / 2],
      [0, 6, 0.5, 6, 2.5, Math.PI / 2, 0],
    ];
    for (const [x, y, z, w, h, rx, ry] of boxes) {
      const box = new Mesh(panel, glow);
      box.position.set(x, y, z);
      box.scale.set(w, h, 1);
      box.rotation.set(rx, ry, 0);
      room.add(box);
    }
    const generator = new PMREMGenerator(gl);
    const texture = generator.fromScene(room, 0.015).texture;
    generator.dispose();
    panel.dispose();
    glow.dispose();
    return texture;
  }, [gl, hdri]);
  return <primitive object={environment} attach="environment" />;
}

function Rig({ progress, tall }: { progress: MotionValue<number>; tall: boolean }) {
  const eye = useRef<Vector3 | null>(null);
  const look = useRef(new Vector3());
  useFrame(({ camera, pointer }, dt) => {
    const shots = tall ? TALL : WIDE;
    const scaled = MathUtils.clamp(progress.get(), 0, 1) * (shots.length - 1);
    const i = Math.min(shots.length - 2, Math.floor(scaled));
    const t = smooth(scaled - i);
    const [a, b] = [shots[i], shots[i + 1]];
    aim.set(
      MathUtils.lerp(a.eye[0], b.eye[0], t) + pointer.x * 0.2,
      MathUtils.lerp(a.eye[1], b.eye[1], t) + pointer.y * 0.08,
      MathUtils.lerp(a.eye[2], b.eye[2], t),
    );
    focus.set(MathUtils.lerp(a.look[0], b.look[0], t), MathUtils.lerp(a.look[1], b.look[1], t), MathUtils.lerp(a.look[2], b.look[2], t));
    if (!eye.current) {
      eye.current = aim.clone().add(new Vector3(0, 0.25, 1.6));
      look.current.copy(focus);
    }
    const k = 1 - Math.exp(-dt * 4);
    eye.current.lerp(aim, k);
    look.current.lerp(focus, k);
    camera.position.copy(eye.current);
    camera.lookAt(look.current);
  });
  return null;
}

function Bottle({ active, labels, progress }: { active: number; labels: CanvasTexture[]; progress: MotionValue<number> }) {
  const turn = useRef<Group>(null);
  const vessel = useRef<Mesh>(null);
  const sleeve = useRef<Mesh>(null);
  const liquid = useRef<MeshPhysicalMaterial>(null);
  const print = useRef<MeshStandardMaterial>(null);
  const bubbles = useRef<InstancedMesh>(null);
  const refraction = useFBO(1024, 1024);
  const state = useRef({ index: active, spin: 0 });

  const glass = useMemo(() => new LatheGeometry(GLASS, 128), []);
  const fill = useMemo(() => new LatheGeometry(LIQUID, 96), []);
  const label = useMemo(() => new CylinderGeometry(LABEL_RADIUS, LABEL_RADIUS, LABEL_HEIGHT, 128, 1, true, -ARC / 2, ARC), []);

  // The glass refracts a buffer rendered without itself or the printed label; otherwise
  // the label shows through the glass a second time, blurred and offset.
  useFrame(({ gl, scene, camera }) => {
    const glassMesh = vessel.current;
    const labelMesh = sleeve.current;
    if (!glassMesh || !labelMesh) return;
    const toneMapping = gl.toneMapping;
    glassMesh.visible = false;
    labelMesh.visible = false;
    gl.toneMapping = NoToneMapping;
    gl.setRenderTarget(refraction);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.toneMapping = toneMapping;
    glassMesh.visible = true;
    labelMesh.visible = true;
  });

  useFrame(({ pointer, clock }, dt) => {
    const s = state.current;
    const t = clock.elapsedTime;
    if (s.index !== active) {
      s.index = active;
      s.spin += Math.PI * 2;
    }
    const spin = turn.current;
    if (spin) {
      // The bottle idles only on the opening shot; later chapters hold the label to camera.
      const idle = 1 - between(progress.get(), 0.04, 0.22);
      spin.rotation.y = MathUtils.damp(spin.rotation.y, s.spin + idle * (Math.sin(t * 0.3) * 0.35 + pointer.x * 0.3), 2.2, dt);
      const ink = print.current;
      if (ink && ink.map !== labels[active] && Math.abs(s.spin - spin.rotation.y) < Math.PI) {
        ink.map = labels[active];
        ink.needsUpdate = true;
      }
    }

    const mix = 1 - Math.exp(-dt * 2.4);
    liquid.current?.attenuationColor.lerp(PALETTE[active].liquid, mix);
    liquid.current?.color.lerp(PALETTE[active].body, mix);

    const cloud = bubbles.current;
    if (cloud) {
      BUBBLES.forEach((b, i) => {
        const a = b.angle + t * 0.15;
        dummy.position.set(Math.cos(a) * b.radius, 0.16 + ((t * b.speed + b.offset) % 1) * 1.2, Math.sin(a) * b.radius);
        dummy.scale.setScalar(b.size);
        dummy.updateMatrix();
        cloud.setMatrixAt(i, dummy.matrix);
      });
      cloud.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={turn}>
      <mesh ref={vessel} geometry={glass}>
        <MeshTransmissionMaterial
          buffer={refraction.texture}
          samples={6}
          thickness={0.22}
          roughness={0.02}
          ior={1.5}
          chromaticAberration={0.04}
          anisotropicBlur={0.05}
          distortion={0}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={1.05}
          color="#ffffff"
        />
      </mesh>
      <mesh geometry={fill}>
        <meshPhysicalMaterial
          ref={liquid}
          transmission={1}
          roughness={0.06}
          thickness={1.1}
          ior={1.34}
          attenuationDistance={2.4}
          attenuationColor={PRODUCTS[0].liquid}
          color={PALETTE[0].body}
        />
      </mesh>
      <instancedMesh ref={bubbles} args={[undefined, undefined, BUBBLES.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.15} />
      </instancedMesh>
      <mesh ref={sleeve} geometry={label} position={[0, 0.87, 0]} renderOrder={2}>
        <meshStandardMaterial ref={print} map={labels[0]} transparent depthWrite={false} roughness={0.55} />
      </mesh>
    </group>
  );
}

// The dropper lifts out, swings clear of the bottle and lets one drop fall to the stone.
function Dropper({ active, progress }: { active: number; progress: MotionValue<number> }) {
  const rig = useRef<Group>(null);
  const drop = useRef<Mesh>(null);
  const dropTint = useRef<MeshPhysicalMaterial>(null);
  const columnTint = useRef<MeshStandardMaterial>(null);
  const bulb = useMemo(() => new LatheGeometry(BULB, 64), []);

  useFrame((_, dt) => {
    const p = progress.get();
    const settle = smooth(between(p, 0.78, 0.9));
    const lift = smooth(between(p, 0.42, 0.55)) * (1 - smooth(between(p, 0.84, 0.94)));
    const shift = smooth(between(p, 0.53, 0.6)) * (1 - settle);
    const hand = rig.current;
    if (hand) {
      hand.position.set(1.05 * shift, 2.35 * lift, 0.3 * shift);
      hand.rotation.z = -0.08 * shift;
    }

    const bead = drop.current;
    if (bead) {
      const grow = between(p, 0.6, 0.64);
      const fall = between(p, 0.64, 0.7);
      const splash = between(p, 0.7, 0.73);
      const radius = 0.06 * smooth(grow);
      const tip = 0.28 + 2.35 * lift;
      bead.visible = grow > 0 && settle < 1;
      bead.position.set(1.08 * shift, splash > 0 ? 0.012 : tip - fall * fall * (tip - radius), 0.3 * shift);
      const gone = 1 - settle;
      bead.scale.set(radius * (1 + 1.2 * splash) * gone, radius * (1 - 0.6 * splash) * gone, radius * (1 + 1.2 * splash) * gone);
    }

    const mix = 1 - Math.exp(-dt * 2.4);
    dropTint.current?.color.lerp(PALETTE[active].liquid, mix);
    columnTint.current?.color.lerp(PALETTE[active].liquid, mix);
  });

  return (
    <>
      <group ref={rig}>
        <mesh position={[0, 2.49, 0]} castShadow>
          <cylinderGeometry args={[0.29, 0.29, 0.36, 96]} />
          <meshStandardMaterial color="#cdb68c" metalness={1} roughness={0.26} />
        </mesh>
        <mesh geometry={bulb} castShadow>
          <meshPhysicalMaterial color="#161412" roughness={0.55} clearcoat={0.35} clearcoatRoughness={0.5} />
        </mesh>
        <mesh position={[0, 1.38, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 2.06, 24, 1, true]} />
          <meshPhysicalMaterial transmission={1} roughness={0.02} thickness={0.05} ior={1.5} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.54, 16]} />
          <meshStandardMaterial ref={columnTint} color={PRODUCTS[0].liquid} roughness={0.1} transparent opacity={0.85} />
        </mesh>
      </group>
      <mesh ref={drop} visible={false}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial ref={dropTint} color={PRODUCTS[0].liquid} roughness={0.03} transmission={0.6} thickness={0.1} ior={1.34} transparent opacity={0.92} />
      </mesh>
    </>
  );
}

function World({ assets, labels, active, progress }: { assets: Assets; labels: CanvasTexture[]; active: number; progress: MotionValue<number> }) {
  const size = useThree((s) => s.size);
  const tall = size.width < size.height;
  const x = tall ? 0 : BOTTLE_X;
  const target = useMemo(() => new Object3D(), []);
  const gobo = useMemo(() => drawGobo(), []);

  return (
    <>
      <color attach="background" args={["#e4dccf"]} />
      <Softboxes hdri={assets.hdri} />
      <hemisphereLight args={["#f7f2ea", "#b3aa9c", 0.7]} />
      <spotLight
        position={[x - 4.2, 6.2, 5]}
        target={target}
        angle={0.52}
        penumbra={0.5}
        intensity={5}
        decay={0}
        color="#fff4e6"
        castShadow
        map={gobo}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <primitive object={target} position={[x, 1.1, 0]} />
      <directionalLight position={[x + 5, 3.5, -3]} intensity={0.5} color="#e3ebff" />

      <mesh position={[0, 4, -2.4]} receiveShadow>
        <planeGeometry args={[30, 16]} />
        <meshStandardMaterial {...assets.plaster} color="#ede8e1" />
      </mesh>
      <RoundedBox args={[3.4, 3, 2.2]} radius={0.03} smoothness={4} position={[x - 0.2, -1.5, -0.15]} receiveShadow>
        <meshStandardMaterial {...assets.stone} color="#d9d3ca" />
      </RoundedBox>
      <mesh position={[x - 1.05, 0.09, 0.42]} scale={[0.36, 0.13, 0.3]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial normalMap={assets.stone.normalMap} color="#7f7a72" roughness={0.7} />
      </mesh>
      <mesh position={[x - 0.6, 0.05, 0.74]} scale={[0.18, 0.07, 0.15]} rotation={[0, -0.4, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial normalMap={assets.stone.normalMap} color="#b5aea3" roughness={0.66} />
      </mesh>

      <group position={[x, 0, 0]}>
        <Bottle active={active} labels={labels} progress={progress} />
        <Dropper active={active} progress={progress} />
        <ContactShadows position={[0, 0.003, 0]} scale={2.6} blur={2.2} far={1.2} opacity={0.35} resolution={512} color="#3d2f20" />
      </group>

      <Rig progress={progress} tall={tall} />

      <EffectComposer multisampling={4}>
        <Vignette offset={0.32} darkness={0.36} />
      </EffectComposer>
    </>
  );
}

export function Scene({ active, progress, running }: { active: number; progress: MotionValue<number>; running: boolean }) {
  const assets = useAssets();
  const labels = useLabels();
  const ready = Boolean(assets && labels);
  return (
    <div className={cn("absolute inset-0 transition-opacity duration-[1600ms]", ready ? "opacity-100" : "opacity-0")}>
      {assets && labels && (
        <Canvas
          shadows="percentage"
          dpr={[1, 1.5]}
          frameloop={running ? "always" : "never"}
          camera={{ fov: 30, position: [0.1, 1.75, 9.4], near: 0.1, far: 60 }}
          gl={{ antialias: false }}
          scene={{ environmentIntensity: 0.55 }}
        >
          <World assets={assets} labels={labels} active={active} progress={progress} />
        </Canvas>
      )}
    </div>
  );
}
