import { DeepMergeOptions, deepMerge, z } from "@dependencies";

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
 * Performs a deep merge of two objects without type safety checks.
 * **Use it at your own risk.**
 *
 * @param record  - The first object.
 * @param other   - The second object. Its properties will replace the ones from the
 *                first one.
 * @param options - Options to configure the merge behavior.
 * @returns The merged object, cast to the generic type T.
 */
export function unsafeDeepMerge<T>(
  record: SafeAny,
  other: SafeAny,
  options?: DeepMergeOptions,
) {
  return deepMerge(record, other, options) as unknown as T;
}

/**
 * Gets the Zod schema shape for the given schema, if available.
 *
 * @param schema - The Zod schema to get the shape for.
 * @returns The schema's shape if it is a `z.ZodObject` or `z.ZodEffects`
 *          instance, otherwise `null`.
 */
export function getZodSchemaShape(schema: z.ZodTypeAny): z.ZodRawShape | null {
  if (schema instanceof z.ZodObject) {
    return schema.shape;
  }

  if (schema instanceof z.ZodEffects) {
    return getZodSchemaShape(schema._def.schema);
  }

  return null;
}
