import { createHash } from "node:crypto";

/**
 * Calculates the MD5 hash of the given string value.
 *
 * @param value - The string to hash.
 * @returns The MD5 hash of the input string in hexadecimal format.
 */
export function md5(value: string) {
  return createHash("md5").update(value, "utf-8").digest("hex");
}
