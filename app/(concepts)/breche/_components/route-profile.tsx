import { cn } from "@/lib/utils";
import { ROUTE } from "../_lib/content";
import { grouped, metres } from "../_lib/format";
import { Reveal } from "./reveal";

const W = 1000;
const H = 400;
const FLOOR = 1000;
const CEILING = 5200;
/** The tramway leg is compressed to a fixed share of the width, so the climb itself gets the room. */
const ACCESS_SHARE = 0.2;

function km(a: (typeof ROUTE)[number], b: (typeof ROUTE)[number]) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const legs = ROUTE.slice(1).map((w, i) => km(ROUTE[i], w));
const climbKm = legs.slice(1).reduce((sum, d) => sum + d, 0);
const along = ROUTE.map((_, i) => (i === 0 ? 0 : i === 1 ? ACCESS_SHARE : ACCESS_SHARE + (1 - ACCESS_SHARE) * (legs.slice(1, i).reduce((s, d) => s + d, 0) / climbKm)));
const y = (altitude: number) => H - ((altitude - FLOOR) / (CEILING - FLOOR)) * H;
const points = ROUTE.map((w, i) => [along[i] * W, y(w.altitude)] as const);

function curve(pts: (readonly [number, number])[]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mid = (x0 + x1) / 2;
    d += ` C${mid} ${y0} ${mid} ${y1} ${x1} ${y1}`;
  }
  return d;
}

const climb = curve(points.slice(1));
const ground = `${climb} L${W} ${H} L${points[1][0]} ${H} Z`;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/** The Goûter route in profile, with the bulletin's freezing level and snow line laid across it. */
export function RouteProfile({ freezingLevel, snowLine }: { freezingLevel: number; snowLine: number }) {
  const ascent = ROUTE[ROUTE.length - 1].altitude - ROUTE[1].altitude;

  return (
    <figure>
      <div className="relative h-[58svh] max-h-[34rem] sm:h-[clamp(18rem,38vw,34rem)]">
        <div aria-hidden className="absolute inset-0">
          {[2000, 3000, 4000].map((alt) => (
            <div key={alt} className="absolute inset-x-0 border-t border-(--snow)/10" style={{ top: pct(y(alt), H) }}>
              <span className="label absolute -top-5 left-3 text-(--snow)/50 sm:left-0">{grouped(alt)}</span>
            </div>
          ))}
        </div>

        <Reveal kind="wipe" className="absolute inset-0">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full overflow-visible">
            <defs>
              <clipPath id="profile-snow">
                <rect x="0" y="0" width={W} height={y(snowLine)} />
              </clipPath>
            </defs>
            <path d={ground} fill="var(--snow)" fillOpacity={0.06} />
            <path d={ground} fill="var(--glacier)" fillOpacity={0.24} clipPath="url(#profile-snow)" />
            <path d={`M${points[0][0]} ${points[0][1]} L${points[1][0]} ${points[1][1]}`} stroke="var(--snow)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="5 6" vectorEffect="non-scaling-stroke" fill="none" />
            <path d={climb} stroke="var(--signal)" strokeWidth={3} vectorEffect="non-scaling-stroke" fill="none" />
            {points.map(([px, py], i) => (
              <line key={i} x1={px} x2={px} y1={py} y2={H} stroke="var(--snow)" strokeOpacity={0.18} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {points.map(([px, py], i) => (
            <span
              key={i}
              aria-hidden
              className={cn("absolute size-2.5 -translate-1/2 rounded-full border-2 border-(--ink)", i === points.length - 1 ? "bg-(--signal)" : "bg-(--snow)")}
              style={{ left: pct(px, W), top: pct(py, H) }}
            />
          ))}
        </Reveal>

        <Level altitude={freezingLevel} label="Freezing level" dashed />
        <Level altitude={snowLine} label="Snow line" />

        <ol className="absolute inset-0">
          {ROUTE.map((w, i) => (
            <li
              key={w.place}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-full flex-col items-center pb-3 text-center",
                i === 0 && "translate-x-0 items-start text-left max-sm:hidden",
                i === ROUTE.length - 1 && "-translate-x-full items-end pr-3 text-right sm:pr-1",
                !w.label && "max-sm:hidden",
              )}
              style={{ left: pct(points[i][0], W), top: pct(points[i][1], H) }}
            >
              <span className="label whitespace-nowrap text-(--snow)/90">{w.place}</span>
              <span className="label whitespace-nowrap tabular-nums text-(--snow)/70">{metres(w.altitude)}</span>
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="mx-6 mt-5 flex sm:mx-0 flex-wrap justify-between gap-x-8 gap-y-2 border-t border-(--snow)/15 pt-4">
        <span className="note text-(--snow)/70">The Goûter route, with tonight’s levels</span>
        <span className="data text-(--snow)/90">
          {climbKm.toFixed(1)} km from the Nid d’Aigle · {metres(ascent)} of ascent
        </span>
      </figcaption>
    </figure>
  );
}

function Level({ altitude, label, dashed }: { altitude: number; label: string; dashed?: boolean }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-x-0 border-t", dashed ? "border-dashed border-(--glacier)" : "border-(--snow)/40")}
      style={{ top: pct(y(Math.min(CEILING, Math.max(FLOOR, altitude))), H) }}
    >
      <span className={cn("label absolute top-1.5 right-3 whitespace-nowrap tabular-nums sm:right-0", dashed ? "text-(--glacier)" : "text-(--snow)/75")}>
        {label} {metres(altitude)}
      </span>
    </div>
  );
}
