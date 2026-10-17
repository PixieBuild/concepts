"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { BRAND, COMPANY } from "../_lib/content";
import { telHref } from "../_lib/format";
import { PAGE_INERT_EVENT } from "../_lib/modal";
import { onAnchorClick } from "../_lib/scroll";

const LINKS = [
  { href: "#objectives", label: "Objectives" },
  { href: "#conditions", label: "Conditions" },
  { href: "#guides", label: "Guides" },
];

const parisClock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function officeOpen(now: Date) {
  const time = parisClock.format(now);
  return time >= COMPANY.hours.opens && time < COMPANY.hours.closes;
}

/** Appears once the climb has ended: a solid ink bar on wider screens, a call-or-enquire bar on phones and short landscape screens. */
export function SiteBar() {
  const [past, setPast] = useState(false);
  const [enquiring, setEnquiring] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean | null>(null);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const sync = (event: Event) => setCovered((event as CustomEvent<boolean>).detail);
    window.addEventListener(PAGE_INERT_EVENT, sync);
    return () => window.removeEventListener(PAGE_INERT_EVENT, sync);
  }, []);

  useEffect(() => {
    const marker = document.getElementById("after-hero");
    if (!marker) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setPast(marker.getBoundingClientRect().top <= 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const section = document.getElementById("enquire");
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setEnquiring(entry.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ids = ["office-title", ...LINKS.map((link) => link.href.slice(1)), "enquire"];
    const sections = ids.map((id) => document.getElementById(id)?.closest("section") ?? null).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id ? `#${entry.target.id}` : null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tick = () => setOpen(officeOpen(new Date()));
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <div
        data-own-inert
        inert={!past || covered}
        className={cn(
          "fixed inset-x-0 top-0 z-40 hidden h-14 bg-(--ink) text-(--snow) transition-transform duration-300 ease-out md:[@media(min-height:501px)]:block print:hidden",
          past ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-[104rem] items-center gap-8 px-10 lg:px-14">
          <a href="#top" onClick={onAnchorClick} className="wordmark -my-2 py-2">
            {BRAND}
          </a>
          <nav aria-label="Sections" className="flex items-center gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onAnchorClick}
                aria-current={current === link.href ? "location" : undefined}
                className="action relative inline-flex h-14 items-center px-3 text-(--snow)/75 transition-colors hover:text-(--snow) aria-[current]:text-(--snow)"
              >
                {link.label}
                <span
                  aria-hidden
                  className={cn("absolute inset-x-3 bottom-0 h-0.5 origin-left bg-(--signal) transition-transform duration-300", current === link.href ? "scale-x-100" : "scale-x-0")}
                />
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-6">
            {open !== null && (
              <p className="label hidden items-center gap-2 text-(--snow)/75 xl:flex">
                <span aria-hidden className={cn("size-1.5 rounded-full", open ? "bg-(--glacier)" : "bg-(--snow)/40")} />
                {open ? `Office open until ${COMPANY.hours.closes}` : `Office opens at ${COMPANY.hours.opens}, Chamonix time`}
              </p>
            )}
            <a href={telHref(COMPANY.phone)} className="data hidden text-(--snow)/90 underline-offset-4 hover:underline lg:inline">
              {COMPANY.phone}
            </a>
            <a
              href="#enquire"
              onClick={onAnchorClick}
              className="action inline-flex h-10 items-center bg-(--signal) px-5 text-white transition-colors hover:bg-(--snow) hover:text-(--ink)"
            >
              Enquire
            </a>
          </div>
        </div>
      </div>

      <div
        data-own-inert
        inert={!past || enquiring || covered}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 bg-(--ink) pb-[env(safe-area-inset-bottom)] text-(--snow) transition-transform duration-300 ease-out md:[@media(min-height:501px)]:hidden print:hidden",
          past && !enquiring ? "translate-y-0" : "translate-y-full",
        )}
      >
        <a href={telHref(COMPANY.phone)} className="action flex h-14 items-center justify-center gap-2 border-t border-(--snow)/15">
          Call the office
        </a>
        <a href="#enquire" onClick={onAnchorClick} className="action flex h-14 items-center justify-center bg-(--signal) text-white">
          Enquire
        </a>
      </div>
    </>
  );
}
