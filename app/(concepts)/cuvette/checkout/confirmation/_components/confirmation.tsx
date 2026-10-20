"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { POLICY } from "../../../_lib/content";
import { COUNTRIES, formatDay, formatWindow } from "../../../_lib/delivery";
import { price } from "../../../_lib/format";
import { isSet, serumsIn, sizeLabel } from "../../../_lib/product";
import { ProductName } from "../../../_components/bag/product-name";
import { Bottle } from "../../../_components/bottle/bottle";
import { useCatalog } from "../../../_components/catalog-provider";
import { useLastOrder, type Order } from "../../_lib/order";

export function Confirmation({ id }: { id: string | null }) {
  const order = useLastOrder();
  if (order === undefined) return <div className="min-h-[70svh]" aria-busy />;
  if (!order || order.id !== id) return <NotFound />;
  return <Placed order={order} />;
}

function NotFound() {
  return (
    <section className="px-4 py-28 sm:px-10 lg:py-40">
      <h1 className="heading max-w-[18ch]">We can’t find that order on this device.</h1>
      <p className="lead mt-5 max-w-[44ch] text-muted-foreground">Demo orders live only in the browser they were placed in.</p>
      <Button nativeButton={false} render={<Link href="/cuvette" />} className="mt-10 h-12 px-8 font-normal">
        Back to the shop
      </Button>
    </section>
  );
}

function Placed({ order }: { order: Order }) {
  const catalog = useCatalog();
  const hero = catalog.get(order.lines[0].slug);
  const firstSerum = hero ? serumsIn(hero)[0] : null;
  const subscribed = order.lines.some((l) => l.purchase === "subscribe");
  const steps = [
    { title: "Packed in Porto", when: formatDay(order.eta.dispatch) },
    { title: "With CTT", when: order.delivery.method === "express" ? "Express, tracked" : "Standard, tracked" },
    { title: "Delivered", when: formatWindow(order.eta) },
  ];

  return (
    <>
      <section className="grid gap-10 px-4 pt-10 pb-16 sm:px-10 lg:grid-cols-12 lg:gap-x-10 lg:pt-16 lg:pb-24">
        <div className="lg:col-span-6 lg:self-end">
          <p className="label text-muted-foreground">Order {order.id}</p>
          <h1 className="display mt-5">Thank you, {order.delivery.firstName}.</h1>
          <p className="lead mt-6 max-w-[40ch]">
            Arriving {formatWindow(order.eta)}. <span className="text-muted-foreground">A real shop would email this to {order.contact.email}; the demo sends nothing.</span>
          </p>
          <ol className="mt-12 grid gap-0 border-t border-border sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="relative border-b border-border py-4 sm:border-b-0 sm:pr-4">
                <span aria-hidden className="absolute -top-[5px] left-0 size-[9px] rounded-full border border-foreground bg-background" style={i === 0 ? { background: "var(--foreground)" } : undefined} />
                <p className="label mt-2 text-muted-foreground">{step.when}</p>
                <p className="mt-1.5 text-[0.95rem]">{step.title}</p>
              </li>
            ))}
          </ol>
        </div>
        {hero && (
          <div className="relative aspect-4/5 overflow-hidden lg:col-span-5 lg:col-start-8">
            <Bottle product={hero} shot="pack" priority quality={90} sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
        )}
      </section>

      <section aria-labelledby="receipt" className="paper px-4 py-14 sm:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-6">
            <h2 id="receipt" className="title">
              Your order
            </h2>
            <Receipt order={order} />
          </div>
          <div className="space-y-10 lg:col-span-4 lg:col-start-9">
            <Detail label="Delivering to">
              {order.delivery.firstName} {order.delivery.lastName}
              <br />
              {order.delivery.line1}
              {order.delivery.line2 && (
                <>
                  <br />
                  {order.delivery.line2}
                </>
              )}
              <br />
              {order.delivery.postcode} {order.delivery.city}
              <br />
              {COUNTRIES[order.delivery.country].name}
            </Detail>
            <Detail label="Method">
              {order.delivery.method === "express" ? "Express" : "Standard, CTT"}, arriving {formatWindow(order.eta)}
            </Detail>
            {subscribed && (
              <Detail label="Subscription">Repeats every {hero?.subscribe.weeks ?? 8} weeks. Change or cancel any time.</Detail>
            )}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-6">
              <Button nativeButton={false} render={<Link href="/cuvette" />} className="h-12 px-8 font-normal">
                Back to the shop
              </Button>
              {firstSerum && (
                <Link href={`/cuvette/${firstSerum}#how-to`} className="link inline-flex min-h-11 items-center">
                  How to use your serums
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Receipt({ order }: { order: Order }) {
  const { totals } = order;
  const catalog = useCatalog();
  return (
    <>
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {order.lines.map((line) => {
          const p = catalog.get(line.slug);
          return (
            <li key={`${line.slug}:${line.purchase}`} className="grid grid-cols-[4rem_1fr_auto] items-center gap-x-4 py-4">
              <div className="relative size-16 overflow-hidden bg-[#0e0f10]">
                {p && <Bottle product={p} shot="thumb" sizes="64px" alt="" />}
              </div>
              <div className="min-w-0">
                <p className="text-[0.95rem]">
                  {p ? <ProductName product={p} /> : <span className="product-name">{line.title}</span>}
                  {line.qty > 1 && <span className="text-muted-foreground"> × {line.qty}</span>}
                </p>
                <p className="label mt-1 text-muted-foreground">
                  {p && `${sizeLabel(p)} · `}
                  {line.purchase === "subscribe" ? `Every ${p?.subscribe.weeks ?? 8} weeks` : "One-time"}
                  {p && !isSet(p) && p.lot.code && ` · Lot ${p.lot.code}`}
                </p>
              </div>
              <p className="text-[0.95rem]">{price(line.total)}</p>
            </li>
          );
        })}
        {order.gift && (
          <li className="flex justify-between gap-4 py-3 text-[0.95rem]">
            <span>{POLICY.gift} travel size</span>
            <span>Free</span>
          </li>
        )}
      </ul>
      {order.samples.length > 0 && (
        <p className="mt-4 text-sm">
          <span className="label mr-2 text-muted-foreground">Samples</span>
          {order.sampleTitles.join(", ")}, {POLICY.sampleMl} ml each
        </p>
      )}
      {order.note && (
        <p className="mt-2 text-sm">
          <span className="label mr-2 text-muted-foreground">Gift note</span>“{order.note}”
        </p>
      )}
      <dl className="mt-6 space-y-1.5 text-[0.95rem]">
        <Row label="Subtotal" value={price(totals.subtotal)} />
        {totals.discount > 0 && <Row label={`${order.promo ?? "Promo"}, 10% off serums`} value={`−${price(totals.discount)}`} />}
        <Row label="Delivery" value={totals.shipping === 0 ? "Free" : price(totals.shipping)} />
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="title">Paid in the demo</dt>
          <dd className="title">{price(totals.total)}</dd>
        </div>
        <Row label={`Includes VAT (${POLICY.vat * 100}%)`} value={price(totals.vat)} />
      </dl>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="label text-muted-foreground">{label}</p>
      <p className="mt-2 text-[0.95rem] leading-relaxed">{children}</p>
    </div>
  );
}
