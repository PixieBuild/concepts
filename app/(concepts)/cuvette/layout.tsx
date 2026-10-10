import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SITE_URL, path, url } from "./site";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const display = Instrument_Serif({ variable: "--font-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

const title = "Cuvette — One active, at the strength that works";
const description =
  "Cuvette makes three clinical serums — Vitamin C 15%, Hyaluronic 2% and Niacinamide 10% — each built around one active at a stated strength, fragrance-free, in recyclable glass. Formulated and filled in Porto.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: ["vitamin C serum", "hyaluronic acid serum", "niacinamide serum", "clinical skincare", "fragrance-free skincare"],
  applicationName: "Cuvette",
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: "Cuvette", locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  // Draft: kept out of search until the concept ships. Flip when status goes "ready".
  robots: { index: false, follow: false },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Brand",
  "@id": url(),
  name: "Cuvette",
  description,
  url: url(),
};

export default function CuvetteLayout({ children }: LayoutProps<"/cuvette">) {
  return (
    <html lang="en" className={`theme-cuvette ${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SmoothScroll lerp={0.1} />
        <main className="flex-1">{children}</main>
        <div aria-hidden className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.03]" />
        <BuiltBy />
      </body>
    </html>
  );
}
