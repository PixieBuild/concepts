"use client";

import { useEffect, useRef, useState } from "react";
import { Bodies, Body, Composite, Engine, Mouse, MouseConstraint } from "matter-js";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { BRAND, HEADLINE, HOLDS, HOURS, INTRO, NEXT_CLASS, OFFER, type Hold } from "../_lib/content";

const EASE = [0.76, 0, 0.24, 1] as const;
const OUT = [0.22, 1, 0.36, 1] as const;
const STEP = 1000 / 60;
const WALL = 400;
const WHEEL_AND_TOUCH = [
  ["wheel", "mousewheel"],
  ["touchmove", "mousemove"],
  ["touchstart", "mousedown"],
  ["touchend", "mouseup"],
] as const;
const POINTER = [
  ["mousemove", "mousemove"],
  ["mousedown", "mousedown"],
  ["mouseup", "mouseup"],
] as const;

type Handlers = Record<"mousemove" | "mousedown" | "mouseup" | "mousewheel", EventListener>;

// Matter's mouse also listens for wheel and touch on the stage and cancels them,
// which would swallow page scrolling; only the mouse buttons and movement are kept.
function unlisten(mouse: Mouse, stage: HTMLElement, pairs: readonly (readonly [string, keyof Handlers])[]) {
  const handlers = mouse as unknown as Handlers;
  for (const [event, handler] of pairs) stage.removeEventListener(event, handlers[handler]);
}

function usePhysics(stage: React.RefObject<HTMLElement | null>, ready: boolean, reduced: boolean | null) {
  useEffect(() => {
    const el = stage.current;
    if (!el || !ready) return;

    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-hold]")).filter((n) => n.offsetWidth > 0);
    let width = el.clientWidth;
    let height = el.clientHeight;

    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 }, positionIterations: 12, velocityIterations: 8 });
    const floor = Bodies.rectangle(width / 2, height + WALL / 2, width * 4, WALL, { isStatic: true });
    const left = Bodies.rectangle(-WALL / 2, 0, WALL, height * 6, { isStatic: true });
    const right = Bodies.rectangle(width + WALL / 2, 0, WALL, height * 6, { isStatic: true });
    Composite.add(engine.world, [floor, left, right]);

    const holds = nodes.map((node, i) => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const x = w / 2 + Math.random() * Math.max(1, width - w);
      const y = -h - i * height * 0.07;
      const options = { restitution: 0.32, friction: 0.5, frictionAir: 0.012, angle: (Math.random() - 0.5) * 0.9 };
      const body =
        node.dataset.hold === "plate"
          ? Bodies.circle(x, y, w / 2, options)
          : Bodies.rectangle(x, y, w, h, { ...options, chamfer: { radius: h / 2 } });
      return { node, body, w, h };
    });
    Composite.add(engine.world, holds.map((hold) => hold.body));

    const paint = () => {
      for (const { node, body, w, h } of holds) {
        node.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
      }
    };

    if (reduced) {
      for (let k = 0; k < 900; k++) Engine.update(engine, STEP);
      paint();
      return () => Engine.clear(engine);
    }

    let mouse: Mouse | undefined;
    if (window.matchMedia("(pointer: fine)").matches) {
      mouse = Mouse.create(el);
      unlisten(mouse, el, WHEEL_AND_TOUCH);
      const grab = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.08 } });
      Composite.add(engine.world, grab);
    }

    let raf = 0;
    let last = performance.now();
    let pending = 0;
    let nextDyno = last + 3400;

    const tick = (now: number) => {
      pending += Math.min(now - last, 64);
      last = now;
      while (pending >= STEP) {
        Engine.update(engine, STEP);
        pending -= STEP;
      }
      // Now and then a hold resting on the pile jumps off it, so the frame keeps moving.
      if (now > nextDyno) {
        const resting = holds.filter(({ body }) => body.speed < 0.25 && body.position.y > height * 0.45);
        const pick = resting[Math.floor(Math.random() * resting.length)];
        if (pick) {
          Body.setVelocity(pick.body, { x: (Math.random() - 0.5) * 10, y: -(13 + Math.random() * 7) });
          Body.setAngularVelocity(pick.body, (Math.random() - 0.5) * 0.3);
        }
        nextDyno = now + 1700 + Math.random() * 1500;
      }
      paint();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => {
      width = el.clientWidth;
      height = el.clientHeight;
      Body.setPosition(floor, { x: width / 2, y: height + WALL / 2 });
      Body.setPosition(right, { x: width + WALL / 2, y: 0 });
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      if (mouse) unlisten(mouse, el, POINTER);
      Engine.clear(engine);
    };
  }, [stage, ready, reduced]);
}

