"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addToBag, unitPriceOf, type Purchase } from "../_lib/cart";
import { price } from "../_lib/format";
import type { Slug } from "../_lib/product";
import { useProduct } from "./catalog-provider";

type Props = {
  slug: Slug;
  purchase?: Purchase;
  label?: ReactNode;
  /** Needed when `label` is visual only, such as a "+". */
  "aria-label"?: string;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
};

export function AddToBag({ slug, purchase = "once", label, className, variant = "default", size = "lg", ...rest }: Props) {
  const product = useProduct(slug);
  if (!product) return null;
  const cents = unitPriceOf(product, purchase);
  const plan = purchase === "subscribe" ? `, every ${product.subscribe.weeks} weeks` : "";
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("h-12 px-5 text-[0.95rem] font-normal", className)}
      disabled={!product.available}
      aria-label={rest["aria-label"] ?? `Add ${product.title}${plan} to bag, ${price(cents)}`}
      onClick={() => addToBag(slug, purchase)}
    >
      {product.available ? (label ?? `Add to bag — ${price(cents)}`) : "Sold out"}
    </Button>
  );
}
