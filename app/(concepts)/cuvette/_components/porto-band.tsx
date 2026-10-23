import Image from "next/image";
import Link from "next/link";

import { COMPANY, GLASS_RETURN } from "../_lib/content";
import { formatDate, priceShort } from "../_lib/format";
import { priceOf, type ProductCard } from "../_lib/product";
import { LotPlate } from "./home/lot-plate";

const WORDS: Record<number, string> = { 3: "three", 4: "four", 5: "five", 6: "six" };
const subject = encodeURIComponent("A return envelope, please");
const body = encodeURIComponent(`Name:\nDelivery address:\nHow many empties (up to ${GLASS_RETURN.perEnvelope} per envelope):\n`);

/** `product` is the catalogue's pick for the "lot" slot (`features`): its lot and fill date are quoted. */
export function PortoBand({ photo = null, product }: { photo?: string | null; product: ProductCard }) {
  const empties = WORDS[GLASS_RETURN.perEnvelope] ?? GLASS_RETURN.perEnvelope;
  return (
    <section
      id="porto"
      aria-labelledby="porto-title"
      className="scroll-mt-14 border-t border-border md:grid md:h-[min(50vw,92svh)] md:min-h-136 md:grid-cols-12 md:overflow-hidden"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-[#0c0d0e] md:col-span-7 md:aspect-auto lg:col-span-6">
        {photo ? (
          <Image src={photo} alt="A gloved hand writing a lot number on a glass vial at the filling bench in Porto" fill sizes="(min-width: 1024px) 50vw, (min-width: 768px) 58vw, 100vw" className="object-cover object-[50%_38%]" />
        ) : (
          <LotPlate product={product} />
        )}
      </div>
      <div className="px-(--gutter) pt-8 pb-20 md:col-span-5 md:flex md:items-center md:py-16 lg:col-span-6 xl:justify-center">
        <div className="max-w-120 2xl:max-w-136">
          <p className="label text-muted-foreground">
            <span className="whitespace-nowrap">Lot {product.lot.code}</span>
            <span className="md:max-lg:hidden"> · </span>
            <span className="whitespace-nowrap md:max-lg:block">filled {formatDate(product.lot.filled)} in Porto</span>
          </p>
          <h2 id="porto-title" className="heading mt-4 max-w-[14ch]">
            Dated on the glass. <span className="text-muted-foreground">The glass comes back.</span>
          </h2>
          <p className="mt-5 max-w-[40ch] text-foreground/80 lg:text-[1.05rem]">
            Every bottle carries its lot and fill day. Post {empties} empties back in one prepaid envelope and take {priceShort(GLASS_RETURN.credit)} off
            your next order.
          </p>
          <p className="mt-6 flex flex-wrap gap-x-8 lg:mt-8">
            <a href={`mailto:${COMPANY.email}?subject=${subject}&body=${body}`} className="link inline-flex min-h-11 items-center">
              Ask for an envelope
            </a>
            <Link href={`/cuvette/${product.slug}#costs`} className="link inline-flex min-h-11 items-center">
              What {priceShort(priceOf(product))} pays for
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
