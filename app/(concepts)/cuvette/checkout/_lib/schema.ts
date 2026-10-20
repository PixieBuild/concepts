import { z } from "zod";

import { COUNTRIES, type Country } from "../../_lib/delivery";

export const COUNTRY_CODES = Object.keys(COUNTRIES) as [Country, ...Country[]];

export const contactSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").pipe(z.email("Enter a full email address, like ana@example.com.")),
  optIn: z.boolean(),
});

export type Contact = z.output<typeof contactSchema>;

/** Portuguese codes typed without the hyphen ("4050123") are accepted and stored as "4050-123". */
function normalisePostcode(country: Country, value: string): string {
  const v = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (country === "PT" && /^\d{7}$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4)}`;
  return v;
}

/** Built per country, so the postcode rule always matches the selected country. */
export function deliverySchema(country: Country) {
  const { postcode, name } = COUNTRIES[country];
  return z.object({
    firstName: z.string().trim().min(1, "Enter your first name.").max(60),
    lastName: z.string().trim().min(1, "Enter your last name.").max(60),
    line1: z.string().trim().min(1, "Enter the street and number.").max(100),
    line2: z.string().trim().max(100),
    postcode: z
      .string()
      .trim()
      .min(1, "Enter a postcode.")
      .transform((v) => normalisePostcode(country, v))
      .pipe(z.string().regex(postcode, `That isn't a valid postcode for ${name}.`)),
    city: z.string().trim().min(1, "Enter a town or city.").max(60),
    country: z.enum(COUNTRY_CODES),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\+?[\d\s().-]{7,20}$/.test(v), "Enter a phone number with digits only, or leave it empty."),
    method: z.enum(["standard", "express"]),
  });
}

export type DeliveryInput = z.input<ReturnType<typeof deliverySchema>>;
export type Delivery = z.output<ReturnType<typeof deliverySchema>>;

export const EMPTY_CONTACT: Contact = { email: "", optIn: false };

export const EMPTY_DELIVERY: DeliveryInput = {
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  postcode: "",
  city: "",
  country: "PT",
  phone: "",
  method: "standard",
};
