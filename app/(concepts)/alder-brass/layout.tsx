import type { Metadata } from "next";
import { Caveat, Libre_Franklin, Old_Standard_TT, Yanone_Kaffeesatz } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Newspaper } from "./_components/newspaper";
import { ADDRESS, BRAND, EMAIL } from "./_lib/content";
import { SITE_URL, path, url } from "./site";

const body = Libre_Franklin({
  variable: "--font-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const display = Old_Standard_TT({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

// Two more voices, each with one job: printed-sheet titles, and pencil notes.
const poster = Yanone_Kaffeesatz({
  variable: "--font-poster",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const title = "Alder & Brass — Coffee house and roastery, Portland";
const description =
  "A coffee house on Alder Street, Portland, since 2009. Small lots roasted twelve kilos at a time on a cast-iron drum, poured by hand, in a room built for slow mornings.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: [
    "coffee shop Portland",
    "coffee roaster Portland",
    "specialty coffee",
    "pour over coffee",
    "cold brew",
    "vintage coffee house",
    "Alder Street cafe",
  ],
  applicationName: BRAND,
  alternates: { canonical: path() },
  openGraph: {
    type: "website",
    siteName: BRAND,
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
  "@type": "CafeOrCoffeeShop",
  "@id": url(),
  name: BRAND,
  description,
  url: url(),
  image: url("/opengraph-image"),
  telephone: "+1-503-555-0142",
  email: EMAIL,
  priceRange: "$$",
  servesCuisine: "Coffee & Pastries",
  currenciesAccepted: "USD",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.line1,
    addressLocality: "Portland",
    addressRegion: "OR",
    postalCode: "97204",
    addressCountry: "US",
  },
  areaServed: "Portland, OR",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "18:00",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "08:00", closes: "15:00" },
  ],
};

export default function AlderBrassLayout({
  children,
}: LayoutProps<"/alder-brass">) {
  return (
    <html
      lang="en"
      className={`theme-alder-brass ${body.variable} ${display.variable} ${poster.variable} ${hand.variable} h-full antialiased`}
    >
      <body
        id="top"
        className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SmoothScroll lerp={0.2} />
        <Newspaper>
          <main className="flex-1">{children}</main>
        </Newspaper>
        <BuiltBy />
      </body>
    </html>
  );
}
