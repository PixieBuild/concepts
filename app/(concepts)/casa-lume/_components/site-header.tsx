"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_LINKS } from "@/app/(concepts)/casa-lume/_lib/content";
import { path } from "@/app/(concepts)/casa-lume/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const overHero = !pathname.startsWith(path("/booking"));
  const inverted = overHero && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-out",
          inverted ? "text-background" : "text-foreground",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 border-b border-border/60 bg-background/92 backdrop-blur-md transition-opacity duration-500 ease-out",
            inverted ? "opacity-0" : "opacity-100",
          )}
        />
        <div className="relative mx-auto flex h-18 w-full max-w-[100rem] items-center justify-between gap-6 px-5 sm:px-8 lg:h-20 lg:px-12 xl:px-16 2xl:px-24">
          <Link
            href={path()}
            className="shrink-0 transition-opacity hover:opacity-70"
            aria-label="Casa Lume — home"
          >
            <Logo />
          </Link>

          <nav className="hidden items-center gap-10 lg:flex" aria-label="Main">
            {NAV_LINKS.map(link => {
              const href = path(link.href);
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={link.href}
                  href={href}
                  className={cn(
                    "group relative text-[0.72rem] tracking-[0.18em] uppercase transition-opacity hover:opacity-100",
                    active ? "opacity-100" : "opacity-70",
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100",
                      active && "scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              className={cn(
                "hidden h-10 px-6 sm:inline-flex",
                inverted
                  ? "border-background/45 bg-transparent text-background hover:bg-background hover:text-foreground"
                  : "border-foreground/25 bg-transparent hover:bg-foreground hover:text-background",
              )}
              render={<Link href={path("/booking")} />}
            >
              Book now
            </Button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-60 flex flex-col bg-background transition-[opacity,visibility] duration-500 lg:hidden",
          menuOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        aria-hidden={!menuOpen}
      >
        <div className="flex h-18 items-center justify-between px-5 sm:px-8">
          <Logo />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="grid size-10 place-items-center"
            tabIndex={menuOpen ? 0 : -1}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col justify-center gap-1 px-5 sm:px-8"
          aria-label="Mobile"
        >
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={path(link.href)}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className={cn(
                "border-b border-border/60 py-5 font-heading text-4xl leading-none font-light transition-[opacity,transform] duration-700",
                menuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0 motion-reduce:translate-y-0",
              )}
              style={{
                transitionDelay: menuOpen ? `${120 + index * 60}ms` : "0ms",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-5 pb-10 sm:px-8">
          <Button
            size="lg"
            className="w-full"
            nativeButton={false}
            render={
              <Link
                href={path("/booking")}
                onClick={() => setMenuOpen(false)}
              />
            }
          >
            Book your stay
          </Button>
        </div>
      </div>
    </>
  );
}
