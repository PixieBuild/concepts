import type { Metadata } from "next";
import { Funnel_Display, Funnel_Sans } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SITE_URL, path, url } from "./site";

const sans = Funnel_Sans({ variable: "--font-sans", subsets: ["latin"] });
const display = Funnel_Display({ variable: "--font-display", subsets: ["latin"] });

const title = "Stängel — Flower studio, Neukölln";
const description =
  "Stängel is a flower studio on Weserstraße in Berlin-Neukölln selling single stems and hand-tied bunches bought at the Großmarkt each morning, with wedding flowers and evening workshops.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: ["Berlin florist", "Neukölln flower shop", "Blumenladen Berlin", "wedding flowers Berlin", "flower workshop Berlin"],
  applicationName: "Stängel",
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: "Stängel", locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  // Draft: kept out of search until the concept ships. Flip when status goes "ready".
  robots: { index: false, follow: false },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Florist",
  "@id": url(),
  name: "Stängel",
  description,
  url: url(),
  address: { "@type": "PostalAddress", streetAddress: "Weserstraße 38", addressLocality: "Berlin", postalCode: "12045", addressCountry: "DE" },
};

export default function StaengelLayout({ children }: LayoutProps<"/staengel">) {
  return (
    <html lang="en" className={`theme-staengel ${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="flex-1">{children}</main>
        <BuiltBy />
      </body>
    </html>
  );
}
