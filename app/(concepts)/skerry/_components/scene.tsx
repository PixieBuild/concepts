"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Color, EquirectangularReflectionMapping, MathUtils, type Group, type ShaderMaterial, type Texture } from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

import { IMAGE_BASE } from "../_lib/content";

// Two brand colours breathing on simplex noise, behind the glass.
const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime; uniform vec2 uPointer; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uAspect;
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;} vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;} vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){ const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439); vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx); vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0); vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i); vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0)); vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m; vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox; m*=1.79284291400159-0.85373472095314*(a0*a0+h*h); vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g); }
void main(){
  vec2 p = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
  float t = uTime * 0.05;
  vec2 warp = vec2(snoise(p * 1.1 + t), snoise(p * 1.1 - t * 1.3)) * 0.35;
  float n = snoise((p + warp) * 0.9 + vec2(t * 0.6, -t * 0.4));
  float m = snoise((p - warp) * 1.6 - vec2(t * 0.3, t * 0.5));
  float d = distance(p, (uPointer - 0.5) * vec2(uAspect, 1.0));
  float pool = smoothstep(0.7, 0.0, d) * 0.35;
  vec3 col = mix(uA, uB, smoothstep(-0.6, 0.7, n));
  col = mix(col, uC, smoothstep(0.1, 0.9, m) * 0.55 + pool);
  float grain = fract(sin(dot(vUv * (uTime + 1.0), vec2(12.9898, 78.233))) * 43758.5453) * 0.035;
  gl_FragColor = vec4(col + grain - 0.0175, 1.0);
}`;

// The HDRI is loaded before the canvas mounts: a canvas whose children suspend after
// the first commit gets its context force-lost by the reconciler's cleanup.
function useHdri() {
  const [hdri, setHdri] = useState<Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    new HDRLoader().loadAsync(`${IMAGE_BASE}/hdri/studio.hdr`).then((t) => {
      t.mapping = EquirectangularReflectionMapping;
      if (!cancelled) setHdri(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return hdri;
}

function Gradient() {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: [0.5, 0.5] },
      uAspect: { value: 1.6 },
      uA: { value: new Color("#0e0f14") },
      uB: { value: new Color("#3b60c5") },
      uC: { value: new Color("#8e5a3b") },
    }),
    [],
  );
  const { size } = useThree();
  useFrame(({ clock, pointer }) => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTime.value = clock.elapsedTime;
    u.uAspect.value = size.width / size.height;
    const p = u.uPointer.value as number[];
    p[0] = MathUtils.damp(p[0], (pointer.x + 1) / 2, 2.5, 0.016);
    p[1] = MathUtils.damp(p[1], (pointer.y + 1) / 2, 2.5, 0.016);
  });
  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={material} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

function Glass() {
  const group = useRef<Group>(null);
  useFrame(({ pointer }, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = MathUtils.damp(g.rotation.y, pointer.x * 0.5, 2.5, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, -pointer.y * 0.35, 2.5, dt);
  });
  return (
    <group ref={group}>
      <Float speed={1.1} rotationIntensity={0.7} floatIntensity={0.9}>
        <mesh>
          <torusKnotGeometry args={[1.05, 0.38, 260, 56, 2, 3]} />
          <MeshTransmissionMaterial
            thickness={0.9}
            roughness={0.12}
            ior={1.35}
            chromaticAberration={0.08}
            anisotropicBlur={0.4}
            distortion={0.5}
            distortionScale={0.5}
            temporalDistortion={0.18}
            backside
            samples={8}
            resolution={768}
            color="#fdf2de"
            attenuationColor="#3b60c5"
            attenuationDistance={2.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

export function Scene() {
  const hdri = useHdri();
  if (!hdri) return null;
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6.2], fov: 32 }}
      gl={{ antialias: true, alpha: false }}
      scene={{ environmentIntensity: 0.9 }}
      className="!absolute !inset-0"
    >
      <color attach="background" args={["#0e0f14"]} />
      <primitive object={hdri} attach="environment" />
      <Gradient />
      <Glass />
      <EffectComposer>
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.4} />
        <Vignette darkness={0.6} offset={0.28} />
      </EffectComposer>
    </Canvas>
  );
}
