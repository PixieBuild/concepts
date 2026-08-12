import Link from "next/link";

import { Logo } from "./logo";
import { path } from "@/app/(concepts)/casa-lume/site";

const SITEMAP = [
  {
    heading: "Stay",
    links: [
      { href: "/rooms", label: "Rooms & suites" },
      { href: "/booking", label: "Book a stay" },
      { href: "/gallery", label: "Gallery" },
    ],
  },
  {
    heading: "The house",
    links: [
      { href: "/dining", label: "Dining" },
      { href: "/experiences", label: "Experiences" },
      { href: "/location", label: "Location" },
    ],
  },
];

const SOCIAL = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://pinterest.com", label: "Pinterest" },
  { href: "https://journal.example.com", label: "Newsletter" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto w-full max-w-[100rem] px-5 pt-16 pb-28 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-10">
          <div>
            <Logo showLocation />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A seventeen-room house above the Ligurian sea, open from April to
              early November.
            </p>
          </div>

          {SITEMAP.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <p className="eyebrow text-muted-foreground">{group.heading}</p>
              <ul className="mt-5 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={path(link.href)}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="eyebrow text-muted-foreground">Contact</p>
            <address className="mt-5 flex flex-col gap-3 text-sm not-italic text-foreground/80">
              <span>
                Via delle Terrazze 4<br />
                19016 Monterosso al Mare SP
                <br />
                Liguria, Italy
              </span>
              <a
                href="tel:+390187900142"
                className="transition-colors hover:text-primary"
              >
                +39 0187 900 142
              </a>
              <a
                href="mailto:stay@casalume.it"
                className="transition-colors hover:text-primary"
              >
                stay@casalume.it
              </a>
            </address>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {SOCIAL.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/70 transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border/70 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Casa Lume. All rights reserved.</p>
          <p>A concept property. Photography to follow.</p>
        </div>
      </div>
    </footer>
  );
}
