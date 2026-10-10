import type { Metadata } from "next";
import { Big_Shoulders, Geist_Mono } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { BRAND } from "./_lib/content";
import { SITE_URL, path, url } from "./site";

const display = Big_Shoulders({ variable: "--font-display", subsets: ["latin"], adjustFontFallback: false });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

const title = "Heft — Strength classes in Leeds, first week free";
const description =
  "Heft is a strength and conditioning gym on Kirkstall Road, Leeds: classes of twelve, coaches on the floor all day, no contracts, and your first week free.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: ["gym Leeds", "strength classes Leeds", "small group training", "no contract gym", "Kirkstall Road gym"],
  applicationName: BRAND,
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  // Draft: kept out of search until the concept ships. Flip when status goes "ready".
  robots: { index: false, follow: false },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ExerciseGym",
  "@id": url(),
  name: BRAND,
  description,
  url: url(),
  address: { "@type": "PostalAddress", streetAddress: "Kirkstall Road", addressLocality: "Leeds", addressCountry: "GB" },
  openingHours: "Mo-Su 05:30-22:00",
};

export default function HeftLayout({ children }: LayoutProps<"/heft">) {
  return (
    <html lang="en" className={`theme-heft ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-mono text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="flex-1">{children}</main>
        <BuiltBy />
      </body>
    </html>
  );
}
