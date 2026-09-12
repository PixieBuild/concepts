import { Container } from "./container";
import { BRAND, PHONE_DISPLAY, PHONE_HREF } from "../_lib/constants";

const navLinks = [
  ["Services", "#services"],
  ["Book", "#book"],
  ["The shop", "#craft"],
  ["Reviews", "#reviews"],
] as const;

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-40 border-b-2 border-border bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md">
      <Container className="flex items-center gap-5.5 py-3.5">
        <a href="#top" className="flex items-center gap-2.75 text-foreground no-underline">
          <span className="block size-3.75 bg-primary" />
          <span className="font-heading text-[19px] font-extrabold tracking-[0.16em]">{BRAND}</span>
        </a>
        <span className="ml-3.5 hidden gap-7 min-[760px]:flex">
          {navLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[14px] font-semibold tracking-[0.02em] text-foreground no-underline transition-colors hover:text-primary"
            >
              {label}
            </a>
          ))}
        </span>
        <span className="ml-auto flex items-center gap-5">
          <a
            href={PHONE_HREF}
            className="hidden whitespace-nowrap text-[14px] font-semibold text-foreground no-underline min-[480px]:inline"
          >
            {PHONE_DISPLAY}
          </a>
          <a
            href="#book"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-[11px] border-2 border-primary bg-primary px-4.5 py-2.5 font-heading text-[14px] font-extrabold text-white no-underline shadow-(--shadow-soft-sm) transition-all hover:-translate-y-px hover:border-(--brand-700) hover:bg-(--brand-700) hover:shadow-(--shadow-soft-md) active:translate-y-0"
          >
            Book a chair
          </a>
        </span>
      </Container>
    </nav>
  );
}
