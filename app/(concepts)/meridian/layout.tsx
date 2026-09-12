import type { Metadata } from "next";
import { Archivo } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { ADDRESS } from "./_lib/constants";
import { SITE_URL, path, url } from "./site";

const body = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const name = "Meridian Grooming Lounge";
const title = "Meridian — Men's Grooming Lounge";
const description =
  "Traditional barbering, done sharp. Skin fades, hot-towel shaves and beard work by a bench of career barbers in downtown Chicago. Book a chair online.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: [
    "barber shop",
    "men's haircut",
    "skin fade",
    "hot towel shave",
    "beard trim",
    "straight razor shave",
    "Chicago barber",
    "book a barber online",
    "grooming lounge",
  ],
  applicationName: name,
  alternates: { canonical: path() },
  openGraph: {
    type: "website",
    siteName: name,
    locale: "en_US",
    title,
    description,
    url: url(),
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "@id": url(),
  name,
  description,
  url: url(),
  image: url("/opengraph-image"),
  telephone: "+1-312-555-7890",
  priceRange: "$$",
  currenciesAccepted: "USD",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.line1,
    addressLocality: "Chicago",
    addressRegion: "IL",
    postalCode: "60654",
    addressCountry: "US",
  },
  areaServed: "Chicago, IL",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "19:00",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "17:00" },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "1200",
    bestRating: "5",
  },
};

export default function MeridianLayout({
  children,
}: LayoutProps<"/meridian">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`theme-meridian ${body.variable} h-full antialiased`}
    >
      <body
        id="top"
        className="flex min-h-full flex-col bg-background font-sans text-foreground"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <BuiltBy />
      </body>
    </html>
  );
}
