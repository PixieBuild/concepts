import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { BRAND } from "./_lib/content";
import { SITE_URL, path, url } from "./site";

const body = Archivo({ variable: "--font-sans", subsets: ["latin"], axes: ["wdth"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

const title = "Skerry — Design studio for things that have to last";
const description =
  "Skerry is an eleven-person design studio in Leith and Lisbon making brand, product and film for founders building for the long weather.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: ["design studio", "brand design", "product design", "Edinburgh design agency", "Lisbon design studio"],
  applicationName: BRAND,
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

const jsonLd = { "@context": "https://schema.org", "@type": "Organization", "@id": url(), name: BRAND, description, url: url() };

export default function SkerryLayout({ children }: LayoutProps<"/skerry">) {
  return (
    <html lang="en" className={`theme-skerry ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="flex-1">{children}</main>
        <BuiltBy />
      </body>
    </html>
  );
}
