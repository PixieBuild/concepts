import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SmoothScroll } from "@/components/smooth-scroll";
import { BRAND, COMPANY, IMAGE_BASE, OBJECTIVES, SLOTS } from "./_lib/content";
import { price } from "./_lib/format";
import { SITE_URL, path, url } from "./site";

const sans = Archivo({ variable: "--font-sans", subsets: ["latin"], axes: ["wdth"] });

const title = "Brèche — Mountain guides, Chamonix";
const description =
  "Twelve IFMGA guides in Chamonix. Alpine climbs, ice and ski tours on the Mont Blanc massif, fixed small ratios, every day decided the evening before.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: `%s · ${BRAND}` },
  description,
  applicationName: BRAND,
  category: "travel",
  alternates: { canonical: path() },
  openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title, description, url: url() },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1724",
  viewportFit: "cover",
};

const prices = OBJECTIVES.map((objective) => objective.price);
const image = (file: string) => `${SITE_URL}${IMAGE_BASE}/${file}`;

const business = {
  "@type": ["SportsActivityLocation", "TravelAgency"],
  "@id": url("#business"),
  name: COMPANY.legal,
  alternateName: BRAND,
  description,
  url: url(),
  logo: { "@type": "ImageObject", url: image("logo.png"), width: 512, height: 512 },
  image: [image("og-summit.jpg"), image(SLOTS.office.src)],
  telephone: COMPANY.phone,
  email: COMPANY.email,
  foundingDate: String(COMPANY.founded),
  priceRange: `${price(Math.min(...prices))}–${price(Math.max(...prices))} per person`,
  currenciesAccepted: "EUR",
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.street,
    addressLocality: "Chamonix-Mont-Blanc",
    addressRegion: "Haute-Savoie",
    postalCode: "74400",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: COMPANY.geo.lat,
    longitude: COMPANY.geo.lon,
    elevation: COMPANY.geo.altitude,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: COMPANY.hours.opens,
    closes: COMPANY.hours.closes,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "reservations",
    telephone: COMPANY.phone,
    email: COMPANY.email,
    availableLanguage: ["English", "French"],
  },
  areaServed: { "@type": "Place", name: "Mont Blanc massif" },
  knowsLanguage: ["en", "fr"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Guided objectives",
    itemListElement: OBJECTIVES.map((objective) => ({
      "@type": "Offer",
      name: objective.name,
      description: objective.brief,
      url: url("#objectives"),
      image: image(objective.slot.src),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        minPrice: objective.price,
        priceCurrency: "EUR",
        unitText: objective.basis,
      },
      itemOffered: {
        "@type": "TouristTrip",
        name: objective.name.includes(objective.massif) ? objective.name : `${objective.name}, ${objective.massif}`,
        description: `${objective.discipline}, graded ${objective.cotation}, ${objective.days} ${objective.days === 1 ? "day" : "days"}. ${objective.season}.`,
        provider: { "@id": url("#business") },
      },
    })),
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": url("#website"),
      url: url(),
      name: BRAND,
      inLanguage: "en-GB",
      publisher: { "@id": url("#business") },
    },
    business,
  ],
};

export default function BrecheLayout({ children }: LayoutProps<"/breche">) {
  return (
    <html lang="en-GB" className={`theme-breche ${sans.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-clip bg-background font-sans text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <SmoothScroll lerp={0.1} />
        {children}
        <BuiltBy />
      </body>
    </html>
  );
}
