import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/aurora-dental", label: "Home" },
  { href: "/aurora-dental/services", label: "Services" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/aurora-dental"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Aurora <span className="text-primary">Dental</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" nativeButton={false} render={<a href="#book" />}>
            Book a visit
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="font-heading text-base font-semibold text-foreground">
          Aurora Dental
        </p>
        <p>Mon–Sat, 9am–7pm · Koregaon Park, Pune</p>
        <p>© {new Date().getFullYear()} Aurora Dental</p>
      </div>
    </footer>
  );
}
