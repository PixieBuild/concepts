import type { Metadata, ResolvingMetadata } from "next";

import { GalleryGrid } from "./_components/gallery-grid";
import { PageOpener, Shell } from "@/app/(concepts)/casa-lume/_components/section";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";
import { path, url } from "@/app/(concepts)/casa-lume/site";

const description =
  "The house, the terraces, the water and the table — Casa Lume in pictures.";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return {
  title: "Gallery",
  description,
  alternates: { canonical: path("/gallery") },
  openGraph: {
    images: (await parent).openGraph?.images ?? [],
    title: "Casa Lume in pictures",
    description,
    url: url("/gallery"),
  },
  };
}

export default function GalleryPage() {
  return (
    <>
      <PageOpener
        eyebrow="Gallery"
        title="The house, in pictures."
        intro="One evening in late June, from the last of the sun on the terraces to the lights coming on across the water."
        photo={{ src: `${IMAGE_BASE}/evening/house-terraces.webp`, alt: "The house seen from the olive terraces" }}
      />

      <div className="py-20 sm:py-28 lg:py-32">
        <Shell>
          <GalleryGrid />
        </Shell>
      </div>
    </>
  );
}
