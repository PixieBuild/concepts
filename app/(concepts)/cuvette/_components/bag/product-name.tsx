import { cn } from "@/lib/utils";
import { isSet, type ProductCard } from "../../_lib/product";

/** "Vitamin C 15%" with the strength in the product's ink; a set, or a product with no strength, reads as its name. */
export function ProductName({ product, className }: { product: Pick<ProductCard, "title" | "name" | "strength" | "colour" | "contains" | "separately">; className?: string }) {
  if (isSet(product) || !product.strength) return <span className={cn("product-name", className)}>{product.title}</span>;
  return (
    <span className={cn("product-name", className)}>
      {product.name} <span style={{ color: `var(${product.colour.cssVar})` }}>{product.strength}</span>
    </span>
  );
}
