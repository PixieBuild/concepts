"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCatalog } from "../../_components/catalog-provider";
import { bagTotals, clearBag, openBag, useBag, type Bag } from "../../_lib/cart";
import { COUNTRIES, type Country, type Method } from "../../_lib/delivery";
import { clearDraft, readDraft, writeDraft } from "../_lib/draft";
import { buildOrder, saveOrder } from "../_lib/order";
import type { Contact, Delivery, DeliveryInput } from "../_lib/schema";
import { ContactForm } from "./contact-step";
import { DeliveryForm } from "./delivery-step";
import { MobileSummary, OrderSummary } from "./order-summary";
import { PaymentStep } from "./payment-step";
import { Step, type StepStatus } from "./step";

export function Checkout() {
  const { bag, buyable, hydrated } = useBag();
  const router = useRouter();
  const placed = useRef(false);
  const empty = buyable.length === 0;

  useEffect(() => {
    if (!hydrated || !empty || placed.current) return;
    router.replace("/cuvette");
    openBag();
  }, [hydrated, empty, router]);

  if (!hydrated || empty) {
    return (
      <p className="px-4 py-24 text-center text-muted-foreground sm:px-10" aria-live="polite">
        {hydrated ? "Your bag is empty. Taking you back to the shop." : "Loading your bag…"}
      </p>
    );
  }

  return (
    <Flow
      bag={bag}
      onPlace={(order) => {
        placed.current = true;
        saveOrder(order);
        clearDraft();
        clearBag();
        router.replace(`/cuvette/checkout/confirmation?order=${order.id}`);
      }}
    />
  );
}

type Stage = 0 | 1 | 2;

function Flow({ bag, onPlace }: { bag: Bag; onPlace: (order: ReturnType<typeof buildOrder>) => void }) {
  const [draft] = useState(readDraft);
  const [contact, setContact] = useState<Contact>(draft.contact);
  const [delivery, setDelivery] = useState<DeliveryInput | Delivery>(draft.delivery);
  const [done, setDone] = useState<Delivery | null>(draft.delivered);
  const [stage, setStage] = useState<Stage>(draft.delivered ? 2 : draft.contactDone ? 1 : 0);
  const [preview, setPreview] = useState<{ country: Country; method: Method }>({ country: draft.delivery.country, method: draft.delivery.method });
  const moved = useRef(false);
  const catalog = useCatalog();

  useEffect(() => {
    if (!moved.current) return;
    const heading = document.getElementById(`step-${stage + 1}`);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [stage]);

  const go = (next: Stage) => {
    moved.current = true;
    setStage(next);
  };

  const onPreview = useCallback((country: Country, method: Method) => setPreview({ country, method }), []);
  const totals = bagTotals(bag, catalog, preview.country, preview.method);
  const status = (i: Stage): StepStatus => (i === stage ? "active" : i < stage ? "done" : "upcoming");

  const address = done ?? delivery;
  const country = COUNTRIES[address.country].name;

  return (
    <div className="lg:grid lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] xl:grid-cols-2">
      <MobileSummary bag={bag} totals={totals} shippingKnown={stage === 2} />
      <div className="px-4 pt-8 pb-20 sm:px-10 lg:py-14 lg:pr-16">
        <div className="mx-auto max-w-[36rem] lg:mr-0 lg:ml-auto">
          <p className="label text-muted-foreground">Demo checkout · No card details</p>
          <h1 className="heading mt-3 mb-10">Checkout</h1>

          <Step
            index={1}
            title="Contact"
            status={status(0)}
            onEdit={() => go(0)}
            summary={
              <>
                {contact.email}
                {contact.optIn && <span className="block">Notes on new lots: yes</span>}
              </>
            }
          >
            <ContactForm
              defaults={contact}
              onDone={(value) => {
                setContact(value);
                writeDraft(value, delivery);
                go(done ? 2 : 1);
              }}
            />
          </Step>

          <Step
            index={2}
            title="Delivery"
            status={status(1)}
            onEdit={() => go(1)}
            summary={
              <>
                {address.firstName} {address.lastName}, {address.line1}
                {address.line2 && `, ${address.line2}`}, {address.postcode} {address.city}, {country}
                <span className="block">{address.method === "express" ? "Express" : "Standard, CTT"}</span>
              </>
            }
          >
            <DeliveryForm
              defaults={delivery}
              goods={totals.goods}
              onPreview={onPreview}
              onDone={(value) => {
                setDelivery(value);
                setDone(value);
                writeDraft(contact, value);
                go(2);
              }}
            />
          </Step>

          <Step index={3} title="Payment (demo)" status={status(2)}>
            {done && <PaymentStep totals={totals} onPlace={() => onPlace(buildOrder(bag, catalog, contact, done, new Date()))} />}
          </Step>
        </div>
      </div>
      <div className="hidden border-l border-border bg-(--paper-2) px-10 py-14 lg:block">
        <OrderSummary bag={bag} totals={totals} shippingKnown={stage === 2} />
      </div>
    </div>
  );
}
