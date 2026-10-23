import { hyaluronic } from "./hyaluronic";
import { morningSet } from "./morning-set";
import { niacinamide } from "./niacinamide";
import { retinal } from "./retinal";
import type { ProductData } from "./types";
import { vitaminC } from "./vitamin-c";

export { CONCERNS } from "./concerns";
export type { ProductData, SerumData, SetData } from "./types";

/** The range in the order every list shows it. */
export const PRODUCTS: ProductData[] = [vitaminC, hyaluronic, niacinamide, retinal, morningSet];
