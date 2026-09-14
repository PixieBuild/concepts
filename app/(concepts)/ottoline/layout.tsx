import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, Pinyon_Script } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { BRAND, CITY } from "./_lib/content";
import { SITE_URL, path, url } from "./site";

const display = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const script = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const title = "Ottoline — Parfumeur, Grasse";
const description =
  "Ottoline composes perfumes in Grasse the slow way: a single nose, small batches, and formulas kept in a ledger since 1962.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: ["perfumer", "Grasse perfume", "niche fragrance", "artisan parfum", "eau de parfum"],
  applicationName: BRAND,
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: BRAND, locale: "en_US", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": url(),
  name: BRAND,
  description,
  url: url(),
  address: { "@type": "PostalAddress", addressLocality: CITY, addressCountry: "FR" },
};

export default function OttolineLayout({ children }: LayoutProps<"/ottoline">) {
  return (
    <html lang="en" className={`theme-ottoline ${display.variable} ${script.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="flex-1">{children}</main>
        <BuiltBy />
      </body>
    </html>
  );
}
