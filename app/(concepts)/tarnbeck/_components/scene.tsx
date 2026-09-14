"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, ContactShadows, Float } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { EquirectangularReflectionMapping, MathUtils, type Group, type Object3D, type Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

import { IMAGE_BASE } from "../_lib/content";

const MODEL = `${IMAGE_BASE}/model/watch.gltf`;
const HDRI = `${IMAGE_BASE}/hdri/studio.hdr`;

type Assets = { model: Object3D; hdri: Texture };

// Everything is loaded before the canvas mounts. A canvas whose children suspend
// after the first commit gets its context force-lost by the reconciler's cleanup,
// so nothing inside may use a suspending loader.
function useAssets() {
  const [assets, setAssets] = useState<Assets | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([new GLTFLoader().loadAsync(MODEL), new HDRLoader().loadAsync(HDRI)]).then(([gltf, hdri]) => {
      hdri.mapping = EquirectangularReflectionMapping;
      if (!cancelled) setAssets({ model: gltf.scene, hdri });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return assets;
}

function Studio() {
  return (
    <>
      <directionalLight position={[3, 3, -2]} intensity={2.6} color="#ffe2b8" />
      <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#cfd8ff" />
      <spotLight position={[0, 5, 4]} intensity={6} angle={0.5} penumbra={1} color="#fff4e0" castShadow />
    </>
  );
}

function Watch({ model }: { model: Object3D }) {
  const group = useRef<Group>(null);
  useFrame(({ pointer, clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const drift = Math.sin(clock.elapsedTime * 0.25) * 0.18;
    g.rotation.y = MathUtils.damp(g.rotation.y, pointer.x * 0.45 + drift, 2.2, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, -pointer.y * 0.25 + 0.12, 2.2, dt);
  });
  return (
    <Float speed={1} rotationIntensity={0.15} floatIntensity={0.5}>
      <group ref={group}>
        <Center>
          <primitive object={model} scale={22} rotation={[0.15, -0.35, 0]} />
        </Center>
      </group>
    </Float>
  );
}

export function Scene() {
  const assets = useAssets();
  if (!assets) return null;
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
      camera={{ position: [0, 0.1, 7.5], fov: 26 }}
      gl={{ antialias: true, alpha: true }}
      scene={{ environmentIntensity: 0.5 }}
      className="!absolute !inset-0"
    >
      <primitive object={assets.hdri} attach="environment" />
      <Studio />
      <Watch model={assets.model} />
      <ContactShadows position={[0, -2.1, 0]} opacity={0.55} blur={2.8} scale={9} far={4} color="#000" />
      <EffectComposer>
        <Bloom luminanceThreshold={0.85} intensity={0.35} mipmapBlur />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
        <Vignette darkness={0.7} offset={0.25} />
      </EffectComposer>
    </Canvas>
  );
}
