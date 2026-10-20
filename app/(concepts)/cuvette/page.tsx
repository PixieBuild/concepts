import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import { LabelChart } from "./_components/home/label-chart";
import { photoSrc } from "./_components/home/photos";
import { Routine } from "./_components/home/routine";
import { Voices } from "./_components/home/voices";
import { PortoBand } from "./_components/porto-band";
import { Range } from "./_components/range";
import { Stage } from "./_components/stage";
import { bundles, concerns, featuredProduct, featuredProducts, heroProducts, listProducts, routineProducts } from "./_lib/catalog";
import type { SetCard } from "./_lib/client-catalog";
import { INCI_ROLES } from "./_lib/content";
import { isSet, toCard, type Product } from "./_lib/product";
import { itemList, jsonLd } from "./_lib/schema";

const RANGE_TEASER = 6;

const rolesFor = (p: Product): Record<string, string> => ({
  ...Object.fromEntries(p.inci.filter((name) => name in INCI_ROLES).map((name) => [name, INCI_ROLES[name]])),
  ...p.inciRoles,
});

const photosFor = (products: Product[], suffix: string) => Object.fromEntries(products.map((p) => [p.slug, photoSrc(`${p.slug}-${suffix}.jpg`)]));

export default async function CuvettePage() {
  const [products, hero, routine, sets, concernList, chart, lot] = await Promise.all([
    listProducts(),
    heroProducts(),
    routineProducts(),
    bundles(),
    concerns(),
    featuredProducts("label-chart"),
    featuredProduct("lot", (p) => !isSet(p) && p.looks.length > 0),
  ]);
  const cards = products.map(toCard);
  const serums = products.filter((p) => !isSet(p));
  const reviews = products.flatMap((p) => p.reviews.map((review) => ({ review, slug: p.slug })));
  const charted = chart.filter((p) => p.inci.length);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemList(products)) }} />
      <Header variant="overlay" />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {hero.length > 0 && <Stage products={hero.map((p) => ({ ...toCard(p), howTo: p.howTo, study: p.study }))} />}
        <Range products={cards.slice(0, RANGE_TEASER)} />
        {routine.length > 0 && (
          <Routine
            products={routine.map(toCard)}
            concerns={concernList.filter((c) => c.products.some((slug) => routine.some((p) => p.slug === slug))).map(({ id, label }) => ({ id, label }))}
            sets={sets.map((set) => toCard(set) as SetCard)}
            photos={photosFor(routine, "fingertips")}
          />
        )}
        {charted.length > 0 && <LabelChart products={charted.map((p) => ({ ...toCard(p), inciLead: p.inciLead, roles: rolesFor(p) }))} />}
        <Voices reviews={reviews} products={cards} photos={photosFor(serums, "skin")} />
        {lot && <PortoBand product={toCard(lot)} photo={photoSrc("porto-bench.jpg")} />}
      </main>
      <Footer />
    </>
  );
}
