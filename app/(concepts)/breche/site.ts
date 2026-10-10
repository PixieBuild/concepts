import { SITE_URL as ORIGIN } from "@/lib/site";

export const BASE_PATH = "/breche";

// Shared resolution so canonicals and OG URLs survive a deploy without
// NEXT_PUBLIC_SITE_URL set; a bare localhost fallback would ship localhost links.
export const SITE_URL = ORIGIN;

export function url(path = ""): string {
  return `${SITE_URL}${BASE_PATH}${path}`;
}

export function path(p = ""): string {
  return `${BASE_PATH}${p}` || "/";
}
