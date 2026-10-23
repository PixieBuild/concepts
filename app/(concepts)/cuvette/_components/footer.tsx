import Link from "next/link";

import { listProducts } from "../_lib/catalog";
import { BRAND, COMPANY } from "../_lib/content";
import { productHref } from "../_lib/product";
import { HelpButton, HelpSheets } from "./help-sheets";

// The first few in range order; the shop page lists the rest.
const FOOTER_MAX = 4;
import { Newsletter } from "./newsletter";

export function Footer() {
  const [local, domain] = COMPANY.email.split("@");
  const products = listProducts();
  return (
    <footer className="border-t border-border">
      <div className="shell pt-16 pb-10 sm:pb-20 lg:pt-20">
        <div className="grid gap-14 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-12 lg:col-span-5">
            <Newsletter />
          </div>
          <div className="grid grid-cols-2 gap-8 md:contents">
            <nav
              aria-label="Shop"
              className="md:col-span-4 lg:col-span-3 lg:col-start-8"
            >
              <h2 className="label text-muted-foreground">Shop</h2>
              <ul className="mt-3">
                {products.slice(0, FOOTER_MAX).map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={productHref(p.slug)}
                      className="inline-flex min-h-11 items-center transition-colors hover:text-muted-foreground"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/cuvette/shop"
                    className="link inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    All {products.length} products
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="md:col-span-4 lg:col-span-2">
              <h2 className="label text-muted-foreground">Help</h2>
              <ul className="mt-3">
                <li>
                  <HelpButton
                    topic="delivery"
                    className="transition-colors hover:text-muted-foreground"
                  >
                    Delivery &amp; returns
                  </HelpButton>
                </li>
                <li>
                  <HelpButton
                    topic="contact"
                    className="transition-colors hover:text-muted-foreground"
                  >
                    Contact
                  </HelpButton>
                </li>
                <li>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="inline-block py-2.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {local}@<wbr />
                    {domain}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="label mt-16 flex flex-col gap-3 border-t border-border pt-6 text-muted-foreground lg:mt-24 lg:flex-row lg:items-center lg:justify-between">
          <p>
            <span className="text-foreground">{BRAND}</span> · {COMPANY.legal} ·{" "}
            {COMPANY.city}, {COMPANY.country}
          </p>
          <p>
            Prices in EUR incl. VAT · Demo shop: no orders are fulfilled · ©
            2026
          </p>
        </div>
      </div>
      <HelpSheets />
    </footer>
  );
}
