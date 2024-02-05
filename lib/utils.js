/**
 * Picks a specific property from an object and returns its value.
 *
 * @template {object}  O
 * @template {keyof O} K
 * @param {O} obj The input object from which to pick a property.
 * @param {K} key The key of the property to be picked.
 * @returns The value of the specified property.
 */
export function pick(obj, key) {
  return lazyPick(obj)(key);
}

/**
 * Creates a partial function for picking properties from an object.
 *
 * @template {object}  O
 * @template {keyof O} K
 * @param {O} obj The input object for which to create a partial picking function.
 * @returns A partial function that can be used to pick specific properties from the
 *          input object.
 */
export function lazyPick(obj) {
  /**
   * @param {K} key
   * @returns {O[K]}
   */
  function pick(key) {
    return obj[key];
  }

  return pick;
}

/**
 * Coerces a value to a specified type.
 *
 * @template T The type to coerce the value to.
 * @param {unknown} value The value to coerce.
 * @returns {T} The coerced value.
 */
export function coerce(value) {
  return /** @type {T} */ (value);
}
