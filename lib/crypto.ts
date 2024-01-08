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

/**
 * Generates a universally unique identifier (UUID) using the browser's crypto API.
 *
 * This function does not take any parameters. It utilizes the `crypto.randomUUID`
 * method available in the global scope (`globalThis`) to produce a version 4 UUID.
 *
 * @example
 *
 * <caption>Generating an UUID</caption>
 * ```typescript
 * const uniqueId = uuid();
 * console.log(uniqueId); // Outputs a string like '123e4567-e89b-12d3-a456-426614174000'
 * ```
 *
 * @returns A string representing a version 4 UUID.
 */
export function uuid() {
  return globalThis.crypto.randomUUID();
}
