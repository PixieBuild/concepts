import type { Metadata } from "next";
import { Anton, Instrument_Serif, Inter_Tight } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SmoothScroll } from "@/components/smooth-scroll";
import { BRAND } from "./_lib/content";
import { SITE_URL, path, url } from "./site";

const body = Inter_Tight({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const display = Anton({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

const title = "Saltmarsh — Nine houses on the Suffolk shore";
const description =
  "Saltmarsh is a development of nine timber houses on the marsh at Blythburgh, Suffolk, each with the estuary in every window. Completion spring 2027.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: ["Suffolk new homes", "coastal houses", "Blythburgh", "architect-designed homes", "marsh houses"],
  applicationName: BRAND,
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "@id": url(),
  name: BRAND,
  description,
  url: url(),
};

export default function SaltmarshLayout({ children }: LayoutProps<"/saltmarsh">) {
  return (
    <html lang="en" className={`theme-saltmarsh ${body.variable} ${display.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SmoothScroll lerp={0.12} />
        <main className="flex-1">{children}</main>
        <BuiltBy />
      </body>
    </html>
  );
}
