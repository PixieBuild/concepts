import Link from "next/link";
import { CalendarCheck, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";

import { SiteFooter, SiteHeader } from "./_components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TRUST = [
  { icon: CalendarCheck, label: "Same-week appointments" },
  { icon: ShieldCheck, label: "Transparent, itemised pricing" },
  { icon: HeartPulse, label: "Sedation options for anxiety" },
];

const SERVICES = [
  {
    title: "Preventive care",
    copy: "Cleanings, sealants, and check-ups that keep small problems small.",
  },
  {
    title: "Invisible aligners",
    copy: "A straighter smile over 6–18 months, with no metal in sight.",
  },
  {
    title: "Same-day crowns",
    copy: "Scanned, milled, and fitted in a single visit. No temporaries.",
  },
];

export default function AuroraDentalHome() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-5 rounded-full px-3 py-1">
              <Sparkles className="size-3.5" />
              Now accepting new patients
            </Badge>
            <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              Dentistry that doesn&apos;t make you brace for it.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              We explain every step before it happens, quote the full cost up
              front, and keep the drill away unless it genuinely helps. Most
              first visits take forty minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" nativeButton={false} render={<a href="#book" />}>
                Book a visit
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/aurora-dental/services" />}
              >
                See what we treat
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-secondary/40">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            What we do most
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {SERVICES.map((service) => (
              <Card key={service.title}>
                <CardContent className="pt-6">
                  <h3 className="font-heading text-lg font-semibold">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.copy}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="book"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 pb-24"
        >
          <div className="rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance">
              Ready when you are
            </h2>
            <p className="mx-auto mt-3 max-w-md opacity-90">
              Call 020 4567 8900 or book online — we&apos;ll confirm within the
              hour.
            </p>
            <Button size="lg" variant="secondary" className="mt-7">
              Book online
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
