import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import { path, url } from "../site";
import { Card, CardContent } from "@/components/ui/card";

const description =
  "Preventive care, invisible aligners, same-day crowns, and emergency appointments — with itemised pricing published up front.";

export const metadata: Metadata = {
  // Resolves through the layout template as "Services | Aurora Dental".
  title: "Services",
  description,
  alternates: { canonical: path("/services") },
  openGraph: { title: "Services", description, url: url("/services") },
};

const SERVICES = [
  {
    title: "Preventive care",
    price: "from ₹1,200",
    copy: "Scale and polish, fluoride treatment, and a full chart review. Recommended twice a year.",
  },
  {
    title: "Invisible aligners",
    price: "from ₹85,000",
    copy: "A 3D scan on day one, then a set of clear trays swapped every fortnight for 6–18 months.",
  },
  {
    title: "Same-day crowns",
    price: "from ₹14,000",
    copy: "Milled in-clinic while you wait, colour-matched to the teeth on either side.",
  },
  {
    title: "Root canal therapy",
    price: "from ₹7,500",
    copy: "Single-sitting treatment under local anaesthetic, with sedation available on request.",
  },
  {
    title: "Paediatric dentistry",
    price: "from ₹900",
    copy: "Short, unhurried visits designed so a child's first memory of a clinic is a dull one.",
  },
  {
    title: "Emergency appointments",
    price: "from ₹1,500",
    copy: "Same-day slots held back every morning for pain, swelling, and knocked-out teeth.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance">
            Services & pricing
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every price below is what you actually pay. If a treatment plan
            changes mid-course, we re-quote before continuing.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Card key={service.title}>
                <CardContent className="pt-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-heading text-lg font-semibold">
                      {service.title}
                    </h2>
                    <span className="text-sm font-medium whitespace-nowrap text-primary">
                      {service.price}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.copy}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
