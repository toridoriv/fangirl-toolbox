import { Logger } from "tslog";
import { z } from "zod";

import { Common } from "./typings/index.js";

export const LOG_LEVEL = Object.freeze({
  silly: 0,
  SILLY: 0,
  trace: 1,
  TRACE: 1,
  debug: 2,
  DEBUG: 2,
  info: 3,
  INFO: 3,
  warn: 4,
  WARN: 4,
  error: 5,
  ERROR: 5,
  fatal: 6,
  FATAL: 6,
});

const LOG_LEVEL_NAMES = /** @type {Common.UnionToTuple<keyof typeof LOG_LEVEL>} */ (
  Object.keys(LOG_LEVEL)
);

const LOG_LEVEL_NAME = z
  .enum(LOG_LEVEL_NAMES)
  .default("INFO")
  .catch("INFO")
  .parse(process.env.LOG_LEVEL);

export const logger = new Logger({
  type: "pretty",
  minLevel: LOG_LEVEL[LOG_LEVEL_NAME],
  overwrite: {
    mask(args) {
      return args;
    },
  },
});

/**
 * Picks a specific property from an object and returns its value.
 *
 * @template {object} O
 * @template {keyof O} K
 * @param {O} obj
 * The input object from which to pick a property.
 * @param {K} key
 * The key of the property to be picked.
 * @returns
 * The value of the specified property.
 */
export function pick(obj, key) {
  return lazyPick(obj)(key);
}

/**
 * Creates a partial function for picking properties from an object.
 *
 * @template {object} O
 * @template {keyof O} K
 * @param {O} obj
 * The input object for which to create a partial picking function.
 * @returns
 * A partial function that can be used to pick specific properties from the input object.
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
 * @template T
 * The type to coerce the value to.
 * @param {unknown} value
 * The value to coerce.
 * @returns {T}
 * The coerced value.
 */
export function coerce(value) {
  return /** @type {T} */ (value);
}
