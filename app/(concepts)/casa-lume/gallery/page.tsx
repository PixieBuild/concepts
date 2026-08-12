import type { Metadata } from "next";

import { GalleryGrid } from "./_components/gallery-grid";
import { PageHero, Shell } from "@/app/(concepts)/casa-lume/_components/section";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";
import { path, url } from "@/app/(concepts)/casa-lume/site";

const description =
  "The house, the terraces, the water and the table — Casa Lume in pictures.";

export const metadata: Metadata = {
  title: "Gallery",
  description,
  alternates: { canonical: path("/gallery") },
  openGraph: {
    title: "Casa Lume in pictures",
    description,
    url: url("/gallery"),
  },
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="The house, in pictures."
        intro="Photographed across one week in late June, from first light on the terrace to the last table clearing at midnight."
        photo={{ src: `${IMAGE_BASE}/house-terraces.webp`, alt: "The house seen from the olive terraces" }}
      />

      <div className="py-20 sm:py-28 lg:py-32">
        <Shell>
          <GalleryGrid />
        </Shell>
      </div>
    </>
  );
}
