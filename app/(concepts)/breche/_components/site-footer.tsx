import { BRAND, COMPANY, ELEVATION_CREDIT } from "../_lib/content";
import { AnchorLink } from "./anchor-link";

export function SiteFooter({ year, shell }: { year: number; shell: string }) {
  return (
    <footer className="bg-(--ink) pb-[calc(3.5rem+env(safe-area-inset-bottom)+1.5rem)] text-(--snow) md:[@media(min-height:501px)]:pb-8">
      <div className={`${shell} flex flex-wrap items-center justify-between gap-x-10 gap-y-3 border-t border-(--snow)/15 pt-5`}>
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <AnchorLink href="#top" className="wordmark -mx-2 inline-flex min-h-11 items-center px-2">
            {BRAND}
          </AnchorLink>
          <span className="label text-(--snow)/60">
            © {year} <span lang="fr">{COMPANY.legal}</span>
          </span>
        </p>
        <p className="label max-w-[60ch] text-(--snow)/50 sm:pr-16">{ELEVATION_CREDIT}</p>
      </div>
    </footer>
  );
}
