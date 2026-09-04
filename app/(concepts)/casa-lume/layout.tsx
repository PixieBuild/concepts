import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { BuiltBy } from "@/components/built-by";
import { SmoothScroll } from "@/components/smooth-scroll";
import { MobileBookBar } from "./_components/mobile-book-bar";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { SITE_URL, path, url } from "./site";

const body = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const heading = Cormorant_Garamond({
  variable: "--font-display",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const description =
  "A seventeen-room house above the Ligurian sea. Slow mornings, long lunches, and a coastline that asks nothing of you.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Casa Lume — A boutique hotel on the Ligurian coast",
    template: "%s | Casa Lume",
  },
  description,
  keywords: [
    "boutique hotel Liguria",
    "luxury hotel Italian Riviera",
    "Mediterranean hotel",
    "Cinque Terre luxury stay",
  ],
  applicationName: "Casa Lume",
  alternates: { canonical: path() },
  openGraph: {
    type: "website",
    siteName: "Casa Lume",
    locale: "en_GB",
    title: "Casa Lume — A boutique hotel on the Ligurian coast",
    description,
    url: url(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa Lume — A boutique hotel on the Ligurian coast",
    description,
  },
  robots: { index: true, follow: true },
};

export default function CasaLumeLayout({
  children,
}: LayoutProps<"/casa-lume">) {
  return (
    <html
      lang="en"
      className={`theme-casa-lume ${body.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <SmoothScroll />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileBookBar />
        <BuiltBy />
      </body>
    </html>
  );
}
