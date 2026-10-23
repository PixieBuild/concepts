import type { ProductCard } from "../../_lib/product";

const PAPER = `:is(.paper, [data-slot="sheet-content"], [data-slot="dialog-content"], [data-slot="popover-content"], [data-slot="select-content"], [data-sonner-toast])`;

// Each product brings its own ink (`colour.band`, `colour.onPaper`), with the paper switch.
export function ProductInks({ products }: { products: ProductCard[] }) {
  if (!products.length) return null;
  const css = products
    .map(({ colour: { cssVar, band, onPaper } }) =>
      [
        `.theme-cuvette { ${cssVar}-band: ${band}; ${cssVar}: var(${cssVar}-band); }`,
        `.theme-cuvette ${PAPER} { ${cssVar}: ${onPaper}; }`,
        `.theme-cuvette .darkroom { ${cssVar}: var(${cssVar}-band); }`,
      ].join("\n"),
    )
    .join("\n");
  return (
    <style href="cuvette-product-inks" precedence="default">
      {css}
    </style>
  );
}
