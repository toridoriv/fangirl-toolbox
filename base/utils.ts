import { DeepMergeOptions, deepMerge as denoDeepMerge } from "@dependencies";

/**
 * Picks a specific property from an object and returns its value.
 *
 * @example
 *
 * ```typescript
 * const user = { name: "John", age: 30, city: "New York" };
 * const userName = pick(user, "name"); // Returns "John"
 * ```
 *
 * @param obj - The input object from which to pick a property.
 * @param key - The key of the property to be picked.
 * @returns The value of the specified property.
 */
export function pick<O, K extends keyof O>(obj: O, key: K) {
  return lazyPick(obj)(key);
}

/**
 * Creates a partial function for picking properties from an object.
 *
 * @example
 *
 * ```typescript
 * const user = { name: "John", age: 30, city: "New York" };
 * const pickUserProperty = lazyPick(user);
 * const userAge = pickUserProperty("age"); // Returns 30
 * ```
 *
 * @param obj - The input object for which to create a partial picking function.
 * @returns A partial function that can be used to pick specific properties from the
 *          input object.
 */
export function lazyPick<O>(obj: O) {
  return function pick<K extends keyof O>(key: K) {
    return obj[key];
  };
}

/**
 * Deep merges two objects together to create a new object.
 *
 * @param record  - The object to merge into.
 * @param other   - The other object to merge.
 * @param options - Define here alternative merge strategies.
 * @returns A new object with the merged contents.
 */
export function deepMerge<T, U>(
  record: T,
  other: U,
  options?: DeepMergeOptions,
): Merge<T, U> {
  // @ts-ignore: ¯\_(ツ)_/¯
  return denoDeepMerge(record, other, options);
}
