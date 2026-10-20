import type { Metadata } from "next";
import { notFound } from "next/navigation";

// A page's metadata resolves before notFound() throws, so a nested 404 would otherwise inherit the home page's.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function Missing() {
  notFound();
}
