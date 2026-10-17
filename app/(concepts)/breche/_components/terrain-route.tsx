"use client";

import { useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { Line } from "@react-three/drei";
import { CatmullRomCurve3, Vector3 } from "three";
import type { Line2 } from "three-stdlib";

import { ROUTE } from "../_lib/content";
import { heightAt, toWorld, worldY, type Field } from "./terrain-field";

const SIGNAL = "#c8471f";
const INK = "#0f1724";

export type RoutePath = {
  access: Vector3[];
  climb: Vector3[];
  /** For each waypoint, its index along `climb` (the access leg ends where the climb starts). */
  stops: number[];
};

function drape(field: Field, points: Vector3[], lift: number) {
  for (const point of points) point.y = worldY(heightAt(field, point.x, point.z)) + lift;
  return points;
}

function curve(field: Field, coordinates: [number, number][], samples: number, lift: number) {
  const anchors = coordinates.map(([lat, lon]) => {
    const point = toWorld(lat, lon, 0);
    point.y = worldY(heightAt(field, point.x, point.z));
    return point;
  });
  return drape(field, new CatmullRomCurve3(anchors, false, "centripetal").getSpacedPoints(samples), lift);
}

export function buildRoute(field: Field): RoutePath {
  const [start, valley, ...rest] = ROUTE;
  const access = curve(field, [[start.lat, start.lon], ...(valley.via ?? []), [valley.lat, valley.lon]], 220, 0.05);

  const climbing: [number, number][] = [[valley.lat, valley.lon]];
  const marks: Vector3[] = [toWorld(valley.lat, valley.lon, 0)];
  for (const waypoint of rest) {
    climbing.push(...(waypoint.via ?? []), [waypoint.lat, waypoint.lon]);
    marks.push(toWorld(waypoint.lat, waypoint.lon, 0));
  }
  const climb = curve(field, climbing, 900, 0.06);

  const stops = [0, 0];
  let from = 0;
  for (const mark of marks.slice(1)) {
    let best = from;
    let distance = Infinity;
    for (let i = from; i < climb.length; i++) {
      const d = Math.hypot(climb[i].x - mark.x, climb[i].z - mark.z);
      if (d < distance) {
        distance = d;
        best = i;
      }
    }
    stops.push(best);
    from = best;
  }
  stops[stops.length - 1] = climb.length - 1;
  return { access, climb, stops };
}

export type RouteHandle = {
  /** Draws the route up to `r`, in waypoints, and writes the climber's position into `tip`. */
  draw: (r: number, tip: Vector3) => void;
};

export function RouteLines({ path, width, ref }: { path: RoutePath; width: number; ref: Ref<RouteHandle> }) {
  const access = useRef<Line2>(null);
  const behind = useRef<Line2>(null);
  const casing = useRef<Line2>(null);
  const line = useRef<Line2>(null);

  // Lines stay visible with zero segments rather than toggling, so their shaders compile on the
  // first frame instead of hitching the scroll when the route first appears.
  const reveal = useMemo(
    () => (target: Line2 | null, points: number) => {
      if (target) target.geometry.instanceCount = Math.max(0, Math.floor(points) - 1);
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      draw(r, tip) {
        const { access: lift, climb, stops } = path;
        const accessShown = Math.min(1, Math.max(0, r)) * (lift.length - 1);
        reveal(access.current, accessShown + 1);

        let shown = 0;
        if (r > 1) {
          const s = Math.min(stops.length - 1, r) - 1;
          const k = Math.min(stops.length - 3, Math.floor(s));
          const f = s - k;
          shown = stops[k + 1] + (stops[k + 2] - stops[k + 1]) * f;
        }
        for (const target of [behind.current, casing.current, line.current]) reveal(target, r > 1 ? shown + 1 : 0);

        const points = r > 1 ? climb : lift;
        const index = r > 1 ? shown : accessShown;
        const i = Math.min(points.length - 2, Math.floor(index));
        tip.lerpVectors(points[i], points[i + 1], index - i);
      },
    }),
    [path, reveal],
  );

  return (
    <group>
      <Line ref={access} points={path.access} color="#ffffff" lineWidth={width * 0.62} transparent opacity={0.55} dashed dashSize={0.14} gapSize={0.11} toneMapped={false} fog={false} renderOrder={2} />
      <Line ref={behind} points={path.climb} color={SIGNAL} lineWidth={width * 0.6} transparent opacity={0.4} dashed dashSize={0.1} gapSize={0.08} depthTest={false} depthWrite={false} toneMapped={false} fog={false} renderOrder={3} />
      <Line ref={casing} points={path.climb} color={INK} lineWidth={width * 2.1} transparent opacity={0.5} depthWrite={false} toneMapped={false} fog={false} renderOrder={4} />
      <Line ref={line} points={path.climb} color={SIGNAL} lineWidth={width} transparent opacity={1} toneMapped={false} fog={false} renderOrder={5} />
    </group>
  );
}
