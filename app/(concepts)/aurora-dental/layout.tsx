import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import "@/app/globals.css";
import "./theme.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SITE_URL, path, url } from "./site";

const body = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Aurora Dental — Gentle, modern dentistry",
    template: "%s | Aurora Dental",
  },
  description:
    "A calm dental practice built around comfort. Same-week appointments, transparent pricing, and a team that explains everything before it happens.",
  keywords: ["dentist", "dental clinic", "teeth cleaning", "invisible braces"],
  applicationName: "Aurora Dental",
  alternates: { canonical: path() },
  openGraph: {
    type: "website",
    siteName: "Aurora Dental",
    title: "Aurora Dental — Gentle, modern dentistry",
    description:
      "Same-week appointments, transparent pricing, and sedation options for anxious patients.",
    url: url(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurora Dental — Gentle, modern dentistry",
    description:
      "Same-week appointments, transparent pricing, and sedation options for anxious patients.",
  },
  robots: { index: true, follow: true },
};

export default function AuroraDentalLayout({
  children,
}: LayoutProps<"/aurora-dental">) {
  return (
    <html
      lang="en"
      className={`theme-aurora-dental ${body.variable} ${heading.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme:aurora-dental"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