export function Hero() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLElement>(null);

  usePhysics(stage, ready, reduced);

  const shown = ready ? 1 : 0;
  const fade = (delay: number, duration = 0.9) => ({ duration: reduced ? 0 : duration, delay: ready && !reduced ? delay : 0, ease: OUT });

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section ref={stage} className="relative isolate h-svh min-h-[38rem] overflow-hidden bg-background text-foreground select-none">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: shown }}
        transition={fade(0.2)}
        className="relative z-20 flex items-center justify-between gap-6 px-5 pt-5 sm:px-8 sm:pt-7"
      >
        <p className="font-heading text-[2.1rem] leading-none font-black uppercase">{BRAND}</p>
        <p className="label hidden text-muted-foreground lg:block">{HOURS}</p>
        <nav aria-label="Sections" className="flex items-center gap-6">
          <a href="#" className="label hidden sm:inline">Classes</a>
          <a href="#" className="label hidden sm:inline">Timetable</a>
          <a href="#" className="label hidden sm:inline">Coaches</a>
          <a href="#" className="label rounded-full bg-(--lime) px-4 py-2.5 text-(--coal)">
            {OFFER}
          </a>
        </nav>
      </motion.header>

      <div className="relative grid gap-6 px-5 pt-[5vh] sm:px-8 lg:grid-cols-12">
        <h1 aria-label={HEADLINE.join(" ")} className="font-heading text-[clamp(3.4rem,7.4vw,12rem)] leading-[0.84] font-black uppercase lg:col-span-8">
          {HEADLINE.map((line, i) => (
            <span key={line} aria-hidden className="block overflow-hidden">
              <motion.span
                className="block will-change-transform"
                initial={{ transform: "translateY(105%)" }}
                animate={{ transform: shown ? "translateY(0%)" : "translateY(105%)" }}
                transition={{ duration: reduced ? 0 : 1, delay: ready && !reduced ? i * 0.1 : 0, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={fade(0.5)} className="lg:col-span-4 lg:col-start-9 lg:pt-2 xl:col-span-3 xl:col-start-10">
          <p className="max-w-[38ch] text-[0.95rem] leading-relaxed text-foreground/85 min-[1800px]:text-[1.15rem]">{INTRO}</p>
          <NextClass />
        </motion.div>
      </div>

      <div className="absolute inset-0 z-10">
        {HOLDS.map((hold, i) => (
          <Piece key={`${hold.label}-${i}`} hold={hold} hidden={i >= 11} />
        ))}
      </div>
    </section>
  );
}

function NextClass() {
  return (
    <div className="mt-6 hidden border border-border bg-background/80 p-4 backdrop-blur-sm sm:block">
      <div className="flex items-baseline justify-between">
        <p className="label text-muted-foreground">Next class</p>
        <p className="label">Today {NEXT_CLASS.time}</p>
      </div>
      <p className="mt-2 font-heading text-[2rem] leading-none font-extrabold uppercase">{NEXT_CLASS.name}</p>
      <p className="mt-2 text-[0.85rem] text-muted-foreground">
        {NEXT_CLASS.coach} · {NEXT_CLASS.size - NEXT_CLASS.booked} of {NEXT_CLASS.size} spots left
      </p>
      <div aria-hidden className="mt-3 flex gap-1">
        {Array.from({ length: NEXT_CLASS.size }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1", i < NEXT_CLASS.booked ? "bg-foreground" : "bg-(--lime)")} />
        ))}
      </div>
      <a href="#" className="label mt-4 inline-flex bg-foreground px-4 py-2.5 text-background">
        Book a spot
      </a>
    </div>
  );
}

function Piece({ hold, hidden }: { hold: Hold; hidden: boolean }) {
  const plate = hold.shape === "plate";
  return (
    <div
      data-hold={hold.shape}
      className={cn(
        "absolute top-0 left-0 flex cursor-grab items-center justify-center rounded-full font-heading leading-none font-extrabold whitespace-nowrap uppercase active:cursor-grabbing",
        plate
          ? "size-[clamp(5.5rem,9vw,14rem)] text-[clamp(1.25rem,2vw,3.2rem)]"
          : "h-[clamp(3.25rem,5.4vw,8.5rem)] px-[0.5em] text-[clamp(1.8rem,3.2vw,5.2rem)]",
        hidden && "max-sm:hidden",
      )}
      style={{
        color: hold.ink,
        transform: "translate(-200vw, 0px)",
        background: plate
          ? `radial-gradient(circle, #121212 0 6%, #b9bdc2 6.5% 13%, #8f949a 13.5% 15%, ${hold.color} 15.5%)`
          : hold.color,
        boxShadow: plate ? "inset 0 0 0 max(3px, 0.35vw) rgba(0,0,0,0.22)" : undefined,
      }}
    >
      {plate ? (
        <>
          <span className="absolute inset-x-0 top-[8%] text-center">{hold.label}</span>
          <span className="absolute inset-x-0 bottom-[10%] text-center text-[0.5em] tracking-[0.08em]">{hold.unit}</span>
        </>
      ) : (
        hold.label
      )}
    </div>
  );
}
