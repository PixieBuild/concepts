"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { openBag } from "../_lib/cart";
import { ANNOUNCEMENT, BRAND } from "../_lib/content";
import { priceShort } from "../_lib/format";
import { isSet, priceOf, productHref, rangeSummary, type ProductCard, type Slug } from "../_lib/product";
import { BagCount } from "./bag-count";
import { openHelp, type HelpTopic } from "./help-sheets";
import { Search, SearchButton, openSearch } from "./search";
import { Bottle } from "./bottle/bottle";
import { useCatalog } from "./catalog-provider";

export type HeaderVariant = "overlay" | "solid" | "checkout";

const SHOP_HREF = "/cuvette/shop";

function Wordmark() {
  return (
    <Link href="/cuvette" aria-label={`${BRAND} home`} className="wordmark inline-flex min-h-11 items-center justify-self-center">
      {BRAND}
    </Link>
  );
}

function Swatch({ product, className }: { product: ProductCard; className?: string }) {
  const bands = isSet(product) ? product.parts.map((p) => p.colour.band) : [product.colour.band];
  return (
    <span aria-hidden className={cn("flex shrink-0 gap-1", className)}>
      {bands.map((band) => (
        <span key={band} className="size-2 rounded-full" style={{ backgroundColor: band }} />
      ))}
    </span>
  );
}

// Menus show the merchant's first few by `cuvette.position`; the shop page holds the rest.
const MENU_MAX = 6;

