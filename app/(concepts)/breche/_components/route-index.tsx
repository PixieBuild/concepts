"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { OBJECTIVES, type Objective } from "../_lib/content";
import { metres, price } from "../_lib/format";
import { inertPage } from "../_lib/modal";
import { askAbout, goTo } from "../_lib/scroll";
import { Frame } from "./frame";
import { ObjectiveSheet } from "./objective-sheet";
import { Relief } from "./relief";

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

type Opened = { id: string; trigger: string };

/** Rows and buttons open the sheet as real triggers, so its focus trap has somewhere to return to. */
const routeSheet = Dialog.createHandle<string>();

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return wide;
}

export function RouteIndex({ head, month }: { head: ReactNode; month: number }) {
  const wide = useWide();
  const [active, setActive] = useState(OBJECTIVES[1].slot.id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Opened | null>(null);
  const after = useRef<(() => void) | null>(null);
  const queued = useRef(false);

  const open = OBJECTIVES.find((o) => o.slot.id === sheet?.id);
  const current = OBJECTIVES.find((o) => o.slot.id === active) ?? OBJECTIVES[1];

  const isOpen = !!open;
  useEffect(() => (isOpen ? inertPage() : undefined), [isOpen]);

  const closeThen = (action: () => void) => {
    after.current = action;
    queued.current = true;
    setSheet(null);
  };

  const openSheet = (id: string, trigger: string) => {
    queued.current = false;
    setActive(id);
    setSheet({ id, trigger });
  };

  return (
    <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-14">
      <div className="hidden lg:col-span-7 lg:block">
        <figure className="sticky top-[calc(3.5rem+1.5rem)]">
          <div className="relative w-[min(100%,calc((100svh-3.5rem-5rem)*0.8))]">
            <Relief active={active} eager sizes="(min-width: 1664px) 900px, 55vw" className="after:absolute after:inset-0 after:ring-1 after:ring-black/8 after:ring-inset" />
            <div className="absolute right-0 bottom-0 w-[52%] border-t-[6px] border-l-[6px] border-(--snow)">
              <div className="relative aspect-4/5">
                {OBJECTIVES.map((objective) => (
                  <Frame
                    key={objective.slot.id}
                    slot={objective.slot}
                    sizes="(min-width: 1664px) 480px, 30vw"
                    className={cn("absolute inset-0 transition-opacity duration-500", objective.slot.id === active ? "opacity-100" : "opacity-0")}
                  />
                ))}
              </div>
            </div>
          </div>
          <figcaption className="mt-3 flex w-[min(100%,calc((100svh-3.5rem-5rem)*0.8))] items-baseline justify-between gap-6">
            <span className="data text-(--ink)">{current.name}</span>
            <span className="label text-(--granite)">Contours every 200 m</span>
          </figcaption>
        </figure>
      </div>

      <div className="lg:col-span-5">
        <div className="grid gap-y-10">
          <div>{head}</div>
          <figure className="lg:hidden">
            <Relief active={active} wide sizes="100vw" />
            <figcaption className="mt-3 flex items-baseline justify-between gap-4">
              <span className="data text-(--ink)">{current.name}</span>
              <span className="label text-(--granite)">Contours every 200 m</span>
            </figcaption>
          </figure>
        </div>
        <ol className="mt-12 border-b border-border lg:mt-16">
          {OBJECTIVES.map((objective) => (
            <Row
              key={objective.slot.id}
              objective={objective}
              wide={wide}
              active={objective.slot.id === active}
              expanded={objective.slot.id === expanded}
              onActivate={() => setActive(objective.slot.id)}
              onToggle={() => {
                setActive(objective.slot.id);
                setExpanded((id) => (id === objective.slot.id ? null : objective.slot.id));
              }}
              onOpen={(trigger) => openSheet(objective.slot.id, trigger)}
            />
          ))}
        </ol>
      </div>

      <Sheet
        handle={routeSheet}
        open={!!open}
        triggerId={sheet?.trigger ?? null}
        onOpenChange={(next) => !next && setSheet(null)}
        onOpenChangeComplete={(isOpen) => {
          if (isOpen || !after.current) return;
          const action = after.current;
          after.current = null;
          action();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          finalFocus={() => !queued.current}
          className="w-full gap-0 border-l-0 bg-(--snow) p-0 text-(--ink) shadow-none data-[side=right]:w-full sm:data-[side=right]:max-w-[44rem]"
        >
          {open && (
            <ObjectiveSheet
              objective={open}
              month={month}
              onAsk={() => closeThen(() => askAbout(open.slot.id))}
              onFly={() =>
                closeThen(() => goTo("#top"))
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({
  objective,
  wide,
  active,
  expanded,
  onActivate,
  onToggle,
  onOpen,
}: {
  objective: Objective;
  wide: boolean;
  active: boolean;
  expanded: boolean;
  onActivate: () => void;
  onToggle: () => void;
  onOpen: (trigger: string) => void;
}) {
  const id = objective.slot.id;
  const lit = wide ? active : expanded;
  const rowClass =
    "group grid w-full cursor-pointer grid-cols-[3.25rem_1fr] items-center gap-x-4 gap-y-1 py-5 text-left sm:grid-cols-[3.75rem_1fr_auto] sm:gap-x-6 lg:grid-cols-[3.25rem_1fr] lg:gap-x-5 lg:py-5";
  const content = (
    <>
      <span
        className={cn(
          "data grid h-8 place-items-center border border-(--ink) text-[0.9375rem] font-medium transition-colors",
          lit ? "bg-(--ink) text-(--snow)" : "text-(--ink)",
        )}
      >
        {objective.cotation}
      </span>
      <span className="display-3 min-w-0">{objective.name}</span>
      <span className="col-start-2 flex items-center gap-x-3 sm:col-start-3 lg:col-start-2">
        <span className="data tabular-nums text-(--granite)">
          from <span className="text-(--ink)">{price(objective.price)}</span> · {days(objective.days)}
        </span>
        <ArrowRight
          aria-hidden
          className={cn("hidden size-4 text-(--ink) transition-opacity lg:block", active ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
        />
      </span>
    </>
  );

  return (
    <li className="relative border-t border-border">
      <span
        aria-hidden
        className={cn(
          "absolute -top-px left-0 h-0.5 w-full origin-left bg-(--signal) transition-transform duration-500 ease-out",
          lit ? "scale-x-100" : "scale-x-0",
        )}
      />
      {wide ? (
        <SheetTrigger
          handle={routeSheet}
          id={`${id}-row`}
          payload={id}
          onMouseEnter={onActivate}
          onFocus={onActivate}
          onClick={() => onOpen(`${id}-row`)}
          className={rowClass}
        >
          {content}
        </SheetTrigger>
      ) : (
        <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={`${id}-detail`} className={rowClass}>
          {content}
        </button>
      )}

      {!wide && (
        <div
          id={`${id}-detail`}
          inert={!expanded}
          className={cn("grid transition-[grid-template-rows] duration-500 ease-out", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
        >
          <div className="overflow-hidden">
            <div className="pb-8">
              <div className="relative grid gap-3 sm:grid-cols-[1fr_9rem]">
                <Frame slot={objective.slot} edge sizes="(min-width: 640px) 70vw, 100vw" className="aspect-4/3" />
                <div className="absolute right-0 bottom-0 w-[32%] border-t-4 border-l-4 border-(--snow) sm:static sm:w-auto sm:border-0">
                  <Relief active={id} compact sizes="(min-width: 640px) 9rem, 32vw" />
                </div>
              </div>
              <p className="body mt-5 max-w-[52ch]">{objective.brief}</p>
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
                {[
                  { label: objective.summitLabel, value: metres(objective.summit) },
                  { label: objective.descent ? "Descent" : "Ascent", value: metres(objective.descent ?? objective.ascent) },
                  { label: "Season", value: objective.season },
                ].map((spec) => (
                  <div key={spec.label} className="flex flex-col-reverse gap-1">
                    <dt className="label text-(--granite)">{spec.label}</dt>
                    <dd className="data">{spec.value}</dd>
                  </div>
                ))}
              </dl>
              <SheetTrigger
                handle={routeSheet}
                id={`${id}-more`}
                payload={id}
                onClick={() => onOpen(`${id}-more`)}
                className="action mt-6 inline-flex min-h-12 cursor-pointer items-center gap-2 bg-(--ink) px-5 text-(--snow) transition-colors hover:bg-(--signal)"
              >
                Read the route sheet <ArrowRight aria-hidden className="size-4" />
              </SheetTrigger>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
