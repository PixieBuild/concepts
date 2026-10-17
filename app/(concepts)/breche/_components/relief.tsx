import Image from "next/image";

import { cn } from "@/lib/utils";
import { OBJECTIVES, RELIEF, SHEETS, type LatLon } from "../_lib/content";
import { metres } from "../_lib/format";

const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const top = mercator(RELIEF.north);
const bottom = mercator(RELIEF.south);

function project([lat, lon]: LatLon): [number, number] {
  return [((lon - RELIEF.west) / (RELIEF.east - RELIEF.west)) * RELIEF.width, ((top - mercator(lat)) / (top - bottom)) * RELIEF.height];
}

const toPath = (points: LatLon[]) => points.map((p, i) => `${i ? "L" : "M"}${project(p).map((v) => v.toFixed(1)).join(" ")}`).join("");

/** The 5:4 crop keeps 64% of the map's height: Argentière at the top, Mont Blanc's label at the bottom. */
const WIDE = { top: 0.03, height: 0.64 };
const FULL = { top: 0, height: 1 };

const percent = (point: LatLon, crop: typeof FULL) => {
  const [x, y] = project(point);
  return { left: `${(x / RELIEF.width) * 100}%`, top: `${((y / RELIEF.height - crop.top) / crop.height) * 100}%` };
};

const PLACES: { name: string; at: LatLon; peak?: boolean; offset: string }[] = [
  { name: "Chamonix", at: [45.9237, 6.8694], offset: "translate(0.6rem, -50%)" },
  { name: "Argentière", at: [45.9827, 6.9277], offset: "translate(-50%, 0.4rem)" },
  { name: "Mont Blanc", at: [45.8326, 6.8652], peak: true, offset: "translate(-50%, 1rem)" },
];

const ROUTES = OBJECTIVES.map((objective) => {
  const sheet = SHEETS[objective.slot.id];
  const access = sheet.access ?? 0;
  return {
    id: objective.slot.id,
    summit: objective.summit,
    sheet,
    approach: access ? toPath(sheet.line.slice(0, access + 1)) : null,
    climb: toPath(sheet.line.slice(access)),
  };
});

/** The massif as a shaded relief, every objective's line faint, the active one drawn in signal. */
export function Relief({
  active,
  compact,
  wide,
  eager,
  className,
  sizes,
}: {
  active: string | null;
  compact?: boolean;
  wide?: boolean;
  eager?: boolean;
  className?: string;
  sizes: string;
}) {
  const scale = compact ? 2.2 : wide ? 1.4 : 1;
  const crop = wide ? WIDE : FULL;

  return (
    <div className={cn("relative overflow-hidden bg-(--muted)", wide ? "aspect-5/4" : "aspect-4/5", className)}>
      {/* The eager copy gets its own quality, and so its own URL, so dev's LCP check can't mistake it for a lazy copy. */}
      <Image
        src={RELIEF.file}
        alt=""
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        fetchPriority={eager ? "low" : undefined}
        quality={eager ? 90 : undefined}
        className="object-cover"
        style={{ objectPosition: `50% ${crop.height < 1 ? (crop.top / (1 - crop.height)) * 100 : 50}%` }}
      />
      <svg viewBox={`0 ${crop.top * RELIEF.height} ${RELIEF.width} ${crop.height * RELIEF.height}`} aria-hidden className="absolute inset-0 size-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {ROUTES.map((route) => (
          <g key={route.id} className="text-(--ink)" opacity={route.id === active ? 0 : 0.42}>
            {route.approach && <path d={route.approach} stroke="currentColor" strokeWidth={3 * scale} strokeDasharray={`${10 * scale} ${10 * scale}`} />}
            <path d={route.climb} stroke="currentColor" strokeWidth={3.5 * scale} />
          </g>
        ))}
        {ROUTES.map((route) => {
          const on = route.id === active;
          const draw = { strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset ${on ? 1100 : 250}ms cubic-bezier(0.45, 0, 0.2, 1)` };
          return (
            <g key={route.id} opacity={on ? 1 : 0} style={{ transition: "opacity 200ms" }}>
              {route.approach && <path d={route.approach} stroke="var(--ink)" strokeOpacity={0.55} strokeWidth={3 * scale} strokeDasharray={`${10 * scale} ${10 * scale}`} />}
              <path d={route.climb} pathLength={1} stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={11 * scale} style={draw} />
              <path d={route.climb} pathLength={1} stroke="var(--signal)" strokeWidth={6 * scale} style={draw} />
              <circle
                cx={project(route.sheet.mark)[0]}
                cy={project(route.sheet.mark)[1]}
                r={9 * scale}
                fill="var(--signal)"
                stroke="var(--snow)"
                strokeWidth={3 * scale}
              />
            </g>
          );
        })}
      </svg>

      {!compact && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {PLACES.map((place) => (
            <span
              key={place.name}
              style={{ ...percent(place.at, crop), transform: place.offset }}
              className={cn("label absolute leading-none whitespace-nowrap text-(--ink)/85", place.peak && "italic")}
            >
              {place.name}
            </span>
          ))}
          {ROUTES.map((route) => {
            const on = route.id === active;
            return (
              <span
                key={route.id}
                style={{ ...percent(route.sheet.mark, crop), opacity: on ? 1 : 0, transition: "opacity 300ms" }}
                className="label absolute -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] bg-(--ink) px-1.5 py-0.5 whitespace-nowrap tabular-nums text-(--snow)"
              >
                {route.sheet.onward ?? metres(route.summit)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
