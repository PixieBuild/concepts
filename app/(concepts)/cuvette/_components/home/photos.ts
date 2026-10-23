import manifest from "@/public/concepts/cuvette/photos/photos.json";

import { IMAGE_BASE } from "../../_lib/content";

// A build-time list, not a disk check: a deployed server function can't read public/.
const PHOTOS = new Set<string>(manifest);

/** The owner's photograph for a slot once it is listed in `public/concepts/cuvette/photos/photos.json`, else null for the stand-in. */
export function photoSrc(file: string): string | null {
  return PHOTOS.has(file) ? `${IMAGE_BASE}/photos/${file}` : null;
}
