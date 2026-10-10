import type { Metadata } from "next";
import { Archivo } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SmoothScroll } from "@/components/smooth-scroll";
import { BRAND, COMPANY } from "./_lib/content";
import { SITE_URL, path, url } from "./site";

const sans = Archivo({ variable: "--font-sans", subsets: ["latin"], axes: ["wdth"] });

const title = "Brèche — Mountain guides, Chamonix";
const description =
  "Twelve IFMGA guides in Chamonix. Alpine climbs, glacier days and ski tours on the Mont Blanc massif, two climbers to a guide, with the day decided the evening before on conditions.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: [
    "Chamonix mountain guide",
    "Mont Blanc guided climb",
    "IFMGA guide Chamonix",
    "Vallée Blanche guide",
    "Haute Route ski tour",
    "Cosmiques Arête guided",
  ],
  applicationName: BRAND,
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": url(),
  name: COMPANY.legal,
  alternateName: BRAND,
  description,
  url: url(),
  telephone: COMPANY.phone,
  email: COMPANY.email,
  foundingDate: String(COMPANY.founded),
  priceRange: "€€€",
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.street,
    addressLocality: "Chamonix-Mont-Blanc",
    postalCode: "74400",
    addressCountry: "FR",
  },
  areaServed: { "@type": "Place", name: "Mont Blanc massif" },
  knowsLanguage: ["en", "fr"],
};

export default function BrecheLayout({ children }: LayoutProps<"/breche">) {
  return (
    <html lang="en" className={`theme-breche ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SmoothScroll lerp={0.1} />
        <main className="flex-1">{children}</main>
        <BuiltBy />
      </body>
    </html>
  );
}
