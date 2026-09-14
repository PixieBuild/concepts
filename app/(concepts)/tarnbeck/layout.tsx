import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { BRAND } from "./_lib/content";
import { SITE_URL, path, url } from "./site";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], axes: ["wdth", "opsz"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

const title = "Tarnbeck — Pocket watches made in Kendal since 1898";
const description =
  "Tarnbeck makes hand-wound pocket watches in Kendal, Cumbria, a few hundred a year, each finished by one watchmaker from case to crown.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: ["pocket watch", "hand-wound watch", "English watchmaker", "Kendal", "rose gold watch"],
  applicationName: BRAND,
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

const jsonLd = { "@context": "https://schema.org", "@type": "Organization", "@id": url(), name: BRAND, description, url: url() };

export default function TarnbeckLayout({ children }: LayoutProps<"/tarnbeck">) {
  return (
    <html lang="en" className={`theme-tarnbeck ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="flex-1">{children}</main>
        <BuiltBy />
      </body>
    </html>
  );
}
