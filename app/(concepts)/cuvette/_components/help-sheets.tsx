"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { COMPANY, HELP } from "../_lib/content";
import { cutoffIn, dispatchDay, eta, formatCountdown, formatDispatch, formatWindow } from "../_lib/delivery";

export type HelpTopic = "delivery" | "contact";

const HELP_EVENT = "cuvette:help";
const LAST_ORDER_KEY = "cuvette:last-order";

export function openHelp(topic: HelpTopic) {
  window.dispatchEvent(new CustomEvent<HelpTopic>(HELP_EVENT, { detail: topic }));
}

export function HelpButton({ topic, children, className }: { topic: HelpTopic; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-haspopup="dialog" onClick={() => openHelp(topic)} className={cn("inline-flex min-h-11 items-center text-left", className)}>
      {children}
    </button>
  );
}

type LastOrder = { order: string; window: string | null };

function readLastOrder(): LastOrder | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) ?? "null") as { order?: unknown; eta?: { earliest?: unknown; latest?: unknown } } | null;
    if (!raw || typeof raw.order !== "string") return null;
    const { earliest, latest } = raw.eta ?? {};
    const window = typeof earliest === "string" && typeof latest === "string" ? formatWindow({ earliest, latest }) : null;
    return { order: raw.order, window };
  } catch {
    return null;
  }
}

function Facts({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <dl className="border-b border-border">
      {items.map((item) => (
        <div key={item.title} className="grid gap-1 border-t border-border py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
          <dt className="label pt-0.5 text-muted-foreground">{item.title}</dt>
          <dd className="leading-relaxed">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

function DispatchLine() {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const left = cutoffIn(now);
      const arrives = formatWindow(eta("PT", "standard", now));
      setLine(
        left !== null
          ? `Order in the next ${formatCountdown(left)} and it leaves Porto today. Standard to Portugal arrives ${arrives}.`
          : `Orders placed now leave Porto ${formatDispatch(dispatchDay(now), now)}. Standard to Portugal arrives ${arrives}.`,
      );
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return <p className="min-h-[3.1em] text-[1.02rem] leading-normal">{line}</p>;
}

function WhereIsMyOrder() {
  // Only ever rendered inside an open sheet, so storage is always there to read.
  const [order] = useState(readLastOrder);

  return (
    <section aria-labelledby="where-title" className="bg-secondary px-4 py-4">
      <h3 id="where-title" className="product-name">
        Where&rsquo;s my order?
      </h3>
      {order ? (
        <p className="mt-1 leading-relaxed">
          Order <span className="font-mono text-[0.9em]">{order.order}</span>
          {order.window ? ` arrives ${order.window}.` : " is on its way."}{" "}
          <Link href={`/cuvette/checkout/confirmation?order=${encodeURIComponent(order.order)}`} className="link inline-flex min-h-11 items-center">
            View order
          </Link>
        </p>
      ) : (
        <p className="mt-1 leading-relaxed text-muted-foreground">No order on this device yet. After checkout, its number and delivery window show here.</p>
      )}
    </section>
  );
}

function SheetHead({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 pt-5 pb-5">
      <div>
        <SheetTitle className="font-normal">
          <span className="title">{title}</span>
        </SheetTitle>
        <SheetDescription className="mt-1.5 text-[0.95rem] text-muted-foreground">{description}</SheetDescription>
      </div>
      <SheetClose className="label -mr-2 inline-flex min-h-11 shrink-0 items-center px-2">Close</SheetClose>
    </div>
  );
}

/** One instance per page; anything can open it with `openHelp(topic)`. */
export function HelpSheets() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<HelpTopic>("delivery");

  useEffect(() => {
    const onOpen = (event: Event) => {
      setTopic((event as CustomEvent<HelpTopic>).detail);
      setOpen(true);
    };
    window.addEventListener(HELP_EVENT, onOpen);
    return () => window.removeEventListener(HELP_EVENT, onOpen);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {topic === "delivery" ? (
          <>
            <SheetHead title="Delivery & returns" description="From Porto, Monday to Friday. Free over €40." />
            <div data-lenis-prevent className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <DispatchLine />
              <WhereIsMyOrder />
              <section aria-labelledby="delivery-title">
                <h3 id="delivery-title" className="label mb-3 text-muted-foreground">
                  Delivery
                </h3>
                <Facts items={HELP.delivery} />
              </section>
              <section aria-labelledby="returns-title">
                <h3 id="returns-title" className="label mb-3 text-muted-foreground">
                  Returns
                </h3>
                <Facts items={HELP.returns} />
              </section>
            </div>
          </>
        ) : (
          <>
            <SheetHead title="Contact" description="Porto, Monday to Friday. No phone line, on purpose." />
            <div data-lenis-prevent className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <a href={`mailto:${COMPANY.email}`} className="title link inline-flex min-h-11 items-center break-all">
                {COMPANY.email}
              </a>
              <Facts items={HELP.contact} />
              <p className="label text-muted-foreground">
                {COMPANY.legal} · {COMPANY.city}, {COMPANY.country}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
