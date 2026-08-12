export const BASE_PATH = "/casa-lume";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function url(path = ""): string {
  return `${SITE_URL}${BASE_PATH}${path}`;
}

export function path(p = ""): string {
  return `${BASE_PATH}${p}` || "/";
}
