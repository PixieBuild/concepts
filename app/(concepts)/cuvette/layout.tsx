import type { Metadata, Viewport } from "next";
import { Fragment_Mono, Mona_Sans } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Toaster } from "@/components/ui/sonner";
import { BagProvider } from "./_components/bag/bag-provider";
import { BagSheet } from "./_components/bag/bag-sheet";
import { CatalogProvider } from "./_components/catalog-provider";
import { catalogCards, listProducts } from "./_lib/catalog";
import { BRAND } from "./_lib/content";
import { isSet } from "./_lib/product";
import { jsonLd, siteGraph } from "./_lib/schema";
import { SITE_URL, path, url } from "./site";

const sans = Mona_Sans({ variable: "--font-sans", subsets: ["latin"], axes: ["wdth"] });
const mono = Fragment_Mono({ variable: "--font-mono", subsets: ["latin"], weight: "400" });

const title = "Cuvette — Clinical serums at a stated strength, filled in Porto";

/** Names the serums the shop sells, so the description never goes stale when one is added. */
function describeShop(): string {
  const titles = listProducts().filter((p) => !isSet(p)).map((p) => p.title);
  const list = titles.length > 1 ? `${titles.slice(0, -1).join(", ")} and ${titles.at(-1)}` : (titles[0] ?? "");
  return `Clinical serums, one lead active each${list ? `: ${list}` : ""}. Fragrance-free, dated and numbered by lot, filled in Porto.`;
}

export function generateMetadata(): Metadata {
  const description = describeShop();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${BRAND}` },
    description,
    applicationName: BRAND,
    alternates: { canonical: path() },
    openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title, description, url: url() },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true, "max-image-preview": "large" },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0e0f10",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function CuvetteLayout({ children }: LayoutProps<"/cuvette">) {
  const products = catalogCards();
  const description = describeShop();
  return (
    <html lang="en" className={`theme-cuvette ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteGraph(description)) }} />
        <SmoothScroll lerp={0.1} />
        <CatalogProvider products={products}>
          <BagProvider>
            {children}
            <BagSheet />
          </BagProvider>
        </CatalogProvider>
        <Toaster theme="light" position="bottom-left" />
        <BuiltBy />
      </body>
    </html>
  );
}
