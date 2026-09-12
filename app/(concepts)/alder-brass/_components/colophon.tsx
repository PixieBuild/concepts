import { Mark, Wordmark } from "./mark";
import { Shell } from "./shell";
import { ADDRESS, BRAND, EMAIL, PHONE_DISPLAY } from "../_lib/content";

const LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "#", label: "Journal" },
  { href: `mailto:${EMAIL}`, label: "Email" },
];

export function Colophon() {
  return (
    <footer>
      <Shell className="pb-24 sm:pb-16">
        <div aria-hidden className="flex items-center gap-3">
          <span className="h-[5px] flex-1 border-y border-foreground" />
          <span className="text-(--brass) text-[0.7rem]">✦</span>
          <span className="h-[5px] flex-1 border-y border-foreground" />
        </div>
        <div className="flex flex-col items-center gap-4 pt-12 text-center sm:pt-14">
          <Mark className="size-10" />
          <Wordmark className="text-[1.5rem] sm:text-[1.75rem]" />
          <p className="label text-muted-foreground">
            {ADDRESS.line1} · {ADDRESS.line2} · {PHONE_DISPLAY}
          </p>
          <p className="max-w-[44ch] font-heading text-base italic text-muted-foreground">
            Kept by Mara &amp; Tomas since 2009. Roasted in the back, poured up front.
          </p>
          <p className="label mt-2 flex gap-6">
            {LINKS.map((link) => (
              <a key={link.label} href={link.href} className="transition-colors hover:text-(--brass)">
                {link.label}
              </a>
            ))}
          </p>
          <p className="label mt-6 text-muted-foreground">
            Set in Old Standard, Libre Franklin and Kaffeesatz · © MMXXVI {BRAND} Coffee House
          </p>
        </div>
      </Shell>
    </footer>
  );
}
