import { createHash } from "node:crypto";

export const GATE_COOKIE = "pb_gallery";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30;

export function gateToken(): string | null {
  const password = process.env.GALLERY_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`pixiebuild:${password}`).digest("hex");
}
