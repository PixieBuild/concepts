import type { Photo, Product, RoutineMeta, Slug } from "../product";
import type { ConcernLabel } from "./concerns";

type Authored = Pick<
  Product,
  | "slug"
  | "title"
  | "name"
  | "seoTitle"
  | "code"
  | "type"
  | "tags"
  | "updatedAt"
  | "sizes"
  | "available"
  | "subscribe"
  | "descriptor"
  | "benefit"
  | "job"
  | "jobs"
  | "keywords"
  | "texture"
  | "dose"
  | "when"
  | "actives"
  | "gallery"
  | "howTo"
  | "study"
  | "costs"
  | "endOfLife"
  | "histogram"
  | "reviews"
> &
  Partial<Pick<Product, "storage" | "formulaNote" | "next" | "inciLead" | "inciRoles">> & {
    concerns: ConcernLabel[];
    compareAt?: number;
    features?: string[];
    /** Shown after the bottle shots, first one leading search and share cards. */
    photos?: Photo[];
    /** Place in the home stage's switcher; leave it out to keep the product off the stage. */
    hero?: number;
    routine?: RoutineMeta;
  };

/** A single serum: its label and serum colour are all the bottle compositor needs. */
export type SerumData = Authored &
  Pick<Product, "strength" | "lead" | "ph" | "pao" | "lot" | "inci"> & {
    /** `accent` prints the label band and the product's text on dark; `liquid` tints the serum, deepening with `density`. */
    colour: { accent: string; onPaper: string; liquid: string; density: number };
  };

/** A set takes its strength, pH, lot, colour and bottles from the serums it contains, in the order you use them. */
export type SetData = Authored & { contains: [Slug, ...Slug[]] };

export type ProductData = SerumData | SetData;
