import Image from "next/image";

import { ConceptBrowser } from "./_components/concept-browser";
import { getConcepts, getUsedCategories } from "@/lib/concepts";

export default function GalleryPage() {
  const concepts = getConcepts();
  const categories = getUsedCategories();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 lg:px-10 lg:py-16">
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Internal — not for public sharing
        </p>
        <div className="flex items-center gap-3">
          <Image
            src="/logo-mark.png"
            alt=""
            width={205}
            height={240}
            priority
            className="h-10 w-auto"
          />
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Concept websites
          </h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Every sample site we can show a client. Filter by industry or search
          for a style, then send the concept&apos;s own link — it opens as a
          standalone website with its own branding.
        </p>
      </header>

      <ConceptBrowser concepts={concepts} categories={categories} />
    </main>
  );
}
