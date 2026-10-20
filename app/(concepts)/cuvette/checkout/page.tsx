import type { Metadata } from "next";

import { Header } from "../_components/header";
import { catalogSource } from "../_lib/catalog";
import { COMPANY } from "../_lib/content";
import { Checkout } from "./_components/checkout";
import { ShopifyHandoff } from "./_components/shopify-handoff";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function CheckoutPage() {
  const live = catalogSource() === "shopify";
  return (
    <div className="paper flex flex-1 flex-col">
      <Header variant="checkout" />
      <main className="flex-1">
        {live ? <ShopifyHandoff /> : <Checkout />}
      </main>
      <footer className="label flex flex-wrap justify-between gap-4 border-t border-border py-6 pr-20 pl-4 text-muted-foreground sm:pl-10">
        <p>
          {COMPANY.legal} · {COMPANY.city}, {COMPANY.country}
        </p>
        {!live && <p>Demo shop: no orders are fulfilled and no payment is taken</p>}
      </footer>
    </div>
  );
}
