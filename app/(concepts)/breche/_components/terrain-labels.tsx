"use client";

import type { RefObject } from "react";
import { Vector3, type Camera } from "three";

import { ROUTE } from "../_lib/content";
import { grouped } from "../_lib/format";
import { heightAt, toWorld, worldY, type Field } from "./terrain-field";

const SUMMIT = ROUTE.length - 1;
/** The waypoints that carry a spot height, in route order; the summit gets the named pin instead. */
const SPOTS = ROUTE.flatMap((waypoint, index) => (waypoint.label && index !== SUMMIT ? [index] : []));

const halo = "[text-shadow:0_0_2px_rgba(15,23,36,0.95),0_0_4px_rgba(15,23,36,0.8),0_0_14px_rgba(15,23,36,0.6)]";
/** The summit pin sits on the brightest sky of the climb, so it carries a wider halo than the spot heights. */
const summitHalo = "[text-shadow:0_0_2px_rgba(15,23,36,0.95),0_0_6px_rgba(15,23,36,0.85),0_0_20px_rgba(15,23,36,0.8)]";

/** One HTML layer over the canvas, positioned each frame by `placeLabels`. */
export function LetteringLayer({ marks }: { marks: RefObject<(HTMLElement | null)[]> }) {
  const bind = (index: number) => (node: HTMLElement | null) => {
    marks.current[index] = node;
  };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {SPOTS.map((route, i) => (
        <div key={route} ref={bind(i)} className="absolute top-0 left-0 opacity-0 will-change-transform">
          <span className="absolute top-0 left-0 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--signal) ring-[1.5px] ring-white" />
          <span className={`data absolute top-0 left-2 -translate-y-1/2 text-[0.8125rem] whitespace-nowrap text-white ${halo}`}>
            {grouped(ROUTE[route].altitude)}
          </span>
        </div>
      ))}
      <div ref={bind(SPOTS.length)} className="absolute top-0 left-0 opacity-0 will-change-transform">
        <span className={`absolute top-0 left-0 -translate-x-1/2 -translate-y-[85%] text-[0.875rem] leading-none text-white ${summitHalo}`}>▲</span>
        <span className={`data absolute top-0 right-3 -translate-y-[78%] text-[1rem] leading-none font-medium whitespace-nowrap text-white sm:text-[1.125rem] ${summitHalo}`}>
          Mont Blanc
        </span>
        <span className={`data absolute top-0 left-3 -translate-y-[78%] text-[1rem] leading-none whitespace-nowrap text-white sm:text-[1.125rem] ${summitHalo}`}>
          {grouped(ROUTE[SUMMIT].altitude)}
        </span>
      </div>
      <div ref={bind(SPOTS.length + 1)} className="absolute top-0 left-0 opacity-0 will-change-transform">
        <span className="absolute top-0 left-0 size-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 motion-safe:animate-[breche-pulse_2.4s_ease-out_infinite]" />
        <span className="absolute top-0 left-0 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--signal)" />
      </div>
    </div>
  );
}

const projected = new Vector3();
const probe = new Vector3();

/** True when terrain stands between the camera and the point. */
function hidden(field: Field, camera: Camera, point: Vector3) {
  const from = camera.position;
  for (let i = 1; i < 40; i++) {
    const t = i / 40;
    if (t > 0.97) break;
    probe.lerpVectors(from, point, t);
    if (worldY(heightAt(field, probe.x, probe.z)) > probe.y + 0.02) return true;
  }
  return false;
}

type LabelState = { anchors: Vector3[]; opacity: number[] };

export function labelState(field: Field): LabelState {
  const anchors = labelAnchors(field);
  return { anchors, opacity: new Array(anchors.length + 1).fill(0) };
}

function labelAnchors(field: Field): Vector3[] {
  const lift = (index: number, up: number) => {
    const { lat, lon } = ROUTE[index];
    const point = toWorld(lat, lon, 0);
    point.y = worldY(heightAt(field, point.x, point.z)) + up;
    return point;
  };
  return [...SPOTS.map((index) => lift(index, 0.07)), lift(SUMMIT, 0.08)];
}

/** Writes every label's screen position as a transform string. `reached` is the route drawn so far,
    in waypoints; labels ease towards their target opacity so occlusion never pops. */
export function placeLabels(
  marks: (HTMLElement | null)[],
  state: LabelState,
  field: Field,
  camera: Camera,
  size: { width: number; height: number },
  reached: number,
  tip: Vector3,
  tipOpacity: number,
  visible: number,
  dt: number,
) {
  const ease = 1 - Math.exp(-dt * 10);
  const count = state.anchors.length + 1;
  for (let i = 0; i < count; i++) {
    const element = marks[i];
    if (!element) continue;
    const isTip = i === count - 1;
    const anchor = isTip ? tip : state.anchors[i];
    projected.copy(anchor).project(camera);
    const behind = projected.z > 1 || Math.abs(projected.x) > 1.2 || Math.abs(projected.y) > 1.2;
    const route = i < SPOTS.length ? SPOTS[i] : SUMMIT;
    const wanted = (isTip ? tipOpacity : reached >= route - 0.02 ? 1 : 0) * visible;
    const target = behind || (wanted > 0 && hidden(field, camera, anchor)) ? 0 : wanted;
    state.opacity[i] += (target - state.opacity[i]) * ease;
    const x = ((projected.x + 1) / 2) * size.width;
    const y = ((1 - projected.y) / 2) * size.height;
    element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    element.style.opacity = state.opacity[i].toFixed(3);
  }
}
