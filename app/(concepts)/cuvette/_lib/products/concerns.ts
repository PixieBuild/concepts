/** The skin concerns the shop filters and the routine builder offer, in this order. */
export const CONCERNS = ["Dull or marked", "Tight or dehydrated", "Red or oily", "Texture or fine lines"] as const;

export type ConcernLabel = (typeof CONCERNS)[number];
