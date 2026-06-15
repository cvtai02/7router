import { createHash, timingSafeEqual } from "node:crypto";

export function hashAccessTokenValue(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Constant-time secret comparison. Hashing both sides first yields fixed-length
 * (32-byte) buffers so timingSafeEqual never throws on length mismatch and the
 * comparison leaks no information about the secret's length or content.
 */
export function safeEqualSecret(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a, "utf8").digest();
  const bh = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ah, bh);
}
