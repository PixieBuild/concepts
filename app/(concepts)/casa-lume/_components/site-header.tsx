"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { trackHeroEnd } from "@/app/(concepts)/casa-lume/_lib/hero-end";
import { NAV_LINKS } from "@/app/(concepts)/casa-lume/_lib/content";
import { path } from "@/app/(concepts)/casa-lume/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [heroRoom, setHeroRoom] = useState<string | undefined>("false");
  const [menuOpen, setMenuOpen] = useState(false);

  const plainPage = pathname.startsWith(path("/booking"));
  const overHero = !scrolled && !menuOpen;
  const inverted = overHero && (heroRoom === "true" || heroRoom === "opening");
  // While the hero's plate opens beneath it, the header steps back and returns already inverted.
  const away = overHero && heroRoom === "opening";
  const grounded = plainPage || scrolled || menuOpen;

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onScroll = () => {
      const end = heroEnd.get();
      // Over the home hero the header stays transparent until the pinned stage starts to scroll away.
      // Without motion the hero is not pinned, so it grounds as soon as the page moves, except over the room.
      setScrolled(
        end
          ? end.bottom < window.innerHeight - 1 ||
              (still.matches && window.scrollY > 24 && end.hero.dataset.room !== "true")
          : window.scrollY > 24,
      );
      setHeroRoom(end?.hero.dataset.room);
    };
    const heroEnd = trackHeroEnd(onScroll);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // The hero flips data-room on its own frame, which can land after the last scroll event.
    const hero = document.getElementById("hero");
    const observer = new MutationObserver(onScroll);
    if (hero) observer.observe(hero, { attributes: true, attributeFilter: ["data-room"] });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      heroEnd.stop();
    };
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
          "fixed inset-x-0 top-0 z-50 ease-out focus-within:opacity-100",
          inverted ? "text-background" : "text-foreground",
          away && "pointer-events-none opacity-0",
        )}
        style={{
          transition: away
            ? "opacity 250ms ease-out, color 0s linear 250ms"
            : heroRoom === "true"
              ? "opacity 450ms ease-out, color 500ms ease-out"
              : "opacity 450ms ease-out",
        }}
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 border-b border-border/60 bg-background/92 backdrop-blur-md transition-opacity duration-500 ease-out",
            grounded ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="relative mx-auto flex h-18 w-full max-w-[100rem] items-center justify-between gap-6 px-5 sm:px-8 lg:h-20 lg:px-12 xl:px-16 2xl:px-24">
          <HeaderNav pathname={pathname} />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              className={cn(
                "hidden h-11 px-7 sm:inline-flex",
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

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

// Memoised so the header's scroll-driven state never re-renders the closed menu.
const MobileMenu = memo(function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-60 flex flex-col bg-background transition-[opacity,visibility] duration-500 lg:hidden",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="flex h-18 items-center justify-between px-5 sm:px-8">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="grid size-10 place-items-center"
          tabIndex={open ? 0 : -1}
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
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className={cn(
              "border-b border-border/60 py-5 font-heading text-4xl leading-none font-light transition-[opacity,transform] duration-700",
              open
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0 motion-reduce:translate-y-0",
            )}
            style={{
              transitionDelay: open ? `${120 + index * 60}ms` : "0ms",
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
              onClick={onClose}
            />
          }
        >
          Book your stay
        </Button>
      </div>
    </div>
  );
});

// The home link and nav depend only on the route, so the header's scroll-driven state skips them.
const HeaderNav = memo(function HeaderNav({ pathname }: { pathname: string }) {
  return (
    <>
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
    </>
  );
});