function ShopMenu() {
  const { listed } = useCatalog();
  const menu = listed.slice(0, MENU_MAX);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<Slug | null>(null);
  const shown = hovered ?? menu[0]?.slug;
  // Only previews someone has pointed at get a live composite; the rest never mount.
  const [seen, setSeen] = useState<Slug[]>([]);
  const preview = shown && !seen.includes(shown) ? [...seen, shown] : seen;
  const show = (slug: Slug) => {
    setHovered(slug);
    setSeen((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
  };
  const close = () => setOpen(false);
  const pathname = useCloseOnNavigate(close);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        openOnHover
        delay={120}
        nativeButton={false}
        render={<Link href={SHOP_HREF} onClick={close} aria-current={pathname === SHOP_HREF ? "page" : undefined} />}
        className="inline-flex min-h-11 items-center gap-1.5 aria-expanded:text-muted-foreground"
      >
        Shop
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        data-lenis-prevent
        className="max-h-[calc(100svh-6.5rem)] w-[min(40rem,calc(100vw-2rem))] gap-0 overflow-y-auto overscroll-contain rounded-(--radius) p-0 shadow-2xl ring-0"
      >
        <div className="grid grid-cols-[1fr_13rem]">
          <nav aria-label="Products" className="flex flex-col p-5">
            <p className="label text-muted-foreground">{rangeSummary(listed)}</p>
            <ul className="mt-3 border-t border-border">
              {menu.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={productHref(p.slug)}
                    onClick={close}
                    onMouseEnter={() => show(p.slug)}
                    onFocus={() => show(p.slug)}
                    className="grid min-h-14 grid-cols-[1.25rem_1fr_auto_3rem] items-center gap-3 border-b border-border transition-colors hover:bg-secondary/70 focus-visible:bg-secondary/70"
                  >
                    <Swatch product={p} />
                    <span className="product-name text-[0.98rem]">{p.title}</span>
                    <span className="label text-muted-foreground">{p.job}</span>
                    <span className="text-right">{priceShort(priceOf(p))}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={SHOP_HREF} onClick={close} className="link mt-4 inline-flex min-h-11 items-center self-start">
              All {listed.length} products
            </Link>
          </nav>
          <div className="relative min-h-72 bg-[#0e0f10]">
            {preview.map((slug) => {
              const p = menu.find((m) => m.slug === slug);
              if (!p) return null;
              return (
                <Bottle
                  key={slug}
                  product={p}
                  shot="pack"
                  sizes="208px"
                  className={cn("transition-opacity duration-300", slug === shown ? "opacity-100" : "opacity-0")}
                  alt={slug === shown ? undefined : ""}
                />
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MobileMenu() {
  const { listed } = useCatalog();
  const menu = listed.slice(0, MENU_MAX);
  const [open, setOpen] = useState(false);
  const then = (action: () => void) => () => {
    setOpen(false);
    window.setTimeout(action, 220);
  };
  const help = (topic: HelpTopic) => then(() => openHelp(topic));
  const row = "flex min-h-12 w-full items-center border-b border-border text-left";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="label inline-flex min-h-11 items-center pr-3">Menu</SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="w-full gap-0 p-0 data-[side=left]:w-full data-[side=left]:sm:max-w-md">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <SheetTitle className="font-normal text-muted-foreground">
            <span className="label">Menu</span>
          </SheetTitle>
          <SheetClose className="label -mr-2 inline-flex min-h-11 items-center px-2">Close</SheetClose>
        </div>
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-4 pt-2 pb-8">
          <ul className="text-[1.05rem]">
            <li>
              <button type="button" onClick={then(openSearch)} className={row}>
                Search
              </button>
            </li>
            <li>
              <Link href={SHOP_HREF} onClick={() => setOpen(false)} className={cn(row, "justify-between")}>
                All products
                <span className="label text-muted-foreground">{listed.length}</span>
              </Link>
            </li>
          </ul>
          <nav aria-label="Products" className="mt-6">
            <p className="label text-muted-foreground">{rangeSummary(listed)}</p>
            <ul className="mt-2 border-t border-border">
              {menu.map((p) => (
                <li key={p.slug}>
                  <Link href={productHref(p.slug)} onClick={() => setOpen(false)} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-border py-3">
                    <span className="relative block aspect-square w-18 overflow-hidden bg-[#0e0f10]">
                      <Bottle product={p} shot="thumb" sizes="72px" alt="" />
                    </span>
                    <span>
                      <span className="product-name block text-[1.15rem]">{p.title}</span>
                      <span className="label mt-1 flex items-center gap-2 text-muted-foreground">
                        <Swatch product={p} />
                        {p.jobs.join(" · ")}
                      </span>
                    </span>
                    <span>{priceShort(priceOf(p))}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {listed.length > menu.length && (
              <Link href={SHOP_HREF} onClick={() => setOpen(false)} className="link mt-3 inline-flex min-h-11 items-center">
                All {listed.length} products
              </Link>
            )}
          </nav>
          <ul className="mt-6 text-[1.05rem]">
            <li>
              <button type="button" onClick={help("delivery")} className={row}>
                Delivery &amp; returns
              </button>
            </li>
            <li>
              <button type="button" onClick={help("contact")} className={row}>
                Contact
              </button>
            </li>
            <li>
              <Link href="#newsletter" onClick={() => setOpen(false)} className={row}>
                Newsletter
              </Link>
            </li>
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function useCloseOnNavigate(close: () => void) {
  const pathname = usePathname();
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    close();
  }
  return pathname;
}

/** Over the stage the bar is transparent; it turns solid as soon as the stage starts to scroll away. */
function useOverStage(enabled: boolean) {
  const [over, setOver] = useState(enabled);
  useEffect(() => {
    if (!enabled) return;
    const stage = document.getElementById("stage");
    let frame = 0;
    const measure = () => {
      frame = 0;
      setOver(!!stage && stage.getBoundingClientRect().bottom > window.innerHeight - 4);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(measure);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);
  return over;
}

// Every page has one <main>, not every page gives it an id, so the link finds it itself.
function SkipLink() {
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const main = document.querySelector("main");
    if (!main) return;
    event.preventDefault();
    if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
    main.focus({ preventScroll: true });
    main.scrollIntoView();
  };
  return (
    <a
      href="#main"
      onClick={skip}
      className="label fixed top-2 left-2 z-50 inline-flex min-h-11 -translate-y-24 items-center bg-primary px-4 text-primary-foreground focus-visible:translate-y-0"
    >
      Skip to content
    </a>
  );
}

function CheckoutHeader() {
  return (
    <header className="paper border-b border-border">
      <SkipLink />
      {/* Tracks the form column in checkout.tsx (36rem, right-aligned at lg with a 30rem then half-width summary). */}
      <div className="shell grid h-14 grid-cols-[1fr_auto_1fr] items-center px-[max(var(--gutter),calc((100%-36rem)/2))] lg:px-[max(var(--gutter),calc(100%-70rem))] xl:px-[max(var(--gutter),calc(50%-40rem))]">
        <button type="button" onClick={openBag} aria-haspopup="dialog" className="link inline-flex min-h-11 items-center justify-self-start">
          Back to bag
        </button>
        <Wordmark />
      </div>
    </header>
  );
}

/** `overlay` floats over the home stage, `solid` heads every other page, `checkout` is wordmark-only. */
export function Header({ variant = "solid" }: { variant?: HeaderVariant }) {
  const overlay = variant === "overlay";
  const over = useOverStage(overlay);
  const [featuredSet] = useCatalog().bundles;

  if (variant === "checkout") return <CheckoutHeader />;

  return (
    // Sticks once the announcement has scrolled off; the overlay pulls the stage up underneath itself.
    <header className={cn("sticky -top-8 z-40", overlay && "-mb-22")}>
      <SkipLink />
      <p className="label flex h-8 items-center justify-center bg-black px-4 text-foreground/80">
        <span className="truncate sm:hidden">{ANNOUNCEMENT[0]}</span>
        <span className="hidden sm:inline">{ANNOUNCEMENT.join("  ·  ")}</span>
      </p>
      <div
        className={cn(
          "relative isolate border-b transition-colors duration-300",
          // The scrim runs past the bar so the raised dropper and the close-up's shoulders fall into shadow under the nav.
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-[calc(100%+3.5rem)] before:bg-linear-to-b before:from-[#0c0d0e]/85 before:via-[#0c0d0e]/40 before:to-transparent before:transition-opacity before:duration-300",
          over ? "border-transparent bg-transparent" : "border-border bg-background before:opacity-0",
        )}
      >
        <div className="shell grid h-14 grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center">
            <div className="md:hidden">
              <MobileMenu />
            </div>
            <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
              <ShopMenu />
              {featuredSet && (
                <Link href={`/cuvette/${featuredSet.slug}`} className="inline-flex min-h-11 items-center">
                  {featuredSet.title}
                </Link>
              )}
            </nav>
          </div>
          <Wordmark />
          <div className="flex items-center justify-end gap-7">
            <SearchButton className="hidden md:inline-flex" />
            <BagCount className="gap-[0.28em]" />
          </div>
        </div>
      </div>
      <Search />
    </header>
  );
}
